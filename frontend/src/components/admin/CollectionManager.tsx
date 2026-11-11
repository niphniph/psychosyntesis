import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, X, Search, ArrowUp, ArrowDown, Save } from 'lucide-react';
import api from '../../api';
import { RichTextEditor } from '../RichTextEditor';
import { ConfirmModal } from '../ConfirmModal';
import { Field, MediaInput, PageHeader, PrimaryButton, GhostButton, Toggle, inputClass, getApiError } from './ui';

export interface CollectionField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'richtext' | 'image' | 'file' | 'select' | 'list' | 'date' | 'checkbox';
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  help?: string;
  wide?: boolean;
}

interface CollectionManagerProps {
  endpoint: string; // e.g. "courses" → /admin/courses
  title: string;
  subtitle: string;
  itemLabel: string; // "კურსი"
  fields: CollectionField[];
  /** Columns shown in the list: field keys */
  listColumns: string[];
  defaults?: Record<string, any>;
  showToast: (msg: string) => void;
  onDirtyChange: (dirty: boolean) => void;
}

type Item = Record<string, any> & { id: string };

export const CollectionManager: React.FC<CollectionManagerProps> = ({
  endpoint, title, subtitle, itemLabel, fields, listColumns, defaults = {}, showToast, onDirtyChange
}) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Partial<Item> | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Item | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/${endpoint}`);
      if (Array.isArray(res.data)) setItems(res.data);
    } catch (err) {
      showToast(getApiError(err, 'მონაცემების ჩატვირთვა ვერ მოხერხდა'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [endpoint]);

  const openEditor = (item?: Item) => {
    setEditing(item ? { ...item } : { ...defaults });
    onDirtyChange(true);
  };

  const closeEditor = () => {
    setEditing(null);
    onDirtyChange(false);
  };

  const setField = (key: string, value: any) => setEditing(prev => ({ ...prev, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        await api.put(`/admin/${endpoint}/${editing.id}`, editing);
        showToast(`${itemLabel} განახლდა`);
      } else {
        await api.post(`/admin/${endpoint}`, editing);
        showToast(`${itemLabel} დაემატა`);
      }
      closeEditor();
      load();
    } catch (err) {
      showToast(getApiError(err, 'შენახვის შეცდომა'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: Item) => {
    try {
      await api.delete(`/admin/${endpoint}/${item.id}`);
      showToast(`${itemLabel} წაიშალა`);
      load();
    } catch (err) {
      showToast(getApiError(err, 'წაშლის შეცდომა'));
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    try {
      await api.put(`/admin/${endpoint}/reorder`, { orderedIds: next.map(i => i.id) });
    } catch {
      load();
    }
  };

  const renderInput = (f: CollectionField) => {
    const v = editing?.[f.key];
    switch (f.type) {
      case 'textarea':
        return <textarea rows={3} value={v || ''} onChange={(e) => setField(f.key, e.target.value)} className={inputClass} placeholder={f.placeholder} />;
      case 'richtext':
        return <RichTextEditor value={v || ''} onChange={(val) => setField(f.key, val)} />;
      case 'image':
        return <MediaInput value={v || ''} onChange={(val) => setField(f.key, val)} />;
      case 'file':
        return <MediaInput value={v || ''} onChange={(val) => setField(f.key, val)} accept="file" placeholder="ფაილის ბმული (PDF) ან ატვირთეთ ბიბლიოთეკაში" />;
      case 'select':
        return (
          <select value={v ?? f.options?.[0]?.value ?? ''} onChange={(e) => setField(f.key, e.target.value)} className={inputClass}>
            {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        );
      case 'list':
        return (
          <textarea
            rows={4}
            value={Array.isArray(v) ? v.join('\n') : v || ''}
            onChange={(e) => setField(f.key, e.target.value.split('\n'))}
            onBlur={(e) => setField(f.key, e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
            className={inputClass}
            placeholder="თითო ხაზზე ერთი ელემენტი"
          />
        );
      case 'date':
        return <input type="date" value={v || ''} onChange={(e) => setField(f.key, e.target.value)} className={inputClass} />;
      case 'checkbox':
        return <Toggle checked={!!v} onChange={(val) => setField(f.key, val)} label={f.placeholder || 'დიახ'} />;
      default:
        return <input value={v || ''} onChange={(e) => setField(f.key, e.target.value)} className={inputClass} placeholder={f.placeholder} required={f.required} />;
    }
  };

  const display = (item: Item, key: string) => {
    const f = fields.find(x => x.key === key);
    const v = item[key];
    if (f?.type === 'select') return f.options?.find(o => o.value === v)?.label || v;
    if (f?.type === 'checkbox') return v ? '✓' : '';
    if (Array.isArray(v)) return v.join(', ');
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(v).toLocaleDateString('ka-GE');
    return typeof v === 'string' ? v.replace(/<[^>]+>/g, ' ').slice(0, 80) : v;
  };

  const q = search.toLowerCase();
  const filtered = items.filter(i => !q || listColumns.some(k => String(display(i, k) ?? '').toLowerCase().includes(q)));
  const imageKey = fields.find(f => f.type === 'image')?.key;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={<PrimaryButton onClick={() => openEditor()}><Plus size={16} /> ახალი {itemLabel}</PrimaryButton>}
      />

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ძებნა..." className={`${inputClass} pl-9`} />
      </div>

      <div className="bg-[#0b251c] rounded-3xl border border-[#c7a85b]/20 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-white">
            <thead className="bg-[#00241a] text-[#c7a85b] border-b border-[#c7a85b]/20 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4 w-16">რიგი</th>
                {imageKey && <th className="p-4 w-20">სურათი</th>}
                {listColumns.map(k => <th key={k} className="p-4">{fields.find(f => f.key === k)?.label || k}</th>)}
                <th className="p-4 text-right">მოქმედებები</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={listColumns.length + 3} className="p-8 text-center text-[#a4d0be]">იტვირთება...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={listColumns.length + 3} className="p-8 text-center text-[#a4d0be]/70 italic">ჩანაწერები არ არის</td></tr>
              ) : filtered.map((item) => {
                const idx = items.indexOf(item);
                return (
                  <tr key={item.id} className="hover:bg-[#00241a]/60 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => move(idx, -1)} disabled={!!q} className="hover:text-[#c7a85b] p-1 disabled:opacity-30 cursor-pointer"><ArrowUp size={14} /></button>
                        <button onClick={() => move(idx, 1)} disabled={!!q} className="hover:text-[#c7a85b] p-1 disabled:opacity-30 cursor-pointer"><ArrowDown size={14} /></button>
                      </div>
                    </td>
                    {imageKey && (
                      <td className="p-4">
                        {item[imageKey] ? <img src={item[imageKey]} alt="" className="w-12 h-12 rounded-lg object-cover" /> : <div className="w-12 h-12 rounded-lg bg-[#00241a]" />}
                      </td>
                    )}
                    {listColumns.map((k, ci) => (
                      <td key={k} className={`p-4 ${ci === 0 ? 'font-bold text-sm' : 'text-[#a4d0be]'}`}>{display(item, k)}</td>
                    ))}
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditor(item)} title="რედაქტირება" className="p-2 bg-[#c7a85b]/20 text-[#c7a85b] hover:bg-[#c7a85b] hover:text-[#00241a] rounded-xl transition-all cursor-pointer"><Edit size={14} /></button>
                        <button onClick={() => setToDelete(item)} title="წაშლა" className="p-2 bg-red-950/60 text-red-400 hover:bg-red-600 hover:text-white rounded-xl transition-all cursor-pointer"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <form onSubmit={handleSave} className="bg-[#0b251c] border border-[#c7a85b]/40 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-left">
            <div className="bg-[#00241a] p-5 border-b border-[#c7a85b]/20 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">{editing.id ? `${itemLabel}: რედაქტირება` : `ახალი ${itemLabel}`}</h3>
              <button type="button" onClick={closeEditor} className="text-white/60 hover:text-white p-2 rounded-xl hover:bg-white/10 cursor-pointer"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              {fields.map(f => (
                <Field
                  key={f.key}
                  label={f.label + (f.required ? ' *' : '')}
                  help={f.help}
                  className={f.wide || ['richtext', 'textarea', 'list', 'image', 'file'].includes(f.type) ? 'md:col-span-2' : ''}
                >
                  {renderInput(f)}
                </Field>
              ))}
            </div>
            <div className="p-4 bg-[#00241a] border-t border-[#c7a85b]/20 flex justify-end gap-3">
              <GhostButton type="button" onClick={closeEditor}>გაუქმება</GhostButton>
              <PrimaryButton type="submit" disabled={saving}><Save size={14} /> {saving ? 'ინახება...' : 'შენახვა'}</PrimaryButton>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        isOpen={!!toDelete}
        title={`${itemLabel}: წაშლა`}
        message={`ნამდვილად გსურთ წაშალოთ "${toDelete?.title || ''}"?`}
        onConfirm={() => { if (toDelete) handleDelete(toDelete); }}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
};
