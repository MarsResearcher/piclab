/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PEXELS_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
