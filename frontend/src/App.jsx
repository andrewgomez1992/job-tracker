import { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { ThemeProvider } from './app/ThemeProvider.jsx';
import { Spinner, ToastProvider } from './components/ui/index.js';
import { ErrorBoundary } from './components/layout/ErrorBoundary.jsx';
import { AppShell } from './components/layout/AppShell.jsx';
import { DashboardPage } from './features/dashboard/DashboardPage.jsx';
import { BoardPage } from './features/applications/BoardPage.jsx';
import { ApplicationsPage } from './features/applications/ApplicationsPage.jsx';
import { ApplicationDetailPage } from './features/applications/ApplicationDetailPage.jsx';
import { InterviewsPage } from './features/interviews/InterviewsPage.jsx';
import { ContactsPage } from './features/contacts/ContactsPage.jsx';
import { DocumentsPage } from './features/documents/DocumentsPage.jsx';

// Recharts is the heaviest dependency in the app and only Insights needs it.
const InsightsPage = lazy(() =>
  import('./features/insights/InsightsPage.jsx').then((m) => ({ default: m.InsightsPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      retry: (failureCount, error) => (error?.status === 0 ? failureCount < 2 : false),
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <Router>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
                <Route path="board" element={<ErrorBoundary><BoardPage /></ErrorBoundary>} />
                <Route path="applications" element={<ErrorBoundary><ApplicationsPage /></ErrorBoundary>} />
                <Route path="applications/:id" element={<ErrorBoundary><ApplicationDetailPage /></ErrorBoundary>} />
                <Route path="interviews" element={<ErrorBoundary><InterviewsPage /></ErrorBoundary>} />
                <Route path="contacts" element={<ErrorBoundary><ContactsPage /></ErrorBoundary>} />
                <Route path="documents" element={<ErrorBoundary><DocumentsPage /></ErrorBoundary>} />
                <Route
                  path="insights"
                  element={(
                    <ErrorBoundary>
                      <Suspense fallback={<Spinner center size={26} />}>
                        <InsightsPage />
                      </Suspense>
                    </ErrorBoundary>
                  )}
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Router>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
