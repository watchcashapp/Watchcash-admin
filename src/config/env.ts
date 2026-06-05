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
    : (envVars.NEXT_PUBLIC_API_BASE_URL || 'https://rx12p3w1-8080.inc1.devtunnels.ms/api'),
  socketUrl: envVars.NEXT_PUBLIC_SOCKET_URL || 'https://rx12p3w1-8080.inc1.devtunnels.ms',
  appName: envVars.NEXT_PUBLIC_APP_NAME || 'WatchCash Admin',
};

export function logEnvConfig(runtime: 'server' | 'client' = typeof window === 'undefined' ? 'server' : 'client') {
  console.info(`[WatchCash env:${runtime}]`, { envVars, config });
}