import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  LayoutDashboard, FileText, Layers, Home as HomeIcon, Image as ImageIcon, 
  Users, Menu as MenuIcon, Settings as SettingsIcon, History, LogOut, 
  Globe, Plus, Trash2, Edit, X, Search, Eye, Copy, 
  ArrowUp, ArrowDown, Sparkles, ShieldCheck, ChevronRight
} from 'lucide-react';
import { RichTextEditor } from '../components/RichTextEditor';
import { MediaLibraryModal } from '../components/MediaLibraryModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { PostPreviewModal } from '../components/PostPreviewModal';

interface Post {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  featuredImage?: string;
  category: string;
  tags: string[];
  author: string;
  publishDate: string;
  status: 'draft' | 'published' | 'hidden';
  featured: boolean;
  visibility: 'public' | 'private';
  displayLocations: string[];
  seoTitle?: string;
  seoDescription?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  heroImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  status: 'published' | 'draft' | 'hidden';
  navVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

interface HomepageSection {
  id: string;
  sectionKey: 'hero' | 'intro' | 'featured_content' | 'latest_articles' | 'cta' | 'custom';
  title: string;
  subtitle?: string;
  content?: string;
  ctaText?: string;
  ctaLink?: string;
  imageUrl?: string;
  bgImageUrl?: string;
  isVisible: boolean;
  sortOrder: number;
}

interface NavigationItem {
  id: string;
  label: string;
  url: string;
  isExternal: boolean;
  isVisible: boolean;
  sortOrder: number;
}

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  altText?: string;
  createdAt: string;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  status: 'active' | 'disabled';
  createdAt: string;
}

interface ActivityLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  details: string;
  timestamp: string;
}

interface OverviewData {
  totalUsers: number;
  publishedPosts: number;
  draftPosts: number;
  totalPages: number;
  recentActivity: ActivityLogItem[];
  recentRegistrations: any[];
}

