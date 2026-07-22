import { create } from 'zustand';
import { storage } from '../storage/dexieAdapter';
import {
  decryptText,
  encryptText,
  makeAppLock,
  makeVault,
  unlockVault,
  verifyAppLock,
  type AppLockRecord,
  type VaultRecord,
} from '../lib/crypto';

const APP_LOCK_KEY = 'security.appLock';
const VAULT_KEY = 'security.vault';

interface SecurityState {
  ready: boolean;
  hasAppLock: boolean;
  appLocked: boolean;
  hasVault: boolean;
  vaultKey: CryptoKey | null; // in memory only while unlocked

  init(): Promise<void>;

  // App lock
  setAppPasscode(passcode: string): Promise<void>;
  removeAppLock(passcode: string): Promise<boolean>;
  unlockApp(passcode: string): Promise<boolean>;
  lockApp(): void;

  // Vault
  setupVault(password: string): Promise<void>;
  openVault(password: string): Promise<boolean>;
  lockVault(): void;

  encrypt(text: string): Promise<string>;
  decrypt(packed: string): Promise<string>;
}

export const useSecurity = create<SecurityState>((set, get) => ({
  ready: false,
  hasAppLock: false,
  appLocked: false,
  hasVault: false,
  vaultKey: null,

  async init() {
    const appLock = await storage.getMeta<AppLockRecord>(APP_LOCK_KEY);
    const vault = await storage.getMeta<VaultRecord>(VAULT_KEY);
    set({
      ready: true,
      hasAppLock: !!appLock,
      appLocked: !!appLock, // start locked when a passcode exists
      hasVault: !!vault,
    });
  },

  async setAppPasscode(passcode) {
    const rec = await makeAppLock(passcode);
    await storage.setMeta(APP_LOCK_KEY, rec);
    set({ hasAppLock: true, appLocked: false });
  },

  async removeAppLock(passcode) {
    const rec = await storage.getMeta<AppLockRecord>(APP_LOCK_KEY);
    if (!rec || !(await verifyAppLock(passcode, rec))) return false;
    await storage.setMeta(APP_LOCK_KEY, null);
    set({ hasAppLock: false, appLocked: false });
    return true;
  },

  async unlockApp(passcode) {
    const rec = await storage.getMeta<AppLockRecord>(APP_LOCK_KEY);
    if (!rec || !(await verifyAppLock(passcode, rec))) return false;
    set({ appLocked: false });
    return true;
  },

  lockApp() {
    if (get().hasAppLock) set({ appLocked: true, vaultKey: null });
  },

  async setupVault(password) {
    const { record, key } = await makeVault(password);
    await storage.setMeta(VAULT_KEY, record);
    set({ hasVault: true, vaultKey: key });
  },

  async openVault(password) {
    const rec = await storage.getMeta<VaultRecord>(VAULT_KEY);
    if (!rec) return false;
    const key = await unlockVault(password, rec);
    if (!key) return false;
    set({ vaultKey: key });
    return true;
  },

  lockVault() {
    set({ vaultKey: null });
  },

  async encrypt(text) {
    const key = get().vaultKey;
    if (!key) throw new Error('Vault is locked');
    return encryptText(key, text);
  },

  async decrypt(packed) {
    const key = get().vaultKey;
    if (!key) throw new Error('Vault is locked');
    return decryptText(key, packed);
  },
}));
