import { useState, useEffect, lazy, Suspense } from 'react';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { PracticeRoom } from './pages/PracticeRoom';
import { AcademicLibrary } from './pages/AcademicLibrary';
import { Login } from './pages/Login';
import { Founder } from './pages/Founder';
import { Events } from './pages/Events';
import { DynamicPage } from './pages/DynamicPage';
import api from './api';
import { User } from 'lucide-react';

const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [customPageSlug, setCustomPageSlug] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; name: string; role?: string } | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(!!token);

  // Admin & Site State
  const [show404Page, setShow404Page] = useState<boolean>(false);

  // Site Settings State
  const [siteSettings, setSiteSettings] = useState<any>({
    siteTitle: 'Georgian\nInstitute of\nPsychosynthesis',
    navHome: 'მთავარი',
    navAboutDropdown: 'ჩვენ შესახებ',
    navHistory: 'ინსტიტუტის ისტორია',
    navFounder: 'დამფუძნებელი',
    navTrainers: 'ტრენერები',
    navAcademic: 'აკადემიური პორტალი',
    navResources: 'რესურსები',
    navEvents: 'ღონისძიებები',
    navPractice: 'მედიტაცია',
    navWorkspace: 'სამუშაო სივრცე',
    navContact: 'კონტაქტი',
    aboutText: 'ქართული ფსიქოსინთეზის ინსტიტუტი არის წამყვანი აკადემიური და თერაპიული ცენტრი საქართველოში.',
    footerCopyright: '© 2026 ფსიქოსინთეზის ქართული ინსტიტუტი. ყველა უფლება დაცულია.',
    footerContactEmail: 'info@psychosynthesis.ge',
    footerContactPhone: '+995 32 2 100 200'
  });

  useEffect(() => {
    fetchSiteSettings();
  }, []);

  const fetchSiteSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data) setSiteSettings((prev: any) => ({ ...prev, ...res.data }));
    } catch (err) {
      console.error('Failed to fetch site settings', err);
    }
  };

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

  // --- SECRET ADMIN URL & SESSION LISTENER ---
  useEffect(() => {
    const handleRouteCheck = async () => {
      const href = window.location.href;
      const hash = window.location.hash;
      const search = window.location.search;

      const isAdminAttempt = 
        href.includes('admin') || 
        href.includes('gip_sec_admin_token') || 
        href.includes('sec-admin') ||
        hash.includes('admin') ||
        search.includes('admin');

      if (isAdminAttempt) {
        setCurrentPage('admin');
        setShow404Page(false);
      }
    };

    handleRouteCheck();
    window.addEventListener('popstate', handleRouteCheck);
    window.addEventListener('hashchange', handleRouteCheck);
    return () => {
      window.removeEventListener('popstate', handleRouteCheck);
      window.removeEventListener('hashchange', handleRouteCheck);
    };
  }, []);

  const handleAdminLogout = async () => {
    try {
      await api.post('/admin/logout');
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      setCurrentPage('home');
      window.history.replaceState({}, '', '/psychosynthesis/');
    }
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

  const navigateTo = (page: string, scrollToId?: string) => {
    setShow404Page(false);
    if (page.startsWith('custom-')) {
      const slug = page.replace('custom-', '');
      setCustomPageSlug(slug);
      setCurrentPage('dynamic');
    } else {
      setCustomPageSlug(null);
      if (page === 'workspace' && !token) {
        setCurrentPage('login');
      } else {
        setCurrentPage(page);
      }
    }

    if (scrollToId) {
      setTimeout(() => {
        const element = document.getElementById(scrollToId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // --- RENDER 404 PAGE IF UNAUTHORIZED ADMIN ROUTE ACCESSED ---
  if (show404Page) {
    return (
      <div className="min-h-screen bg-[#00241a] text-[#fbf9f3] flex flex-col justify-center items-center p-6 text-center">
        <div className="space-y-4 max-w-md">
          <h1 className="text-6xl font-bold font-display-lg text-white">404</h1>
          <h2 className="text-xl font-bold text-[#c7a85b]">Page Not Found</h2>
          <p className="text-xs text-[#a4d0be]">The requested URL was not found on this server.</p>
          <button
            onClick={() => {
              setShow404Page(false);
              navigateTo('home');
            }}
            className="mt-4 bg-[#c7a85b] text-[#00241a] font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-[#ffdf95] transition-all cursor-pointer shadow-lg"
          >
            Back to Website
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER ADMIN DASHBOARD ---
  if (currentPage === 'admin') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#00241a] text-[#c7a85b] flex items-center justify-center font-bold text-xs">Loading Admin Panel...</div>}>
        <AdminDashboard onLogout={handleAdminLogout} onNavigateHome={() => navigateTo('home')} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-main flex flex-col justify-between selection:bg-tertiary selection:text-on-tertiary font-body-md overflow-x-hidden">
      {/* Public Navigation Header */}
      <header className="bg-[#0B251C] text-[#E2EFE9] sticky top-0 w-full z-50 shadow-md border-b border-white/10 transition-all">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 flex justify-between items-center py-4">
          {/* Brand Title */}
          <button
            onClick={() => navigateTo('home')}
            className="font-serif text-[#E2EFE9] text-xl md:text-2xl font-bold leading-tight tracking-tight text-left hover:opacity-90 transition-opacity cursor-pointer whitespace-pre-line"
          >
            {siteSettings.siteTitle || 'Georgian\nInstitute of\nPsychosynthesis'}
          </button>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => navigateTo('home')}
              className={`transition-colors cursor-pointer py-1 ${
                currentPage === 'home'
                  ? 'text-[#C7A85B] border-b-2 border-[#C7A85B] font-bold'
                  : 'text-[#E2EFE9]/90 hover:text-[#C7A85B]'
              }`}
            >
              {siteSettings.navHome || 'მთავარი'}
            </button>

            {/* About Dropdown */}
            <div className="group relative">
              <button 
                className={`transition-colors flex items-center gap-1 cursor-pointer py-1 ${
                  currentPage === 'founder' ? 'text-[#C7A85B] font-bold' : 'text-[#E2EFE9]/90 hover:text-[#C7A85B]'
                }`}
              >
                {siteSettings.navAboutDropdown || 'ჩვენ შესახებ'} <span className="material-symbols-outlined text-xs">expand_more</span>
              </button>
              <div className="absolute top-full left-0 mt-2 w-52 bg-[#0B251C] text-white shadow-2xl rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 border border-white/15 p-1">
                <button 
                  onClick={() => navigateTo('home', 'about-philosophy')}
                  className="w-full text-left block px-4 py-2.5 text-xs hover:bg-white/10 rounded-lg text-[#E2EFE9] transition-colors"
                >
                  {siteSettings.navHistory || 'ინსტიტუტის ისტორია'}
                </button>
                <button 
                  onClick={() => navigateTo('founder')}
                  className="w-full text-left block px-4 py-2.5 text-xs hover:bg-white/10 rounded-lg text-[#E2EFE9] transition-colors font-bold"
                >
                  {siteSettings.navFounder || 'დამფუძნებელი'}
                </button>
              </div>
            </div>

            <button
              onClick={() => navigateTo('home', 'about-philosophy')}
              className="text-[#E2EFE9]/90 hover:text-[#C7A85B] transition-colors cursor-pointer py-1"
            >
              {siteSettings.navPsychosynthesisAbout || 'ფსიქოსინთეზის შესახებ'}
            </button>

            <button
              onClick={() => navigateTo('academic')}
              className={`transition-colors cursor-pointer py-1 ${
                currentPage === 'academic' ? 'text-[#C7A85B] font-bold' : 'text-[#E2EFE9]/90 hover:text-[#C7A85B]'
              }`}
            >
              {siteSettings.navAcademic || 'აკადემიური პორტალი'}
            </button>

            <button
              onClick={() => navigateTo('custom-resources')}
              className="text-[#E2EFE9]/90 hover:text-[#C7A85B] transition-colors cursor-pointer py-1"
            >
              {siteSettings.navResources || 'რესურსები'}
            </button>

            <button
              onClick={() => navigateTo('events')}
              className={`transition-colors whitespace-nowrap cursor-pointer py-1 ${
                currentPage === 'events' ? 'text-[#C7A85B] border-b-2 border-[#C7A85B] font-bold' : 'text-[#E2EFE9]/90 hover:text-[#C7A85B]'
              }`}
            >
              {siteSettings.navEvents || 'ღონისძიებები'}
            </button>
          </nav>

          {/* User Auth Buttons */}
          <div className="flex items-center gap-4">
            {token && currentUser ? (
              <div className="flex items-center gap-2">
                <span className="hidden md:inline text-xs border border-white/20 px-3 py-1.5 rounded-full text-white bg-white/5">
                  <User size={12} className="inline mr-1 text-[#C7A85B]" />
                  {currentUser.name}
                </span>
                <button
                  onClick={handleUserLogout}
                  className="bg-white/10 hover:bg-[#C7A85B] text-white hover:text-slate-950 px-3.5 py-1.5 rounded-full font-bold transition-all text-xs border border-white/20 cursor-pointer"
                >
                  გამოსვლა
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigateTo('login')}
                className="bg-[#C7A85B] text-slate-950 px-5 py-1.5 rounded-full font-bold text-xs hover:brightness-110 transition-all cursor-pointer shadow-sm"
              >
                შესვლა
              </button>
            )}
          </div>
        </div>
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
            {currentPage === 'home' && <Home onNavigate={navigateTo} siteSettings={siteSettings} />}
            {currentPage === 'academic' && <AcademicLibrary />}
            {currentPage === 'events' && <Events onNavigate={navigateTo} />}
            {currentPage === 'practice' && <PracticeRoom isAuthenticated={!!token} />}
            {currentPage === 'founder' && <Founder />}
            {currentPage === 'workspace' && <Dashboard />}
            {currentPage === 'login' && <Login onLoginSuccess={handleLoginSuccess} />}
            {currentPage === 'dynamic' && customPageSlug && (
              <DynamicPage slug={customPageSlug} onNavigateHome={() => navigateTo('home')} />
            )}
          </>
        )}
      </main>

      {/* Public Footer */}
      <footer id="footer-section" className="bg-background text-text-main w-full py-section-gap-md px-gutter flex flex-col md:flex-row justify-between items-start gap-12 border-t border-outline/10 relative z-20">
        <div className="max-w-xs space-y-6">
          <div className="font-headline-md text-headline-md text-tertiary font-bold leading-tight">
            {siteSettings.siteTitle}
          </div>
          <p className="text-text-muted font-body-md text-body-md leading-relaxed">
            {siteSettings.aboutText}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-16">
          <div className="flex flex-col gap-4">
            <h4 className="text-tertiary font-bold font-label-md text-label-md mb-2">ნავიგაცია</h4>
            <button onClick={() => navigateTo('home')} className="text-text-muted hover:text-tertiary transition-colors font-label-md text-label-md text-left cursor-pointer">{siteSettings.navHome}</button>
            <button onClick={() => navigateTo('founder')} className="text-text-muted hover:text-tertiary transition-colors font-label-md text-label-md text-left cursor-pointer">{siteSettings.navFounder}</button>
            <button onClick={() => navigateTo('academic')} className="text-text-muted hover:text-tertiary transition-colors font-label-md text-label-md text-left cursor-pointer">{siteSettings.navAcademic}</button>
            <button onClick={() => navigateTo('events')} className="text-text-muted hover:text-tertiary transition-colors font-label-md text-label-md text-left cursor-pointer">{siteSettings.navEvents}</button>
            <button onClick={() => setCurrentPage('admin')} className="text-[#c7a85b]/70 hover:text-[#c7a85b] transition-colors font-label-md text-xs text-left cursor-pointer font-bold pt-2 border-t border-white/10">⚙ ადმინ პანელი</button>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="text-tertiary font-bold font-label-md text-label-md mb-2">საკონტაქტო</h4>
            <p className="text-text-muted text-label-md">{siteSettings.footerContactPhone}</p>
            <p className="text-text-muted text-label-md">{siteSettings.footerContactEmail}</p>
          </div>
        </div>

        <div className="w-full md:w-auto mt-12 md:mt-0 pt-12 md:pt-0 border-t md:border-none border-outline/10">
          <p className="text-text-muted text-label-md mb-4 opacity-60">
            {siteSettings.footerCopyright}
          </p>
        </div>
      </footer>
    </div>
  );
}
