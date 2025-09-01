import React from 'react';

export function Toaster() {
  return null; // Placeholder for now
}

export function useToast() {
  const toast = ({ title, description, variant }: { title: string; description?: string; variant?: 'default' | 'destructive' }) => {
    // Simple toast implementation using browser alert for now
    if (variant === 'destructive') {
      alert(`Error: ${title}${description ? '\n' + description : ''}`);
    } else {
      alert(`${title}${description ? '\n' + description : ''}`);
    }
  };

  return { toast };
}
