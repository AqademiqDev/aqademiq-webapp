import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from './hooks/useAuth';
import { AppStateProvider } from './hooks/useAppState';
import { queryClient } from './lib/queryClient';
import App from './App';
import './styles/index.css';

/* Provider order matters: the query cache must exist before AppStateProvider,
   which reads profile/settings through it, and auth must wrap both so every
   query can gate on the session. */

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppStateProvider>
            <App />
          </AppStateProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);
