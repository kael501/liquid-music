import { Fragment, createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { purgeNamespace, rawStorageGet, rawStorageRemove, rawStorageSet, setStorageNamespace } from '../lib/utils';

/* Accounts live only in this browser (localStorage). There is no server: a login keeps each person's
   library separate on this device, it does not sync between devices. */

const ACCOUNTS = 'liquid-music:accounts';
const SESSION = 'liquid-music:session';

interface StoredAccount {
  id: string;
  name: string;
  email: string;
  salt: string;
  hash: string;
  createdAt: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  guest: boolean;
}

type Result = { ok: true } | { ok: false; error: string };

interface AuthContextValue {
  user: AuthUser | null;
  register: (name: string, email: string, password: string) => Promise<Result>;
  login: (email: string, password: string) => Promise<Result>;
  continueAsGuest: () => void;
  logout: () => void;
  deleteAccount: (password: string) => Promise<Result>;
}

const GUEST: AuthUser = { id: 'guest', name: 'Tamu', email: '', guest: true };

function toHex(buf: ArrayBuffer | Uint8Array): string {
  return Array.from(new Uint8Array(buf as ArrayBuffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  if (window.crypto?.getRandomValues) window.crypto.getRandomValues(arr);
  else for (let i = 0; i < bytes; i++) arr[i] = Math.floor(Math.random() * 256);
  return toHex(arr);
}

/** Fallback for pages without crypto.subtle (plain http on a LAN address): a simple salted hash. */
function weakHash(input: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let round = 0; round < 2000; round++) {
    for (let i = 0; i < input.length; i++) {
      const ch = input.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  }
  return `w${(h2 >>> 0).toString(16)}${(h1 >>> 0).toString(16)}`;
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const subtle = window.crypto?.subtle;
  if (!subtle) return weakHash(`${salt}:${password}`);
  const key = await subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await subtle.deriveBits(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 150_000, hash: 'SHA-256' },
    key,
    256,
  );
  return toHex(bits);
}

const readAccounts = (): StoredAccount[] => rawStorageGet<StoredAccount[]>(ACCOUNTS, []);
const writeAccounts = (list: StoredAccount[]) => rawStorageSet(ACCOUNTS, list);
const toUser = (a: StoredAccount): AuthUser => ({ id: a.id, name: a.name, email: a.email, guest: false });
const normEmail = (e: string) => e.trim().toLowerCase();

function initialUser(): AuthUser | null {
  const session = rawStorageGet<{ id?: string } | null>(SESSION, null);
  if (!session?.id) return null;
  if (session.id === 'guest') return GUEST;
  const acc = readAccounts().find((a) => a.id === session.id);
  return acc ? toUser(acc) : null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);

  const start = useCallback((next: AuthUser) => {
    rawStorageSet(SESSION, { id: next.id });
    setUser(next);
  }, []);

  const register = useCallback<AuthContextValue['register']>(
    async (name, email, password) => {
      const cleanName = name.trim();
      const mail = normEmail(email);
      if (cleanName.length < 2) return { ok: false, error: 'Nama minimal 2 karakter.' };
      if (!/^\S+@\S+\.\S+$/.test(mail)) return { ok: false, error: 'Format email tidak valid.' };
      if (password.length < 6) return { ok: false, error: 'Kata sandi minimal 6 karakter.' };
      const accounts = readAccounts();
      if (accounts.some((a) => a.email === mail)) return { ok: false, error: 'Email ini sudah terdaftar. Silakan masuk.' };
      const salt = randomHex(16);
      const account: StoredAccount = {
        id: randomHex(8),
        name: cleanName,
        email: mail,
        salt,
        hash: await hashPassword(password, salt),
        createdAt: Date.now(),
      };
      writeAccounts([...accounts, account]);
      start(toUser(account));
      return { ok: true };
    },
    [start],
  );

  const login = useCallback<AuthContextValue['login']>(
    async (email, password) => {
      const account = readAccounts().find((a) => a.email === normEmail(email));
      if (!account) return { ok: false, error: 'Email atau kata sandi salah.' };
      const hash = await hashPassword(password, account.salt);
      if (hash !== account.hash) return { ok: false, error: 'Email atau kata sandi salah.' };
      start(toUser(account));
      return { ok: true };
    },
    [start],
  );

  const continueAsGuest = useCallback(() => start(GUEST), [start]);

  const logout = useCallback(() => {
    rawStorageRemove(SESSION);
    setUser(null);
  }, []);

  const deleteAccount = useCallback<AuthContextValue['deleteAccount']>(
    async (password) => {
      if (!user || user.guest) return { ok: false, error: 'Akun tamu tidak bisa dihapus.' };
      const account = readAccounts().find((a) => a.id === user.id);
      if (!account) return { ok: false, error: 'Akun tidak ditemukan.' };
      if ((await hashPassword(password, account.salt)) !== account.hash) return { ok: false, error: 'Kata sandi salah.' };
      writeAccounts(readAccounts().filter((a) => a.id !== user.id));
      purgeNamespace(user.id);
      rawStorageRemove(SESSION);
      setUser(null);
      return { ok: true };
    },
    [user],
  );

  const value = useMemo(
    () => ({ user, register, login, continueAsGuest, logout, deleteAccount }),
    [user, register, login, continueAsGuest, logout, deleteAccount],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** Shows the login screen until someone signs in, then mounts the app inside that person's storage namespace. */
export function AuthGate({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <>{fallback}</>;
  /* set during render so every provider below reads its data from the right namespace on first mount */
  setStorageNamespace(user.guest ? '' : user.id);
  return <Fragment key={user.id}>{children}</Fragment>;
}
