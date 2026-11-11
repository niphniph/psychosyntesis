import React, { useEffect, useState } from 'react';
import { Save, Trash2, Plus } from 'lucide-react';
import api from '../../api';
import { Card, Field, PageHeader, PrimaryButton, inputClass, getApiError } from './ui';

interface SeoSetting {
  path: string;
  title: string;
  description: string;
  keywords: string;
}

const BUILT_IN = [
  { path: '/', label: 'მთავარი გვერდი' },
  { path: '/founder', label: 'დამფუძნებელი' },
  { path: '/academic', label: 'აკადემიური პორტალი' },
  { path: '/events', label: 'ღონისძიებები' },
  { path: '/practice', label: 'მედიტაციის ოთახი' },
  { path: '/login', label: 'შესვლა' }
];

export const SeoManager: React.FC<{ showToast: (msg: string) => void }> = ({ showToast }) => {
  const [settings, setSettings] = useState<SeoSetting[]>([]);

  useEffect(() => {
    api.get('/admin/seo').then(res => {
      const existing: SeoSetting[] = Array.isArray(res.data) ? res.data : [];
      const merged = [...existing];
      BUILT_IN.forEach(b => {
        if (!merged.some(s => s.path === b.path)) merged.push({ path: b.path, title: '', description: '', keywords: '' });
      });
      setSettings(merged);
    }).catch(err => showToast(getApiError(err, 'SEO ჩატვირთვის შეცდომა')));
  }, []);

  const update = (idx: number, key: keyof SeoSetting, value: string) =>
    setSettings(prev => prev.map((s, i) => (i === idx ? { ...s, [key]: value } : s)));

  const save = async (s: SeoSetting) => {
    try {
      await api.put('/admin/seo', s);
      showToast(`SEO შენახულია: ${s.path}`);
    } catch (err) {
      showToast(getApiError(err, 'შენახვის შეცდომა'));
    }
  };

  const remove = async (idx: number) => {
    const s = settings[idx];
    try {
      await api.delete('/admin/seo', { params: { path: s.path } });
      setSettings(prev => prev.filter((_, i) => i !== idx));
    } catch (err) {
      showToast(getApiError(err, 'წაშლის შეცდომა'));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <PageHeader
        title="SEO პარამეტრები"
        subtitle="ბრაუზერის ჩანართის სათაური და საძიებო სისტემების აღწერა თითოეული გვერდისთვის"
        actions={
          <PrimaryButton onClick={() => setSettings(prev => [...prev, { path: '/new-page', title: '', description: '', keywords: '' }])}>
            <Plus size={15} /> გვერდის დამატება
          </PrimaryButton>
        }
      />
      <p className="text-xs text-[#a4d0be]/70">სტატიებისა და დინამიური გვერდების SEO იცვლება თავად სტატიის / გვერდის რედაქტორში.</p>

      {settings.map((s, idx) => {
        const builtIn = BUILT_IN.find(b => b.path === s.path);
        return (
          <Card
            key={idx}
            title={builtIn ? `${builtIn.label} (${s.path})` : s.path}
            actions={
              <div className="flex gap-2">
                {!builtIn && (
                  <button onClick={() => remove(idx)} className="p-2 bg-red-950/60 text-red-400 hover:bg-red-600 hover:text-white rounded-xl cursor-pointer"><Trash2 size={14} /></button>
                )}
                <PrimaryButton onClick={() => save(s)}><Save size={14} /> შენახვა</PrimaryButton>
              </div>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!builtIn && (
                <Field label="გვერდის მისამართი (path)">
                  <input value={s.path} onChange={(e) => update(idx, 'path', e.target.value)} className={inputClass} />
                </Field>
              )}
              <Field label={`სათაური (${s.title.length}/60)`} className={builtIn ? 'md:col-span-2' : ''}>
                <input value={s.title} onChange={(e) => update(idx, 'title', e.target.value)} className={inputClass} />
              </Field>
              <Field label={`აღწერა (${s.description.length}/160)`} className="md:col-span-2">
                <textarea rows={2} value={s.description} onChange={(e) => update(idx, 'description', e.target.value)} className={inputClass} />
              </Field>
              <Field label="საკვანძო სიტყვები" className="md:col-span-2" help="მძიმით გამოყოფილი">
                <input value={s.keywords} onChange={(e) => update(idx, 'keywords', e.target.value)} className={inputClass} />
              </Field>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
