/// <reference types="vite/client" />

interface ImportMetaEnv {
  // API Configuration
  readonly VITE_API_URL: string

  // Feature Flags
  readonly VITE_ENABLE_ANIMATIONS: string
  readonly VITE_ENABLE_COPY_BUTTON: string

  // Secret Settings
  readonly VITE_DEFAULT_EXPIRY_MINUTES: string
  readonly VITE_MAX_EXPIRY_MINUTES: string

  // UI Configuration
  readonly VITE_TOAST_DURATION: string
  readonly VITE_ANIMATION_DURATION: string

  // Analytics
  readonly VITE_ENABLE_ANALYTICS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 