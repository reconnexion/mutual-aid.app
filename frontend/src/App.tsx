import { Authenticated, Refine } from '@refinedev/core';
import { useNotificationProvider, ErrorComponent } from '@refinedev/antd';
import routerProvider, { CatchAllNavigate, UnsavedChangesNotifier } from '@refinedev/react-router';
import { AntdAuthPage } from '@activitypods/refine-providers/antd-auth-page';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router';
import { App as AntdApp, ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';

import '@refinedev/antd/dist/reset.css';
import './index.css';

import { authProvider, dataProvider } from './providers';
import { DEFAULT_POD_PROVIDER } from './config/env';
import theme from './theme';
import AppShell from './components/AppShell';
import HomePage from './pages/HomePage';
import AnnonceListPage from './pages/AnnonceListPage';
import AnnonceShowPage from './pages/AnnonceShowPage';

const App = () => (
  <BrowserRouter>
    <ConfigProvider locale={frFR} theme={theme}>
      <AntdApp>
        <Refine
          authProvider={authProvider}
          dataProvider={dataProvider}
          routerProvider={routerProvider}
          resources={[{ name: 'offer' }, { name: 'request' }, { name: 'profile' }]}
          notificationProvider={useNotificationProvider}
          options={{
            syncWithLocation: true,
            warnWhenUnsavedChanges: true,
            disableTelemetry: true
          }}
        >
          <Routes>
            <Route path="/" element={<HomePage />} />

            {/*
              Not wrapped in <Authenticated>: AntdAuthPage handles every stage (provider picker,
              OAuth callback, app registration) from the URL's search params, so this single
              route doubles as the OIDC redirectUri (matching what the backend registers this
              app's OIDC client with — see backend's app.service.js).
            */}
            <Route path="/login" element={<AntdAuthPage authProvider={authProvider} defaultPodProvider={DEFAULT_POD_PROVIDER} redirect="/annonces" />} />

            <Route
              element={
                <Authenticated key="authenticated-routes" fallback={<CatchAllNavigate to="/login" />}>
                  <AppShell>
                    <Outlet />
                  </AppShell>
                </Authenticated>
              }
            >
              <Route path="/annonces" element={<AnnonceListPage />} />
              <Route path="/annonces/:kind/:id" element={<AnnonceShowPage />} />
            </Route>

            <Route
              element={
                <Authenticated key="catch-all">
                  <AppShell>
                    <Outlet />
                  </AppShell>
                </Authenticated>
              }
            >
              <Route path="*" element={<ErrorComponent />} />
            </Route>
          </Routes>
          <UnsavedChangesNotifier />
        </Refine>
      </AntdApp>
    </ConfigProvider>
  </BrowserRouter>
);

export default App;
