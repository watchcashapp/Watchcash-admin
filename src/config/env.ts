// Environment configuration
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://rx12p3w1-8080.inc1.devtunnels.ms/api',
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'WatchCash Admin',
};

// Validate required environment variables
if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
  console.warn('NEXT_PUBLIC_API_BASE_URL is not set, using default:', config.apiUrl);
}
