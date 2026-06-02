'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase, withTimeout } from '@/lib/supabase';
import {
  UserPlus,
  Search,
  Trash2,
  ShieldAlert,
  X,
  Loader2,
  UserCheck,
  Mail,
  User,
  Key,
  Shield,
  GitBranch,
  Eye,
  Edit2,
  Check,
  FolderKanban,
} from 'lucide-react';
import { MOCK_PROJECTS } from '@/lib/mockData';

// Dữ liệu mock thành viên khi chạy chế độ xem trước (phân cấp cây cha con)
const MOCK_USERS = [
  { id: '1', full_name: 'Nguyễn Văn Admin', email: 'admin@company.com', created_at: '2026-05-15T08:00:00Z', manager_id: null, role: { id: 'a1111111-1111-1111-1111-111111111111', name: 'Admin' } },
  { id: '2', full_name: 'Trần Thị Manager', email: 'manager@company.com', created_at: '2026-05-18T09:30:00Z', manager_id: '1', role: { id: 'b2222222-2222-2222-2222-222222222222', name: 'Manager' } },
  { id: '3', full_name: 'Phạm Minh Developer', email: 'dev1@company.com', created_at: '2026-05-20T10:15:00Z', manager_id: '2', role: { id: 'c3333333-3333-3333-3333-333333333333', name: 'Developer' } },
  { id: '4', full_name: 'Lê Hoàng Coder', email: 'dev2@company.com', created_at: '2026-05-22T14:20:00Z', manager_id: '2', role: { id: 'c3333333-3333-3333-3333-333333333333', name: 'Developer' } },
  { id: '5', full_name: 'Hoàng Thị BA', email: 'ba@company.com', created_at: '2026-05-25T11:00:00Z', manager_id: '1', role: { id: 'd4444444-4444-4444-4444-444444444444', name: 'Business Analyst' } },
];

