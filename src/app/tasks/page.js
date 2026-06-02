'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase, withTimeout } from '@/lib/supabase';
import { MOCK_PROJECTS, MOCK_SPRINTS } from '@/lib/mockData';
import {
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  FolderPlus,
  Loader2,
  X,
  SlidersHorizontal,
  Inbox,
  Clock,
  FolderKanban,
} from 'lucide-react';

// Dữ liệu mock ban đầu cho công việc khi chưa kết nối Supabase
const MOCK_TASKS = [
  { id: '1', title: 'Thiết kế giao diện Dashboard AeroTask', description: 'Tạo mockup và style CSS hoàn chỉnh cho trang Dashboard của hệ thống.', status: 'in_progress', priority: 'high', assigned_to: '3', due_date: '2026-06-05', created_by: '1' },
  { id: '2', title: 'Cấu hình cơ sở dữ liệu Supabase', description: 'Thiết lập các bảng, cấu hình RLS và seed dữ liệu phân quyền ban đầu.', status: 'done', priority: 'high', assigned_to: '1', due_date: '2026-06-01', created_by: '1' },
  { id: '3', title: 'Tạo API Route cấp tài khoản an toàn', description: 'Viết API POST /api/admin/create-user để admin tạo tài khoản qua service role key.', status: 'review', priority: 'medium', assigned_to: '3', due_date: '2026-06-03', created_by: '2' },
  { id: '4', title: 'Viết tài liệu hướng dẫn chuyển giao dự án', description: 'Tạo file README chi tiết hướng dẫn chạy và cấu hình các biến môi trường.', status: 'todo', priority: 'low', assigned_to: '4', due_date: '2026-06-10', created_by: '1' },
  { id: '5', title: 'Tích hợp phân quyền vào Kanban Board', description: 'Kiểm tra quyền can_create, can_update, can_delete để ẩn/hiển thị các nút tương ứng.', status: 'todo', priority: 'high', assigned_to: '3', due_date: '2026-06-07', created_by: '2' },
];

const MOCK_PROFILES = [
  { id: '1', full_name: 'Nguyễn Văn Admin' },
  { id: '2', full_name: 'Trần Thị Manager' },
  { id: '3', full_name: 'Phạm Minh Developer' },
  { id: '4', full_name: 'Lê Hoàng Coder' },
];

const MOCK_HISTORY = [
  { id: 'h1', task_id: '1', changed_by: 'Nguyễn Văn Admin', changed_at: '2026-05-28T08:00:00Z', action: 'create', changes: 'Tạo công việc mới' },
  { id: 'h2', task_id: '1', changed_by: 'Trần Thị Manager', changed_at: '2026-06-01T09:30:00Z', action: 'update', changes: 'Trạng thái: Cần làm → Đang làm; Độ ưu tiên: Vừa → Cao' },
  { id: 'h3', task_id: '2', changed_by: 'Nguyễn Văn Admin', changed_at: '2026-05-29T14:00:00Z', action: 'create', changes: 'Tạo công việc mới' },
  { id: 'h4', task_id: '2', changed_by: 'Phạm Minh Developer', changed_at: '2026-05-31T16:45:00Z', action: 'update', changes: 'Trạng thái: Đang làm → Đã xong' },
  { id: 'h5', task_id: '3', changed_by: 'Trần Thị Manager', changed_at: '2026-05-30T10:00:00Z', action: 'create', changes: 'Tạo công việc mới' },
  { id: 'h6', task_id: '3', changed_by: 'Phạm Minh Developer', changed_at: '2026-06-02T11:15:00Z', action: 'update', changes: 'Trạng thái: Cần làm → Chờ duyệt' },
];

const COLUMNS = [
  { id: 'todo', name: 'Cần làm', color: 'border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/10 text-slate-500 dark:text-slate-400' },
  { id: 'in_progress', name: 'Đang làm', color: 'border-indigo-150 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-950/5 text-indigo-600 dark:text-indigo-400' },
  { id: 'review', name: 'Chờ duyệt', color: 'border-amber-150 dark:border-amber-900 bg-amber-50/20 dark:bg-amber-950/5 text-amber-600 dark:text-amber-400' },
  { id: 'done', name: 'Đã xong', color: 'border-emerald-150 dark:border-emerald-900 bg-emerald-50/20 dark:bg-emerald-950/5 text-emerald-600 dark:text-emerald-400' },
];

