'use client';

import { useEffect, useState, Fragment, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase, withTimeout } from '@/lib/supabase';
import { MOCK_PROJECTS, MOCK_SPRINTS } from '@/lib/mockData';
import {
  Plus,
  Trash2,
  Edit2,
  Eye,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  X,
  Loader2,
  ShieldAlert,
  Check,
  Activity,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  Search,
  ArrowUpDown,
  Users,
  CalendarDays,
  BookOpen,
  FolderKanban,
  SlidersHorizontal,
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Dữ liệu mock ban đầu cho Use Cases trong chế độ xem trước (Preview Mode)
const MOCK_USE_CASES = [
  { id: 'uc1', code: 'UC-01', name: 'Đăng nhập hệ thống', description: 'Người dùng thực hiện đăng nhập vào hệ thống PROJEXA bằng tài khoản và mật khẩu được cấp.', notes: 'Hỗ trợ ghi nhớ mật khẩu và tự động đồng bộ theme từ localStorage.', actors: 'Người dùng, Hệ thống xác thực', ba_email: 'ba@demo.com', dev_email: 'dev@demo.com', difficulty: 'Đơn giản', bmt: 'T', status_ba: 'Hoàn thành', status_dev: 'Đang thực hiện', status_test: 'Chưa bắt đầu', created_at: '2026-05-20T08:00:00Z' },
  { id: 'uc2', code: 'UC-02', name: 'Quản lý bảng Kanban', description: 'Quản lý và cập nhật trạng thái các công việc bằng thao tác kéo thả hoặc biểu mẫu chỉnh sửa.', notes: 'Chỉ hiển thị các nút thao tác (Thêm, Sửa, Xóa) dựa trên ma trận phân quyền RBAC.', actors: 'Manager, Developer', ba_email: '', dev_email: 'dev@demo.com', difficulty: 'Phức tạp', bmt: 'M', status_ba: 'Đang thực hiện', status_dev: 'Chưa bắt đầu', status_test: '', created_at: '2026-05-22T09:30:00Z' },
  { id: 'uc3', code: 'UC-03', name: 'Sơ đồ cây thành viên', description: 'Xem trực quan sơ đồ tổ chức nhân sự dưới dạng cây đệ quy cha con.', notes: 'Có chức năng chống tự báo cáo cho bản thân và chống báo cáo xoay vòng vòng tròn.', actors: 'Admin, Manager', ba_email: 'ba@demo.com', dev_email: '', difficulty: 'Trung bình', bmt: 'B', status_ba: 'Hoàn thành', status_dev: 'Hoàn thành', status_test: 'Đang thực hiện', created_at: '2026-05-25T10:15:00Z' },
];

const MOCK_PROFILES = [
  { id: 'p1', email: 'ba@demo.com', full_name: 'Nguyễn BA Mẫu' },
  { id: 'p2', email: 'dev@demo.com', full_name: 'Trần Dev Mẫu' },
  { id: 'p3', email: 'manager@demo.com', full_name: 'Lê Manager Mẫu' },
];

// Mock ghi chú từ nhật ký tham chiếu tới UC — chỉ dùng trong preview mode
const MOCK_UC_LOG_NOTES = {
  'uc1': [
    { log_id: 'log5', log_date: '2026-06-01', log_title: 'Review UI nhật ký & Use Case notes', note: '- có sai lệch ở bước xác thực token', user_name: 'Phạm Minh Developer', avatar_url: null, created_at: '2026-06-01T16:30:00Z' },
    { log_id: 'log1', log_date: '2026-05-28', log_title: 'Review sprint và hoàn thiện UI Dashboard', note: 'Kiểm tra lại flow đăng nhập', user_name: 'Lê Hoàng Coder', avatar_url: null, created_at: '2026-05-28T17:00:00Z' },
  ],
  'uc2': [],
  'uc3': [
    { log_id: 'log3', log_date: '2026-05-30', log_title: 'Implement RBAC động', note: 'Xem lại thiết kế mới nhất', user_name: 'Phạm Minh Developer', avatar_url: null, created_at: '2026-05-30T17:30:00Z' },
  ],
};

const MOCK_TRANSACTIONS = [
  // UC-01
  { id: 'tx1', use_case_id: 'uc1', code: 'TX-01', name: 'Nhập thông tin tài khoản', description: 'Người dùng điền địa chỉ email và mật khẩu đăng nhập.' },
  { id: 'tx2', use_case_id: 'uc1', code: 'TX-02', name: 'Xác thực thông tin', description: 'Hệ thống gửi yêu cầu xác thực tới Supabase Auth hoặc mock authentication.' },
  { id: 'tx3', use_case_id: 'uc1', code: 'TX-03', name: 'Điều hướng trang chủ', description: 'Đăng nhập thành công, hệ thống chuyển hướng người dùng tới trang Tổng quan.' },
  
  // UC-02
  { id: 'tx4', use_case_id: 'uc2', code: 'TX-01', name: 'Tải dữ liệu công việc', description: 'Tải danh sách công việc theo trạng thái: Cần làm, Đang làm, Đợi duyệt, Đã xong.' },
  { id: 'tx5', use_case_id: 'uc2', code: 'TX-02', name: 'Kiểm tra quyền hạn', description: 'Xác thực tài khoản có quyền can_create hoặc can_update hay can_delete đối với Tasks.' },
  { id: 'tx6', use_case_id: 'uc2', code: 'TX-03', name: 'Ghi nhận lịch sử kéo thả', description: 'Cập nhật trường status của công việc tương ứng trong cơ sở dữ liệu.' },
  
  // UC-03
  { id: 'tx7', use_case_id: 'uc3', code: 'TX-01', name: 'Xây dựng cây đệ quy', description: 'Tìm các node con có manager_id trỏ về id cấp trên.' },
  { id: 'tx8', use_case_id: 'uc3', code: 'TX-02', name: 'Thụt lề cây tự động', description: 'Render symbol nhánh ├── tương ứng với độ sâu level trong cấu trúc cây.' },
];

export default function UseCasesPage() {
  const { user, role: currentRole, hasPermission, isSupabaseConfigured: authConfigured } = useAuth();

  const isManagerOrAdmin = currentRole?.name === 'Admin' || currentRole?.name === 'Manager';

  const [useCases, setUseCases] = useState(MOCK_USE_CASES);
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Trạng thái tìm kiếm & lọc
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterBMT, setFilterBMT] = useState('');
  const [filterBA, setFilterBA] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [myProjectIds, setMyProjectIds] = useState(new Set());

  // Trạng thái modal Xem Chi Tiết
  const [viewUC, setViewUC] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [ucLogNotes, setUcLogNotes] = useState([]);
  const [ucLogNotesLoading, setUcLogNotesLoading] = useState(false);

  // UC status: shared with daily-logs page via localStorage (SSR-safe — loaded in useEffect below)
  const [ucStatusMap, setUcStatusMap] = useState({});
  const [ucStatusLogs, setUcStatusLogs] = useState([]);
  const [ucStatusLogsLoading, setUcStatusLogsLoading] = useState(false);

  // Trạng thái modal Thêm / Sửa Use Case
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [editingUCId, setEditingUCId] = useState('');
  const [ucCode, setUcCode] = useState('');
  const [ucName, setUcName] = useState('');
  const [ucDescription, setUcDescription] = useState('');
  const [ucNotes, setUcNotes] = useState('');
  const [ucActors, setUcActors] = useState('');
  const [ucDifficulty, setUcDifficulty] = useState('Đơn giản');
  const [ucBMT, setUcBMT] = useState('B');
  
  const [ucBA, setUcBA] = useState('');
  const [ucDev, setUcDev] = useState('');
  const [ucProjectId, setUcProjectId] = useState('');
  const [ucSprintId, setUcSprintId] = useState('');
  const [ucStatusBA, setUcStatusBA] = useState('');
  const [ucStatusDev, setUcStatusDev] = useState('');
  const [ucStatusTest, setUcStatusTest] = useState('');

  // Danh sách dự án và sprint
  const [projects, setProjects] = useState([]);
  const [allSprints, setAllSprints] = useState([]);

  // Danh sách transaction nhập liệu trong Form (động)
  const [ucTransactions, setUcTransactions] = useState([]);

  // Danh sách người dùng trong hệ thống (cho dropdown BA/Dev)
  const [profiles, setProfiles] = useState(MOCK_PROFILES);

  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  // Trạng thái cho Xem trước khi Import Excel
  const [isImportPreviewModalOpen, setIsImportPreviewModalOpen] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState([]);
  const [isImportSaving, setIsImportSaving] = useState(false);
  const [expandedPreviewRows, setExpandedPreviewRows] = useState({});

  // Trạng thái cho Upload Excel Modal & Drag & Drop
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Trạng thái Accordion rộng dòng Use Case trên danh sách
  const [expandedUseCases, setExpandedUseCases] = useState({});

  // Trạng thái Sắp xếp danh sách Use Cases
  const [sortBy, setSortBy] = useState('code');
  const [sortOrder, setSortOrder] = useState('asc');

  // Phân trang
  const [ucPage, setUcPage] = useState(1);
  const [ucPageSize, setUcPageSize] = useState(20);

  // Trạng thái Chọn nhiều bản ghi để Xóa hàng loạt
  const [selectedUseCases, setSelectedUseCases] = useState({});

  const [colWidths, setColWidths] = useState(() => {
    const defaults = {
      code: 100, name: 180, description: 220, difficulty: 100, bmt: 70,
      ba: 140, dev: 140, status_ba: 120, status_dev: 120, status_test: 120,
      reviewed_at: 120, docs_updated_at: 130, dev_completed_at: 120, doc_reviewed_at: 130,
    };
    if (typeof window === 'undefined') return defaults;
    try {
      const saved = localStorage.getItem('projexa_uc_col_widths');
      if (saved) return { ...defaults, ...JSON.parse(saved) };
    } catch {}
    return defaults;
  });
  const [visibleCols, setVisibleCols] = useState(() => {
    const defaults = {
      code: true, name: true, description: true, difficulty: true, bmt: true,
      ba: true, dev: true, status_ba: true, status_dev: true, status_test: true,
      reviewed_at: true, docs_updated_at: true, dev_completed_at: true, doc_reviewed_at: true,
    };
    if (typeof window === 'undefined') return defaults;
    try {
      const saved = localStorage.getItem('projexa_uc_visible_cols');
      if (saved) return { ...defaults, ...JSON.parse(saved) };
    } catch {}
    return defaults;
  });
  const [showColPanel, setShowColPanel] = useState(false);
  const resizingCol = useRef(null);
  const resizeStartX = useRef(0);
  const resizeStartW = useRef(0);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your_supabase_project_url')) {
      setIsSupabaseConfigured(false);
      setLoading(false);
      try {
        const savedProjects = localStorage.getItem('aerotask_projects');
        const savedSprints = localStorage.getItem('aerotask_sprints');
        setProjects(savedProjects ? JSON.parse(savedProjects) : MOCK_PROJECTS);
        setAllSprints(savedSprints ? JSON.parse(savedSprints) : MOCK_SPRINTS);
      } catch { setProjects(MOCK_PROJECTS); setAllSprints(MOCK_SPRINTS); }
      return;
    }

    fetchUseCasesAndTransactions();
    fetchProfiles();
    fetchProjectsData();
  }, []);

  // Load UC status từ localStorage (client-only — SSR-safe, không dùng lazy initializer)
  useEffect(() => {
    try {
      const map = localStorage.getItem('aerotask_uc_status');
      if (map) setUcStatusMap(JSON.parse(map));
      const logs = localStorage.getItem('aerotask_uc_status_logs');
      if (logs) setUcStatusLogs(JSON.parse(logs));
    } catch {}
  }, []);

  // Lưu trạng thái ẩn/hiện cột vào localStorage mỗi khi thay đổi
  useEffect(() => {
    try {
      localStorage.setItem('projexa_uc_visible_cols', JSON.stringify(visibleCols));
    } catch {}
  }, [visibleCols]);

  // Lưu độ rộng cột vào localStorage mỗi khi thay đổi
  useEffect(() => {
    try {
      localStorage.setItem('projexa_uc_col_widths', JSON.stringify(colWidths));
    } catch {}
  }, [colWidths]);

  // Load project memberships cho user hiện tại (ngoại trừ Admin/Manager — họ thấy tất cả)
  useEffect(() => {
    if (!user || isManagerOrAdmin) return;
    const loadMemberships = async () => {
      if (!isSupabaseConfigured) {
        // Mock mode: đọc từ localStorage
        try {
          const stored = JSON.parse(localStorage.getItem('aerotask_project_members') || '[]');
          const ids = new Set(stored.filter(m => m.user_id === user.id).map(m => m.project_id));
          setMyProjectIds(ids);
        } catch { setMyProjectIds(new Set()); }
        return;
      }
      try {
        const { data, error } = await withTimeout(
          supabase.from('project_members').select('project_id').eq('user_id', user.id)
        );
        if (!error && data) setMyProjectIds(new Set(data.map(m => m.project_id)));
      } catch { /* silently ignore */ }
    };
    loadMemberships();
  }, [user, isManagerOrAdmin, isSupabaseConfigured]);

  // Auto-set filterProject về dự án đầu tiên của user khi dữ liệu sẵn sàng
  useEffect(() => {
    if (isManagerOrAdmin || myProjectIds.size === 0 || projects.length === 0) return;
    if (filterProject !== '') return; // đã được set rồi, không ghi đè
    const firstMatch = projects.find(p => myProjectIds.has(p.id));
    if (firstMatch) setFilterProject(firstMatch.id);
  }, [myProjectIds, projects, isManagerOrAdmin]);

  // Quyền thao tác Use Cases lấy từ context phân quyền
  const canCreate = hasPermission('use_cases', 'create') || !isSupabaseConfigured;
  const canUpdate = hasPermission('use_cases', 'update') || !isSupabaseConfigured;
  const canDelete = hasPermission('use_cases', 'delete') || !isSupabaseConfigured;

  const fetchUseCasesAndTransactions = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 1. Tải danh sách Use Cases
      const { data: ucData, error: ucError } = await withTimeout(
        supabase
          .from('use_cases')
          .select('*')
          .order('code', { ascending: true })
      );

      if (!ucError && ucData) {
        setUseCases(ucData);
      }

      // 2. Tải danh sách Transactions
      const { data: txData, error: txError } = await withTimeout(
        supabase
          .from('use_case_transactions')
          .select('*')
          .order('code', { ascending: true })
      );

      if (!txError && txData) {
        setTransactions(txData);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu Use Cases:', err);
      setError(err.message || 'Không thể tải danh sách Use Cases. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await withTimeout(
        supabase.from('profiles').select('id, email, full_name').order('full_name', { ascending: true })
      );
      if (!error && data && data.length > 0) {
        setProfiles(data);
      }
    } catch {
      // silently fall back to mock profiles
    }
  };

  const fetchProjectsData = async () => {
    try {
      const [pRes, sRes] = await Promise.all([
        withTimeout(supabase.from('projects').select('id, code, name').order('created_at', { ascending: true })),
        withTimeout(supabase.from('sprints').select('id, project_id, code, name').order('start_date', { ascending: true })),
      ]);
      if (!pRes.error && pRes.data) setProjects(pRes.data);
      if (!sRes.error && sRes.data) setAllSprints(sRes.data);
    } catch { /* fall back to empty */ }
  };

  // Thêm mới một dòng transaction rỗng trong Form nhập liệu
  const handleAddFormTransaction = () => {
    const nextIndex = ucTransactions.length + 1;
    const paddingIndex = nextIndex < 10 ? '0' + nextIndex : nextIndex;
    setUcTransactions([
      ...ucTransactions,
      { id: 'temp-' + Math.random(), code: `TX-${paddingIndex}`, name: '', description: '' }
    ]);
  };

  // Cập nhật giá trị một ô transaction trong Form
  const handleUpdateFormTransaction = (id, field, value) => {
    setUcTransactions(prev => 
      prev.map(t => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  // Xóa một dòng transaction trong Form
  const handleRemoveFormTransaction = (id) => {
    setUcTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Mở Form Thêm Mới
  const handleOpenAddModal = () => {
    setUcCode('');
    setUcName('');
    setUcDescription('');
    setUcNotes('');
    setUcActors('');
    setUcBA('');
    setUcDev('');
    setUcDifficulty('Đơn giản');
    setUcBMT('B');
    setUcProjectId('');
    setUcSprintId('');
    setUcTransactions([]);
    setModalError('');
    setModalSuccess('');
    setIsAddModalOpen(true);
  };

  // Tải danh sách ghi chú từ nhật ký liên quan đến UC (chỉ dành cho Manager/Admin)
  const fetchUCLogNotes = async (ucId) => {
    if (!isManagerOrAdmin) return;
    setUcLogNotesLoading(true);
    if (!isSupabaseConfigured) {
      // Simulate async, filter out empty notes
      await new Promise(r => setTimeout(r, 200));
      setUcLogNotes((MOCK_UC_LOG_NOTES[ucId] || []).filter(n => n.note));
      setUcLogNotesLoading(false);
      return;
    }
    try {
      const { data, error } = await withTimeout(
        supabase.from('daily_logs')
          .select('id, log_date, title, related_ucs, created_at, profiles!user_id(full_name, avatar_url)')
          .filter('related_ucs', 'cs', JSON.stringify([{ uc_id: ucId }]))
          .order('created_at', { ascending: false })
      );
      if (!error && data) {
        const notes = data
          .map(log => {
            const ucRef = (log.related_ucs || []).find(r => r.uc_id === ucId);
            return {
              log_id: log.id,
              log_date: log.log_date,
              log_title: log.title,
              note: ucRef?.note || '',
              user_name: log.profiles?.full_name || 'Ẩn danh',
              avatar_url: log.profiles?.avatar_url || null,
              created_at: log.created_at,
            };
          })
          .filter(n => n.note);
        setUcLogNotes(notes);
      }
    } catch (err) {
      console.error('Lỗi tải ghi chú UC từ nhật ký:', err);
      setUcLogNotes([]);
    } finally {
      setUcLogNotesLoading(false);
    }
  };

  // Lấy lịch sử xác nhận trạng thái UC từ Supabase (chỉ dùng trong Supabase mode)
  const fetchUCStatusLogsFromDB = async (ucId) => {
    if (!isSupabaseConfigured) return;
    setUcStatusLogsLoading(true);
    try {
      const { data, error } = await withTimeout(
        supabase.from('uc_status_logs')
          .select('id, status_type, confirmed_at, confirmed_by_name, log_id, log_date')
          .eq('uc_id', ucId)
          .order('confirmed_at', { ascending: false })
      );
      if (!error && data) {
        setUcStatusLogs(data.map(d => ({ ...d, uc_id: ucId })));
      }
    } catch (err) {
      console.error('Lỗi tải lịch sử trạng thái UC:', err);
    } finally {
      setUcStatusLogsLoading(false);
    }
  };

  // Mở Modal Xem Chi Tiết
  const handleOpenViewModal = (uc) => {
    setViewUC(uc);
    setUcLogNotes([]);
    setIsViewModalOpen(true);
    fetchUCLogNotes(uc.id);
    fetchUCStatusLogsFromDB(uc.id);
  };

  // Tạo mới Use Case
  const handleCreateUseCase = async (e) => {
    e.preventDefault();
    if (!ucCode.trim() || !ucName.trim()) {
      setModalError('Vui lòng nhập đầy đủ Mã và Tên Use Case.');
      return;
    }

    // Kiểm tra trùng Mã UC
    const isDuplicate = useCases.some(u => u.code.toLowerCase() === ucCode.trim().toLowerCase());
    if (isDuplicate) {
      setModalError('Mã Use Case này đã tồn tại trên hệ thống.');
      return;
    }

    setModalError('');
    setModalSuccess('');
    setModalSubmitting(true);

    try {
      if (!isSupabaseConfigured) {
        // Chế độ xem trước
        await new Promise(resolve => setTimeout(resolve, 600));
        const newUCId = 'uc-' + Math.random().toString(36).substring(2, 9);
        const newUCObj = {
          id: newUCId,
          code: ucCode.trim(),
          name: ucName.trim(),
          description: ucDescription.trim(),
          notes: ucNotes.trim(),
          actors: ucActors.trim(),
          ba_email: ucBA,
          dev_email: ucDev,
          difficulty: ucDifficulty,
          bmt: ucBMT,
          status_ba: ucStatusBA,
          status_dev: ucStatusDev,
          status_test: ucStatusTest,
          project_id: ucProjectId || null,
          sprint_id: ucSprintId || null,
          created_at: new Date().toISOString()
        };

        const newTXs = ucTransactions
          .filter(t => t.name.trim() !== '')
          .map((t, idx) => ({
            id: 'tx-' + Math.random(),
            use_case_id: newUCId,
            code: t.code || `TX-0${idx + 1}`,
            name: t.name.trim(),
            description: t.description.trim()
          }));

        setUseCases(prev => [...prev, newUCObj].sort((a,b) => a.code.localeCompare(b.code)));
        setTransactions(prev => [...prev, ...newTXs]);
        setModalSuccess('Đã thêm Use Case mô phỏng thành công!');
        
        setTimeout(() => {
          setIsAddModalOpen(false);
        }, 1000);
        return;
      }

      // Xử lý lưu thực tế vào Supabase
      // 1. Chèn Use Case
      const { data: createdUC, error: ucError } = await supabase
        .from('use_cases')
        .insert({
          code: ucCode.trim(),
          name: ucName.trim(),
          description: ucDescription.trim(),
          notes: ucNotes.trim(),
          actors: ucActors.trim(),
          ba_email: ucBA || null,
          dev_email: ucDev || null,
          difficulty: ucDifficulty,
          bmt: ucBMT,
          status_ba: ucStatusBA || null,
          status_dev: ucStatusDev || null,
          status_test: ucStatusTest || null,
          project_id: ucProjectId || null,
          sprint_id: ucSprintId || null,
        })
        .select()
        .single();

      if (ucError) throw ucError;

      // 2. Chèn các Transactions liên quan (lọc bỏ dòng rỗng tên)
      const txsToInsert = ucTransactions
        .filter(t => t.name.trim() !== '')
        .map(t => ({
          use_case_id: createdUC.id,
          code: t.code.trim() || 'TX-01',
          name: t.name.trim(),
          description: t.description.trim()
        }));

      if (txsToInsert.length > 0) {
        const { error: txError } = await supabase
          .from('use_case_transactions')
          .insert(txsToInsert);
        if (txError) throw txError;
      }

      setModalSuccess('Tạo Use Case và danh sách Transaction thành công!');
      await fetchUseCasesAndTransactions();

      setTimeout(() => {
        setIsAddModalOpen(false);
      }, 1000);
    } catch (err) {
      setModalError(err.message || 'Lỗi khi lưu dữ liệu.');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Mở Form Chỉnh Sửa
  const handleOpenEditModal = (uc) => {
    setEditingUCId(uc.id);
    setUcCode(uc.code);
    setUcName(uc.name);
    setUcDescription(uc.description || '');
    setUcNotes(uc.notes || '');
    setUcActors(uc.actors || '');
    setUcBA(uc.ba_email || '');
    setUcDev(uc.dev_email || '');
    setUcDifficulty(uc.difficulty);
    setUcBMT(uc.bmt);
    setUcProjectId(uc.project_id || '');
    setUcSprintId(uc.sprint_id || '');
    setUcStatusBA(uc.status_ba || '');
    setUcStatusDev(uc.status_dev || '');
    setUcStatusTest(uc.status_test || '');

    // Tải các transactions trực thuộc của UC này
    const relatedTxs = transactions.filter(t => t.use_case_id === uc.id);
    setUcTransactions(
      relatedTxs.map(t => ({ id: t.id, code: t.code, name: t.name, description: t.description || '' }))
    );
    
    setModalError('');
    setModalSuccess('');
    setIsEditModalOpen(true);
  };

  // Cập nhật Use Case
  const handleEditUseCase = async (e) => {
    e.preventDefault();
    if (!ucCode.trim() || !ucName.trim()) {
      setModalError('Mã và Tên Use Case không được bỏ trống.');
      return;
    }

    // Kiểm tra trùng mã (ngoại trừ chính nó)
    const isDuplicate = useCases.some(u => u.id !== editingUCId && u.code.toLowerCase() === ucCode.trim().toLowerCase());
    if (isDuplicate) {
      setModalError('Mã Use Case này đã tồn tại trên hệ thống.');
      return;
    }

    setModalError('');
    setModalSuccess('');
    setModalSubmitting(true);

    try {
      if (!isSupabaseConfigured) {
        // Chế độ xem trước
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Cập nhật Use Case
        const updatedUCs = useCases.map(u => {
          if (u.id === editingUCId) {
            return {
              ...u,
              code: ucCode.trim(),
              name: ucName.trim(),
              description: ucDescription.trim(),
              notes: ucNotes.trim(),
              actors: ucActors.trim(),
              ba_email: ucBA,
              dev_email: ucDev,
              difficulty: ucDifficulty,
              bmt: ucBMT,
              status_ba: ucStatusBA,
              status_dev: ucStatusDev,
              status_test: ucStatusTest,
              project_id: ucProjectId || null,
              sprint_id: ucSprintId || null,
            };
          }
          return u;
        });
        setUseCases(updatedUCs.sort((a,b) => a.code.localeCompare(b.code)));

        // Cập nhật Transactions (xóa cũ thêm mới trong mock state)
        const filteredTxs = transactions.filter(t => t.use_case_id !== editingUCId);
        const newTXs = ucTransactions
          .filter(t => t.name.trim() !== '')
          .map((t, idx) => ({
            id: t.id.startsWith('temp-') ? 'tx-' + Math.random() : t.id,
            use_case_id: editingUCId,
            code: t.code || `TX-0${idx + 1}`,
            name: t.name.trim(),
            description: t.description.trim()
          }));
        
        setTransactions([...filteredTxs, ...newTXs]);
        setModalSuccess('Đã cập nhật thông tin Use Case mô phỏng!');

        setTimeout(() => {
          setIsEditModalOpen(false);
          setEditingUCId('');
        }, 1000);
        return;
      }

      // Xử lý thực tế trên Supabase DB
      // 1. Cập nhật bảng Use Cases
      const { error: ucError } = await supabase
        .from('use_cases')
        .update({
          code: ucCode.trim(),
          name: ucName.trim(),
          description: ucDescription.trim(),
          notes: ucNotes.trim(),
          actors: ucActors.trim(),
          ba_email: ucBA || null,
          dev_email: ucDev || null,
          difficulty: ucDifficulty,
          bmt: ucBMT,
          status_ba: ucStatusBA || null,
          status_dev: ucStatusDev || null,
          status_test: ucStatusTest || null,
          project_id: ucProjectId || null,
          sprint_id: ucSprintId || null,
        })
        .eq('id', editingUCId);

      if (ucError) throw ucError;

      // 2. Xóa các transactions cũ trực thuộc
      const { error: deleteTxError } = await supabase
        .from('use_case_transactions')
        .delete()
        .eq('use_case_id', editingUCId);

      if (deleteTxError) throw deleteTxError;

      // 3. Thêm mới danh sách transactions cập nhật
      const txsToInsert = ucTransactions
        .filter(t => t.name.trim() !== '')
        .map(t => ({
          use_case_id: editingUCId,
          code: t.code.trim() || 'TX-01',
          name: t.name.trim(),
          description: t.description.trim()
        }));

      if (txsToInsert.length > 0) {
        const { error: insertTxError } = await supabase
          .from('use_case_transactions')
          .insert(txsToInsert);
        if (insertTxError) throw insertTxError;
      }

      setModalSuccess('Cập nhật Use Case thành công!');
      await fetchUseCasesAndTransactions();

      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditingUCId('');
      }, 1000);
    } catch (err) {
      setModalError(err.message || 'Lỗi khi cập nhật dữ liệu.');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Xóa Use Case
  const handleDeleteUseCase = async (id, code, name) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa Use Case "${code} — ${name}" không? Toàn bộ các Transaction trực thuộc sẽ bị xóa theo.`)) {
      return;
    }

    try {
      if (!isSupabaseConfigured) {
        // Chế độ xem trước
        setUseCases(prev => prev.filter(u => u.id !== id));
        setTransactions(prev => prev.filter(t => t.use_case_id !== id));
        alert('Xóa Use Case mô phỏng thành công!');
        return;
      }

      // Xử lý thực tế trên DB (sẽ tự động cascade xóa transactions do cấu trúc foreign key ON DELETE CASCADE)
      const { error } = await supabase
        .from('use_cases')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Xóa Use Case thành công!');
      await fetchUseCasesAndTransactions();
    } catch (err) {
      alert('Không thể xóa Use Case: ' + err.message);
    }
  };

  // =========================================================================
  // XỬ LÝ NHẬP/XUẤT FILE EXCEL (.XLSX)
  // =========================================================================

  // Tải file Excel mẫu
  const handleDownloadTemplate = () => {
    // Tiêu đề các cột
    const headers = [
      "Mã Use Case",
      "Tên Use Case",
      "Mô tả Use Case",
      "Ghi chú",
      "Tác nhân liên quan",
      "Email BA phụ trách",
      "Email Dev phụ trách",
      "Đánh giá mức độ khó",
      "Đánh giá BMT",
      "Trạng thái BA",
      "Trạng thái DEV",
      "Trạng thái TEST",
      "Danh sách Transactions",
      "Mã Dự Án",
      "Mã Sprint"
    ];

    // Dòng dữ liệu mẫu để hướng dẫn người dùng
    const sampleRows = [
      [
        "UC-01",
        "Đăng nhập hệ thống",
        "Người dùng thực hiện đăng nhập vào hệ thống PROJEXA bằng tài khoản và mật khẩu được cấp.",
        "Tự động khóa tài khoản sau 5 lần nhập sai mật khẩu liên tiếp.",
        "Người dùng, Hệ thống xác thực",
        "ba@company.com",
        "dev@company.com",
        "Đơn giản",
        "T",
        "Hoàn thành",
        "Đang thực hiện",
        "Chưa bắt đầu",
        "TX-01: Nhập địa chỉ email và mật khẩu, TX-02: Gửi thông tin đăng nhập xác thực, TX-03: Điều hướng người dùng tới Dashboard",
        "PROJ-01",
        "S01"
      ],
      [
        "UC-02",
        "Xem sơ đồ cây thành viên",
        "Quản trị viên hiển thị danh sách toàn bộ thành viên dự án dưới dạng sơ đồ tổ chức dạng cây.",
        "Yêu cầu xử lý chống tự báo cáo cho chính bản thân và chống báo cáo xoay vòng.",
        "Admin, Manager",
        "",
        "dev@company.com",
        "Trung bình",
        "B",
        "Đang thực hiện",
        "Chưa bắt đầu",
        "",
        "TX-01: Tải dữ liệu profiles từ DB, TX-02: Phân tích cấu trúc đệ quy, TX-03: Hiển thị các symbol connector ├── thụt lề trực quan",
        "",
        ""
      ]
    ];

    const data = [headers, ...sampleRows];

    // Tạo Worksheet và Workbook
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Điều chỉnh độ rộng của các cột trong Excel cho đẹp
    const wscols = [
      { wch: 15 }, // Mã UC
      { wch: 25 }, // Tên UC
      { wch: 45 }, // Mô tả
      { wch: 30 }, // Ghi chú
      { wch: 30 }, // Tác nhân liên quan
      { wch: 28 }, // BA email
      { wch: 28 }, // Dev email
      { wch: 20 }, // Độ khó
      { wch: 15 }, // BMT
      { wch: 22 }, // Trạng thái BA
      { wch: 22 }, // Trạng thái DEV
      { wch: 22 }, // Trạng thái TEST
      { wch: 60 }, // Transactions
      { wch: 15 }, // Mã Dự Án
      { wch: 15 }, // Mã Sprint
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PROJEXA Use Cases");

    // Xuất tệp tải xuống
    XLSX.writeFile(wb, "PROJEXA_Template_Use_Cases.xlsx");
  };

  // Đọc và Import dữ liệu từ file Excel tải lên
  // Bóc tách dữ liệu từ file Excel
  const processExcelFile = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Đọc dữ liệu thô dạng mảng
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (rows.length < 2) {
          alert('Tệp Excel không có dữ liệu để import!');
          return;
        }

        // Lọc bỏ dòng đầu (Header), chỉ lấy các dòng chứa dữ liệu
        const dataRows = rows.slice(1).filter(r => r[0] || r[1]); // Phải có ít nhất Mã UC hoặc Tên UC

        if (dataRows.length === 0) {
          alert('Không tìm thấy dòng dữ liệu nào!');
          return;
        }

        const previewList = [];

        for (const row of dataRows) {
          const code = String(row[0] || '').trim();
          const name = String(row[1] || '').trim();
          const description = String(row[2] || '').trim();
          const notes = String(row[3] || '').trim();
          const actors = String(row[4] || '').trim();
          const ba_email = String(row[5] || '').trim().toLowerCase();
          const dev_email = String(row[6] || '').trim().toLowerCase();
          const status_ba = String(row[9] || '').trim();
          const status_dev = String(row[10] || '').trim();
          const status_test = String(row[11] || '').trim();
          const projectCode = String(row[13] || '').trim().toUpperCase();
          const sprintCode = String(row[14] || '').trim().toUpperCase();
          const matchedProject = projectCode ? projects.find(p => p.code.toUpperCase() === projectCode) : null;
          const matchedSprint = sprintCode && matchedProject
            ? allSprints.find(s => s.project_id === matchedProject.id && s.code.toUpperCase() === sprintCode)
            : null;

          let difficulty = String(row[7] || '').trim();
          if (!difficulty) {
            difficulty = 'Đơn giản';
          }
          let bmt = String(row[8] || '').trim().toUpperCase();
          if (!bmt) {
            bmt = 'B';
          }

          const VALID_STATUSES = ['Hoàn thành', 'Đang thực hiện', 'Bị chặn', 'Chưa bắt đầu', ''];
          const validationErrors = [];
          if (!code) {
            validationErrors.push('Mã Use Case không được để trống.');
          }
          if (!name) {
            validationErrors.push('Tên Use Case không được để trống.');
          }
          if (difficulty && !['Đơn giản', 'Trung bình', 'Phức tạp'].includes(difficulty)) {
            validationErrors.push(`Độ khó "${difficulty}" không hợp lệ (Phải là Đơn giản, Trung bình, Phức tạp).`);
          }
          if (bmt && !['B', 'M', 'T'].includes(bmt)) {
            validationErrors.push(`Đánh giá BMT "${bmt}" không hợp lệ (Phải là B, M, T).`);
          }
          if (status_ba && !VALID_STATUSES.includes(status_ba)) {
            validationErrors.push(`Trạng thái BA "${status_ba}" không hợp lệ.`);
          }
          if (status_dev && !VALID_STATUSES.includes(status_dev)) {
            validationErrors.push(`Trạng thái DEV "${status_dev}" không hợp lệ.`);
          }
          if (status_test && !VALID_STATUSES.includes(status_test)) {
            validationErrors.push(`Trạng thái TEST "${status_test}" không hợp lệ.`);
          }
          // Kiểm tra email BA có tồn tại trong hệ thống không
          if (ba_email && !profiles.some(p => p.email.toLowerCase() === ba_email)) {
            validationErrors.push(`Email BA phụ trách "${ba_email}" không tìm thấy trong hệ thống.`);
          }

          // Bóc tách transactions trực thuộc
          const txString = String(row[12] || '').trim();
          const txList = [];
          if (txString) {
            const txTokens = txString.split(/[,;]+/);
            txTokens.forEach((token, idx) => {
              const cleanedToken = token.trim();
              if (cleanedToken) {
                let txCode = `TX-0${idx + 1}`;
                let txName = cleanedToken;
                
                if (cleanedToken.includes(':')) {
                  const parts = cleanedToken.split(':');
                  txCode = parts[0].trim();
                  txName = parts.slice(1).join(':').trim();
                } else if (cleanedToken.includes('-')) {
                  const parts = cleanedToken.split('-');
                  txCode = parts[0].trim();
                  txName = parts.slice(1).join('-').trim();
                }

                txList.push({
                  code: txCode,
                  name: txName,
                  description: ''
                });
              }
            });
          }

          // Kiểm tra xem mã Use Case này đã tồn tại trong DB/State chưa
          const exists = useCases.some(u => u.code.toLowerCase() === code.toLowerCase());
          let status = 'new'; // 'new', 'overwrite', 'invalid'
          if (validationErrors.length > 0) {
            status = 'invalid';
          } else if (exists) {
            status = 'overwrite';
          }

          previewList.push({
            id: 'preview-' + Math.random().toString(36).substring(2, 9),
            code,
            name,
            description,
            notes,
            actors,
            ba_email,
            dev_email,
            difficulty,
            bmt,
            status_ba,
            status_dev,
            status_test,
            project_id: matchedProject?.id || null,
            sprint_id: matchedSprint?.id || null,
            transactions: txList,
            status,
            validationErrors
          });
        }

        setExpandedPreviewRows({});
        setImportPreviewData(previewList);
        setIsImportPreviewModalOpen(true);
      } catch (err) {
        alert('Lỗi khi bóc tách tệp Excel: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    processExcelFile(file);
    e.target.value = '';
  };

  // Lưu danh sách Import sau khi xác nhận
  const handleConfirmImport = async () => {
    const validRecords = importPreviewData.filter(r => r.status !== 'invalid');
    if (validRecords.length === 0) {
      alert('Không có bản ghi hợp lệ nào để lưu!');
      return;
    }

    setIsImportSaving(true);
    try {
      if (!isSupabaseConfigured) {
        // Chế độ Xem trước: Cập nhật state
        setUseCases(prev => {
          // Lọc bỏ những bản ghi cũ bị trùng mã với các bản ghi mới chuẩn bị import
          const filtered = prev.filter(p => !validRecords.some(v => v.code.toLowerCase() === p.code.toLowerCase()));
          const formattedValid = validRecords.map(v => ({
            id: v.id,
            code: v.code,
            name: v.name,
            description: v.description,
            notes: v.notes,
            actors: v.actors,
            ba_email: v.ba_email || '',
            dev_email: v.dev_email || '',
            difficulty: v.difficulty,
            bmt: v.bmt,
            status_ba: v.status_ba || '',
            status_dev: v.status_dev || '',
            status_test: v.status_test || '',
            project_id: v.project_id || null,
            sprint_id: v.sprint_id || null,
            created_at: new Date().toISOString()
          }));
          return [...filtered, ...formattedValid].sort((a, b) => a.code.localeCompare(b.code));
        });

        setTransactions(prev => {
          // Lọc bỏ những transaction của các UC cũ bị trùng mã ghi đè
          const filtered = prev.filter(t => !validRecords.some(v => v.code.toLowerCase() === getUseCaseCodeById(t.use_case_id)?.toLowerCase()));
          const newTXs = [];
          validRecords.forEach(v => {
            v.transactions.forEach(t => {
              newTXs.push({
                id: 'tx-' + Math.random(),
                use_case_id: v.id,
                code: t.code,
                name: t.name,
                description: t.description || ''
              });
            });
          });
          return [...filtered, ...newTXs];
        });

        alert(`Đã import thành công ${validRecords.length} Use Cases ở chế độ xem trước!`);
        setIsImportPreviewModalOpen(false);
        setImportPreviewData([]);
        return;
      }

      // Chế độ Supabase thực tế
      let successCount = 0;
      for (const uc of validRecords) {
        // 1. Upsert Use Case dựa trên mã code unique
        const { data: upsertedUC, error: ucError } = await supabase
          .from('use_cases')
          .upsert({
            code: uc.code,
            name: uc.name,
            description: uc.description,
            notes: uc.notes,
            actors: uc.actors,
            ba_email: uc.ba_email || null,
            dev_email: uc.dev_email || null,
            difficulty: uc.difficulty,
            bmt: uc.bmt,
            status_ba: uc.status_ba || null,
            status_dev: uc.status_dev || null,
            status_test: uc.status_test || null,
            project_id: uc.project_id || null,
            sprint_id: uc.sprint_id || null,
          }, {
            onConflict: 'code'
          })
          .select()
          .single();

        if (!ucError && upsertedUC) {
          successCount++;

          // 2. Xóa các transactions cũ trực thuộc để ghi đè dữ liệu mới
          await supabase
            .from('use_case_transactions')
            .delete()
            .eq('use_case_id', upsertedUC.id);

          // 3. Chèn các transactions mới của UC này
          const txsToInsert = uc.transactions.map(t => ({
            use_case_id: upsertedUC.id,
            code: t.code,
            name: t.name,
            description: t.description || ''
          }));

          if (txsToInsert.length > 0) {
            await supabase
              .from('use_case_transactions')
              .insert(txsToInsert);
          }
        }
      }

      alert(`Đã import thành công ${successCount}/${validRecords.length} Use Cases vào Supabase!`);
      await fetchUseCasesAndTransactions();
      setIsImportPreviewModalOpen(false);
      setImportPreviewData([]);
    } catch (err) {
      alert('Gặp lỗi khi lưu dữ liệu import: ' + err.message);
    } finally {
      setIsImportSaving(false);
    }
  };

  // Trình xử lý kéo thả tệp Excel
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setUploadFile(file);
      } else {
        alert('Vui lòng chỉ tải lên tệp Excel (.xlsx hoặc .xls)!');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setUploadFile(file);
      } else {
        alert('Vui lòng chỉ tải lên tệp Excel (.xlsx hoặc .xls)!');
      }
    }
  };

  const handleProcessUploadFile = () => {
    if (!uploadFile) return;
    setIsUploadModalOpen(false);
    processExcelFile(uploadFile);
  };

  const handleToggleUseCaseExpand = (id) => {
    setExpandedUseCases(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleToggleSelectUseCase = (id, e) => {
    e.stopPropagation();
    setSelectedUseCases(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleToggleSelectAll = (e) => {
    const isChecked = e.target.checked;
    if (isChecked) {
      const newSelections = {};
      filteredUseCases.forEach(uc => {
        newSelections[uc.id] = true;
      });
      setSelectedUseCases(newSelections);
    } else {
      setSelectedUseCases({});
    }
  };

  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(selectedUseCases).filter(id => selectedUseCases[id]);
    if (selectedIds.length === 0) return;

    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} kịch bản Use Case đã chọn không? Toàn bộ các Transaction trực thuộc sẽ bị xóa theo.`)) {
      return;
    }

    try {
      setLoading(true);
      if (!isSupabaseConfigured) {
        // Chế độ xem trước
        setUseCases(prev => prev.filter(u => !selectedIds.includes(u.id)));
        setTransactions(prev => prev.filter(t => !selectedIds.includes(t.use_case_id)));
        setSelectedUseCases({});
        alert(`Đã xóa ${selectedIds.length} Use Cases mô phỏng thành công!`);
        return;
      }

      // Xử lý thực tế trên DB (sẽ tự động cascade xóa do foreign key ON DELETE CASCADE)
      const { error } = await supabase
        .from('use_cases')
        .delete()
        .in('id', selectedIds);

      if (error) throw error;

      setSelectedUseCases({});
      alert(`Đã xóa ${selectedIds.length} Use Cases thành công!`);
      await fetchUseCasesAndTransactions();
    } catch (err) {
      alert('Không thể xóa hàng loạt Use Cases: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getUseCaseCodeById = (id) => {
    const uc = useCases.find(u => u.id === id);
    return uc ? uc.code : '';
  };

  const getDifficultyBadgeStyle = (diff) => {
    switch (diff) {
      case 'Đơn giản': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      case 'Trung bình': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'Phức tạp': return 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20';
    }
  };

  const getBMTBadgeStyle = (bmtVal) => {
    switch (bmtVal) {
      case 'B': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20';
      case 'M': return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20';
      case 'T': return 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/20';
      default: return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20';
    }
  };

  const handleColResizeStart = (col, e) => {
    e.preventDefault();
    resizingCol.current = col;
    resizeStartX.current = e.clientX;
    resizeStartW.current = colWidths[col];
    const onMove = (ev) => {
      const diff = ev.clientX - resizeStartX.current;
      setColWidths(prev => ({ ...prev, [resizingCol.current]: Math.max(60, resizeStartW.current + diff) }));
    };
    const onUp = () => {
      resizingCol.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Hoàn thành':      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'Đang thực hiện':  return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'Bị chặn':         return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'Chưa bắt đầu':   return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20';
      default: return '';
    }
  };

  const COLS = [
    { key: 'code',            label: 'Mã Use Case',          locked: true },
    { key: 'name',            label: 'Tên Use Case',          locked: true },
    { key: 'description',     label: 'Mô tả nghiệp vụ' },
    { key: 'difficulty',      label: 'Độ khó' },
    { key: 'bmt',             label: 'Phân loại BMT' },
    { key: 'ba',              label: 'BA phụ trách' },
    { key: 'dev',             label: 'Dev phụ trách' },
    { key: 'status_ba',       label: 'Trạng thái BA' },
    { key: 'status_dev',      label: 'Trạng thái DEV' },
    { key: 'status_test',     label: 'Trạng thái TEST' },
    { key: 'reviewed_at',     label: 'Ngày rà soát BA' },
    { key: 'docs_updated_at', label: 'Cập nhật tài liệu' },
    { key: 'dev_completed_at',label: 'Hoàn thành lập trình' },
    { key: 'doc_reviewed_at', label: 'Review tài liệu' },
  ];

  const tableMinWidth = 40 + 96 + COLS
    .filter(c => visibleCols[c.key])
    .reduce((sum, c) => sum + (colWidths[c.key] || 100), 0);

  // Dự án hiển thị trong bộ lọc: Admin/Manager thấy tất cả, các role khác chỉ thấy dự án của mình
  const visibleProjects = isManagerOrAdmin || myProjectIds.size === 0
    ? projects
    : projects.filter(p => myProjectIds.has(p.id));

  // Lọc và Sắp xếp dữ liệu kịch bản Use Case
  const filteredUseCases = useCases
    .filter(u => {
      const matchesSearch =
        u.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.description && u.description.toLowerCase().includes(searchQuery.toLowerCase()));

      // Non-admin/manager chỉ thấy UC thuộc dự án mình tham gia
      const matchesMembership = isManagerOrAdmin || myProjectIds.size === 0 || myProjectIds.has(u.project_id);
      const matchesDifficulty = filterDifficulty === '' || u.difficulty === filterDifficulty;
      const matchesBMT = filterBMT === '' || u.bmt === filterBMT;
      const matchesBA = filterBA === '' || u.ba_email === filterBA;
      const matchesProject = filterProject === '' || u.project_id === filterProject;

      return matchesSearch && matchesMembership && matchesDifficulty && matchesBMT && matchesBA && matchesProject;
    })
    .sort((a, b) => {
      let valA = a[sortBy] || '';
      let valB = b[sortBy] || '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      // Xử lý Độ Khó theo trọng số ưu tiên: Đơn giản (1) < Trung bình (2) < Phức tạp (3)
      if (sortBy === 'difficulty') {
        const order = { 'Đơn giản': 1, 'Trung bình': 2, 'Phức tạp': 3 };
        valA = order[a.difficulty] || 0;
        valB = order[b.difficulty] || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // Reset về trang 1 khi filter / search / sort thay đổi
  useEffect(() => { setUcPage(1); }, [searchQuery, filterDifficulty, filterBMT, filterBA, filterProject, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredUseCases.length / ucPageSize));
  const paginatedUseCases = filteredUseCases.slice((ucPage - 1) * ucPageSize, ucPage * ucPageSize);

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 dark:from-white dark:via-slate-100 dark:to-indigo-100 bg-clip-text text-transparent">
              Danh sách Use Case nghiệp vụ
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Phân tích các kịch bản nghiệp vụ (Use Case), mức độ phức tạp, thuộc tính BMT và danh sách giao dịch (Transactions).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Tải Excel mẫu - luôn hiển thị */}
            <button
              onClick={handleDownloadTemplate}
              className="px-4.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              title="Tải tệp Excel mẫu để điền Use Cases"
            >
              <Download className="h-4 w-4" />
              Tải Excel mẫu
            </button>

            {/* Nút Nhập Excel - chỉ hiển thị khi có quyền tạo */}
            {canCreate && (
              <button
                onClick={() => {
                  setUploadFile(null);
                  setIsUploadModalOpen(true);
                }}
                className="px-4.5 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-950/40 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs inline-flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm bg-transparent"
              >
                <Upload className="h-4 w-4" />
                Nhập từ Excel
              </button>
            )}

            {/* Thêm Use Case mới - chỉ hiển thị khi có quyền tạo */}
            {canCreate && (
              <button
                onClick={handleOpenAddModal}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-505 text-white font-bold text-xs shadow-lg shadow-indigo-600/10 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0 animate-fade-in"
              >
                <Plus className="h-4 w-4" />
                Tạo Use Case mới
              </button>
            )}

            {/* Nút Xóa hàng loạt - chỉ hiển thị khi có quyền xóa */}
            {canDelete && Object.values(selectedUseCases).some(Boolean) && (
              <button
                onClick={handleBulkDelete}
                className="px-4.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/10 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0 animate-fade-in"
                title="Xóa đồng loạt các bản ghi đã chọn"
              >
                <Trash2 className="h-4 w-4" />
                Xóa đã chọn ({Object.values(selectedUseCases).filter(Boolean).length})
              </button>
            )}
          </div>
        </div>

        {/* Action bar (Search & Filters) */}
        <div className="flex flex-col gap-3 bg-white dark:bg-slate-900/35 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm dark:shadow-none">

          {/* Hàng 1: Bộ lọc Dự án — nổi bật */}
          {visibleProjects.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-600/10 border border-indigo-200 dark:border-indigo-500/30">
              <FolderKanban className="h-4 w-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider shrink-0">Dự án:</span>
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="flex-1 max-w-sm px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-500/40 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer appearance-none shadow-sm"
              >
                <option value="">Tất cả dự án</option>
                {visibleProjects.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.name}
                  </option>
                ))}
              </select>
              {filterProject && (
                <button
                  onClick={() => setFilterProject('')}
                  className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors cursor-pointer shrink-0"
                  title="Bỏ lọc dự án"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Hàng 2: Search + các bộ lọc phụ */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="relative w-full lg:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Tìm mã UC, tên hoặc mô tả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto select-none">
            {/* Lọc Độ khó */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Độ khó:</span>
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none min-w-[110px]"
              >
                <option value="" className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">Tất cả</option>
                <option value="Đơn giản" className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">Đơn giản</option>
                <option value="Trung bình" className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">Trung bình</option>
                <option value="Phức tạp" className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">Phức tạp</option>
              </select>
            </div>

            {/* Lọc BMT */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">BMT:</span>
              <select
                value={filterBMT}
                onChange={(e) => setFilterBMT(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none min-w-[90px]"
              >
                <option value="" className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">Tất cả</option>
                <option value="B" className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">B (Báo cáo)</option>
                <option value="M" className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">M (Nghiệp vụ)</option>
                <option value="T" className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">T (Giao dịch)</option>
              </select>
            </div>

            {/* Lọc BA phụ trách */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">BA:</span>
              <select
                value={filterBA}
                onChange={(e) => setFilterBA(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none min-w-[140px]"
              >
                <option value="">Tất cả BA</option>
                {Array.from(new Set(useCases.map(u => u.ba_email).filter(Boolean))).map(email => {
                  const p = profiles.find(p => p.email === email);
                  return (
                    <option key={email} value={email} className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                      {p ? p.full_name : email}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Sắp xếp */}
            <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-3">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none min-w-[125px]"
              >
                <option value="code" className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">Mã Use Case</option>
                <option value="name" className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">Tên kịch bản</option>
                <option value="difficulty" className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">Mức độ khó</option>
                <option value="bmt" className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">Đánh giá BMT</option>
                <option value="created_at" className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">Ngày tạo</option>
              </select>
              <button
                type="button"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/65 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                title={sortOrder === 'asc' ? 'Đang sắp xếp Tăng dần - Click để Giảm dần' : 'Đang sắp xếp Giảm dần - Click để Tăng dần'}
              >
                <ArrowUpDown className={`h-3.5 w-3.5 transition-transform duration-300 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
              </button>
            </div>
            
            {/* Nút hiển thị/ẩn cột */}
            <div className="relative ml-auto lg:ml-0">
              <button
                type="button"
                onClick={() => setShowColPanel(p => !p)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/65 hover:bg-indigo-50 dark:hover:bg-indigo-600/10 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/40 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer text-xs font-bold uppercase tracking-wider shrink-0"
                title="Ẩn / hiện cột"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Cột
              </button>
              {showColPanel && (
                <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl dark:shadow-2xl p-3 min-w-[200px] animate-fade-in">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Hiển thị cột</p>
                  <div className="space-y-0.5">
                    {COLS.map(c => (
                      <label key={c.key} className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${c.locked ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <input
                          type="checkbox"
                          checked={visibleCols[c.key]}
                          disabled={c.locked}
                          onChange={() => !c.locked && setVisibleCols(prev => ({ ...prev, [c.key]: !prev[c.key] }))}
                          className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium select-none">{c.label}</span>
                        {c.locked && <span className="text-[9px] text-slate-400 ml-auto">Bắt buộc</span>}
                      </label>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                      onClick={() => setShowColPanel(false)}
                      className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Tổng số hiển thị: <span className="font-bold text-indigo-600 dark:text-indigo-400">{filteredUseCases.length}</span> Use Cases
            </div>
          </div>
          </div>
        </div>

        {/* Error alert with retry option */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs p-4.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in select-none">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-5 w-5 shrink-0 text-rose-500" />
              <span className="font-semibold leading-relaxed">{error}</span>
            </div>
            <button
              onClick={fetchUseCasesAndTransactions}
              className="px-4.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/15 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
            >
              Thử tải lại ngay
            </button>
          </div>
        )}

        {/* Use Cases Table */}
        <div className="glass-panel rounded-2xl overflow-hidden shadow-sm dark:shadow-xl border border-slate-200 dark:border-slate-800/60">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              <span className="text-xs text-slate-500">Đang bóc tách và đồng bộ Use Cases...</span>
            </div>
          ) : filteredUseCases.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              Không tìm thấy kịch bản Use Case nào khớp với điều kiện tìm kiếm.
            </div>
          ) : (
            <>
            <div className="overflow-x-auto">
              <table className="text-left border-collapse" style={{ minWidth: tableMinWidth, tableLayout: 'fixed' }}>
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
                    <th className="px-4 py-3 text-center select-none" style={{ width: 40, minWidth: 40 }}>
                      <input
                        type="checkbox"
                        checked={filteredUseCases.length > 0 && filteredUseCases.every(uc => selectedUseCases[uc.id])}
                        onChange={handleToggleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    {COLS.filter(c => visibleCols[c.key]).map(({ key, label }) => (
                      <th key={key} className="relative px-4 py-3 overflow-hidden whitespace-nowrap" style={{ width: colWidths[key], minWidth: 60 }}>
                        <span className="block truncate text-center pr-3">{label}</span>
                        <div
                          className="absolute inset-y-0 right-0 w-3 cursor-col-resize z-10 flex items-stretch justify-end"
                          onMouseDown={(e) => handleColResizeStart(key, e)}
                        >
                          <div className="w-[2px] h-full bg-slate-200 dark:bg-slate-700 hover:bg-indigo-400 transition-colors" />
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right" style={{ width: 96, minWidth: 96 }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {paginatedUseCases.map((uc) => {
                    const txCount = transactions.filter(t => t.use_case_id === uc.id).length;
                    const isExpanded = !!expandedUseCases[uc.id];
                    return (
                      <Fragment key={uc.id}>
                        <tr
                          onClick={() => handleToggleUseCaseExpand(uc.id)}
                          className="hover:bg-slate-100/40 dark:hover:bg-slate-900/30 transition-colors group cursor-pointer"
                        >
                          <td className="px-4 py-3 text-center select-none" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={!!selectedUseCases[uc.id]}
                              onChange={(e) => handleToggleSelectUseCase(uc.id, e)}
                              className="w-4 h-4 rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>
                          {/* code — always visible (locked) */}
                          <td className="px-4 py-3 font-bold text-sm text-indigo-600 dark:text-indigo-400 select-all overflow-hidden" style={{ width: colWidths.code }}>
                            <div className="flex items-center gap-1.5 truncate">
                              {txCount > 0 ? (
                                isExpanded ? (
                                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                                )
                              ) : (
                                <span className="w-3.5 h-3.5 shrink-0" />
                              )}
                              <span className="truncate">{uc.code}</span>
                            </div>
                          </td>
                          {/* name — always visible (locked) */}
                          <td className="px-4 py-3 overflow-hidden" style={{ width: colWidths.name }}>
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block truncate group-hover:text-slate-950 dark:group-hover:text-white transition-colors">
                              {uc.name}
                            </span>
                          </td>
                          {visibleCols.description && (
                            <td className="px-4 py-3 overflow-hidden" style={{ width: colWidths.description }}>
                              <span className="text-xs text-slate-500 dark:text-slate-400 truncate leading-relaxed block">
                                {uc.description || <span className="text-slate-300 dark:text-slate-700 italic">—</span>}
                              </span>
                            </td>
                          )}
                          {visibleCols.difficulty && (
                            <td className="px-4 py-3 text-center select-none" style={{ width: colWidths.difficulty }}>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 inline-block ${getDifficultyBadgeStyle(uc.difficulty)}`}>
                                {uc.difficulty}
                              </span>
                            </td>
                          )}
                          {visibleCols.bmt && (
                            <td className="px-4 py-3 text-center select-none" style={{ width: colWidths.bmt }}>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 inline-block ${getBMTBadgeStyle(uc.bmt)}`} title={
                                uc.bmt === 'B' ? 'Báo cáo (Report)' : uc.bmt === 'M' ? 'Nghiệp vụ (Master)' : 'Giao dịch (Transaction)'
                              }>
                                {uc.bmt}
                              </span>
                            </td>
                          )}
                          {visibleCols.ba && (
                            <td className="px-4 py-3 overflow-hidden" style={{ width: colWidths.ba }}>
                              {(() => {
                                const p = profiles.find(p => p.email === uc.ba_email);
                                return p ? (
                                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate block">{p.full_name}</span>
                                ) : uc.ba_email ? (
                                  <span className="text-xs text-slate-400 dark:text-slate-500 font-mono truncate block">{uc.ba_email}</span>
                                ) : <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>;
                              })()}
                            </td>
                          )}
                          {visibleCols.dev && (
                            <td className="px-4 py-3 overflow-hidden" style={{ width: colWidths.dev }}>
                              {(() => {
                                const p = profiles.find(p => p.email === uc.dev_email);
                                return p ? (
                                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate block">{p.full_name}</span>
                                ) : uc.dev_email ? (
                                  <span className="text-xs text-slate-400 dark:text-slate-500 font-mono truncate block">{uc.dev_email}</span>
                                ) : <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>;
                              })()}
                            </td>
                          )}
                          {[
                            { key: 'status_ba',   val: uc.status_ba,   w: colWidths.status_ba },
                            { key: 'status_dev',  val: uc.status_dev,  w: colWidths.status_dev },
                            { key: 'status_test', val: uc.status_test, w: colWidths.status_test },
                          ].filter(s => visibleCols[s.key]).map(({ key, val, w }) => (
                            <td key={key} className="px-4 py-3 text-center select-none whitespace-nowrap" style={{ width: w }}>
                              {val ? (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border inline-block ${getStatusBadge(val)}`}>
                                  {val}
                                </span>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>
                              )}
                            </td>
                          ))}
                          {[
                            { key: 'reviewed_at',      textCls: 'text-violet-600 dark:text-violet-400' },
                            { key: 'docs_updated_at',  textCls: 'text-sky-600 dark:text-sky-400' },
                            { key: 'dev_completed_at', textCls: 'text-emerald-600 dark:text-emerald-400' },
                            { key: 'doc_reviewed_at',  textCls: 'text-rose-600 dark:text-rose-400' },
                          ].filter(s => visibleCols[s.key]).map(s => {
                            const at = ucStatusMap[uc.id]?.[s.key] || uc[s.key] || null;
                            return (
                              <td key={s.key} className="px-4 py-3 text-center select-none overflow-hidden" style={{ width: colWidths[s.key] }}>
                                {at ? (
                                  <span className={`text-[10px] font-semibold ${s.textCls}`}>
                                    {new Date(at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenViewModal(uc)}
                                className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer"
                                title="Xem chi tiết"
                              >
                                <Eye className="h-4.5 w-4.5" />
                              </button>
  
                              {canUpdate && (
                                <button
                                  onClick={() => handleOpenEditModal(uc)}
                                  className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer"
                                  title="Chỉnh sửa kịch bản"
                                >
                                  <Edit2 className="h-4.5 w-4.5" />
                                </button>
                              )}
  
                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteUseCase(uc.id, uc.code, uc.name)}
                                  className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                                  title="Xóa kịch bản"
                                >
                                  <Trash2 className="h-4.5 w-4.5" />
                                </button>
                              )}
                            </div>

                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/30 dark:bg-slate-950/10">
                            <td colSpan={2 + COLS.filter(c => visibleCols[c.key]).length} className="px-8 py-3.5 border-t border-b border-slate-200/50 dark:border-slate-800/50">
                              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-inner bg-white dark:bg-slate-900/30 w-full p-4 space-y-4">
                                
                                {/* Thông tin chi tiết Use Case */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
                                  <div className="space-y-1.5">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mô tả nghiệp vụ Use Case</span>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/40 select-text">
                                      {uc.description || 'Chưa cung cấp mô tả nghiệp vụ.'}
                                    </p>
                                  </div>
                                  <div className="space-y-1.5">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ghi chú & Ràng buộc nghiệp vụ</span>
                                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed bg-amber-500/5 border border-amber-500/10 dark:border-amber-500/20 p-3 rounded-xl select-text">
                                      {uc.notes || 'Không có ghi chú ràng buộc đặc thù.'}
                                    </p>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 select-none">
                                    <Activity className="h-3.5 w-3.5 text-indigo-500" />
                                    Danh sách Transactions trực thuộc ({txCount})
                                  </h4>
                                
                                {txCount > 0 ? (
                                  <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                                    {transactions.filter(t => t.use_case_id === uc.id).map(tx => (
                                      <div key={tx.id} className="p-3 bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800/85 rounded-xl flex items-start gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors w-full">
                                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 uppercase shrink-0">
                                          {tx.code}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                          <span className="font-bold text-xs text-slate-800 dark:text-slate-300 block" title={tx.name}>{tx.name}</span>
                                          {tx.description && (
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5" title={tx.description}>{tx.description}</span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="py-6 text-center text-xs text-slate-400 italic">
                                    Chưa thiết lập bất kỳ Transaction nào cho kịch bản này.
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {filteredUseCases.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 rounded-b-2xl">
                {/* Page size selector */}
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>Hiển thị</span>
                  <select
                    value={ucPageSize}
                    onChange={e => { setUcPageSize(Number(e.target.value)); setUcPage(1); }}
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <span>bản ghi / trang</span>
                </div>

                {/* Record info + nav */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {(ucPage - 1) * ucPageSize + 1}–{Math.min(ucPage * ucPageSize, filteredUseCases.length)} / {filteredUseCases.length} Use Cases
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setUcPage(1)}
                      disabled={ucPage === 1}
                      className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Trang đầu"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setUcPage(p => Math.max(1, p - 1))}
                      disabled={ucPage === 1}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Trước
                    </button>

                    {/* Page number pills */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - ucPage) <= 1)
                      .reduce((acc, p, idx, arr) => {
                        if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((item, idx) =>
                        item === '...' ? (
                          <span key={`ellipsis-${idx}`} className="px-1 text-xs text-slate-400">…</span>
                        ) : (
                          <button
                            key={item}
                            onClick={() => setUcPage(item)}
                            className={`min-w-[28px] h-7 rounded-lg text-xs font-bold transition-colors ${
                              item === ucPage
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                            }`}
                          >
                            {item}
                          </button>
                        )
                      )
                    }

                    <button
                      onClick={() => setUcPage(p => Math.min(totalPages, p + 1))}
                      disabled={ucPage === totalPages}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Sau
                    </button>
                    <button
                      onClick={() => setUcPage(totalPages)}
                      disabled={ucPage === totalPages}
                      className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Trang cuối"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            </>
          )}
        </div>

      </div>

      {/* MODAL: VIEW USE CASE DETAIL & TRANSACTIONS */}
      {isViewModalOpen && viewUC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-500/15 backdrop-blur-md" onClick={() => setIsViewModalOpen(false)} />
          <div className="glass-panel w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative z-10 bg-white/95 dark:bg-slate-900/95 animate-scale-up">
            <button
              onClick={() => setIsViewModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-5 mb-5 select-none">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-md shrink-0">
                <FileText className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">{viewUC.code}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${getDifficultyBadgeStyle(viewUC.difficulty)}`}>
                    {viewUC.difficulty}
                  </span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${getBMTBadgeStyle(viewUC.bmt)}`}>
                    BMT: {viewUC.bmt}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 truncate mt-1">{viewUC.name}</h3>
              </div>
            </div>

            {/* Details Content */}
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mô tả nghiệp vụ Use Case</span>
                <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/45 p-3 rounded-xl border border-slate-200 dark:border-slate-800/40 leading-relaxed">
                  {viewUC.description || 'Chưa cung cấp mô tả nghiệp vụ.'}
                </p>
              </div>

              {viewUC.notes && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ghi chú & Lưu ý nghiệp vụ</span>
                  <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl leading-relaxed">
                    {viewUC.notes}
                  </p>
                </div>
              )}

              {viewUC.actors && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tác nhân liên quan</span>
                  <div className="flex flex-wrap gap-1.5">
                    {viewUC.actors.split(',').map((actor, i) => (
                      <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-medium">
                        {actor.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Transactions List table */}
              <div className="space-y-2.5 pt-2.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Danh sách Transactions trực thuộc ({
                  transactions.filter(t => t.use_case_id === viewUC.id).length
                })</span>
                
                {transactions.filter(t => t.use_case_id === viewUC.id).length > 0 ? (
                  <div className="border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-inner">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          <th className="px-4 py-2.5 w-3/12">Mã TX</th>
                          <th className="px-4 py-2.5 w-9/12">Tên hoạt động giao dịch</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900/20">
                        {transactions.filter(t => t.use_case_id === viewUC.id).map(tx => (
                          <tr key={tx.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-900/10 transition-colors">
                            <td className="px-4 py-2.5 font-bold text-slate-800 dark:text-indigo-400 select-all">{tx.code}</td>
                            <td className="px-4 py-2.5 min-w-0">
                              <span className="font-semibold text-slate-700 dark:text-slate-300 block truncate max-w-xs" title={tx.name}>{tx.name}</span>
                              {tx.description && (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate max-w-xs">{tx.description}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-400 italic">
                    Chưa thiết lập bất kỳ Transaction nào cho kịch bản này.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-slate-200 dark:border-slate-800 flex gap-3">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleOpenEditModal(viewUC);
                }}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-505 text-white text-xs font-bold shadow-lg shadow-indigo-600/10 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
              >
                <Edit2 className="h-4 w-4" />
                Chỉnh sửa kịch bản
              </button>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="py-2.5 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-655 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD USE CASE & TRANSACTIONS */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-slate-500/15 backdrop-blur-md" onClick={() => setIsAddModalOpen(false)} />
          <div className="glass-panel w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-8 relative z-10 bg-white/95 dark:bg-slate-900/95 animate-scale-up">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-5 select-none">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Thêm Use Case kịch bản mới</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">Thiết lập thông tin nghiệp vụ và Transactions</p>
              </div>
            </div>

            <form onSubmit={handleCreateUseCase} className="space-y-4" autoComplete="off">
              {modalError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs p-3.5 rounded-xl flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span className="font-semibold">{modalError}</span>
                </div>
              )}

              {modalSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs p-3.5 rounded-xl flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 animate-bounce" />
                  <span className="font-semibold">{modalSuccess}</span>
                </div>
              )}

              {/* Form Scrollable Body */}
              <div className="space-y-4 max-h-[62vh] overflow-y-auto pr-2">
                
                {/* Code & Name Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Mã Use Case <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={ucCode}
                      onChange={(e) => setUcCode(e.target.value)}
                      placeholder="Ví dụ: UC-04"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tên Use Case kịch bản <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={ucName}
                      onChange={(e) => setUcName(e.target.value)}
                      placeholder="Ví dụ: Cập nhật thông tin tài khoản"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* Description & Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Mô tả chi tiết</label>
                  <textarea
                    value={ucDescription}
                    onChange={(e) => setUcDescription(e.target.value)}
                    placeholder="Mô tả kịch bản nghiệp vụ chính của Use Case..."
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Ghi chú lưu ý</label>
                  <input
                    type="text"
                    value={ucNotes}
                    onChange={(e) => setUcNotes(e.target.value)}
                    placeholder="Các lưu ý ràng buộc về dữ liệu hoặc nghiệp vụ đặc thù..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tác nhân liên quan</label>
                  <input
                    type="text"
                    value={ucActors}
                    onChange={(e) => setUcActors(e.target.value)}
                    placeholder="Ví dụ: Người dùng, Quản trị viên, Hệ thống..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                  />
                </div>

                {/* BA & Dev Assignment */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">BA phụ trách</label>
                    <select
                      value={ucBA}
                      onChange={(e) => setUcBA(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
                    >
                      <option value="" className="bg-white dark:bg-slate-900 text-slate-400">— Không chọn —</option>
                      {profiles.map(p => (
                        <option key={p.id} value={p.email} className="bg-white dark:bg-slate-900 text-slate-800">
                          {p.full_name} ({p.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Dev phụ trách</label>
                    <input
                      type="text"
                      value={ucDev}
                      onChange={(e) => setUcDev(e.target.value)}
                      placeholder="Tên hoặc email Dev phụ trách..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* Status BA / Dev / Test */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Trạng thái BA',   val: ucStatusBA,   set: setUcStatusBA },
                    { label: 'Trạng thái DEV',  val: ucStatusDev,  set: setUcStatusDev },
                    { label: 'Trạng thái TEST', val: ucStatusTest, set: setUcStatusTest },
                  ].map(({ label, val, set }) => (
                    <div key={label}>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{label}</label>
                      <select
                        value={val}
                        onChange={(e) => set(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
                      >
                        <option value="">— Chưa xác định —</option>
                        <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                        <option value="Đang thực hiện">Đang thực hiện</option>
                        <option value="Hoàn thành">Hoàn thành</option>
                        <option value="Bị chặn">Bị chặn</option>
                      </select>
                    </div>
                  ))}
                </div>

                {/* Project & Sprint */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      <span className="flex items-center gap-1"><FolderKanban className="h-3 w-3" /> Dự án</span>
                    </label>
                    <select
                      value={ucProjectId}
                      onChange={(e) => { setUcProjectId(e.target.value); setUcSprintId(''); }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
                    >
                      <option value="">— Chưa chọn —</option>
                      {projects.map(p => <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Sprint</label>
                    <select
                      value={ucSprintId}
                      onChange={(e) => setUcSprintId(e.target.value)}
                      disabled={!ucProjectId}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">— Chưa chọn —</option>
                      {allSprints.filter(s => s.project_id === ucProjectId).map(s => <option key={s.id} value={s.id}>[{s.code}] {s.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Difficulty & BMT Dropdowns */}
                <div className="grid grid-cols-2 gap-4 select-none">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Mức độ khó</label>
                    <select
                      value={ucDifficulty}
                      onChange={(e) => setUcDifficulty(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
                    >
                      <option value="Đơn giản" className="bg-white dark:bg-slate-900 text-slate-800">Đơn giản</option>
                      <option value="Trung bình" className="bg-white dark:bg-slate-900 text-slate-800">Trung bình</option>
                      <option value="Phức tạp" className="bg-white dark:bg-slate-900 text-slate-800">Phức tạp</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Đánh giá BMT</label>
                    <select
                      value={ucBMT}
                      onChange={(e) => setUcBMT(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
                    >
                      <option value="B" className="bg-white dark:bg-slate-900 text-slate-800">B (Cơ bản/Basic)</option>
                      <option value="M" className="bg-white dark:bg-slate-900 text-slate-800">M (Trung bình/Medium)</option>
                      <option value="T" className="bg-white dark:bg-slate-900 text-slate-800">T (Phức tạp/Technical)</option>
                    </select>
                  </div>
                </div>

                {/* Transactions Sub-Form List */}
                <div className="space-y-2 pt-2.5">
                  <div className="flex items-center justify-between select-none">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Danh sách Transactions trực thuộc ({ucTransactions.length})</span>
                    <button
                      type="button"
                      onClick={handleAddFormTransaction}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <Plus className="h-3 w-3" />
                      Thêm Transaction
                    </button>
                  </div>

                  <div className="space-y-3">
                    {ucTransactions.map((tx, idx) => (
                      <div key={tx.id} className="p-3.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800/65 rounded-2xl flex items-start gap-3 relative group">
                        <div className="w-16 shrink-0">
                          <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Mã TX</span>
                          <input
                            type="text"
                            value={tx.code}
                            onChange={(e) => handleUpdateFormTransaction(tx.id, 'code', e.target.value)}
                            placeholder="TX-01"
                            className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="flex-1">
                          <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Tên Transaction kịch bản</span>
                          <input
                            type="text"
                            value={tx.name}
                            onChange={(e) => handleUpdateFormTransaction(tx.id, 'name', e.target.value)}
                            placeholder="Ví dụ: Nhập email đăng nhập"
                            className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveFormTransaction(tx.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors mt-4.5 cursor-pointer opacity-40 group-hover:opacity-100 focus:opacity-100"
                          title="Xóa dòng giao dịch này"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {ucTransactions.length === 0 && (
                      <p className="text-center text-xs text-slate-400 dark:text-slate-600 italic py-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        Chưa có Transaction — nhấn "Thêm Transaction" nếu cần.
                      </p>
                    )}
                  </div>
                </div>

              </div>

              {/* Action buttons */}
              <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex gap-3 select-none">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
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

      {/* MODAL: EDIT USE CASE & TRANSACTIONS */}
      {/* ================================================================= */}
      {/* Modal Xem Chi Tiết Use Case */}
      {/* ================================================================= */}
      {isViewModalOpen && viewUC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-slate-500/15 backdrop-blur-md" onClick={() => setIsViewModalOpen(false)} />
          <div className="glass-panel w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative z-10 bg-white/95 dark:bg-slate-900/95 animate-scale-up">
            <button
              onClick={() => setIsViewModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5 select-none">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Eye className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                  {viewUC.code} — {viewUC.name}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">Chi tiết kịch bản nghiệp vụ Use Case</p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase inline-block ${getDifficultyBadgeStyle(viewUC.difficulty)}`}>
                • {viewUC.difficulty}
              </span>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase inline-block ${getBMTBadgeStyle(viewUC.bmt)}`}>
                BMT: {viewUC.bmt} — {viewUC.bmt === 'B' ? 'Báo cáo' : viewUC.bmt === 'M' ? 'Nghiệp vụ' : 'Giao dịch'}
              </span>
              <span className="text-[10px] px-2.5 py-1 rounded-full font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                {transactions.filter(t => t.use_case_id === viewUC.id).length} Transactions
              </span>
            </div>

            {/* Scrollable body */}
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">

              {/* Mô tả */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mô tả nghiệp vụ</span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/30 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/40 select-text">
                  {viewUC.description || <span className="text-slate-400 dark:text-slate-600 italic">Chưa có mô tả</span>}
                </p>
              </div>

              {/* Ghi chú */}
              {viewUC.notes && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ghi chú lưu ý</span>
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed bg-amber-50 dark:bg-amber-950/10 p-3.5 rounded-xl border border-amber-200/60 dark:border-amber-800/30 select-text">
                    {viewUC.notes}
                  </p>
                </div>
              )}

              {/* BA & Dev phụ trách */}
              {(viewUC.ba_email || viewUC.dev_email) && (
                <div className="grid grid-cols-2 gap-3">
                  {viewUC.ba_email && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">BA phụ trách</span>
                      <div className="flex items-center gap-2 bg-violet-500/5 border border-violet-500/15 p-2.5 rounded-xl">
                        <div className="h-6 w-6 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                          <span className="text-[9px] font-black text-violet-600 dark:text-violet-400 uppercase">BA</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {profiles.find(p => p.email === viewUC.ba_email)?.full_name || viewUC.ba_email}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{viewUC.ba_email}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {viewUC.dev_email && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Dev phụ trách</span>
                      <div className="flex items-center gap-2 bg-indigo-500/5 border border-indigo-500/15 p-2.5 rounded-xl">
                        <div className="h-6 w-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                          <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase">Dev</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {viewUC.dev_email}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Danh sách Transactions */}
              {(() => {
                const relatedTxs = transactions.filter(t => t.use_case_id === viewUC.id);
                return relatedTxs.length > 0 ? (
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Danh sách Transactions ({relatedTxs.length})
                    </span>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800/40 overflow-hidden">
                      {relatedTxs.map((tx, idx) => (
                        <div key={tx.id} className="flex gap-3 p-3 bg-white dark:bg-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                          <span className="text-[10px] font-bold font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-lg shrink-0 h-fit mt-0.5">
                            {tx.code}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{tx.name}</p>
                            {tx.description && (
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">{tx.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 dark:text-slate-600 text-xs">
                    <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    Kịch bản này chưa có Transaction nào.
                  </div>
                );
              })()}

              {/* Trạng thái thực hiện UC */}
              {(() => {
                // Supabase mode: đọc từ cột use_cases (reviewed_at, docs_updated_at, dev_completed_at)
                // Mock mode: đọc từ ucStatusMap (localStorage)
                const localStatus = ucStatusMap[viewUC.id] || {};
                const statusForUC = {
                  reviewed_at:      localStatus.reviewed_at      || viewUC.reviewed_at      || null,
                  docs_updated_at:  localStatus.docs_updated_at  || viewUC.docs_updated_at  || null,
                  dev_completed_at: localStatus.dev_completed_at || viewUC.dev_completed_at || null,
                  doc_reviewed_at:  localStatus.doc_reviewed_at  || viewUC.doc_reviewed_at  || null,
                };
                const logsForUC = ucStatusLogs.filter(l => l.uc_id === viewUC.id);
                const hasAny = statusForUC.reviewed_at || statusForUC.docs_updated_at || statusForUC.dev_completed_at || statusForUC.doc_reviewed_at;
                if (!hasAny && logsForUC.length === 0 && !ucStatusLogsLoading) return null;
                return (
                  <div className="space-y-2.5 pt-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Check className="h-3 w-3" />
                      Trạng thái thực hiện
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'reviewed_at',      label: 'Rà soát',        cls: 'bg-violet-50 border-violet-200/60 dark:bg-violet-900/10 dark:border-violet-800/40', textCls: 'text-violet-600 dark:text-violet-400' },
                        { key: 'docs_updated_at',  label: 'Cập nhật tài liệu',    cls: 'bg-sky-50 border-sky-200/60 dark:bg-sky-900/10 dark:border-sky-800/40',           textCls: 'text-sky-600 dark:text-sky-400' },
                        { key: 'dev_completed_at', label: 'Lập trình',      cls: 'bg-emerald-50 border-emerald-200/60 dark:bg-emerald-900/10 dark:border-emerald-800/40', textCls: 'text-emerald-600 dark:text-emerald-400' },
                        { key: 'doc_reviewed_at',  label: 'Review tài liệu',    cls: 'bg-rose-50 border-rose-200/60 dark:bg-rose-900/10 dark:border-rose-800/40',        textCls: 'text-rose-600 dark:text-rose-400' },
                      ].map(s => {
                        const at = statusForUC[s.key];
                        return (
                          <div key={s.key} className={`p-2 rounded-xl border text-center ${at ? s.cls : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/40'}`}>
                            <div className={`text-[9px] font-bold uppercase tracking-wide mb-0.5 ${at ? s.textCls : 'text-slate-400 dark:text-slate-600'}`}>{s.label}</div>
                            <div className={`text-[10px] font-semibold ${at ? s.textCls : 'text-slate-300 dark:text-slate-700'}`}>
                              {at ? new Date(at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {ucStatusLogsLoading ? (
                      <div className="flex items-center gap-2 py-2 text-slate-400 dark:text-slate-500">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span className="text-xs">Đang tải lịch sử...</span>
                      </div>
                    ) : logsForUC.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">Lịch sử thay đổi ({logsForUC.length})</span>
                        <div className="max-h-[160px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800/40 overflow-hidden">
                          {logsForUC.map(entry => {
                            const meta = {
                              reviewed:      { label: 'Rà soát',        cls: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
                              docs_updated:  { label: 'Cập nhật tài liệu',    cls: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
                              dev_completed: { label: 'Lập trình',      cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
                              doc_reviewed:  { label: 'Review tài liệu',    cls: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
                            }[entry.status_type] || { label: entry.status_type, cls: 'bg-slate-100 text-slate-500' };
                            return (
                              <div key={entry.id} className="flex items-start gap-2 px-3 py-2 bg-white dark:bg-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${meta.cls}`}>{meta.label}</span>
                                <div className="flex-1 min-w-0">
                                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{entry.confirmed_by_name}</span>
                                  {entry.log_date && <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1.5">{entry.log_date}</span>}
                                  {entry.log_title && <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate italic mt-0.5">↳ {entry.log_title}</p>}
                                </div>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 shrink-0 mt-0.5">
                                  {new Date(entry.confirmed_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Ghi chú từ nhật ký — chỉ Manager/Admin mới thấy */}
              {isManagerOrAdmin && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Ghi chú từ Nhật ký
                    </span>
                    {!ucLogNotesLoading && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                        {ucLogNotes.length}
                      </span>
                    )}
                  </div>

                  {ucLogNotesLoading ? (
                    <div className="flex items-center gap-2 py-3 text-slate-400 dark:text-slate-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span className="text-xs">Đang tải ghi chú...</span>
                    </div>
                  ) : ucLogNotes.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-600 italic py-2">
                      Chưa có thành viên nào ghi chú về Use Case này trong nhật ký.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {ucLogNotes.map((n, idx) => (
                        <div key={`${n.log_id}-${idx}`} className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-2">
                            {n.avatar_url ? (
                              <img src={n.avatar_url} alt={n.user_name} className="h-6 w-6 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-indigo-400 to-violet-500 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                                {n.user_name.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate">{n.user_name}</span>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                                <CalendarDays className="h-3 w-3" />
                                <span>{n.log_date}</span>
                              </div>
                            </div>
                          </div>
                          {n.log_title && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-1.5 truncate">
                              Từ nhật ký: <em>{n.log_title}</em>
                            </p>
                          )}
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{n.note}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center gap-3">
              <p className="text-[10px] text-slate-400 dark:text-slate-600 font-mono">
                {viewUC.created_at ? `Tạo: ${new Date(viewUC.created_at).toLocaleDateString('vi-VN')}` : ''}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleOpenEditModal(viewUC);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Chỉnh sửa
                </button>
                <button
                  type="button"
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-slate-500/15 backdrop-blur-md" onClick={() => setIsEditModalOpen(false)} />
          <div className="glass-panel w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative z-10 bg-white/95 dark:bg-slate-900/95 animate-scale-up">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-5 select-none">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Edit2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Chỉnh sửa Use Case</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">Cập nhật thông tin chi tiết và danh sách giao dịch</p>
              </div>
            </div>

            <form onSubmit={handleEditUseCase} className="space-y-4" autoComplete="off">
              {modalError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs p-3.5 rounded-xl flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span className="font-semibold">{modalError}</span>
                </div>
              )}

              {modalSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs p-3.5 rounded-xl flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 animate-bounce" />
                  <span className="font-semibold">{modalSuccess}</span>
                </div>
              )}

              {/* Form Scrollable Body */}
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                
                {/* Code & Name Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Mã Use Case <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={ucCode}
                      onChange={(e) => setUcCode(e.target.value)}
                      placeholder="Ví dụ: UC-04"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tên kịch bản <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={ucName}
                      onChange={(e) => setUcName(e.target.value)}
                      placeholder="Ví dụ: Cập nhật thông tin"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* Description & Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Mô tả chi tiết</label>
                  <textarea
                    value={ucDescription}
                    onChange={(e) => setUcDescription(e.target.value)}
                    placeholder="Mô tả nghiệp vụ chính..."
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Ghi chú lưu ý</label>
                  <input
                    type="text"
                    value={ucNotes}
                    onChange={(e) => setUcNotes(e.target.value)}
                    placeholder="Ghi chú về mặt nghiệp vụ..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tác nhân liên quan</label>
                  <input
                    type="text"
                    value={ucActors}
                    onChange={(e) => setUcActors(e.target.value)}
                    placeholder="Ví dụ: Người dùng, Quản trị viên, Hệ thống..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                  />
                </div>

                {/* BA & Dev Assignment */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">BA phụ trách</label>
                    <select
                      value={ucBA}
                      onChange={(e) => setUcBA(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
                    >
                      <option value="" className="bg-white dark:bg-slate-900 text-slate-400">— Không chọn —</option>
                      {profiles.map(p => (
                        <option key={p.id} value={p.email} className="bg-white dark:bg-slate-900 text-slate-800">
                          {p.full_name} ({p.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Dev phụ trách</label>
                    <input
                      type="text"
                      value={ucDev}
                      onChange={(e) => setUcDev(e.target.value)}
                      placeholder="Tên hoặc email Dev phụ trách..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* Status BA / Dev / Test */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Trạng thái BA',   val: ucStatusBA,   set: setUcStatusBA },
                    { label: 'Trạng thái DEV',  val: ucStatusDev,  set: setUcStatusDev },
                    { label: 'Trạng thái TEST', val: ucStatusTest, set: setUcStatusTest },
                  ].map(({ label, val, set }) => (
                    <div key={label}>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{label}</label>
                      <select
                        value={val}
                        onChange={(e) => set(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
                      >
                        <option value="">— Chưa xác định —</option>
                        <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                        <option value="Đang thực hiện">Đang thực hiện</option>
                        <option value="Hoàn thành">Hoàn thành</option>
                        <option value="Bị chặn">Bị chặn</option>
                      </select>
                    </div>
                  ))}
                </div>

                {/* Project & Sprint */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      <span className="flex items-center gap-1"><FolderKanban className="h-3 w-3" /> Dự án</span>
                    </label>
                    <select
                      value={ucProjectId}
                      onChange={(e) => { setUcProjectId(e.target.value); setUcSprintId(''); }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
                    >
                      <option value="">— Chưa chọn —</option>
                      {projects.map(p => <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Sprint</label>
                    <select
                      value={ucSprintId}
                      onChange={(e) => setUcSprintId(e.target.value)}
                      disabled={!ucProjectId}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">— Chưa chọn —</option>
                      {allSprints.filter(s => s.project_id === ucProjectId).map(s => <option key={s.id} value={s.id}>[{s.code}] {s.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Difficulty & BMT Dropdowns */}
                <div className="grid grid-cols-2 gap-4 select-none">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Mức độ khó</label>
                    <select
                      value={ucDifficulty}
                      onChange={(e) => setUcDifficulty(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
                    >
                      <option value="Đơn giản" className="bg-white dark:bg-slate-900 text-slate-800">Đơn giản</option>
                      <option value="Trung bình" className="bg-white dark:bg-slate-900 text-slate-800">Trung bình</option>
                      <option value="Phức tạp" className="bg-white dark:bg-slate-900 text-slate-800">Phức tạp</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Đánh giá BMT</label>
                    <select
                      value={ucBMT}
                      onChange={(e) => setUcBMT(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
                    >
                      <option value="B" className="bg-white dark:bg-slate-900 text-slate-800">B (Cơ bản/Basic)</option>
                      <option value="M" className="bg-white dark:bg-slate-900 text-slate-800">M (Trung bình/Medium)</option>
                      <option value="T" className="bg-white dark:bg-slate-900 text-slate-800">T (Phức tạp/Technical)</option>
                    </select>
                  </div>
                </div>

                {/* Transactions Sub-Form List */}
                <div className="space-y-2 pt-2.5">
                  <div className="flex items-center justify-between select-none">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Danh sách Transactions trực thuộc ({ucTransactions.length})</span>
                    <button
                      type="button"
                      onClick={handleAddFormTransaction}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <Plus className="h-3 w-3" />
                      Thêm Transaction
                    </button>
                  </div>

                  <div className="space-y-3">
                    {ucTransactions.map((tx, idx) => (
                      <div key={tx.id} className="p-3.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800/65 rounded-2xl flex items-start gap-3 relative group">
                        <div className="w-16 shrink-0">
                          <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Mã TX</span>
                          <input
                            type="text"
                            value={tx.code}
                            onChange={(e) => handleUpdateFormTransaction(tx.id, 'code', e.target.value)}
                            placeholder="TX-01"
                            className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="flex-1">
                          <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Tên Transaction kịch bản</span>
                          <input
                            type="text"
                            value={tx.name}
                            onChange={(e) => handleUpdateFormTransaction(tx.id, 'name', e.target.value)}
                            placeholder="Ví dụ: Nhập email đăng nhập"
                            className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveFormTransaction(tx.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors mt-4.5 cursor-pointer opacity-40 group-hover:opacity-100 focus:opacity-100"
                          title="Xóa dòng giao dịch này"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {ucTransactions.length === 0 && (
                      <p className="text-center text-xs text-slate-400 dark:text-slate-600 italic py-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        Chưa có Transaction — nhấn "Thêm Transaction" nếu cần.
                      </p>
                    )}
                  </div>
                </div>

              </div>

              {/* Action buttons */}
              <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex gap-3 select-none">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
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

      {/* MODAL: IMPORT EXCEL PREVIEW */}
      {isImportPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-500/15 backdrop-blur-md" onClick={() => { if (!isImportSaving) setIsImportPreviewModalOpen(false); }} />
          <div className="glass-panel w-full max-w-5xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative z-10 bg-white/95 dark:bg-slate-900/95 animate-scale-up flex flex-col max-h-[90vh]">
            
            <button
              onClick={() => { if (!isImportSaving) setIsImportPreviewModalOpen(false); }}
              disabled={isImportSaving}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4 select-none pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Xem trước dữ liệu nhập từ Excel</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">Vui lòng kiểm tra và xác nhận tính hợp lệ của danh sách kịch bản dưới đây trước khi lưu.</p>
              </div>
            </div>

            {/* Validation Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 select-none">
              <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng số dòng</span>
                <span className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1">{importPreviewData.length}</span>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/10 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-950/20 flex flex-col">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Thêm mới</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {importPreviewData.filter(r => r.status === 'new').length}
                </span>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/10 p-3 rounded-2xl border border-amber-100 dark:border-amber-950/20 flex flex-col">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">Ghi đè (Mã đã có)</span>
                <span className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1">
                  {importPreviewData.filter(r => r.status === 'overwrite').length}
                </span>
              </div>
              <div className="bg-rose-50 dark:bg-rose-950/10 p-3 rounded-2xl border border-rose-100 dark:border-rose-950/20 flex flex-col">
                <span className="text-[10px] text-rose-500 dark:text-rose-400 font-bold uppercase tracking-wider">Lỗi dữ liệu</span>
                <span className="text-lg font-black text-rose-500 dark:text-rose-400 mt-1">
                  {importPreviewData.filter(r => r.status === 'invalid').length}
                </span>
              </div>
            </div>

            {/* Scrollable Preview Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/30 dark:bg-slate-950/10 mb-4 shadow-inner">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider sticky top-0 z-10 select-none">
                  <tr>
                    <th className="px-4 py-3 w-[4%] text-center"></th>
                    <th className="px-4 py-3 w-[12%]">Mã UC</th>
                    <th className="px-4 py-3 w-[28%]">Tên Use Case kịch bản</th>
                    <th className="px-4 py-3 w-[15%] text-center">Độ khó / BMT</th>
                    <th className="px-4 py-3 w-[12%] text-center">Transactions</th>
                    <th className="px-4 py-3 w-[14%] text-center">Trạng thái</th>
                    <th className="px-4 py-3 w-[15%]">Lưu ý / Lỗi dữ liệu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900/10">
                  {importPreviewData.map((row) => {
                    const isExpanded = !!expandedPreviewRows[row.id];
                    const hasTransactions = row.transactions.length > 0;

                    return (
                      <Fragment key={row.id}>
                        <tr className={`hover:bg-slate-55 dark:hover:bg-slate-900/10 transition-colors ${row.status === 'invalid' ? 'bg-rose-500/5 dark:bg-rose-500/5' : ''}`}>
                          <td className="px-4 py-3 text-center">
                            {hasTransactions && (
                              <button
                                type="button"
                                onClick={() => setExpandedPreviewRows(prev => ({ ...prev, [row.id]: !prev[row.id] }))}
                                className="p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400 select-all">
                            {row.code || <span className="text-rose-500 italic font-semibold">&lt;Trống&gt;</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-700 dark:text-slate-200 block truncate max-w-xs" title={row.name}>
                              {row.name || <span className="text-rose-500 italic font-semibold">&lt;Trống&gt;</span>}
                            </span>
                            {row.description && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate max-w-xs mt-0.5" title={row.description}>
                                {row.description}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center select-none">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${getDifficultyBadgeStyle(row.difficulty)}`}>
                                {row.difficulty}
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${getBMTBadgeStyle(row.bmt)}`}>
                                BMT: {row.bmt}
                              </span>
                              {row.status_ba && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${getStatusBadge(row.status_ba)}`}>
                                  BA: {row.status_ba}
                                </span>
                              )}
                              {row.status_dev && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${getStatusBadge(row.status_dev)}`}>
                                  DEV: {row.status_dev}
                                </span>
                              )}
                              {row.status_test && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${getStatusBadge(row.status_test)}`}>
                                  TEST: {row.status_test}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center select-none">
                            <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                              {row.transactions.length} TXs
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center select-none">
                            {row.status === 'new' && (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                Thêm mới
                              </span>
                            )}
                            {row.status === 'overwrite' && (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                Ghi đè
                              </span>
                            )}
                            {row.status === 'invalid' && (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20">
                                Lỗi dữ liệu
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs max-w-xs">
                            {row.status === 'invalid' ? (
                              <div className="space-y-1">
                                {row.validationErrors.map((err, i) => (
                                  <span key={i} className="text-rose-500 dark:text-rose-400 font-semibold block text-[10px]">• {err}</span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 block truncate" title={row.notes || 'Không có ghi chú.'}>
                                {row.notes || '—'}
                              </span>
                            )}
                          </td>
                        </tr>

                        {/* Expanded Transactions Panel */}
                        {isExpanded && hasTransactions && (
                          <tr className="bg-slate-50/50 dark:bg-slate-950/20">
                            <td colSpan={7} className="px-8 py-3">
                              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-inner bg-white dark:bg-slate-900/30 max-w-3xl">
                                <table className="w-full text-left text-[11px] border-collapse">
                                  <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-400 uppercase tracking-wider select-none">
                                      <th className="px-4 py-2 w-3/12">Mã TX</th>
                                      <th className="px-4 py-2 w-9/12">Tên hoạt động giao dịch (Transaction) được bóc tách</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40">
                                    {row.transactions.map((tx, txIdx) => (
                                      <tr key={txIdx} className="hover:bg-slate-55 dark:hover:bg-slate-800/10 transition-colors">
                                        <td className="px-4 py-2 font-bold text-slate-800 dark:text-indigo-400">{tx.code}</td>
                                        <td className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300">{tx.name}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal Warning about invalid records */}
            {importPreviewData.some(r => r.status === 'invalid') && (
              <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs p-3 rounded-xl flex items-center gap-2 select-none">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span className="font-semibold">
                  Cảnh báo: Tệp của bạn chứa {importPreviewData.filter(r => r.status === 'invalid').length} dòng dữ liệu bị lỗi. Các dòng lỗi này sẽ tự động bị bỏ qua, chỉ có các bản ghi hợp lệ mới được lưu lại.
                </span>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex gap-3 select-none">
              <button
                type="button"
                onClick={() => { if (!isImportSaving) setIsImportPreviewModalOpen(false); }}
                disabled={isImportSaving}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-655 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isImportSaving || importPreviewData.filter(r => r.status !== 'invalid').length === 0}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-505 text-white text-xs font-bold shadow-lg shadow-emerald-600/10 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isImportSaving ? (
                  <>
                    <Loader2 className="animate-spin h-3.5 w-3.5" />
                    Đang xử lý lưu...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Xác nhận Lưu ({importPreviewData.filter(r => r.status !== 'invalid').length} bản ghi hợp lệ)
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: UPLOAD EXCEL FILE */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-500/15 backdrop-blur-md" onClick={() => setIsUploadModalOpen(false)} />
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative z-10 bg-white/95 dark:bg-slate-900/95 animate-scale-up">
            
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5 select-none pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Tải lên tệp nghiệp vụ Excel</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">Nhập danh sách Use Cases & Transactions tự động từ bảng tính</p>
              </div>
            </div>

            {/* Drag and Drop Zone */}
            <div className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('excel-file-input').click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-indigo-500 bg-indigo-500/10 scale-[0.98]' 
                    : uploadFile 
                      ? 'border-emerald-500 bg-emerald-500/5' 
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/20'
                }`}
              >
                <input
                  id="excel-file-input"
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {uploadFile ? (
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-bounce">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                )}

                <div className="text-center">
                  {uploadFile ? (
                    <>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[280px]">
                        {uploadFile.name}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                        {(uploadFile.size / 1024).toFixed(1)} KB
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Kéo và thả tệp Excel vào đây
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                        hoặc <span className="text-indigo-600 dark:text-indigo-400 font-extrabold hover:underline">nhấp chuột để duyệt tìm tệp</span>
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Guidelines or Downloader link */}
              <div className="flex items-center justify-between text-[11px] bg-slate-50 dark:bg-slate-950/30 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
                <span className="text-slate-400 dark:text-slate-500 font-medium">Chưa có tệp định dạng chuẩn?</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    handleDownloadTemplate();
                  }}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Tải tệp Excel mẫu
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex gap-3 select-none">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-655 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleProcessUploadFile}
                  disabled={!uploadFile}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-505 disabled:bg-slate-100 disabled:dark:bg-slate-800 text-white disabled:text-slate-400 font-bold text-xs shadow-lg disabled:shadow-none shadow-indigo-600/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Tiến hành phân tích
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </DashboardLayout>
  );
}



