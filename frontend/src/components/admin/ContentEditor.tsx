import React, { useEffect, useMemo, useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import api from '../../api';
import { contentSchema, contentDefaults, type ContentField } from '../../content/schema';
import { RichTextEditor } from '../RichTextEditor';
import { Card, Field, MediaInput, ImageListInput, PageHeader, PrimaryButton, inputClass, getApiError } from './ui';

interface ContentEditorProps {
  showToast: (msg: string) => void;
  onDirtyChange: (dirty: boolean) => void;
}

/** Edits every text/image of the site defined in content/schema.ts, grouped by page */
export const ContentEditor: React.FC<ContentEditorProps> = ({ showToast, onDirtyChange }) => {
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [activeGroup, setActiveGroup] = useState(contentSchema[0].id);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/settings').then(res => {
      const data = res.data && typeof res.data === 'object' ? res.data : {};
      const merged = { ...contentDefaults, ...data };
      setSaved(merged);
      setValues(merged);
    }).catch(() => showToast('პარამეტრების ჩატვირთვა ვერ მოხერხდა'));
  }, []);

  const dirtyKeys = useMemo(() => Object.keys(values).filter(k => values[k] !== saved[k]), [values, saved]);

  useEffect(() => {
    onDirtyChange(dirtyKeys.length > 0);
  }, [dirtyKeys.length]);

  const setValue = (key: string, v: string) => setValues(prev => ({ ...prev, [key]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      // Send every schema key so that blank values deliberately hide a text on the site
      const payload: Record<string, string> = {};
      Object.keys(contentDefaults).forEach(k => { payload[k] = values[k] ?? ''; });
      dirtyKeys.forEach(k => { payload[k] = values[k] ?? ''; });
      const res = await api.put('/admin/settings', payload);
      const merged = { ...contentDefaults, ...res.data };
      setSaved(merged);
      setValues(merged);
      showToast('საიტის კონტენტი შენახულია!');
    } catch (err) {
      showToast(getApiError(err, 'შენახვის შეცდომა'));
    } finally {
      setSaving(false);
    }
  };

  const group = contentSchema.find(g => g.id === activeGroup)!;

  const renderInput = (f: ContentField) => {
    const v = values[f.key] ?? '';
    switch (f.type) {
      case 'textarea':
      case 'lines':
        return <textarea rows={f.type === 'lines' ? 4 : 3} value={v} onChange={(e) => setValue(f.key, e.target.value)} className={inputClass} />;
      case 'richtext':
        return <RichTextEditor value={v} onChange={(val) => setValue(f.key, val)} minHeight={160} compact />;
      case 'image':
        return <MediaInput value={v} onChange={(val) => setValue(f.key, val)} />;
      case 'images':
        return <ImageListInput value={v} onChange={(val) => setValue(f.key, val)} />;
      case 'link':
        return <input value={v} onChange={(e) => setValue(f.key, e.target.value)} className={inputClass} placeholder="/academic, /founder, /page-slug, https://..." list="cms-link-suggestions" />;
      default:
        return <input value={v} onChange={(e) => setValue(f.key, e.target.value)} className={inputClass} />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="საიტის ტექსტები და სურათები"
        subtitle="ყველა წარწერა, სათაური, ღილაკი და სურათი, გვერდების მიხედვით"
        actions={
          <>
            {dirtyKeys.length > 0 && (
              <button onClick={() => setValues(saved)} className="text-xs text-[#a4d0be] hover:text-white flex items-center gap-1 px-3 cursor-pointer">
                <RotateCcw size={13} /> ცვლილებების გაუქმება
              </button>
            )}
            <PrimaryButton onClick={handleSave} disabled={saving || dirtyKeys.length === 0}>
              <Save size={15} /> {saving ? 'ინახება...' : dirtyKeys.length ? `შენახვა (${dirtyKeys.length})` : 'შენახულია'}
            </PrimaryButton>
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        {contentSchema.map(g => {
          const groupDirty = g.sections.some(s => s.fields.some(f => dirtyKeys.includes(f.key)));
          return (
            <button
              key={g.id}
              onClick={() => setActiveGroup(g.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                activeGroup === g.id ? 'bg-[#c7a85b] text-[#00241a] border-[#c7a85b]' : 'bg-[#0b251c] text-[#a4d0be] border-[#c7a85b]/20 hover:text-white'
              }`}
            >
              {g.label}{groupDirty && ' •'}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-[#a4d0be]/80">{group.description}</p>

      {group.sections.map(section => (
        <Card key={section.title} title={section.title}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.fields.map(f => (
              <Field
                key={f.key}
                label={f.label + (values[f.key] !== saved[f.key] ? ' •' : '')}
                help={f.help}
                className={['richtext', 'images', 'textarea', 'lines'].includes(f.type) ? 'md:col-span-2' : ''}
              >
                {renderInput(f)}
              </Field>
            ))}
          </div>
        </Card>
      ))}

      <datalist id="cms-link-suggestions">
        {['/', '/founder', '/academic', '/events', '/practice', '/workspace', '/#about-philosophy'].map(l => <option key={l} value={l} />)}
      </datalist>
    </div>
  );
};
