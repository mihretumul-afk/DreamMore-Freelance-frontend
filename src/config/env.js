/**
 * Central access point for environment configuration.
 *
 * All values are read from Vite environment variables (`.env` files, VITE_ prefix).
 * See `.env.example` at the project root for the supported variables.
 */

/** Base URL of the Laravel REST API (versioned at /api/v1). */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? 'https://my-laravel-backend-4gyz.onrender.com/api/v1';

/** Origin (scheme://host[:port]) of the Laravel backend. Used for browser
 *  navigations like the Google OAuth redirect (/auth/google/redirect). */
export const API_ORIGIN = new URL(API_BASE_URL).origin;

/** Display name of the platform. */
export const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'Dream More AppWorks';