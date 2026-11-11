import React, { useState, useEffect } from 'react';
import { ChevronRight, Calendar, User } from 'lucide-react';
import api from '../api';
import { useSite } from '../content/SiteContext';

interface HomeProps {
  onNavigate: (page: string) => void;
}

interface CMSPost {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  featuredImage?: string;
  category: string;
  author: string;
  publishDate: string;
  displayLocations: string[];
}

interface HomepageSectionData {
  id: string;
  sectionKey: string;
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

const DEFAULT_HERO_BG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuADlkkmgIHMdESPqFQWxN-qaJEefgYUcgPDfTfY6I1ULMeo84qhptW_vG8srsDba5wWxCfUXPHYdQZ1lN4XWDMwl93ZAn-mAnCpanna14_g6DJlEf6ak8iE3HJ7krX-6TGD8Gvze5xjGnG8CxTFdppVDqN8qjIeuVERCiT2pzIRa_6TaYBvltqryMiCivqjDUR-UGzSuI8u5D7-RLqnNZ8ozDWH2S_-SJ0fOwoiWoflJgtbPFClyFP6';

// Fallback layout used until the API answers (or if it is unreachable)
const FALLBACK_SECTIONS: HomepageSectionData[] = [
  { id: 'f-hero', sectionKey: 'hero', title: 'სულის მთლიანობისა და პიროვნული ჰარმონიის გზა', subtitle: 'ფსიქოსინთეზის ქართული ინსტიტუტი გიწვევთ თვითშემეცნების სიღრმეებში, სადაც აკადემიური ცოდნა და სულიერი პრაქტიკა ერთიანდება.', ctaText: 'დაიწყე მოგზაურობა', ctaLink: '/workspace', isVisible: true, sortOrder: 1 },
  { id: 'f-intro', sectionKey: 'intro', title: 'რა არის ფსიქოსინთეზი?', subtitle: 'ფილოსოფია & ისტორია', isVisible: true, sortOrder: 2 },
  { id: 'f-articles', sectionKey: 'latest_articles', title: 'ფსიქოსინთეზის კვლევები & ნაშრომები', subtitle: 'რჩეული სტატიები', isVisible: true, sortOrder: 3 },
  { id: 'f-cta', sectionKey: 'cta', title: 'მზად ხართ ტრანსფორმაციისთვის?', isVisible: true, sortOrder: 4 }
];

// Section content may be plain text (older data) or HTML from the rich editor
const RichText: React.FC<{ html?: string; className?: string }> = ({ html, className }) => {
  if (!html) return null;
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(html);
  return isHtml
    ? <div className={`cms-content ${className || ''}`} dangerouslySetInnerHTML={{ __html: html }} />
    : <p className={className}>{html}</p>;
};

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const { t, go } = useSite();
  const [cmsPosts, setCmsPosts] = useState<CMSPost[]>([]);
  const [sections, setSections] = useState<HomepageSectionData[] | null>(null);

  useEffect(() => {
    const fetchHomepageData = async () => {
      const [postsRes, sectionsRes] = await Promise.allSettled([api.get('/posts'), api.get('/homepage-sections')]);
      if (postsRes.status === 'fulfilled' && Array.isArray(postsRes.value.data)) setCmsPosts(postsRes.value.data);
      if (sectionsRes.status === 'fulfilled' && Array.isArray(sectionsRes.value.data)) setSections(sectionsRes.value.data);
      else setSections(FALLBACK_SECTIONS);
    };
    fetchHomepageData();
  }, []);

  const featuredPosts = cmsPosts.filter(p =>
    p.displayLocations?.some(l => ['homepage_featured', 'featured'].includes(l)));
  const latestPosts = cmsPosts.filter(p =>
    p.displayLocations?.some(l => ['homepage_latest', 'latest'].includes(l)));

  const openPost = (post: CMSPost) => onNavigate(`post-${post.slug || post.id}`);

