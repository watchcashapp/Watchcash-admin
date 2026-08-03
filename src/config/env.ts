import { devInfo } from '@/utils/devLog';

// Environment configuration
export const envVars = {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_USE_PROXY: process.env.NEXT_PUBLIC_USE_PROXY,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
} as const;

export const config = {
  // Use Next.js API proxy to avoid CORS issues in development
  apiUrl: envVars.NEXT_PUBLIC_USE_PROXY === 'true'
    ? '/api/proxy'
    : (envVars.NEXT_PUBLIC_API_BASE_URL || 'https://localhost:8080/api'),
  socketUrl: envVars.NEXT_PUBLIC_SOCKET_URL || '',
  appName: envVars.NEXT_PUBLIC_APP_NAME || 'WatchCash Admin',
};

export function logEnvConfig(runtime: 'server' | 'client' = typeof window === 'undefined' ? 'server' : 'client') {
  devInfo(`[WatchCash env:${runtime}]`, { envVars, config });
}