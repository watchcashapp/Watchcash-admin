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

  const value = `; ${document.cookie}`;
  
  // Try the provided name first
  let parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  
  // Try snake_case version (e.g., access_token if name is accessToken)
  const snakeName = name.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  if (snakeName !== name) {
    parts = value.split(`; ${snakeName}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  }
  
  return null;
};

export const decodeAccessToken = (token: string) => {
  try {
    const decoded = jwtDecode<DecodedToken>(token);


    // Check if the token structure matches our expected format
    if (decoded.profile) {
      // For agency owners, use ownerId as the user ID
      const userId = decoded.profile.ownerId || decoded.profile.id;

      return {
        id: userId,
        name: decoded.profile.name,
        email: decoded.profile.email,
        userType: decoded.profile.userType,
        permissions: (decoded as any).profile.permissions,
        roles: (decoded as any).profile.roles,
      } as any;
    }

    // Fallback: check if data is directly on the token
    if (decoded.sub && decoded.email) {
      // Try to get name from token, but DON'T fallback to email
      const name = (decoded as any).name || (decoded as any).username || 'User';

      return {
        id: decoded.sub,
        name: name,
        email: decoded.email,
        userType: (decoded as any).userType || 'ADMIN',
        permissions: (decoded as any).permissions,
        roles: (decoded as any).roles,
      } as any;
    }


    return null;
  } catch (error) {

    return null;
  }
};

export const getUserFromToken = () => {
  const accessToken = getTokenFromCookie('accessToken');
  if (!accessToken) return null;

  return decodeAccessToken(accessToken);
};
