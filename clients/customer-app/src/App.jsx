import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { ThemeProvider } from 'next-themes';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;
const ResetPasswordPage = Pages.ResetPassword;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

function RootRoute() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const requestedPage = searchParams.get('page');
  const token = searchParams.get('token');

  if (requestedPage === 'ResetPassword' && token && ResetPasswordPage) {
    return (
      <LayoutWrapper currentPageName="ResetPassword">
        <ResetPasswordPage />
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper currentPageName={mainPageKey}>
      <MainPage />
    </LayoutWrapper>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" storageKey="sharkband-theme">
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthProvider>
            <NavigationTracker />
            <Routes>
              <Route path="/" element={<RootRoute />} />
              {Object.entries(Pages).map(([path, Page]) => (
                <Route
                  key={path}
                  path={`/${path}`}
                  element={
                    <LayoutWrapper currentPageName={path}>
                      <Page />
                    </LayoutWrapper>
                  }
                />
              ))}
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </AuthProvider>
        </Router>
        <Toaster />
        <SonnerToaster position="top-center" richColors />
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
