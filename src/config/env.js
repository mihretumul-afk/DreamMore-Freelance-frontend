/** Base URL of the Laravel REST API (versioned at /api/v1). */
export const API_BASE_URL = 'https://my-laravel-backend-4gyz.onrender.com/api/v1';

/** Origin (scheme://host[:port]) of the Laravel backend. Used for browser
 *  navigations like the Google OAuth redirect (/auth/google/redirect). */
export const API_ORIGIN = new URL(API_BASE_URL).origin;

/** Display name of the platform. */
export const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'Dream More AppWorks';