export default function UsersAdmin() {
  const { user: currentUser, role: currentRole, hasPermission } = useAuth();
  const [users, setUsers] = useState(MOCK_USERS);
  const [roles, setRoles] = useState([
    { id: 'a1111111-1111-1111-1111-111111111111', name: 'Admin', description: 'Toàn quyền hệ thống' },
    { id: 'b2222222-2222-2222-2222-222222222222', name: 'Manager', description: 'Quản lý công việc' },
    { id: 'c3333333-3333-3333-3333-333333333333', name: 'Developer', description: 'Xem & cập nhật tiến độ' },
    { id: 'd4444444-4444-4444-4444-444444444444', name: 'Business Analyst', description: 'Xem & chỉnh sửa tài liệu nghiệp vụ/công việc' },
  ]);
  
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);
  const canCreate = hasPermission('users', 'create') || !isSupabaseConfigured;
  const canUpdate = hasPermission('users', 'update') || !isSupabaseConfigured;
  const canDelete = hasPermission('users', 'delete') || !isSupabaseConfigured;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Trạng thái modal Thêm User
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRoleId, setNewRoleId] = useState('c3333333-3333-3333-3333-333333333333'); // Mặc định Dev
  const [newManagerId, setNewManagerId] = useState(''); // Thêm quản lý
  
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  // Trạng thái modal Xem Chi Tiết
  const [selectedUser, setSelectedUser] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Trạng thái modal Chỉnh Sửa
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editRoleId, setEditRoleId] = useState('');
  const [editManagerId, setEditManagerId] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [allProjects, setAllProjects] = useState([]);
  const [editSelectedProjects, setEditSelectedProjects] = useState(new Set());

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your_supabase_project_url')) {
      setIsSupabaseConfigured(false);
      setAllProjects(MOCK_PROJECTS);
      setLoading(false);
      return;
    }

    fetchUsersAndRoles();
  }, []);

  const fetchUsersAndRoles = async () => {
    try {
      setLoading(true);
      setError('');
      // 1. Tải danh sách roles động thực tế từ DB
      const { data: rolesData, error: rolesError } = await withTimeout(
        supabase
          .from('roles')
          .select('*')
      );

      if (!rolesError && rolesData) {
        setRoles(rolesData);
      }

      // 2. Tải danh sách profiles cùng thông tin role liên kết
      const { data: profilesData, error: profilesError } = await withTimeout(
        supabase
          .from('profiles')
          .select('*, roles(*)')
      );

      if (!profilesError && profilesData) {
        // Map cấu trúc khớp dữ liệu hiển thị
        const mappedUsers = profilesData.map(p => ({
          id: p.id,
          full_name: p.full_name,
          email: p.email || (p.id === currentUser?.id ? currentUser.email : '(Chưa tải được)'),
          created_at: p.created_at,
          manager_id: p.manager_id,
          role: p.roles,
        }));
        setUsers(mappedUsers);
      }

      // 3. Tải danh sách dự án
      const { data: projectsData, error: projectsError } = await withTimeout(
        supabase.from('projects').select('id, name, code').order('name')
      );
      if (!projectsError && projectsData) {
        setAllProjects(projectsData);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu người dùng:', err);
      setError(err.message || 'Không thể kết nối để tải thông tin nhân sự. Vui lòng bấm thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newFullName || !newEmail || !newPassword || !newRoleId) {
      setModalError('Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }

    setModalError('');
    setModalSuccess('');
    setModalSubmitting(true);

    try {
      // Lấy session token để chứng thực trên API
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          full_name: newFullName,
          role_id: newRoleId,
          manager_id: newManagerId || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Tạo tài khoản thất bại.');
      }

      // Thông báo thành công
      setModalSuccess(result.message || 'Tài khoản được tạo thành công!');
      
      // Nếu chạy ở chế độ xem trước (hoặc API trả về PreviewMode), ta update local state
      if (result.isPreviewMode || !isSupabaseConfigured) {
        const selectedRole = roles.find(r => r.id === newRoleId);
        const newUserObj = {
          id: result.user.id,
          full_name: newFullName,
          email: newEmail,
          created_at: new Date().toISOString(),
          manager_id: newManagerId || null,
          role: selectedRole || { name: 'Developer' },
        };
        setUsers([newUserObj, ...users]);
      } else {
        // Tải lại dữ liệu thực tế từ DB
        await fetchUsersAndRoles();
      }

      // Xóa form sau khi thành công 1 giây
      setTimeout(() => {
        setIsModalOpen(false);
        setNewFullName('');
        setNewEmail('');
        setNewPassword('');
        setNewRoleId('c3333333-3333-3333-3333-333333333333');
        setNewManagerId('');
        setModalSuccess('');
      }, 1200);

    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleOpenViewModal = (u) => {
    setSelectedUser(u);
    setIsViewModalOpen(true);
  };

  const handleOpenEditModal = async (u) => {
    setSelectedUser(u);
    setEditFullName(u.full_name);
    setEditRoleId(u.role?.id || roles[0]?.id || '');
    setEditManagerId(u.manager_id || '');
    setEditError('');
    setEditSuccess('');
    setIsEditModalOpen(true);

    // Tải danh sách dự án hiện tại của thành viên
    if (!isSupabaseConfigured) {
      // Mock mode: đọc từ localStorage
      try {
        const stored = JSON.parse(localStorage.getItem('aerotask_project_members') || '[]');
        const userProjectIds = stored.filter(m => m.user_id === u.id).map(m => m.project_id);
        setEditSelectedProjects(new Set(userProjectIds));
      } catch { setEditSelectedProjects(new Set()); }
      return;
    }
    try {
      const { data, error: err } = await withTimeout(
        supabase.from('project_members').select('project_id').eq('user_id', u.id)
      );
      if (!err && data) {
        setEditSelectedProjects(new Set(data.map(m => m.project_id)));
      } else {
        setEditSelectedProjects(new Set());
      }
    } catch { setEditSelectedProjects(new Set()); }
  };

  // Hàm đệ quy kiểm tra quan hệ cấp trên vòng lặp tròn (circular reporting)
  const isSubordinate = (mgrId, userId) => {
    if (!mgrId) return false;
    let currentMgr = users.find(u => u.id === mgrId);
    while (currentMgr) {
      if (currentMgr.manager_id === userId) return true;
      currentMgr = users.find(u => u.id === currentMgr.manager_id);
    }
    return false;
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!editFullName.trim() || !editRoleId) {
      setEditError('Vui lòng điền họ tên và chọn vai trò.');
      return;
    }

    if (editManagerId === selectedUser.id) {
      setEditError('Một thành viên không thể báo cáo quản lý cho chính mình.');
      return;
    }

    // Kiểm tra cấu trúc vòng tròn tránh báo cáo ngược
    if (isSubordinate(editManagerId, selectedUser.id)) {
      setEditError('Không thể chọn quản lý là nhân viên trực thuộc cấp dưới của thành viên này (tránh quan hệ báo cáo vòng tròn).');
      return;
    }

    setEditError('');
    setEditSuccess('');
    setEditSubmitting(true);

    try {
      if (!isSupabaseConfigured) {
        // Chế độ xem trước: cập nhật trong local state
        const selectedRole = roles.find(r => r.id === editRoleId);
        const updatedUsers = users.map(u => {
          if (u.id === selectedUser.id) {
            return {
              ...u,
              full_name: editFullName.trim(),
              role_id: editRoleId,
              role: selectedRole || u.role,
              manager_id: editManagerId || null
            };
          }
          return u;
        });
        setUsers(updatedUsers);
        // Lưu project_members vào localStorage
        try {
          const stored = JSON.parse(localStorage.getItem('aerotask_project_members') || '[]');
          const others = stored.filter(m => m.user_id !== selectedUser.id);
          const newEntries = [...editSelectedProjects].map(pid => ({ user_id: selectedUser.id, project_id: pid }));
          localStorage.setItem('aerotask_project_members', JSON.stringify([...others, ...newEntries]));
        } catch {}
        setEditSuccess('Đã cập nhật thông tin thành viên mô phỏng!');
        setTimeout(() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }, 1000);
        return;
      }

      // Xử lý ghi thực tế trong DB
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editFullName.trim(),
          role_id: editRoleId,
          manager_id: editManagerId || null
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      // Cập nhật project_members: xóa cũ, thêm mới
      await withTimeout(supabase.from('project_members').delete().eq('user_id', selectedUser.id));
      if (editSelectedProjects.size > 0) {
        const inserts = [...editSelectedProjects].map(pid => ({ user_id: selectedUser.id, project_id: pid }));
        const { error: pmErr } = await withTimeout(supabase.from('project_members').insert(inserts));
        if (pmErr) throw pmErr;
      }

      setEditSuccess('Cập nhật hồ sơ thành viên thành công!');
      await fetchUsersAndRoles();
      setTimeout(() => {
        setIsEditModalOpen(false);
        setSelectedUser(null);
      }, 1000);
    } catch (err) {
      setEditError(err.message || 'Lỗi khi cập nhật thông tin.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản "${name}" khỏi hệ thống không?`)) {
      return;
    }

    try {
      if (!isSupabaseConfigured) {
        // Chế độ preview: xóa khỏi local state
        setUsers(users.filter(u => u.id !== id));
        alert('Đã xóa thành viên mô phỏng thành công!');
        return;
      }

      // Sử dụng Supabase Client thường để xóa profile trong DB
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setUsers(users.filter(u => u.id !== id));
      alert('Xóa thông tin thành viên thành công!');
    } catch (err) {
      alert('Không thể xóa thành viên: ' + err.message);
    }
  };

  // Hàm đệ quy xây dựng cây phân cấp (Hierarchical Tree)
  const buildUserTree = (nodes, parentId = null, level = 0) => {
    let result = [];
    const children = nodes.filter(node => {
      if (parentId === null) {
        return !node.manager_id || !nodes.some(n => n.id === node.manager_id);
      }
      return node.manager_id === parentId;
    });

    children.forEach(child => {
      result.push({
        ...child,
        level,
      });
      const subChildren = buildUserTree(nodes, child.id, level + 1);
      result = [...result, ...subChildren];
    });

    return result;
  };

  const getManagerName = (managerId) => {
    const mgr = users.find(u => u.id === managerId);
    return mgr ? mgr.full_name : 'Không rõ';
  };

  // Lọc danh sách phẳng để phục vụ tính năng tìm kiếm
  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.role?.name && u.role.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const displayUsers = searchQuery 
    ? filteredUsers 
    : buildUserTree(users);

  const getRoleBadgeStyle = (roleName) => {
    switch (roleName) {
      case 'Admin': return 'bg-rose-500/10 text-rose-500 dark:text-rose-450 border border-rose-500/20';
      case 'Manager': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'Business Analyst': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20';
      case 'Developer': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20';
    }
  };

  // Từ chối nếu không có quyền xem
  if (currentRole && !hasPermission('users', 'view')) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Quyền truy cập bị từ chối</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md">
            Tài khoản của bạn không có quyền xem màn hình quản lý thành viên.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 dark:from-white dark:via-slate-100 dark:to-indigo-100 bg-clip-text text-transparent">
              Quản lý thành viên
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Quản lý nhân sự theo mô hình cây sơ đồ tổ chức cấp trên - cấp dưới rõ ràng và gán vai trò.
            </p>
          </div>

          {canCreate && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-505 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shrink-0"
            >
              <UserPlus className="h-4.5 w-4.5" />
              Cấp tài khoản mới
            </button>
          )}
        </div>

        {/* Action bar (Search & Status) */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-slate-900/35 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm dark:shadow-none">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Tìm tên, email hoặc vai trò..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-450 dark:placeholder:text-slate-600"
            />
          </div>
          
          <div className="text-xs text-slate-550 shrink-0 w-full sm:w-auto text-center sm:text-left flex items-center justify-center gap-1.5">
            <GitBranch className="h-4 w-4 text-indigo-500 animate-pulse" />
            <span>Sơ đồ phân cấp đang kích hoạt (Hiển thị: <span className="font-bold text-slate-800 dark:text-slate-200">{displayUsers.length}</span> thành viên)</span>
          </div>
        </div>

        {/* Error alert with retry option */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-455 text-xs p-4.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in select-none">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-5 w-5 shrink-0 text-rose-500" />
              <span className="font-semibold leading-relaxed">{error}</span>
            </div>
            <button
              onClick={fetchUsersAndRoles}
              className="px-4.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/15 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
            >
              Thử tải lại ngay
            </button>
          </div>
        )}

        {/* Users Table */}
        <div className="glass-panel rounded-2xl overflow-hidden shadow-sm dark:shadow-xl border border-slate-200 dark:border-slate-800/60">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              <span className="text-xs text-slate-500">Đang đồng bộ dữ liệu nhân sự...</span>
            </div>
          ) : displayUsers.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              Không tìm thấy thành viên nào khớp với tìm kiếm.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4 w-4/12">Thành viên & Sơ đồ cấp bậc</th>
                    <th className="px-6 py-4 w-3/12">Email liên hệ</th>
                    <th className="px-6 py-4 w-2/12">Vai trò</th>
                    <th className="px-6 py-4 w-3/12 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {displayUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-100/40 dark:hover:bg-slate-900/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {/* Đường nhánh cây phân cấp thụt lề cấp dưới */}
                          {!searchQuery && u.level > 0 && (
                            <div 
                              className="flex items-center text-slate-300 dark:text-slate-700 font-mono select-none shrink-0" 
                              style={{ width: `${u.level * 28}px` }}
                            >
                              <span className="ml-auto mr-2.5 text-[11px] font-bold">
                                ├──
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                              {u.full_name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block group-hover:text-slate-950 dark:group-hover:text-white transition-colors truncate">
                                {u.full_name}
                              </span>
                              {u.manager_id && (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5 font-medium truncate">
                                  Báo cáo cho: <strong className="text-slate-500 dark:text-slate-450 font-semibold">{getManagerName(u.manager_id)}</strong>
                                </span>
                              )}
                              {u.id === currentUser?.id && (
                                <span className="inline-block bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-[8px] font-black px-1.5 py-0.2 mt-0.5 rounded tracking-wider uppercase">
                                  Bạn
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 truncate">
                        {u.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] px-2.5 py-0.8 rounded-full font-bold uppercase shrink-0 inline-block ${getRoleBadgeStyle(u.role?.name)}`}>
                          {u.role?.name || 'Developer'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenViewModal(u)}
                            className="p-2 rounded-lg text-slate-400 dark:text-slate-550 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer"
                            title="Xem chi tiết hồ sơ"
                          >
                            <Eye className="h-4.5 w-4.5" />
                          </button>

                          {canUpdate && (
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="p-2 rounded-lg text-slate-400 dark:text-slate-550 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer"
                              title="Chỉnh sửa thông tin"
                            >
                              <Edit2 className="h-4.5 w-4.5" />
                            </button>
                          )}

                          {canDelete && u.id !== currentUser?.id ? (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.full_name)}
                              className="p-2 rounded-lg text-slate-400 dark:text-slate-550 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                              title="Xóa tài khoản"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          ) : u.id === currentUser?.id ? (
                            <span className="text-[10px] text-slate-400 dark:text-slate-600 italic px-2 select-none">Bản thân</span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals — đặt ngoài div animate-fade-in để tránh transform tạo containing block cho position:fixed */}

      {/* Modal: Create User */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-500/15 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
            
            {/* Box */}
            <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative z-10 animate-scale-up bg-white/95 dark:bg-slate-900/95">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Cấp tài khoản mới</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Tài khoản được tự động kích hoạt sau khi tạo</p>
                </div>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4" autoComplete="off">
                {modalError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-655 dark:text-rose-400 text-xs p-3.5 rounded-xl flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                {modalSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs p-3.5 rounded-xl flex items-center gap-2">
                    <UserCheck className="h-4 w-4 shrink-0 animate-bounce" />
                    <span>{modalSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Họ và tên <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-600" />
                    <input
                      type="text"
                      required
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder="Nhập họ và tên..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-955/80 placeholder-slate-400 dark:placeholder-slate-550"
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Địa chỉ Email <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-600" />
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="email@company.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-955/80 placeholder-slate-400 dark:placeholder-slate-550"
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Mật khẩu ban đầu <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-600" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mật khẩu tối thiểu 6 ký tự"
                      minLength={6}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-955/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-955/80 placeholder-slate-400 dark:placeholder-slate-550"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Vai trò (Role) <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-600" />
                      <select
                        value={newRoleId}
                        onChange={(e) => setNewRoleId(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-955/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-300">
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Cấp trên quản lý</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-600" />
                      <select
                        value={newManagerId}
                        onChange={(e) => setNewManagerId(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-955/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-white dark:bg-slate-900 text-slate-400">Không (Cấp cao nhất)</option>
                        {users.map((item) => (
                          <option key={item.id} value={item.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-300">
                            {item.full_name} ({item.role?.name || 'Developer'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-755 transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={modalSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-505 text-white text-xs font-bold shadow-lg shadow-indigo-600/10 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {modalSubmitting ? (
                      <>
                        <Loader2 className="animate-spin h-3.5 w-3.5" />
                        Đang tạo...
                      </>
                    ) : (
                      'Xác nhận tạo'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: View User Details */}
        {isViewModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-500/15 backdrop-blur-md" onClick={() => setIsViewModalOpen(false)} />
            <div className="glass-panel w-full max-w-lg rounded-3xl border border-slate-250 dark:border-slate-800 shadow-2xl p-6 relative z-10 bg-white/95 dark:bg-slate-900/95 animate-scale-up">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-slate-150 dark:border-slate-800 pb-5 mb-5 select-none">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-extrabold text-2xl uppercase shadow-md shrink-0">
                  {selectedUser.full_name.charAt(0)}
                </div>
                <div className="text-center sm:text-left min-w-0">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">{selectedUser.full_name}</h3>
                  <span className={`text-[10px] px-2.5 py-0.8 rounded-full font-bold uppercase inline-block mt-1 ${getRoleBadgeStyle(selectedUser.role?.name)}`}>
                    {selectedUser.role?.name || 'Developer'}
                  </span>
                </div>
              </div>

              {/* Info grid */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-950/45 p-3.5 rounded-xl border border-slate-150 dark:border-slate-800/40">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Email liên hệ</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-350 mt-1 block truncate">{selectedUser.email}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/45 p-3.5 rounded-xl border border-slate-150 dark:border-slate-800/40">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Ngày gia nhập</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-350 mt-1 block truncate">
                      {new Date(selectedUser.created_at).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Reporting structure details */}
                <div className="bg-slate-50 dark:bg-slate-950/45 p-4 rounded-2xl border border-slate-150 dark:border-slate-800/40 space-y-3">
                  <div>
                    <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider block">Quản lý trực tiếp (Cấp trên)</span>
                    {selectedUser.manager_id ? (
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-850 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 select-none">
                          {getManagerName(selectedUser.manager_id).charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {getManagerName(selectedUser.manager_id)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500 italic mt-1 block">Cấp cao nhất (Không báo cáo cho ai)</span>
                    )}
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800 pt-2.5">
                    <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider block">Nhân sự cấp dưới trực tiếp</span>
                    {users.filter(u => u.manager_id === selectedUser.id).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {users.filter(u => u.manager_id === selectedUser.id).map(sub => (
                          <div key={sub.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800">
                            <div className="h-5 w-5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[9px] font-extrabold select-none shrink-0">
                              {sub.full_name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block truncate">{sub.full_name}</span>
                              <span className="text-[9px] text-slate-450 dark:text-slate-500 block truncate">{sub.role?.name || 'Developer'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500 italic mt-1 block">Không có nhân viên cấp dưới báo cáo trực tiếp</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-5 border-t border-slate-150 dark:border-slate-800 flex gap-3">
                {canUpdate && (
                  <button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleOpenEditModal(selectedUser);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-505 text-white text-xs font-bold shadow-lg shadow-indigo-600/10 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Edit2 className="h-4 w-4" />
                    Chỉnh sửa thành viên
                  </button>
                )}
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="py-2.5 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-655 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-755 transition-colors cursor-pointer"
                >
                  Đóng lại
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Edit User Details */}
        {isEditModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-500/15 backdrop-blur-md" onClick={() => setIsEditModalOpen(false)} />
            <div className="glass-panel w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative z-10 bg-white/95 dark:bg-slate-900/95 animate-scale-up">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Edit2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Chỉnh sửa thành viên</h3>
                  <p className="text-xs text-slate-450 dark:text-slate-550">Thay đổi thông tin hồ sơ và cơ cấu báo cáo</p>
                </div>
              </div>

              <form onSubmit={handleEditUser} className="space-y-4" autoComplete="off">
                {editError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-455 text-xs p-3.5 rounded-xl flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>{editError}</span>
                  </div>
                )}

                {editSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 text-xs p-3.5 rounded-xl flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 animate-bounce" />
                    <span>{editSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Họ và tên <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-450 dark:text-slate-600" />
                    <input
                      type="text"
                      required
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      placeholder="Nhập họ và tên..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-955/80 placeholder-slate-400 dark:placeholder-slate-550"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Vai trò (Role)</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-450 dark:text-slate-600" />
                    <select
                      value={editRoleId}
                      onChange={(e) => setEditRoleId(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-350">
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Cấp trên quản lý trực tiếp</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-450 dark:text-slate-600" />
                    <select
                      value={editManagerId}
                      onChange={(e) => setEditManagerId(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-white dark:bg-slate-900 text-slate-400">Không (Cấp cao nhất)</option>
                      {users
                        .filter(item => item.id !== selectedUser.id) // Loại trừ chính mình
                        .map((item) => (
                          <option key={item.id} value={item.id} className="bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-300">
                            {item.full_name} ({item.role?.name || 'Developer'})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Dự án tham gia */}
                {allProjects.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FolderKanban className="h-3.5 w-3.5" />
                      Dự án tham gia
                    </label>
                    <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 divide-y divide-slate-100 dark:divide-slate-800">
                      {allProjects.map(proj => (
                        <label
                          key={proj.id}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors select-none"
                        >
                          <input
                            type="checkbox"
                            checked={editSelectedProjects.has(proj.id)}
                            onChange={(e) => {
                              setEditSelectedProjects(prev => {
                                const next = new Set(prev);
                                if (e.target.checked) next.add(proj.id);
                                else next.delete(proj.id);
                                return next;
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 font-mono w-16 shrink-0">{proj.code}</span>
                          <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{proj.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-755 transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-505 text-white text-xs font-bold shadow-lg shadow-indigo-600/10 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {editSubmitting ? (
                      <>
                        <Loader2 className="animate-spin h-3.5 w-3.5" />
                        Đang lưu...
                      </>
                    ) : (
                      'Lưu thay đổi'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

    </DashboardLayout>
  );
}
