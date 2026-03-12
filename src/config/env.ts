// Environment configuration
export const config = {
  // Use Next.js API proxy to avoid CORS issues in development
  apiUrl: process.env.NEXT_PUBLIC_USE_PROXY === 'true'
    ? '/api/proxy'
    : (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://rx12p3w1-8080.inc1.devtunnels.ms/api'),
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'WatchCash Admin',
};

// Validate required environment variables
if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
  // No log needed

}
