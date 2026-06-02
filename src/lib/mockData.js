// Dữ liệu mẫu dùng chung cho Preview Mode (khi Supabase chưa cấu hình).
// Các trang Tasks, Nhật ký, Use Cases đọc từ localStorage nếu có, fallback về đây.

export const MOCK_PROJECTS = [
  {
    id: 'proj1',
    code: 'PROJ-01',
    name: 'AeroTask System',
    description: 'Hệ thống quản lý dự án nội bộ AeroTask.',
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'proj2',
    code: 'PROJ-02',
    name: 'National Law Portal',
    description: 'Cổng thông tin pháp luật quốc gia.',
    status: 'active',
    created_at: '2026-02-01T00:00:00Z',
  },
];

export const MOCK_SPRINTS = [
  { id: 'sp1', project_id: 'proj1', code: 'S01', name: 'Sprint 1 — Khởi tạo & Xác thực',   start_date: '2026-01-01', end_date: '2026-01-14', status: 'completed' },
  { id: 'sp2', project_id: 'proj1', code: 'S02', name: 'Sprint 2 — Tính năng cốt lõi',      start_date: '2026-01-15', end_date: '2026-01-28', status: 'completed' },
  { id: 'sp3', project_id: 'proj1', code: 'S03', name: 'Sprint 3 — Tính năng nâng cao',      start_date: '2026-01-29', end_date: '2026-02-11', status: 'active'    },
  { id: 'sp4', project_id: 'proj2', code: 'S01', name: 'Sprint 1 — Nghiên cứu & Phân tích', start_date: '2026-02-01', end_date: '2026-02-14', status: 'active'    },
];
