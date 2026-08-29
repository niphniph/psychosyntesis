import React from 'react';
import { X, Calendar, User, Tag, Eye } from 'lucide-react';

interface PostPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    title: string;
    shortDescription?: string;
    content: string;
    featuredImage?: string;
    category?: string;
    tags?: string[];
    author?: string;
    publishDate?: string;
  };
}

export const PostPreviewModal: React.FC<PostPreviewModalProps> = ({
  isOpen,
  onClose,
  post
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#00241a] border border-[#c7a85b]/40 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-[#0b251c] px-6 py-4 border-b border-[#c7a85b]/20 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2 text-xs text-[#c7a85b] font-bold">
            <Eye size={16} /> Content Live Preview (Unpublished)
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Article Body Preview */}
        <div className="p-6 md:p-10 overflow-y-auto flex-1 text-left space-y-6 text-[#fbf9f3] selection:bg-[#c7a85b] selection:text-[#00241a]">
          {/* Metadata */}
          <div className="space-y-3">
            {post.category && (
              <span className="inline-block bg-[#c7a85b]/20 text-[#c7a85b] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {post.category}
              </span>
            )}
            <h1 className="text-2xl md:text-4xl font-bold font-display-lg text-white leading-tight">
              {post.title || 'Untitled Post'}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#a4d0be]/80 pt-1 border-b border-white/10 pb-4">
              <span className="flex items-center gap-1.5">
                <User size={14} className="text-[#c7a85b]" /> {post.author || 'Dr. Elene Kvantaliani'}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-[#c7a85b]" /> {new Date(post.publishDate || Date.now()).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Short Description */}
          {post.shortDescription && (
            <div className="text-sm md:text-base italic text-[#a4d0be] bg-[#0b251c] p-4 rounded-2xl border-l-4 border-[#c7a85b] leading-relaxed">
              {post.shortDescription}
            </div>
          )}

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 shadow-xl">
              <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Full HTML Content */}
          <div 
            className="prose prose-invert max-w-none text-sm md:text-base text-white/90 leading-relaxed space-y-4 pt-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#c7a85b] [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-white [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-[#c7a85b] [&_blockquote]:pl-4 [&_blockquote]:italic [&_a]:text-[#c7a85b] [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: post.content || '<p className="opacity-40 italic">No content written yet...</p>' }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="pt-6 border-t border-white/10 flex flex-wrap gap-2 items-center">
              <Tag size={14} className="text-[#c7a85b]" />
              {post.tags.map((tag, idx) => (
                <span key={idx} className="bg-white/10 text-white/80 text-[11px] px-2.5 py-1 rounded-lg">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0b251c] border-t border-[#c7a85b]/20 flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#c7a85b] text-[#00241a] font-bold text-xs px-6 py-2 rounded-xl hover:bg-[#ffdf95] transition-all cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
