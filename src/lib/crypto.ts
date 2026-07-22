// Client-side cryptography for the app lock and the encrypted vault.
// Uses only the Web Crypto API — no third-party crypto libraries.
//
//   App lock  : PBKDF2 -> salted hash stored in IndexedDB (never the passcode).
//   Vault     : PBKDF2 -> AES-GCM key that encrypts private entry text at rest.
//
// Secrets (the derived vault key) live in memory only while unlocked.

const enc = new TextEncoder();
const dec = new TextDecoder();

// TS 5.7 types typed-arrays as generic over ArrayBufferLike, while Web Crypto
// wants an ArrayBuffer-backed BufferSource. This bridges the two at the call
// site (runtime behaviour is unchanged — the buffers are real ArrayBuffers).
const bs = (b: Uint8Array): BufferSource => b as unknown as BufferSource;

const APP_LOCK_ITER = 210_000;
const VAULT_ITER = 250_000;
const VAULT_VERIFIER_PLAINTEXT = 'listify-vault-ok';

function toB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromB64(s: string): Uint8Array {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

function randomBytes(n: number): Uint8Array {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return a;
}

async function importBaseKey(password: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', bs(enc.encode(password)), 'PBKDF2', false, [
    'deriveBits',
    'deriveKey',
  ]);
}

async function deriveHash(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const base = await importBaseKey(password);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: bs(salt), iterations, hash: 'SHA-256' },
    base,
    256,
  );
  return toB64(bits);
}

async function deriveAesKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const base = await importBaseKey(password);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: bs(salt), iterations, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Constant-time-ish string compare for derived hashes. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ---- App lock ------------------------------------------------------------

export interface AppLockRecord {
  salt: string;
  iterations: number;
  hash: string;
}

export async function makeAppLock(passcode: string): Promise<AppLockRecord> {
  const salt = randomBytes(16);
  const hash = await deriveHash(passcode, salt, APP_LOCK_ITER);
  return { salt: toB64(salt), iterations: APP_LOCK_ITER, hash };
}

export async function verifyAppLock(passcode: string, rec: AppLockRecord): Promise<boolean> {
  const hash = await deriveHash(passcode, fromB64(rec.salt), rec.iterations);
  return safeEqual(hash, rec.hash);
}

// ---- Vault ---------------------------------------------------------------

export interface VaultRecord {
  salt: string;
  iterations: number;
  verifierIv: string;
  verifier: string; // ciphertext of VAULT_VERIFIER_PLAINTEXT
}

/** Create vault config from a password and return it alongside the live key. */
export async function makeVault(password: string): Promise<{ record: VaultRecord; key: CryptoKey }> {
  const salt = randomBytes(16);
  const key = await deriveAesKey(password, salt, VAULT_ITER);
  const iv = randomBytes(12);
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: bs(iv) },
    key,
    bs(enc.encode(VAULT_VERIFIER_PLAINTEXT)),
  );
  return {
    record: { salt: toB64(salt), iterations: VAULT_ITER, verifierIv: toB64(iv), verifier: toB64(ct) },
    key,
  };
}

/** Derive the key from a password and confirm it against the verifier. */
export async function unlockVault(password: string, rec: VaultRecord): Promise<CryptoKey | null> {
  const key = await deriveAesKey(password, fromB64(rec.salt), rec.iterations);
  try {
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: bs(fromB64(rec.verifierIv)) },
      key,
      bs(fromB64(rec.verifier)),
    );
    return dec.decode(pt) === VAULT_VERIFIER_PLAINTEXT ? key : null;
  } catch {
    return null;
  }
}

/** Encrypt text to a self-describing "iv.ciphertext" base64 packet. */
export async function encryptText(key: CryptoKey, text: string): Promise<string> {
  const iv = randomBytes(12);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: bs(iv) }, key, bs(enc.encode(text)));
  return `${toB64(iv)}.${toB64(ct)}`;
}

export async function decryptText(key: CryptoKey, packed: string): Promise<string> {
  const [ivB64, ctB64] = packed.split('.');
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bs(fromB64(ivB64)) },
    key,
    bs(fromB64(ctB64)),
  );
  return dec.decode(pt);
}

// ---- Passphrase-encrypted backup envelope --------------------------------

export interface EncryptedEnvelope {
  app: 'listify';
  encrypted: true;
  salt: string;
  iterations: number;
  iv: string;
  data: string;
}

export async function encryptEnvelope(password: string, plaintext: string): Promise<EncryptedEnvelope> {
  const salt = randomBytes(16);
  const key = await deriveAesKey(password, salt, VAULT_ITER);
  const iv = randomBytes(12);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: bs(iv) }, key, bs(enc.encode(plaintext)));
  return {
    app: 'listify',
    encrypted: true,
    salt: toB64(salt),
    iterations: VAULT_ITER,
    iv: toB64(iv),
    data: toB64(ct),
  };
}

export async function decryptEnvelope(password: string, env: EncryptedEnvelope): Promise<string> {
  const key = await deriveAesKey(password, fromB64(env.salt), env.iterations);
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bs(fromB64(env.iv)) },
    key,
    bs(fromB64(env.data)),
  );
  return dec.decode(pt);
}
