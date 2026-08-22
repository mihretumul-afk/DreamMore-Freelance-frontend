import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthProvider';
import { ToastProvider } from './contexts/ToastProvider';
import { I18nProvider } from './i18n';
import { router } from './routes';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nProvider>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </I18nProvider>
  </StrictMode>,
);
