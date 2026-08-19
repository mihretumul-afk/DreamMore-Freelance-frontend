import { useEffect } from 'react';
import { PAGE_TITLE_SUFFIX } from '../constants/app';

/**
 * Sets the document title with a consistent brand suffix.
 * @param {string} title
 */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${PAGE_TITLE_SUFFIX}` : PAGE_TITLE_SUFFIX;
    return () => {
      document.title = PAGE_TITLE_SUFFIX;
    };
  }, [title]);
}
