'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import DatePickerInput from '@/components/DatePickerInput';
import { supabase, withTimeout } from '@/lib/supabase';
import {
  ClipboardList, CheckCircle, Clock, Search, RefreshCw, Loader2,
  ShieldAlert, Calendar, ChevronDown, ChevronUp, FolderKanban,
  Check, X, AlertCircle, FileText, Users, Filter, ShieldOff,
  SquareCheck, Square, User, MessageSquare, Send, BedDouble, Plus,
} from 'lucide-react';
import { sendNotification } from '@/lib/sendNotification';

// ─── Preview mock data ─────────────────────────────────────────────────────────

const _MOCK_MEMBERS = [
  { id: 'tm1', full_name: 'Phạm Minh Developer' },
  { id: 'tm2', full_name: 'Lê Hoàng Coder' },
  { id: 'tm3', full_name: 'Nguyễn Thu BA' },
];

const _MOCK_LOGS = [
  { id:'tl1', user_id:'tm1', log_date:'2026-06-03', title:'Hoàn thiện module phân quyền RBAC',     content:'<p>Cập nhật logic kiểm tra quyền theo role và resource. Viết unit test cho hàm <strong>hasPermission</strong>.</p><p>Xử lý edge case khi quyền chưa được cấu hình trong DB.</p>',            is_approved:false, approved_at:null,                    project_id:'proj1', project_code:'PROJ-01', project_name:'PROJEXA System',      author_name:'Phạm Minh Developer', approver_name:null,                  created_at:'2026-06-03T17:30:00Z' },
  { id:'tl2', user_id:'tm2', log_date:'2026-06-03', title:'Thiết kế UI trang Thống kê',           content:'<p>Xây dựng biểu đồ thanh ngang cho phân bổ trạng thái và ưu tiên. CSS chart không cần thư viện ngoài.</p>',                                                                               is_approved:true,  approved_at:'2026-06-03T18:00:00Z', project_id:'proj1', project_code:'PROJ-01', project_name:'PROJEXA System',      author_name:'Lê Hoàng Coder',      approver_name:'Trần Thị Manager', created_at:'2026-06-03T16:00:00Z' },
  { id:'tl3', user_id:'tm3', log_date:'2026-06-03', title:'Phân tích yêu cầu module Báo cáo',     content:'<p>Họp với stakeholder xác định yêu cầu. Ghi nhận <strong>5 loại báo cáo</strong> cần thiết cho giai đoạn 2.</p>',                                                                        is_approved:false, approved_at:null,                    project_id:'proj2', project_code:'PROJ-02', project_name:'National Law Portal', author_name:'Nguyễn Thu BA',       approver_name:null,                  created_at:'2026-06-03T16:30:00Z' },
  { id:'tl4', user_id:'tm1', log_date:'2026-06-02', title:'Fix bug @ mention nhảy dòng',          content:'<p>Phân tích và sửa bug khi chọn UC từ dropdown @ bị nhảy lên dòng trên.</p><p>Nguyên nhân: <code>focus()</code> reset selection trong một số browser.</p>',                              is_approved:true,  approved_at:'2026-06-02T19:00:00Z', project_id:'proj1', project_code:'PROJ-01', project_name:'PROJEXA System',      author_name:'Phạm Minh Developer', approver_name:'Trần Thị Manager', created_at:'2026-06-02T17:00:00Z' },
  { id:'tl5', user_id:'tm2', log_date:'2026-06-02', title:'Tối ưu query cho Statistics page',     content:'<p>Thêm index cho cột <code>task_id</code> trong bảng <code>task_history</code>. Tốc độ query cải thiện ~40%.</p>',                                                                       is_approved:false, approved_at:null,                    project_id:'proj1', project_code:'PROJ-01', project_name:'PROJEXA System',      author_name:'Lê Hoàng Coder',      approver_name:null,                  created_at:'2026-06-02T16:30:00Z' },
  { id:'tl6', user_id:'tm3', log_date:'2026-06-01', title:'Viết tài liệu Use Case module Search', content:'<p>Hoàn thiện 3 use case: Tìm kiếm văn bản, Lọc theo danh mục, Xuất kết quả PDF.</p>',                                                                                                    is_approved:true,  approved_at:'2026-06-02T08:00:00Z', project_id:'proj2', project_code:'PROJ-02', project_name:'National Law Portal', author_name:'Nguyễn Thu BA',       approver_name:'Trần Thị Manager', created_at:'2026-06-01T17:00:00Z' },
  { id:'tl7', user_id:'tm1', log_date:'2026-06-01', title:'Implement DatePickerInput component',  content:'<p>Tạo component <strong>DatePickerInput</strong> dùng chung. Overlay hidden input với native picker, format vi-VN.</p>',                                                                  is_approved:true,  approved_at:'2026-06-02T08:30:00Z', project_id:'proj1', project_code:'PROJ-01', project_name:'PROJEXA System',      author_name:'Phạm Minh Developer', approver_name:'Trần Thị Manager', created_at:'2026-06-01T16:00:00Z' },
  { id:'tl8', user_id:'tm2', log_date:'2026-05-31', title:'Cập nhật giao diện Dark Mode',         content:'<p>Kiểm tra và fix các màu text không đủ tương phản trong dark mode. Cập nhật 12 components bị ảnh hưởng.</p>',                                                                           is_approved:false, approved_at:null,                    project_id:'proj1', project_code:'PROJ-01', project_name:'PROJEXA System',      author_name:'Lê Hoàng Coder',      approver_name:null,                  created_at:'2026-05-31T17:30:00Z' },
  { id:'tl9', user_id:'tm3', log_date:'2026-05-30', title:'Xây dựng wireframe trang Tổng quan',   content:'<p>Thiết kế wireframe cho Dashboard mới. Bổ sung widget thống kê nhanh và biểu đồ tiến độ sprint.</p>',                                                                                   is_approved:true,  approved_at:'2026-05-31T09:00:00Z', project_id:'proj2', project_code:'PROJ-02', project_name:'National Law Portal', author_name:'Nguyễn Thu BA',       approver_name:'Trần Thị Manager', created_at:'2026-05-30T17:00:00Z' },
];

