'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase, withTimeout } from '@/lib/supabase';
import { MOCK_PROJECTS } from '@/lib/mockData';
import {
  Link2,
  Search,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  CalendarDays,
  FolderKanban,
  User,
  FileSearch,
  ChevronRight,
} from 'lucide-react';

const _MOCK_DOCS = [
  {
    id: 'log2-lk1',
    url: 'https://supabase.com/docs',
    label: 'Supabase Docs',
    log_id: 'log2',
    log_date: '2026-05-29',
    log_title: 'Cài đặt Supabase',
    user_id: 'preview',
    author_name: 'Nguyễn Văn Dev',
    project_id: null,
    project_name: null,
  },
  {
    id: 'log2-lk2',
    url: 'https://nextjs.org/docs',
    label: 'Next.js Documentation',
    log_id: 'log2',
    log_date: '2026-05-29',
    log_title: 'Cài đặt Supabase',
    user_id: 'preview',
    author_name: 'Nguyễn Văn Dev',
    project_id: null,
    project_name: null,
  },
  {
    id: 'log1-lk1',
    url: 'https://tailwindcss.com/docs',
    label: 'Tailwind CSS Docs',
    log_id: 'log1',
    log_date: '2026-05-28',
    log_title: 'Review sprint và hoàn thiện UI Dashboard',
    user_id: 'preview',
    author_name: 'Nguyễn Văn Dev',
    project_id: null,
    project_name: null,
  },
];

function formatDate(d) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

// Giống extractLinksFromHtml trong daily-logs: lấy cả <a href> và plain-text URLs
function extractLinksFromContent(html) {
  if (!html || typeof window === 'undefined') return [];
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
      result.push({ url, label: a.textContent?.trim() || url });
    });
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    const urlRegex = /https?:\/\/[^\s<>"']+/g;
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement?.tagName === 'A') continue;
      const matches = node.textContent.match(urlRegex) || [];
      for (const url of matches) {
        if (seen.has(url)) continue;
        seen.add(url);
        result.push({ url, label: url });
      }
    }
    return result;
  } catch {
    return [];
  }
}

