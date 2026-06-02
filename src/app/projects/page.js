'use client';

import { useEffect, useState, Fragment } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase, withTimeout } from '@/lib/supabase';
import { MOCK_PROJECTS, MOCK_SPRINTS } from '@/lib/mockData';
import {
  Plus, Trash2, Edit2, Loader2, AlertCircle, X,
  FolderKanban, ChevronRight, ChevronDown, Calendar,
  Check, Layers, Search,
} from 'lucide-react';

const PROJ_LS  = 'aerotask_projects';
const SPRINT_LS = 'aerotask_sprints';

const STATUS_PROJECT = {
  active:   { label: 'Đang hoạt động', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  completed:{ label: 'Hoàn thành',     cls: 'bg-sky-500/10    text-sky-600    dark:text-sky-400    border-sky-500/20'    },
  archived: { label: 'Lưu trữ',        cls: 'bg-slate-500/10  text-slate-500  dark:text-slate-400  border-slate-500/20'  },
};

const STATUS_SPRINT = {
  planned:   { label: 'Kế hoạch',    cls: 'bg-slate-500/10  text-slate-500  dark:text-slate-400  border-slate-500/20'  },
  active:    { label: 'Đang chạy',   cls: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
  completed: { label: 'Hoàn thành',  cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
};

const selectCls = 'w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer';
const inputCls  = 'w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-950/80';
const labelCls  = 'block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';

export default function ProjectsPage() {
  const { hasPermission } = useAuth();

  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const [projects, setProjects] = useState([]);
  const [sprints, setSprints]   = useState([]);
  const [expanded, setExpanded] = useState({});
  const [search, setSearch]     = useState('');

  const canCreate = hasPermission('projects', 'create') || !isSupabaseConfigured;
  const canUpdate = hasPermission('projects', 'update') || !isSupabaseConfigured;
  const canDelete = hasPermission('projects', 'delete') || !isSupabaseConfigured;

  // ─── Project form state ───────────────────────────────────────────────────
  const [projModal, setProjModal]   = useState(false);
  const [editingProj, setEditingProj] = useState(null);
  const [projCode, setProjCode]     = useState('');
  const [projName, setProjName]     = useState('');
  const [projDesc, setProjDesc]     = useState('');
  const [projStatus, setProjStatus] = useState('active');

  // ─── Sprint form state ────────────────────────────────────────────────────
  const [sprintModal, setSprintModal]     = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);
  const [sprintProjId, setSprintProjId]   = useState('');
  const [sprintCode, setSprintCode]       = useState('');
  const [sprintName, setSprintName]       = useState('');
  const [sprintStart, setSprintStart]     = useState('');
  const [sprintEnd, setSprintEnd]         = useState('');
  const [sprintStatus, setSprintStatus]   = useState('planned');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState('');

  // ─── Init ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key || url.includes('your_supabase_project_url')) {
      setIsSupabaseConfigured(false);
      loadMock();
      setLoading(false);
      return;
    }
    fetchAll();
  }, []);

  const loadMock = () => {
    try {
      const ps = localStorage.getItem(PROJ_LS);
      setProjects(ps ? JSON.parse(ps) : MOCK_PROJECTS);
      const ss = localStorage.getItem(SPRINT_LS);
      setSprints(ss ? JSON.parse(ss) : MOCK_SPRINTS);
    } catch {
      setProjects(MOCK_PROJECTS);
      setSprints(MOCK_SPRINTS);
    }
  };

  const saveMockProjects = (next) => {
    try { localStorage.setItem(PROJ_LS, JSON.stringify(next)); } catch {}
    setProjects(next);
  };
  const saveMockSprints = (next) => {
    try { localStorage.setItem(SPRINT_LS, JSON.stringify(next)); } catch {}
    setSprints(next);
  };

  const fetchAll = async () => {
    try {
      setLoading(true); setError('');
      const [{ data: pd, error: pe }, { data: sd, error: se }] = await Promise.all([
        withTimeout(supabase.from('projects').select('*').order('code')),
        withTimeout(supabase.from('sprints').select('*').order('project_id,code')),
      ]);
      if (pe) throw pe;
      if (se) throw se;
      setProjects(pd || []);
      setSprints(sd  || []);
    } catch (e) {
      setError(e.message || 'Không thể tải dữ liệu dự án.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Project CRUD ─────────────────────────────────────────────────────────
  const openAddProj = () => {
    setEditingProj(null); setProjCode(''); setProjName(''); setProjDesc(''); setProjStatus('active');
    setFormError(''); setProjModal(true);
  };
  const openEditProj = (p) => {
    setEditingProj(p); setProjCode(p.code); setProjName(p.name); setProjDesc(p.description || ''); setProjStatus(p.status);
    setFormError(''); setProjModal(true);
  };

  const handleProjSubmit = async (e) => {
    e.preventDefault();
    if (!projCode.trim() || !projName.trim()) { setFormError('Vui lòng nhập Mã và Tên dự án.'); return; }
    setSubmitting(true); setFormError('');
    try {
      const payload = { code: projCode.trim(), name: projName.trim(), description: projDesc.trim() || null, status: projStatus };
      if (!isSupabaseConfigured) {
        if (editingProj) {
          saveMockProjects(projects.map(p => p.id === editingProj.id ? { ...p, ...payload } : p));
        } else {
          saveMockProjects([...projects, { id: 'proj-' + Date.now(), ...payload, created_at: new Date().toISOString() }]);
        }
        setProjModal(false); return;
      }
      if (editingProj) {
        const { error } = await withTimeout(supabase.from('projects').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingProj.id));
        if (error) throw error;
        setProjects(prev => prev.map(p => p.id === editingProj.id ? { ...p, ...payload } : p));
      } else {
        const { data, error } = await withTimeout(supabase.from('projects').insert(payload).select().single());
        if (error) throw error;
        if (data) setProjects(prev => [...prev, data]);
      }
      setProjModal(false);
    } catch (e) { setFormError(e.message || 'Không thể lưu dự án.'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteProj = async (id, code) => {
    if (!confirm(`Xóa dự án "${code}"? Tất cả Sprint thuộc dự án này cũng bị xóa.`)) return;
    try {
      if (!isSupabaseConfigured) {
        saveMockProjects(projects.filter(p => p.id !== id));
        saveMockSprints(sprints.filter(s => s.project_id !== id));
        return;
      }
      const { data: del, error } = await withTimeout(supabase.from('projects').delete().eq('id', id).select('id'));
      if (error) throw error;
      if (!del || del.length === 0) throw new Error('Không thể xóa (kiểm tra RLS policy DELETE).');
      setProjects(prev => prev.filter(p => p.id !== id));
      setSprints(prev => prev.filter(s => s.project_id !== id));
    } catch (e) { setError('Lỗi xóa dự án: ' + e.message); }
  };

  // ─── Sprint CRUD ──────────────────────────────────────────────────────────
  const openAddSprint = (projId) => {
    setEditingSprint(null); setSprintProjId(projId); setSprintCode(''); setSprintName('');
    setSprintStart(''); setSprintEnd(''); setSprintStatus('planned');
    setFormError(''); setSprintModal(true);
  };
  const openEditSprint = (s) => {
    setEditingSprint(s); setSprintProjId(s.project_id); setSprintCode(s.code); setSprintName(s.name);
    setSprintStart(s.start_date || ''); setSprintEnd(s.end_date || ''); setSprintStatus(s.status);
    setFormError(''); setSprintModal(true);
  };

  const handleSprintSubmit = async (e) => {
    e.preventDefault();
    if (!sprintCode.trim() || !sprintName.trim()) { setFormError('Vui lòng nhập Mã và Tên sprint.'); return; }
    setSubmitting(true); setFormError('');
    try {
      const payload = { project_id: sprintProjId, code: sprintCode.trim(), name: sprintName.trim(), start_date: sprintStart || null, end_date: sprintEnd || null, status: sprintStatus };
      if (!isSupabaseConfigured) {
        if (editingSprint) {
          saveMockSprints(sprints.map(s => s.id === editingSprint.id ? { ...s, ...payload } : s));
        } else {
          saveMockSprints([...sprints, { id: 'sp-' + Date.now(), ...payload, created_at: new Date().toISOString() }]);
        }
        setSprintModal(false); return;
      }
      if (editingSprint) {
        const { error } = await withTimeout(supabase.from('sprints').update(payload).eq('id', editingSprint.id));
        if (error) throw error;
        setSprints(prev => prev.map(s => s.id === editingSprint.id ? { ...s, ...payload } : s));
      } else {
        const { data, error } = await withTimeout(supabase.from('sprints').insert(payload).select().single());
        if (error) throw error;
        if (data) setSprints(prev => [...prev, data]);
      }
      setSprintModal(false);
    } catch (e) { setFormError(e.message || 'Không thể lưu sprint.'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteSprint = async (id) => {
    if (!confirm('Xóa Sprint này?')) return;
    try {
      if (!isSupabaseConfigured) { saveMockSprints(sprints.filter(s => s.id !== id)); return; }
      const { data: del, error } = await withTimeout(supabase.from('sprints').delete().eq('id', id).select('id'));
      if (error) throw error;
      if (!del || del.length === 0) throw new Error('Không thể xóa (kiểm tra RLS policy DELETE).');
      setSprints(prev => prev.filter(s => s.id !== id));
    } catch (e) { setError('Lỗi xóa sprint: ' + e.message); }
  };

  // ─── Derived ──────────────────────────────────────────────────────────────
  const filtered = projects.filter(p =>
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2.5">
              <FolderKanban className="h-6 w-6 text-indigo-500" />
              Quản lý Dự án
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Danh sách dự án và các Sprint trực thuộc
            </p>
          </div>
          {canCreate && (
            <button onClick={openAddProj} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all cursor-pointer">
              <Plus className="h-4 w-4" /> Thêm dự án
            </button>
          )}
        </div>

        {!isSupabaseConfigured && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Chế độ xem trước — dữ liệu lưu trong trình duyệt, không kết nối cơ sở dữ liệu thực.
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            <button onClick={() => { setError(''); fetchAll(); }} className="ml-auto underline">Thử lại</button>
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm mã hoặc tên dự án..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>

        {/* Table */}
        <div className="glass-panel rounded-2xl overflow-hidden shadow-sm dark:shadow-xl border border-slate-200 dark:border-slate-800/60">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              <span className="text-xs text-slate-500">Đang tải dữ liệu dự án...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-sm">Chưa có dự án nào. Nhấn "Thêm dự án" để bắt đầu.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4 w-[14%]">Mã dự án</th>
                  <th className="px-6 py-4 w-[28%]">Tên dự án</th>
                  <th className="px-6 py-4 w-[30%]">Mô tả</th>
                  <th className="px-6 py-4 w-[10%] text-center">Trạng thái</th>
                  <th className="px-6 py-4 w-[8%] text-center">Sprint</th>
                  <th className="px-6 py-4 w-[10%] text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {filtered.map(proj => {
                  const projSprints = sprints.filter(s => s.project_id === proj.id);
                  const isExpanded = !!expanded[proj.id];
                  const st = STATUS_PROJECT[proj.status] || STATUS_PROJECT.active;
                  return (
                    <Fragment key={proj.id}>
                      <tr onClick={() => setExpanded(p => ({ ...p, [proj.id]: !p[proj.id] }))}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors group cursor-pointer">
                        <td className="px-6 py-4 font-bold text-sm text-indigo-600 dark:text-indigo-400">
                          <div className="flex items-center gap-2">
                            {projSprints.length > 0
                              ? (isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />)
                              : <span className="w-4 h-4 shrink-0" />}
                            {proj.code}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-800 dark:text-slate-200">{proj.name}</td>
                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">{proj.description || <span className="text-slate-300 dark:text-slate-700 italic">—</span>}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{projSprints.length}</span>
                        </td>
                        <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canUpdate && (
                              <button onClick={() => openEditProj(proj)} className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-500/10 transition-all cursor-pointer" title="Chỉnh sửa">
                                <Edit2 className="h-4 w-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button onClick={() => handleDeleteProj(proj.id, proj.code)} className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-all cursor-pointer" title="Xóa">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/40 dark:bg-slate-950/20">
                          <td colSpan={6} className="px-8 py-4 border-b border-slate-200/60 dark:border-slate-800/40">
                            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900/30">
                              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <Layers className="h-3.5 w-3.5" /> Danh sách Sprint ({projSprints.length})
                                </span>
                                {canCreate && (
                                  <button onClick={() => openAddSprint(proj.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-colors cursor-pointer">
                                    <Plus className="h-3 w-3" /> Thêm Sprint
                                  </button>
                                )}
                              </div>
                              {projSprints.length === 0 ? (
                                <p className="px-4 py-5 text-xs text-slate-400 dark:text-slate-600 italic text-center">Chưa có sprint nào. Nhấn "Thêm Sprint" để tạo.</p>
                              ) : (
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-200/60 dark:border-slate-800/40">
                                      <th className="px-4 py-2.5 w-[12%]">Mã</th>
                                      <th className="px-4 py-2.5 w-[34%]">Tên Sprint</th>
                                      <th className="px-4 py-2.5 w-[18%] text-center">Bắt đầu</th>
                                      <th className="px-4 py-2.5 w-[18%] text-center">Kết thúc</th>
                                      <th className="px-4 py-2.5 w-[12%] text-center">Trạng thái</th>
                                      <th className="px-4 py-2.5 w-[6%] text-right"></th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                                    {projSprints.map(sp => {
                                      const sst = STATUS_SPRINT[sp.status] || STATUS_SPRINT.planned;
                                      return (
                                        <tr key={sp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/20 transition-colors group">
                                          <td className="px-4 py-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">{sp.code}</td>
                                          <td className="px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">{sp.name}</td>
                                          <td className="px-4 py-2.5 text-center">
                                            {sp.start_date ? <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1"><Calendar className="h-3 w-3" />{sp.start_date}</span> : <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>}
                                          </td>
                                          <td className="px-4 py-2.5 text-center">
                                            {sp.end_date ? <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1"><Calendar className="h-3 w-3" />{sp.end_date}</span> : <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>}
                                          </td>
                                          <td className="px-4 py-2.5 text-center">
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border ${sst.cls}`}>{sst.label}</span>
                                          </td>
                                          <td className="px-4 py-2.5 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              {canUpdate && (
                                                <button onClick={() => openEditSprint(sp)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-500/10 transition-all cursor-pointer"><Edit2 className="h-3.5 w-3.5" /></button>
                                              )}
                                              {canDelete && (
                                                <button onClick={() => handleDeleteSprint(sp.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-all cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Modal: Project ─────────────────────────────────────────────────── */}
      {projModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-500/15 backdrop-blur-md" onClick={() => setProjModal(false)} />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-800 dark:text-white">
                {editingProj ? 'Chỉnh sửa Dự án' : 'Thêm Dự án mới'}
              </h2>
              <button onClick={() => setProjModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            {formError && <p className="mb-4 text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{formError}</p>}
            <form onSubmit={handleProjSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Mã dự án <span className="text-rose-500">*</span></label>
                  <input value={projCode} onChange={e => setProjCode(e.target.value)} placeholder="PROJ-01" required className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Trạng thái</label>
                  <select value={projStatus} onChange={e => setProjStatus(e.target.value)} className={selectCls}>
                    <option value="active">Đang hoạt động</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="archived">Lưu trữ</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Tên dự án <span className="text-rose-500">*</span></label>
                <input value={projName} onChange={e => setProjName(e.target.value)} placeholder="Tên đầy đủ của dự án" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Mô tả</label>
                <textarea value={projDesc} onChange={e => setProjDesc(e.target.value)} rows={3} placeholder="Mô tả ngắn về dự án..." className={inputCls + ' resize-none'} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setProjModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">Hủy</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {editingProj ? 'Lưu thay đổi' : 'Tạo dự án'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Sprint ──────────────────────────────────────────────────── */}
      {sprintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-500/15 backdrop-blur-md" onClick={() => setSprintModal(false)} />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-800 dark:text-white">
                {editingSprint ? 'Chỉnh sửa Sprint' : 'Thêm Sprint mới'}
              </h2>
              <button onClick={() => setSprintModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            {formError && <p className="mb-4 text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{formError}</p>}
            <form onSubmit={handleSprintSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Mã sprint <span className="text-rose-500">*</span></label>
                  <input value={sprintCode} onChange={e => setSprintCode(e.target.value)} placeholder="S01" required className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Trạng thái</label>
                  <select value={sprintStatus} onChange={e => setSprintStatus(e.target.value)} className={selectCls}>
                    <option value="planned">Kế hoạch</option>
                    <option value="active">Đang chạy</option>
                    <option value="completed">Hoàn thành</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Tên sprint <span className="text-rose-500">*</span></label>
                <input value={sprintName} onChange={e => setSprintName(e.target.value)} placeholder="Tên mô tả sprint" required className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Ngày bắt đầu</label>
                  <input type="date" value={sprintStart} onChange={e => setSprintStart(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Ngày kết thúc</label>
                  <input type="date" value={sprintEnd} onChange={e => setSprintEnd(e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setSprintModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">Hủy</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {editingSprint ? 'Lưu thay đổi' : 'Tạo sprint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
