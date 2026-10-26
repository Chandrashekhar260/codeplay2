import { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Sidebar, type NavTab } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { OverviewPage } from './pages/OverviewPage';
import { DiscoveryPage } from './pages/DiscoveryPage';
import { RopaPage } from './pages/RopaPage';
import { GovernancePage } from './pages/GovernancePage';
import { ConsentPage } from './pages/ConsentPage';
import { AuditPage } from './pages/AuditPage';
import { DsrAdminPage } from './pages/DsrAdminPage';
import { CookieGovernancePage } from './pages/CookieGovernancePage';
import { DataPrincipalPortal } from './pages/DataPrincipalPortal';
import { LoginModal } from './components/auth/LoginModal';
import { api } from './api/client';
import type { DataSource, ProcessingActivity, DataAsset, Purpose, DsrRequest } from './types';

const navTabs: NavTab[] = [
  'dashboard',
  'discovery',
  'ropa',
  'governance',
  'consent',
  'dsr',
  'cookies',
  'audit',
];

function tabFromHash(): NavTab {
  const hash = window.location.hash.slice(1) as NavTab;
  return navTabs.includes(hash) ? hash : 'dashboard';
}

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>(() => tabFromHash());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [tenantName, setTenantName] = useState<string>('Aarogya Diagnostic Center');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Toggle for Citizen / Data Principal Self-Service Portal
  const [isPortalView, setIsPortalView] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('datasentinel_user');
      const u = saved ? JSON.parse(saved) : null;
      if (u?.userType === 'MSME') return false;
      return window.location.hash === '#portal' || u?.userType === 'CITIZEN';
    } catch {
      return false;
    }
  });

  // Live Backend Data States
  const [sources, setSources] = useState<DataSource[]>([]);
  const [activities, setActivities] = useState<ProcessingActivity[]>([]);
  const [assets, setAssets] = useState<DataAsset[]>([]);
  const [purposes, setPurposes] = useState<Purpose[]>([]);
  const [dsrRequests, setDsrRequests] = useState<DsrRequest[]>([]);
  const [realFindingsCount, setRealFindingsCount] = useState<number>(0);
  const [realFlagsCount, setRealFlagsCount] = useState<number>(0);
  const [realConsentsCount, setRealConsentsCount] = useState<number>(0);
  const [pendingDsrCount, setPendingDsrCount] = useState<number>(0);

  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('datasentinel_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('datasentinel_token');
    localStorage.removeItem('datasentinel_user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setIsPortalView(false);
    window.location.hash = '';
  };

  const navigateToTab = (tab: NavTab) => {
    setIsPortalView(false);
    window.history.pushState({ tab }, '', `#${tab}`);
    setCurrentTab(tab);
  };

  // Live Data Loader — Direct from PostgreSQL Backend
  const loadWorkspaceData = async () => {
    setIsRefreshing(true);
    try {
      const [srcData, actData, astData, purpData, tenantData, dsrAlerts, dsrList] =
        await Promise.all([
          api.discovery.getSources().catch(() => []),
          api.mapping.getActivities().catch(() => []),
          api.governance.getAssets().catch(() => []),
          api.consent.getPurposes().catch(() => []),
          api.auth.getTenant().catch(() => null),
          api.dsr.getAlerts().catch(() => ({ totalPending: 0 })),
          api.dsr.getRequests().catch(() => []),
        ]);

      setSources(srcData);
      setActivities(actData);
      setAssets(astData);
      setPurposes(purpData);
      setDsrRequests(dsrList);
      setPendingDsrCount(dsrAlerts.totalPending || 0);

      if (tenantData?.name) {
        setTenantName(tenantData.name);
      }

      setRealConsentsCount(tenantData?.counts?.consentRecords || 0);

      // Fetch actual findings and flags from the data sources
      let totalFindings = 0;
      let totalFlags = 0;
      for (const src of srcData) {
        try {
          const [f, fl] = await Promise.all([
            api.discovery.getFindings(src.sourceId),
            api.discovery.getFlags(src.sourceId),
          ]);
          totalFindings += f.length;
          totalFlags += fl.length;
        } catch {}
      }
      setRealFindingsCount(totalFindings);
      setRealFlagsCount(totalFlags);
    } catch (err) {
      console.error('[DataSentinel] Live API sync failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Authenticate and load live data
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.hash === '#portal') {
        const saved = localStorage.getItem('datasentinel_user');
        const u = saved ? JSON.parse(saved) : null;
        if (u?.userType === 'MSME') {
          setIsPortalView(false);
          window.location.hash = '#dashboard';
        } else {
          setIsPortalView(true);
        }
      } else {
        setIsPortalView(false);
        setCurrentTab(tabFromHash());
      }
    };
    const handleUnauthorized = () => {
      handleLogout();
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('datasentinel:unauthorized', handleUnauthorized);

    async function initAuth() {
      setIsAuthChecking(true);
      const existingToken = localStorage.getItem('datasentinel_token');
      if (existingToken) {
        try {
          const me = await api.auth.getMe();
          setIsAuthenticated(true);
          setCurrentUser(me.user);
          if (me.tenant?.name) setTenantName(me.tenant.name);

          // Route to portal ONLY if user is an Individual Citizen
          if (me.user?.userType === 'CITIZEN' || me.user?.role === 'CITIZEN') {
            setIsPortalView(true);
          } else {
            setIsPortalView(false);
            if (window.location.hash === '#portal') {
              window.location.hash = '#dashboard';
            }
            await loadWorkspaceData();
          }
          setIsAuthChecking(false);
          return;
        } catch {
          handleLogout();
        }
      }

      // No token present — do not force auto-login, present LoginModal
      setIsAuthenticated(false);
      setIsAuthChecking(false);
    }

    initAuth();
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('datasentinel:unauthorized', handleUnauthorized);
    };
  }, []);

  // 1. Authentication Loading State
  if (isAuthChecking) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-400">Connecting to DataSentinel DPDP Workspace...</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State -> Present LoginModal
  if (!isAuthenticated) {
    return (
      <LoginModal
        onLoginSuccess={(data) => {
          setIsAuthenticated(true);
          setCurrentUser(data.user);
          if (data.tenant?.name) setTenantName(data.tenant.name);

          if (data.user?.userType === 'CITIZEN' || data.user?.role === 'CITIZEN') {
            setIsPortalView(true);
            window.location.hash = '#portal';
          } else {
            setIsPortalView(false);
            window.location.hash = '#dashboard';
            loadWorkspaceData();
          }
        }}
      />
    );
  }

  const isCitizen = currentUser?.userType === 'CITIZEN' || currentUser?.role === 'CITIZEN';
  const isMsme = currentUser?.userType === 'MSME';

  // 3. Citizen / Data Principal Self-Service Portal (Citizen accounts only)
  if (isCitizen) {
    return (
      <DataPrincipalPortal
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    );
  }

  // 4. MSME Guard: If logged in as MSME and attempting to access Citizen Portal
  if (isMsme && (isPortalView || window.location.hash === '#portal')) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white p-6">
        <div className="max-w-md w-full bg-slate-800 border border-amber-500/30 rounded-2xl p-6 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            You are logged in with an MSME Business Administrator account (
            <span className="font-mono text-amber-300">{currentUser?.email}</span>).
            Under DPDP Act 2023, the Citizen Privacy Portal is exclusively reserved for individual citizens.
            MSME company accounts cannot access the citizen portal.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setIsPortalView(false);
                window.location.hash = '#dashboard';
              }}
              className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Return to MSME Workspace
            </button>
            <button
              onClick={handleLogout}
              className="btn-secondary px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer text-slate-300"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Authenticated Enterprise Dashboard (For MSME Administrators)
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-900 text-slate-900 font-sans">
      {/* Persistent Enterprise Navy Sidebar - no portal launch for MSME session */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={navigateToTab}
        tenantName={tenantName}
        pendingDsrCount={pendingDsrCount}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-100">
        {/* Top Header in Tinted Frame */}
        <Topbar
          currentTab={currentTab}
          onRefresh={loadWorkspaceData}
          isRefreshing={isRefreshing}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* Crisp Inset White Sheet with Subtle Light-Grey Canvas */}
        <div className="flex-1 m-3 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <main className="flex-1 overflow-y-auto bg-slate-50/40 p-6 sm:p-8">
            {currentTab === 'dashboard' && (
              <OverviewPage
                onNavigate={navigateToTab}
                stats={{
                  sourcesCount: sources.length,
                  findingsCount: realFindingsCount,
                  assetsCount: assets.length,
                  consentsCount: realConsentsCount,
                  flagsCount: realFlagsCount,
                }}
              />
            )}

            {currentTab === 'discovery' && (
              <DiscoveryPage
                sources={sources}
                onFileUploaded={loadWorkspaceData}
              />
            )}

            {currentTab === 'ropa' && (
              <RopaPage
                activities={activities}
                onActivityCreated={loadWorkspaceData}
              />
            )}

            {currentTab === 'governance' && (
              <GovernancePage assets={assets} />
            )}

            {currentTab === 'consent' && (
              <ConsentPage
                purposes={purposes}
                onConsentRecorded={loadWorkspaceData}
              />
            )}

            {currentTab === 'dsr' && (
              <DsrAdminPage
                requests={dsrRequests}
                onDsrResolved={loadWorkspaceData}
              />
            )}

            {currentTab === 'cookies' && <CookieGovernancePage />}

            {currentTab === 'audit' && <AuditPage />}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
