export type BrowserStorageKind = 'localStorage' | 'sessionStorage';

const storage = (kind: BrowserStorageKind) => {
  try { return window[kind]; }
  catch { return undefined; }
};

export const storageGet = (kind: BrowserStorageKind, key: string) => {
  try { return storage(kind)?.getItem(key) ?? null; }
  catch { return null; }
};

export const storageSet = (kind: BrowserStorageKind, key: string, value: string) => {
  try {
    const target = storage(kind);
    if (!target) return false;
    target.setItem(key, value);
    return true;
  }
  catch { return false; }
};

export const storageRemove = (kind: BrowserStorageKind, key: string) => {
  try {
    const target = storage(kind);
    if (!target) return false;
    target.removeItem(key);
    return true;
  }
  catch { return false; }
};
