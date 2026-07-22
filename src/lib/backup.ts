import { storage } from '../storage/dexieAdapter';
import type { ExportBundle } from '../storage/types';
import { decryptEnvelope, encryptEnvelope, type EncryptedEnvelope } from './crypto';

// The backup safety net (spec §5). There is no server, so an export file is the
// only durable copy. Optionally password-encrypt the whole file.

function triggerDownload(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function exportBackup(password?: string): Promise<void> {
  const bundle = await storage.export();
  const json = JSON.stringify(bundle, null, 2);
  if (password) {
    const env = await encryptEnvelope(password, json);
    triggerDownload('listify-backup.enc.json', new Blob([JSON.stringify(env)], { type: 'application/json' }));
  } else {
    triggerDownload('listify-backup.json', new Blob([json], { type: 'application/json' }));
  }
}

/** Import a backup file. Returns how many days were merged in. */
export async function importBackup(file: File, password?: string): Promise<number> {
  const text = await file.text();
  let obj: unknown = JSON.parse(text);

  if ((obj as EncryptedEnvelope)?.encrypted) {
    if (!password) throw new Error('This backup is encrypted — enter its password.');
    const json = await decryptEnvelope(password, obj as EncryptedEnvelope);
    obj = JSON.parse(json);
  }

  const bundle = obj as ExportBundle;
  await storage.import(bundle);
  return bundle.notes?.length ?? 0;
}

/** Is a file an encrypted backup envelope? (peek without importing) */
export async function isEncryptedBackup(file: File): Promise<boolean> {
  try {
    const obj = JSON.parse(await file.text());
    return obj?.encrypted === true;
  } catch {
    return false;
  }
}
