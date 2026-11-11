import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { PracticeRoom } from './pages/PracticeRoom';
import { AcademicLibrary } from './pages/AcademicLibrary';
import { Login } from './pages/Login';
import { Founder } from './pages/Founder';
import { Events } from './pages/Events';
import { DynamicPage } from './pages/DynamicPage';
import { ArticlePage } from './pages/ArticlePage';
import { SiteProvider, useSite, resolveLink, type NavItem } from './content/SiteContext';
import api from './api';
import { User, Menu, X, ChevronDown } from 'lucide-react';

const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

const isAdminUrl = () => {
  const { href, hash, search } = window.location;
  return href.includes('admin') || href.includes('gip_sec_admin_token') || href.includes('sec-admin') ||
    hash.includes('admin') || search.includes('admin');
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>(() => (isAdminUrl() ? 'admin' : 'home'));
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; name: string; role?: string } | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(!!token);

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      setCurrentUser(response.data);
    } catch (error) {
      handleUserLogout();
    } finally {
      setAuthLoading(false);
    }
  };

  // --- SECRET ADMIN URL LISTENER ---
  useEffect(() => {
    const handleRouteCheck = () => {
      if (isAdminUrl()) setCurrentPage('admin');
    };
    window.addEventListener('popstate', handleRouteCheck);
    window.addEventListener('hashchange', handleRouteCheck);
    return () => {
      window.removeEventListener('popstate', handleRouteCheck);
      window.removeEventListener('hashchange', handleRouteCheck);
    };
  }, []);

  const handleAdminLogout = () => {
    setCurrentPage('home');
    window.history.replaceState({}, '', window.location.pathname.replace(/admin.*$/, ''));
  };

  const handleUserLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    setCurrentPage('home');
  };

  const handleLoginSuccess = (newToken: string, user: { id: string; username: string; name: string; role?: string }) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setCurrentUser(user);
    setCurrentPage('workspace');
  };

  const navigateTo = useCallback((page: string, scrollToId?: string) => {
    setCurrentPage(page === 'workspace' && !localStorage.getItem('token') ? 'login' : page);

    if (scrollToId) {
      setTimeout(() => {
        document.getElementById(scrollToId)?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // --- RENDER ADMIN DASHBOARD ---
  if (currentPage === 'admin') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#00241a] text-[#c7a85b] flex items-center justify-center font-bold text-xs">ადმინ პანელი იტვირთება...</div>}>
        <AdminDashboard onLogout={handleAdminLogout} onNavigateHome={() => navigateTo('home')} />
      </Suspense>
    );
  }

  return (
    <SiteProvider onNavigate={navigateTo}>
      <PublicSite
        currentPage={currentPage}
        navigateTo={navigateTo}
        token={token}
        currentUser={currentUser}
        authLoading={authLoading}
        onUserLogout={handleUserLogout}
        onLoginSuccess={handleLoginSuccess}
        onOpenAdmin={() => setCurrentPage('admin')}
      />
    </SiteProvider>
  );
}

interface PublicSiteProps {
  currentPage: string;
  navigateTo: (page: string, scrollToId?: string) => void;
  token: string | null;
  currentUser: { id: string; username: string; name: string; role?: string } | null;
  authLoading: boolean;
  onUserLogout: () => void;
  onLoginSuccess: (token: string, user: { id: string; username: string; name: string; role?: string }) => void;
  onOpenAdmin: () => void;
}

const SEO_PATHS: Record<string, string> = {
  home: '/', founder: '/founder', academic: '/academic', events: '/events', practice: '/practice', workspace: '/workspace', login: '/login'
};

function PublicSite({ currentPage, navigateTo, token, currentUser, authLoading, onUserLogout, onLoginSuccess, onOpenAdmin }: PublicSiteProps) {
  const { t, nav, go } = useSite();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Apply SEO title/description managed in the admin panel for built-in pages
  useEffect(() => {
    const path = SEO_PATHS[currentPage];
    if (!path) return;
    api.get('/seo', { params: { path } }).then(res => {
      if (res.data?.title) document.title = res.data.title;
      if (res.data?.description) {
        let meta = document.querySelector('meta[name="description"]');
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', 'description');
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', res.data.description);
      }
    }).catch(() => {});
  }, [currentPage]);

  const topLevel = nav.filter(n => !n.parentId).sort((a, b) => a.sortOrder - b.sortOrder);
  const childrenOf = (id: string) => nav.filter(n => n.parentId === id).sort((a, b) => a.sortOrder - b.sortOrder);

  const isActive = (item: NavItem) => {
    const link = resolveLink(item.url);
    return !link.hash && link.page === currentPage;
  };

  const handleNavClick = (item: NavItem) => {
    setMobileOpen(false);
    if (item.isExternal) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    } else {
      go(item.url);
    }
  };

  const customSlug = currentPage.startsWith('custom-') ? currentPage.slice('custom-'.length) : null;
  const articleRef = currentPage.startsWith('post-') || currentPage.startsWith('blog-') ? currentPage : null;

  return (
    <div className="min-h-screen bg-background text-text-main flex flex-col justify-between selection:bg-tertiary selection:text-on-tertiary font-body-md overflow-x-hidden">
      {/* Public Navigation Header */}
      <header className="bg-[#0B251C] text-[#E2EFE9] sticky top-0 w-full z-50 shadow-md border-b border-white/10 transition-all">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 flex justify-between items-center py-4 gap-4">
          {/* Brand Title */}
          <button
            onClick={() => navigateTo('home')}
            className="flex items-center gap-3 font-serif text-[#E2EFE9] text-xl md:text-2xl font-bold leading-tight tracking-tight text-left hover:opacity-90 transition-opacity cursor-pointer whitespace-pre-line"
          >
            {t('siteLogo') && <img src={t('siteLogo')} alt="" className="h-12 w-auto object-contain" />}
            {t('siteTitle')}
          </button>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
            {topLevel.map(item => {
              const children = childrenOf(item.id);
              if (children.length > 0) {
                return (
                  <div key={item.id} className="group relative">
                    <button
                      onClick={() => handleNavClick(item)}
                      className={`transition-colors flex items-center gap-1 cursor-pointer py-1 ${
                        children.some(isActive) ? 'text-[#C7A85B] font-bold' : 'text-[#E2EFE9]/90 hover:text-[#C7A85B]'
                      }`}
                    >
                      {item.label} <ChevronDown size={14} />
                    </button>
                    <div className="absolute top-full left-0 mt-2 w-56 bg-[#0B251C] text-white shadow-2xl rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 border border-white/15 p-1">
                      {children.map(child => (
                        <button
                          key={child.id}
                          onClick={() => handleNavClick(child)}
                          className="w-full text-left block px-4 py-2.5 text-xs hover:bg-white/10 rounded-lg text-[#E2EFE9] transition-colors"
                        >
                          {child.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`transition-colors cursor-pointer py-1 whitespace-nowrap ${
                    isActive(item)
                      ? 'text-[#C7A85B] border-b-2 border-[#C7A85B] font-bold'
                      : 'text-[#E2EFE9]/90 hover:text-[#C7A85B]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User Auth Buttons */}
          <div className="flex items-center gap-3">
            {token && currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateTo('workspace')}
                  className="hidden md:inline text-xs border border-white/20 px-3 py-1.5 rounded-full text-white bg-white/5 cursor-pointer hover:border-[#C7A85B]"
                >
                  <User size={12} className="inline mr-1 text-[#C7A85B]" />
                  {currentUser.name}
                </button>
                <button
                  onClick={onUserLogout}
                  className="bg-white/10 hover:bg-[#C7A85B] text-white hover:text-slate-950 px-3.5 py-1.5 rounded-full font-bold transition-all text-xs border border-white/20 cursor-pointer"
                >
                  {t('logoutButtonText')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigateTo('login')}
                className="bg-[#C7A85B] text-slate-950 px-5 py-1.5 rounded-full font-bold text-xs hover:brightness-110 transition-all cursor-pointer shadow-sm"
              >
                {t('loginButtonText')}
              </button>
            )}
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="lg:hidden p-1.5 text-[#E2EFE9] cursor-pointer"
              aria-label="მენიუ"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <nav className="lg:hidden border-t border-white/10 px-6 py-4 space-y-1 bg-[#0B251C]">
            {topLevel.map(item => (
              <div key={item.id}>
                <button onClick={() => handleNavClick(item)} className="w-full text-left py-2 text-sm font-medium text-[#E2EFE9] hover:text-[#C7A85B]">
                  {item.label}
                </button>
                {childrenOf(item.id).map(child => (
                  <button key={child.id} onClick={() => handleNavClick(child)} className="w-full text-left py-1.5 pl-4 text-xs text-[#E2EFE9]/80 hover:text-[#C7A85B]">
                    {child.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        )}
      </header>

      {/* Main Content Area */}
      <main className={`flex-grow transition-all duration-300 ${
        currentPage === 'home'
          ? 'pt-20 pb-0 w-full mx-auto'
          : 'pt-28 pb-20 max-w-container-max w-full mx-auto px-6 md:px-12'
      }`}>
        {authLoading ? (
          <div className="text-center py-40">
            <div className="animate-spin inline-block w-8 h-8 border-2 border-t-transparent border-tertiary rounded-full" />
            <p className="text-sm text-text-muted mt-3">იტვირთება...</p>
          </div>
        ) : (
          <>
            {currentPage === 'home' && <Home onNavigate={navigateTo} />}
            {currentPage === 'academic' && <AcademicLibrary onNavigate={navigateTo} />}
            {currentPage === 'events' && <Events />}
            {currentPage === 'practice' && <PracticeRoom isAuthenticated={!!token} />}
            {currentPage === 'founder' && <Founder />}
            {currentPage === 'workspace' && <Dashboard />}
            {currentPage === 'login' && <Login onLoginSuccess={onLoginSuccess} />}
            {customSlug && <DynamicPage slug={customSlug} onNavigateHome={() => navigateTo('home')} />}
            {articleRef && <ArticlePage reference={articleRef} onBack={() => navigateTo('academic')} />}
          </>
        )}
      </main>

      {/* Public Footer */}
      <footer id="footer-section" className="bg-background text-text-main w-full py-section-gap-md px-gutter flex flex-col md:flex-row justify-between items-start gap-12 border-t border-outline/10 relative z-20">
        <div className="max-w-xs space-y-6">
          <div className="font-headline-md text-headline-md text-tertiary font-bold leading-tight whitespace-pre-line">
            {t('siteTitle')}
          </div>
          <p className="text-text-muted font-body-md text-body-md leading-relaxed">
            {t('aboutText')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-16">
          <div className="flex flex-col gap-4">
            <h4 className="text-tertiary font-bold font-label-md text-label-md mb-2">{t('footerNavTitle')}</h4>
            {topLevel.map(item => (
              <button key={item.id} onClick={() => handleNavClick(item)} className="text-text-muted hover:text-tertiary transition-colors font-label-md text-label-md text-left cursor-pointer">
                {item.label}
              </button>
            ))}
            <button onClick={onOpenAdmin} className="text-[#c7a85b]/70 hover:text-[#c7a85b] transition-colors font-label-md text-xs text-left cursor-pointer font-bold pt-2 border-t border-white/10">⚙ ადმინ პანელი</button>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="text-tertiary font-bold font-label-md text-label-md mb-2">{t('footerContactTitle')}</h4>
            {t('footerContactPhone') && <a href={`tel:${t('footerContactPhone').replace(/\s/g, '')}`} className="text-text-muted text-label-md hover:text-tertiary">{t('footerContactPhone')}</a>}
            {t('footerContactEmail') && <a href={`mailto:${t('footerContactEmail')}`} className="text-text-muted text-label-md hover:text-tertiary">{t('footerContactEmail')}</a>}
            {t('footerAddress') && <p className="text-text-muted text-label-md">{t('footerAddress')}</p>}
          </div>
        </div>

        <div className="w-full md:w-auto mt-12 md:mt-0 pt-12 md:pt-0 border-t md:border-none border-outline/10">
          <p className="text-text-muted text-label-md mb-4 opacity-60">
            {t('footerCopyright')}
          </p>
        </div>
      </footer>
    </div>
  );
}
