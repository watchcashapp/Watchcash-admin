import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  sub: string;
  email: string;
  profile: {
    id: string;
    name: string;
    email: string;
    userType: string;
    ownerId?: string; // For agency owners
  };
  iat: number;
  exp: number;
}

export const getTokenFromCookie = (name: string): string | null => {
  if (typeof window === 'undefined') return null;
  
  const value = document.cookie.replace(
    new RegExp(`(?:(?:^|.*;\\s*)${name}\\s*=\\s*([^;]*).*$)|^.*$`),
    '$1'
  );
  
  return value || null;
};

export const decodeAccessToken = (token: string) => {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    console.log('Decoded token:', decoded);
    
    // Check if the token structure matches our expected format
    if (decoded.profile) {
      // For agency owners, use ownerId as the user ID
      const userId = decoded.profile.ownerId || decoded.profile.id;
      
      return {
        id: userId,
        name: decoded.profile.name,
        email: decoded.profile.email,
        userType: decoded.profile.userType,
      };
    }
    
    // Fallback: check if data is directly on the token
    if (decoded.sub && decoded.email) {
      return {
        id: decoded.sub,
        name: (decoded as any).name || decoded.email,
        email: decoded.email,
        userType: (decoded as any).userType || 'ADMIN',
      };
    }
    
    console.error('Token structure does not match expected format:', decoded);
    return null;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

export const getUserFromToken = () => {
  const accessToken = getTokenFromCookie('accessToken');
  if (!accessToken) return null;
  
  return decodeAccessToken(accessToken);
};
