'use client';

import { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered } from 'lucide-react';

const TOOLS = [
  { cmd: 'bold',                label: 'Đậm (Ctrl+B)',       Icon: Bold         },
  { cmd: 'italic',              label: 'Nghiêng (Ctrl+I)',    Icon: Italic       },
  { cmd: 'underline',           label: 'Gạch dưới (Ctrl+U)', Icon: Underline    },
  null,
  { cmd: 'insertUnorderedList', label: 'Danh sách chấm',     Icon: List         },
  { cmd: 'insertOrderedList',   label: 'Danh sách số',       Icon: ListOrdered  },
];

export default function SimpleRichEditor({
  value = '',
  onChange,
  placeholder = 'Nhập nội dung...',
  minHeight = 120,
  className = '',
}) {
  const editorRef  = useRef(null);
  const didInit    = useRef(false);
  const prevEmpty  = useRef(value === '');

  // Set initial HTML once on mount
  useEffect(() => {
    if (editorRef.current && !didInit.current) {
      editorRef.current.innerHTML = value || '';
      didInit.current = true;
      prevEmpty.current = !value;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When parent resets value to '' (e.g. after close/submit), clear editor
  useEffect(() => {
    if (value === '' && editorRef.current && editorRef.current.innerHTML !== '') {
      editorRef.current.innerHTML = '';
      prevEmpty.current = true;
    }
  }, [value]);

  const exec = (cmd) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, null);
    onChange?.(editorRef.current?.innerHTML ?? '');
  };

  const handleInput = () => {
    const html = editorRef.current?.innerHTML ?? '';
    prevEmpty.current = html === '' || html === '<br>';
    onChange?.(html);
  };

  return (
    <div
      className={`border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all bg-slate-50 dark:bg-slate-800/60 ${className}`}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60">
        {TOOLS.map((tool, i) =>
          tool === null ? (
            <div key={i} className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
          ) : (
            <button
              key={tool.cmd}
              type="button"
              title={tool.label}
              onMouseDown={(e) => { e.preventDefault(); exec(tool.cmd); }}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <tool.Icon className="h-3.5 w-3.5" />
            </button>
          )
        )}
      </div>

      {/* Editable content area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={handleInput}
        style={{ minHeight }}
        className="px-4 py-3 text-sm text-slate-900 dark:text-white outline-none overflow-y-auto max-h-60 rich-content
          [&:empty::before]:content-[attr(data-placeholder)]
          [&:empty::before]:text-slate-400
          dark:[&:empty::before]:text-slate-500
          [&:empty::before]:pointer-events-none"
      />
    </div>
  );
}