// ─── Preview mock data – Absences ─────────────────────────────────────────────

const _MOCK_ABSENCES = [
  { id: 'ab1', user_id: 'tm1', date: '2026-06-02', reason: 'Nghỉ phép năm', recorded_by: 'mgr', member_name: 'Phạm Minh Developer', recorder_name: 'Trần Thị Manager', created_at: '2026-06-02T08:00:00Z' },
  { id: 'ab2', user_id: 'tm3', date: '2026-05-31', reason: '',             recorded_by: 'mgr', member_name: 'Nguyễn Thu BA',        recorder_name: 'Trần Thị Manager', created_at: '2026-05-31T08:30:00Z' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoToDisplay(ymd) {
  if (!ymd) return '—';
  const d = new Date(ymd + 'T00:00:00');
  return d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function stripHtml(html = '') {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function localDateStr(d) {
  // Dùng component giờ địa phương thay vì toISOString() (UTC) để tránh lệch ngày
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function formatCommentTime(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getDateRange(preset) {
  const to   = new Date();
  const from = new Date(to);
  if (preset === '7d')    from.setDate(from.getDate() - 6);
  else if (preset === '30d')  from.setDate(from.getDate() - 29);
  else if (preset === 'month') from.setDate(1);
  return { from: localDateStr(from), to: localDateStr(to) };
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TeamLogsPage() {
  const router = useRouter();
  const { user, profile, role } = useAuth();

  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [allLogs, setAllLogs]   = useState([]);
  const [members, setMembers]   = useState([]);

  // Date range
  const defaultRange = getDateRange('7d');
  const [fromDate, setFromDate] = useState(defaultRange.from);
  const [toDate,   setToDate]   = useState(defaultRange.to);
  const [preset,   setPreset]   = useState('7d');

  // Client-side filters
  const [filterMembers,  setFilterMembers]  = useState([]);
  const [filterProject,  setFilterProject]  = useState('');
  const [filterApproval, setFilterApproval] = useState('all');
  const [search,         setSearch]         = useState('');

  // Member multi-select dropdown
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const memberDropdownRef = useRef(null);

  // UI state
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [approvingIds, setApprovingIds] = useState(new Set());
  const [bulkApproving, setBulkApproving] = useState(false);

  // Absence state
  const [allAbsences, setAllAbsences] = useState([]);
  const [absenceModal, setAbsenceModal] = useState(false);
  const [absenceMemberId, setAbsenceMemberId] = useState('');
  const [absenceDate, setAbsenceDate] = useState(localDateStr(new Date()));
  const [absenceReason, setAbsenceReason] = useState('');
  const [absenceSubmitting, setAbsenceSubmitting] = useState(false);
  const [deletingAbsenceIds, setDeletingAbsenceIds] = useState(new Set());

  // Quick comment state
  const [logComments, setLogComments] = useState({});       // { [logId]: Comment[] }
  const [commentInput, setCommentInput] = useState({});     // { [logId]: string }
  const [commentLoadingIds, setCommentLoadingIds] = useState(new Set());
  const [commentSubmittingIds, setCommentSubmittingIds] = useState(new Set());

  const isAdmin          = role?.name === 'Admin';
  const isManagerOrAdmin = isAdmin || role?.name === 'Manager';

  // Close member dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (memberDropdownRef.current && !memberDropdownRef.current.contains(e.target))
        setMemberDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchData = async (from = fromDate, to = toDate) => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      // Members
      const { data: mData, error: mErr } = await withTimeout(
        supabase.from('profiles').select('id, full_name')
      );
      if (mErr) throw mErr;
      const memberList = mData || [];
      setMembers(memberList);

      console.log('[TeamLogs] role:', role?.name, '| isManagerOrAdmin:', isManagerOrAdmin);
      console.log('[TeamLogs] profiles fetched:', memberList.length, memberList.map(m => m.id));

      // Projects map
      const { data: pData } = await withTimeout(
        supabase.from('projects').select('id, name, code')
      );
      const projMap = {};
      (pData || []).forEach(p => { projMap[p.id] = p; });

      // Profile map để tra cứu tên — dùng thay cho FK join trong query
      const profileMap = {};
      memberList.forEach(m => { profileMap[m.id] = m.full_name; });

      // Logs — select phẳng, không dùng FK join để tránh lỗi schema cache
      const memberIds = isManagerOrAdmin ? memberList.map(m => m.id) : [user.id];
      console.log('[TeamLogs] memberIds:', memberIds, '| date range:', from, '→', to);
      if (memberIds.length === 0) { setAllLogs([]); return; }

      const { data: lData, error: lErr } = await withTimeout(
        supabase.from('daily_logs')
          .select('id, user_id, log_date, title, content, is_approved, approved_at, approved_by, project_id, created_at')
          .in('user_id', memberIds)
          .gte('log_date', from)
          .lte('log_date', to)
          .order('log_date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(300)
      );
      console.log('[TeamLogs] logs fetched:', lData?.length, '| error:', lErr?.message);
      if (lErr) throw lErr;

      setAllLogs((lData || []).map(l => ({
        ...l,
        author_name:   profileMap[l.user_id]    || '—',
        approver_name: profileMap[l.approved_by] || null,
        project_name:  projMap[l.project_id]?.name || null,
        project_code:  projMap[l.project_id]?.code || null,
      })));

      // Fetch absences trong cùng khoảng ngày
      const { data: aData } = await withTimeout(
        supabase.from('day_absences')
          .select('id, user_id, date, reason, recorded_by, created_at')
          .gte('date', from)
          .lte('date', to)
          .order('date', { ascending: false })
      );
      setAllAbsences((aData || []).map(a => ({
        ...a,
        member_name:   profileMap[a.user_id]    || '—',
        recorder_name: profileMap[a.recorded_by] || '—',
      })));
    } catch (err) {
      console.error('[TeamLogs] fetchData error:', err);
      setError(err.message || 'Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key || url.includes('your_supabase_project_url')) {
      setIsSupabaseConfigured(false);
      const r = getDateRange('7d');
      setAllLogs(_MOCK_LOGS.filter(l => l.log_date >= r.from && l.log_date <= r.to));
      setAllAbsences(_MOCK_ABSENCES.filter(a => a.date >= r.from && a.date <= r.to));
      setMembers(_MOCK_MEMBERS);
      setLoading(false);
      return;
    }
    fetchData();
  }, [user, role]);

  // ── Date range handling ──────────────────────────────────────────────────────

  const applyPreset = (p) => {
    setPreset(p);
    const r = getDateRange(p);
    setFromDate(r.from);
    setToDate(r.to);
    if (isSupabaseConfigured) fetchData(r.from, r.to);
    else {
      setAllLogs(_MOCK_LOGS.filter(l => l.log_date >= r.from && l.log_date <= r.to));
      setAllAbsences(_MOCK_ABSENCES.filter(a => a.date >= r.from && a.date <= r.to));
    }
    setSelectedIds(new Set());
  };

  const handleSearch = () => {
    setPreset('');
    setSelectedIds(new Set());
    if (isSupabaseConfigured) fetchData(fromDate, toDate);
    else {
      setAllLogs(_MOCK_LOGS.filter(l => l.log_date >= fromDate && l.log_date <= toDate));
      setAllAbsences(_MOCK_ABSENCES.filter(a => a.date >= fromDate && a.date <= toDate));
    }
  };

  // ── Computed ─────────────────────────────────────────────────────────────────

  const projects = useMemo(() => {
    const seen = new Set();
    return allLogs.filter(l => l.project_id && !seen.has(l.project_id) && seen.add(l.project_id))
      .map(l => ({ id: l.project_id, name: l.project_name, code: l.project_code }));
  }, [allLogs]);

  const filteredLogs = useMemo(() => allLogs
    .filter(l => filterMembers.length === 0 || filterMembers.includes(l.user_id))
    .filter(l => !filterProject  || l.project_id === filterProject)
    .filter(l => filterApproval === 'all' || (filterApproval === 'approved' ? l.is_approved : !l.is_approved))
    .filter(l => {
      if (!search) return true;
      const q = search.toLowerCase();
      return l.title?.toLowerCase().includes(q) || l.author_name?.toLowerCase().includes(q) || stripHtml(l.content).toLowerCase().includes(q);
    }), [allLogs, filterMembers, filterProject, filterApproval, search]);

  const filteredAbsences = useMemo(() => {
    if (filterApproval !== 'all') return [];
    return allAbsences.filter(a =>
      (filterMembers.length === 0 || filterMembers.includes(a.user_id)) &&
      (!filterProject)
    );
  }, [allAbsences, filterMembers, filterProject, filterApproval]);

  const combinedItems = useMemo(() => {
    const logs = filteredLogs.map(l => ({ ...l, _type: 'log' }));
    const absences = filteredAbsences.map(a => ({ ...a, _type: 'absence' }));
    return [...logs, ...absences].sort((a, b) => {
      const dA = a._type === 'log' ? a.log_date : a.date;
      const dB = b._type === 'log' ? b.log_date : b.date;
      if (dA !== dB) return dB.localeCompare(dA);
      return (b.created_at || '').localeCompare(a.created_at || '');
    });
  }, [filteredLogs, filteredAbsences]);

  const stats = useMemo(() => ({
    total:    filteredLogs.length,
    approved: filteredLogs.filter(l => l.is_approved).length,
    pending:  filteredLogs.filter(l => !l.is_approved).length,
    absent:   filteredAbsences.length,
  }), [filteredLogs, filteredAbsences]);

  const pendingFiltered = useMemo(() => filteredLogs.filter(l => !l.is_approved), [filteredLogs]);
  const selectedPending = useMemo(() => [...selectedIds].filter(id => pendingFiltered.some(l => l.id === id)), [selectedIds, pendingFiltered]);

  const memberMap = useMemo(() => {
    const m = {};
    members.forEach(mem => { m[mem.id] = mem.full_name; });
    return m;
  }, [members]);

  // ── Comment actions ───────────────────────────────────────────────────────────

  const fetchComments = async (logId) => {
    if (!logId || !isSupabaseConfigured || logComments[logId]) return;
    setCommentLoadingIds(prev => new Set([...prev, logId]));
    try {
      const { data } = await withTimeout(
        supabase.from('log_comments')
          .select('id, log_id, user_id, content, created_at')
          .eq('log_id', logId)
          .order('created_at', { ascending: true })
      );
      setLogComments(prev => ({ ...prev, [logId]: data || [] }));
    } catch {}
    setCommentLoadingIds(prev => { const s = new Set(prev); s.delete(logId); return s; });
  };

  const submitCommentOnLog = async (log) => {
    const text = (commentInput[log.id] || '').trim();
    if (!text || !isSupabaseConfigured || commentSubmittingIds.has(log.id)) return;
    setCommentSubmittingIds(prev => new Set([...prev, log.id]));
    try {
      const { data, error } = await withTimeout(
        supabase.from('log_comments')
          .insert({ log_id: log.id, user_id: user.id, content: text })
          .select('id, log_id, user_id, content, created_at')
          .single()
      );
      if (error) throw error;
      if (data) {
        setLogComments(prev => ({ ...prev, [log.id]: [...(prev[log.id] || []), data] }));
      }
      setCommentInput(prev => ({ ...prev, [log.id]: '' }));
      if (log.user_id && log.user_id !== user?.id) {
        const logDateDisplay = log.log_date
          ? new Date(log.log_date + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
          : '';
        sendNotification({
          title: 'Bình luận mới trên nhật ký của bạn',
          body: `<p><strong>${profile?.full_name || 'Ai đó'}</strong> đã bình luận trên nhật ký${logDateDisplay ? ` ngày <strong>${logDateDisplay}</strong>` : ''} của bạn:</p><p style="margin-top:6px;color:#64748b;">"${text.length > 120 ? text.slice(0, 120) + '…' : text}"</p>`,
          recipientId: log.user_id,
          senderId: user?.id,
          actionUrl: `/daily-logs?goto_date=${log.log_date}`,
        });
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setCommentSubmittingIds(prev => { const s = new Set(prev); s.delete(log.id); return s; });
    }
  };

  // ── Actions ───────────────────────────────────────────────────────────────────

  const handleApprove = async (logId) => {
    const approvedAt  = new Date().toISOString();
    const approverName = profile?.full_name || 'Quản lý';
    setApprovingIds(prev => new Set([...prev, logId]));
    try {
      if (isSupabaseConfigured) {
        const { error } = await withTimeout(
          supabase.from('daily_logs').update({ is_approved: true, approved_by: user?.id || null, approved_at: approvedAt }).eq('id', logId)
        );
        if (error) throw error;
      }
      setAllLogs(prev => prev.map(l => l.id === logId ? { ...l, is_approved: true, approved_at: approvedAt, approver_name: approverName } : l));
      setSelectedIds(prev => { const s = new Set(prev); s.delete(logId); return s; });
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setApprovingIds(prev => { const s = new Set(prev); s.delete(logId); return s; });
    }
  };

  const handleRevoke = async (logId) => {
    setApprovingIds(prev => new Set([...prev, logId]));
    try {
      if (isSupabaseConfigured) {
        const { error } = await withTimeout(
          supabase.from('daily_logs').update({ is_approved: false, approved_by: null, approved_at: null }).eq('id', logId)
        );
        if (error) throw error;
      }
      setAllLogs(prev => prev.map(l => l.id === logId ? { ...l, is_approved: false, approved_at: null, approver_name: null } : l));
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setApprovingIds(prev => { const s = new Set(prev); s.delete(logId); return s; });
    }
  };

  const handleBulkApprove = async () => {
    if (selectedPending.length === 0) return;
    setBulkApproving(true);
    const approvedAt   = new Date().toISOString();
    const approverName = profile?.full_name || 'Quản lý';
    try {
      if (isSupabaseConfigured) {
        const { error } = await withTimeout(
          supabase.from('daily_logs').update({ is_approved: true, approved_by: user?.id || null, approved_at: approvedAt }).in('id', selectedPending)
        );
        if (error) throw error;
      }
      setAllLogs(prev => prev.map(l => selectedPending.includes(l.id) ? { ...l, is_approved: true, approved_at: approvedAt, approver_name: approverName } : l));
      setSelectedIds(new Set());
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setBulkApproving(false);
    }
  };

  const toggleExpand  = (id) => {
    setExpandedIds(prev => {
      const s = new Set(prev);
      if (s.has(id)) { s.delete(id); } else { s.add(id); fetchComments(id); }
      return s;
    });
  };
  const toggleSelect  = (id) => setSelectedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const selectAllPending = () => setSelectedIds(new Set(pendingFiltered.map(l => l.id)));
  const clearSelection   = () => setSelectedIds(new Set());

  const goToLog = (log) => {
    localStorage.setItem('aerotask_goto_log_date', log.log_date);
    if (isSupabaseConfigured) localStorage.setItem('aerotask_viewing_user_id', log.user_id);
    router.push('/daily-logs');
  };

  const openAbsenceModal = () => {
    setAbsenceMemberId('');
    setAbsenceDate(localDateStr(new Date()));
    setAbsenceReason('');
    setAbsenceModal(true);
  };

  const handleMarkAbsence = async () => {
    if (!absenceMemberId || !absenceDate) return;
    setAbsenceSubmitting(true);
    const memberName   = memberMap[absenceMemberId] || '—';
    const recorderName = profile?.full_name || '—';
    try {
      if (!isSupabaseConfigured) {
        const mock = {
          id: 'ab-' + Math.random().toString(36).substr(2, 9),
          user_id: absenceMemberId, date: absenceDate,
          reason: absenceReason.trim(), recorded_by: user?.id || '',
          member_name: memberName, recorder_name: recorderName,
          created_at: new Date().toISOString(),
        };
        setAllAbsences(prev => [mock, ...prev.filter(a => !(a.user_id === absenceMemberId && a.date === absenceDate))]);
        setAbsenceModal(false);
        return;
      }
      const { data, error } = await withTimeout(
        supabase.from('day_absences')
          .upsert({ user_id: absenceMemberId, date: absenceDate, reason: absenceReason.trim() || null, recorded_by: user?.id }, { onConflict: 'user_id,date' })
          .select('id, user_id, date, reason, recorded_by, created_at')
          .single()
      );
      if (error) throw error;
      const newRecord = { ...data, member_name: memberName, recorder_name: recorderName };
      setAllAbsences(prev => [newRecord, ...prev.filter(a => a.id !== data.id && !(a.user_id === data.user_id && a.date === data.date))]);
      setAbsenceModal(false);
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setAbsenceSubmitting(false);
    }
  };

  const handleDeleteAbsence = async (id) => {
    setDeletingAbsenceIds(prev => new Set([...prev, id]));
    try {
      if (isSupabaseConfigured) {
        const { error } = await withTimeout(supabase.from('day_absences').delete().eq('id', id));
        if (error) throw error;
      }
      setAllAbsences(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setDeletingAbsenceIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  if (!isManagerOrAdmin) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldOff className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-3" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Bạn không có quyền truy cập tính năng này.</p>
        <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">Chỉ Admin và Manager mới có thể xem nhật ký thành viên.</p>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 dark:from-white dark:via-slate-100 dark:to-indigo-100 bg-clip-text text-transparent">
              Nhật ký thành viên
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Xem và phê duyệt nhật ký của tất cả thành viên trong nhóm
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isManagerOrAdmin && (
              <button onClick={openAbsenceModal}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/20 transition-colors cursor-pointer">
                <BedDouble className="h-3.5 w-3.5" />
                Đánh dấu nghỉ
              </button>
            )}
            {isSupabaseConfigured && (
              <button onClick={() => handleSearch()} title="Làm mới"
                className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer">
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── Filter panel ── */}
        <div className="bg-white dark:bg-gray-950/60 border border-slate-200 dark:border-gray-900 rounded-2xl p-5 shadow-sm space-y-4">

          {/* Date range row */}
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            {/* Quick presets */}
            {[
              { key: 'today', label: 'Hôm nay' },
              { key: '7d',    label: '7 ngày' },
              { key: '30d',   label: '30 ngày' },
              { key: 'month', label: 'Tháng này' },
            ].map(p => (
              <button key={p.key} onClick={() => applyPreset(p.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${preset === p.key ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>
                {p.label}
              </button>
            ))}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <DatePickerInput value={fromDate} onChange={e => { setFromDate(e.target.value); setPreset(''); }} className="flex-1 min-w-28" placeholder="Từ ngày" />
              <span className="text-slate-400 text-xs shrink-0">→</span>
              <DatePickerInput value={toDate}   onChange={e => { setToDate(e.target.value);   setPreset(''); }} className="flex-1 min-w-28" placeholder="Đến ngày" />
              <button onClick={handleSearch}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5" /> Tìm
              </button>
            </div>
          </div>

          {/* Filter dropdowns + search */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Member multi-select */}
            <div className="relative" ref={memberDropdownRef}>
              <button
                type="button"
                onClick={() => setMemberDropdownOpen(v => !v)}
                className={`flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs transition-colors cursor-pointer min-w-40 ${memberDropdownOpen ? 'border-indigo-400 dark:border-indigo-600 ring-1 ring-indigo-500/30' : 'border-slate-200 dark:border-slate-800'} ${filterMembers.length > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
              >
                <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="flex-1 text-left truncate">
                  {filterMembers.length === 0
                    ? 'Tất cả thành viên'
                    : filterMembers.length === 1
                      ? members.find(m => m.id === filterMembers[0])?.full_name || '1 thành viên'
                      : `${filterMembers.length} thành viên`}
                </span>
                {filterMembers.length > 0 && (
                  <span
                    onClick={e => { e.stopPropagation(); setFilterMembers([]); }}
                    className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </span>
                )}
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform ${memberDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {memberDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 z-20 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
                  {/* Select all / clear row */}
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setFilterMembers(members.map(m => m.id))}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Chọn tất cả
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMembers([])}
                      className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:underline cursor-pointer"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                  <div className="max-h-52 overflow-y-auto py-1">
                    {members.map(m => {
                      const checked = filterMembers.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setFilterMembers(prev =>
                            checked ? prev.filter(id => id !== m.id) : [...prev, m.id]
                          )}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600'}`}>
                            {checked && <Check className="h-2.5 w-2.5 text-white" />}
                          </div>
                          <span className={`truncate ${checked ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-300'}`}>
                            {m.full_name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            {/* Project */}
            <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none min-w-32">
              <option value="">Tất cả dự án</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.code ? `[${p.code}] ` : ''}{p.name || p.id}</option>)}
            </select>
            {/* Approval */}
            <select value={filterApproval} onChange={e => setFilterApproval(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none">
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
            </select>
            {/* Text search */}
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Tìm tiêu đề, tên thành viên..."
                className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>
        </div>

        {/* ── Stats + bulk actions ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            {[
              { label: 'Tổng',      val: stats.total,    cls: 'text-slate-600 dark:text-slate-300' },
              { label: 'Đã duyệt',  val: stats.approved, cls: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Chờ duyệt', val: stats.pending,  cls: 'text-amber-600 dark:text-amber-400' },
              { label: 'Nghỉ',      val: stats.absent,   cls: 'text-rose-500 dark:text-rose-400' },
            ].map(({ label, val, cls }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`text-xl font-extrabold ${cls}`}>{val}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">{label}</span>
              </div>
            ))}
          </div>

          {/* Bulk approve actions */}
          {pendingFiltered.length > 0 && (
            <div className="flex items-center gap-2">
              {selectedPending.length > 0 ? (
                <>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Đã chọn {selectedPending.length}</span>
                  <button onClick={clearSelection}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                    Bỏ chọn
                  </button>
                  <button onClick={handleBulkApprove} disabled={bulkApproving}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-1.5">
                    {bulkApproving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Duyệt {selectedPending.length} nhật ký
                  </button>
                </>
              ) : (
                <button onClick={selectAllPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-colors cursor-pointer">
                  <SquareCheck className="h-3.5 w-3.5" />
                  Chọn tất cả chờ duyệt ({pendingFiltered.length})
                </button>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs p-4 rounded-2xl flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" /><span>{error}</span>
            <button onClick={handleSearch} className="ml-auto underline cursor-pointer">Thử lại</button>
          </div>
        )}

        {/* ── Log list ── */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-sm">Đang tải nhật ký...</span>
          </div>
        ) : combinedItems.length === 0 ? (
          <div className="bg-slate-50 dark:bg-gray-950/40 border border-slate-200 dark:border-gray-900 rounded-2xl p-10 text-center">
            <FileText className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Không có nhật ký nào trong khoảng thời gian này.</p>
            <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">Thử thay đổi bộ lọc hoặc mở rộng khoảng ngày.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {combinedItems.map(item => {
              // ── Absence card ───────────────────────────────────────────────
              if (item._type === 'absence') {
                return (
                  <div key={item.id}
                    className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3 p-4">
                      <div className="w-4 shrink-0" />
                      {/* Date badge */}
                      <div className="shrink-0 flex flex-col items-center justify-center w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400">
                        <span className="text-[11px] font-bold leading-none">{item.date?.slice(8, 10)}</span>
                        <span className="text-[9px] font-semibold leading-none mt-0.5">/{item.date?.slice(5, 7)}</span>
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-rose-500 dark:text-rose-400 mb-0.5">{item.member_name}</p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <BedDouble className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nghỉ</span>
                          {item.reason && (
                            <span className="text-xs text-slate-400 dark:text-slate-500">— {item.reason}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />{isoToDisplay(item.date)}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">Ghi bởi: {item.recorder_name}</span>
                        </div>
                      </div>
                      {/* Badge + delete */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold border border-rose-500/20">
                          Nghỉ
                        </span>
                        {isManagerOrAdmin && (
                          <button onClick={() => handleDeleteAbsence(item.id)} disabled={deletingAbsenceIds.has(item.id)}
                            title="Xóa ghi nhận nghỉ"
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-40">
                            {deletingAbsenceIds.has(item.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // ── Log card ───────────────────────────────────────────────────
              const log = item;
              const isExpanded  = expandedIds.has(log.id);
              const isSelected  = selectedIds.has(log.id);
              const isApproving = approvingIds.has(log.id);
              const preview     = stripHtml(log.content).slice(0, 120);

              return (
                <div key={log.id}
                  className={`bg-white dark:bg-gray-950/60 border rounded-2xl shadow-sm transition-all ${isSelected ? 'border-indigo-300 dark:border-indigo-700' : 'border-slate-200 dark:border-gray-900'}`}>

                  {/* Card header */}
                  <div className="flex items-start gap-3 p-4">

                    {/* Checkbox (pending logs only) */}
                    {!log.is_approved && (
                      <button type="button" onClick={() => toggleSelect(log.id)}
                        className="mt-0.5 shrink-0 text-slate-300 dark:text-slate-700 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-pointer">
                        {isSelected ? <SquareCheck className="h-4 w-4 text-indigo-500" /> : <Square className="h-4 w-4" />}
                      </button>
                    )}
                    {log.is_approved && <div className="w-4 shrink-0" />}

                    {/* Date badge */}
                    <div className="shrink-0 flex flex-col items-center justify-center w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                      <span className="text-[11px] font-bold leading-none">{log.log_date?.slice(8, 10)}</span>
                      <span className="text-[9px] font-semibold leading-none mt-0.5">/{log.log_date?.slice(5, 7)}</span>
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-0.5">
                            {log.author_name}
                          </p>
                          <button type="button" onClick={() => toggleExpand(log.id)}
                            className="text-sm font-semibold text-slate-800 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left cursor-pointer line-clamp-1">
                            {log.title || '(Chưa đặt tiêu đề)'}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                          {log.project_code && (
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                              {log.project_code}
                            </span>
                          )}
                          {log.is_approved ? (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                              Đã duyệt
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20">
                              Chờ duyệt
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Preview text */}
                      {!isExpanded && preview && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-600 line-clamp-1 mt-1">{preview}{preview.length === 120 ? '…' : ''}</p>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                          {isoToDisplay(log.log_date)}
                        </span>
                        {log.is_approved && log.approved_at && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <Check className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                            {log.approver_name || 'Đã duyệt'} · {new Date(log.approved_at).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!log.is_approved ? (
                        <button onClick={() => handleApprove(log.id)} disabled={isApproving}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-60">
                          {isApproving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          Duyệt
                        </button>
                      ) : (
                        <button onClick={() => handleRevoke(log.id)} disabled={isApproving}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-60">
                          {isApproving ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                          Hủy duyệt
                        </button>
                      )}
                      <button onClick={() => toggleExpand(log.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (() => {
                    const comments = (logComments[log.id] || []).map(c => ({
                      ...c,
                      author_name: memberMap[c.user_id] || 'Thành viên',
                    }));
                    return (
                      <div className="border-t border-slate-100 dark:border-slate-900 px-4 pt-4 pb-3 mx-1 mb-1">
                        {/* Log content */}
                        <div
                          className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-1 [&_strong]:font-semibold [&_code]:bg-slate-100 dark:[&_code]:bg-slate-900 [&_code]:px-1 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono"
                          dangerouslySetInnerHTML={{ __html: log.content || '<p class="text-slate-400 italic">Chưa có nội dung.</p>' }}
                        />

                        {/* Comment section */}
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-1.5 mb-2.5">
                            <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                              Bình luận{comments.length > 0 ? ` (${comments.length})` : ''}
                            </span>
                          </div>

                          {commentLoadingIds.has(log.id) ? (
                            <div className="flex items-center gap-1.5 py-1.5 mb-2">
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                              <span className="text-xs text-slate-400">Đang tải bình luận...</span>
                            </div>
                          ) : comments.length > 0 ? (
                            <div className="space-y-2 mb-3">
                              {comments.map(c => (
                                <div key={c.id} className="flex gap-2">
                                  <div className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                                    {c.author_name?.charAt(0).toUpperCase() || '?'}
                                  </div>
                                  <div className="flex-1 bg-slate-50 dark:bg-slate-900/40 rounded-xl px-3 py-2">
                                    <div className="flex items-baseline gap-2 flex-wrap">
                                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{c.author_name}</span>
                                      <span className="text-[10px] text-slate-400 dark:text-slate-600">{formatCommentTime(c.created_at)}</span>
                                    </div>
                                    <p className="text-[12px] text-slate-600 dark:text-slate-300 mt-0.5 whitespace-pre-wrap leading-relaxed">{c.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 dark:text-slate-600 italic mb-2.5">Chưa có bình luận nào.</p>
                          )}

                          {/* Input */}
                          <div className="flex gap-2 items-start">
                            <div className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-1">
                              {profile?.full_name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 flex gap-2">
                              <input
                                type="text"
                                value={commentInput[log.id] || ''}
                                onChange={e => setCommentInput(prev => ({ ...prev, [log.id]: e.target.value }))}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitCommentOnLog(log); } }}
                                placeholder="Thêm bình luận… (Enter để gửi)"
                                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600"
                                disabled={commentSubmittingIds.has(log.id)}
                              />
                              <button
                                type="button"
                                onClick={() => submitCommentOnLog(log)}
                                disabled={!commentInput[log.id]?.trim() || commentSubmittingIds.has(log.id)}
                                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                              >
                                {commentSubmittingIds.has(log.id)
                                  ? <Loader2 className="h-3 w-3 animate-spin" />
                                  : <Send className="h-3 w-3" />}
                                Gửi
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-end">
                          <button onClick={() => goToLog(log)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                            <FileText className="h-3.5 w-3.5" />
                            Xem chi tiết trong Nhật ký hàng ngày
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ── Absence modal ── */}
      {absenceModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-500/15 backdrop-blur-md" onClick={() => setAbsenceModal(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-200 dark:border-gray-800">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <BedDouble className="h-4 w-4 text-rose-500" />
                Đánh dấu ngày nghỉ
              </h2>
              <button onClick={() => setAbsenceModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Member */}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Thành viên <span className="text-rose-500">*</span></label>
                <select value={absenceMemberId} onChange={e => setAbsenceMemberId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-700 dark:text-slate-200 cursor-pointer appearance-none">
                  <option value="">Chọn thành viên...</option>
                  {members.filter(m => m.id !== user?.id).map(m => (
                    <option key={m.id} value={m.id}>{m.full_name}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Ngày nghỉ <span className="text-rose-500">*</span></label>
                <DatePickerInput
                  value={absenceDate}
                  onChange={e => setAbsenceDate(e.target.value)}
                  className="w-full"
                  placeholder="Chọn ngày"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">
                  Lý do nghỉ <span className="text-slate-400 font-normal">(tùy chọn)</span>
                </label>
                <input
                  type="text"
                  value={absenceReason}
                  onChange={e => setAbsenceReason(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleMarkAbsence(); }}
                  placeholder="Nghỉ phép, ốm đau, việc riêng..."
                  autoFocus
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 dark:border-gray-800 bg-slate-50/80 dark:bg-gray-950/40 flex items-center justify-end gap-2">
              <button onClick={() => setAbsenceModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                Hủy
              </button>
              <button onClick={handleMarkAbsence} disabled={!absenceMemberId || !absenceDate || absenceSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5">
                {absenceSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BedDouble className="h-3.5 w-3.5" />}
                Xác nhận nghỉ
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
