import React, { useState, useEffect } from 'react';
import { ChevronRight, Calendar, User } from 'lucide-react';
import api from '../api';

interface HomeProps {
  onNavigate: (page: string) => void;
  siteSettings?: {
    heroTitle?: string;
    heroSubtitle?: string;
    heroCtaButton?: string;
    aboutTitle?: string;
    aboutText?: string;
    historyText?: string;
    trainersText?: string;
  };
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

export const Home: React.FC<HomeProps> = ({ onNavigate, siteSettings }) => {
  const [cmsPosts, setCmsPosts] = useState<CMSPost[]>([]);
  const [sections, setSections] = useState<HomepageSectionData[]>([]);

  useEffect(() => {
    fetchHomepageData();
  }, []);

  const fetchHomepageData = async () => {
    try {
      const [postsRes, sectionsRes] = await Promise.all([
        api.get('/posts'),
        api.get('/homepage-sections')
      ]);

      if (postsRes.data) setCmsPosts(postsRes.data);
      if (sectionsRes.data) setSections(sectionsRes.data);
    } catch (err) {
      console.error('Failed to load homepage CMS data', err);
    }
  };

  const getSection = (key: string) => sections.find(s => s.sectionKey === key);
  const heroSec = getSection('hero');
  const introSec = getSection('intro');
  const ctaSec = getSection('cta');

  const displayPosts = cmsPosts.filter(p => 
    p.displayLocations?.includes('homepage_featured') || 
    p.displayLocations?.includes('homepage_latest') || 
    p.displayLocations?.includes('featured') ||
    p.displayLocations?.includes('latest')
  );

  return (
    <div className="space-y-0 text-text-main bg-background selection:bg-tertiary selection:text-on-tertiary">
      
      {/* Hero Section */}
      {(!heroSec || heroSec.isVisible) && (
        <section className="relative min-h-[90vh] flex items-center overflow-hidden -mt-20">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 mix-blend-multiply z-10 bg-primary-container/80"></div>
            <img 
              className="w-full h-full object-cover" 
              alt="Psychosynthesis Hero Background" 
              src={heroSec?.bgImageUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuADlkkmgIHMdESPqFQWxN-qaJEefgYUcgPDfTfY6I1ULMeo84qhptW_vG8srsDba5wWxCfUXPHYdQZ1lN4XWDMwl93ZAn-mAnCpanna14_g6DJlEf6ak8iE3HJ7krX-6TGD8Gvze5xjGnG8CxTFdppVDqN8qjIeuVERCiT2pzIRa_6TaYBvltqryMiCivqjDUR-UGzSuI8u5D7-RLqnNZ8ozDWH2S_-SJ0fOwoiWoflJgtbPFClyFP6"}
            />
          </div>
          
          <div className="relative z-20 max-w-container-max mx-auto px-gutter w-full py-20 text-left">
            <div className="max-w-3xl md:ml-0 space-y-6">
              <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-tertiary mb-6">
                {heroSec?.title || siteSettings?.heroTitle || 'სულის მთლიანობისა და პიროვნული ჰარმონიის გზა'}
              </h1>
              <p className="font-quote-editorial text-quote-editorial text-text-main mb-10 opacity-90 leading-relaxed max-w-2xl">
                {heroSec?.subtitle || siteSettings?.heroSubtitle || 'ფსიქოსინთეზის ქართული ინსტიტუტი გიწვევთ თვითშემეცნების სიღრმეებში, სადაც აკადემიური ცოდნა და სულიერი პრაქტიკა ერთიანდება.'}
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <button 
                  onClick={() => onNavigate('workspace')}
                  className="bg-tertiary text-on-tertiary px-8 py-4 rounded-lg font-label-md text-label-md hover:shadow-xl hover:brightness-110 transition-all cursor-pointer font-bold"
                >
                  {heroSec?.ctaText || siteSettings?.heroCtaButton || 'დაიწყე მოგზაურობა'}
                </button>
                <button 
                  onClick={() => onNavigate('academic')}
                  className="bg-surface-container-low/30 backdrop-blur-sm text-text-main border border-tertiary/40 px-8 py-4 rounded-lg font-label-md text-label-md hover:bg-tertiary/20 transition-all cursor-pointer"
                >
                  პროგრამების გაცნობა
                </button>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 w-full h-32 academic-gradient z-10"></div>
        </section>
      )}

      {/* About Psychosynthesis (Intro Section) */}
      {(!introSec || introSec.isVisible) && (
        <section className="py-section-gap-lg bg-background relative overflow-hidden text-left" id="about-philosophy">
          <div className="max-w-container-max mx-auto px-gutter grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-7 space-y-6">
              <span className="text-tertiary font-label-md text-label-md tracking-widest uppercase mb-4 block">
                {introSec?.subtitle || 'ფილოსოფია & ისტორია'}
              </span>
              <h2 className="font-headline-lg text-headline-lg text-tertiary mb-8">
                {introSec?.title || 'რა არის ფსიქოსინთეზი?'}
              </h2>
              <div className="space-y-6 text-text-main leading-relaxed">
                <p className="text-body-lg font-body-lg">
                  {introSec?.content || 'ფსიქოსინთეზი არის ფსიქოლოგიის ჰუმანისტური და ტრანსპერსონალური მიმართულება, რომელიც დააფუძნა რობერტო ასაჯიოლიმ. ეს არის მიდგომა, რომელიც ადამიანს განიხილავს როგორც ერთიან მთლიანობას — სხეულის, გრძნობების, გონებისა და სულის სინთეზს.'}
                </p>
                <p className="text-body-md font-body-md text-text-muted bg-surface-container-low p-6 rounded-2xl border-l-4 border-tertiary shadow-sm">
                  {siteSettings?.historyText || siteSettings?.aboutText || 'ჩვენი ინსტიტუტი საქართველოში პირველია, რომელიც სთავაზობს სრულყოფილ აკადემიურ და პრაქტიკულ ბაზას ამ მიმართულებით.'}
                </p>
              </div>
              
              <div className="mt-10 flex gap-12 pt-4">
                <div className="flex flex-col">
                  <span className="font-display-lg text-tertiary leading-none text-5xl font-bold">15+</span>
                  <span className="font-label-md text-label-md text-text-muted mt-2">წლის გამოცდილება</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-display-lg text-tertiary leading-none text-5xl font-bold">500+</span>
                  <span className="font-label-md text-label-md text-text-muted mt-2">კურსდამთავრებული</span>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-5 relative w-full max-w-md mx-auto lg:max-w-none">
              <div className="aspect-[4/5] rounded-xl overflow-hidden premium-shadow relative z-10 border border-outline/20">
                <img 
                  className="w-full h-full object-cover" 
                  alt="Assagioli Scholar Portrait" 
                  src={introSec?.imageUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuBNDeZZ08mYF6XPWzNvdpcdgGEZZEInkt1LJcyj21WLrUU6cPTULdQOoPi0QycgMzwUodPdoV-G5I96r5z8j983ajKS97dUxzC6c9ncp9ffKmxvG0175l5YgQlHWM0_RPU2ZELQoy3Q_9wf9X583ADmHTMjq9oZ6_lSHZSpOrePAmrGxW3IS2x23xJchjTHbTWmOw-r6IHbK5pHOXOwLMCDX_1TUZo7dQ9RycL-PX_vQvY_1FsjF_4B"}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Dynamic Featured & Latest CMS Posts Section */}
      {displayPosts.length > 0 && (
        <section className="py-section-gap-lg bg-surface-muted text-left">
          <div className="max-w-container-max mx-auto px-gutter space-y-12">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-tertiary text-xs font-bold uppercase tracking-widest block mb-2">რჩეული სტატიები</span>
                <h2 className="font-headline-lg text-headline-lg text-tertiary">ფსიქოსინთეზის კვლევები &amp; ნაშრომები</h2>
              </div>
              <button onClick={() => onNavigate('academic')} className="text-tertiary font-bold text-xs hover:underline flex items-center gap-1">
                ყველა სტატია <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {displayPosts.map((post) => (
                <div 
                  key={post.id} 
                  onClick={() => onNavigate('academic')}
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
                    <p className="text-text-muted text-sm leading-relaxed">
                      {post.shortDescription}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-outline/10 text-xs text-text-muted">
                    <span className="flex items-center gap-1"><User size={13} className="text-tertiary" /> {post.author}</span>
                    <span className="flex items-center gap-1"><Calendar size={13} className="text-tertiary" /> {new Date(post.publishDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {(!ctaSec || ctaSec.isVisible) && (
        <section className="py-section-gap-md bg-surface-container-lowest relative overflow-hidden border-y border-outline/10 text-center">
          <div className="max-w-container-max mx-auto px-gutter relative z-10 space-y-8">
            <h2 className="font-display-lg text-tertiary mb-8 leading-tight">
              {ctaSec?.title || 'მზად ხართ ტრანსფორმაციისთვის?'}
            </h2>
            <p className="font-quote-editorial text-text-main max-w-2xl mx-auto mb-12 opacity-80 leading-relaxed">
              {ctaSec?.subtitle || 'შემოუერთდით ჩვენს საზოგადოებას და დაიწყეთ მოგზაურობა სულიერი და ინტელექტუალური სიმწიფისკენ.'}
            </p>
            <div className="flex justify-center gap-6 flex-wrap pt-4">
              <button 
                onClick={() => onNavigate('academic')}
                className="bg-tertiary text-on-tertiary px-10 py-5 rounded-lg font-label-md text-label-md hover:scale-105 transition-transform shadow-xl cursor-pointer font-bold"
              >
                {ctaSec?.ctaText || 'ღია კარის დღეზე ჩაწერა'}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
