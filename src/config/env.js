/**
 * Central access point for environment configuration.
 *
 * All values are read from Vite environment variables (`.env` files, VITE_ prefix).
 * See `.env.example` at the project root for the supported variables.
 */

/** Base URL of the Laravel REST API (versioned at /api/v1). */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1';

/** Display name of the platform. */
export const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'Dream More AppWorks';
