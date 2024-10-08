import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app.tsx';
import './styles/global.css';
import { TanstackQueryProvider } from '@/api/query-client.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TanstackQueryProvider>
      <App />
    </TanstackQueryProvider>
  </StrictMode>,
);
