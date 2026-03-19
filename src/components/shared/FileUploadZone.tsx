import React, { useState, useRef } from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { CloudUpload, InsertDriveFile } from '@mui/icons-material';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileSelect,
  isUploading = false,
  accept = '.csv',
  maxSizeMB = 10,
  label = 'Drag and drop your CSV file here, or click to select'
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndProcessFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndProcessFile(files[0]);
    }
  };

  const validateAndProcessFile = (file: File) => {
    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    const acceptedExtensions = accept.split(',').map(ext => ext.trim().replace('.', '').toLowerCase());
    
    if (extension && !acceptedExtensions.includes(extension)) {
      // In a real app we'd show an alert, but for now we'll just not process it
      return;
    }

    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      return;
    }

    onFileSelect(file);
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Paper
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      sx={{
        p: 4,
        border: '2px dashed',
        borderColor: isDragActive ? 'primary.main' : 'divider',
        bgcolor: isDragActive ? 'rgba(33, 51, 80, 0.04)' : 'background.paper',
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        position: 'relative',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: 'rgba(33, 51, 80, 0.02)',
        },
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        style={{ display: 'none' }}
      />
      
      {isUploading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={40} thickness={4} />
          <Typography variant="body2" color="text.secondary">
            Uploading file...
          </Typography>
        </Box>
      ) : (
        <>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: 'rgba(106, 179, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              color: '#6AB344',
            }}
          >
            <CloudUpload fontSize="large" />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            {label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Supported format: {accept.toUpperCase()} (Max {maxSizeMB}MB)
          </Typography>
        </>
      )}
    </Paper>
  );
};

export default FileUploadZone;
