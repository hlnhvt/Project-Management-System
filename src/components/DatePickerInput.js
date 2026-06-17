'use client';

import { useRef, useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

// Parses DD/MM/YYYY typed input → YYYY-MM-DD (or '' if invalid)
function parseViDate(str) {
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return '';
  const [, d, mo, y] = m;
  const date = new Date(`${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00`);
  if (isNaN(date.getTime())) return '';
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function toViDisplay(isoValue) {
  if (!isoValue) return '';
  const d = new Date(isoValue + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function DatePickerInput({
  value,
  onChange,
  className = '',
  placeholder = 'DD/MM/YYYY',
  disabled = false,
}) {
  const hiddenRef = useRef(null);
  const [typed, setTyped] = useState('');
  const [focused, setFocused] = useState(false);

  // Sync external value → display when not focused
  useEffect(() => {
    if (!focused) {
      setTyped(toViDisplay(value));
    }
  }, [value, focused]);

  const openPicker = (e) => {
    e.preventDefault();
    if (disabled || !hiddenRef.current) return;
    try { hiddenRef.current.showPicker(); }
    catch { hiddenRef.current.focus(); }
  };

  const handleTypedChange = (e) => {
    const raw = e.target.value;
    setTyped(raw);
    // Auto-format digits: insert slashes at position 2 and 5
    const digits = raw.replace(/\D/g, '');
    if (digits.length <= 2) { setTyped(digits); return; }
    if (digits.length <= 4) { setTyped(digits.slice(0, 2) + '/' + digits.slice(2)); return; }
    const formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8);
    setTyped(formatted);
    const iso = parseViDate(formatted);
    if (iso && onChange) onChange({ target: { value: iso } });
  };

  const handleTypedBlur = () => {
    setFocused(false);
    const iso = parseViDate(typed);
    if (iso) {
      if (onChange) onChange({ target: { value: iso } });
      setTyped(toViDisplay(iso));
    } else {
      // Revert to current valid value display
      setTyped(toViDisplay(value));
    }
  };

  const handleHiddenChange = (e) => {
    if (onChange) onChange(e);
    setTyped(toViDisplay(e.target.value));
  };

  return (
    <div className={`relative flex items-center group ${className}`}>
      <input
        type="text"
        value={typed}
        onChange={handleTypedChange}
        onFocus={() => setFocused(true)}
        onBlur={handleTypedBlur}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={10}
        className="flex-1 min-w-0 w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 group-hover:border-indigo-400 dark:group-hover:border-indigo-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 focus:outline-none transition-colors pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <button
        type="button"
        onClick={openPicker}
        disabled={disabled}
        tabIndex={-1}
        className="absolute right-3 text-indigo-400 dark:text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-40"
      >
        <Calendar className="h-4 w-4" />
      </button>
      {/* Hidden native date input — only used for calendar picker */}
      <input
        ref={hiddenRef}
        type="date"
        value={value || ''}
        onChange={handleHiddenChange}
        tabIndex={-1}
        className="absolute right-0 top-0 w-8 h-full opacity-0 pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}
