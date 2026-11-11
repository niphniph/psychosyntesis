import React, { useState } from 'react';
import { ShieldCheck, Globe } from 'lucide-react';
import api, { ADMIN_TOKEN_KEY } from '../../api';
import { inputClass, getApiError } from './ui';

interface AdminLoginProps {
  onSuccess: () => void;
  onNavigateHome: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onNavigateHome }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/admin/login', { username, password });
      if (!res.data?.sessionToken) throw new Error('no token');
      localStorage.setItem(ADMIN_TOKEN_KEY, res.data.sessionToken);
      onSuccess();
    } catch (err) {
      setError(getApiError(err, 'შესვლა ვერ მოხერხდა. შეამოწმეთ, რომ სერვერი ჩართულია.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#001f16] flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-[#0b251c] border border-[#c7a85b]/30 rounded-3xl p-8 space-y-6 shadow-2xl text-left">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#00241a] border border-[#c7a85b]/40 flex items-center justify-center text-[#c7a85b]">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-xl font-bold text-white">ადმინისტრატორის შესვლა</h1>
          <p className="text-xs text-[#a4d0be]">ფსიქოსინთეზის ინსტიტუტის მართვის პანელი</p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#c7a85b]">მომხმარებელი</label>
            <input autoFocus value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} autoComplete="username" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#c7a85b]">პაროლი</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} autoComplete="current-password" required />
          </div>
        </div>

        {error && <p className="text-xs text-red-300 bg-red-950/50 border border-red-800/50 rounded-xl px-3 py-2">{error}</p>}

        <button type="submit" disabled={loading} className="w-full bg-[#c7a85b] hover:bg-[#ffdf95] text-[#00241a] font-bold text-sm py-3 rounded-xl transition-all cursor-pointer disabled:opacity-60">
          {loading ? 'მიმდინარეობს...' : 'შესვლა'}
        </button>

        <button type="button" onClick={onNavigateHome} className="w-full flex items-center justify-center gap-1.5 text-xs text-[#a4d0be] hover:text-[#c7a85b] cursor-pointer">
          <Globe size={13} /> საიტზე დაბრუნება
        </button>
      </form>
    </div>
  );
};
