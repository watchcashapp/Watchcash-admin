import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { Warning } from '@mui/icons-material';

export interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  severity?: 'warning' | 'error' | 'info';
}

export default function ConfirmDialog({
  open,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  severity = 'warning',
}: ConfirmDialogProps) {
  const getSeverityColor = () => {
    switch (severity) {
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#213350';
      default:
        return '#f59e0b';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onCancel}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            bgcolor: 'background.paper',
            backdropFilter: 'blur(20px)',
            boxShadow: (theme) => theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0, 0, 0, 0.6)' 
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: (theme) => theme.palette.mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.05)',
          }
        }
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Warning
            sx={{
              color: getSeverityColor(),
              fontSize: '2rem',
            }}
          />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button
          onClick={onCancel}
          disabled={isLoading}
          sx={{
            minWidth: 100,
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isLoading}
          variant="contained"
          sx={{
            minWidth: 100,
            background: severity === 'error' 
              ? 'linear-gradient(45deg, #ef4444, #dc2626)' 
              : 'linear-gradient(45deg, #f59e0b, #d97706)',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
            '&:hover': {
              background: severity === 'error'
                ? 'linear-gradient(45deg, #dc2626, #b91c1c)'
                : 'linear-gradient(45deg, #d97706, #b45309)',
              boxShadow: '0 6px 16px rgba(239, 68, 68, 0.5)',
            },
            '&:disabled': {
              background: 'rgba(239, 68, 68, 0.5)',
            },
          }}
        >
          {isLoading ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
