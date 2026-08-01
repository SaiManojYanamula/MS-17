'use client';

import { useEffect } from 'react';

// next-pwa's `register: true` only auto-injects the registration script into
// the Pages Router's _document.js — this project uses the App Router, which
// has no such hook, so the service worker was never actually being registered.
export default function RegisterServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return null;
}
