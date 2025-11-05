
'use client';

// This file is the main entry point for all client-side Firebase related functionality.
// It re-exports all the necessary hooks and providers.

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
export * from './use-auth-user';
export * from './use-memo-firebase';
export { initializeFirebase } from './config';
