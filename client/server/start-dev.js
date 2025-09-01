#!/usr/bin/env node

// Simple dev server startup script to avoid tsx permission issues
import('./index.js')
  .then(() => {
    console.log('Server started successfully');
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
