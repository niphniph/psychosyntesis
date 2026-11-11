import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import api from '../api';
import { useSite } from '../content/SiteContext';

interface ArticlePageProps {
  /** "post-<slug>" for CMS posts, "blog-<id>" for academic blogs */
  reference: string;
  onBack: () => void;
}

interface Article {
  title: string;
  content: string;
  author?: string;
  date?: string;
  image?: string;
  category?: string;
  tags?: string[];
  seoTitle?: string;
}

export const ArticlePage: React.FC<ArticlePageProps> = ({ reference, onBack }) => {
  const { t } = useSite();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setArticle(null);
      try {
        if (reference.startsWith('post-')) {
          const res = await api.get(`/posts/${encodeURIComponent(reference.slice(5))}`);
          const p = res.data;
          if (p?.title) {
            setArticle({ title: p.title, content: p.content, author: p.author, date: p.publishDate, image: p.featuredImage, category: p.category, tags: p.tags, seoTitle: p.seoTitle });
          }
        } else {
          const res = await api.get('/blogs');
          const b = Array.isArray(res.data) ? res.data.find((x: any) => x.id === reference.slice(5)) : null;
          if (b) setArticle({ title: b.title, content: b.content, author: b.author, date: b.createdAt, image: b.imageUrl });
        }
      } catch {
        // handled by the not-found state below
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [reference]);

  useEffect(() => {
    if (article) document.title = article.seoTitle || article.title;
  }, [article]);

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center text-tertiary text-sm font-bold">იტვირთება...</div>;
  }

  if (!article) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-4xl font-bold text-white">404</h1>
        <p className="text-text-muted">{t('notFoundText')}</p>
        <button onClick={onBack} className="bg-tertiary text-on-tertiary font-bold px-6 py-2.5 rounded-xl text-xs cursor-pointer">{t('articleBackText')}</button>
      </div>
    );
  }

  const isHtml = /<\/?[a-z][\s\S]*>/i.test(article.content || '');

  return (
    <article className="max-w-3xl mx-auto space-y-8 text-left text-text-main">
      <button onClick={onBack} className="flex items-center gap-2 text-tertiary text-xs font-bold hover:underline cursor-pointer">
        <ArrowLeft size={14} /> {t('articleBackText')}
      </button>

      <header className="space-y-4">
        {article.category && (
          <span className="bg-tertiary/10 text-tertiary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">{article.category}</span>
        )}
        <h1 className="font-display-lg text-3xl md:text-5xl text-tertiary leading-tight">{article.title}</h1>
        <div className="flex flex-wrap gap-5 text-xs text-text-muted">
          {article.author && <span className="flex items-center gap-1.5"><User size={13} className="text-tertiary" /> {article.author}</span>}
          {article.date && <span className="flex items-center gap-1.5"><Calendar size={13} className="text-tertiary" /> {new Date(article.date).toLocaleDateString('ka-GE')}</span>}
        </div>
      </header>

      {article.image && <img src={article.image} alt={article.title} className="w-full rounded-3xl aspect-video object-cover shadow-xl" />}

      {isHtml
        ? <div className="cms-content text-base" dangerouslySetInnerHTML={{ __html: article.content }} />
        : <p className="text-base leading-relaxed whitespace-pre-line">{article.content}</p>}

      {article.tags && article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-6 border-t border-outline/10">
          {article.tags.map(tag => (
            <span key={tag} className="text-[11px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-text-muted">#{tag}</span>
          ))}
        </div>
      )}
    </article>
  );
};
