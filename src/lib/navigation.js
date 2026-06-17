// Registry trung tâm cho toàn bộ chức năng trong hệ thống.
// Mỗi entry tương ứng với một resource trong bảng permissions của Supabase.
// Khi thêm chức năng mới: (1) thêm entry ở đây, (2) cập nhật defaultPerms trong admin/roles/page.js, (3) chạy SQL INSERT permissions.
export const NAV_ITEMS = [
  {
    resource: 'dashboard',
    label: 'Tổng quan',
    adminLabel: 'Tổng quan (Dashboard)',
    desc: 'Trang tổng quan, thống kê và biểu đồ tiến độ dự án',
    href: '/',
  },
  {
    resource: 'projects',
    label: 'Dự án',
    adminLabel: 'Quản lý Dự án & Sprint',
    desc: 'Quản lý danh sách dự án, tạo và theo dõi các sprint trong từng dự án',
    href: '/projects',
  },
  {
    resource: 'tasks',
    label: 'Công việc',
    adminLabel: 'Quản lý Công việc (Tasks)',
    desc: 'Thao tác trên bảng tiến độ công việc Kanban và phân công',
    href: '/tasks',
  },
  {
    resource: 'use_cases',
    label: 'Use Cases',
    adminLabel: 'Quản lý Use Cases',
    desc: 'Xem, tạo mới, chỉnh sửa và xóa danh sách kịch bản nghiệp vụ Use Case và Transaction',
    href: '/use-cases',
  },
  {
    resource: 'daily_logs',
    label: 'Nhật ký hàng ngày',
    adminLabel: 'Quản lý Nhật ký hàng ngày',
    desc: 'Ghi chép công việc hàng ngày, phê duyệt nhật ký thành viên và theo dõi tiến độ',
    href: '/daily-logs',
  },
  {
    resource: 'team_logs',
    label: 'Nhật ký thành viên',
    adminLabel: 'Nhật ký thành viên (Team Logs)',
    desc: 'Xem và phê duyệt nhật ký của tất cả thành viên theo ngày hoặc khoảng thời gian',
    href: '/team-logs',
  },
  {
    resource: 'statistics',
    label: 'Thống kê',
    adminLabel: 'Thống kê & Hiệu suất',
    desc: 'Biểu đồ tình hình công việc và xếp hạng hiệu suất thành viên',
    href: '/statistics',
  },
  {
    resource: 'documents',
    label: 'Tài liệu',
    adminLabel: 'Tài liệu liên quan (Documents)',
    desc: 'Tổng hợp tất cả tài liệu, đường dẫn được khai báo trong nhật ký hàng ngày',
    href: '/documents',
  },
  {
    resource: 'notifications',
    label: 'Thông báo',
    adminLabel: 'Quản lý Thông báo',
    desc: 'Nhận và gửi thông báo nội bộ đến các thành viên trong hệ thống',
    href: '/notifications',
  },
  {
    resource: 'users',
    label: 'Thành viên',
    adminLabel: 'Quản lý Thành viên (Users)',
    desc: 'Xem danh sách, thêm tài khoản và gán vai trò ban đầu',
    href: '/admin/users',
  },
  {
    resource: 'roles',
    label: 'Phân quyền',
    adminLabel: 'Quản lý Phân quyền (Roles)',
    desc: 'Chỉnh sửa ma trận quyền hạn chi tiết của từng vai trò',
    href: '/admin/roles',
  },
];