  const renderPosts = (sec: HomepageSectionData, posts: CMSPost[], defaultLabel: string, bgClass: string) => {
    if (posts.length === 0) return null;
    return (
      <section key={sec.id} className={`py-section-gap-lg ${bgClass} text-left`}>
        <div className="max-w-container-max mx-auto px-gutter space-y-12">
          <div className="flex justify-between items-end gap-4">
            <div>
              <span className="text-tertiary text-xs font-bold uppercase tracking-widest block mb-2">{sec.subtitle || defaultLabel}</span>
              <h2 className="font-headline-lg text-headline-lg text-tertiary">{sec.title}</h2>
            </div>
            <button onClick={() => go(sec.ctaLink || '/academic')} className="text-tertiary font-bold text-xs hover:underline flex items-center gap-1 shrink-0 cursor-pointer">
              {sec.ctaText || t('homePostsAllLink')} <ChevronRight size={16} />
            </button>
          </div>
          {sec.content && <RichText html={sec.content} className="text-text-muted max-w-3xl" />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {posts.map((post) => (
              <div
                key={post.id}
                onClick={() => openPost(post)}
                className="bg-surface-container-low rounded-3xl p-8 border border-outline/10 shadow-xl space-y-4 hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {post.featuredImage && (
                    <div className="aspect-video w-full rounded-2xl overflow-hidden">
                      <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <span className="bg-tertiary/10 text-tertiary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                    {post.category}
                  </span>
                  <h3 className="font-headline-md text-headline-md text-tertiary leading-snug group-hover:text-[#ffdf95] transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed">{post.shortDescription}</p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-outline/10 text-xs text-text-muted">
                  <span className="flex items-center gap-1"><User size={13} className="text-tertiary" /> {post.author}</span>
                  <span className="flex items-center gap-1"><Calendar size={13} className="text-tertiary" /> {new Date(post.publishDate).toLocaleDateString('ka-GE')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const renderSection = (sec: HomepageSectionData) => {
    switch (sec.sectionKey) {
      case 'hero':
        return (
          <section key={sec.id} className="relative min-h-[90vh] flex items-center overflow-hidden -mt-20">
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 mix-blend-multiply z-10 bg-primary-container/80"></div>
              <img className="w-full h-full object-cover" alt="" src={sec.bgImageUrl || DEFAULT_HERO_BG} />
            </div>

            <div className="relative z-20 max-w-container-max mx-auto px-gutter w-full py-20 text-left">
              <div className="max-w-3xl md:ml-0 space-y-6">
                <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-tertiary mb-6">{sec.title}</h1>
                {sec.subtitle && (
                  <p className="font-quote-editorial text-quote-editorial text-text-main mb-10 opacity-90 leading-relaxed max-w-2xl">{sec.subtitle}</p>
                )}
                {sec.content && <RichText html={sec.content} className="text-text-main opacity-90 max-w-2xl" />}
                <div className="flex flex-wrap gap-4 pt-4">
                  {sec.ctaText && (
                    <button
                      onClick={() => go(sec.ctaLink || '/workspace')}
                      className="bg-tertiary text-on-tertiary px-8 py-4 rounded-lg font-label-md text-label-md hover:shadow-xl hover:brightness-110 transition-all cursor-pointer font-bold"
                    >
                      {sec.ctaText}
                    </button>
                  )}
                  {t('heroSecondaryCtaText') && (
                    <button
                      onClick={() => go(t('heroSecondaryCtaLink'))}
                      className="bg-surface-container-low/30 backdrop-blur-sm text-text-main border border-tertiary/40 px-8 py-4 rounded-lg font-label-md text-label-md hover:bg-tertiary/20 transition-all cursor-pointer"
                    >
                      {t('heroSecondaryCtaText')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-32 academic-gradient z-10"></div>
          </section>
        );

      case 'intro':
        return (
          <section key={sec.id} className="py-section-gap-lg bg-background relative overflow-hidden text-left" id="about-philosophy">
            <div className="max-w-container-max mx-auto px-gutter grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
              <div className="lg:col-span-7 space-y-6">
                {sec.subtitle && (
                  <span className="text-tertiary font-label-md text-label-md tracking-widest uppercase mb-4 block">{sec.subtitle}</span>
                )}
                <h2 className="font-headline-lg text-headline-lg text-tertiary mb-8">{sec.title}</h2>
                <div className="space-y-6 text-text-main leading-relaxed">
                  <RichText html={sec.content} className="text-body-lg font-body-lg" />
                  {t('historyText') && (
                    <p className="text-body-md font-body-md text-text-muted bg-surface-container-low p-6 rounded-2xl border-l-4 border-tertiary shadow-sm">
                      {t('historyText')}
                    </p>
                  )}
                </div>

                <div className="mt-10 flex gap-12 pt-4">
                  {[['stat1Value', 'stat1Label'], ['stat2Value', 'stat2Label']].filter(([v]) => t(v)).map(([v, l]) => (
                    <div key={v} className="flex flex-col">
                      <span className="font-display-lg text-tertiary leading-none text-5xl font-bold">{t(v)}</span>
                      <span className="font-label-md text-label-md text-text-muted mt-2">{t(l)}</span>
                    </div>
                  ))}
                </div>
                {sec.ctaText && (
                  <button onClick={() => go(sec.ctaLink)} className="bg-tertiary text-on-tertiary px-8 py-3 rounded-lg font-bold text-sm cursor-pointer hover:brightness-110">
                    {sec.ctaText}
                  </button>
                )}
              </div>

              {sec.imageUrl && (
                <div className="lg:col-span-5 relative w-full max-w-md mx-auto lg:max-w-none">
                  <div className="aspect-[4/5] rounded-xl overflow-hidden premium-shadow relative z-10 border border-outline/20">
                    <img className="w-full h-full object-cover" alt={sec.title} src={sec.imageUrl} />
                  </div>
                </div>
              )}
            </div>
          </section>
        );

      case 'featured_content':
        return renderPosts(sec, featuredPosts, 'რჩეული სტატიები', 'bg-surface-muted');

      case 'latest_articles':
        return renderPosts(sec, latestPosts.length ? latestPosts : featuredPosts.length ? [] : cmsPosts.slice(0, 4), 'უახლესი პუბლიკაციები', 'bg-background');

      case 'cta':
        return (
          <section
            key={sec.id}
            className="py-section-gap-md bg-surface-container-lowest relative overflow-hidden border-y border-outline/10 text-center bg-cover bg-center"
            style={sec.bgImageUrl ? { backgroundImage: `linear-gradient(rgba(0,26,19,.85), rgba(0,26,19,.85)), url(${sec.bgImageUrl})` } : undefined}
          >
            <div className="max-w-container-max mx-auto px-gutter relative z-10 space-y-8">
              <h2 className="font-display-lg text-tertiary mb-8 leading-tight">{sec.title}</h2>
              {sec.subtitle && (
                <p className="font-quote-editorial text-text-main max-w-2xl mx-auto mb-12 opacity-80 leading-relaxed">{sec.subtitle}</p>
              )}
              {sec.content && <RichText html={sec.content} className="max-w-2xl mx-auto text-text-main opacity-90" />}
              {sec.ctaText && (
                <div className="flex justify-center gap-6 flex-wrap pt-4">
                  <button
                    onClick={() => go(sec.ctaLink || '/events')}
                    className="bg-tertiary text-on-tertiary px-10 py-5 rounded-lg font-label-md text-label-md hover:scale-105 transition-transform shadow-xl cursor-pointer font-bold"
                  >
                    {sec.ctaText}
                  </button>
                </div>
              )}
            </div>
          </section>
        );

      default:
        // Custom section created in the admin panel: optional background, image, rich text and button
        return (
          <section
            key={sec.id}
            id={`section-${sec.id}`}
            className="py-section-gap-lg bg-background text-left bg-cover bg-center"
            style={sec.bgImageUrl ? { backgroundImage: `linear-gradient(rgba(0,36,26,.88), rgba(0,36,26,.88)), url(${sec.bgImageUrl})` } : undefined}
          >
            <div className={`max-w-container-max mx-auto px-gutter grid grid-cols-1 gap-12 items-center ${sec.imageUrl ? 'lg:grid-cols-2' : ''}`}>
              <div className="space-y-6">
                {sec.subtitle && <span className="text-tertiary font-label-md text-label-md tracking-widest uppercase block">{sec.subtitle}</span>}
                {sec.title && <h2 className="font-headline-lg text-headline-lg text-tertiary">{sec.title}</h2>}
                <RichText html={sec.content} className="text-text-main leading-relaxed" />
                {sec.ctaText && (
                  <button onClick={() => go(sec.ctaLink)} className="bg-tertiary text-on-tertiary px-8 py-3.5 rounded-lg font-bold text-sm cursor-pointer hover:brightness-110">
                    {sec.ctaText}
                  </button>
                )}
              </div>
              {sec.imageUrl && (
                <div className="rounded-2xl overflow-hidden premium-shadow border border-outline/20">
                  <img src={sec.imageUrl} alt={sec.title} className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </section>
        );
    }
  };

  if (!sections) {
    return <div className="min-h-[90vh]" />;
  }

  return (
    <div className="space-y-0 text-text-main bg-background selection:bg-tertiary selection:text-on-tertiary">
      {[...sections].filter(s => s.isVisible).sort((a, b) => a.sortOrder - b.sortOrder).map(renderSection)}
    </div>
  );
};
