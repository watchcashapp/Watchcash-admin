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
import { rewardCatalogsApi } from './api/rewardCatalogsApi';
import { settingsApi } from './api/settingsApi';
import { dashboardApi } from './api/dashboardApi';
import { auditLogsApi } from './api/auditLogsApi';
import { notificationsApi } from './api/notificationsApi';
import { adsApi } from './api/adsApi';
import { planSettingsApi } from './api/planSettingsApi';
import { legalApi } from './api/legalApi';
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
    [rewardCatalogsApi.reducerPath]: rewardCatalogsApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [auditLogsApi.reducerPath]: auditLogsApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    [adsApi.reducerPath]: adsApi.reducer,
    [planSettingsApi.reducerPath]: planSettingsApi.reducer,
    [legalApi.reducerPath]: legalApi.reducer,
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
      .concat(rewardCatalogsApi.middleware)
      .concat(settingsApi.middleware)
      .concat(dashboardApi.middleware)
      .concat(auditLogsApi.middleware)
      .concat(notificationsApi.middleware)
      .concat(adsApi.middleware)
      .concat(planSettingsApi.middleware)
      .concat(legalApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
