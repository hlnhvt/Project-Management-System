'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Activity, Mail, Lock, AlertCircle, Eye, EyeOff, Loader2, Sun, Moon } from 'lucide-react';

function parseAuthError(err) {
  const msg  = (err?.message || '').toLowerCase();
  const code = (err?.code    || '').toLowerCase();

  // Sai email / mật khẩu — Supabase có thể trả về message hoặc code dạng underscore
  if (
    msg.includes('invalid login credentials') ||
    msg.includes('invalid email or password') ||
    code === 'invalid_credentials' ||
    code.includes('invalid_credentials')
  ) {
    return { message: 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.', showHint: true };
  }

  // Tài khoản chưa xác nhận email
  if (msg.includes('email not confirmed') || code === 'email_not_confirmed') {
    return { message: 'Tài khoản chưa được xác minh. Vui lòng liên hệ quản trị viên.', showHint: false };
  }

  // Tài khoản bị khóa / vô hiệu hóa
  if (msg.includes('disabled') || msg.includes('blocked') || msg.includes('banned') || code.includes('user_banned')) {
    return { message: 'Tài khoản đã bị vô hiệu hóa. Liên hệ quản trị viên để được hỗ trợ.', showHint: false };
  }

  // Quá nhiều lần thử
  if (
    msg.includes('too many requests') ||
    msg.includes('rate limit') ||
    msg.includes('security purposes') ||
    msg.includes('after 60') ||
    code === 'over_request_rate_limit' ||
    code === 'over_email_send_rate_limit'
  ) {
    return { message: 'Quá nhiều lần thử liên tiếp. Vui lòng chờ vài phút rồi thử lại.', showHint: false };
  }

  // Lỗi mạng / không kết nối được
  if (msg.includes('network') || msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('load failed')) {
    return { message: 'Không thể kết nối máy chủ. Kiểm tra lại kết nối mạng của bạn.', showHint: false };
  }

  // Email không đúng định dạng
  if (msg.includes('invalid email') || code === 'invalid_email') {
    return { message: 'Địa chỉ email không đúng định dạng.', showHint: false };
  }

  // Fallback — không hiển thị message tiếng Anh gốc
  return { message: 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin và thử lại.', showHint: false };
}

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showContactHint, setShowContactHint] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [theme, setTheme] = useState('light');

  // Đồng bộ theme từ localStorage để hiển thị đúng chế độ sáng/tối
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light'; // Mặc định ban đầu là chế độ Sáng
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng điền đầy đủ email và mật khẩu.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      const { message, showHint } = parseAuthError(err);
      setError(message);
      setShowContactHint(showHint);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b0f19] px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      {/* Nút chuyển đổi Theme nổi ở góc trên bên phải */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-lg shadow-slate-200/50 dark:shadow-none z-50 flex items-center justify-center"
        title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
      >
        {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-indigo-600" />}
      </button>

      {/* Ambient glowing background circles */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/10 dark:bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-violet-500/10 dark:bg-violet-500/10 blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full space-y-8 relative z-10">
        
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center select-none animate-fade-in">
          <img src="/logo.png" alt="PROJEXA" className="h-16 w-16 rounded-2xl object-cover shadow-xl shadow-indigo-500/30 dark:shadow-indigo-500/20 mb-4 transition-transform hover:scale-105 duration-300" />
          <img src="/logo-name.png" alt="PROJEXA" className="h-16 object-contain mb-3" />
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 text-center">
            Chào mừng trở lại!
          </h2>
          <p className="mt-2.5 text-sm font-medium text-slate-500 dark:text-slate-400 text-center tracking-wide">
            Hệ thống Quản lý tiến độ công việc Projexa
          </p>
        </div>

        {/* Login Box */}
        <div className="glass-panel p-8 rounded-3xl shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-200/80 dark:border-white/10 relative overflow-hidden bg-white/90 dark:bg-slate-900/85">
          <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-start gap-3 text-rose-600 dark:text-rose-400 text-sm animate-shake">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold leading-snug">{error}</p>
                  {showContactHint && (
                    <p className="text-xs mt-1.5 text-rose-500 dark:text-rose-500 font-normal leading-snug">
                      Nếu quên mật khẩu, vui lòng liên hệ Quản trị viên để được cấp lại.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Email input field */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Địa chỉ Email
              </label>
              <div className="relative rounded-2xl shadow-sm group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-450 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-250 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-550 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all shadow-inner"
                  placeholder="Nhập địa chỉ email của bạn..."
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Password input field */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Mật khẩu đăng nhập
              </label>
              <div className="relative rounded-2xl shadow-sm group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-455 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-12 py-3.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-250 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-550 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all shadow-inner"
                  placeholder="Nhập mật khẩu của bạn..."
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-950 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-lg shadow-indigo-500/25 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2.5 h-5 w-5 text-white" />
                    Đang đăng nhập hệ thống...
                  </>
                ) : (
                  'Đăng nhập hệ thống'
                )}
              </button>
            </div>
          </form>

          {/* Locked Registration Information Badge */}
          <div className="mt-6 pt-6 border-t border-slate-150 dark:border-slate-800/80 text-center select-none">
            {/* <span className="inline-flex px-3.5 py-1.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-450 border border-amber-500/20 shadow-sm">
              Đăng ký tài khoản bị khóa công khai
            </span> */}
            <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-500 leading-relaxed px-2">
              Vui lòng liên hệ với Quản trị viên (Admin) để nhận thông tin đăng nhập được cấp của bạn.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
