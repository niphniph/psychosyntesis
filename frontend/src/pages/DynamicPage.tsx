import React, { useState, useEffect } from 'react';
import api from '../api';

interface DynamicPageProps {
  slug: string;
  onNavigateHome: () => void;
}

interface PageData {
  id: string;
  title: string;
  slug: string;
  content: string;
  heroImage?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export const DynamicPage: React.FC<DynamicPageProps> = ({ slug, onNavigateHome }) => {
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchPage();
  }, [slug]);

  const fetchPage = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get(`/pages/${slug}`);
      if (res.data) {
        setPage(res.data);
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-[#c7a85b]">
        <div className="animate-spin w-8 h-8 border-2 border-[#c7a85b] border-t-transparent rounded-full mr-3" />
        <span className="font-bold text-sm">იტვირთება გვერდი...</span>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 py-20 text-center px-4">
        <h1 className="text-4xl font-bold font-display-lg text-white">404</h1>
        <p className="text-lg text-[#a4d0be]">გვერდი ვერ მოიძებნა ან წაშლილია</p>
        <button
          onClick={onNavigateHome}
          className="bg-[#c7a85b] text-[#00241a] font-bold px-6 py-2.5 rounded-xl hover:bg-[#ffdf95] transition-all text-xs cursor-pointer"
        >
          მთავარ გვერდზე დაბრუნება
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 text-left text-text-main">
      {/* Page Hero */}
      <section className="relative rounded-3xl overflow-hidden bg-[#00241a] border border-[#c7a85b]/30 p-8 md:p-14 shadow-2xl min-h-[300px] flex items-center">
        {page.heroImage && (
          <div className="absolute inset-0 z-0">
            <img src={page.heroImage} alt={page.title} className="w-full h-full object-cover opacity-30 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#00241a] via-[#00241a]/80 to-transparent" />
          </div>
        )}

        <div className="relative z-10 space-y-4 max-w-3xl">
          <span className="text-[#c7a85b] text-xs font-bold uppercase tracking-widest block">
            ფსიქოსინთეზის ინსტიტუტი
          </span>
          <h1 className="text-3xl md:text-5xl font-bold font-display-lg text-white leading-tight">
            {page.title}
          </h1>
        </div>
      </section>

      {/* Page Body Content */}
      <section className="bg-surface-container-low rounded-3xl p-8 md:p-12 border border-outline/10 shadow-sm">
        <div 
          className="prose prose-invert max-w-none text-text-main text-base leading-relaxed space-y-6 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-tertiary [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-text-main [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-tertiary [&_blockquote]:pl-4 [&_blockquote]:italic [&_a]:text-tertiary [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </section>
    </div>
  );
};
