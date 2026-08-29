import React, { useRef } from 'react';
import { Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Link as LinkIcon, Image as ImageIcon, Minus } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onOpenMediaLibrary?: () => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  onOpenMediaLibrary,
  placeholder = 'Write content here...'
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    const replacement = `${prefix}${selectedText || 'text'}${suffix}`;
    const newValue = value.substring(0, start) + replacement + value.substring(end);

    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText ? selectedText.length : 4));
    }, 0);
  };

  const insertTag = (tag: string, endTag?: string) => {
    insertFormatting(`<${tag}>`, endTag ? `</${endTag}>` : `</${tag}>`);
  };

  return (
    <div className="border border-[#c7a85b]/30 rounded-2xl bg-[#00241a] overflow-hidden shadow-inner flex flex-col">
      {/* Editor Toolbar */}
      <div className="bg-[#0b251c] border-b border-[#c7a85b]/20 p-2.5 flex flex-wrap gap-1.5 items-center text-xs text-[#a4d0be]">
        <button
          type="button"
          onClick={() => insertTag('h2')}
          title="Heading 2"
          className="p-1.5 hover:bg-[#c7a85b]/20 hover:text-[#c7a85b] rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-bold"
        >
          <Heading1 size={15} /> H2
        </button>
        <button
          type="button"
          onClick={() => insertTag('h3')}
          title="Heading 3"
          className="p-1.5 hover:bg-[#c7a85b]/20 hover:text-[#c7a85b] rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-bold"
        >
          <Heading2 size={15} /> H3
        </button>
        <button
          type="button"
          onClick={() => insertTag('p')}
          title="Paragraph"
          className="p-1.5 hover:bg-[#c7a85b]/20 hover:text-[#c7a85b] rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-bold"
        >
          <Heading3 size={15} /> P
        </button>

        <div className="w-px h-5 bg-white/10 mx-1"></div>

        <button
          type="button"
          onClick={() => insertTag('strong')}
          title="Bold"
          className="p-1.5 hover:bg-[#c7a85b]/20 hover:text-[#c7a85b] rounded-lg transition-colors cursor-pointer"
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          onClick={() => insertTag('em')}
          title="Italic"
          className="p-1.5 hover:bg-[#c7a85b]/20 hover:text-[#c7a85b] rounded-lg transition-colors cursor-pointer"
        >
          <Italic size={15} />
        </button>

        <div className="w-px h-5 bg-white/10 mx-1"></div>

        <button
          type="button"
          onClick={() => insertFormatting('<ul>\n  <li>', '</li>\n</ul>')}
          title="Bullet List"
          className="p-1.5 hover:bg-[#c7a85b]/20 hover:text-[#c7a85b] rounded-lg transition-colors cursor-pointer"
        >
          <List size={15} />
        </button>
        <button
          type="button"
          onClick={() => insertFormatting('<ol>\n  <li>', '</li>\n</ol>')}
          title="Numbered List"
          className="p-1.5 hover:bg-[#c7a85b]/20 hover:text-[#c7a85b] rounded-lg transition-colors cursor-pointer"
        >
          <ListOrdered size={15} />
        </button>
        <button
          type="button"
          onClick={() => insertTag('blockquote')}
          title="Quote"
          className="p-1.5 hover:bg-[#c7a85b]/20 hover:text-[#c7a85b] rounded-lg transition-colors cursor-pointer"
        >
          <Quote size={15} />
        </button>
        <button
          type="button"
          onClick={() => insertFormatting('<hr />\n')}
          title="Horizontal Divider"
          className="p-1.5 hover:bg-[#c7a85b]/20 hover:text-[#c7a85b] rounded-lg transition-colors cursor-pointer"
        >
          <Minus size={15} />
        </button>

        <div className="w-px h-5 bg-white/10 mx-1"></div>

        <button
          type="button"
          onClick={() => {
            const url = prompt('Enter link URL:');
            if (url) insertFormatting(`<a href="${url}" target="_blank" rel="noopener noreferrer">`, '</a>');
          }}
          title="Insert Link"
          className="p-1.5 hover:bg-[#c7a85b]/20 hover:text-[#c7a85b] rounded-lg transition-colors cursor-pointer"
        >
          <LinkIcon size={15} />
        </button>

        {onOpenMediaLibrary && (
          <button
            type="button"
            onClick={onOpenMediaLibrary}
            title="Insert Image from Library"
            className="p-1.5 bg-[#c7a85b]/20 text-[#c7a85b] hover:bg-[#c7a85b] hover:text-[#00241a] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold ml-auto"
          >
            <ImageIcon size={14} /> Media Library
          </button>
        )}
      </div>

      {/* Editor Body */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={12}
        className="w-full bg-transparent p-4 text-sm text-[#fbf9f3] placeholder-white/30 focus:outline-none resize-y font-mono leading-relaxed selection:bg-[#c7a85b] selection:text-[#00241a]"
      />
      <div className="bg-[#0b251c]/60 px-4 py-1.5 border-t border-white/5 flex justify-between text-[11px] text-[#a4d0be]/60 font-mono">
        <span>HTML Mode Active</span>
        <span>{value.length} characters</span>
      </div>
    </div>
  );
};
