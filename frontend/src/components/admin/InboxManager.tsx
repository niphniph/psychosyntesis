import React, { useEffect, useState } from 'react';
import { Trash2, Mail, GraduationCap } from 'lucide-react';
import api from '../../api';
import { ConfirmModal } from '../ConfirmModal';
import { PageHeader, getApiError } from './ui';

interface Registration {
  id: string;
  userName: string;
  courseTitle: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface Inquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  status: 'urgent' | 'read' | 'unread';
  createdAt: string;
}

const REG_STATUS: Record<Registration['status'], { label: string; cls: string }> = {
  pending: { label: 'მოლოდინში', cls: 'bg-amber-950 text-amber-400 border-amber-800' },
  approved: { label: 'დადასტურებული', cls: 'bg-emerald-950 text-emerald-400 border-emerald-800' },
  rejected: { label: 'უარყოფილი', cls: 'bg-red-950 text-red-400 border-red-800' }
};

const INQ_STATUS: Record<Inquiry['status'], { label: string; cls: string }> = {
  unread: { label: 'წაუკითხავი', cls: 'bg-amber-950 text-amber-400 border-amber-800' },
  urgent: { label: 'სასწრაფო', cls: 'bg-red-950 text-red-400 border-red-800' },
  read: { label: 'წაკითხული', cls: 'bg-gray-800 text-gray-300 border-gray-700' }
};

export const InboxManager: React.FC<{ kind: 'registrations' | 'inquiries'; showToast: (msg: string) => void; onChanged?: () => void }> = ({ kind, showToast, onChanged }) => {
  const [items, setItems] = useState<any[]>([]);
  const [toDelete, setToDelete] = useState<any | null>(null);

  const load = async () => {
    try {
      const res = await api.get(`/admin/${kind}`);
      if (Array.isArray(res.data)) setItems(res.data);
    } catch (err) {
      showToast(getApiError(err, 'ჩატვირთვის შეცდომა'));
    }
  };

  useEffect(() => {
    load();
  }, [kind]);

  const setStatus = async (id: string, status: string) => {
    try {
      await api.put(`/admin/${kind}/${id}`, { status });
      setItems(prev => prev.map(i => (i.id === id ? { ...i, status } : i)));
      onChanged?.();
    } catch (err) {
      showToast(getApiError(err, 'სტატუსის შეცვლის შეცდომა'));
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/admin/${kind}/${id}`);
      setItems(prev => prev.filter(i => i.id !== id));
      showToast('წაიშალა');
      onChanged?.();
    } catch (err) {
      showToast(getApiError(err, 'წაშლის შეცდომა'));
    }
  };

  const isReg = kind === 'registrations';
  const statuses = isReg ? REG_STATUS : INQ_STATUS;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={isReg ? 'კურსებზე რეგისტრაციები' : 'შემოსული შეტყობინებები'}
        subtitle={isReg ? 'დაადასტურეთ ან უარყავით მომხმარებლების მოთხოვნები' : 'საკონტაქტო ფორმიდან მიღებული წერილები'}
      />

      {items.length === 0 ? (
        <div className="bg-[#0b251c] border border-[#c7a85b]/20 rounded-3xl p-10 text-center text-xs text-[#a4d0be]/70 italic">
          {isReg ? 'რეგისტრაციები ჯერ არ არის' : 'შეტყობინებები ჯერ არ არის'}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const st = (statuses as any)[item.status] || { label: item.status, cls: '' };
            return (
              <div key={item.id} className={`bg-[#0b251c] border rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4 text-xs text-left ${item.status === 'unread' || item.status === 'urgent' || item.status === 'pending' ? 'border-[#c7a85b]/40' : 'border-white/10'}`}>
                <div className="w-10 h-10 rounded-xl bg-[#00241a] text-[#c7a85b] flex items-center justify-center shrink-0">
                  {isReg ? <GraduationCap size={18} /> : <Mail size={18} />}
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-white text-sm">{isReg ? item.userName : item.name}</span>
                    {!isReg && <a href={`mailto:${item.email}`} className="text-[#c7a85b] hover:underline">{item.email}</a>}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${st.cls}`}>{st.label}</span>
                  </div>
                  <p className="text-[#a4d0be] whitespace-pre-line break-words">{isReg ? `კურსი: ${item.courseTitle}` : item.message}</p>
                  <p className="text-[10px] text-white/40 font-mono">{new Date(item.createdAt).toLocaleString('ka-GE')}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={item.status}
                    onChange={(e) => setStatus(item.id, e.target.value)}
                    className="bg-[#00241a] border border-[#c7a85b]/30 text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                  >
                    {Object.entries(statuses).map(([value, s]) => <option key={value} value={value}>{s.label}</option>)}
                  </select>
                  <button onClick={() => setToDelete(item)} className="p-2 bg-red-950/60 text-red-400 hover:bg-red-600 hover:text-white rounded-xl cursor-pointer"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={!!toDelete}
        title="წაშლა"
        message="ნამდვილად გსურთ ამ ჩანაწერის წაშლა?"
        onConfirm={() => toDelete && remove(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
};
