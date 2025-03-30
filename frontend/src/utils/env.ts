/**
 * Get environment variable with type safety and default value
 */
export const getEnvVar = (key: keyof ImportMetaEnv, defaultValue: string): string => {
  return import.meta.env[key] || defaultValue;
};

/**
 * Get boolean environment variable
 */
export const getEnvBoolean = (key: keyof ImportMetaEnv, defaultValue: boolean): boolean => {
  const value = getEnvVar(key, String(defaultValue));
  return value.toLowerCase() === 'true';
};

/**
 * Get number environment variable
 */
export const getEnvNumber = (key: keyof ImportMetaEnv, defaultValue: number): number => {
  const value = getEnvVar(key, String(defaultValue));
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

// API Configuration
export const API_URL = getEnvVar('VITE_API_URL', 'http://localhost:8000/api');

// Feature Flags
export const ENABLE_ANIMATIONS = getEnvBoolean('VITE_ENABLE_ANIMATIONS', true);
export const ENABLE_COPY_BUTTON = getEnvBoolean('VITE_ENABLE_COPY_BUTTON', true);

// Secret Settings
export const DEFAULT_EXPIRY_MINUTES = getEnvNumber('VITE_DEFAULT_EXPIRY_MINUTES', 10);
export const MAX_EXPIRY_MINUTES = getEnvNumber('VITE_MAX_EXPIRY_MINUTES', 10080);

// UI Configuration
export const TOAST_DURATION = getEnvNumber('VITE_TOAST_DURATION', 5000);
export const ANIMATION_DURATION = getEnvNumber('VITE_ANIMATION_DURATION', 3000);

// Analytics
export const ENABLE_ANALYTICS = getEnvBoolean('VITE_ENABLE_ANALYTICS', false); 