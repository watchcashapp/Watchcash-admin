import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Permission {
  id: string;
  code: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  userType: string;
  permissions?: Permission[];
  roles?: Role[];
}

export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isInitialized: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  user: null,
  isInitialized: false,
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ accessToken: string; refreshToken: string; user: User }>) => {
      state.isAuthenticated = true;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.isInitialized = true;
      state.isLoading = false;
    },
    clearAuth: (state) => {
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.isInitialized = true;
      state.isLoading = false;
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    updatePermissionsAndRoles: (state, action: PayloadAction<{ permissions: Permission[]; roles: Role[] }>) => {
      if (state.user) {
        state.user.permissions = action.payload.permissions;
        state.user.roles = action.payload.roles;
      }
    },
  },
});

export const { setUser, clearAuth, updatePermissionsAndRoles, setAuthLoading, setInitialized } = authSlice.actions;
export default authSlice.reducer;
