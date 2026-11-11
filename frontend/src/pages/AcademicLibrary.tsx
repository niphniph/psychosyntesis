import { useState, useEffect } from 'react';
import api from '../api';
import { useSite } from '../content/SiteContext';
import { Search, BookOpen, GraduationCap, Clock, Calendar, ChevronRight, FileText } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  difficulty: string;
  modules: string[];
  imageUrl?: string;
  price?: string;
}

interface Resource {
  id: string;
  title: string;
  author: string;
  type: string;
  year: string;
  description: string;
  fileUrl?: string;
  imageUrl?: string;
}

interface Blog {
  id: string;
  title: string;
  content: string;
  author: string;
  imageUrl?: string;
  createdAt: string;
}

export const AcademicLibrary: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { t } = useSite();
  const [courses, setCourses] = useState<Course[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [activeTab, setActiveTab] = useState<'courses' | 'library' | 'blogs'>('courses');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, resourcesRes, blogsRes] = await Promise.all([
          api.get('/courses'),
          api.get('/resources'),
          api.get('/blogs')
        ]);
        if (coursesRes.data && Array.isArray(coursesRes.data)) setCourses(coursesRes.data);
        if (resourcesRes.data && Array.isArray(resourcesRes.data)) setResources(resourcesRes.data);
        if (blogsRes.data && Array.isArray(blogsRes.data)) setBlogs(blogsRes.data);
      } catch (err) {
        console.error('Error fetching academic data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRegisterCourse = async (courseId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('რეგისტრაციის გასაგზავნად გთხოვთ გაიაროთ ავტორიზაცია');
      return;
    }
    try {
      await api.post(`/courses/${courseId}/register`);
      alert('რეგისტრაციის მოთხოვნა წარმატებით გაიგზავნა! სტატუსი შეგიძლიათ იხილოთ პირად სამუშაო სივრცეში.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'რეგისტრაციის მოთხოვნის გაგზავნისას დაფიქსირდა შეცდომა');
    }
  };

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredResources = resources.filter((r) =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBlogs = blogs.filter((b) =>
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-12">
      {/* Header section */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <span className="font-label-md text-label-md text-tertiary-container uppercase tracking-[0.2em] academic-border pb-2 w-max mx-auto block">
          {t('academicLabel')}
        </span>
        <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-surface-bright leading-tight">
          {t('academicTitle')}
        </h2>
        <p className="font-body-md text-surface-variant/80">
          {t('academicSubtitle')}
        </p>
      </div>

      {/* Tabs and search bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-white/10 pb-6">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex items-center gap-2 font-label-md px-5 py-2.5 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'courses'
                ? 'bg-tertiary-container text-primary-container border-tertiary-container font-bold'
                : 'bg-white/5 border-white/10 text-surface-variant hover:border-white/20'
            }`}
          >
            <GraduationCap size={16} />
            {t('academicCoursesTab')}
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-2 font-label-md px-5 py-2.5 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'library'
                ? 'bg-tertiary-container text-primary-container border-tertiary-container font-bold'
                : 'bg-white/5 border-white/10 text-surface-variant hover:border-white/20'
            }`}
          >
            <BookOpen size={16} />
            {t('academicLibraryTab')}
          </button>
          <button
            onClick={() => setActiveTab('blogs')}
            className={`flex items-center gap-2 font-label-md px-5 py-2.5 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'blogs'
                ? 'bg-tertiary-container text-primary-container border-tertiary-container font-bold'
                : 'bg-white/5 border-white/10 text-surface-variant hover:border-white/20'
            }`}
          >
            <FileText size={16} />
            {t('academicBlogsTab')}
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-surface-variant/50">
            <Search size={16} />
          </span>
          <input
            type="text"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-surface-bright placeholder-surface-variant/40 focus:ring-1 focus:ring-tertiary-container focus:outline-none"
            placeholder={t('academicSearchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin inline-block w-8 h-8 border-2 border-t-transparent border-tertiary-container rounded-full" />
          <p className="text-sm text-surface-variant/60 mt-2">მონაცემები იტვირთება...</p>
        </div>
      ) : activeTab === 'courses' ? (
        /* Courses Tab */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {filteredCourses.length === 0 ? (
            <div className="col-span-full py-12 text-center text-surface-variant/60">
              კურსები ვერ მოიძებნა.
            </div>
          ) : (
            filteredCourses.map((c) => (
              <div
                key={c.id}
                className="bg-white/5 border border-white/10 rounded-[32px] p-8 flex flex-col justify-between hover:border-tertiary-container/30 transition-all group"
              >
                <div className="space-y-6">
                  {c.imageUrl && <img src={c.imageUrl} alt={c.title} className="w-full aspect-video object-cover rounded-2xl" />}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] bg-tertiary-container/20 text-tertiary-container px-2.5 py-1 rounded-full uppercase font-bold tracking-wider">
                      {c.difficulty}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-surface-variant/70">
                      <Clock size={12} className="text-tertiary-container" />
                      <span>{c.duration}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-headline-md text-surface-bright group-hover:text-tertiary-fixed transition-colors">
                      {c.title}
                    </h3>
                    <p className="text-sm text-surface-variant/80 leading-relaxed line-clamp-3">
                      {c.description}
                    </p>
                    {c.price && <p className="text-tertiary-container font-bold text-sm">{c.price}</p>}
                  </div>

                  <div className="space-y-2 border-t border-white/5 pt-4">
                    <span className="text-xs text-tertiary-container font-semibold uppercase tracking-wider block">
                      {t('academicModulesLabel')}
                    </span>
                    <ul className="space-y-1.5">
                      {(c.modules || []).map((mod, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-surface-variant/90">
                          <ChevronRight size={12} className="text-tertiary-container" />
                          <span>{mod}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button 
                  onClick={() => handleRegisterCourse(c.id)}
                  className="w-full bg-tertiary-container/10 text-tertiary-container border border-tertiary-container/20 py-2.5 rounded-xl font-label-md hover:bg-tertiary-container hover:text-primary-container transition-all mt-8 cursor-pointer"
                >
                  {t('academicRegisterButton')}
                </button>
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'library' ? (
        /* Library Tab */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {filteredResources.length === 0 ? (
            <div className="col-span-full py-12 text-center text-surface-variant/60">
              ბიბლიოთეკის რესურსები ვერ მოიძებნა.
            </div>
          ) : (
            filteredResources.map((r) => (
              <div
                key={r.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-tertiary-container/30 transition-all group"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] bg-secondary-container/20 text-secondary-fixed-dim px-2.5 py-1 rounded-full uppercase font-bold tracking-wider">
                      {r.type}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-surface-variant/70">
                      <Calendar size={12} className="text-tertiary-container" />
                      <span>{r.year} {t('academicYearSuffix')}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-lg font-headline-md text-surface-bright group-hover:text-tertiary-fixed transition-colors">
                      {r.title}
                    </h4>
                    <p className="text-xs text-tertiary-container font-semibold">{r.author}</p>
                  </div>

                  <p className="text-xs text-surface-variant/80 leading-relaxed line-clamp-4 pt-2">
                    {r.description}
                  </p>
                </div>

                {r.fileUrl && (
                  <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="block text-center w-full bg-white/5 text-surface-bright py-2 rounded-xl text-xs font-semibold hover:bg-white/10 transition-all border border-white/5 mt-6 cursor-pointer">
                    {t('academicDownloadButton')}
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        /* Blogs & Articles Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredBlogs.length === 0 ? (
            <div className="col-span-full py-12 text-center text-surface-variant/60">
              სტატიები და ბლოგები ვერ მოიძებნა.
            </div>
          ) : (
            filteredBlogs.map((b) => (
              <article
                key={b.id}
                className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col justify-between hover:border-tertiary-container/40 transition-all group shadow-lg text-left"
              >
                <div className="space-y-4">
                  {b.imageUrl && <img src={b.imageUrl} alt={b.title} className="w-full aspect-video object-cover rounded-2xl" />}
                  <div className="flex justify-between items-center text-xs text-surface-variant/60">
                    <span className="bg-tertiary-container/20 text-tertiary-fixed px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {b.author}
                    </span>
                    <span>{new Date(b.createdAt).toLocaleDateString('ka-GE')}</span>
                  </div>
                  <h3 className="text-xl font-headline-md font-bold text-surface-bright group-hover:text-tertiary-fixed transition-colors">
                    {b.title}
                  </h3>
                  <div 
                    className="text-xs text-surface-variant/80 leading-relaxed line-clamp-4 font-body-md"
                    dangerouslySetInnerHTML={{ __html: b.content }}
                  />
                </div>
                <button 
                  onClick={() => onNavigate(`blog-${b.id}`)}
                  className="inline-flex items-center gap-2 text-tertiary-fixed text-xs font-bold pt-4 hover:underline mt-4 cursor-pointer"
                >
                  {t('academicReadMore')} <ChevronRight size={14} />
                </button>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
};