export default function TasksPage() {
  const { profile, hasPermission } = useAuth();
  
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [members, setMembers] = useState(MOCK_PROFILES);
  const [projects, setProjects] = useState([]);
  const [allSprints, setAllSprints] = useState([]);

  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Quyền thao tác lấy từ context phân quyền động
  const canCreate = hasPermission('tasks', 'create') || !isSupabaseConfigured; // cho phép ở preview
  const canUpdate = hasPermission('tasks', 'update') || !isSupabaseConfigured;
  const canDelete = hasPermission('tasks', 'delete') || !isSupabaseConfigured;

  // Trạng thái modal Thêm/Sửa Task
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // null nếu thêm mới
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskStatus, setTaskStatus] = useState('todo');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskProjectId, setTaskProjectId] = useState('');
  const [taskSprintId, setTaskSprintId] = useState('');

  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Trạng thái modal Lịch sử
  const [allMockHistory, setAllMockHistory] = useState(MOCK_HISTORY);
  const [taskHistory, setTaskHistory] = useState([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyTask, setHistoryTask] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your_supabase_project_url')) {
      setIsSupabaseConfigured(false);
      // Load projects/sprints from localStorage (preview mode)
      try {
        const savedProjects = localStorage.getItem('aerotask_projects');
        const savedSprints = localStorage.getItem('aerotask_sprints');
        setProjects(savedProjects ? JSON.parse(savedProjects) : MOCK_PROJECTS);
        setAllSprints(savedSprints ? JSON.parse(savedSprints) : MOCK_SPRINTS);
      } catch { setProjects(MOCK_PROJECTS); setAllSprints(MOCK_SPRINTS); }
      setLoading(false);
      return;
    }

    fetchTasksAndMembers();
  }, []);

  const fetchTasksAndMembers = async () => {
    try {
      setLoading(true);
      setError('');

      const [profilesRes, tasksRes, projectsRes, sprintsRes] = await Promise.all([
        withTimeout(supabase.from('profiles').select('id, full_name')),
        withTimeout(supabase.from('tasks').select('*').order('created_at', { ascending: false })),
        withTimeout(supabase.from('projects').select('id, code, name').order('created_at', { ascending: true })),
        withTimeout(supabase.from('sprints').select('id, project_id, code, name').order('start_date', { ascending: true })),
      ]);

      if (!profilesRes.error && profilesRes.data) setMembers(profilesRes.data);
      if (!tasksRes.error && tasksRes.data) setTasks(tasksRes.data);
      if (!projectsRes.error && projectsRes.data) setProjects(projectsRes.data);
      if (!sprintsRes.error && sprintsRes.data) setAllSprints(sprintsRes.data);
    } catch (err) {
      console.error('Lỗi tải dữ liệu Kanban:', err);
      setError(err.message || 'Không thể kết nối với cơ sở dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Mở modal thêm mới
  const handleOpenAddModal = (initialStatus = 'todo') => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskStatus(initialStatus);
    setTaskPriority('medium');
    setTaskAssignee(members[0]?.id || '');
    setTaskDueDate('');
    setTaskProjectId('');
    setTaskSprintId('');
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (task) => {
    if (!canUpdate) return;
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskStatus(task.status);
    setTaskPriority(task.priority);
    setTaskAssignee(task.assigned_to || '');
    setTaskDueDate(task.due_date || '');
    setTaskProjectId(task.project_id || '');
    setTaskSprintId(task.sprint_id || '');
    setIsModalOpen(true);
  };

  // Xử lý Gửi Form (Thêm hoặc Cập nhật)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!taskTitle) return;

    setModalSubmitting(true);

    try {
      const statusNames = { todo: 'Cần làm', in_progress: 'Đang làm', review: 'Chờ duyệt', done: 'Đã xong' };
      const priorityNames = { high: 'Cao', medium: 'Vừa', low: 'Thấp' };

      const buildChangeLog = (oldTask) => {
        const changes = [];
        if (oldTask.title !== taskTitle) changes.push(`Tên: "${oldTask.title}" → "${taskTitle}"`);
        if ((oldTask.description || '') !== taskDesc) changes.push('Mô tả đã được cập nhật');
        if (oldTask.status !== taskStatus) changes.push(`Trạng thái: ${statusNames[oldTask.status] || oldTask.status} → ${statusNames[taskStatus] || taskStatus}`);
        if (oldTask.priority !== taskPriority) changes.push(`Độ ưu tiên: ${priorityNames[oldTask.priority] || oldTask.priority} → ${priorityNames[taskPriority] || taskPriority}`);
        const oldMember = members.find(m => m.id === oldTask.assigned_to)?.full_name || 'Chưa phân công';
        const newMember = members.find(m => m.id === taskAssignee)?.full_name || 'Chưa phân công';
        if ((oldTask.assigned_to || '') !== taskAssignee) changes.push(`Người thực hiện: ${oldMember} → ${newMember}`);
        if ((oldTask.due_date || '') !== taskDueDate) changes.push(`Hạn chót: ${oldTask.due_date || 'Chưa đặt'} → ${taskDueDate || 'Chưa đặt'}`);
        const oldProject = projects.find(p => p.id === oldTask.project_id)?.name || 'Chưa chọn';
        const newProject = projects.find(p => p.id === taskProjectId)?.name || 'Chưa chọn';
        if ((oldTask.project_id || '') !== taskProjectId) changes.push(`Dự án: ${oldProject} → ${newProject}`);
        const oldSprint = allSprints.find(s => s.id === oldTask.sprint_id)?.name || 'Chưa chọn';
        const newSprint = allSprints.find(s => s.id === taskSprintId)?.name || 'Chưa chọn';
        if ((oldTask.sprint_id || '') !== taskSprintId) changes.push(`Sprint: ${oldSprint} → ${newSprint}`);
        return changes.length > 0 ? changes.join('; ') : 'Không có thay đổi nào';
      };

      if (!isSupabaseConfigured) {
        // Chế độ Xem trước: cập nhật local state
        let taskId;
        if (editingTask) {
          taskId = editingTask.id;
          setTasks(tasks.map(t => t.id === taskId ? {
            ...t,
            title: taskTitle,
            description: taskDesc,
            status: taskStatus,
            priority: taskPriority,
            assigned_to: taskAssignee,
            due_date: taskDueDate,
            project_id: taskProjectId || null,
            sprint_id: taskSprintId || null,
          } : t));
        } else {
          taskId = 'mock-' + Math.random().toString(36).substr(2, 9);
          const newTask = {
            id: taskId,
            title: taskTitle,
            description: taskDesc,
            status: taskStatus,
            priority: taskPriority,
            assigned_to: taskAssignee,
            due_date: taskDueDate,
            project_id: taskProjectId || null,
            sprint_id: taskSprintId || null,
            created_at: new Date().toISOString(),
          };
          setTasks([newTask, ...tasks]);
        }

        // Ghi lịch sử thay đổi
        const historyEntry = {
          id: 'h-' + Math.random().toString(36).substr(2, 9),
          task_id: taskId,
          changed_by: profile?.full_name || 'Người dùng',
          changed_at: new Date().toISOString(),
          action: editingTask ? 'update' : 'create',
          changes: editingTask ? buildChangeLog(editingTask) : 'Tạo công việc mới',
        };
        setAllMockHistory(prev => [historyEntry, ...prev]);

        setIsModalOpen(false);
        return;
      }

      // Giao tiếp với cơ sở dữ liệu thực tế Supabase
      if (editingTask) {
        // Cập nhật công việc đã có
        const { error } = await supabase
          .from('tasks')
          .update({
            title: taskTitle,
            description: taskDesc,
            status: taskStatus,
            priority: taskPriority,
            assigned_to: taskAssignee || null,
            due_date: taskDueDate || null,
            project_id: taskProjectId || null,
            sprint_id: taskSprintId || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingTask.id);

        if (error) throw error;

        // Ghi lịch sử thay đổi vào DB
        await withTimeout(supabase.from('task_history').insert({
          task_id: editingTask.id,
          changed_by_id: profile?.id || null,
          action: 'update',
          changes: buildChangeLog(editingTask),
        })).catch(() => {});
      } else {
        // Tạo công việc mới
        const { data: newTask, error } = await supabase
          .from('tasks')
          .insert({
            title: taskTitle,
            description: taskDesc,
            status: taskStatus,
            priority: taskPriority,
            assigned_to: taskAssignee || null,
            due_date: taskDueDate || null,
            project_id: taskProjectId || null,
            sprint_id: taskSprintId || null,
          })
          .select()
          .single();

        if (error) throw error;

        // Ghi lịch sử tạo mới vào DB
        if (newTask?.id) {
          await withTimeout(supabase.from('task_history').insert({
            task_id: newTask.id,
            changed_by_id: profile?.id || null,
            action: 'create',
            changes: 'Tạo công việc mới',
          })).catch(() => {});
        }
      }

      // Load lại DB và đóng modal
      await fetchTasksAndMembers();
      setIsModalOpen(false);

    } catch (err) {
      alert('Lỗi thao tác trên công việc: ' + err.message);
    } finally {
      setModalSubmitting(false);
    }
  };

  // Xóa công việc
  const handleDeleteTask = async (id, title, e) => {
    e.stopPropagation(); // ngăn không kích hoạt click mở modal sửa
    if (!canDelete) return;

    if (!confirm(`Bạn có chắc muốn xóa công việc "${title}" không?`)) {
      return;
    }

    try {
      if (!isSupabaseConfigured) {
        setTasks(tasks.filter(t => t.id !== id));
        return;
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchTasksAndMembers();
    } catch (err) {
      alert('Không thể xóa công việc: ' + err.message);
    }
  };

  // Mở modal lịch sử thay đổi
  const handleOpenHistoryModal = async (task, e) => {
    e.stopPropagation();
    setHistoryTask(task);
    setTaskHistory([]);
    setIsHistoryModalOpen(true);

    if (!isSupabaseConfigured) {
      setTaskHistory(allMockHistory.filter(h => h.task_id === task.id));
      return;
    }

    setHistoryLoading(true);
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('task_history')
          .select('*, profiles!changed_by_id(full_name)')
          .eq('task_id', task.id)
          .order('changed_at', { ascending: false })
      );
      if (!error && data) {
        setTaskHistory(data.map(h => ({ ...h, changed_by: h.profiles?.full_name || 'Ẩn danh' })));
      }
    } catch (err) {
      console.error('Lỗi tải lịch sử:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const getMemberName = (id) => {
    const m = members.find(item => item.id === id);
    return m ? m.full_name : 'Chưa phân công';
  };

  const getPriorityBadgeStyle = (prio) => {
    switch (prio) {
      case 'high': return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/10';
      case 'medium': return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/10';
      case 'low': return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10';
      default: return 'bg-slate-500/15 text-slate-500 dark:text-slate-400 border border-slate-500/10';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 dark:from-white dark:via-slate-100 dark:to-indigo-100 bg-clip-text text-transparent">
              Quản lý công việc
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Bảng Kanban quản lý tiến độ dự án của các thành viên. Xem, tạo và điều phối nhiệm vụ dễ dàng.
            </p>
          </div>

          {canCreate && (
            <button
              onClick={() => handleOpenAddModal('todo')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shrink-0"
            >
              <FolderPlus className="h-4.5 w-4.5" />
              Tạo công việc
            </button>
          )}
        </div>

        {/* Dashboard Preview Notice / Permissions Info */}
        {!canCreate && (
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center gap-3 text-slate-600 dark:text-slate-400 text-xs shadow-sm">
            <AlertCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              Tài khoản của bạn chỉ có quyền **Xem** và **Cập nhật** (Đổi trạng thái) công việc. Nút tạo mới và nút xóa đã được ẩn theo chính sách phân quyền của quản trị viên.
            </span>
          </div>
        )}

        {/* Error alert with retry option */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-450 text-xs p-4.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in select-none">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
              <span className="font-semibold leading-relaxed">{error}</span>
            </div>
            <button
              onClick={fetchTasksAndMembers}
              className="px-4.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/15 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
            >
              Thử tải lại ngay
            </button>
          </div>
        )}

        {/* Kanban Board Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            <span className="text-xs text-slate-500">Đang tải bảng công việc nhóm...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {COLUMNS.map(col => {
              // Lọc các công việc thuộc cột này
              const colTasks = tasks.filter(t => t.status === col.id);

              return (
                <div key={col.id} className="flex flex-col h-full min-h-[500px] bg-slate-100/60 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 p-4 rounded-2xl">
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-900">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${col.id === 'done' ? 'bg-emerald-500' : col.id === 'in_progress' ? 'bg-indigo-500' : col.id === 'review' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                      <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">{col.name}</h3>
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-900 text-slate-500 dark:text-slate-500 px-2 py-0.5 rounded-full font-black">
                        {colTasks.length}
                      </span>
                    </div>
                    {canCreate && (
                      <button 
                        onClick={() => handleOpenAddModal(col.id)}
                        className="p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-950 transition-colors cursor-pointer"
                        title="Thêm công việc vào cột này"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Tasks List */}
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1">
                    {colTasks.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-600 border border-dashed border-slate-200 dark:border-slate-900 rounded-xl flex flex-col items-center justify-center gap-2">
                        <Inbox className="h-6 w-6 text-slate-300 dark:text-slate-700" />
                        Trống
                      </div>
                    ) : (
                      colTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={() => handleOpenEditModal(task)}
                          className={`
                            glass-panel p-4.5 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm flex flex-col justify-between gap-4.5 transition-all duration-200 group
                            ${canUpdate ? 'hover:border-slate-350 dark:hover:border-slate-700 cursor-pointer hover:bg-white dark:hover:bg-slate-900/35 hover:-translate-y-0.5' : ''}
                          `}
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${getPriorityBadgeStyle(task.priority)}`}>
                                {task.priority === 'high' ? 'Cao' : task.priority === 'medium' ? 'Vừa' : 'Thấp'}
                              </span>

                              <div className="flex items-center gap-0.5">
                                <button
                                  onClick={(e) => handleOpenHistoryModal(task, e)}
                                  className="p-1 rounded text-slate-400 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                  title="Xem lịch sử thay đổi"
                                >
                                  <Clock className="h-3.5 w-3.5" />
                                </button>
                                {canDelete && (
                                  <button
                                    onClick={(e) => handleDeleteTask(task.id, task.title, e)}
                                    className="p-1 rounded text-slate-400 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                    title="Xóa công việc"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-200 group-hover:text-slate-950 dark:group-hover:text-white transition-colors leading-relaxed">
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                {task.description}
                              </p>
                            )}
                            {task.project_id && (() => {
                              const proj = projects.find(p => p.id === task.project_id);
                              const sprint = task.sprint_id ? allSprints.find(s => s.id === task.sprint_id) : null;
                              return proj ? (
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/15">
                                    <FolderKanban className="h-2.5 w-2.5" />{proj.code}
                                  </span>
                                  {sprint && (
                                    <span className="inline-flex text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400 font-semibold border border-violet-500/15">
                                      {sprint.code}
                                    </span>
                                  )}
                                </div>
                              ) : null;
                            })()}
                          </div>

                          {/* Footer details */}
                          <div className="pt-3 border-t border-slate-200 dark:border-slate-900/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1.5 min-w-0 text-slate-500">
                              <div className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 flex items-center justify-center text-[9px] font-bold uppercase shrink-0 text-indigo-600 dark:text-indigo-400">
                                {getMemberName(task.assigned_to)?.charAt(0)}
                              </div>
                              <span className="truncate">{getMemberName(task.assigned_to)}</span>
                            </div>

                            {task.due_date && (
                              <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 font-medium shrink-0">
                                <Calendar className="h-3 w-3" />
                                <span>{task.due_date.substring(5)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Create or Edit Task */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

            {/* Box */}
            <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative z-10 animate-scale-up">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <SlidersHorizontal className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    {editingTask ? 'Cập nhật công việc' : 'Tạo công việc mới'}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {editingTask ? 'Chỉnh sửa và đồng bộ tiến độ công việc' : 'Thêm nhiệm vụ mới vào bảng Kanban'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tên công việc <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Ví dụ: Thiết kế cơ sở dữ liệu..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-950/80"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Mô tả công việc</label>
                  <textarea
                    rows={3}
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    placeholder="Chi tiết yêu cầu, mục tiêu cần đạt được..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-950/80 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Độ ưu tiên</label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
                    >
                      <option value="high" className="bg-white dark:bg-slate-900 text-rose-500">Cao (High)</option>
                      <option value="medium" className="bg-white dark:bg-slate-900 text-amber-500">Vừa (Medium)</option>
                      <option value="low" className="bg-white dark:bg-slate-900 text-emerald-500">Thấp (Low)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Trạng thái cột</label>
                    <select
                      value={taskStatus}
                      onChange={(e) => setTaskStatus(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
                    >
                      <option value="todo" className="bg-white dark:bg-slate-900 text-slate-500">Cần làm</option>
                      <option value="in_progress" className="bg-white dark:bg-slate-900 text-indigo-500">Đang làm</option>
                      <option value="review" className="bg-white dark:bg-slate-900 text-amber-500">Chờ duyệt</option>
                      <option value="done" className="bg-white dark:bg-slate-900 text-emerald-500">Đã xong</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Giao cho (Assignee)</label>
                    <select
                      value={taskAssignee}
                      onChange={(e) => setTaskAssignee(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-white dark:bg-slate-900 text-slate-400">Chưa phân công</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-300">
                          {m.full_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Hạn chót hoàn thành</label>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      <span className="flex items-center gap-1"><FolderKanban className="h-3 w-3" /> Dự án</span>
                    </label>
                    <select
                      value={taskProjectId}
                      onChange={(e) => { setTaskProjectId(e.target.value); setTaskSprintId(''); }}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
                    >
                      <option value="">-- Chưa chọn dự án --</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Sprint</label>
                    <select
                      value={taskSprintId}
                      onChange={(e) => setTaskSprintId(e.target.value)}
                      disabled={!taskProjectId}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">-- Chưa chọn sprint --</option>
                      {allSprints.filter(s => s.project_id === taskProjectId).map(s => (
                        <option key={s.id} value={s.id}>[{s.code}] {s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 text-sm font-semibold border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={modalSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {modalSubmitting ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4" />
                        Đang lưu...
                      </>
                    ) : (
                      'Xác nhận lưu'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Task History */}
        {isHistoryModalOpen && historyTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-slate-500/15 backdrop-blur-md" onClick={() => setIsHistoryModalOpen(false)} />

            <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative z-10 animate-scale-up">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Lịch sử thay đổi</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[280px]">{historyTask.title}</p>
                </div>
              </div>

              {historyLoading ? (
                <div className="py-12 flex items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-xs">Đang tải lịch sử...</span>
                </div>
              ) : taskHistory.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-600 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center gap-2">
                  <Clock className="h-6 w-6 text-slate-300 dark:text-slate-700" />
                  Chưa có lịch sử thay đổi nào
                </div>
              ) : (
                <div className="max-h-[480px] overflow-y-auto pr-1">
                  {taskHistory.map((entry, idx) => (
                    <div key={entry.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                          entry.action === 'create'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                        }`}>
                          {entry.action === 'create'
                            ? <Plus className="h-3.5 w-3.5" />
                            : <SlidersHorizontal className="h-3.5 w-3.5" />
                          }
                        </div>
                        {idx < taskHistory.length - 1 && (
                          <div className="w-px flex-1 bg-slate-200 dark:bg-slate-800 my-1" />
                        )}
                      </div>

                      <div className="pb-5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                            entry.action === 'create'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                          }`}>
                            {entry.action === 'create' ? 'Tạo mới' : 'Cập nhật'}
                          </span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{entry.changed_by}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-auto shrink-0">
                            {new Date(entry.changed_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{entry.changes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
