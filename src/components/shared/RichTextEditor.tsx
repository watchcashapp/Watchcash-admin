"use client";

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { Box, Paper, Typography, useTheme } from '@mui/material';

// Import Quill dynamically for Next.js to avoid SSR errors
const QuillEditor = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => (
    <Box sx={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.paper', borderRadius: 2 }}>
      <Typography variant="body2" color="text.secondary">Loading editor...</Typography>
    </Box>
  ),
});

export interface RichTextEditorProps {
  value: string;
  onChange?: (value: string) => void;
  label?: string;
  readOnly?: boolean;
}

export default function RichTextEditor({ value, onChange, label, readOnly }: RichTextEditorProps) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const modules = useMemo(() => ({
    toolbar: readOnly ? false : [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
    ],
  }), [readOnly]);

  return (
    <Box sx={{ mb: 2 }}>
      {label && (
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, ml: 0.5 }}>
          {label}
        </Typography>
      )}
      <Paper 
        elevation={0}
        sx={{ 
          borderRadius: 2,
          overflow: 'hidden',
          border: readOnly ? 'none' : '1px solid',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          background: readOnly ? 'transparent' : (isDarkMode ? 'rgba(26, 31, 58, 0.5)' : '#fff'),
          '& .ql-toolbar': {
            display: readOnly ? 'none' : 'block',
            border: 'none',
            borderBottom: '1px solid',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
          },
          '& .ql-container': {
            border: 'none',
            minHeight: readOnly ? 'auto' : '400px',
            fontSize: '1rem',
          },
          '& .ql-editor': {
            minHeight: readOnly ? 'auto' : '400px',
            color: 'text.primary',
            padding: readOnly ? 0 : '12px 15px',
            '& h1, & h2, & h3, & h4, & h5, & h6': {
              fontWeight: 700,
              mb: 1.5,
            },
            '& p': { mb: 1.5 },
          },
          '& .ql-snow .ql-stroke': {
            stroke: isDarkMode ? '#fff' : '#444',
          },
          '& .ql-snow .ql-fill': {
            fill: isDarkMode ? '#fff' : '#444',
          },
          '& .ql-snow .ql-picker': {
            color: isDarkMode ? '#fff' : '#444',
          }
        }}
      >
        <QuillEditor
          theme="snow"
          value={value}
          onChange={onChange || (() => {})}
          modules={modules}
          readOnly={readOnly}
        />
      </Paper>
    </Box>
  );
}