export default function DocumentsPage() {
  const router = useRouter();
  const { user, role } = useAuth();

  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [docs, setDocs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const firstOfMonthStr = todayStr.slice(0, 8) + '01';

  const [searchText, setSearchText] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterMember, setFilterMember] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState(firstOfMonthStr);
  const [filterDateTo, setFilterDateTo] = useState(todayStr);

  const isAdmin = role?.name === 'Admin';
  const isManager = role?.name === 'Manager';
  const isManagerOrAdmin = isAdmin || isManager;

  const fetchData = useCallback(async () => {
    if (!user?.id) return; // chờ user load xong
    setLoading(true);
    setError('');

    if (!isSupabaseConfigured) {
      setDocs(_MOCK_DOCS);
      setProjects(MOCK_PROJECTS);
      setLoading(false);
      return;
    }

    try {
      // 1. Xác định danh sách user_id được phép xem
      let visibleUserIds = null; // null = Admin, không filter

      if (isManager) {
        const { data: subs } = await withTimeout(
          supabase.from('profiles').select('id').eq('manager_id', user.id)
        );
        visibleUserIds = [user.id, ...(subs || []).map(s => s.id)];
      } else if (!isAdmin) {
        visibleUserIds = [user.id];
      }

      // 2. Fetch song song: logs (không dùng FK join để tránh bỏ sót rows),
      //    profiles, projects, members dropdown
      let logsQuery = supabase.from('daily_logs')
        .select('id, log_date, title, content, user_id, project_id, related_links')
        .order('log_date', { ascending: false });
      if (visibleUserIds) logsQuery = logsQuery.in('user_id', visibleUserIds);

      let membersQuery = null;
      if (isAdmin) {
        membersQuery = supabase.from('profiles').select('id, full_name').order('full_name');
      } else if (isManager) {
        membersQuery = supabase.from('profiles').select('id, full_name').eq('manager_id', user.id).order('full_name');
      }

      const parallelQueries = [
        withTimeout(logsQuery),
        withTimeout(supabase.from('profiles').select('id, full_name')),
        withTimeout(supabase.from('projects').select('id, name, code').order('name')),
        ...(membersQuery ? [withTimeout(membersQuery)] : []),
      ];

      const results = await Promise.all(parallelQueries);
      const [logsRes, profilesRes, projectsRes, membersRes] = results;

      if (logsRes.error) throw logsRes.error;

      // 3. Build lookup maps
      const profileMap = Object.fromEntries((profilesRes.data || []).map(p => [p.id, p.full_name]));
      const projectMap = Object.fromEntries((projectsRes.data || []).map(p => [p.id, p]));

      // 4. Flatten links từ tất cả logs — merge related_links (explicit) + links trong content (auto-detect)
      const flattened = [];
      for (const log of logsRes.data || []) {
        const savedLinks = Array.isArray(log.related_links) ? log.related_links : [];
        const detectedLinks = extractLinksFromContent(log.content || '');
        // Merge: savedLinks trước, bổ sung detected nếu URL chưa có
        const savedUrls = new Set(savedLinks.map(l => l.url));
        const allLinks = [...savedLinks, ...detectedLinks.filter(l => !savedUrls.has(l.url))];
        if (allLinks.length === 0) continue;
        const proj = projectMap[log.project_id];
        for (const link of allLinks) {
          if (!link.url?.trim()) continue;
          flattened.push({
            id: `${log.id}::${link.url}`,
            url: link.url.trim(),
            label: link.label?.trim() || link.url.trim(),
            log_id: log.id,
            log_date: log.log_date,
            log_title: log.title?.trim() || '(Chưa đặt tiêu đề)',
            user_id: log.user_id,
            author_name: profileMap[log.user_id] || 'Người dùng',
            project_id: log.project_id,
            project_name: proj ? `[${proj.code}] ${proj.name}` : null,
          });
        }
      }
      setDocs(flattened);

      if (!projectsRes.error && projectsRes.data) setProjects(projectsRes.data);
      if (membersRes && !membersRes.error && membersRes.data) setMembers(membersRes.data);
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  }, [isSupabaseConfigured, isAdmin, isManager, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key || url.includes('your_supabase_project_url')) {
      setIsSupabaseConfigured(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredDocs = useMemo(() => {
    let result = docs;
    const q = searchText.trim().toLowerCase();
    if (q) {
      result = result.filter(d =>
        d.label?.toLowerCase().includes(q) ||
        d.url?.toLowerCase().includes(q) ||
        d.log_title?.toLowerCase().includes(q) ||
        d.author_name?.toLowerCase().includes(q) ||
        d.project_name?.toLowerCase().includes(q)
      );
    }
    if (filterProject) result = result.filter(d => d.project_id === filterProject);
    if (filterMember) result = result.filter(d => d.user_id === filterMember);
    if (filterDateFrom) result = result.filter(d => d.log_date >= filterDateFrom);
    if (filterDateTo) result = result.filter(d => d.log_date <= filterDateTo);
    return result;
  }, [docs, searchText, filterProject, filterMember, filterDateFrom, filterDateTo]);

  const clearFilters = () => {
    setSearchText('');
    setFilterProject('');
    setFilterMember('');
    setFilterDateFrom(firstOfMonthStr);
    setFilterDateTo(todayStr);
  };

  const hasActiveFilters = !!(
    searchText || filterProject || filterMember ||
    filterDateFrom !== firstOfMonthStr || filterDateTo !== todayStr
  );

  const goToLog = (doc) => {
    localStorage.setItem('aerotask_goto_log_date', doc.log_date);
    if (doc.user_id !== user?.id) {
      localStorage.setItem('aerotask_viewing_user_id', doc.user_id);
    }
    router.push('/daily-logs');
  };

  // Group docs by date for the list display
  const groupedByDate = useMemo(() => {
    const groups = [];
    const seen = new Map();
    for (const doc of filteredDocs) {
      if (!seen.has(doc.log_date)) {
        seen.set(doc.log_date, groups.length);
        groups.push({ date: doc.log_date, items: [doc] });
      } else {
        groups[seen.get(doc.log_date)].items.push(doc);
      }
    }
    return groups;
  }, [filteredDocs]);

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2.5">
              <Link2 className="h-5 w-5 text-indigo-500" />
              Tài liệu liên quan
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Tổng hợp tất cả đường dẫn, tài liệu được khai báo trong nhật ký hàng ngày
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 rounded-xl text-rose-700 dark:text-rose-400 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={fetchData} className="shrink-0 px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/30 hover:bg-rose-200 dark:hover:bg-rose-800/40 text-xs font-bold transition-colors cursor-pointer">
              Thử lại
            </button>
          </div>
        )}

        {/* Search + Filters */}
        <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder="Tìm theo tên tài liệu, URL, tác giả, dự án..."
                className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {searchText && (
                <button onClick={() => setSearchText('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Project filter */}
            <select
              value={filterProject}
              onChange={e => setFilterProject(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
            >
              <option value="">Tất cả dự án</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
              ))}
            </select>

            {/* Member filter — managers only */}
            {isManagerOrAdmin && members.length > 0 && (
              <select
                value={filterMember}
                onChange={e => setFilterMember(e.target.value)}
                className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                <option value="">Tất cả thành viên</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.full_name}</option>
                ))}
              </select>
            )}

            {/* Date range */}
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                title="Từ ngày"
                className="text-xs px-2.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs text-slate-400 shrink-0">—</span>
              <input
                type="date"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                title="Đến ngày"
                className="text-xs px-2.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                Xóa bộ lọc
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/50">
            <FileSearch className="h-3.5 w-3.5 shrink-0" />
            {loading ? (
              <span>Đang tải...</span>
            ) : (
              <span>
                <strong className="text-slate-600 dark:text-slate-300">{filteredDocs.length}</strong> tài liệu
                {hasActiveFilters && (
                  <> trong tổng số <strong className="text-slate-600 dark:text-slate-300">{docs.length}</strong></>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 dark:text-slate-600 gap-2.5">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">Đang tải tài liệu...</span>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <FileSearch className="h-12 w-12 text-slate-200 dark:text-slate-700" />
            <p className="text-sm font-medium text-slate-400 dark:text-slate-600">
              {hasActiveFilters ? 'Không tìm thấy tài liệu nào phù hợp' : 'Chưa có tài liệu nào được khai báo trong nhật ký'}
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-indigo-500 hover:text-indigo-600 underline cursor-pointer">
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByDate.map(group => (
              <div key={group.date}>
                {/* Date header */}
                <div className="flex items-center gap-3 mb-3">
                  <CalendarDays className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {formatDate(group.date)}
                  </span>
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                  <span className="text-[10px] text-slate-400 dark:text-slate-600">{group.items.length} tài liệu</span>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {group.items.map(doc => (
                    <div
                      key={doc.id}
                      className="glass-panel rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-start gap-3.5 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-sm transition-all"
                    >
                      {/* Icon */}
                      <div className="shrink-0 h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center mt-0.5">
                        <Link2 className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                      </div>

                      {/* Main */}
                      <div className="flex-1 min-w-0 overflow-hidden">
                        {/* Label + external link */}
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline max-w-full"
                        >
                          <span className="truncate">{doc.label}</span>
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </a>

                        {/* Domain */}
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          {getDomain(doc.url)}
                        </p>

                        {/* Meta */}
                        <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                          <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <User className="h-3 w-3" />
                            {doc.author_name}
                          </span>
                          {doc.project_name && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                              <FolderKanban className="h-3 w-3" />
                              {doc.project_name}
                            </span>
                          )}
                          <button
                            onClick={() => goToLog(doc)}
                            className="flex items-center gap-1 text-[11px] text-indigo-400 dark:text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-300 hover:underline cursor-pointer transition-colors"
                          >
                            <ChevronRight className="h-3 w-3" />
                            {doc.log_title}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
