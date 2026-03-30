import { io, Socket } from 'socket.io-client';
import { config } from '@/config/env';

export type NotificationsSocketStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'offline'
  | 'unauthorized'
  | 'error';

type NotificationListener = (payload: unknown) => void;
type StatusListener = (status: NotificationsSocketStatus, message?: string) => void;

const DEVICE_ID_STORAGE_KEY = 'watchcash.notifications.deviceId';

let socket: Socket | null = null;
let currentToken: string | null = null;
let currentDeviceId: string | null = null;
let currentStatus: NotificationsSocketStatus = 'idle';
let currentStatusMessage: string | undefined;

const notificationListeners = new Set<NotificationListener>();
const permissionListeners = new Set<NotificationListener>();
const banExpiredListeners = new Set<NotificationListener>();
const rankingUpdateListeners = new Set<NotificationListener>();
const statusListeners = new Set<StatusListener>();

const isBrowser = () => typeof window !== 'undefined';

const notifyStatus = (status: NotificationsSocketStatus, message?: string) => {
  currentStatus = status;
  currentStatusMessage = message;

  console.log(`[Socket Status] ${status}${message ? ': ' + message : ''}`);

  for (const listener of statusListeners) {
    listener(status, message);
  }
};

const getSocketBaseUrl = () => {
  if (!isBrowser()) {
    return '';
  }
  return config.socketUrl;
};

const createDeviceId = () => {
  if (!isBrowser()) {
    return '';
  }

  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  const randomPart = Math.random().toString(36).slice(2);
  return `device_${Date.now()}_${randomPart}`;
};

export const getOrCreateStableDeviceId = () => {
  if (!isBrowser()) {
    return '';
  }

  const existing = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const deviceId = createDeviceId();
  window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  return deviceId;
};

const cleanupSocket = () => {
  if (!socket) {
    return;
  }

  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
};

export const connectNotificationsSocket = (token: string) => {
  if (!isBrowser()) {
    return;
  }

  if (!token) {
    disconnectNotificationsSocket();
    notifyStatus('unauthorized', 'Missing access token');
    return;
  }

  const deviceId = getOrCreateStableDeviceId();

  if (socket && currentToken === token && currentDeviceId === deviceId) {
    if (!socket.connected) {
      notifyStatus('connecting');
      socket.connect();
    }
    return;
  }

  cleanupSocket();

  currentToken = token;
  currentDeviceId = deviceId;

  notifyStatus('connecting');
  socket = io(getSocketBaseUrl(), {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 15000,
    transports: ['websocket', 'polling'],
    auth: {
      token,
      deviceId,
    },
  });

  socket.on('connect', () => {
    notifyStatus('connected');
  });

  socket.on('disconnect', (reason) => {
    if (reason === 'io client disconnect') {
      notifyStatus('idle');
      return;
    }

    if (!navigator.onLine) {
      notifyStatus('offline', 'Network offline');
      return;
    }

    notifyStatus('reconnecting', reason);
  });

  socket.io.on('reconnect_attempt', () => {
    notifyStatus('reconnecting');
  });

  socket.io.on('reconnect', () => {
    notifyStatus('connected');
  });

  socket.on('connect_error', (error) => {
    const message = error?.message || 'Socket connection failed';
    if (/401|unauthorized|jwt|token/i.test(message)) {
      notifyStatus('unauthorized', message);
      return;
    }

    if (!navigator.onLine) {
      notifyStatus('offline', message);
      return;
    }

    notifyStatus('error', message);
  });

  socket.on('notification:new', (payload) => {
    for (const listener of notificationListeners) {
      listener(payload);
    }
  });

  socket.on('permissions:updated', (payload) => {
    for (const listener of permissionListeners) {
      listener(payload);
    }
  });
  
  socket.on('user:ban_expired', (payload) => {
    for (const listener of banExpiredListeners) {
      listener(payload);
    }
  });

  socket.on('ranking:update_finished', (payload) => {
    for (const listener of rankingUpdateListeners) {
      listener(payload);
    }
  });

  socket.on('user_ban_expired', (payload) => {
    for (const listener of banExpiredListeners) {
      listener(payload);
    }
  });

  socket.on('ranking_update_finished', (payload) => {
    for (const listener of rankingUpdateListeners) {
      listener(payload);
    }
  });

  // Handle generic 'message' event if it contains eventName (as hinted by the user)
  socket.on('message', (payload) => {
    if (!payload || typeof payload !== 'object') return;
    
    if (payload.eventName === 'user_ban_expired') {
      for (const listener of banExpiredListeners) {
        listener(payload);
      }
    } else if (payload.eventName === 'ranking_update_finished') {
      for (const listener of rankingUpdateListeners) {
        listener(payload);
      }
    }
  });

  // Debug all socket events
  socket.onAny((eventName, ...args) => {
    console.log(`[Socket Debug] Event: ${eventName}`, args);
  });

  socket.on('test:pong', () => {
    // Optional smoke test event support.
  });

  socket.connect();
};

export const disconnectNotificationsSocket = () => {
  cleanupSocket();
  currentToken = null;
  notifyStatus('idle');
};

export const subscribeToNotificationEvents = (listener: NotificationListener) => {
  notificationListeners.add(listener);
  return () => {
    notificationListeners.delete(listener);
  };
};

export const subscribeToPermissionEvents = (listener: NotificationListener) => {
  permissionListeners.add(listener);
  return () => {
    permissionListeners.delete(listener);
  };
};

export const subscribeToBanExpiredEvents = (listener: NotificationListener) => {
  banExpiredListeners.add(listener);
  return () => {
    banExpiredListeners.delete(listener);
  };
};

export const subscribeToRankingUpdateEvents = (listener: NotificationListener) => {
  rankingUpdateListeners.add(listener);
  return () => {
    rankingUpdateListeners.delete(listener);
  };
};

export const subscribeToSocketStatus = (listener: StatusListener) => {
  statusListeners.add(listener);
  listener(currentStatus, currentStatusMessage);

  return () => {
    statusListeners.delete(listener);
  };
};

export const emitSocketTestPing = () => {
  if (!socket || !socket.connected) {
    return;
  }

  socket.emit('test:ping', { ts: Date.now() });
};
