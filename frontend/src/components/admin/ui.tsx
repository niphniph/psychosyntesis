import React, { useState } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import { MediaLibraryModal } from '../MediaLibraryModal';

export const inputClass =
  'w-full bg-[#00241a] border border-[#c7a85b]/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#c7a85b]';

export const Field: React.FC<{ label: string; help?: string; className?: string; children: React.ReactNode }> = ({ label, help, className, children }) => (
  <div className={`space-y-1 text-left ${className || ''}`}>
    <label className="text-xs font-bold text-[#c7a85b] block">{label}</label>
    {children}
    {help && <p className="text-[10px] text-[#a4d0be]/60">{help}</p>}
  </div>
);

export const Card: React.FC<{ title?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, actions, children, className }) => (
  <div className={`bg-[#0b251c] border border-[#c7a85b]/25 rounded-3xl p-6 shadow-xl space-y-5 text-left ${className || ''}`}>
    {(title || actions) && (
      <div className="flex justify-between items-center gap-3 border-b border-white/10 pb-3">
        {title && <h3 className="text-sm font-bold text-white">{title}</h3>}
        {actions}
      </div>
    )}
    {children}
  </div>
);

export const PageHeader: React.FC<{ title: string; subtitle?: string; actions?: React.ReactNode }> = ({ title, subtitle, actions }) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div>
      <h2 className="text-2xl font-bold font-display-lg text-white">{title}</h2>
      {subtitle && <p className="text-xs text-[#a4d0be]">{subtitle}</p>}
    </div>
    {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
  </div>
);

export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, children, ...props }) => (
  <button
    {...props}
    className={`bg-[#c7a85b] hover:bg-[#ffdf95] text-[#00241a] font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${className || ''}`}
  >
    {children}
  </button>
);

export const GhostButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, children, ...props }) => (
  <button
    {...props}
    className={`border border-white/20 text-white hover:bg-white/10 text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${className || ''}`}
  >
    {children}
  </button>
);

/** URL input with a media-library picker and a thumbnail preview */
export const MediaInput: React.FC<{ value: string; onChange: (url: string) => void; placeholder?: string; accept?: 'image' | 'file' }> = ({
  value, onChange, placeholder = 'https://... ან აირჩიეთ ბიბლიოთეკიდან', accept = 'image'
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${inputClass} flex-1`} />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="bg-[#c7a85b]/20 hover:bg-[#c7a85b] text-[#c7a85b] hover:text-[#00241a] px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <ImageIcon size={14} /> {accept === 'file' ? 'ფაილი' : 'სურათი'}
        </button>
        {value && (
          <button type="button" onClick={() => onChange('')} title="მოხსნა" className="text-red-400 hover:text-red-300 px-2 cursor-pointer">
            <X size={16} />
          </button>
        )}
      </div>
      {value && accept === 'image' && (
        <img src={value} alt="" className="h-24 rounded-xl border border-white/10 object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
      )}
      <MediaLibraryModal isOpen={open} onClose={() => setOpen(false)} onSelectImage={(url) => { onChange(url); setOpen(false); }} />
    </div>
  );
};

/** Editable list of image URLs stored as newline-separated text */
export const ImageListInput: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const items = (value || '').split('\n').map(s => s.trim()).filter(Boolean);
  const update = (next: string[]) => onChange(next.join('\n'));
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {items.map((url, i) => (
          <div key={`${url}-${i}`} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => update(items.filter((_, j) => j !== i))}
              className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="aspect-square rounded-xl border-2 border-dashed border-[#c7a85b]/40 text-[#c7a85b] text-xs font-bold hover:bg-[#c7a85b]/10 cursor-pointer flex flex-col items-center justify-center gap-1"
        >
          <ImageIcon size={18} /> დამატება
        </button>
      </div>
      <MediaLibraryModal isOpen={open} onClose={() => setOpen(false)} onSelectImage={(url) => { update([...items, url]); setOpen(false); }} />
    </div>
  );
};

export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-2 text-xs text-[#a4d0be] cursor-pointer font-bold select-none">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="rounded accent-[#c7a85b]" />
    {label}
  </label>
);

export const getApiError = (err: any, fallback: string) =>
  err?.response?.data?.message && typeof err.response.data.message === 'string' ? err.response.data.message : fallback;
