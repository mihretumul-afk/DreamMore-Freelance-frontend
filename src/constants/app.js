import { APP_NAME } from '../config/env';

/** App-wide display name. */
export const APP_NAME_DISPLAY = APP_NAME;

/** Short brand used in the logo. */
export const BRAND_NAME = 'Dream More';

/** Tagline shown in the logo and footer. */
export const BRAND_TAGLINE = 'AppWorks Marketplace';

/** Document title suffix used by the usePageTitle hook. */
export const PAGE_TITLE_SUFFIX = 'Dream More AppWorks';

/** localStorage key for the API access token. */
export const TOKEN_STORAGE_KEY = 'appworks_token';

/** localStorage key for the cached authenticated user. */
export const USER_STORAGE_KEY = 'appworks_user';

/** Marketplace user roles. */
export const ROLES = {
  FREELANCER: 'freelancer',
  EMPLOYER: 'employer',
  ADMIN: 'admin',
};
