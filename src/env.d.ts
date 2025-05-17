/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GITHUB_API_KEY: string
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_ENV: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 