import { configureStore } from '@reduxjs/toolkit';
import { authApi } from './api/authApi';
import { appRulesApi } from './api/appRulesApi';
import { usersApi } from './api/usersApi';
import { globalRulesApi } from './api/globalRulesApi';
import { rbacApi } from './api/rbacApi';
import { staffApi } from './api/staffApi';
import { sessionsApi } from './api/sessionsApi';
import { rolesApi } from './api/rolesApi';
import { rewardRedemptionsApi } from './api/rewardRedemptionsApi';
import { settingsApi } from './api/settingsApi';
import authSlice from './slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    [authApi.reducerPath]: authApi.reducer,
    [appRulesApi.reducerPath]: appRulesApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [globalRulesApi.reducerPath]: globalRulesApi.reducer,
    [rbacApi.reducerPath]: rbacApi.reducer,
    [staffApi.reducerPath]: staffApi.reducer,
    [sessionsApi.reducerPath]: sessionsApi.reducer,
    [rolesApi.reducerPath]: rolesApi.reducer,
    [rewardRedemptionsApi.reducerPath]: rewardRedemptionsApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(appRulesApi.middleware)
      .concat(usersApi.middleware)
      .concat(globalRulesApi.middleware)
      .concat(rbacApi.middleware)
      .concat(staffApi.middleware)
      .concat(sessionsApi.middleware)
      .concat(rolesApi.middleware)
      .concat(rewardRedemptionsApi.middleware)
      .concat(settingsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
