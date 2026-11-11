import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle, Color } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import Youtube from '@tiptap/extension-youtube';
import { Placeholder, CharacterCount } from '@tiptap/extensions';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered, Quote, Minus,
  Link as LinkIcon, Unlink, Image as ImageIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Undo2, Redo2, RemoveFormatting, Table as TableIcon, Video as YoutubeIcon, Code2, Maximize2,
  Minimize2, Highlighter, Palette, Trash2, Rows3, Columns3
} from 'lucide-react';
import { MediaLibraryModal } from './MediaLibraryModal';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  /** Compact editors (e.g. short section texts) hide the heavier tools */
  compact?: boolean;
}

const TEXT_COLORS = ['#fbf9f3', '#c7a85b', '#e4c373', '#a4d0be', '#bfecd9', '#7A8E46', '#ef4444', '#60a5fa'];

const ToolbarButton: React.FC<{
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    title={title}
    disabled={disabled}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
      active ? 'bg-[#c7a85b] text-[#00241a]' : 'text-[#a4d0be] hover:bg-[#c7a85b]/20 hover:text-[#c7a85b]'
    }`}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-5 bg-white/10 mx-1" />;

const Toolbar: React.FC<{
  editor: Editor;
  compact?: boolean;
  onOpenMedia: () => void;
}> = ({ editor, compact, onOpenMedia }) => {
  const [colorOpen, setColorOpen] = useState(false);

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      block: e.isActive('heading', { level: 1 }) ? 'h1'
        : e.isActive('heading', { level: 2 }) ? 'h2'
        : e.isActive('heading', { level: 3 }) ? 'h3'
        : e.isActive('heading', { level: 4 }) ? 'h4'
        : 'p',
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      highlight: e.isActive('highlight'),
      link: e.isActive('link'),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      table: e.isActive('table'),
      alignLeft: e.isActive({ textAlign: 'left' }),
      alignCenter: e.isActive({ textAlign: 'center' }),
      alignRight: e.isActive({ textAlign: 'right' }),
      alignJustify: e.isActive({ textAlign: 'justify' }),
      canUndo: e.can().undo(),
      canRedo: e.can().redo()
    })
  });

  const setBlock = (val: string) => {
    const chain = editor.chain().focus();
    if (val === 'p') chain.setParagraph().run();
    else chain.setHeading({ level: Number(val.slice(1)) as 1 | 2 | 3 | 4 }).run();
  };

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('ბმულის მისამართი (URL):', prev || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: url.startsWith('http') ? '_blank' : null }).run();
  };

  const insertImageByUrl = () => {
    const url = window.prompt('სურათის მისამართი (URL):', 'https://');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const insertYoutube = () => {
    const url = window.prompt('YouTube ვიდეოს ბმული:');
    if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
  };

  return (
    <div className="bg-[#0b251c] border-b border-[#c7a85b]/20 p-2 flex flex-wrap gap-1 items-center text-xs sticky top-0 z-10">
      <select
        value={state.block}
        onChange={(e) => setBlock(e.target.value)}
        className="bg-[#00241a] border border-[#c7a85b]/30 text-white rounded-lg px-2 py-1.5 text-xs focus:outline-none mr-1"
        title="ტექსტის ფორმატი"
      >
        <option value="p">აბზაცი</option>
        <option value="h1">სათაური 1</option>
        <option value="h2">სათაური 2</option>
        <option value="h3">სათაური 3</option>
        <option value="h4">სათაური 4</option>
      </select>

      <ToolbarButton title="მუქი (Ctrl+B)" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={15} /></ToolbarButton>
      <ToolbarButton title="დახრილი (Ctrl+I)" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={15} /></ToolbarButton>
      <ToolbarButton title="ხაზგასმული (Ctrl+U)" active={state.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={15} /></ToolbarButton>
      <ToolbarButton title="გადახაზული" active={state.strike} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={15} /></ToolbarButton>

      <div className="relative">
        <ToolbarButton title="ტექსტის ფერი" onClick={() => setColorOpen(o => !o)}><Palette size={15} /></ToolbarButton>
        {colorOpen && (
          <div className="absolute top-full left-0 mt-1 bg-[#00241a] border border-[#c7a85b]/40 rounded-xl p-2 grid grid-cols-4 gap-1.5 z-20 shadow-2xl w-36">
            {TEXT_COLORS.map(c => (
              <button
                key={c}
                type="button"
                title={c}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { editor.chain().focus().setColor(c).run(); setColorOpen(false); }}
                className="w-6 h-6 rounded-md border border-white/20 cursor-pointer"
                style={{ backgroundColor: c }}
              />
            ))}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { editor.chain().focus().unsetColor().run(); setColorOpen(false); }}
              className="col-span-4 text-[10px] text-[#a4d0be] hover:text-white pt-1 cursor-pointer"
            >
              ფერის მოხსნა
            </button>
          </div>
        )}
      </div>
      <ToolbarButton title="მარკერი" active={state.highlight} onClick={() => editor.chain().focus().toggleHighlight({ color: '#c7a85b55' }).run()}><Highlighter size={15} /></ToolbarButton>

      <Divider />

      <ToolbarButton title="მარცხნივ" active={state.alignLeft} onClick={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeft size={15} /></ToolbarButton>
      <ToolbarButton title="ცენტრში" active={state.alignCenter} onClick={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenter size={15} /></ToolbarButton>
      <ToolbarButton title="მარჯვნივ" active={state.alignRight} onClick={() => editor.chain().focus().setTextAlign('right').run()}><AlignRight size={15} /></ToolbarButton>
      <ToolbarButton title="გასწორება" active={state.alignJustify} onClick={() => editor.chain().focus().setTextAlign('justify').run()}><AlignJustify size={15} /></ToolbarButton>

      <Divider />

      <ToolbarButton title="ბულეტ სია" active={state.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={15} /></ToolbarButton>
      <ToolbarButton title="დანომრილი სია" active={state.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={15} /></ToolbarButton>
      <ToolbarButton title="ციტატა" active={state.quote} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={15} /></ToolbarButton>
      <ToolbarButton title="გამყოფი ხაზი" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={15} /></ToolbarButton>

      <Divider />

      <ToolbarButton title="ბმულის ჩასმა" active={state.link} onClick={setLink}><LinkIcon size={15} /></ToolbarButton>
      {state.link && (
        <ToolbarButton title="ბმულის მოხსნა" onClick={() => editor.chain().focus().unsetLink().run()}><Unlink size={15} /></ToolbarButton>
      )}

      {!compact && (
        <>
          <ToolbarButton title="სურათი URL-ით" onClick={insertImageByUrl}><ImageIcon size={15} /></ToolbarButton>
          <ToolbarButton title="YouTube ვიდეო" onClick={insertYoutube}><YoutubeIcon size={15} /></ToolbarButton>
          <ToolbarButton title="ცხრილის ჩასმა" active={state.table} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon size={15} /></ToolbarButton>
          {state.table && (
            <>
              <ToolbarButton title="სტრიქონის დამატება" onClick={() => editor.chain().focus().addRowAfter().run()}><Rows3 size={15} /></ToolbarButton>
              <ToolbarButton title="სვეტის დამატება" onClick={() => editor.chain().focus().addColumnAfter().run()}><Columns3 size={15} /></ToolbarButton>
              <ToolbarButton title="ცხრილის წაშლა" onClick={() => editor.chain().focus().deleteTable().run()}><Trash2 size={15} /></ToolbarButton>
            </>
          )}
        </>
      )}

      <Divider />

      <ToolbarButton title="ფორმატირების მოხსნა" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}><RemoveFormatting size={15} /></ToolbarButton>
      <ToolbarButton title="დაბრუნება (Ctrl+Z)" disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()}><Undo2 size={15} /></ToolbarButton>
      <ToolbarButton title="გამეორება (Ctrl+Y)" disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()}><Redo2 size={15} /></ToolbarButton>

      <button
        type="button"
        onClick={onOpenMedia}
        className="ml-auto px-3 py-1.5 bg-[#c7a85b]/20 text-[#c7a85b] hover:bg-[#c7a85b] hover:text-[#00241a] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
      >
        <ImageIcon size={14} /> მედიის დამატება
      </button>
    </div>
  );
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'დაიწყეთ წერა...',
  minHeight = 320,
  compact = false
}) => {
  const [mode, setMode] = useState<'visual' | 'html'>('visual');
  const [fullscreen, setFullscreen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer' } }
      }),
      Image.configure({ HTMLAttributes: { class: 'cms-image' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Youtube.configure({ width: 640, height: 360, nocookie: true }),
      Placeholder.configure({ placeholder }),
      CharacterCount
    ],
    content: value || '',
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    }
  });

  // Sync external value changes (e.g. switching to another record) into the editor
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const current = editor.getHTML();
    const normalizedCurrent = current === '<p></p>' ? '' : current;
    if ((value || '') !== normalizedCurrent && !editor.isFocused) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [value, editor]);

  const counts = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      words: e?.storage.characterCount.words() ?? 0,
      chars: e?.storage.characterCount.characters() ?? 0
    })
  });

  const switchMode = (next: 'visual' | 'html') => {
    if (next === mode) return;
    if (next === 'visual' && editor) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
    setMode(next);
  };

  const handleMediaSelect = (url: string, altText?: string) => {
    if (!editor) return;
    if (/\.pdf($|\?)/i.test(url)) {
      editor.chain().focus().insertContent(`<a href="${url}" target="_blank">${altText || 'PDF დოკუმენტი'}</a>`).run();
    } else {
      editor.chain().focus().setImage({ src: url, alt: altText || '' }).run();
    }
    setMediaOpen(false);
  };

  return (
    <div
      className={`wp-editor border border-[#c7a85b]/30 bg-[#00241a] overflow-hidden shadow-inner flex flex-col ${
        fullscreen ? 'fixed inset-4 z-[150] rounded-2xl shadow-2xl' : 'rounded-2xl'
      }`}
    >
      {/* Visual / HTML tabs, like the WordPress classic editor */}
      <div className="flex items-center justify-between bg-[#00241a] px-2 pt-2">
        <div className="flex gap-1">
          {(['visual', 'html'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`px-3.5 py-1.5 rounded-t-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                mode === m ? 'bg-[#0b251c] text-[#c7a85b]' : 'text-[#a4d0be]/70 hover:text-white'
              }`}
            >
              {m === 'visual' ? 'ვიზუალური' : <><Code2 size={12} /> HTML</>}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setFullscreen(f => !f)}
          title={fullscreen ? 'სრული ეკრანიდან გამოსვლა' : 'სრული ეკრანი'}
          className="p-1.5 text-[#a4d0be] hover:text-[#c7a85b] cursor-pointer"
        >
          {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
      </div>

      {mode === 'visual' && editor && (
        <Toolbar editor={editor} compact={compact} onOpenMedia={() => setMediaOpen(true)} />
      )}

      <div className="flex-1 overflow-y-auto" style={{ minHeight: fullscreen ? undefined : minHeight }}>
        {mode === 'visual' ? (
          <EditorContent editor={editor} className="cms-content wp-editor-content h-full" />
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            className="w-full h-full bg-transparent p-4 text-sm text-[#fbf9f3] focus:outline-none resize-none font-mono leading-relaxed"
            style={{ minHeight: fullscreen ? '100%' : minHeight }}
          />
        )}
      </div>

      <div className="bg-[#0b251c]/60 px-4 py-1.5 border-t border-white/5 flex justify-between text-[11px] text-[#a4d0be]/60 font-mono">
        <span>{mode === 'visual' ? 'ვიზუალური რედაქტორი' : 'HTML რეჟიმი'}</span>
        <span>{counts?.words ?? 0} სიტყვა · {counts?.chars ?? 0} სიმბოლო</span>
      </div>

      <MediaLibraryModal
        isOpen={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelectImage={handleMediaSelect}
      />
    </div>
  );
};
