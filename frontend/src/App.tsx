import { useState, useEffect, lazy, Suspense } from 'react';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { PracticeRoom } from './pages/PracticeRoom';
import { AcademicLibrary } from './pages/AcademicLibrary';
import { Login } from './pages/Login';
import { Founder } from './pages/Founder';
import { Events } from './pages/Events';
import api from './api';
import { User, Shield, Lock, ArrowLeft } from 'lucide-react';

const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; name: string; role?: string } | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(!!token);

  // Admin login credentials form state for the secret link
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  const [siteSettings, setSiteSettings] = useState({
    siteTitle: 'Georgian Institute of Psychosynthesis',
    navHome: 'მთავარი',
    navAboutDropdown: 'ჩვენ შესახებ',
    navHistory: 'ინსტიტუტის ისტორია',
    navFounder: 'დამფუძნებელი',
    navTrainers: 'ტრენერები',
    navPsychosynthesisAbout: 'ფსიქოსინთეზის შესახებ',
    navProgramDropdown: 'სასწავლო პროგრამა',
    navAcademic: 'აკადემიური პორტალი',
    navResources: 'რესურსები',
    navEvents: 'ღონისძიებები',
    navPractice: 'მედიტაცია',
    navWorkspace: 'სამუშაო სივრცე',
    navContact: 'კონტაქტი',
    academicCoursesTab: 'აკადემიური კურსები',
    academicLibraryTab: 'ბიბლიოთეკა',
    academicBlogsTab: 'ბლოგები და პუბლიკაციები',
    academicTitle: 'აკადემიური პორტალი',
    academicSubtitle: 'გაიღრმავეთ ცოდნა ფსიქოსინთეზის თეორიაში.',
    eventsTitle: 'საჯარო აქტივობები & ღონისძიებები',
    eventsSubtitle: 'გაეცანით ჩვენს უახლოეს სემინარებსა და კურსებს.',
    practiceTitle: 'მედიტაციისა და თვითშემეცნების ოთახი',
    practiceSubtitle: 'შინაგანი მშვიდობისა და ცნობიერების პრაქტიკები.',
    founderTitle: 'რობერტო ასაჯიოლი & დამფუძნებლები',
    founderSubtitle: 'ფსიქოსინთეზის ფუძემდებლის ცხოვრება და მემკვიდრეობა.',
    heroTitle: 'სულის მთლიანობისა და პიროვნული ჰარმონიის გზა',
    heroSubtitle: 'ფსიქოსინთეზის ქართული ინსტიტუტი გიწვევთ თვითშემეცნების სიღრმეებში, სადაც აკადემიური ცოდნა და სულიერი პრაქტიკა ერთიანდება.',
    heroCtaButton: 'დაიწყე მოგზაურობა',
    aboutTitle: 'ინსტიტუტის შესახებ',
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
      if (res.data) setSiteSettings(prev => ({ ...prev, ...res.data }));
    } catch (err) {
      console.error('Failed to fetch site settings', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  // Dedicated admin route listener (/admin, /adminpanel, or #admin)
  useEffect(() => {
    const checkAdminRoute = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (
        path.endsWith('/admin') ||
        path.endsWith('/adminpanel') ||
        hash === '#admin' ||
        hash === '#adminpanel' ||
        hash === '#sec-admin-p913x-psychosyntesis-2026' ||
        hash === '#sec-admin-p913x-psychosynthesis-2026' ||
        hash === '#gip-admin-sec-913x99-key-portal' ||
        hash === '#admin-secret'
      ) {
        setCurrentPage('admin');
      }
    };
    checkAdminRoute();
    window.addEventListener('hashchange', checkAdminRoute);
    window.addEventListener('popstate', checkAdminRoute);
    return () => {
      window.removeEventListener('hashchange', checkAdminRoute);
      window.removeEventListener('popstate', checkAdminRoute);
    };
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Failed to fetch profile, clearing token');
      handleLogout();
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername || !adminPassword) {
      setAdminAuthError('გთხოვთ შეავსოთ ადმინისტრატორის სახელი და პაროლი');
      return;
    }

    setAdminSubmitting(true);
    setAdminAuthError('');

    try {
      const response = await api.post('/auth/login', { username: adminUsername, password: adminPassword });
      const loggedUser = response.data.user;
      
      if (loggedUser.role !== 'admin' && loggedUser.username !== 'admin') {
        setAdminAuthError('წვდომა უარყოფილია: აღნიშნულ მომხმარებელს არ აქვს ადმინისტრატორის უფლებები.');
        return;
      }

      localStorage.setItem('token', response.data.token);
      setToken(response.data.token);
      setCurrentUser(loggedUser);
      setCurrentPage('admin');
    } catch (err: any) {
      setAdminAuthError(err.response?.data?.message || 'არასწორი ადმინისტრატორის მონაცემები');
    } finally {
      setAdminSubmitting(false);
    }
  };

  const handleLoginSuccess = (newToken: string, user: { id: string; username: string; name: string; role?: string }) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setCurrentUser(user);
    if (user.role === 'admin') {
      setCurrentPage('admin');
    } else {
      setCurrentPage('workspace');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    setCurrentPage('home');
    if (window.location.hash.includes('admin')) {
      window.location.hash = '';
    }
  };

  const navigateTo = (page: string, scrollToId?: string) => {
    if (page === 'workspace' && !token) {
      setCurrentPage('login');
    } else {
      setCurrentPage(page);
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

  // Render Admin Panel if authenticated as admin; else render Secret Admin Login Portal
  if (currentPage === 'admin') {
    if (currentUser && currentUser.role === 'admin') {
      return (
        <Suspense fallback={<div className="min-h-screen bg-[#00241a] text-[#c7a85b] flex items-center justify-center font-bold text-sm">იტვირთება ადმინისტრატორის პანელი...</div>}>
          <AdminDashboard onLogout={handleLogout} onNavigateHome={() => navigateTo('home')} />
        </Suspense>
      );
    }

    return (
      <div className="min-h-screen bg-[#00241a] text-[#fbf9f3] flex flex-col justify-center items-center p-6 selection:bg-[#c7a85b] selection:text-[#00241a]">
        <div className="max-w-md w-full bg-[#0f3b2e] border border-[#c7a85b]/30 rounded-3xl p-8 md:p-10 shadow-2xl space-y-6 text-left relative">
          <button 
            onClick={() => navigateTo('home')}
            className="absolute top-6 right-6 text-[#a4d0be] hover:text-[#c7a85b] transition-all flex items-center gap-1 text-xs font-bold"
          >
            <ArrowLeft size={14} /> მთავარი
          </button>

          <div className="text-center space-y-3 pt-2">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#00241a] text-[#c7a85b] rounded-2xl border border-[#c7a85b]/30 shadow-lg">
              <Shield size={32} />
            </div>
            <h2 className="text-2xl font-bold font-display-lg text-white">ადმინისტრატორის პორტალი</h2>
            <p className="text-xs text-[#a4d0be] max-w-xs mx-auto leading-relaxed">
              წვდომა დაშვებულია მხოლოდ ავტორიზებული 3 ადმინისტრატორისთვის
            </p>
          </div>

          <form onSubmit={handleAdminFormSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#c7a85b]">ადმინისტრატორის მომხმარებელი</label>
              <input
                type="text"
                className="w-full bg-[#00241a] border border-[#c7a85b]/40 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#c7a85b]"
                placeholder="admin, admin2, or admin3"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#c7a85b]">პაროლი</label>
              <input
                type="password"
                className="w-full bg-[#00241a] border border-[#c7a85b]/40 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#c7a85b]"
                placeholder="••••••••"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
              />
            </div>

            {adminAuthError && (
              <p className="text-xs text-red-400 font-bold text-center p-2 bg-red-950/40 border border-red-800/50 rounded-xl">
                {adminAuthError}
              </p>
            )}

            <button
              type="submit"
              disabled={adminSubmitting}
              className="w-full bg-[#c7a85b] text-[#503d00] font-bold text-sm py-3.5 rounded-xl hover:bg-[#ffdf95] transition-all disabled:opacity-50 shadow-lg cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              <Lock size={16} />
              {adminSubmitting ? 'მოწმდება უფლებები...' : 'ადმინ პანელში შესვლა'}
            </button>
          </form>

          <p className="text-[10px] text-center text-[#a4d0be]/60 pt-2 border-t border-white/10">
            © ფსიქოსინთეზის ქართული ინსტიტუტი • დაცული სესია
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-main flex flex-col justify-between selection:bg-tertiary selection:text-on-tertiary font-body-md overflow-x-hidden">
      {/* Public Navigation Header (Matching exact design layout) */}
      <header className="bg-[#0B251C] text-[#E2EFE9] sticky top-0 w-full z-50 shadow-md border-b border-white/10 transition-all">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 flex justify-between items-center py-4">
          {/* Brand Title (Left Stacked Serif) */}
          <button
            onClick={() => navigateTo('home')}
            className="font-serif text-[#E2EFE9] text-xl md:text-2xl font-bold leading-tight tracking-tight text-left hover:opacity-90 transition-opacity cursor-pointer whitespace-pre-line"
          >
            {siteSettings.siteTitle || 'Georgian\nInstitute of\nPsychosynthesis'}
          </button>
          
          {/* Center-Right Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
            {/* 1. მთავარი */}
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

            {/* 2. ჩვენ შესახებ (Dropdown) */}
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
                <button 
                  onClick={() => navigateTo('founder', 'trainers')}
                  className="w-full text-left block px-4 py-2.5 text-xs hover:bg-white/10 rounded-lg text-[#E2EFE9] transition-colors"
                >
                  {siteSettings.navTrainers || 'ტრენერები'}
                </button>
              </div>
            </div>

            {/* 3. ფსიქოსინთეზის შესახებ */}
            <button
              onClick={() => navigateTo('home', 'about-philosophy')}
              className="text-[#E2EFE9]/90 hover:text-[#C7A85B] transition-colors cursor-pointer py-1"
            >
              {siteSettings.navPsychosynthesisAbout || 'ფსიქოსინთეზის შესახებ'}
            </button>

            {/* 4. სასწავლო პროგრამა (Dropdown) */}
            <div className="group relative">
              <button 
                className={`transition-colors flex items-center gap-1 cursor-pointer py-1 ${
                  currentPage === 'academic' ? 'text-[#C7A85B] font-bold' : 'text-[#E2EFE9]/90 hover:text-[#C7A85B]'
                }`}
              >
                {siteSettings.navProgramDropdown || 'სასწავლო პროგრამა'} <span className="material-symbols-outlined text-xs">expand_more</span>
              </button>
              <div className="absolute top-full left-0 mt-2 w-56 bg-[#0B251C] text-white shadow-2xl rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 border border-white/15 p-1">
                <button 
                  onClick={() => navigateTo('academic')}
                  className="w-full text-left block px-4 py-2.5 text-xs hover:bg-white/10 rounded-lg text-[#E2EFE9] transition-colors"
                >
                  {siteSettings.academicCoursesTab || 'აკადემიური კურსები'}
                </button>
                <button 
                  onClick={() => navigateTo('academic')}
                  className="w-full text-left block px-4 py-2.5 text-xs hover:bg-white/10 rounded-lg text-[#E2EFE9] transition-colors"
                >
                  {siteSettings.academicLibraryTab || 'ბიბლიოთეკა'}
                </button>
                <button 
                  onClick={() => navigateTo('academic')}
                  className="w-full text-left block px-4 py-2.5 text-xs hover:bg-white/10 rounded-lg text-[#E2EFE9] transition-colors"
                >
                  {siteSettings.academicBlogsTab || 'ბლოგები და პუბლიკაციები'}
                </button>
              </div>
            </div>

            {/* 5. რესურსები */}
            <button
              onClick={() => navigateTo('academic')}
              className="text-[#E2EFE9]/90 hover:text-[#C7A85B] transition-colors cursor-pointer py-1"
            >
              {siteSettings.navResources || 'რესურსები'}
            </button>

            {/* 6. ღონისძიებები */}
            <button
              onClick={() => navigateTo('events')}
              className={`transition-colors whitespace-nowrap cursor-pointer py-1 ${
                currentPage === 'events' ? 'text-[#C7A85B] border-b-2 border-[#C7A85B] font-bold' : 'text-[#E2EFE9]/90 hover:text-[#C7A85B]'
              }`}
            >
              {siteSettings.navEvents || 'ღონისძიებები'}
            </button>

            {/* 7. კონტაქტი */}
            <button
              onClick={() => {
                const footer = document.querySelector('footer');
                if (footer) footer.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-[#E2EFE9]/90 hover:text-[#C7A85B] transition-colors whitespace-nowrap cursor-pointer py-1"
            >
              {siteSettings.navContact || 'კონტაქტი'}
            </button>
          </nav>

          {/* Search Bar (Far Right Pill) */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">search</span>
              <input 
                className="bg-black/30 border border-white/15 rounded-full py-1.5 pl-9 pr-4 text-xs text-white placeholder:text-white/50 focus:ring-1 focus:ring-[#C7A85B] focus:outline-none w-36 md:w-44 transition-all"
                placeholder="ძებნა..." 
                type="text" 
                onClick={() => navigateTo('academic')}
              />
            </div>

            {token && currentUser ? (
              <div className="flex items-center gap-2">
                <span className="hidden md:inline text-xs border border-white/20 px-3 py-1.5 rounded-full text-white bg-white/5">
                  <User size={12} className="inline mr-1 text-[#C7A85B]" />
                  {currentUser.name}
                </span>
                <button
                  onClick={handleLogout}
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
          <div className="flex gap-4">
            <a className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center hover:bg-tertiary hover:text-on-tertiary transition-colors cursor-pointer" href="#">
              <span className="material-symbols-outlined text-sm">face_nod</span>
            </a>
            <a className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center hover:bg-tertiary hover:text-on-tertiary transition-colors cursor-pointer" href={`mailto:${siteSettings.footerContactEmail}`}>
              <span className="material-symbols-outlined text-sm">mail</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-16">
          <div className="flex flex-col gap-4">
            <h4 className="text-tertiary font-bold font-label-md text-label-md mb-2">ნავიგაცია</h4>
            <button onClick={() => navigateTo('home')} className="text-text-muted hover:text-tertiary transition-colors font-label-md text-label-md text-left cursor-pointer">{siteSettings.navHome}</button>
            <button onClick={() => navigateTo('founder')} className="text-text-muted hover:text-tertiary transition-colors font-label-md text-label-md text-left cursor-pointer">{siteSettings.navFounder}</button>
            <button onClick={() => navigateTo('academic')} className="text-text-muted hover:text-tertiary transition-colors font-label-md text-label-md text-left cursor-pointer">{siteSettings.navAcademic}</button>
            <button onClick={() => navigateTo('events')} className="text-text-muted hover:text-tertiary transition-colors font-label-md text-label-md text-left cursor-pointer">{siteSettings.navEvents}</button>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="text-tertiary font-bold font-label-md text-label-md mb-2">საკონტაქტო</h4>
            <p className="text-text-muted text-label-md">თბილისი, საქართველო</p>
            <p className="text-text-muted text-label-md">{siteSettings.footerContactPhone}</p>
            <p className="text-text-muted text-label-md">{siteSettings.footerContactEmail}</p>
          </div>
        </div>

        <div className="w-full md:w-auto mt-12 md:mt-0 pt-12 md:pt-0 border-t md:border-none border-outline/10">
          <p className="text-text-muted text-label-md mb-4 opacity-60">
            {siteSettings.footerCopyright}
          </p>
          <div className="flex gap-6">
            <a className="text-text-muted hover:text-tertiary text-label-md underline underline-offset-4" href="#">კონფიდენციალურობა</a>
            <a className="text-text-muted hover:text-tertiary text-label-md underline underline-offset-4" href="#">წესები და პირობები</a>
          </div>
        </div>
      </footer>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-outline/20 h-16 flex items-center justify-around z-50 px-4">
        <button 
          onClick={() => navigateTo('home')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            currentPage === 'home' ? 'text-tertiary' : 'text-text-muted hover:text-tertiary'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${currentPage === 'home' ? 1 : 0}` }}>home</span>
          <span className="text-[10px] font-label-md">მთავარი</span>
        </button>
        <button 
          onClick={() => navigateTo('academic')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            currentPage === 'academic' ? 'text-tertiary' : 'text-text-muted hover:text-tertiary'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${currentPage === 'academic' ? 1 : 0}` }}>school</span>
          <span className="text-[10px] font-label-md">აკადემია</span>
        </button>
        <button 
          onClick={() => navigateTo('events')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            currentPage === 'events' ? 'text-tertiary' : 'text-text-muted hover:text-tertiary'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${currentPage === 'events' ? 1 : 0}` }}>event</span>
          <span className="text-[10px] font-label-md">ღონისძიება</span>
        </button>
      </div>
    </div>
  );
}
