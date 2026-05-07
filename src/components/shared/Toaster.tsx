"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, AlertProps, SnackbarProps } from '@mui/material';

export interface ToastMessage {
  id: string;
  message: string;
  severity: AlertProps['severity'];
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, severity?: AlertProps['severity'], duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (error: any, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, severity: AlertProps['severity'] = 'info', duration: number = 6000) => {
    const id = Date.now().toString();
    const newToast: ToastMessage = { id, message, severity, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, duration);
    }
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((error: any, duration?: number) => {
    let finalMessage = 'An unexpected error occurred';
    
    if (typeof error === 'string') {
      finalMessage = error;
    } else {
      // Prioritize the top-level API message
      finalMessage = error?.data?.message || error?.message || finalMessage;
    }
    
    showToast(finalMessage, 'error', duration);
  }, [showToast]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showToast(message, 'warning', duration);
  }, [showToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  const handleClose = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{
      showToast,
      showSuccess,
      showError,
      showWarning,
      showInfo
    }}>
      {children}
      {toasts.map((toast) => (
        <Snackbar
          key={toast.id}
          open={true}
          autoHideDuration={toast.duration}
          onClose={() => handleClose(toast.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{
            mt: 8,
            zIndex: (theme) => theme.zIndex.snackbar,
          }}
        >
          <Alert
            onClose={() => handleClose(toast.id)}
            severity={toast.severity}
            sx={{ 
              width: '100%',
              color: '#fff',
              fontWeight: 500,
              '& .MuiAlert-icon': {
                color: '#fff'
              }
            }}
            variant="filled"
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
};
