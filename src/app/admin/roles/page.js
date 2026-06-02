'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase, withTimeout } from '@/lib/supabase';
import { NAV_ITEMS } from '@/lib/navigation';

// RESOURCES tự động đồng bộ với registry — không cần sửa hai nơi khi thêm chức năng mới
const RESOURCES = NAV_ITEMS.map(item => ({ key: item.resource, name: item.adminLabel, desc: item.desc }));
import { 
  Save, 
  Check, 
  Loader2, 
  ShieldAlert, 
  Lock,
  Plus,
  Trash2,
  Shield,
  X,
  Edit2
} from 'lucide-react';

// Cấu hình mock ban đầu khi chạy chế độ xem trước (Preview Mode)
const MOCK_ROLES = [
  { id: 'a1111111-1111-1111-1111-111111111111', name: 'Admin', description: 'Toàn quyền quản trị hệ thống, quản lý tài khoản và phân quyền' },
  { id: 'b2222222-2222-2222-2222-222222222222', name: 'Manager', description: 'Quản lý dự án, phân công công việc và theo dõi tiến độ' },
  { id: 'c3333333-3333-3333-3333-333333333333', name: 'Developer', description: 'Xem công việc được giao và cập nhật tiến độ công việc' },
  { id: 'd4444444-4444-4444-4444-444444444444', name: 'Business Analyst', description: 'Xem tài liệu nghiệp vụ, tạo và chỉnh sửa công việc phân tích yêu cầu' },
];

const MOCK_PERMISSIONS = [
  // Admin permissions
  { id: 'p0a', role_id: 'a1111111-1111-1111-1111-111111111111', resource: 'dashboard', can_view: true, can_create: false, can_update: false, can_delete: false },
  { id: 'p1', role_id: 'a1111111-1111-1111-1111-111111111111', resource: 'tasks', can_view: true, can_create: true, can_update: true, can_delete: true },
  { id: 'p2', role_id: 'a1111111-1111-1111-1111-111111111111', resource: 'users', can_view: true, can_create: true, can_update: true, can_delete: true },
  { id: 'p3', role_id: 'a1111111-1111-1111-1111-111111111111', resource: 'roles', can_view: true, can_create: true, can_update: true, can_delete: true },
  { id: 'p13', role_id: 'a1111111-1111-1111-1111-111111111111', resource: 'use_cases', can_view: true, can_create: true, can_update: true, can_delete: true },

  // Manager permissions
  { id: 'p0b', role_id: 'b2222222-2222-2222-2222-222222222222', resource: 'dashboard', can_view: true, can_create: false, can_update: false, can_delete: false },
  { id: 'p4', role_id: 'b2222222-2222-2222-2222-222222222222', resource: 'tasks', can_view: true, can_create: true, can_update: true, can_delete: true },
  { id: 'p5', role_id: 'b2222222-2222-2222-2222-222222222222', resource: 'users', can_view: true, can_create: false, can_update: false, can_delete: false },
  { id: 'p6', role_id: 'b2222222-2222-2222-2222-222222222222', resource: 'roles', can_view: false, can_create: false, can_update: false, can_delete: false },
  { id: 'p14', role_id: 'b2222222-2222-2222-2222-222222222222', resource: 'use_cases', can_view: true, can_create: true, can_update: true, can_delete: false },

  // Developer permissions
  { id: 'p0c', role_id: 'c3333333-3333-3333-3333-333333333333', resource: 'dashboard', can_view: true, can_create: false, can_update: false, can_delete: false },
  { id: 'p7', role_id: 'c3333333-3333-3333-3333-333333333333', resource: 'tasks', can_view: true, can_create: false, can_update: true, can_delete: false },
  { id: 'p8', role_id: 'c3333333-3333-3333-3333-333333333333', resource: 'users', can_view: true, can_create: false, can_update: false, can_delete: false },
  { id: 'p9', role_id: 'c3333333-3333-3333-3333-333333333333', resource: 'roles', can_view: false, can_create: false, can_update: false, can_delete: false },
  { id: 'p15', role_id: 'c3333333-3333-3333-3333-333333333333', resource: 'use_cases', can_view: true, can_create: false, can_update: false, can_delete: false },

  // Business Analyst permissions
  { id: 'p0d', role_id: 'd4444444-4444-4444-4444-444444444444', resource: 'dashboard', can_view: true, can_create: false, can_update: false, can_delete: false },
  { id: 'p10', role_id: 'd4444444-4444-4444-4444-444444444444', resource: 'tasks', can_view: true, can_create: true, can_update: true, can_delete: false },
  { id: 'p11', role_id: 'd4444444-4444-4444-4444-444444444444', resource: 'users', can_view: true, can_create: false, can_update: false, can_delete: false },
  { id: 'p12', role_id: 'd4444444-4444-4444-4444-444444444444', resource: 'roles', can_view: false, can_create: false, can_update: false, can_delete: false },
  { id: 'p16', role_id: 'd4444444-4444-4444-4444-444444444444', resource: 'use_cases', can_view: true, can_create: true, can_update: true, can_delete: true },
];

