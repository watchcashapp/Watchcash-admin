import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  sub: string;
  email: string;
  profile: {
    id: string;
    name: string;
    email: string;
    userType: string;
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
    return {
      id: decoded.profile.id,
      name: decoded.profile.name,
      email: decoded.profile.email,
      userType: decoded.profile.userType,
    };
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
