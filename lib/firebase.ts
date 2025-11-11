// utils/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
} from "firebase/auth";
import {
  getDatabase,
  connectDatabaseEmulator,
  ref,
  get,
  set,
  push,
  update,
  remove,
  onValue,
  off,
  runTransaction,
  serverTimestamp,
  type DataSnapshot,
  type DatabaseReference,
} from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!,
};

// --- initialize Firebase ---
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const database = getDatabase(app);


if (process.env.NEXT_PUBLIC_USE_EMULATORS === "true") {
  try {
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
    connectDatabaseEmulator(database, "127.0.0.1", 9000);
  } catch (e) {
    console.warn("Emulator connection skipped:", e);
  }
}


export async function getData<T = any>(path: string): Promise<T | null> {
  const snapshot = await get(ref(database, path));
  return snapshot.exists() ? (snapshot.val() as T) : null;
}

export async function setData(path: string, value: any) {
  await set(ref(database, path), value);
}

export async function pushData<T = any>(path: string, value: T) {
  const newRef = push(ref(database, path));
  await set(newRef, value);
  return newRef.key as string;
}

export async function updateData(path: string, value: Partial<any>) {
  await update(ref(database, path), value);
}

export async function deleteData(path: string) {
  await remove(ref(database, path));
}

export function subscribeData<T = any>(
  path: string,
  callback: (value: T | null, snapshot: DataSnapshot) => void,
  onlyIfExists = false
) {
  const r = ref(database, path);
  const handler = (snap: DataSnapshot) => {
    if (onlyIfExists && !snap.exists()) {
      callback(null, snap);
      return;
    }
    callback((snap.exists() ? (snap.val() as T) : null), snap);
  };
  onValue(r, handler);
  return () => off(r, "value", handler as any);
}

export function generateKey(path: string): string {
  return push(ref(database, path)).key as string;
}

export function stamp(created = false) {
  return created
    ? { createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
    : { updatedAt: serverTimestamp() };
}

export async function tx<T = any>(
  path: string,
  updater: (current: T | null) => T | null
) {
  const r: DatabaseReference = ref(database, path);
  const res = await runTransaction(r, (curr) => updater((curr ?? null) as T | null));
  return res.snapshot.val() as T | null;
}

// --- Exports ---
export { app, auth, database };