const MOCK_USERS = [
  { id: '1', role_id: 'a1111111-1111-1111-1111-111111111111' },
  { id: '2', role_id: 'b2222222-2222-2222-2222-222222222222' },
  { id: '3', role_id: 'c3333333-3333-3333-3333-333333333333' },
  { id: '4', role_id: 'c3333333-3333-3333-3333-333333333333' },
  { id: '5', role_id: 'd4444444-4444-4444-4444-444444444444' },
];

export default function RolesAdmin() {
  const { role: currentRole } = useAuth();
  
  const [activeTab, setActiveTab] = useState('permissions'); // 'permissions' hoặc 'directory'
  const [roles, setRoles] = useState(MOCK_ROLES);
  const [permissions, setPermissions] = useState(MOCK_PERMISSIONS);
  const [users, setUsers] = useState(MOCK_USERS);
  const [selectedRoleId, setSelectedRoleId] = useState(MOCK_ROLES[0].id);
  
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Trạng thái modal tạo Role
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Trạng thái modal sửa Role
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState('');
  const [editRoleName, setEditRoleName] = useState('');
  const [editRoleDescription, setEditRoleDescription] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your_supabase_project_url')) {
      setIsSupabaseConfigured(false);
      setLoading(false);
      return;
    }

    fetchRolesAndPermissions();
  }, []);

  const fetchRolesAndPermissions = async () => {
    try {
      setLoading(true);
      setError('');
      // 1. Tải danh sách roles
      const { data: rolesData, error: rolesError } = await withTimeout(
        supabase
          .from('roles')
          .select('*')
          .order('created_at', { ascending: true })
      );

      if (!rolesError && rolesData) {
        setRoles(rolesData);
        // Giữ tab được chọn nếu nó vẫn tồn tại
        if (rolesData.length > 0) {
          const stillExists = rolesData.some(r => r.id === selectedRoleId);
          if (!stillExists) {
            setSelectedRoleId(rolesData[0].id);
          }
        }
      }

      // 2. Tải danh sách permissions
      const { data: permsData, error: permsError } = await withTimeout(
        supabase
          .from('permissions')
          .select('*')
      );

      if (!permsError && permsData) {
        setPermissions(permsData);
      }

      // 3. Tải danh sách profiles để kiểm tra vai trò có thành viên không
      const { data: profilesData } = await withTimeout(
        supabase
          .from('profiles')
          .select('id, role_id')
      );

      if (profilesData) {
        setUsers(profilesData);
      }
    } catch (err) {
      console.error('Lỗi khi tải cấu hình phân quyền:', err);
      setError(err.message || 'Không thể tải cấu hình vai trò & phân quyền. Vui lòng bấm thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật giá trị checkbox tạm thời trong local state
  const handleCheckboxChange = (resource, field, value) => {
    setPermissions(prevPerms => 
      prevPerms.map(p => {
        if (p.role_id === selectedRoleId && p.resource === resource) {
          return { ...p, [field]: value };
        }
        return p;
      })
    );
  };

  // Tạo vai trò mới
  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      setCreateError('Vui lòng điền tên vai trò.');
      return;
    }

    // Kiểm tra tên trùng lặp
    const isDuplicate = roles.some(r => r.name.toLowerCase() === newRoleName.trim().toLowerCase());
    if (isDuplicate) {
      setCreateError('Tên vai trò này đã tồn tại trên hệ thống.');
      return;
    }

    setCreateError('');
    setCreateSubmitting(true);

    try {
      if (!isSupabaseConfigured) {
        // Chế độ xem trước
        await new Promise(resolve => setTimeout(resolve, 600));
        const newRoleId = 'custom-' + Math.random().toString(36).substring(2, 9);
        const newRoleObj = {
          id: newRoleId,
          name: newRoleName.trim(),
          description: newRoleDescription.trim()
        };

        const defaultPerms = NAV_ITEMS.map(item => ({
          id: 'p-' + Math.random(), role_id: newRoleId, resource: item.resource,
          can_view: false, can_create: false, can_update: false, can_delete: false,
        }));

        setRoles(prev => [...prev, newRoleObj]);
        setPermissions(prev => [...prev, ...defaultPerms]);
        setSelectedRoleId(newRoleId);

        setIsCreateModalOpen(false);
        setNewRoleName('');
        setNewRoleDescription('');
        return;
      }

      // 1. Chèn vai trò mới
      const { data: newRoleData, error: newRoleError } = await supabase
        .from('roles')
        .insert({
          name: newRoleName.trim(),
          description: newRoleDescription.trim()
        })
        .select()
        .single();

      if (newRoleError) throw newRoleError;

      // 2. Chèn 4 bản ghi permissions mặc định (gồm cả use_cases)
      const defaultPerms = NAV_ITEMS.map(item => ({
        role_id: newRoleData.id, resource: item.resource,
        can_view: false, can_create: false, can_update: false, can_delete: false,
      }));

      const { error: permsError } = await supabase
        .from('permissions')
        .insert(defaultPerms);

      if (permsError) throw permsError;

      // Đồng bộ lại UI
      setSelectedRoleId(newRoleData.id);
      await fetchRolesAndPermissions();

      setIsCreateModalOpen(false);
      setNewRoleName('');
      setNewRoleDescription('');
    } catch (err) {
      setCreateError(err.message || 'Lỗi khi tạo vai trò.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Mở modal sửa vai trò
  const handleOpenEditModal = (r) => {
    if (r.name === 'Admin') {
      alert('Không thể chỉnh sửa vai trò Admin hệ thống.');
      return;
    }
    setEditingRoleId(r.id);
    setEditRoleName(r.name);
    setEditRoleDescription(r.description || '');
    setEditError('');
    setEditSuccess('');
    setIsEditModalOpen(true);
  };

  // Chỉnh sửa vai trò
  const handleEditRole = async (e) => {
    e.preventDefault();
    if (!editRoleName.trim()) {
      setEditError('Tên vai trò không được để trống.');
      return;
    }

    // Kiểm tra trùng tên (ngoại trừ chính nó)
    const isDuplicate = roles.some(r => r.id !== editingRoleId && r.name.toLowerCase() === editRoleName.trim().toLowerCase());
    if (isDuplicate) {
      setEditError('Tên vai trò này đã tồn tại trên hệ thống.');
      return;
    }

    setEditError('');
    setEditSuccess('');
    setEditSubmitting(true);

    try {
      if (!isSupabaseConfigured) {
        // Chế độ xem trước
        await new Promise(resolve => setTimeout(resolve, 600));
        const updatedRoles = roles.map(r => {
          if (r.id === editingRoleId) {
            return { ...r, name: editRoleName.trim(), description: editRoleDescription.trim() };
          }
          return r;
        });
        setRoles(updatedRoles);
        setEditSuccess('Đã lưu thông tin vai trò mô phỏng thành công!');
        setTimeout(() => {
          setIsEditModalOpen(false);
        }, 1000);
        return;
      }

      // Xử lý ghi thực tế trong DB
      const { error } = await supabase
        .from('roles')
        .update({
          name: editRoleName.trim(),
          description: editRoleDescription.trim()
        })
        .eq('id', editingRoleId);

      if (error) throw error;

      setEditSuccess('Cập nhật vai trò thành công!');
      await fetchRolesAndPermissions();
      setTimeout(() => {
        setIsEditModalOpen(false);
      }, 1000);
    } catch (err) {
      setEditError(err.message || 'Lỗi khi cập nhật vai trò.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Xóa vai trò
  const handleDeleteRole = async (roleId) => {
    const roleToDelete = roles.find(r => r.id === roleId);
    if (!roleToDelete) return;

    if (roleToDelete.name === 'Admin') {
      alert('Không thể xóa vai trò Admin cốt lõi của hệ thống để tránh lỗi sập quyền quản trị.');
      return;
    }

    // Kiểm tra xem có người dùng nào đang thuộc vai trò này không
    const userCount = users.filter(u => u.role_id === roleId).length;
    if (userCount > 0) {
      alert(`Không thể xóa vai trò "${roleToDelete.name}" vì đang có ${userCount} thành viên thuộc vai trò này. Vui lòng gán vai trò khác cho các thành viên đó trước.`);
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa vai trò "${roleToDelete.name}" khỏi hệ thống không?`)) {
      return;
    }

    try {
      if (!isSupabaseConfigured) {
        // Chế độ xem trước
        setRoles(prev => prev.filter(r => r.id !== roleId));
        setPermissions(prev => prev.filter(p => p.role_id !== roleId));
        alert('Xóa vai trò giả lập thành công!');
        return;
      }

      // Xóa thực tế trong DB (sẽ tự động cascade permissions)
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      alert('Đã xóa vai trò thành công!');
      await fetchRolesAndPermissions();
    } catch (err) {
      alert('Không thể xóa vai trò: ' + err.message);
    }
  };

  // Lưu cấu hình phân quyền xuống Supabase DB
  const handleSaveConfig = async () => {
    setSaving(true);
    setSaveSuccess(false);

    // Lọc ra các dòng quyền của role đang được chọn để lưu
    const targetPerms = permissions.filter(p => p.role_id === selectedRoleId);

    try {
      if (!isSupabaseConfigured) {
        // Chế độ xem trước: Giả lập lưu thành công sau 600ms
        await new Promise(resolve => setTimeout(resolve, 600));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        return;
      }

      // Lưu quyền thực tế trong Supabase DB
      for (const perm of targetPerms) {
        // Sử dụng upsert (chèn hoặc cập nhật dựa trên unique constraint [role_id, resource])
        const { error } = await supabase
          .from('permissions')
          .upsert({
            role_id: perm.role_id,
            resource: perm.resource,
            can_view: perm.can_view,
            can_create: perm.can_create,
            can_update: perm.can_update,
            can_delete: perm.can_delete,
          }, {
            onConflict: 'role_id,resource'
          });

        if (error) throw error;
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      await fetchRolesAndPermissions(); // Reload để đồng bộ dữ liệu mới nhất
      
    } catch (err) {
      alert('Không thể lưu cấu hình: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const getRoleById = (id) => roles.find(r => r.id === id);

  // Lấy số lượng thành viên thuộc vai trò
  const getRoleUserCount = (roleId) => {
    return users.filter(u => u.role_id === roleId).length;
  };

  // Chỉ cho phép truy cập nếu là Admin
  if (currentRole && currentRole.name !== 'Admin') {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Quyền truy cập bị từ chối</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md">
            Màn hình thiết lập phân quyền này chỉ dành cho tài khoản Quản trị viên (Admin) của hệ thống.
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
              Quản lý vai trò & Phân quyền
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Xem danh sách, tạo mới, chỉnh sửa thông tin các vai trò và gán quyền hạn truy cập tương ứng cho hệ thống.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/15 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Tạo vai trò mới
          </button>
        </div>

        {/* Error alert with retry option */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-455 text-xs p-4.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in select-none">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-5 w-5 shrink-0 text-rose-500" />
              <span className="font-semibold leading-relaxed">{error}</span>
            </div>
            <button
              onClick={fetchRolesAndPermissions}
              className="px-4.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/15 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
            >
              Thử tải lại ngay
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 select-none">
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-5 py-3 font-bold text-xs border-b-2 transition-all cursor-pointer ${
              activeTab === 'permissions'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-450 hover:text-slate-850 dark:hover:text-white'
            }`}
          >
            Bảng Phân Quyền
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-5 py-3 font-bold text-xs border-b-2 transition-all cursor-pointer ${
              activeTab === 'directory'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-450 hover:text-slate-850 dark:hover:text-white'
            }`}
          >
            Danh sách Vai trò ({roles.length})
          </button>
        </div>

        {/* TAB 1: PERMISSIONS MATRIX VIEW */}
        {activeTab === 'permissions' && (
          <div className="space-y-8 animate-fade-in">
            {/* Dynamic Role Tab Selectors */}
            <div className="flex flex-wrap gap-2.5 p-1.5 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl max-w-4xl shadow-sm dark:shadow-none select-none">
              {roles.map((r) => {
                const isSelected = r.id === selectedRoleId;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRoleId(r.id)}
                    className={`
                      flex-1 min-w-[125px] px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer
                      ${isSelected
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                      }
                    `}
                  >
                    {r.name}
                  </button>
                );
              })}
            </div>

            {/* Selected Role Meta Details */}
            <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-850/60 p-5 rounded-2xl shadow-sm dark:shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest block">Vai trò đang cấu hình</span>
                <h2 className="text-lg font-bold text-indigo-600 dark:text-indigo-300 mt-1">
                  {getRoleById(selectedRoleId)?.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-2xl">
                  {getRoleById(selectedRoleId)?.description}
                </p>
              </div>
              {getRoleById(selectedRoleId)?.name !== 'Admin' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEditModal(getRoleById(selectedRoleId))}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-350 font-bold text-xs inline-flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
                    title="Chỉnh sửa thông tin vai trò"
                  >
                    <Edit2 className="h-4 w-4" />
                    Sửa thông tin
                  </button>
                  <button
                    onClick={() => handleDeleteRole(selectedRoleId)}
                    className="px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs inline-flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
                    title="Xóa vai trò này khỏi hệ thống"
                  >
                    <Trash2 className="h-4 w-4" />
                    Xóa vai trò
                  </button>
                </div>
              )}
            </div>

            {/* Permissions Table Matrix */}
            <div className="glass-panel rounded-2xl overflow-hidden shadow-sm dark:shadow-xl border border-slate-200 dark:border-slate-800/60">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                  <span className="text-xs text-slate-500">Đang đồng bộ ma trận phân quyền...</span>
                </div>
              ) : (
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          <th className="px-6 py-4 w-1/3">Chức năng & Mô tả</th>
                          <th className="px-6 py-4 text-center">Xem (View)</th>
                          <th className="px-6 py-4 text-center">Thêm mới (Create)</th>
                          <th className="px-6 py-4 text-center">Cập nhật (Update)</th>
                          <th className="px-6 py-4 text-center">Xóa (Delete)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                        {RESOURCES.map((res) => {
                          // Tìm dòng phân quyền tương ứng trong state
                          let permRow = permissions.find(p => p.role_id === selectedRoleId && p.resource === res.key);
                          
                          // Nếu chưa tồn tại trong state, tạo dòng tạm thời
                          if (!permRow) {
                            permRow = { role_id: selectedRoleId, resource: res.key, can_view: false, can_create: false, can_update: false, can_delete: false };
                          }

                          // Đối với Admin, hiển thị cảnh báo đặc biệt hoặc khóa luôn full quyền
                          const isAdminRole = getRoleById(selectedRoleId)?.name === 'Admin';

                          return (
                            <tr key={res.key} className={`transition-colors ${isAdminRole ? 'bg-indigo-50/60 dark:bg-indigo-950/10' : 'hover:bg-slate-50 dark:hover:bg-slate-900/20'}`}>
                              <td className="px-6 py-5">
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 block">
                                  {res.name}
                                </span>
                                <span className="text-xs text-slate-400 dark:text-slate-550 mt-1 block">
                                  {res.desc}
                                </span>
                              </td>
                              
                              {isAdminRole ? (
                                // Admin: luôn hiển thị tất cả 4 ô checked + locked
                                ['can_view', 'can_create', 'can_update', 'can_delete'].map((field) => (
                                  <td key={field} className="px-6 py-5 text-center">
                                    <div className="inline-flex items-center justify-center p-2 rounded-lg">
                                      <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-500/30">
                                        <Check className="h-3.5 w-3.5 text-white" />
                                      </div>
                                    </div>
                                  </td>
                                ))
                              ) : (
                                <>
                                  {/* VIEW CHECKBOX */}
                                  <td className="px-6 py-5 text-center">
                                    <label className="inline-flex items-center justify-center p-2 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800/50 transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={permRow.can_view}
                                        onChange={(e) => handleCheckboxChange(res.key, 'can_view', e.target.checked)}
                                        className="w-5 h-5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-950 focus:ring-offset-2 checked:bg-indigo-600 cursor-pointer"
                                      />
                                    </label>
                                  </td>

                                  {/* CREATE CHECKBOX */}
                                  <td className="px-6 py-5 text-center">
                                    <label className="inline-flex items-center justify-center p-2 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800/50 transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={permRow.can_create}
                                        onChange={(e) => handleCheckboxChange(res.key, 'can_create', e.target.checked)}
                                        className="w-5 h-5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-950 focus:ring-offset-2 checked:bg-indigo-600 cursor-pointer"
                                      />
                                    </label>
                                  </td>

                                  {/* UPDATE CHECKBOX */}
                                  <td className="px-6 py-5 text-center">
                                    <label className="inline-flex items-center justify-center p-2 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800/50 transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={permRow.can_update}
                                        onChange={(e) => handleCheckboxChange(res.key, 'can_update', e.target.checked)}
                                        className="w-5 h-5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-950 focus:ring-offset-2 checked:bg-indigo-600 cursor-pointer"
                                      />
                                    </label>
                                  </td>

                                  {/* DELETE CHECKBOX */}
                                  <td className="px-6 py-5 text-center">
                                    <label className="inline-flex items-center justify-center p-2 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800/50 transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={permRow.can_delete}
                                        onChange={(e) => handleCheckboxChange(res.key, 'can_delete', e.target.checked)}
                                        className="w-5 h-5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-950 focus:ring-offset-2 checked:bg-indigo-600 cursor-pointer"
                                      />
                                    </label>
                                  </td>
                                </>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Save Panel */}
                  <div className="bg-slate-50 dark:bg-slate-900/40 px-6 py-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      {getRoleById(selectedRoleId)?.name === 'Admin' ? (
                        <span className="text-xs text-rose-600 dark:text-rose-455 font-medium flex items-center gap-1">
                          <Lock className="h-3.5 w-3.5" />
                          Quyền của quản trị viên (Admin) luôn được bật mặc định để tránh mất quyền quản trị.
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">
                          Hãy chắc chắn kiểm tra kỹ trước khi cập nhật ma trận phân quyền.
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {saveSuccess && (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-bounce">
                          <Check className="h-4 w-4" />
                          Đã lưu cấu hình thành công!
                        </span>
                      )}

                      <button
                        onClick={handleSaveConfig}
                        disabled={saving || getRoleById(selectedRoleId)?.name === 'Admin'}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-505 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/10 cursor-pointer animate-transition"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="animate-spin h-3.5 w-3.5" />
                            Đang lưu cấu hình...
                          </>
                        ) : (
                          <>
                            <Save className="h-3.5 w-3.5" />
                            Lưu cấu hình
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ROLES DIRECTORY LIST */}
        {activeTab === 'directory' && (
          <div className="glass-panel rounded-2xl overflow-hidden shadow-sm dark:shadow-xl border border-slate-200 dark:border-slate-800/60 animate-fade-in">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                <span className="text-xs text-slate-550">Đang tải danh mục vai trò...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                      <th className="px-6 py-4 w-3/12">Vai trò</th>
                      <th className="px-6 py-4 w-5/12">Mô tả tóm tắt</th>
                      <th className="px-6 py-4 w-2/12 text-center">Thành viên</th>
                      <th className="px-6 py-4 w-2/12 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                    {roles.map((r) => {
                      const count = getRoleUserCount(r.id);
                      const isAdminRole = r.name === 'Admin';
                      return (
                        <tr key={r.id} className="hover:bg-slate-100/40 dark:hover:bg-slate-900/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center border shrink-0 select-none ${
                                isAdminRole
                                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                              }`}>
                                <Shield className="h-4 w-4" />
                              </div>
                              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-950 dark:group-hover:text-white transition-colors">
                                {r.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm truncate">
                            {r.description || 'Chưa có mô tả vai trò.'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 border border-indigo-150 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                              {count} nhân sự
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {!isAdminRole ? (
                              <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleOpenEditModal(r)}
                                  className="p-2 rounded-lg text-slate-400 dark:text-slate-550 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer"
                                  title="Sửa vai trò"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRole(r.id)}
                                  className="p-2 rounded-lg text-slate-400 dark:text-slate-550 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                                  title="Xóa vai trò"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 dark:text-slate-650 italic px-2 select-none">Hệ thống</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Modal: Create Role */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)} />
          
          {/* Box */}
          <div className="glass-panel w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative z-10 animate-scale-up bg-white/95 dark:bg-slate-900/95">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center select-none">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Tạo vai trò công việc mới</h3>
                <p className="text-xs text-slate-450 dark:text-slate-550">Phân quyền chi tiết sau khi tạo</p>
              </div>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4" autoComplete="off">
              {createError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-450 text-xs p-3.5 rounded-xl flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span className="font-semibold">{createError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tên vai trò (Role Name) <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Ví dụ: Quality Assurance, Tech Lead..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-955/80 placeholder-slate-400 dark:placeholder-slate-550"
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Mô tả vai trò</label>
                <textarea
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="Nhập mô tả tóm tắt quyền hạn công việc..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-955/80 placeholder-slate-400 dark:placeholder-slate-550"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-505 text-white text-xs font-bold shadow-lg shadow-indigo-600/10 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {createSubmitting ? (
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

      {/* Modal: Edit Role */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
          
          {/* Box */}
          <div className="glass-panel w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative z-10 animate-scale-up bg-white/95 dark:bg-slate-900/95">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center select-none">
                <Edit2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Chỉnh sửa vai trò</h3>
                <p className="text-xs text-slate-450 dark:text-slate-550">Cập nhật tên vai trò và mô tả hệ thống</p>
              </div>
            </div>

            <form onSubmit={handleEditRole} className="space-y-4" autoComplete="off">
              {editError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-450 text-xs p-3.5 rounded-xl flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span className="font-semibold">{editError}</span>
                </div>
              )}

              {editSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-650 dark:text-emerald-450 text-xs p-3.5 rounded-xl flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 animate-bounce" />
                  <span className="font-semibold">{editSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tên vai trò <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={editRoleName}
                  onChange={(e) => setEditRoleName(e.target.value)}
                  placeholder="Ví dụ: Lập trình viên, Phân tích nghiệp vụ..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-955/80 placeholder-slate-400 dark:placeholder-slate-550"
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Mô tả vai trò</label>
                <textarea
                  value={editRoleDescription}
                  onChange={(e) => setEditRoleDescription(e.target.value)}
                  placeholder="Nhập mô tả tóm tắt..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-955/80 placeholder-slate-400 dark:placeholder-slate-550"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
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
