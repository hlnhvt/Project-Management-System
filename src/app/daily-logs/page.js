'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase, withTimeout } from '@/lib/supabase';
import { sendNotification } from '@/lib/sendNotification';
import { MOCK_PROJECTS, MOCK_SPRINTS } from '@/lib/mockData';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  CheckCircle,
  Loader2,
  AlertCircle,
  CalendarDays,
  Users,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Eraser,
  X,
  FileText,
  Plus,
  Trash2,
  GripVertical,
  FolderKanban,
  CheckSquare,
  Link2,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Send,
} from 'lucide-react';

const MOCK_LOGS = [
  {
    id: 'log1', user_id: 'preview', log_date: '2026-05-28',
    title: 'Review sprint và hoàn thiện UI Dashboard',
    content: '<p><strong>Sáng:</strong> Họp nhóm review sprint, cập nhật tiến độ tuần.</p><p><strong>Chiều:</strong> Hoàn thiện thiết kế UI trang Dashboard, commit code lên repo.</p>',
    related_ucs: [{ uc_id: 'uc1', uc_code: 'UC-01', uc_name: 'Đăng nhập hệ thống', note: 'Kiểm tra lại flow đăng nhập' }],
    related_links: [],
    is_approved: true, approved_by_name: 'Trần Thị Manager',
    approved_at: '2026-05-29T08:00:00Z', created_at: '2026-05-28T17:00:00Z', updated_at: '2026-05-28T17:00:00Z',
  },
  {
    id: 'log2', user_id: 'preview', log_date: '2026-05-29',
    title: 'Cài đặt Supabase',
    content: '<p>Cài đặt và cấu hình Supabase cho dự án.</p><ul><li>Tạo bảng profiles, roles, permissions</li><li>Viết RLS policies phân quyền</li><li>Seed dữ liệu ban đầu cho 4 role hệ thống</li></ul>',
    related_ucs: [],
    related_links: [{ id: 'lk1', url: 'https://supabase.com/docs', label: 'Supabase Docs' }],
    is_approved: true, approved_by_name: 'Trần Thị Manager',
    approved_at: '2026-05-30T09:00:00Z', created_at: '2026-05-29T18:00:00Z', updated_at: '2026-05-29T18:00:00Z',
  },
  {
    id: 'log3', user_id: 'preview', log_date: '2026-05-30',
    title: 'Implement RBAC động',
    content: '<p>Implement chức năng phân quyền RBAC động từ cơ sở dữ liệu.</p><p>Đã kiểm thử với 4 role: Admin, Manager, Developer, BA.</p>',
    related_ucs: [
      { uc_id: 'uc2', uc_code: 'UC-02', uc_name: 'Quản lý bảng Kanban', note: '' },
      { uc_id: 'uc3', uc_code: 'UC-03', uc_name: 'Sơ đồ cây thành viên', note: 'Xem lại thiết kế mới nhất' },
    ],
    related_links: [],
    is_approved: false, approved_by_name: null,
    approved_at: null, created_at: '2026-05-30T17:30:00Z', updated_at: '2026-05-30T17:30:00Z',
  },
  {
    id: 'log4', user_id: 'preview', log_date: '2026-06-01',
    title: 'Task history & required fields',
    content: '<p>Thêm chức năng Lịch sử thay đổi cho Kanban Board.</p><p>Bổ sung dấu <strong>(*)</strong> cho các trường bắt buộc nhập liệu trong toàn bộ hệ thống.</p>',
    related_ucs: [],
    related_links: [],
    is_approved: false, approved_by_name: null,
    approved_at: null, created_at: '2026-06-01T09:00:00Z', updated_at: '2026-06-01T09:00:00Z',
  },
  {
    id: 'log5', user_id: 'preview', log_date: '2026-06-01',
    title: 'Review UI nhật ký & Use Case notes',
    content: '<p>Thiết kế lại trang nhật ký hàng ngày: hỗ trợ nhiều nhật ký/ngày, trích xuất ghi chú UC tự động.</p><p>Cập nhật modal chi tiết UC — hiển thị ghi chú từ nhật ký.</p>',
    related_ucs: [
      { uc_id: 'uc1', uc_code: 'UC-01', uc_name: 'Đăng nhập hệ thống', note: '- có sai lệch ở bước xác thực token' },
    ],
    related_links: [],
    is_approved: false, approved_by_name: null,
    approved_at: null, created_at: '2026-06-01T16:30:00Z', updated_at: '2026-06-01T16:30:00Z',
  },
];

const MOCK_TEAM = [
  { id: 'member-1', full_name: 'Phạm Minh Developer', email: 'dev@demo.com' },
  { id: 'member-2', full_name: 'Lê Hoàng Coder', email: 'coder@demo.com' },
  { id: 'member-3', full_name: 'Hoàng Thị BA', email: 'ba@demo.com' },
];

const MOCK_UC_LIST = [
  { id: 'uc1', code: 'UC-01', name: 'Đăng nhập hệ thống', description: 'Người dùng thực hiện đăng nhập vào hệ thống PROJEXA bằng tài khoản và mật khẩu được cấp.', actors: 'Người dùng, Hệ thống xác thực', difficulty: 'Đơn giản', ba_email: 'ba@demo.com', dev_email: 'dev@demo.com' },
  { id: 'uc2', code: 'UC-02', name: 'Quản lý bảng Kanban', description: 'Quản lý và cập nhật trạng thái các công việc bằng thao tác kéo thả hoặc biểu mẫu chỉnh sửa.', actors: 'Manager, Developer', difficulty: 'Phức tạp', ba_email: '', dev_email: 'dev@demo.com' },
  { id: 'uc3', code: 'UC-03', name: 'Sơ đồ cây thành viên', description: 'Xem trực quan sơ đồ tổ chức nhân sự dưới dạng cây đệ quy cha con.', actors: 'Admin, Manager', difficulty: 'Trung bình', ba_email: 'ba@demo.com', dev_email: '' },
];

const MOCK_COMMENTS = [
  { id: 'cmt1', log_id: 'log1', user_id: '2', author_name: 'Trần Thị Manager', content: 'Tiến độ tốt! Tiếp tục maintain nhịp độ này nhé. Review Sprint 2 vào sáng mai.', created_at: '2026-05-28T18:30:00Z' },
  { id: 'cmt2', log_id: 'log1', user_id: 'preview', author_name: 'Tôi', content: 'Vâng ạ, em đã note lại các điểm cần cải thiện rồi ạ.', created_at: '2026-05-28T19:05:00Z' },
];

const WEEK_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTH_NAMES = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDisplayDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekdays = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  return `${weekdays[date.getDay()]}, ngày ${d} tháng ${m} năm ${y}`;
};

function formatCommentTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} ngày trước`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function normalizeUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return 'https://' + url;
}

function extractLinksFromHtml(html) {
  if (!html) return [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const seen = new Set();
    const result = [];
    doc.querySelectorAll('a[href]').forEach(a => {
      const url = a.getAttribute('href');
      if (!url || !/^https?:\/\//i.test(url)) return;
      if (seen.has(url)) return;
      seen.add(url);
      const label = a.textContent?.trim() || url;
      result.push({ id: 'lk-' + Math.random().toString(36).substr(2, 9), url, label });
    });
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    const urlRegex = /https?:\/\/[^\s<>"']+/g;
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement?.tagName === 'A') continue;
      const matches = node.textContent.match(urlRegex) || [];
      for (const rawUrl of matches) {
        const url = rawUrl.replace(/[.,;!?)]+$/, '');
        if (!seen.has(url)) {
          seen.add(url);
          result.push({ id: 'lk-' + Math.random().toString(36).substr(2, 9), url, label: url });
        }
      }
    }
    return result;
  } catch {
    return [];
  }
}

export default function DailyLogsPage() {
  const { user, profile, role, hasPermission } = useAuth();

  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);
  const [error, setError] = useState('');

  const canCreate = hasPermission('daily_logs', 'create') || !isSupabaseConfigured;
  const canUpdate = hasPermission('daily_logs', 'update') || !isSupabaseConfigured;
  const isManagerOrAdmin = role?.name === 'Admin' || role?.name === 'Manager';

  // Calendar state
  const todayStr = formatDate(new Date());
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Team member selector — đọc từ localStorage ngay khi khởi tạo để tránh race condition
  const [viewingUserId, setViewingUserId] = useState(() => {
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('aerotask_viewing_user_id');
      if (id) { localStorage.removeItem('aerotask_viewing_user_id'); return id; }
    }
    return 'self';
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [teamLogsForDate, setTeamLogsForDate] = useState({});

  // Logs state — dayLogs holds all logs for the selected date
  // mockLogsRef always holds the latest value so saveMockLogs never reads stale closure
  const mockLogsRef = useRef(MOCK_LOGS);
  const [mockLogs, setMockLogs] = useState(MOCK_LOGS); // SSR-safe; localStorage loaded in useEffect below
  const [calendarLogs, setCalendarLogs] = useState([]);
  const [dayLogs, setDayLogs] = useState([]);
  const [currentLog, setCurrentLog] = useState(null);
  const [logLoading, setLogLoading] = useState(false);

  // Comments state
  const [logComments, setLogComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Title & related UCs
  const [logTitle, setLogTitle] = useState('');
  const [relatedUCs, setRelatedUCs] = useState([]);
  const logTitleRef = useRef('');
  const relatedUCsRef = useRef([]);
  const [autoExtractNotes, setAutoExtractNotes] = useState(true);
  const autoExtractNotesRef = useRef(true);

  // Editor refs
  const editorRef = useRef(null);
  const saveTimerRef = useRef(null);
  const currentLogRef = useRef(null);
  const selectedDateRef = useRef(todayStr);
  const fetchDayLogsGenRef = useRef(0);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [savedAt, setSavedAt] = useState(null);

  // Approval
  const [approving, setApproving] = useState(false);

  // Projects & sprints for log tagging
  const [projects, setProjects] = useState([]);
  const [allSprints, setAllSprints] = useState([]);
  const [logProjectId, setLogProjectId] = useState('');
  const [logSprintId, setLogSprintId] = useState('');
  const [logTaskId, setLogTaskId] = useState('');
  const [availableTasks, setAvailableTasks] = useState([]);
  const logProjectIdRef = useRef('');
  const logSprintIdRef = useRef('');
  const logTaskIdRef = useRef('');
  const myFirstProjectIdRef = useRef('');

  // Related document links
  const [relatedLinks, setRelatedLinks] = useState([]);
  const relatedLinksRef = useRef([]);
  const [linkConfirmTarget, setLinkConfirmTarget] = useState(null); // { url, label }

  // UC list for @ mention
  const [ucList, setUcList] = useState(MOCK_UC_LIST);

  // @ mention
  const [atMentionOpen, setAtMentionOpen] = useState(false);
  const [atMentionQuery, setAtMentionQuery] = useState('');
  const [atMentionPos, setAtMentionPos] = useState({ top: 0, left: 0 });
  const atMentionRef = useRef(null);
  const atSearchInputRef = useRef(null);

  // UC detail modal & tooltip
  const [ucDetailModal, setUcDetailModal] = useState(null);
  const [ucTooltip, setUcTooltip] = useState(null);
  const tooltipTimerRef = useRef(null);

  // Floating UC list popup
  const [ucListPopupOpen, setUcListPopupOpen] = useState(false);
  const [ucListSearch, setUcListSearch] = useState('');
  const [ucListPopupPos, setUcListPopupPos] = useState({ x: 20, y: 120 });
  const [ucListSortBy, setUcListSortBy] = useState('code');
  const [ucListSortOrder, setUcListSortOrder] = useState('asc');
  const [ucListFilters, setUcListFilters] = useState({ description: '', actors: '', difficulty: '', ba_email: '', dev_email: '' });
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const isResizingRef = useRef(false);
  const resizeStartRef = useRef({ x: 0, y: 0, w: 780, h: 460 });
  const [popupSize, setPopupSize] = useState({ width: 780, height: 460 });
  const [ucListPage, setUcListPage] = useState(1);
  const [ucListPageSize, setUcListPageSize] = useState(20);
  const [ucListFilterProject, setUcListFilterProject] = useState('');

  // UC status: latest confirmed dates + full history log, persisted in localStorage
  const [ucStatusMap, setUcStatusMap] = useState(() => {
    try { const s = localStorage.getItem('aerotask_uc_status'); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const [ucStatusLogs, setUcStatusLogs] = useState(() => {
    try { const s = localStorage.getItem('aerotask_uc_status_logs'); return s ? JSON.parse(s) : []; } catch { return []; }
  });

  // Keep refs in sync
  useEffect(() => { currentLogRef.current = currentLog; }, [currentLog]);
  useEffect(() => { selectedDateRef.current = selectedDate; }, [selectedDate]);
  useEffect(() => { logTitleRef.current = logTitle; }, [logTitle]);
  useEffect(() => { relatedUCsRef.current = relatedUCs; }, [relatedUCs]);
  useEffect(() => { autoExtractNotesRef.current = autoExtractNotes; }, [autoExtractNotes]);
  useEffect(() => { logProjectIdRef.current = logProjectId; }, [logProjectId]);
  useEffect(() => { logSprintIdRef.current = logSprintId; }, [logSprintId]);
  useEffect(() => { logTaskIdRef.current = logTaskId; }, [logTaskId]);
  useEffect(() => { relatedLinksRef.current = relatedLinks; }, [relatedLinks]);

  // ─── Initial setup ───────────────────────────────────────────────────────────

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your_supabase_project_url')) {
      setIsSupabaseConfigured(false);
      try {
        const savedProjects = localStorage.getItem('aerotask_projects');
        const savedSprints = localStorage.getItem('aerotask_sprints');
        setProjects(savedProjects ? JSON.parse(savedProjects) : MOCK_PROJECTS);
        setAllSprints(savedSprints ? JSON.parse(savedSprints) : MOCK_SPRINTS);
      } catch { setProjects(MOCK_PROJECTS); setAllSprints(MOCK_SPRINTS); }
      return;
    }
    if (isManagerOrAdmin) fetchTeamMembers();
    fetchUCList();
    fetchProjectsAndSprints();
  }, []);

  // Cleanup timers on unmount
  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
  }, []);

  // ─── Fetch helpers ────────────────────────────────────────────────────────────

  const fetchTeamMembers = async () => {
    setTeamLoading(true);
    try {
      let query = supabase.from('profiles').select('id, full_name, email');
      if (role?.name !== 'Admin') query = query.eq('manager_id', user?.id);
      const { data } = await withTimeout(query);
      if (data) setTeamMembers(data);
    } catch (err) {
      console.error('Lỗi tải danh sách thành viên:', err);
    } finally {
      setTeamLoading(false);
    }
  };

  const fetchUCList = async () => {
    try {
      const { data, error } = await withTimeout(
        supabase.from('use_cases')
          .select('id, code, name, description, actors, difficulty, ba_email, dev_email, project_id, reviewed_at, docs_updated_at, dev_completed_at')
          .order('code')
      );
      if (!error && data && data.length > 0) setUcList(data);
    } catch {
      // fall back to mock
    }
  };

  const fetchProjectsAndSprints = async () => {
    try {
      const [pRes, sRes] = await Promise.all([
        withTimeout(supabase.from('projects').select('id, code, name').order('created_at', { ascending: true })),
        withTimeout(supabase.from('sprints').select('id, project_id, code, name').order('start_date', { ascending: true })),
      ]);
      if (!pRes.error && pRes.data) setProjects(pRes.data);
      if (!sRes.error && sRes.data) setAllSprints(sRes.data);
    } catch { /* fall back to empty */ }
  };

  // Load user's default project once projects are ready
  useEffect(() => {
    if (!user || isManagerOrAdmin || projects.length === 0 || myFirstProjectIdRef.current) return;
    const load = async () => {
      if (!isSupabaseConfigured) {
        try {
          const stored = JSON.parse(localStorage.getItem('aerotask_project_members') || '[]');
          const myIds = stored.filter(m => m.user_id === user.id).map(m => m.project_id);
          const first = projects.find(p => myIds.includes(p.id)) || projects[0];
          if (first) myFirstProjectIdRef.current = first.id;
        } catch {}
        return;
      }
      try {
        const { data } = await withTimeout(
          supabase.from('project_members').select('project_id').eq('user_id', user.id)
        );
        if (data && data.length > 0) {
          const myIds = data.map(m => m.project_id);
          const first = projects.find(p => myIds.includes(p.id));
          if (first) myFirstProjectIdRef.current = first.id;
        }
      } catch {}
    };
    load();
  }, [user, projects.length, isSupabaseConfigured, isManagerOrAdmin]);

  const fetchAvailableTasks = async (projectId) => {
    if (!projectId) { setAvailableTasks([]); return; }
    const statusOrder = { in_progress: 0, review: 1, todo: 2, done: 3 };
    if (!isSupabaseConfigured) {
      try {
        const stored = JSON.parse(localStorage.getItem('aerotask_preview_tasks') || '[]');
        const filtered = stored
          .filter(t => t.project_id === projectId)
          .sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));
        setAvailableTasks(filtered);
        if (currentLogRef.current === null && !logTaskIdRef.current && filtered.length > 0) {
          setLogTaskId(filtered[0].id);
        }
      } catch { setAvailableTasks([]); }
      return;
    }
    try {
      const { data } = await withTimeout(
        supabase.from('tasks')
          .select('id, title, status, due_date')
          .eq('project_id', projectId)
          .eq('assigned_to', user?.id)
          .neq('status', 'done')
          .order('created_at')
      );
      if (data) {
        const sorted = [...data].sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));
        setAvailableTasks(sorted);
        if (currentLogRef.current === null && !logTaskIdRef.current && sorted.length > 0) {
          setLogTaskId(sorted[0].id);
        }
      }
    } catch { setAvailableTasks([]); }
  };

  // Fetch tasks when project changes
  useEffect(() => {
    if (!logProjectId) { setAvailableTasks([]); setLogTaskId(''); return; }
    fetchAvailableTasks(logProjectId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logProjectId]);

  const getTargetUserId = () => {
    if (!isSupabaseConfigured) {
      return viewingUserId === 'self' ? 'preview' : `preview-${viewingUserId}`;
    }
    return viewingUserId === 'self' || !viewingUserId ? user?.id : viewingUserId;
  };

  const fetchCalendarLogs = async () => {
    const targetUserId = getTargetUserId();
    const { year, month } = calendarMonth;
    const pad = String(month + 1).padStart(2, '0');
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDate = `${year}-${pad}-01`;
    const endDate = `${year}-${pad}-${String(daysInMonth).padStart(2, '0')}`;

    if (!isSupabaseConfigured) {
      setCalendarLogs(mockLogs.filter(l => l.user_id === targetUserId && l.log_date >= startDate && l.log_date <= endDate));
      return;
    }

    try {
      const { data, error } = await withTimeout(
        supabase.from('daily_logs')
          .select('id, log_date, is_approved')
          .eq('user_id', targetUserId)
          .gte('log_date', startDate)
          .lte('log_date', endDate)
      );
      if (!error && data) setCalendarLogs(data);
    } catch (err) {
      console.error('Lỗi tải dữ liệu lịch:', err);
    }
  };

  // Fetch ALL logs for the selected date — replaces the old single-log fetch
  const fetchDayLogs = async () => {
    const gen = ++fetchDayLogsGenRef.current;
    const targetUserId = getTargetUserId();
    setLogLoading(true);

    if (!isSupabaseConfigured) {
      const found = mockLogs
        .filter(l => l.user_id === targetUserId && l.log_date === selectedDateRef.current)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      if (gen !== fetchDayLogsGenRef.current) return;
      setDayLogs(found);
      setCurrentLog(found[0] || null);
      setLogLoading(false);
      return;
    }

    try {
      const { data } = await withTimeout(
        supabase.from('daily_logs')
          .select('*, profiles!approved_by(full_name)')
          .eq('user_id', targetUserId)
          .eq('log_date', selectedDateRef.current)
          .order('created_at', { ascending: true })
      );
      if (gen !== fetchDayLogsGenRef.current) return;
      const logs = data
        ? data.map(d => ({ ...d, approved_by_name: d.profiles?.full_name || null }))
        : [];
      setDayLogs(logs);
      setCurrentLog(logs[0] || null);
    } catch {
      if (gen !== fetchDayLogsGenRef.current) return;
      setDayLogs([]);
      setCurrentLog(null);
    } finally {
      if (gen === fetchDayLogsGenRef.current) setLogLoading(false);
    }
  };

  // ─── Comments ─────────────────────────────────────────────────────────────────

  const fetchLogComments = async (logId) => {
    if (!logId) { setLogComments([]); return; }
    setCommentsLoading(true);
    if (!isSupabaseConfigured) {
      setLogComments(MOCK_COMMENTS.filter(c => c.log_id === logId));
      setCommentsLoading(false);
      return;
    }
    try {
      const { data } = await withTimeout(
        supabase.from('log_comments')
          .select('*, profiles!user_id(full_name)')
          .eq('log_id', logId)
          .order('created_at', { ascending: true })
      );
      setLogComments((data || []).map(c => ({ ...c, author_name: c.profiles?.full_name || 'Người dùng' })));
    } catch {
      setLogComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const submitComment = async () => {
    const text = newComment.trim();
    if (!text || !currentLog?.id || commentSubmitting) return;
    setCommentSubmitting(true);
    if (!isSupabaseConfigured) {
      const mock = {
        id: 'cmt-' + Math.random().toString(36).substr(2, 9),
        log_id: currentLog.id, user_id: 'preview',
        content: text, author_name: profile?.full_name || 'Tôi',
        created_at: new Date().toISOString(),
      };
      setLogComments(prev => [...prev, mock]);
      setNewComment('');
      setCommentSubmitting(false);
      return;
    }
    try {
      const { data, error } = await withTimeout(
        supabase.from('log_comments')
          .insert({ log_id: currentLog.id, user_id: user.id, content: text })
          .select('*, profiles!user_id(full_name)')
          .single()
      );
      if (error) throw error;
      if (data) {
        const comment = { ...data, author_name: data.profiles?.full_name || profile?.full_name || 'Tôi' };
        setLogComments(prev => prev.some(c => c.id === comment.id) ? prev : [...prev, comment]);
      }
      setNewComment('');
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const deleteComment = async (commentId) => {
    if (!isSupabaseConfigured) {
      setLogComments(prev => prev.filter(c => c.id !== commentId));
      return;
    }
    try {
      const { error } = await withTimeout(
        supabase.from('log_comments').delete().eq('id', commentId)
      );
      if (error) throw error;
      setLogComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      alert('Lỗi khi xóa: ' + err.message);
    }
  };

  const fetchTeamLogsForDate = async () => {
    if (!isManagerOrAdmin) return;
    const members = isSupabaseConfigured ? teamMembers : MOCK_TEAM;
    if (members.length === 0) return;

    if (!isSupabaseConfigured) {
      const result = {};
      members.forEach(m => { result[m.id] = 'none'; });
      setTeamLogsForDate(result);
      return;
    }

    try {
      const memberIds = members.map(m => m.id);
      const { data } = await withTimeout(
        supabase.from('daily_logs')
          .select('user_id, is_approved')
          .in('user_id', memberIds)
          .eq('log_date', selectedDate)
      );
      const result = {};
      members.forEach(m => {
        const memberLogs = data?.filter(l => l.user_id === m.id) || [];
        if (memberLogs.length === 0) result[m.id] = 'none';
        else if (memberLogs.every(l => l.is_approved)) result[m.id] = 'approved';
        else result[m.id] = 'pending';
      });
      setTeamLogsForDate(result);
    } catch (err) {
      console.error('Lỗi tải trạng thái nhật ký thành viên:', err);
    }
  };

  // ─── useEffects ───────────────────────────────────────────────────────────────

  // Load persisted mock logs from localStorage — runs client-side only (after hydration)
  // Must be a useEffect, NOT a useState lazy initializer, because Next.js SSG runs the
  // initializer on the server where localStorage doesn't exist, so the client would
  // always hydrate with MOCK_LOGS and ignore the saved data.
  useEffect(() => {
    try {
      const saved = localStorage.getItem('aerotask_preview_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          mockLogsRef.current = parsed;
          setMockLogs(parsed);
        }
      }
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep ref in sync so saveMockLogs always has the latest value
  useEffect(() => { mockLogsRef.current = mockLogs; }, [mockLogs]);

  // Điều hướng từ trang khác: đọc ngày mục tiêu từ localStorage
  useEffect(() => {
    const gotoDate = localStorage.getItem('aerotask_goto_log_date');
    if (gotoDate) {
      localStorage.removeItem('aerotask_goto_log_date');
      setSelectedDate(gotoDate);
      const d = new Date(gotoDate + 'T00:00:00');
      setCalendarMonth({ year: d.getFullYear(), month: d.getMonth() });
    }
  }, []);

  useEffect(() => { fetchCalendarLogs(); }, [calendarMonth, viewingUserId, isSupabaseConfigured, mockLogs]);
  useEffect(() => { fetchDayLogs(); }, [selectedDate, viewingUserId, isSupabaseConfigured, mockLogs]);
  useEffect(() => { fetchTeamLogsForDate(); }, [selectedDate, teamMembers, isSupabaseConfigured]);
  useEffect(() => { setUcListPage(1); }, [ucListSearch, ucListFilters, ucListFilterProject]);

  // Comments: fetch + realtime subscription khi currentLog thay đổi
  useEffect(() => {
    if (!currentLog?.id) { setLogComments([]); return; }
    fetchLogComments(currentLog.id);
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel(`log-comments-${currentLog.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'log_comments',
        filter: `log_id=eq.${currentLog.id}`,
      }, async (payload) => {
        // Bỏ qua nếu comment này do chính user vừa tạo (đã thêm optimistically)
        if (payload.new.user_id === user?.id) return;
        try {
          const { data } = await supabase.from('log_comments')
            .select('*, profiles!user_id(full_name)')
            .eq('id', payload.new.id)
            .single();
          if (data) {
            const c = { ...data, author_name: data.profiles?.full_name || 'Người dùng' };
            setLogComments(prev => prev.some(x => x.id === c.id) ? prev : [...prev, c]);
          }
        } catch {}
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'log_comments',
        filter: `log_id=eq.${currentLog.id}`,
      }, (payload) => {
        setLogComments(prev => prev.filter(c => c.id !== payload.old.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentLog?.id, isSupabaseConfigured]); // eslint-disable-line react-hooks/exhaustive-deps


  // Click outside — dropdown
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Click outside — @ mention
  useEffect(() => {
    const handler = (e) => {
      if (
        atMentionRef.current && !atMentionRef.current.contains(e.target) &&
        editorRef.current && !editorRef.current.contains(e.target)
      ) setAtMentionOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search input when @ mention opens
  useEffect(() => {
    if (atMentionOpen) setTimeout(() => atSearchInputRef.current?.focus(), 50);
  }, [atMentionOpen]);

  // Global mouse events for UC list popup dragging and resizing
  useEffect(() => {
    const onMove = (e) => {
      if (isDraggingRef.current) {
        setUcListPopupPos({
          x: Math.max(0, Math.min(e.clientX - dragOffsetRef.current.x, window.innerWidth - 300)),
          y: Math.max(0, Math.min(e.clientY - dragOffsetRef.current.y, window.innerHeight - 100)),
        });
      }
      if (isResizingRef.current) {
        const dx = e.clientX - resizeStartRef.current.x;
        const dy = e.clientY - resizeStartRef.current.y;
        setPopupSize({
          width: Math.max(400, resizeStartRef.current.w + dx),
          height: Math.max(250, resizeStartRef.current.h + dy),
        });
      }
    };
    const onUp = () => {
      isDraggingRef.current = false;
      isResizingRef.current = false;
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, []);

  // Clear editor when date OR user changes
  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = '';
    setLogTitle('');
    setRelatedUCs([]);
    setRelatedLinks([]);
    setLogProjectId(myFirstProjectIdRef.current || '');
    setLogSprintId('');
    setLogTaskId('');
    setDayLogs([]);
    setCurrentLog(null);
    setSaveStatus('saved');
    setSavedAt(null);
  }, [selectedDate, viewingUserId]);

  // Populate editor when the selected log changes (tab switch or initial load)
  useEffect(() => {
    if (!editorRef.current || currentLog === null) return;
    editorRef.current.innerHTML = currentLog.content || '';
    setLogTitle(currentLog.title || '');
    setRelatedUCs(currentLog.related_ucs || []);
    const savedLinks = currentLog.related_links || [];
    const detected = extractLinksFromHtml(currentLog.content || '');
    const savedUrls = new Set(savedLinks.map(l => l.url));
    const newLinks = detected.filter(l => !savedUrls.has(l.url));
    setRelatedLinks(newLinks.length > 0 ? [...savedLinks, ...newLinks] : savedLinks);
    setLogProjectId(currentLog.project_id || '');
    setLogSprintId(currentLog.sprint_id || '');
    setLogTaskId(currentLog.task_id || '');
    setSaveStatus('saved');
    setSavedAt(currentLog.updated_at ? new Date(currentLog.updated_at) : null);
  }, [currentLog?.id]); // depend on ID only to avoid re-populating on every save update

  // ─── Log tab switching ────────────────────────────────────────────────────────

  const handleSwitchLog = async (log) => {
    if (currentLog?.id === log.id) return;
    if (saveStatus === 'unsaved') {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      await handleSave();
    }
    setCurrentLog(log);
  };

  const handleNewLog = async () => {
    if (currentLog === null) return; // already in new-log mode
    if (saveStatus === 'unsaved') {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      await handleSave();
    }
    setCurrentLog(null);
    if (editorRef.current) editorRef.current.innerHTML = '';
    setLogTitle('');
    setRelatedUCs([]);
    setRelatedLinks([]);
    setLogProjectId(myFirstProjectIdRef.current || '');
    setLogSprintId('');
    setLogTaskId('');
    setSaveStatus('saved');
    setSavedAt(null);
  };

  // ─── Save logic ───────────────────────────────────────────────────────────────

  const triggerSave = () => {
    setSaveStatus('unsaved');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(handleSave, 1500);
  };

  const handleEditorInput = () => {
    triggerSave();
    checkAtMention();
    if (autoExtractNotesRef.current) extractNotesFromContent();
  };

  const handleTitleChange = (e) => {
    setLogTitle(e.target.value);
    triggerSave();
  };

  // Uses mockLogsRef (always current) to compute the next value, saves to localStorage
  // BEFORE calling setMockLogs so there's zero React-render race with F5.
  const saveMockLogs = (updater) => {
    const prev = mockLogsRef.current;
    const next = typeof updater === 'function' ? updater(prev) : updater;
    mockLogsRef.current = next;
    try { localStorage.setItem('aerotask_preview_logs', JSON.stringify(next)); } catch {}
    setMockLogs(next);
  };

  const handleSave = async () => {
    if (!editorRef.current) return;
    const content = editorRef.current.innerHTML;
    const textContent = editorRef.current.textContent?.trim();
    const title = logTitleRef.current;
    const relatedUCsData = relatedUCsRef.current;
    const relatedLinksData = relatedLinksRef.current;
    const projectId = logProjectIdRef.current || null;
    const sprintId = logSprintIdRef.current || null;
    const log = currentLogRef.current;
    const date = selectedDateRef.current;

    if (!textContent && !title && !log) return;

    // Dự án là bắt buộc
    if (!projectId) {
      setSaveStatus('error');
      return;
    }

    setSaveStatus('saving');
    const taskId = logTaskIdRef.current || null;

    try {
      const targetUserId = getTargetUserId();

      if (!isSupabaseConfigured) {
        if (log) {
          const updated = { ...log, title, content, related_ucs: relatedUCsData, related_links: relatedLinksData, project_id: projectId, sprint_id: sprintId, task_id: taskId, updated_at: new Date().toISOString() };
          saveMockLogs(prev => prev.map(l => l.id === log.id ? updated : l));
          setDayLogs(prev => prev.map(l => l.id === log.id ? updated : l));
          currentLogRef.current = updated;
        } else if (textContent || title) {
          const newLog = {
            id: 'log-' + Math.random().toString(36).substr(2, 9),
            user_id: targetUserId, log_date: date, title, content,
            related_ucs: relatedUCsData,
            related_links: relatedLinksData,
            project_id: projectId, sprint_id: sprintId, task_id: taskId,
            is_approved: false, approved_by_name: null, approved_at: null,
            created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
          };
          saveMockLogs(prev => [...prev, newLog]);
          setDayLogs(prev => [...prev, newLog]);
          setCurrentLog(newLog);
          setCalendarLogs(prev => {
            if (prev.some(l => l.log_date === date)) return prev;
            return [...prev, { id: newLog.id, log_date: date, is_approved: false }];
          });
        }
        setSaveStatus('saved');
        setSavedAt(new Date());
        return;
      }

      const payload = { title, content, related_ucs: relatedUCsData, related_links: relatedLinksData, project_id: projectId, sprint_id: sprintId, task_id: taskId, updated_at: new Date().toISOString() };

      if (log?.id) {
        const { error } = await withTimeout(
          supabase.from('daily_logs').update(payload).eq('id', log.id)
        );
        if (error) throw error;
        setDayLogs(prev => prev.map(l => l.id === log.id ? { ...l, ...payload } : l));
      } else if (textContent || title) {
        const { data, error } = await withTimeout(
          supabase.from('daily_logs')
            .insert({ user_id: targetUserId, log_date: date, ...payload })
            .select()
            .single()
        );
        if (error) throw error;
        if (data) {
          setCurrentLog(data);
          setDayLogs(prev => [...prev, data]);
          setCalendarLogs(prev => {
            if (prev.some(l => l.log_date === date)) return prev;
            return [...prev, { id: data.id, log_date: date, is_approved: false }];
          });
        }
      }

      setSaveStatus('saved');
      setSavedAt(new Date());
    } catch (err) {
      setSaveStatus('unsaved');
      console.error('Lỗi lưu nhật ký:', err);
    }
  };

  // ─── Approval ─────────────────────────────────────────────────────────────────

  const handleApprove = async () => {
    const log = currentLogRef.current;
    if (!log) return;
    setApproving(true);
    try {
      if (!isSupabaseConfigured) {
        const updated = { ...log, is_approved: true, approved_by_name: profile?.full_name || 'Quản lý', approved_at: new Date().toISOString() };
        saveMockLogs(prev => prev.map(l => l.id === log.id ? updated : l));
        setCurrentLog(updated);
        setDayLogs(prev => prev.map(l => l.id === log.id ? updated : l));
        setCalendarLogs(prev => prev.map(l => l.id === log.id ? { ...l, is_approved: true } : l));
        return;
      }
      const { error } = await withTimeout(
        supabase.from('daily_logs')
          .update({ is_approved: true, approved_by: user?.id, approved_at: new Date().toISOString() })
          .eq('id', log.id)
      );
      if (error) throw error;
      const updated = { ...log, is_approved: true, approved_by_name: profile?.full_name || null, approved_at: new Date().toISOString() };
      setCurrentLog(updated);
      setDayLogs(prev => prev.map(l => l.id === log.id ? updated : l));
      setCalendarLogs(prev => prev.map(l => l.id === log.id ? { ...l, is_approved: true } : l));
      // Gửi thông báo cho chủ nhật ký
      if (log.user_id) {
        const logDateStr = log.log_date
          ? new Date(log.log_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
          : '';
        sendNotification({
          title: 'Nhật ký của bạn đã được phê duyệt',
          body: `<p>Nhật ký${log.title ? ` <strong>"${log.title}"</strong>` : ''}${logDateStr ? ` ngày <strong>${logDateStr}</strong>` : ''} của bạn đã được phê duyệt bởi <strong>${profile?.full_name || 'Quản lý'}</strong>.</p>`,
          recipientId: log.user_id,
          senderId: user?.id,
        });
      }
    } catch (err) {
      setError('Lỗi phê duyệt: ' + err.message);
    } finally {
      setApproving(false);
    }
  };

  const handleRevoke = async () => {
    const log = currentLogRef.current;
    if (!log) return;
    if (!confirm(`Bạn có chắc muốn hủy phê duyệt nhật ký "${log.title || 'này'}" của ${getViewingUserName()} không?`)) return;
    setApproving(true);
    try {
      if (!isSupabaseConfigured) {
        const updated = { ...log, is_approved: false, approved_by_name: null, approved_at: null };
        saveMockLogs(prev => prev.map(l => l.id === log.id ? updated : l));
        setCurrentLog(updated);
        setDayLogs(prev => prev.map(l => l.id === log.id ? updated : l));
        setCalendarLogs(prev => prev.map(l => l.id === log.id ? { ...l, is_approved: false } : l));
        return;
      }
      const { error } = await withTimeout(
        supabase.from('daily_logs')
          .update({ is_approved: false, approved_by: null, approved_at: null })
          .eq('id', log.id)
      );
      if (error) throw error;
      const updated = { ...log, is_approved: false, approved_by_name: null, approved_at: null };
      setCurrentLog(updated);
      setDayLogs(prev => prev.map(l => l.id === log.id ? updated : l));
      setCalendarLogs(prev => prev.map(l => l.id === log.id ? { ...l, is_approved: false } : l));
    } catch (err) {
      setError('Lỗi hủy phê duyệt: ' + err.message);
    } finally {
      setApproving(false);
    }
  };

  // ─── Rich text ────────────────────────────────────────────────────────────────

  const execFormat = (command) => {
    document.execCommand(command, false, null);
    editorRef.current?.focus();
    handleEditorInput();
  };

  // ─── @ Mention logic ──────────────────────────────────────────────────────────

  const checkAtMention = () => {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) { setAtMentionOpen(false); return; }
    const textBefore = node.textContent.slice(0, range.startOffset);
    const atIdx = textBefore.lastIndexOf('@');
    if (atIdx === -1) { setAtMentionOpen(false); return; }
    const query = textBefore.slice(atIdx + 1);
    if (query.includes(' ') && query.length > 0) { setAtMentionOpen(false); return; }

    setAtMentionQuery(query);
    setAtMentionOpen(true);

    try {
      const rect = range.getBoundingClientRect();
      if (rect.top !== 0 || rect.left !== 0) {
        setAtMentionPos({
          top: rect.bottom + window.scrollY + 6,
          left: Math.min(rect.left + window.scrollX, window.innerWidth - 320),
        });
      }
    } catch { /* ignore positioning errors */ }
  };

  // Core chip insertion — places chip at current cursor, adds UC to relatedUCs list
  const doInsertUCChip = (uc) => {
    const chip = document.createElement('span');
    chip.className = 'uc-chip';
    chip.setAttribute('data-uc-id', uc.id);
    chip.setAttribute('data-uc-code', uc.code);
    chip.setAttribute('data-uc-name', uc.name);
    chip.setAttribute('contenteditable', 'false');
    chip.textContent = `@${uc.code}`;

    const sel = window.getSelection();
    if (sel?.rangeCount) {
      const range = sel.getRangeAt(0);
      range.insertNode(chip);
      range.setStartAfter(chip);
      range.setEndAfter(chip);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    document.execCommand('insertText', false, ' ');

    setRelatedUCs(prev => {
      if (prev.some(r => r.uc_id === uc.id)) return prev;
      return [...prev, { uc_id: uc.id, uc_code: uc.code, uc_name: uc.name, note: '' }];
    });
    triggerSave();
  };

  // Called from @ mention dropdown — removes the @query text first, then inserts chip
  const insertUCChip = (uc) => {
    // Snapshot cursor BEFORE focus() — một số browser reset selection khi focus() được gọi
    const sel0 = window.getSelection();
    const savedRange = sel0?.rangeCount ? sel0.getRangeAt(0).cloneRange() : null;

    setAtMentionOpen(false);
    editorRef.current?.focus();

    // Restore vị trí con trỏ đã snapshot (tránh nhảy lên dòng trên sau focus)
    if (savedRange) {
      try {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedRange);
      } catch {}
    }

    const selection = window.getSelection();
    if (selection?.rangeCount) {
      const range = selection.getRangeAt(0);
      const node = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        const atIdx = text.lastIndexOf('@', range.startOffset - 1);
        if (atIdx !== -1) {
          node.textContent = text.slice(0, atIdx) + text.slice(range.startOffset);
          const newRange = document.createRange();
          newRange.setStart(node, atIdx);
          newRange.setEnd(node, atIdx);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
    }
    doInsertUCChip(uc);
  };

  const handleEditorClick = (e) => {
    const chip = e.target.closest?.('.uc-chip');
    if (chip) {
      const ucId = chip.getAttribute('data-uc-id');
      const found = ucList.find(u => u.id === ucId);
      if (found) setUcDetailModal(found);
    }
  };

  const handleEditorMouseMove = (e) => {
    const chip = e.target.closest?.('.uc-chip');
    if (chip) {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
      const ucId = chip.getAttribute('data-uc-id');
      const found = ucList.find(u => u.id === ucId);
      if (found && (!ucTooltip || ucTooltip.uc.id !== ucId)) {
        tooltipTimerRef.current = setTimeout(() => {
          setUcTooltip({ uc: found, x: e.clientX, y: e.clientY });
        }, 350);
      }
      return;
    }
    if (ucTooltip) {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
      setUcTooltip(null);
    }
  };

  const handleEditorMouseLeave = () => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    setUcTooltip(null);
  };

  const handleEditorKeyDown = (e) => {
    if (atMentionOpen && e.key === 'Escape') {
      e.preventDefault();
      setAtMentionOpen(false);
    }
  };

  // Walk the editor DOM and extract the text segment after each @chip as the chip's UC note
  const extractNotesFromContent = () => {
    if (!editorRef.current) return;
    const segments = [];
    let current = null;

    const walk = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (current) current.text += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.classList?.contains('uc-chip')) {
          current = { ucId: node.getAttribute('data-uc-id'), text: '' };
          segments.push(current);
        } else {
          const isBlock = ['P', 'DIV', 'LI', 'BR'].includes(node.tagName);
          if (isBlock && current && current.text && !current.text.endsWith('\n')) {
            current.text += '\n';
          }
          node.childNodes.forEach(walk);
        }
      }
    };
    walk(editorRef.current);

    if (segments.length > 0) {
      setRelatedUCs(prev => prev.map(r => {
        const segs = segments.filter(s => s.ucId === r.uc_id);
        if (segs.length === 0) return r;
        // Use the text after the LAST occurrence of the chip (so @uc01 @uc01 hihi → "hihi")
        const note = segs[segs.length - 1].text.trim();
        return { ...r, note };
      }));
    }
  };

  const handlePopupDragStart = (e) => {
    isDraggingRef.current = true;
    dragOffsetRef.current = {
      x: e.clientX - ucListPopupPos.x,
      y: e.clientY - ucListPopupPos.y,
    };
    e.preventDefault();
  };

  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: popupSize.width,
      h: popupSize.height,
    };
  };

  const handleDeleteLog = async () => {
    const log = currentLogRef.current;
    if (!log || log.is_approved) return;
    if (!confirm(`Xóa nhật ký "${log.title || 'chưa đặt tiêu đề'}"? Thao tác này không thể hoàn tác.`)) return;

    // Cancel any pending auto-save so it doesn't restore the deleted log
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    try {
      const remaining = dayLogs.filter(l => l.id !== log.id);

      if (!isSupabaseConfigured) {
        saveMockLogs(prev => prev.filter(l => l.id !== log.id));
      } else {
        // Use .select() to detect silent RLS failures (0 rows deleted = missing DELETE policy)
        const { data: deletedRows, error } = await withTimeout(
          supabase.from('daily_logs').delete().eq('id', log.id).select('id')
        );
        if (error) throw error;
        if (!deletedRows || deletedRows.length === 0) {
          throw new Error('Database không xóa được bản ghi. Vui lòng thêm DELETE policy trong Supabase cho bảng daily_logs.');
        }
      }

      setDayLogs(remaining);
      setCurrentLog(remaining[0] || null);
      setCalendarLogs(prev => prev.filter(l => l.id !== log.id));
      setSaveStatus('saved');
      if (remaining.length === 0) {
        if (editorRef.current) editorRef.current.innerHTML = '';
        setLogTitle('');
        setRelatedUCs([]);
      }
    } catch (err) {
      setError('Lỗi xóa nhật ký: ' + err.message);
    }
  };

  // ─── UC status confirmation ──────────────────────────────────────────────────

  const UC_STATUS_TYPES = [
    { type: 'reviewed',      label: 'Đã rà soát',         fieldKey: 'reviewed_at',      managerOnly: false, activeClass: 'bg-violet-100 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400 border-violet-200/60 dark:border-violet-700/40', hoverClass: 'hover:bg-violet-50 dark:hover:bg-violet-950/20 hover:text-violet-500 dark:hover:text-violet-400 hover:border-violet-200 dark:hover:border-violet-700' },
    { type: 'docs_updated',  label: 'Đã cập nhật tài liệu',     fieldKey: 'docs_updated_at',  managerOnly: false, activeClass: 'bg-sky-100 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400 border-sky-200/60 dark:border-sky-700/40',           hoverClass: 'hover:bg-sky-50 dark:hover:bg-sky-950/20 hover:text-sky-500 dark:hover:text-sky-400 hover:border-sky-200 dark:hover:border-sky-700' },
    { type: 'dev_completed', label: 'Đã lập trình',        fieldKey: 'dev_completed_at', managerOnly: false, activeClass: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-700/40', hoverClass: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-500 dark:hover:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-700' },
    { type: 'doc_reviewed',  label: 'Review tài liệu',     fieldKey: 'doc_reviewed_at',  managerOnly: true,  activeClass: 'bg-rose-100 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 border-rose-200/60 dark:border-rose-700/40',  hoverClass: 'hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-700' },
  ];

  const handleConfirmUCStatus = async (ucId, statusType) => {
    const now = new Date().toISOString();
    const ucInfo = ucList.find(u => u.id === ucId);
    const fieldKey = `${statusType}_at`;
    const entry = {
      id: 'sl-' + Math.random().toString(36).substr(2, 9),
      uc_id: ucId,
      uc_code: ucInfo?.code || '',
      uc_name: ucInfo?.name || '',
      status_type: statusType,
      confirmed_at: now,
      confirmed_by_name: profile?.full_name || user?.email || 'Người dùng',
      log_date: selectedDate,
      log_title: logTitleRef.current || '',
    };

    // Update latest date map (synchronous localStorage save)
    setUcStatusMap(prev => {
      const next = { ...prev, [ucId]: { ...(prev[ucId] || {}), [fieldKey]: now } };
      try { localStorage.setItem('aerotask_uc_status', JSON.stringify(next)); } catch {}
      return next;
    });
    // Prepend to history log (synchronous localStorage save)
    setUcStatusLogs(prev => {
      const next = [entry, ...prev];
      try { localStorage.setItem('aerotask_uc_status_logs', JSON.stringify(next)); } catch {}
      return next;
    });

    if (isSupabaseConfigured) {
      try {
        await withTimeout(supabase.from('use_cases').update({ [fieldKey]: now }).eq('id', ucId));
        await withTimeout(supabase.from('uc_status_logs').insert({
          uc_id: ucId, status_type: statusType, confirmed_at: now,
          confirmed_by: user?.id, confirmed_by_name: profile?.full_name || null,
          log_id: currentLogRef.current?.id || null, log_date: selectedDate,
        }));
      } catch (err) { console.error('Lỗi lưu trạng thái UC:', err); }
    }
  };

  // ─── Calendar helpers ─────────────────────────────────────────────────────────

  const { year, month } = calendarMonth;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (() => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  })();

  // Aggregate status across all logs for a date: approved only if ALL are approved
  const getDateStatus = (dateStr) => {
    const logsForDate = calendarLogs.filter(l => l.log_date === dateStr);
    if (logsForDate.length === 0) return 'none';
    if (logsForDate.every(l => l.is_approved)) return 'approved';
    return 'pending';
  };

  const navigateMonth = (delta) => {
    setCalendarMonth(prev => {
      let m = prev.month + delta;
      let y = prev.year;
      if (m > 11) { m = 0; y++; }
      if (m < 0) { m = 11; y--; }
      return { year: y, month: m };
    });
  };

  const handleDateSelect = async (dateStr) => {
    if (saveStatus === 'unsaved') {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      await handleSave();
    }
    setSelectedDate(dateStr);
  };

  // ─── Computed values ──────────────────────────────────────────────────────────

  const isAdmin = role?.name === 'Admin';
  const isViewingOwnLogs = viewingUserId === 'self' || viewingUserId === user?.id;
  const isApproved = currentLog?.is_approved === true;
  const isEditable = isViewingOwnLogs && !isApproved && (canCreate || canUpdate);
  const canDeleteLog = isViewingOwnLogs && currentLog && !isApproved;
  // Admin can approve/revoke their own logs; managers can approve/revoke team members' logs
  const canApproveLog = currentLog && !isApproved && (
    (isManagerOrAdmin && !isViewingOwnLogs) || (isAdmin && isViewingOwnLogs)
  );
  const canRevokeLog = currentLog && isApproved && (
    (isManagerOrAdmin && !isViewingOwnLogs) || (isAdmin && isViewingOwnLogs)
  );

  const getViewingUserName = () => {
    if (isViewingOwnLogs) return profile?.full_name || 'Tôi';
    const members = isSupabaseConfigured ? teamMembers : MOCK_TEAM;
    return members.find(m => m.id === viewingUserId)?.full_name || 'Thành viên';
  };

  const filteredAtUCs = ucList.filter(uc => {
    // Lọc theo dự án nếu đang chọn dự án
    if (logProjectId && uc.project_id && uc.project_id !== logProjectId) return false;
    if (!atMentionQuery) return true;
    const q = atMentionQuery.toLowerCase();
    return (
      uc.code.toLowerCase().includes(q) ||
      uc.name.toLowerCase().includes(q) ||
      uc.description?.toLowerCase().includes(q) ||
      uc.ba_email?.toLowerCase().includes(q) ||
      uc.dev_email?.toLowerCase().includes(q)
    );
  }).slice(0, 10);

  const filteredPopupUCs = (() => {
    let result = ucList.filter(uc => {
      if (ucListFilterProject && uc.project_id !== ucListFilterProject) return false;
      if (ucListSearch) {
        const q = ucListSearch.toLowerCase();
        if (!uc.code.toLowerCase().includes(q) && !uc.name.toLowerCase().includes(q)) return false;
      }
      if (ucListFilters.description) {
        if (!uc.description?.toLowerCase().includes(ucListFilters.description.toLowerCase())) return false;
      }
      if (ucListFilters.actors) {
        if (!uc.actors?.toLowerCase().includes(ucListFilters.actors.toLowerCase())) return false;
      }
      if (ucListFilters.difficulty && uc.difficulty !== ucListFilters.difficulty) return false;
      if (ucListFilters.ba_email) {
        if (!uc.ba_email?.toLowerCase().includes(ucListFilters.ba_email.toLowerCase())) return false;
      }
      if (ucListFilters.dev_email) {
        if (!uc.dev_email?.toLowerCase().includes(ucListFilters.dev_email.toLowerCase())) return false;
      }
      return true;
    });
    result = [...result].sort((a, b) => {
      const va = (a[ucListSortBy] || '').toString().toLowerCase();
      const vb = (b[ucListSortBy] || '').toString().toLowerCase();
      return ucListSortOrder === 'asc' ? va.localeCompare(vb, 'vi') : vb.localeCompare(va, 'vi');
    });
    return result;
  })();

  const ucListTotalPages = ucListPageSize === 0
    ? 1
    : Math.max(1, Math.ceil(filteredPopupUCs.length / ucListPageSize));
  const paginatedUCs = ucListPageSize === 0
    ? filteredPopupUCs
    : filteredPopupUCs.slice((ucListPage - 1) * ucListPageSize, ucListPage * ucListPageSize);

  const toggleUCListSort = (field) => {
    if (ucListSortBy === field) setUcListSortOrder(p => p === 'asc' ? 'desc' : 'asc');
    else { setUcListSortBy(field); setUcListSortOrder('asc'); }
  };

  const ucDifficultyStyle = (d) => {
    if (d === 'Phức tạp') return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/40';
    if (d === 'Trung bình') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40';
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40';
  };

  // ─── JSX ──────────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <style>{`
        .daily-log-editor ul { list-style: disc; padding-left: 1.25rem; }
        .daily-log-editor ol { list-style: decimal; padding-left: 1.25rem; }
        .daily-log-editor li { margin: 0.15rem 0; }
        .daily-log-editor p { margin: 0.2rem 0; }
        .daily-log-editor strong { font-weight: 700; }
        .daily-log-editor em { font-style: italic; }
        .daily-log-editor u { text-decoration: underline; }
        .daily-log-editor s { text-decoration: line-through; }
        .daily-log-editor[contenteditable="true"]:empty::before {
          content: 'Nhập nội dung chi tiết... (gõ @ để gắn Use Case)';
          color: #94a3b8; pointer-events: none;
        }
        .dark .daily-log-editor[contenteditable="true"]:empty::before { color: #475569; }
        .uc-chip {
          display: inline-flex; align-items: center;
          background: #eef2ff; color: #4f46e5;
          border: 1px solid #c7d2fe; border-radius: 5px;
          padding: 1px 6px; font-size: 11px; font-weight: 700;
          cursor: pointer; user-select: none; margin: 0 2px;
          transition: background 0.15s;
        }
        .uc-chip:hover { background: #e0e7ff; }
        .dark .uc-chip {
          background: rgba(49,46,129,0.35); color: #a5b4fc;
          border-color: rgba(99,102,241,0.35);
        }
        .dark .uc-chip:hover { background: rgba(49,46,129,0.6); }
      `}</style>

      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 dark:from-white dark:via-slate-100 dark:to-indigo-100 bg-clip-text text-transparent">
              Nhật ký hàng ngày
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Ghi chép công việc mỗi ngày — có thể tạo nhiều nhật ký cho một ngày. Gõ{' '}
              <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs font-bold text-indigo-600 dark:text-indigo-400">@</code>{' '}
              trong nội dung để gắn Use Case.
            </p>
          </div>

          {/* Team member selector */}
          {isManagerOrAdmin && (
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                disabled={teamLoading}
                className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-600 focus:outline-none transition-colors cursor-pointer disabled:opacity-50"
              >
                <Users className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="font-medium max-w-[160px] truncate">
                  {viewingUserId === 'self' ? 'Nhật ký của tôi' : getViewingUserName()}
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden w-[300px]">
                  <button
                    onClick={() => { setViewingUserId('self'); setDropdownOpen(false); }}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors text-left ${viewingUserId === 'self' ? 'bg-indigo-50 dark:bg-indigo-950/30' : ''}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {(profile?.full_name || 'T').charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{profile?.full_name || 'Tôi'}</p>
                        <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-medium">Nhật ký của tôi</p>
                      </div>
                    </div>
                    {viewingUserId === 'self' && <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                  </button>

                  {(isSupabaseConfigured ? teamMembers : MOCK_TEAM).length > 0 && (
                    <>
                      <div className="mx-4 border-t border-slate-100 dark:border-slate-900" />
                      <p className="px-4 pt-2.5 pb-1 text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                        Thành viên — {formatDisplayDate(selectedDate).split(',')[0]}
                      </p>
                    </>
                  )}

                  <div className="pb-1.5">
                    {(isSupabaseConfigured ? teamMembers : MOCK_TEAM).map(m => {
                      const logStatus = teamLogsForDate[m.id] || 'none';
                      const isViewing = viewingUserId === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => { setViewingUserId(m.id); setDropdownOpen(false); }}
                          className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors text-left ${isViewing ? 'bg-indigo-50 dark:bg-indigo-950/30' : ''}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-slate-300 to-slate-500 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                              {m.full_name.charAt(0)}
                            </div>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{m.full_name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {logStatus === 'approved' && <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 font-bold border border-emerald-200/60 dark:border-emerald-800/50">Đã duyệt</span>}
                            {logStatus === 'pending' && <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 font-bold border border-amber-200/60 dark:border-amber-800/50">Chờ duyệt</span>}
                            {logStatus === 'none' && <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800/60 dark:text-slate-500 font-semibold border border-slate-200/60 dark:border-slate-700/60">Chưa ghi</span>}
                            {isViewing && <Check className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs p-4 rounded-2xl flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">

          {/* ── Calendar ── */}
          <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 p-5 lg:sticky lg:top-6">
            <div className="flex items-center justify-between mb-5">
              <button onClick={() => navigateMonth(-1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">{MONTH_NAMES[month]} {year}</h2>
              <button onClick={() => navigateMonth(1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 mb-1">
              {WEEK_DAYS.map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase py-1.5">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const status = getDateStatus(dateStr);
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                // Count logs for the dot indicator
                const logsCount = calendarLogs.filter(l => l.log_date === dateStr).length;
                return (
                  <button
                    key={day}
                    onClick={() => handleDateSelect(dateStr)}
                    className={[
                      'h-9 w-full flex flex-col items-center justify-center rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer relative',
                      isSelected && status === 'approved' ? 'bg-emerald-500 text-white ring-2 ring-inset ring-indigo-600 shadow-sm'
                        : isSelected && status === 'pending' ? 'bg-amber-400 text-white ring-2 ring-inset ring-indigo-600 shadow-sm'
                        : isSelected ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                        : isToday && status === 'approved' ? 'ring-2 ring-inset ring-indigo-500 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : isToday && status === 'pending' ? 'ring-2 ring-inset ring-indigo-500 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                        : isToday ? 'ring-2 ring-inset ring-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
                        : status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/40'
                        : status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/40'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/70 hover:text-slate-800 dark:hover:text-white'
                    ].join(' ')}
                  >
                    {day}
                    {logsCount > 1 && (
                      <span className={`absolute bottom-0.5 right-1 text-[8px] font-black leading-none ${isSelected ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'}`}>
                        ×{logsCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="h-6 w-6 rounded-md bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300/60 dark:border-emerald-700/50 shrink-0" />
                Tất cả đã phê duyệt
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="h-6 w-6 rounded-md bg-amber-100 dark:bg-amber-900/30 border border-amber-300/60 dark:border-amber-700/50 shrink-0" />
                Chờ phê duyệt
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="h-6 w-6 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shrink-0" />
                Chưa có ghi chú
              </div>
            </div>
          </div>

          {/* ── Note editor panel ── */}
          <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col min-w-0 overflow-hidden">

            {/* Panel header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <CalendarDays className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{formatDisplayDate(selectedDate)}</p>
                  {!isViewingOwnLogs && <p className="text-xs text-slate-400 dark:text-slate-500">Nhật ký của: {getViewingUserName()}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                {/* UC list toggle button */}
                <button
                  onClick={() => {
                    if (!ucListPopupOpen) setUcListFilterProject(logProjectId);
                    setUcListPopupOpen(p => !p);
                  }}
                  title="Danh sách Use Cases"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    ucListPopupOpen
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-600'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:block">Danh sách UC</span>
                </button>

                {currentLog && (
                  isApproved ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle className="h-3 w-3" /> Đã phê duyệt
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" /> Chờ phê duyệt
                    </span>
                  )
                )}
                {isEditable && (
                  <span className={`text-[10px] font-medium ${saveStatus === 'saving' ? 'text-indigo-500' : saveStatus === 'unsaved' ? 'text-amber-500' : saveStatus === 'error' ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'}`}>
                    {saveStatus === 'saving'
                      ? <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Đang lưu...</span>
                      : saveStatus === 'error' ? 'Vui lòng chọn Dự án trước khi lưu'
                      : saveStatus === 'unsaved' ? 'Chưa lưu'
                      : savedAt ? `Đã lưu ${savedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : ''}
                  </span>
                )}
                {/* Delete button — only for own unapproved logs */}
                {canDeleteLog && (
                  <button
                    onClick={handleDeleteLog}
                    title="Xóa nhật ký này"
                    className="p-1.5 rounded-lg text-slate-300 dark:text-slate-700 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Log tabs — navigate between multiple logs for the day */}
            {(dayLogs.length > 0 || (isEditable && currentLog === null)) && (
              <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto bg-slate-50/40 dark:bg-slate-950/10">
                {dayLogs.map((log, idx) => (
                  <button
                    key={log.id}
                    onClick={() => handleSwitchLog(log)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer max-w-[160px] ${
                      currentLog?.id === log.id
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {log.is_approved
                      ? <CheckCircle className={`h-3 w-3 shrink-0 ${currentLog?.id === log.id ? 'text-emerald-300' : 'text-emerald-500'}`} />
                      : <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${currentLog?.id === log.id ? 'bg-white/60' : 'bg-amber-400'}`} />
                    }
                    <span className="truncate">{log.title || `Nhật ký ${idx + 1}`}</span>
                  </button>
                ))}

                {isEditable && (
                  currentLog === null ? (
                    <span className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white shadow-sm shadow-indigo-600/20">
                      <Plus className="h-3 w-3 shrink-0" />
                      Nhật ký mới
                    </span>
                  ) : (
                    <button
                      onClick={handleNewLog}
                      title="Tạo nhật ký mới cho ngày này"
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all cursor-pointer"
                    >
                      <Plus className="h-3 w-3 shrink-0" />
                      Thêm nhật ký
                    </button>
                  )
                )}
              </div>
            )}

            {/* Approve / revoke bar — above title */}
            {(canApproveLog || canRevokeLog) && (
              <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/20">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {canApproveLog
                    ? isViewingOwnLogs
                      ? <>Phê duyệt nhật ký <strong>"{currentLog?.title || 'chưa đặt tiêu đề'}"</strong> của bạn.</>
                      : <>Xem xét nhật ký <strong>"{currentLog?.title || 'chưa đặt tiêu đề'}"</strong> của <strong>{getViewingUserName()}</strong> và phê duyệt nếu đạt yêu cầu.</>
                    : isViewingOwnLogs
                      ? <>Nhật ký này đã được phê duyệt. Hủy phê duyệt để chỉnh sửa lại.</>
                      : <>Nhật ký <strong>"{currentLog?.title || 'chưa đặt tiêu đề'}"</strong> của <strong>{getViewingUserName()}</strong> đã phê duyệt.</>
                  }
                </p>
                {canApproveLog && (
                  <button onClick={handleApprove} disabled={approving} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer shrink-0">
                    {approving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang xử lý...</> : <><Check className="h-3.5 w-3.5" /> Phê duyệt nhật ký</>}
                  </button>
                )}
                {canRevokeLog && (
                  <button onClick={handleRevoke} disabled={approving} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm shadow-rose-600/20 disabled:opacity-50 transition-all cursor-pointer shrink-0">
                    {approving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang xử lý...</> : 'Hủy phê duyệt'}
                  </button>
                )}
              </div>
            )}

            {/* Title field */}
            <div className="px-5 pt-4 pb-3">
              {isEditable ? (
                <input
                  type="text"
                  value={logTitle}
                  onChange={handleTitleChange}
                  placeholder="Tiêu đề nhật ký..."
                  className="w-full text-base font-bold text-slate-800 dark:text-slate-100 bg-transparent border-b border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 pb-2 placeholder:text-slate-300 dark:placeholder:text-slate-700 transition-colors"
                />
              ) : logTitle ? (
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">{logTitle}</h2>
              ) : null}
            </div>

            {/* Project / Sprint / Task selector */}
            {(isEditable || logProjectId) && (
              <div className="px-5 pb-3 flex flex-col gap-2">
                {isEditable ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <FolderKanban className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
                    {/* Dự án — bắt buộc */}
                    <select
                      value={logProjectId}
                      onChange={(e) => { setLogProjectId(e.target.value); setLogSprintId(''); setLogTaskId(''); triggerSave(); }}
                      className={`text-xs px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border rounded-lg text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer ${
                        !logProjectId ? 'border-rose-400 dark:border-rose-600 text-rose-500' : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <option value="">-- Chọn dự án (bắt buộc) --</option>
                      {projects.map(p => <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>)}
                    </select>
                    {/* Sprint */}
                    {logProjectId && (
                      <select
                        value={logSprintId}
                        onChange={(e) => { setLogSprintId(e.target.value); triggerSave(); }}
                        className="text-xs px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
                      >
                        <option value="">Chưa chọn sprint</option>
                        {allSprints.filter(s => s.project_id === logProjectId).map(s => <option key={s.id} value={s.id}>[{s.code}] {s.name}</option>)}
                      </select>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <FolderKanban className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                      {projects.find(p => p.id === logProjectId)?.name || ''}
                      {logSprintId && ` — ${allSprints.find(s => s.id === logSprintId)?.name || ''}`}
                    </span>
                  </div>
                )}

                {/* Công việc (Task) */}
                {isEditable && logProjectId && (
                  <div className="flex items-center gap-2 flex-wrap pl-5">
                    <CheckSquare className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
                    {availableTasks.length > 0 ? (
                      <select
                        value={logTaskId}
                        onChange={(e) => { setLogTaskId(e.target.value); triggerSave(); }}
                        className="text-xs px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer max-w-xs"
                      >
                        <option value="">Không gắn công việc</option>
                        {availableTasks.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.title}{t.due_date ? ` (hạn ${t.due_date.substring(5)})` : ''}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[11px] text-slate-400 dark:text-slate-600 italic">Không có công việc nào được giao trong dự án này</span>
                    )}
                    {!isEditable && logTaskId && (
                      <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {availableTasks.find(t => t.id === logTaskId)?.title || ''}
                      </span>
                    )}
                  </div>
                )}
                {!isEditable && logTaskId && (() => {
                  const t = availableTasks.find(t => t.id === logTaskId);
                  return t ? (
                    <div className="flex items-center gap-2 pl-5">
                      <CheckSquare className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
                      <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{t.title}</span>
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            {/* Toolbar */}
            {isEditable && (
              <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-0.5 flex-wrap bg-slate-50/60 dark:bg-slate-950/20">
                {[
                  { cmd: 'bold', icon: <Bold className="h-3.5 w-3.5" />, title: 'Đậm (Ctrl+B)' },
                  { cmd: 'italic', icon: <Italic className="h-3.5 w-3.5" />, title: 'Nghiêng (Ctrl+I)' },
                  { cmd: 'underline', icon: <Underline className="h-3.5 w-3.5" />, title: 'Gạch chân (Ctrl+U)' },
                  { cmd: 'strikeThrough', icon: <Strikethrough className="h-3.5 w-3.5" />, title: 'Gạch ngang' },
                  null,
                  { cmd: 'insertUnorderedList', icon: <List className="h-3.5 w-3.5" />, title: 'Danh sách dấu chấm' },
                  { cmd: 'insertOrderedList', icon: <ListOrdered className="h-3.5 w-3.5" />, title: 'Danh sách đánh số' },
                  null,
                  { cmd: 'removeFormat', icon: <Eraser className="h-3.5 w-3.5" />, title: 'Xóa định dạng' },
                ].map((item, idx) =>
                  item === null ? (
                    <div key={`sep-${idx}`} className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
                  ) : (
                    <button
                      key={item.cmd}
                      onMouseDown={(e) => { e.preventDefault(); execFormat(item.cmd); }}
                      title={item.title}
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      {item.icon}
                    </button>
                  )
                )}
              </div>
            )}

            {/* Approval banner */}
            {isApproved && currentLog?.approved_by_name && (
              <div className="px-5 py-2.5 bg-emerald-50/60 dark:bg-emerald-950/10 border-b border-emerald-200/50 dark:border-emerald-900/20 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                Đã được <strong className="mx-1">{currentLog.approved_by_name}</strong> phê duyệt lúc{' '}
                {new Date(currentLog.approved_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            )}

            {/* Editor content */}
            <div className="relative" style={{ minHeight: 260 }}>
              {logLoading ? (
                <div className="absolute inset-0 flex items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-xs">Đang tải...</span>
                </div>
              ) : (
                <div
                  ref={editorRef}
                  contentEditable={isEditable}
                  suppressContentEditableWarning={true}
                  onInput={handleEditorInput}
                  onKeyDown={handleEditorKeyDown}
                  onClick={handleEditorClick}
                  onMouseMove={handleEditorMouseMove}
                  onMouseLeave={handleEditorMouseLeave}
                  onPaste={(e) => {
                    e.preventDefault();
                    const text = e.clipboardData.getData('text/plain');
                    document.execCommand('insertText', false, text);
                  }}
                  className={`daily-log-editor w-full p-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300 outline-none ${isEditable ? 'cursor-text' : 'cursor-default select-text'}`}
                  style={{ minHeight: 260 }}
                />
              )}
              {!logLoading && !currentLog && !isEditable && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-300 dark:text-slate-700 pointer-events-none">
                  <CalendarDays className="h-10 w-10" />
                  <p className="text-sm font-medium">Chưa có nhật ký nào cho ngày này</p>
                </div>
              )}
            </div>

            {/* Related UCs section */}
            {(relatedUCs.length > 0 || isEditable) && (
              <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                    <FileText className="h-3 w-3" />
                    Use Cases liên quan ({relatedUCs.length})
                  </span>
                  {isEditable && (
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <span className="text-[10px] text-slate-400 dark:text-slate-600 italic hidden sm:block">
                        Gõ <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded font-bold text-indigo-600 dark:text-indigo-400 not-italic">@</code> để thêm
                      </span>
                      {/* Manual re-extract button */}
                      <button
                        onClick={() => extractNotesFromContent()}
                        title="Cập nhật lại ghi chú UC từ nội dung hiện tại"
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer select-none bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Cập nhật nội dung UC
                      </button>
                      <button
                        onClick={() => setAutoExtractNotes(p => !p)}
                        title={autoExtractNotes ? 'Đang bật: ghi chú UC tự động trích xuất từ nội dung. Nhấn để tắt.' : 'Đang tắt: ghi chú UC nhập tay. Nhấn để bật tự động.'}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer select-none ${
                          autoExtractNotes
                            ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full transition-colors ${autoExtractNotes ? 'bg-indigo-500' : 'bg-slate-400 dark:bg-slate-600'}`} />
                        Tự động trích ghi chú
                      </button>
                    </div>
                  )}
                </div>

                {relatedUCs.length > 0 ? (
                  <div className="space-y-2">
                    {relatedUCs.map((item) => {
                      const ucInfo = ucList.find(u => u.id === item.uc_id);
                      return (
                        <div key={item.uc_id} className="flex items-start gap-2.5 p-2.5 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl group">
                          <button
                            onClick={() => ucInfo && setUcDetailModal(ucInfo)}
                            title="Xem chi tiết Use Case"
                            className="shrink-0 mt-0.5"
                          >
                            <span className="inline-flex items-center px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-md text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors cursor-pointer">
                              @{item.uc_code}
                            </span>
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">{item.uc_name}</p>
                            {isEditable ? (
                              <input
                                type="text"
                                value={item.note}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setRelatedUCs(prev => prev.map(r => r.uc_id === item.uc_id ? { ...r, note: val } : r));
                                  triggerSave();
                                }}
                                placeholder="Ghi chú cho UC này..."
                                className="w-full mt-1 text-[11px] bg-transparent text-slate-500 dark:text-slate-400 focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700 border-b border-transparent focus:border-indigo-300 dark:focus:border-indigo-700 pb-0.5 transition-colors"
                              />
                            ) : (
                              item.note && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 italic">{item.note}</p>
                            )}
                            {/* UC status confirmation buttons */}
                            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                              {UC_STATUS_TYPES.map(btn => {
                                const confirmedAt = ucStatusMap[item.uc_id]?.[btn.fieldKey];
                                // Manager-only button: hide entirely from non-managers when not yet confirmed
                                if (btn.managerOnly && !isManagerOrAdmin && !confirmedAt) return null;
                                const canClick = isEditable && (!btn.managerOnly || isManagerOrAdmin);
                                const shortDate = confirmedAt
                                  ? new Date(confirmedAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                  : null;
                                return (
                                  <button
                                    key={btn.type}
                                    onClick={() => canClick && handleConfirmUCStatus(item.uc_id, btn.type)}
                                    title={confirmedAt
                                      ? `${btn.label}: ${new Date(confirmedAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}${canClick ? '. Nhấn để cập nhật.' : ''}`
                                      : canClick ? `Xác nhận ${btn.label.toLowerCase()}` : btn.label
                                    }
                                    className={`inline-flex items-center gap-0.5 text-[9px] px-2 py-0.5 rounded-full border font-bold transition-all select-none ${canClick ? 'cursor-pointer' : 'cursor-default'} ${
                                      confirmedAt
                                        ? btn.activeClass
                                        : `bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-700 ${canClick ? btn.hoverClass : ''}`
                                    }`}
                                  >
                                    {btn.managerOnly && <span className="mr-0.5 opacity-60">★</span>}
                                    {confirmedAt ? '✓' : '○'} {btn.label}
                                    {shortDate && <span className="opacity-70 font-normal ml-0.5">{shortDate}</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          {isEditable && (
                            <button
                              onClick={() => {
                                setRelatedUCs(prev => prev.filter(r => r.uc_id !== item.uc_id));
                                triggerSave();
                              }}
                              className="p-1 rounded-md text-slate-300 dark:text-slate-700 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer shrink-0 mt-0.5"
                              title="Xóa UC khỏi danh sách"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  isEditable && (
                    <p className="text-[11px] text-slate-300 dark:text-slate-700 italic py-1">
                      Chưa có Use Case nào được liên kết.
                    </p>
                  )
                )}
              </div>
            )}

            {/* Related Links section */}
            {(relatedLinks.length > 0 || isEditable) && (
              <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                    <Link2 className="h-3 w-3" />
                    Tài liệu liên quan ({relatedLinks.length})
                  </span>
                  {isEditable && (
                    <button
                      onClick={() => {
                        const newLink = { id: 'lk-' + Math.random().toString(36).substr(2, 9), url: '', label: '' };
                        setRelatedLinks(prev => [...prev, newLink]);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all cursor-pointer"
                    >
                      <Plus className="h-3 w-3" /> Thêm link
                    </button>
                  )}
                </div>

                {relatedLinks.length > 0 ? (
                  <div className="space-y-2.5">
                    {relatedLinks.map((link) => (
                      <div key={link.id} className="group">
                        {isEditable ? (
                          <div className="flex items-center gap-2">
                            <Link2 className="h-3.5 w-3.5 text-indigo-400 dark:text-indigo-500 shrink-0" />
                            <input
                              type="text"
                              value={link.label}
                              onChange={(e) => {
                                const val = e.target.value;
                                setRelatedLinks(prev => prev.map(l => l.id === link.id ? { ...l, label: val } : l));
                                triggerSave();
                              }}
                              placeholder="Mô tả tài liệu..."
                              className="w-2/5 min-w-0 text-[11px] px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                            />
                            <input
                              type="url"
                              value={link.url}
                              onChange={(e) => {
                                const val = e.target.value;
                                setRelatedLinks(prev => prev.map(l => l.id === link.id ? { ...l, url: val } : l));
                                triggerSave();
                              }}
                              placeholder="https://..."
                              className="flex-1 min-w-0 text-[11px] px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                            />
                            {link.url && (
                              <button
                                type="button"
                                onClick={() => setLinkConfirmTarget({ url: link.url, label: link.label })}
                                className="p-1 rounded-md text-indigo-400 dark:text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors cursor-pointer shrink-0"
                                title="Mở liên kết"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => { setRelatedLinks(prev => prev.filter(l => l.id !== link.id)); triggerSave(); }}
                              className="p-1 rounded-md text-slate-300 dark:text-slate-700 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer shrink-0"
                              title="Xóa link"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 min-w-0">
                            <Link2 className="h-3.5 w-3.5 text-indigo-400 dark:text-indigo-500 shrink-0" />
                            {link.url ? (
                              <button
                                type="button"
                                onClick={() => setLinkConfirmTarget({ url: link.url, label: link.label })}
                                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer truncate"
                              >
                                {link.label || link.url}
                              </button>
                            ) : (
                              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                                {link.label}
                              </span>
                            )}
                            {link.label && link.url && (
                              <span className="text-[11px] text-slate-400 dark:text-slate-600 truncate min-w-0 flex-1">— {link.url}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  isEditable && (
                    <p className="text-[11px] text-slate-300 dark:text-slate-700 italic py-1">
                      Chưa có tài liệu liên kết nào. Nhấn "Thêm link" để thêm.
                    </p>
                  )
                )}
              </div>
            )}

            {/* Comments section */}
            {currentLog && (
              <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="h-3 w-3" />
                  Bình luận ({logComments.length})
                </span>

                {commentsLoading ? (
                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-600 py-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span className="text-[11px]">Đang tải bình luận...</span>
                  </div>
                ) : (
                  <>
                    {/* Danh sách bình luận */}
                    {logComments.length > 0 && (
                      <div className="space-y-2.5">
                        {logComments.map(comment => (
                          <div key={comment.id} className="flex gap-2.5 group">
                            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5 select-none">
                              {comment.author_name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-900/60 rounded-xl px-3 py-2">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{comment.author_name}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[10px] text-slate-400 dark:text-slate-600">{formatCommentTime(comment.created_at)}</span>
                                  {comment.user_id === user?.id && (
                                    <button
                                      onClick={() => deleteComment(comment.id)}
                                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-300 dark:text-slate-700 hover:text-rose-500 dark:hover:text-rose-400 transition-all cursor-pointer"
                                      title="Xóa bình luận"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-[12px] text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Ô nhập bình luận mới */}
                    <div className="flex gap-2.5 pt-1">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5 select-none">
                        {profile?.full_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                              e.preventDefault();
                              submitComment();
                            }
                          }}
                          placeholder="Thêm bình luận... (Ctrl+Enter để gửi)"
                          rows={2}
                          className="w-full text-[12px] px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 focus:border-indigo-400 dark:focus:border-indigo-600 resize-none transition-colors"
                        />
                        {newComment.trim() && (
                          <div className="flex justify-end mt-1.5">
                            <button
                              onClick={submitComment}
                              disabled={commentSubmitting}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition-all shadow-sm shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                            >
                              {commentSubmitting
                                ? <><Loader2 className="h-3 w-3 animate-spin" /> Đang gửi...</>
                                : <><Send className="h-3 w-3" /> Gửi</>
                              }
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

          </div>

        </div>
      </div>

      {/* ── Link confirmation popup ── */}
      {linkConfirmTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-500/15 backdrop-blur-md" onClick={() => setLinkConfirmTarget(null)} />
          <div className="relative z-10 w-full max-w-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 animate-scale-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <ExternalLink className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Mở liên kết ngoài</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Bạn có muốn mở liên kết này không?</p>
              </div>
            </div>
            {linkConfirmTarget.label && (
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{linkConfirmTarget.label}</p>
            )}
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono break-all bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl px-3 py-2 mb-5">
              {normalizeUrl(linkConfirmTarget.url)}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setLinkConfirmTarget(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-sm font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  window.open(normalizeUrl(linkConfirmTarget.url), '_blank', 'noopener,noreferrer');
                  setLinkConfirmTarget(null);
                }}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Mở tab mới
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── @ Mention dropdown ── */}
      {atMentionOpen && (
        <div
          ref={atMentionRef}
          className="fixed z-[60] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-[300px] overflow-hidden"
          style={{ top: atMentionPos.top, left: atMentionPos.left }}
        >
          <div className="p-2 border-b border-slate-100 dark:border-slate-900">
            <input
              ref={atSearchInputRef}
              type="text"
              value={atMentionQuery}
              onChange={(e) => setAtMentionQuery(e.target.value)}
              placeholder="Tìm Use Case, BA liên quan..."
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
            />
          </div>
          {logProjectId && (
            <div className="px-3 pt-1.5 pb-0.5">
              <span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">
                Lọc theo dự án: {projects.find(p => p.id === logProjectId)?.code}
              </span>
            </div>
          )}
          <div className="max-h-[260px] overflow-y-auto py-1">
            {filteredAtUCs.length === 0 ? (
              <p className="px-4 py-3 text-xs text-slate-400 dark:text-slate-600 italic text-center">Không tìm thấy Use Case nào</p>
            ) : filteredAtUCs.map(uc => {
              const q = atMentionQuery.toLowerCase();
              const matchBA = q && uc.ba_email?.toLowerCase().includes(q);
              const matchDev = q && uc.dev_email?.toLowerCase().includes(q);
              const matchDesc = q && uc.description?.toLowerCase().includes(q);
              return (
                <button
                  key={uc.id}
                  onMouseDown={(e) => { e.preventDefault(); insertUCChip(uc); editorRef.current?.focus(); }}
                  className="w-full flex items-start gap-2.5 px-3.5 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors text-left cursor-pointer"
                >
                  <span className="shrink-0 mt-0.5 text-[9px] font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                    {uc.code}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{uc.name}</p>
                    {matchDesc && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5 italic">{uc.description}</p>
                    )}
                    {(matchBA || matchDev) && (
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {matchBA && <span className="text-[9px] bg-violet-500/10 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded font-bold">BA: {uc.ba_email}</span>}
                        {matchDev && <span className="text-[9px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-bold">Dev: {uc.dev_email}</span>}
                      </div>
                    )}
                    {!matchDesc && !matchBA && !matchDev && uc.actors && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{uc.actors}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── UC Detail Modal ── */}
      {ucDetailModal && (() => {
        const ucId = ucDetailModal.id;
        const localStatus = ucStatusMap[ucId] || {};
        const fmtDt = (v) => v
          ? new Date(v).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : null;
        const reviewedAt     = fmtDt(localStatus.reviewed_at      || ucDetailModal.reviewed_at);
        const docsUpdatedAt  = fmtDt(localStatus.docs_updated_at  || ucDetailModal.docs_updated_at);
        const devCompletedAt = fmtDt(localStatus.dev_completed_at || ucDetailModal.dev_completed_at);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-500/15 backdrop-blur-md" onClick={() => setUcDetailModal(null)} />
            <div className="glass-panel w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative z-10 bg-white/95 dark:bg-slate-900/95 animate-scale-up">
              <button
                onClick={() => setUcDetailModal(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{ucDetailModal.code}</span>
                    {ucDetailModal.difficulty && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${ucDetailModal.difficulty === 'Phức tạp' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' : ucDetailModal.difficulty === 'Trung bình' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'}`}>{ucDetailModal.difficulty}</span>
                    )}
                    {ucDetailModal.bmt && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20">BMT: {ucDetailModal.bmt}</span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">{ucDetailModal.name}</h3>
                </div>
              </div>

              <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                {ucDetailModal.description && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mô tả nghiệp vụ</span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/40 select-text">
                      {ucDetailModal.description}
                    </p>
                  </div>
                )}

                {ucDetailModal.actors && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tác nhân liên quan</span>
                    <div className="flex flex-wrap gap-1.5">
                      {ucDetailModal.actors.split(',').map((a, i) => (
                        <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-medium">
                          {a.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(ucDetailModal.ba_email || ucDetailModal.dev_email) && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">BA phụ trách</span>
                      {ucDetailModal.ba_email ? (
                        <div className="flex items-center gap-2 bg-violet-500/5 border border-violet-500/15 p-2 rounded-xl">
                          <span className="text-[9px] font-black text-violet-600 dark:text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded shrink-0">BA</span>
                          <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">{ucDetailModal.ba_email}</p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Chưa phân công</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dev phụ trách</span>
                      {ucDetailModal.dev_email ? (
                        <div className="flex items-center gap-2 bg-indigo-500/5 border border-indigo-500/15 p-2 rounded-xl">
                          <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded shrink-0">Dev</span>
                          <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">{ucDetailModal.dev_email}</p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Chưa phân công</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Trạng thái tiến độ */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trạng thái tiến độ</span>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { label: 'Rà soát', date: reviewedAt, activeClass: 'bg-violet-500/8 border-violet-500/20 text-violet-700 dark:text-violet-300', dotClass: 'bg-violet-500', emptyClass: 'text-slate-400 dark:text-slate-600' },
                      { label: 'Cập nhật tài liệu', date: docsUpdatedAt, activeClass: 'bg-sky-500/8 border-sky-500/20 text-sky-700 dark:text-sky-300', dotClass: 'bg-sky-500', emptyClass: 'text-slate-400 dark:text-slate-600' },
                      { label: 'Lập trình hoàn thành', date: devCompletedAt, activeClass: 'bg-emerald-500/8 border-emerald-500/20 text-emerald-700 dark:text-emerald-300', dotClass: 'bg-emerald-500', emptyClass: 'text-slate-400 dark:text-slate-600' },
                    ].map(({ label, date, activeClass, dotClass, emptyClass }) => (
                      <div key={label} className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs ${date ? activeClass + ' border' : 'border-slate-200 dark:border-slate-800'}`}>
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full shrink-0 ${date ? dotClass : 'bg-slate-300 dark:bg-slate-700'}`} />
                          <span className={`font-semibold ${date ? '' : emptyClass}`}>{label}</span>
                        </div>
                        {date
                          ? <span className="text-[10px] font-mono opacity-80">{date}</span>
                          : <span className="text-[10px] italic text-slate-400 dark:text-slate-600">Chưa xác nhận</span>
                        }
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 text-right">
                <button
                  onClick={() => setUcDetailModal(null)}
                  className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Floating UC List Popup (draggable, with table + filters) ── */}
      {ucListPopupOpen && (
        <div
          className="fixed z-[65] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden select-none flex flex-col"
          style={{ left: ucListPopupPos.x, top: ucListPopupPos.y, width: Math.min(popupSize.width, window.innerWidth - 40), height: Math.min(popupSize.height, window.innerHeight - 40) }}
        >
          {/* Drag handle header */}
          <div
            onMouseDown={handlePopupDragStart}
            className="flex items-center justify-between px-3.5 py-2.5 bg-indigo-600 text-white cursor-grab active:cursor-grabbing shrink-0"
          >
            <div className="flex items-center gap-2">
              <GripVertical className="h-3.5 w-3.5 opacity-60 shrink-0" />
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs font-bold">
                Danh sách Use Cases
                <span className="ml-1.5 text-indigo-200 font-normal">
                  {filteredPopupUCs.length !== ucList.length ? `${filteredPopupUCs.length}/${ucList.length}` : ucList.length}
                </span>
              </span>
            </div>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setUcListPopupOpen(false)}
              className="p-1 rounded-md hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Search + project filter bar */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-900 shrink-0 flex flex-col gap-1.5">
            <input
              type="text"
              value={ucListSearch}
              onChange={(e) => setUcListSearch(e.target.value)}
              placeholder="Tìm nhanh theo mã hoặc tên UC..."
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
            />
            {projects.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0">Dự án:</span>
                <select
                  value={ucListFilterProject}
                  onChange={(e) => setUcListFilterProject(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="flex-1 px-2 py-1 text-[11px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
                >
                  <option value="">Tất cả dự án</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Table with sticky header */}
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse" style={{ minWidth: 726 }}>
              <thead className="sticky top-0 z-10">
                {/* Sort row */}
                <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  {[
                    { field: 'code', label: 'Mã', w: 68 },
                    { field: 'name', label: 'Tên UC', w: 130 },
                    { field: null, label: 'Mô tả', w: 160 },
                    { field: 'actors', label: 'Tác nhân', w: 100 },
                    { field: 'difficulty', label: 'Độ khó', w: 76 },
                    { field: 'ba_email', label: 'BA phụ trách', w: 96 },
                    { field: 'dev_email', label: 'Dev phụ trách', w: 96 },
                  ].map(col => (
                    <th
                      key={col.label}
                      style={{ width: col.w, minWidth: col.w }}
                      onClick={col.field ? () => toggleUCListSort(col.field) : undefined}
                      className={`px-2.5 py-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap ${col.field ? 'cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors' : ''}`}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        {col.field && (
                          <span className="text-[11px] leading-none">
                            {ucListSortBy === col.field ? (ucListSortOrder === 'asc' ? '↑' : '↓') : '↕'}
                          </span>
                        )}
                      </span>
                    </th>
                  ))}
                </tr>

                {/* Filter row */}
                <tr className="bg-slate-50 dark:bg-slate-900/80 border-b-2 border-slate-200 dark:border-slate-800">
                  {/* Code — covered by search, no per-column filter */}
                  <td className="px-2 py-1.5" />
                  {/* Name — covered by search */}
                  <td className="px-2 py-1.5" />
                  {/* Description */}
                  <td className="px-2 py-1.5">
                    <input
                      value={ucListFilters.description}
                      onChange={(e) => setUcListFilters(p => ({ ...p, description: e.target.value }))}
                      placeholder="Lọc mô tả..."
                      className="w-full px-2 py-1 text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-400 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    />
                  </td>
                  {/* Actors */}
                  <td className="px-2 py-1.5">
                    <input
                      value={ucListFilters.actors}
                      onChange={(e) => setUcListFilters(p => ({ ...p, actors: e.target.value }))}
                      placeholder="Lọc..."
                      className="w-full px-2 py-1 text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-400 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    />
                  </td>
                  {/* Difficulty dropdown */}
                  <td className="px-2 py-1.5">
                    <select
                      value={ucListFilters.difficulty}
                      onChange={(e) => setUcListFilters(p => ({ ...p, difficulty: e.target.value }))}
                      className="w-full px-1.5 py-1 text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer"
                    >
                      <option value="">Tất cả</option>
                      <option value="Đơn giản">Đơn giản</option>
                      <option value="Trung bình">Trung bình</option>
                      <option value="Phức tạp">Phức tạp</option>
                    </select>
                  </td>
                  {/* BA */}
                  <td className="px-2 py-1.5">
                    <input
                      value={ucListFilters.ba_email}
                      onChange={(e) => setUcListFilters(p => ({ ...p, ba_email: e.target.value }))}
                      placeholder="Lọc BA..."
                      className="w-full px-2 py-1 text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-400 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    />
                  </td>
                  {/* Dev */}
                  <td className="px-2 py-1.5">
                    <input
                      value={ucListFilters.dev_email}
                      onChange={(e) => setUcListFilters(p => ({ ...p, dev_email: e.target.value }))}
                      placeholder="Lọc Dev..."
                      className="w-full px-2 py-1 text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-400 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    />
                  </td>
                  {(ucListSearch || ucListFilterProject || Object.values(ucListFilters).some(v => v)) && (
                    <td className="px-2 py-1.5 text-center">
                      <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => { setUcListSearch(''); setUcListFilterProject(''); setUcListFilters({ description: '', actors: '', difficulty: '', ba_email: '', dev_email: '' }); }}
                        title="Xóa tất cả bộ lọc"
                        className="p-0.5 rounded text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </td>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredPopupUCs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-xs text-slate-400 dark:text-slate-600 italic text-center">
                      Không tìm thấy Use Case nào phù hợp
                    </td>
                  </tr>
                ) : paginatedUCs.map(uc => (
                  <tr
                    key={uc.id}
                    className={`group hover:bg-indigo-50/40 dark:hover:bg-indigo-950/10 transition-colors ${isEditable ? 'cursor-pointer' : ''}`}
                    onMouseDown={isEditable ? (e) => {
                      e.preventDefault();
                      editorRef.current?.focus();
                      doInsertUCChip(uc);
                    } : undefined}
                    title={isEditable ? `Nhấn để gắn @${uc.code} vào nội dung` : undefined}
                  >
                    {/* Code */}
                    <td className="px-2.5 py-2.5">
                      <span className="text-[10px] font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono whitespace-nowrap">
                        {uc.code}
                      </span>
                    </td>
                    {/* Name */}
                    <td className="px-2.5 py-2.5 max-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{uc.name}</p>
                    </td>
                    {/* Description */}
                    <td className="px-2.5 py-2.5 max-w-0">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {uc.description || <span className="italic text-slate-300 dark:text-slate-700">—</span>}
                      </p>
                    </td>
                    {/* Actors */}
                    <td className="px-2.5 py-2.5 max-w-0">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{uc.actors || '—'}</p>
                    </td>
                    {/* Difficulty */}
                    <td className="px-2.5 py-2.5">
                      {uc.difficulty ? (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap ${ucDifficultyStyle(uc.difficulty)}`}>
                          {uc.difficulty}
                        </span>
                      ) : <span className="text-slate-300 dark:text-slate-700 text-[11px]">—</span>}
                    </td>
                    {/* BA */}
                    <td className="px-2.5 py-2.5 max-w-0">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{uc.ba_email || '—'}</p>
                    </td>
                    {/* Dev */}
                    <td className="px-2.5 py-2.5 max-w-0">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{uc.dev_email || '—'}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-900 shrink-0 flex items-center justify-between gap-2 bg-slate-50/60 dark:bg-slate-950/20">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Hiển thị:</span>
              <select
                value={ucListPageSize === 0 ? 'all' : ucListPageSize}
                onChange={(e) => {
                  const val = e.target.value === 'all' ? 0 : Number(e.target.value);
                  setUcListPageSize(val);
                  setUcListPage(1);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="px-1.5 py-0.5 text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value="all">Tất cả</option>
              </select>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">/ trang</span>
            </div>
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mr-1.5">
                {filteredPopupUCs.length === 0
                  ? '0 bản ghi'
                  : ucListPageSize === 0
                    ? `${filteredPopupUCs.length} bản ghi`
                    : `${Math.min((ucListPage - 1) * ucListPageSize + 1, filteredPopupUCs.length)}–${Math.min(ucListPage * ucListPageSize, filteredPopupUCs.length)} / ${filteredPopupUCs.length}`
                }
              </span>
              {ucListPageSize > 0 && ucListTotalPages > 1 && (
                <>
                  <button onClick={() => setUcListPage(1)} disabled={ucListPage === 1} className="px-1 py-0.5 text-[11px] rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">«</button>
                  <button onClick={() => setUcListPage(p => Math.max(1, p - 1))} disabled={ucListPage === 1} className="px-1 py-0.5 text-[11px] rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">‹</button>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mx-0.5">{ucListPage}/{ucListTotalPages}</span>
                  <button onClick={() => setUcListPage(p => Math.min(ucListTotalPages, p + 1))} disabled={ucListPage === ucListTotalPages} className="px-1 py-0.5 text-[11px] rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">›</button>
                  <button onClick={() => setUcListPage(ucListTotalPages)} disabled={ucListPage === ucListTotalPages} className="px-1 py-0.5 text-[11px] rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">»</button>
                </>
              )}
            </div>
          </div>

          {/* Resize handle */}
          <div
            className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize flex items-end justify-end p-1 z-20"
            onMouseDown={handleResizeStart}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" className="text-slate-400 dark:text-slate-600 opacity-60 hover:opacity-100 transition-opacity">
              <circle cx="6" cy="6" r="1.3" fill="currentColor" />
              <circle cx="2" cy="6" r="1.3" fill="currentColor" />
              <circle cx="6" cy="2" r="1.3" fill="currentColor" />
            </svg>
          </div>
        </div>
      )}

      {/* ── UC Tooltip (hover on chip) ── */}
      {ucTooltip && (
        <div
          className="fixed z-[70] pointer-events-none"
          style={{
            top: ucTooltip.y + 16,
            left: Math.min(ucTooltip.x + 8, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 280),
          }}
        >
          <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-xl shadow-2xl p-3 w-[260px] border border-slate-700/60">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[9px] font-black bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-1.5 py-0.5 rounded shrink-0">
                {ucTooltip.uc.code}
              </span>
              <p className="text-xs font-bold text-white truncate">{ucTooltip.uc.name}</p>
            </div>
            {ucTooltip.uc.description && (
              <p className="text-[10px] text-slate-300 leading-relaxed mb-2 line-clamp-2">{ucTooltip.uc.description}</p>
            )}
            {ucTooltip.uc.actors && (
              <p className="text-[10px] text-slate-400">
                <span className="text-slate-200 font-semibold">Tác nhân:</span> {ucTooltip.uc.actors}
              </p>
            )}
            {ucTooltip.uc.ba_email && (
              <p className="text-[10px] text-slate-400 mt-0.5">
                <span className="text-slate-200 font-semibold">BA:</span> {ucTooltip.uc.ba_email}
              </p>
            )}
            {ucTooltip.uc.dev_email && (
              <p className="text-[10px] text-slate-400 mt-0.5">
                <span className="text-slate-200 font-semibold">Dev:</span> {ucTooltip.uc.dev_email}
              </p>
            )}
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
