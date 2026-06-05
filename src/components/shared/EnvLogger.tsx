"use client";

import { useEffect } from 'react';
import { logEnvConfig } from '@/config/env';

export default function EnvLogger() {
  useEffect(() => {
    logEnvConfig('client');
  }, []);

  return null;
}
