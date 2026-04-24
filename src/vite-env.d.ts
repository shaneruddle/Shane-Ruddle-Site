/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REMOTE_FIREBASE_CONFIG: string;
  readonly VITE_REMOTE_FIREBASE_DB_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
