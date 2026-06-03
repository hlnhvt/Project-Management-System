'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase, getUserPermissions } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { Activity, RefreshCw, WifiOff } from 'lucide-react';

const AuthContext = createContext({
  user: null,
  profile: null,
  role: null,
  permissions: {},
  loading: true,
  authError: null,
  retryAuth: async () => {},
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null); // null = OK, string = lỗi
  const router = useRouter();
  const pathname = usePathname();
  // Ngăn onAuthStateChange gọi loadUserData trùng với checkSession
  const sessionCheckDoneRef = useRef(false);
  // Ref theo dõi role hiện tại để dùng bên trong loadUserData (tránh stale closure)
  const currentRoleRef = useRef(null);
  // Đếm số lần tự động retry khi timeout lần đầu load
  const retryCountRef = useRef(0);

  useEffect(() => {
    currentRoleRef.current = role;
  }, [role]);

  // Load thông tin người dùng và quyền hạn
  const loadUserData = useCallback(async (currentUser) => {
    if (!currentUser) {
      setUser(null);
      setProfile(null);
      setRole(null);
      setPermissions({});
      setLoading(false);
      setAuthError(null);
      retryCountRef.current = 0;
      return;
    }

    setUser(currentUser);

    const result = await getUserPermissions(currentUser.id);

    if (result._timedOut) {
      setLoading(false);

      if (currentRoleRef.current) {
        // Người dùng đang làm việc và đã có quyền hạn — im lặng, không làm gián đoạn
        return;
      }

      // Lần đầu load thất bại — tự động thử lại tối đa 2 lần trước khi hiện lỗi
      if (retryCountRef.current < 2) {
        retryCountRef.current += 1;
        setTimeout(() => {
          if (!currentRoleRef.current) loadUserData(currentUser);
        }, 8000);
        return;
      }

      // Hết lần retry — hiện banner lỗi để người dùng tự thử lại
      retryCountRef.current = 0;
      setAuthError('Máy chủ đang khởi động lại sau trạng thái ngủ. Nhấn "Thử lại" để tải dữ liệu quyền hạn.');
      setProfile(null);
      setRole(null);
      setPermissions({});
    } else {
      retryCountRef.current = 0;
      setProfile(result.profile || null);
      setRole(result.role || null);
      setPermissions(result.permissions || {});
      setAuthError(null);
      setLoading(false);
    }
  }, []);

  // Hàm thử lại khi bị timeout — người dùng nhấn nút Retry
  const retryAuth = useCallback(async () => {
    if (!user) return;
    retryCountRef.current = 0;
    setLoading(true);
    setAuthError(null);
    await loadUserData(user);
  }, [user, loadUserData]);

  useEffect(() => {
    // 1. Kiểm tra session hiện tại khi component mount
    const checkSession = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await loadUserData(session.user);
        } else {
          await loadUserData(null);
        }
      } catch (err) {
        console.error('Lỗi kiểm tra session:', err);
        setLoading(false);
        setAuthError('Không thể kiểm tra phiên đăng nhập. Vui lòng tải lại trang.');
      } finally {
        sessionCheckDoneRef.current = true;
      }
    };

    checkSession();

    // 2. Lắng nghe thay đổi trạng thái đăng nhập
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Bỏ qua SIGNED_IN khi checkSession chưa hoàn thành để tránh gọi loadUserData trùng lặp
        if (!sessionCheckDoneRef.current) return;
        await loadUserData(session.user);
      } else if (event === 'SIGNED_OUT') {
        await loadUserData(null);
        router.push('/login');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router, loadUserData]);

  // Bảo vệ route dựa trên trạng thái đăng nhập và phân quyền
  useEffect(() => {
    if (loading) return;

    const isAuthRoute = pathname === '/login';

    if (!user && !isAuthRoute) {
      router.push('/login');
    } else if (user && isAuthRoute) {
      router.push('/');
    } else if (user && pathname.startsWith('/admin/users')) {
      const canView = role?.name === 'Admin' || !!permissions?.users?.view;
      if (!canView) router.push('/');
    } else if (user && pathname.startsWith('/admin/roles')) {
      const canView = role?.name === 'Admin' || !!permissions?.roles?.view;
      if (!canView) router.push('/');
    }
  }, [user, pathname, loading, role, permissions, router]);

  // Hàm đăng nhập
  // Không gọi setLoading(true) ở đây — nếu gọi sẽ unmount LoginPage,
  // khiến setError() sau khi catch không có tác dụng (gọi trên unmounted component).
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return data;
  };

  // Hàm đăng xuất
  const logout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setLoading(false);
      throw error;
    }
  };

  // Helper kiểm tra quyền nhanh ở client
  // Admin luôn có toàn quyền ở mọi chức năng, bất kể cấu hình DB
  const hasPermission = (resource, action) => {
    if (role?.name === 'Admin') return true;
    if (!permissions || !permissions[resource]) return false;
    return !!permissions[resource][action];
  };

  const value = {
    user,
    profile,
    role,
    permissions,
    loading,
    authError,
    retryAuth,
    login,
    logout,
    hasPermission,
  };

  // Hiển thị màn hình loading cao cấp khi đang kiểm tra auth
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-violet-500/5 dark:bg-violet-500/10 blur-[100px] pointer-events-none" />
        <div className="flex flex-col items-center relative z-10">
          <img src="/logo.png" alt="PROJEXA" className="h-16 w-16 rounded-2xl object-cover shadow-2xl shadow-indigo-500/10 mb-4" />
          <img src="/logo-name.png" alt="PROJEXA" className="h-16 object-contain mb-1" />
          <p className="text-xs text-slate-500 dark:text-gray-500 font-medium tracking-widest uppercase animate-pulse">
            Đang xác thực phiên làm việc...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {/* Banner lỗi auth toàn cục - hiện khi bị timeout quyền hạn */}
      {authError && user && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg animate-slide-down">
          <div className="flex items-center gap-2 min-w-0">
            <WifiOff className="h-4 w-4 shrink-0" />
            <p className="text-xs font-medium truncate">{authError}</p>
          </div>
          <button
            onClick={retryAuth}
            className="flex items-center gap-1.5 text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Thử lại
          </button>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