interface AdminDashboardProps {
  onLogout: () => void;
  onNavigateHome: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, onNavigateHome }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Overview State
  const [overview, setOverview] = useState<OverviewData | null>(null);

  // Posts State
  const [posts, setPosts] = useState<Post[]>([]);
  const [postSearch, setPostSearch] = useState('');
  const [postCategoryFilter, setPostCategoryFilter] = useState('all');
  const [editingPost, setEditingPost] = useState<Partial<Post> | null>(null);
  const [isPostFormOpen, setIsPostFormOpen] = useState(false);

  // Pages State
  const [pages, setPages] = useState<Page[]>([]);
  const [editingPage, setEditingPage] = useState<Partial<Page> | null>(null);
  const [isPageFormOpen, setIsPageFormOpen] = useState(false);

  // Homepage Sections State
  const [sections, setSections] = useState<HomepageSection[]>([]);

  // Navigation State
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);

  // Media Library State
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaTargetField, setMediaTargetField] = useState<'postFeatured' | 'pageHero' | 'sectionImage' | 'sectionBg' | 'editor' | null>(null);
  const [mediaTargetSectionIndex, setMediaTargetSectionIndex] = useState<number | null>(null);

  // Users State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Settings State
  const [siteSettings, setSiteSettings] = useState<any>({});

  // Activity Log State
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);

  // Preview & Confirm Modal States
  const [previewPost, setPreviewPost] = useState<any | null>(null);
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Unsaved Changes Guard
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    fetchOverview();
    fetchPosts();
    fetchPages();
    fetchSections();
    fetchNavigation();
    fetchMedia();
    fetchUsers();
    fetchSettings();
    fetchActivity();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --- API FETCHERS ---
  const fetchOverview = async () => {
    try {
      const res = await api.get('/admin/cms-overview');
      if (res.data) setOverview(res.data);
    } catch (err) {
      console.error('Error fetching overview', err);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await api.get('/admin/posts');
      if (res.data && Array.isArray(res.data)) setPosts(res.data);
    } catch (err) {
      console.error('Error fetching posts', err);
    }
  };

  const fetchPages = async () => {
    try {
      const res = await api.get('/admin/pages');
      if (res.data && Array.isArray(res.data)) setPages(res.data);
    } catch (err) {
      console.error('Error fetching pages', err);
    }
  };

  const fetchSections = async () => {
    try {
      const res = await api.get('/admin/homepage-sections');
      if (res.data && Array.isArray(res.data)) setSections(res.data);
    } catch (err) {
      console.error('Error fetching homepage sections', err);
    }
  };

  const fetchNavigation = async () => {
    try {
      const res = await api.get('/admin/navigation');
      if (res.data && Array.isArray(res.data)) setNavigationItems(res.data);
    } catch (err) {
      console.error('Error fetching navigation', err);
    }
  };

  const fetchMedia = async () => {
    try {
      const res = await api.get('/admin/media');
      if (res.data && Array.isArray(res.data)) setMediaList(res.data);
    } catch (err) {
      console.error('Error fetching media', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      if (res.data && Array.isArray(res.data)) setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      if (res.data) setSiteSettings(res.data);
    } catch (err) {
      console.error('Error fetching settings', err);
    }
  };

  const fetchActivity = async () => {
    try {
      const res = await api.get('/admin/activity');
      if (res.data && Array.isArray(res.data)) setActivityLogs(res.data);
    } catch (err) {
      console.error('Error fetching activity', err);
    }
  };

  // --- POST ACTIONS ---
  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost?.title) return;

    try {
      if (editingPost.id) {
        await api.put(`/admin/posts/${editingPost.id}`, editingPost);
        showToast('Post updated successfully!');
      } else {
        await api.post('/admin/posts', editingPost);
        showToast('Post created successfully!');
      }
      setIsPostFormOpen(false);
      setEditingPost(null);
      setHasUnsavedChanges(false);
      fetchPosts();
      fetchOverview();
      fetchActivity();
    } catch (err) {
      showToast('Error saving post');
    }
  };

  const handleDuplicatePost = async (id: string) => {
    try {
      await api.post(`/admin/posts/${id}/duplicate`);
      showToast('Post duplicated!');
      fetchPosts();
      fetchOverview();
    } catch (err) {
      showToast('Error duplicating post');
    }
  };

  const handleDeletePost = (id: string, title: string) => {
    setConfirmModalState({
      isOpen: true,
      title: 'Delete Post',
      message: `Are you sure you want to delete post "${title}"?`,
      onConfirm: async () => {
        try {
          await api.delete(`/admin/posts/${id}`);
          showToast('Post deleted');
          fetchPosts();
          fetchOverview();
          fetchActivity();
        } catch (err) {
          showToast('Error deleting post');
        }
      }
    });
  };

  const handleReorderPosts = async (direction: 'up' | 'down', index: number) => {
    const newPosts = [...posts];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newPosts.length) return;

    const temp = newPosts[index];
    newPosts[index] = newPosts[targetIdx];
    newPosts[targetIdx] = temp;

    setPosts(newPosts);
    try {
      await api.put('/admin/posts/reorder', { orderedIds: newPosts.map(p => p.id) });
      showToast('Post order saved');
    } catch (err) {
      fetchPosts();
    }
  };

  // --- PAGE ACTIONS ---
  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPage?.title || !editingPage?.slug) return;

    try {
      if (editingPage.id) {
        await api.put(`/admin/pages/${editingPage.id}`, editingPage);
        showToast('Page updated successfully!');
      } else {
        await api.post('/admin/pages', editingPage);
        showToast('Page created successfully!');
      }
      setIsPageFormOpen(false);
      setEditingPage(null);
      setHasUnsavedChanges(false);
      fetchPages();
      fetchOverview();
      fetchActivity();
    } catch (err) {
      showToast('Error saving page');
    }
  };

  const handleDeletePage = (id: string, title: string) => {
    setConfirmModalState({
      isOpen: true,
      title: 'Delete Page',
      message: `Are you sure you want to delete page "${title}"?`,
      onConfirm: async () => {
        try {
          await api.delete(`/admin/pages/${id}`);
          showToast('Page deleted');
          fetchPages();
          fetchOverview();
          fetchActivity();
        } catch (err) {
          showToast('Error deleting page');
        }
      }
    });
  };

  // --- HOMEPAGE SECTIONS ACTIONS ---
  const handleSaveSections = async (updatedSections: HomepageSection[]) => {
    setSections(updatedSections);
    try {
      await api.put('/admin/homepage-sections', { sections: updatedSections });
      showToast('Homepage sections updated!');
      fetchActivity();
    } catch (err) {
      showToast('Error updating sections');
      fetchSections();
    }
  };

  const handleReorderSections = async (direction: 'up' | 'down', index: number) => {
    const newSections = [...sections];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIdx];
    newSections[targetIdx] = temp;

    newSections.forEach((s, idx) => s.sortOrder = idx + 1);
    setSections(newSections);

    try {
      await api.put('/admin/homepage-sections/reorder', { orderedIds: newSections.map(s => s.id) });
      showToast('სექციების განლაგება შენახულია!');
    } catch (err) {
      fetchSections();
    }
  };

  const handleAddSection = () => {
    const newSection: HomepageSection = {
      id: `sec-${Date.now()}`,
      sectionKey: 'custom',
      title: 'ახალი სექცია',
      subtitle: 'ქვესათაური',
      content: '',
      ctaText: '',
      ctaLink: '',
      imageUrl: '',
      bgImageUrl: '',
      isVisible: true,
      sortOrder: sections.length + 1
    };
    handleSaveSections([...sections, newSection]);
  };

  const handleDeleteSection = (id: string, title: string) => {
    setConfirmModalState({
      isOpen: true,
      title: 'სექციის წაშლა',
      message: `დარწმუნებული ხართ, რომ გსურთ წაშალოთ სექცია "${title}"?`,
      onConfirm: async () => {
        const updated = sections.filter(s => s.id !== id);
        handleSaveSections(updated);
      }
    });
  };

  // --- NAVIGATION ACTIONS ---
  const handleSaveNavigation = async (items: NavigationItem[]) => {
    setNavigationItems(items);
    try {
      await api.put('/admin/navigation', { items });
      showToast('Navigation menu updated!');
      fetchActivity();
    } catch (err) {
      showToast('Error updating navigation');
      fetchNavigation();
    }
  };

  // --- USER ACTIONS ---
  const handleToggleUserStatus = async (id: string, currentStatus: 'active' | 'disabled') => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      await api.put(`/admin/users/${id}/status`, { status: newStatus });
      showToast(`User status updated to ${newStatus}`);
      fetchUsers();
      fetchOverview();
      fetchActivity();
    } catch (err) {
      showToast('Error updating user status');
    }
  };

  // --- SETTINGS ACTIONS ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/admin/settings', siteSettings);
      showToast('Site settings updated!');
      fetchActivity();
    } catch (err) {
      showToast('Error saving settings');
    }
  };

  // Media Selection Handler
  const handleMediaSelect = (url: string) => {
    if (mediaTargetField === 'postFeatured' && editingPost) {
      setEditingPost(prev => ({ ...prev, featuredImage: url }));
    } else if (mediaTargetField === 'pageHero' && editingPage) {
      setEditingPage(prev => ({ ...prev, heroImage: url }));
    } else if (mediaTargetField === 'sectionImage' && mediaTargetSectionIndex !== null) {
      const updated = [...sections];
      if (updated[mediaTargetSectionIndex]) {
        updated[mediaTargetSectionIndex].imageUrl = url;
        setSections(updated);
      }
    } else if (mediaTargetField === 'sectionBg' && mediaTargetSectionIndex !== null) {
      const updated = [...sections];
      if (updated[mediaTargetSectionIndex]) {
        updated[mediaTargetSectionIndex].bgImageUrl = url;
        setSections(updated);
      }
    } else if (mediaTargetField === 'editor' && editingPost) {
      setEditingPost(prev => ({
        ...prev,
        content: (prev?.content || '') + `\n<img src="${url}" alt="Media Image" class="w-full rounded-2xl my-4" />`
      }));
    }
  };

  // Navigation Items Sidebar List
  const navTabs = [
    { id: 'dashboard', label: 'მთავარი პანელი', icon: LayoutDashboard },
    { id: 'posts', label: 'სტატიები / პოსტები', icon: FileText, badge: posts.length },
    { id: 'pages', label: 'გვერდები', icon: Layers, badge: pages.length },
    { id: 'homepage', label: 'მთავარი გვერდის რედაქტორი', icon: HomeIcon },
    { id: 'navigation', label: 'ნავიგაციის მენიუ', icon: MenuIcon },
    { id: 'media', label: 'მედია ბიბლიოთეკა', icon: ImageIcon, badge: mediaList.length },
    { id: 'users', label: 'მომხმარებლები', icon: Users, badge: users.length },
    { id: 'settings', label: 'პარამეტრები', icon: SettingsIcon },
    { id: 'activity', label: 'მოქმედებების ჟურნალი', icon: History }
  ];

  return (
    <div className="min-h-screen bg-[#001f16] text-[#fbf9f3] flex flex-col font-body-md selection:bg-[#c7a85b] selection:text-[#00241a]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[150] bg-[#c7a85b] text-[#00241a] font-bold text-xs px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles size={16} /> {toastMessage}
        </div>
      )}

      {/* Top Header Bar */}
      <header className="bg-[#0b251c] border-b border-[#c7a85b]/20 px-6 py-3.5 flex justify-between items-center sticky top-0 z-40 shadow-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white/70 hover:text-white p-1.5"
          >
            <MenuIcon size={22} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00241a] border border-[#c7a85b]/40 flex items-center justify-center text-[#c7a85b] shadow-md">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="text-base font-bold font-display-lg text-white leading-none">ფსიქოსინთეზის ადმინისტრაცია</h1>
              <span className="text-[10px] text-[#a4d0be]/70 font-mono">დაცული სესიის სტატუსი: აქტიური</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateHome}
            className="hidden sm:flex items-center gap-1.5 text-xs text-[#a4d0be] hover:text-[#c7a85b] bg-[#00241a] border border-[#c7a85b]/30 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer font-bold"
          >
            <Globe size={14} /> საიტზე გადასვლა
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs bg-red-950/60 text-red-300 hover:bg-red-900/80 border border-red-800/40 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer font-bold"
          >
            <LogOut size={14} /> გამოსვლა
          </button>
        </div>
      </header>

      {/* Main Admin Workspace (Sidebar + Content) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className={`w-64 bg-[#0b251c] border-r border-[#c7a85b]/20 flex flex-col justify-between shrink-0 transition-all z-30 ${
          mobileMenuOpen ? 'fixed inset-y-0 left-0 pt-16 w-64' : 'hidden md:flex'
        }`}>
          <div className="p-4 space-y-1.5 overflow-y-auto">
            <div className="text-[10px] font-bold text-[#c7a85b] uppercase tracking-widest px-3 py-2">
              მართვის პანელის ნავიგაცია
            </div>

            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#c7a85b] text-[#00241a] shadow-lg scale-[1.02]'
                      : 'text-[#a4d0be] hover:bg-[#00241a] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge !== undefined && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      isActive ? 'bg-[#00241a] text-[#c7a85b]' : 'bg-[#00241a] text-[#a4d0be]'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-[#c7a85b]/15 text-center">
            <p className="text-[10px] text-[#a4d0be]/50">ფსიქოსინთეზის CMS v2.5</p>
            <p className="text-[9px] text-[#c7a85b]/70 mt-0.5">დაცული სესია</p>
          </div>
        </aside>

        {/* Content View Area */}
        <main className="flex-1 bg-[#001f16] overflow-y-auto p-4 sm:p-8 space-y-8 text-left">
          {/* ----------------- TAB 1: DASHBOARD OVERVIEW ----------------- */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold font-display-lg text-white">მთავარი პანელის მიმოხილვა</h2>
                <p className="text-xs text-[#a4d0be]">ვებ-საიტის კონტენტის სტატისტიკა და სისტემის სტატუსი</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0b251c] border border-[#c7a85b]/30 rounded-2xl p-5 shadow-xl space-y-2">
                  <div className="flex justify-between items-center text-xs text-[#a4d0be]">
                    <span>სულ მომხმარებელი</span>
                    <Users size={16} className="text-[#c7a85b]" />
                  </div>
                  <div className="text-3xl font-bold text-white font-mono">{overview?.totalUsers || users.length}</div>
                </div>

                <div className="bg-[#0b251c] border border-[#c7a85b]/30 rounded-2xl p-5 shadow-xl space-y-2">
                  <div className="flex justify-between items-center text-xs text-[#a4d0be]">
                    <span>გამოქვეყნებული სტატია</span>
                    <FileText size={16} className="text-[#c7a85b]" />
                  </div>
                  <div className="text-3xl font-bold text-[#c7a85b] font-mono">{overview?.publishedPosts || posts.filter(p => p.status === 'published').length}</div>
                </div>

                <div className="bg-[#0b251c] border border-[#c7a85b]/30 rounded-2xl p-5 shadow-xl space-y-2">
                  <div className="flex justify-between items-center text-xs text-[#a4d0be]">
                    <span>დრაფტი / ჩანაწერი</span>
                    <FileText size={16} className="text-amber-400" />
                  </div>
                  <div className="text-3xl font-bold text-amber-400 font-mono">{overview?.draftPosts || posts.filter(p => p.status === 'draft').length}</div>
                </div>

                <div className="bg-[#0b251c] border border-[#c7a85b]/30 rounded-2xl p-5 shadow-xl space-y-2">
                  <div className="flex justify-between items-center text-xs text-[#a4d0be]">
                    <span>სულ გვერდი</span>
                    <Layers size={16} className="text-[#c7a85b]" />
                  </div>
                  <div className="text-3xl font-bold text-white font-mono">{overview?.totalPages || pages.length}</div>
                </div>
              </div>

              {/* Quick Actions & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Quick Actions */}
                <div className="bg-[#0b251c] border border-[#c7a85b]/20 rounded-3xl p-6 space-y-4 shadow-xl">
                  <h3 className="text-sm font-bold text-[#c7a85b] uppercase tracking-wider">სწრაფი მოქმედებები</h3>
                  <div className="space-y-2.5">
                    <button
                      onClick={() => {
                        setEditingPost({ status: 'draft', visibility: 'public', displayLocations: ['articles'], category: 'თეორია' });
                        setIsPostFormOpen(true);
                        setActiveTab('posts');
                      }}
                      className="w-full bg-[#00241a] hover:bg-[#c7a85b] text-white hover:text-[#00241a] border border-[#c7a85b]/30 p-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <span className="flex items-center gap-2">
                        <Plus size={16} /> ახალი სტატიის / პოსტის შექმნა
                      </span>
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => {
                        setEditingPage({ status: 'published', navVisible: true });
                        setIsPageFormOpen(true);
                        setActiveTab('pages');
                      }}
                      className="w-full bg-[#00241a] hover:bg-[#c7a85b] text-white hover:text-[#00241a] border border-[#c7a85b]/30 p-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <span className="flex items-center gap-2">
                        <Layers size={16} /> ახალი გვერდის დამატება
                      </span>
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => setActiveTab('homepage')}
                      className="w-full bg-[#00241a] hover:bg-[#c7a85b] text-white hover:text-[#00241a] border border-[#c7a85b]/30 p-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <span className="flex items-center gap-2">
                        <HomeIcon size={16} /> მთავარი გვერდის რედაქტირება
                      </span>
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* Right: Recent Activity Timeline */}
                <div className="lg:col-span-2 bg-[#0b251c] border border-[#c7a85b]/20 rounded-3xl p-6 space-y-4 shadow-xl">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-[#c7a85b] uppercase tracking-wider">ბოლო ადმინისტრაციული მოქმედებები</h3>
                    <button onClick={() => setActiveTab('activity')} className="text-xs text-[#a4d0be] hover:underline">ყველას ნახვა</button>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {activityLogs.length === 0 ? (
                      <p className="text-xs text-[#a4d0be]/60 italic py-6">ადმინისტრაციული მოქმედებები არ არის ჩაწერილი.</p>
                    ) : (
                      activityLogs.slice(0, 6).map((log) => (
                        <div key={log.id} className="bg-[#00241a] p-3.5 rounded-2xl border border-white/5 flex items-center justify-between text-xs">
                          <div className="space-y-0.5">
                            <span className="font-bold text-white block">{log.action}</span>
                            <span className="text-[#a4d0be]/80 text-[11px]">{log.details}</span>
                          </div>
                          <span className="text-[10px] font-mono text-[#c7a85b]/70 shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ----------------- TAB 2: POSTS MANAGER ----------------- */}
          {activeTab === 'posts' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold font-display-lg text-white">სტატიებისა და პოსტების მართვა</h2>
                  <p className="text-xs text-[#a4d0be]">შექმენით, დაარედაქტირეთ და აკონტროლეთ კონტენტის გამოჩენის ადგილები</p>
                </div>

                <button
                  onClick={() => {
                    setEditingPost({ 
                      status: 'draft', 
                      visibility: 'public', 
                      displayLocations: ['articles'], 
                      category: 'თეორია',
                      author: 'დრ. ელენე ქვანტალიანი'
                    });
                    setIsPostFormOpen(true);
                  }}
                  className="bg-[#c7a85b] hover:bg-[#ffdf95] text-[#00241a] font-bold text-xs px-5 py-3 rounded-2xl transition-all cursor-pointer flex items-center gap-2 shadow-lg"
                >
                  <Plus size={16} /> ახალი პოსტის შექმნა
                </button>
              </div>

              {/* Filters & Search */}
              <div className="bg-[#0b251c] p-4 rounded-2xl border border-[#c7a85b]/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    placeholder="ძებნა სათაურის ან ტეგის მიხედვით..."
                    value={postSearch}
                    onChange={(e) => setPostSearch(e.target.value)}
                    className="w-full bg-[#00241a] border border-[#c7a85b]/30 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#c7a85b]"
                  />
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <select
                    value={postCategoryFilter}
                    onChange={(e) => setPostCategoryFilter(e.target.value)}
                    className="bg-[#00241a] border border-[#c7a85b]/30 text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="all">ყველა კატეგორია</option>
                    <option value="Theory">თეორია</option>
                    <option value="Practice">პრაქტიკა</option>
                    <option value="Research">კვლევა</option>
                  </select>
                </div>
              </div>

              {/* Post List */}
              <div className="bg-[#0b251c] rounded-3xl border border-[#c7a85b]/20 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-white">
                    <thead className="bg-[#00241a] text-[#c7a85b] border-b border-[#c7a85b]/20 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-4">რიგი</th>
                        <th className="p-4">სათაური და ბმული</th>
                        <th className="p-4">სტატუსი</th>
                        <th className="p-4">გამოჩენის ადგილები</th>
                        <th className="p-4">თარიღი</th>
                        <th className="p-4 text-right">მოქმედებები</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {posts
                        .filter(p => p.title.toLowerCase().includes(postSearch.toLowerCase()))
                        .map((post, idx) => (
                          <tr key={post.id} className="hover:bg-[#00241a]/60 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-1">
                                <button onClick={() => handleReorderPosts('up', idx)} className="hover:text-[#c7a85b] p-1"><ArrowUp size={14} /></button>
                                <button onClick={() => handleReorderPosts('down', idx)} className="hover:text-[#c7a85b] p-1"><ArrowDown size={14} /></button>
                              </div>
                            </td>
                            <td className="p-4 space-y-1">
                              <div className="font-bold text-white text-sm leading-snug">{post.title}</div>
                              <div className="text-[10px] text-[#a4d0be]/60 font-mono">/{post.slug}</div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                post.status === 'published' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                                post.status === 'draft' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                                'bg-gray-800 text-gray-400'
                              }`}>
                                {post.status === 'published' ? 'გამოქვეყნებული' : post.status === 'draft' ? 'დრაფტი' : 'დაფარული'}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1">
                                {(post.displayLocations || []).map((loc, lIdx) => (
                                  <span key={lIdx} className="bg-[#00241a] text-[#c7a85b] border border-[#c7a85b]/30 px-2 py-0.5 rounded-md text-[10px]">
                                    {loc}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-4 text-[11px] text-[#a4d0be]/80">
                              {new Date(post.publishDate).toLocaleDateString()}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => setPreviewPost(post)}
                                  title="წინასწარი გადახედვა"
                                  className="p-2 bg-[#00241a] text-[#a4d0be] hover:text-white rounded-xl border border-white/10"
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  onClick={() => handleDuplicatePost(post.id)}
                                  title="დუბლირება"
                                  className="p-2 bg-[#00241a] text-[#a4d0be] hover:text-white rounded-xl border border-white/10"
                                >
                                  <Copy size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingPost(post);
                                    setIsPostFormOpen(true);
                                  }}
                                  title="რედაქტირება"
                                  className="p-2 bg-[#c7a85b]/20 text-[#c7a85b] hover:bg-[#c7a85b] hover:text-[#00241a] rounded-xl font-bold transition-all"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeletePost(post.id, post.title)}
                                  title="წაშლა"
                                  className="p-2 bg-red-950/60 text-red-400 hover:bg-red-600 hover:text-white rounded-xl transition-all"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ----------------- POST EDITOR MODAL / DRAWER ----------------- */}
          {isPostFormOpen && editingPost && (
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
              <form onSubmit={handleSavePost} className="bg-[#0b251c] border border-[#c7a85b]/40 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto text-left">
                {/* Drawer Header */}
                <div className="bg-[#00241a] p-6 border-b border-[#c7a85b]/20 flex justify-between items-center sticky top-0 z-10">
                  <h3 className="text-lg font-bold text-white font-display-lg">
                    {editingPost.id ? 'სტატიის რედაქტირება' : 'ახალი სტატიის შექმნა'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPostFormOpen(false);
                      setEditingPost(null);
                    }}
                    className="text-white/60 hover:text-white p-2 rounded-xl hover:bg-white/10"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Drawer Body */}
                <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1">
                  {/* Title & Slug */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#c7a85b]">სტატიის სათაური *</label>
                      <input
                        type="text"
                        required
                        value={editingPost.title || ''}
                        onChange={(e) => setEditingPost(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full bg-[#00241a] border border-[#c7a85b]/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c7a85b]"
                        placeholder="სტატიის სათაური..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#c7a85b]">URL ბმული (Slug)</label>
                      <input
                        type="text"
                        value={editingPost.slug || ''}
                        onChange={(e) => setEditingPost(prev => ({ ...prev, slug: e.target.value }))}
                        className="w-full bg-[#00241a] border border-[#c7a85b]/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c7a85b]"
                        placeholder="statia-bmuli"
                      />
                    </div>
                  </div>

                  {/* Short Description */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#c7a85b]">მოკლე აღწერა / ანოტაცია</label>
                    <textarea
                      rows={2}
                      value={editingPost.shortDescription || ''}
                      onChange={(e) => setEditingPost(prev => ({ ...prev, shortDescription: e.target.value }))}
                      className="w-full bg-[#00241a] border border-[#c7a85b]/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#c7a85b]"
                      placeholder="მოკლე მიმოხილვა ბარათებისათვის..."
                    />
                  </div>

                  {/* CONTROL WHERE CONTENT APPEARS ("Display On") */}
                  <div className="space-y-2 p-4 bg-[#00241a] rounded-2xl border border-[#c7a85b]/30">
                    <label className="text-xs font-bold text-[#c7a85b] uppercase tracking-wider block">
                      გამოჩენის ადგილები (აირჩიეთ განთავსება)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      {[
                        { id: 'homepage_featured', label: 'მთავარი გვერდი -> რჩეული' },
                        { id: 'homepage_latest', label: 'მთავარი გვერდი -> ბოლო სტატიები' },
                        { id: 'articles', label: 'სტატიების გვერდი' },
                        { id: 'resources', label: 'რესურსების გვერდი' },
                        { id: 'custom_page', label: 'სპეციალური გვერდი' }
                      ].map((loc) => {
                        const checked = (editingPost.displayLocations || []).includes(loc.id);
                        return (
                          <label key={loc.id} className="flex items-center gap-2 cursor-pointer text-white/90 font-medium">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const current = editingPost.displayLocations || [];
                                const updated = e.target.checked
                                  ? [...current, loc.id]
                                  : current.filter(l => l !== loc.id);
                                setEditingPost(prev => ({ ...prev, displayLocations: updated }));
                              }}
                              className="rounded accent-[#c7a85b]"
                            />
                            {loc.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Featured Image & Media Library Selection */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#c7a85b]">მთავარი სურათის URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingPost.featuredImage || ''}
                        onChange={(e) => setEditingPost(prev => ({ ...prev, featuredImage: e.target.value }))}
                        className="flex-1 bg-[#00241a] border border-[#c7a85b]/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                        placeholder="https://..."
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setMediaTargetField('postFeatured');
                          setIsMediaModalOpen(true);
                        }}
                        className="bg-[#c7a85b]/20 hover:bg-[#c7a85b] text-[#c7a85b] hover:text-[#00241a] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <ImageIcon size={14} /> სურათის არჩევა
                      </button>
                    </div>
                  </div>

                  {/* WYSIWYG Rich Text Content Editor */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#c7a85b]">სრული ტექსტი (რედაქტორი)</label>
                    <RichTextEditor
                      value={editingPost.content || ''}
                      onChange={(val) => setEditingPost(prev => ({ ...prev, content: val }))}
                      onOpenMediaLibrary={() => {
                        setMediaTargetField('editor');
                        setIsMediaModalOpen(true);
                      }}
                    />
                  </div>

                  {/* Status, Category, Author, SEO */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#c7a85b]">სტატუსი</label>
                      <select
                        value={editingPost.status || 'draft'}
                        onChange={(e) => setEditingPost(prev => ({ ...prev, status: e.target.value as any }))}
                        className="w-full bg-[#00241a] border border-[#c7a85b]/30 text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                      >
                        <option value="draft">დრაფტი</option>
                        <option value="published">გამოქვეყნებული</option>
                        <option value="hidden">დაფარული</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#c7a85b]">კატეგორია</label>
                      <input
                        type="text"
                        value={editingPost.category || 'თეორია'}
                        onChange={(e) => setEditingPost(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full bg-[#00241a] border border-[#c7a85b]/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#c7a85b]">ავტორი</label>
                      <input
                        type="text"
                        value={editingPost.author || 'დრ. ელენე ქვანტალიანი'}
                        onChange={(e) => setEditingPost(prev => ({ ...prev, author: e.target.value }))}
                        className="w-full bg-[#00241a] border border-[#c7a85b]/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Drawer Footer */}
                <div className="p-4 bg-[#00241a] border-t border-[#c7a85b]/20 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setPreviewPost(editingPost)}
                    className="border border-[#c7a85b] text-[#c7a85b] font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-[#c7a85b]/20 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Eye size={15} /> პირდაპირი გადახედვა
                  </button>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPostFormOpen(false)}
                      className="px-5 py-2.5 rounded-xl border border-white/20 text-xs text-white hover:bg-white/10"
                    >
                      გაუქმება
                    </button>
                    <button
                      type="submit"
                      className="bg-[#c7a85b] hover:bg-[#ffdf95] text-[#00241a] font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-lg cursor-pointer"
                    >
                      შენახვა
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ----------------- TAB 3: PAGES MANAGER ----------------- */}
          {activeTab === 'pages' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold font-display-lg text-white">გვერდების მართვა</h2>
                  <p className="text-xs text-[#a4d0be]">შექმენით და მართეთ დინამიური გვერდები</p>
                </div>

                <button
                  onClick={() => {
                    setEditingPage({ status: 'published', navVisible: true });
                    setIsPageFormOpen(true);
                  }}
                  className="bg-[#c7a85b] hover:bg-[#ffdf95] text-[#00241a] font-bold text-xs px-5 py-3 rounded-2xl transition-all cursor-pointer flex items-center gap-2 shadow-lg"
                >
                  <Plus size={16} /> ახალი გვერდის შექმნა
                </button>
              </div>

              {/* Pages Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pages.map((page) => (
                  <div key={page.id} className="bg-[#0b251c] border border-[#c7a85b]/30 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-white font-display-lg">{page.title}</h3>
                        <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                          {page.status === 'published' ? 'გამოქვეყნებული' : page.status === 'draft' ? 'დრაფტი' : 'დაფარული'}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-[#c7a85b]">/psychosynthesis/{page.slug}</p>
                    </div>

                    <div className="flex justify-between items-center border-t border-white/10 pt-4">
                      <span className="text-[11px] text-[#a4d0be]">
                        მენიუში გამოჩენა: <strong className="text-white">{page.navVisible ? 'დიახ' : 'არა'}</strong>
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingPage(page);
                            setIsPageFormOpen(true);
                          }}
                          className="p-2 bg-[#00241a] text-[#c7a85b] rounded-xl hover:bg-[#c7a85b] hover:text-[#00241a] transition-colors"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeletePage(page.id, page.title)}
                          className="p-2 bg-red-950/60 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAGE EDITOR MODAL */}
          {isPageFormOpen && editingPage && (
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
              <form onSubmit={handleSavePage} className="bg-[#0b251c] border border-[#c7a85b]/40 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto text-left">
                <div className="bg-[#00241a] p-6 border-b border-[#c7a85b]/20 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white font-display-lg">
                    {editingPage.id ? 'გვერდის რედაქტირება' : 'ახალი გვერდის შექმნა'}
                  </h3>
                  <button type="button" onClick={() => setIsPageFormOpen(false)} className="text-white/60 hover:text-white"><X size={20} /></button>
                </div>

                <div className="p-6 md:p-8 overflow-y-auto space-y-4 flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#c7a85b]">გვერდის სათაური *</label>
                      <input
                        type="text"
                        required
                        value={editingPage.title || ''}
                        onChange={(e) => setEditingPage(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full bg-[#00241a] border border-[#c7a85b]/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                        placeholder="რესურსები..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#c7a85b]">URL ბმული (Slug) *</label>
                      <input
                        type="text"
                        required
                        value={editingPage.slug || ''}
                        onChange={(e) => setEditingPage(prev => ({ ...prev, slug: e.target.value }))}
                        className="w-full bg-[#00241a] border border-[#c7a85b]/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                        placeholder="resources"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#c7a85b]">გვერდის შინაარსი</label>
                    <RichTextEditor
                      value={editingPage.content || ''}
                      onChange={(val) => setEditingPage(prev => ({ ...prev, content: val }))}
                    />
                  </div>
                </div>

                <div className="p-4 bg-[#00241a] border-t border-[#c7a85b]/20 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsPageFormOpen(false)} className="px-5 py-2 rounded-xl text-xs border border-white/20 text-white">გაუქმება</button>
                  <button type="submit" className="bg-[#c7a85b] text-[#00241a] font-bold text-xs px-6 py-2 rounded-xl">გვერდის შენახვა</button>
                </div>
              </form>
            </div>
          )}

          {/* ----------------- TAB 4: HOMEPAGE EDITOR ----------------- */}
          {activeTab === 'homepage' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold font-display-lg text-white">მთავარი გვერდის სექციების რედაქტორი</h2>
                  <p className="text-xs text-[#a4d0be]">მართეთ სექციების ტექსტები, სურათები, ბმულები, თანმიმდევრობა და ხილვადობა</p>
                </div>

                <button
                  onClick={handleAddSection}
                  className="bg-[#c7a85b] hover:bg-[#ffdf95] text-[#00241a] font-bold text-xs px-5 py-3 rounded-2xl transition-all cursor-pointer flex items-center gap-2 shadow-lg"
                >
                  <Plus size={16} /> ახალი სექციის დამატება
                </button>
              </div>

              <div className="space-y-6">
                {sections.map((section, idx) => (
                  <div key={section.id} className="bg-[#0b251c] border border-[#c7a85b]/30 rounded-3xl p-6 shadow-xl space-y-6 text-left">
                    <div className="flex justify-between items-center border-b border-white/10 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => handleReorderSections('up', idx)} title="ზემოთ გადაადგილება" className="hover:text-[#c7a85b] p-0.5"><ArrowUp size={14} /></button>
                          <button onClick={() => handleReorderSections('down', idx)} title="ქვემოთ გადაადგილება" className="hover:text-[#c7a85b] p-0.5"><ArrowDown size={14} /></button>
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white font-display-lg capitalize">
                            {section.sectionKey === 'hero' ? 'მთავარი ბანერი (Hero)' :
                             section.sectionKey === 'intro' ? 'შესავალი / ფილოსოფია (Intro)' :
                             section.sectionKey === 'cta' ? 'მოწოდება მოქმედებისკენ (CTA)' :
                             `${section.sectionKey.replace('_', ' ')} სექცია`}
                          </h3>
                          <span className="text-[10px] text-[#c7a85b]">რიგი #{section.sortOrder}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-xs text-[#a4d0be] cursor-pointer font-bold">
                          <input
                            type="checkbox"
                            checked={section.isVisible}
                            onChange={(e) => {
                              const updated = [...sections];
                              updated[idx].isVisible = e.target.checked;
                              handleSaveSections(updated);
                            }}
                            className="rounded accent-[#c7a85b]"
                          />
                          გამოჩნდეს მთავარ გვერდზე
                        </label>

                        {section.sectionKey === 'custom' && (
                          <button
                            onClick={() => handleDeleteSection(section.id, section.title)}
                            title="სექციის წაშლა"
                            className="text-red-400 hover:text-red-300 p-1.5 rounded-xl hover:bg-red-950/50"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Section Title */}
                      <div className="space-y-1">
                        <label className="font-bold text-[#c7a85b]">სექციის სათაური</label>
                        <input
                          type="text"
                          value={section.title || ''}
                          onChange={(e) => {
                            const updated = [...sections];
                            updated[idx].title = e.target.value;
                            setSections(updated);
                          }}
                          className="w-full bg-[#00241a] border border-[#c7a85b]/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c7a85b]"
                        />
                      </div>

                      {/* Subtitle */}
                      <div className="space-y-1">
                        <label className="font-bold text-[#c7a85b]">ქვესათაური / ტეგი</label>
                        <input
                          type="text"
                          value={section.subtitle || ''}
                          onChange={(e) => {
                            const updated = [...sections];
                            updated[idx].subtitle = e.target.value;
                            setSections(updated);
                          }}
                          className="w-full bg-[#00241a] border border-[#c7a85b]/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c7a85b]"
                        />
                      </div>
                    </div>

                    {/* Content Body */}
                    <div className="space-y-1 text-xs">
                      <label className="font-bold text-[#c7a85b]">სექციის შინაარსი / აღწერა</label>
                      <textarea
                        rows={3}
                        value={section.content || ''}
                        onChange={(e) => {
                          const updated = [...sections];
                          updated[idx].content = e.target.value;
                          setSections(updated);
                        }}
                        className="w-full bg-[#00241a] border border-[#c7a85b]/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c7a85b]"
                        placeholder="სექციის დეტალური ტექსტი..."
                      />
                    </div>

                    {/* CTA Button Text & Link */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-[#c7a85b]">ღილაკის ტექსტი (CTA Text)</label>
                        <input
                          type="text"
                          value={section.ctaText || ''}
                          onChange={(e) => {
                            const updated = [...sections];
                            updated[idx].ctaText = e.target.value;
                            setSections(updated);
                          }}
                          className="w-full bg-[#00241a] border border-[#c7a85b]/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c7a85b]"
                          placeholder="მაგ: დაიწყე მოგზაურობა"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-[#c7a85b]">ღილაკის ბმული (CTA Link)</label>
                        <input
                          type="text"
                          value={section.ctaLink || ''}
                          onChange={(e) => {
                            const updated = [...sections];
                            updated[idx].ctaLink = e.target.value;
                            setSections(updated);
                          }}
                          className="w-full bg-[#00241a] border border-[#c7a85b]/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c7a85b]"
                          placeholder="workspace / academic / https://..."
                        />
                      </div>
                    </div>

                    {/* Image URL & Background Image URL */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-[#c7a85b]">სურათის URL (Image)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={section.imageUrl || ''}
                            onChange={(e) => {
                              const updated = [...sections];
                              updated[idx].imageUrl = e.target.value;
                              setSections(updated);
                            }}
                            className="flex-1 bg-[#00241a] border border-[#c7a85b]/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                            placeholder="https://..."
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setMediaTargetField('sectionImage');
                              setMediaTargetSectionIndex(idx);
                              setIsMediaModalOpen(true);
                            }}
                            className="bg-[#c7a85b]/20 hover:bg-[#c7a85b] text-[#c7a85b] hover:text-[#00241a] px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <ImageIcon size={14} /> სურათი
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-[#c7a85b]">ფონის სურათის URL (Background)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={section.bgImageUrl || ''}
                            onChange={(e) => {
                              const updated = [...sections];
                              updated[idx].bgImageUrl = e.target.value;
                              setSections(updated);
                            }}
                            className="flex-1 bg-[#00241a] border border-[#c7a85b]/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                            placeholder="https://..."
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setMediaTargetField('sectionBg');
                              setMediaTargetSectionIndex(idx);
                              setIsMediaModalOpen(true);
                            }}
                            className="bg-[#c7a85b]/20 hover:bg-[#c7a85b] text-[#c7a85b] hover:text-[#00241a] px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <ImageIcon size={14} /> ფონი
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleSaveSections(sections)}
                        className="bg-[#c7a85b] text-[#00241a] font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-[#ffdf95] transition-all cursor-pointer shadow-lg"
                      >
                        სექციის შენახვა
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ----------------- TAB 5: NAVIGATION MANAGER ----------------- */}
          {activeTab === 'navigation' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold font-display-lg text-white">მენიუს ნავიგაციის მართვა</h2>
                  <p className="text-xs text-[#a4d0be]">მართეთ ვებ-საიტის მთავარი მენიუს ელემენტები</p>
                </div>

                <button
                  onClick={() => {
                    const newItem: NavigationItem = {
                      id: `nav-${Date.now()}`,
                      label: 'ახალი ბმული',
                      url: '/',
                      isExternal: false,
                      isVisible: true,
                      sortOrder: navigationItems.length + 1
                    };
                    handleSaveNavigation([...navigationItems, newItem]);
                  }}
                  className="bg-[#c7a85b] hover:bg-[#ffdf95] text-[#00241a] font-bold text-xs px-5 py-2.5 rounded-2xl cursor-pointer"
                >
                  <Plus size={16} className="inline mr-1" /> მენიუს ელემენტის დამატება
                </button>
              </div>

              <div className="bg-[#0b251c] border border-[#c7a85b]/30 rounded-3xl p-6 space-y-4 shadow-xl">
                {navigationItems.map((item, idx) => (
                  <div key={item.id} className="bg-[#00241a] p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => {
                        const newNav = [...navigationItems];
                        if (idx > 0) {
                          const temp = newNav[idx];
                          newNav[idx] = newNav[idx - 1];
                          newNav[idx - 1] = temp;
                          handleSaveNavigation(newNav);
                        }
                      }} className="hover:text-[#c7a85b] p-1"><ArrowUp size={14} /></button>
                      <button onClick={() => {
                        const newNav = [...navigationItems];
                        if (idx < newNav.length - 1) {
                          const temp = newNav[idx];
                          newNav[idx] = newNav[idx + 1];
                          newNav[idx + 1] = temp;
                          handleSaveNavigation(newNav);
                        }
                      }} className="hover:text-[#c7a85b] p-1"><ArrowDown size={14} /></button>
                    </div>

                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => {
                        const newNav = [...navigationItems];
                        newNav[idx].label = e.target.value;
                        setNavigationItems(newNav);
                      }}
                      className="bg-[#0b251c] border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white w-36"
                    />

                    <input
                      type="text"
                      value={item.url}
                      onChange={(e) => {
                        const newNav = [...navigationItems];
                        newNav[idx].url = e.target.value;
                        setNavigationItems(newNav);
                      }}
                      className="bg-[#0b251c] border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white flex-1"
                    />

                    <button
                      onClick={() => {
                        const newNav = navigationItems.filter(n => n.id !== item.id);
                        handleSaveNavigation(newNav);
                      }}
                      className="text-red-400 hover:text-red-300 p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => handleSaveNavigation(navigationItems)}
                  className="bg-[#c7a85b] text-[#00241a] font-bold text-xs px-6 py-2.5 rounded-xl cursor-pointer"
                >
                  მენიუს შენახვა
                </button>
              </div>
            </div>
          )}

          {/* ----------------- TAB 6: MEDIA LIBRARY ----------------- */}
          {activeTab === 'media' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold font-display-lg text-white">მედია ბიბლიოთეკა</h2>
                  <p className="text-xs text-[#a4d0be]">ატვირთული სურათები და ფაილები</p>
                </div>
                <button
                  onClick={() => {
                    setMediaTargetField(null);
                    setIsMediaModalOpen(true);
                  }}
                  className="bg-[#c7a85b] text-[#00241a] font-bold text-xs px-5 py-2.5 rounded-2xl cursor-pointer"
                >
                  ატვირთვის გალერეის გახსნა
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {mediaList.map((m) => (
                  <div key={m.id} className="bg-[#0b251c] border border-white/10 rounded-2xl p-3 space-y-2">
                    <img src={m.url} alt={m.filename} className="aspect-square w-full object-cover rounded-xl" />
                    <p className="text-[10px] text-white font-mono truncate">{m.filename}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ----------------- TAB 7: USER MANAGER ----------------- */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold font-display-lg text-white">მომხმარებლების მართვა</h2>
                  <p className="text-xs text-[#a4d0be]">რეგისტრირებული მომხმარებლების ანგარიშების მართვა</p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    placeholder="ძებნა სახელით ან ელ-ფოსტით..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full bg-[#0b251c] border border-[#c7a85b]/30 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#c7a85b]"
                  />
                </div>
              </div>

              <div className="bg-[#0b251c] border border-[#c7a85b]/30 rounded-3xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs text-white">
                  <thead className="bg-[#00241a] text-[#c7a85b] border-b border-[#c7a85b]/20 font-bold uppercase">
                    <tr>
                      <th className="p-4">სახელი</th>
                      <th className="p-4">ელ-ფოსტა / მომხმარებელი</th>
                      <th className="p-4">როლი</th>
                      <th className="p-4">სტატუსი</th>
                      <th className="p-4 text-right">მოქმედებები</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users
                      .filter(u => 
                        u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                        (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase()))
                      )
                      .map((u) => (
                      <tr key={u.id} className="hover:bg-[#00241a]/60">
                        <td className="p-4 font-bold">{u.name}</td>
                        <td className="p-4 text-[#a4d0be] font-mono">{u.email || u.username}</td>
                        <td className="p-4"><span className="uppercase text-[10px] font-bold text-[#c7a85b]">{u.role}</span></td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.status === 'active' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                          }`}>
                            {u.status === 'active' ? 'აქტიური' : 'დეაქტივირებული'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleToggleUserStatus(u.id, u.status || 'active')}
                            className="bg-[#00241a] border border-white/20 px-3 py-1 rounded-xl text-xs font-bold hover:bg-white/10"
                          >
                            {u.status === 'active' ? 'დეაქტივაცია' : 'გააქტიურება'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ----------------- TAB 8: SETTINGS ----------------- */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-6 animate-fade-in max-w-3xl">
              <div>
                <h2 className="text-2xl font-bold font-display-lg text-white">საიტის გლობალური პარამეტრები</h2>
                <p className="text-xs text-[#a4d0be]">მართეთ საიტის ტექსტები, საკონტაქტო ინფორმაცია და ბრენდინგი</p>
              </div>

              <div className="bg-[#0b251c] border border-[#c7a85b]/30 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#c7a85b]">ვებ-საიტის სათაური</label>
                  <input
                    type="text"
                    value={siteSettings.siteTitle || ''}
                    onChange={(e) => setSiteSettings((prev: any) => ({ ...prev, siteTitle: e.target.value }))}
                    className="w-full bg-[#00241a] border border-[#c7a85b]/30 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#c7a85b]">საკონტაქტო ელ-ფოსტა</label>
                    <input
                      type="text"
                      value={siteSettings.footerContactEmail || ''}
                      onChange={(e) => setSiteSettings((prev: any) => ({ ...prev, footerContactEmail: e.target.value }))}
                      className="w-full bg-[#00241a] border border-[#c7a85b]/30 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#c7a85b]">საკონტაქტო ტელეფონი</label>
                    <input
                      type="text"
                      value={siteSettings.footerContactPhone || ''}
                      onChange={(e) => setSiteSettings((prev: any) => ({ ...prev, footerContactPhone: e.target.value }))}
                      className="w-full bg-[#00241a] border border-[#c7a85b]/30 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#c7a85b]">ფუტერის საავტორო უფლებები</label>
                  <input
                    type="text"
                    value={siteSettings.footerCopyright || ''}
                    onChange={(e) => setSiteSettings((prev: any) => ({ ...prev, footerCopyright: e.target.value }))}
                    className="w-full bg-[#00241a] border border-[#c7a85b]/30 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-[#c7a85b] text-[#00241a] font-bold text-xs px-6 py-2.5 rounded-xl cursor-pointer"
                >
                  პარამეტრების შენახვა
                </button>
              </div>
            </form>
          )}

          {/* ----------------- TAB 9: ACTIVITY LOG ----------------- */}
          {activeTab === 'activity' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold font-display-lg text-white">ადმინისტრატორის მოქმედებების ჟურნალი</h2>
                <p className="text-xs text-[#a4d0be]">ყველა განხორციელებული ცვლილების ისტორია</p>
              </div>

              <div className="bg-[#0b251c] border border-[#c7a85b]/30 rounded-3xl p-6 shadow-xl space-y-3">
                {activityLogs.map((log) => (
                  <div key={log.id} className="bg-[#00241a] p-4 rounded-2xl border border-white/5 flex justify-between items-center text-xs">
                    <div className="space-y-1">
                      <span className="font-bold text-[#c7a85b]">{log.action}</span>
                      <p className="text-white">{log.details}</p>
                    </div>
                    <span className="text-[10px] text-[#a4d0be]/60 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Media Library Modal */}
      <MediaLibraryModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelectImage={handleMediaSelect}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        onConfirm={confirmModalState.onConfirm}
        onClose={() => setConfirmModalState(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Live Post Preview Modal */}
      {previewPost && (
        <PostPreviewModal
          isOpen={!!previewPost}
          post={previewPost}
          onClose={() => setPreviewPost(null)}
        />
      )}
    </div>
  );
};
