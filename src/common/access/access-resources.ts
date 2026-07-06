import { AccessLevel } from '../enums/access-level.enum';
import { UserRole } from '../enums/user-role.enum';

// Stable keys used by @Access('<key>') on controllers and stored in the
// role_permissions table. Adding a new admin module = add a key here + a
// default row below. SuperAdmin is never listed: it always bypasses to Full.

export const ACCESS_RESOURCES = [
  { key: 'dashboard', label: 'Dashboard', group: 'Overview' },
  { key: 'leads', label: 'Leads', group: 'Admissions' },
  { key: 'admissions', label: 'Admissions', group: 'Admissions' },
  { key: 'students', label: 'Students', group: 'Academics' },
  { key: 'enrollments', label: 'Enrollments', group: 'Academics' },
  { key: 'courses', label: 'Courses', group: 'Academics' },
  { key: 'lessons', label: 'Lessons', group: 'Academics' },
  { key: 'batches', label: 'Batches', group: 'Academics' },
  { key: 'attendance', label: 'Attendance', group: 'Academics' },
  { key: 'assignments', label: 'Assignments', group: 'Academics' },
  { key: 'submissions', label: 'Submissions', group: 'Academics' },
  { key: 'categories', label: 'Categories', group: 'Academics' },
  { key: 'instructors', label: 'Instructors', group: 'Academics' },
  { key: 'certificates', label: 'Certificates', group: 'Academics' },
  { key: 'fees', label: 'Fees', group: 'Finance' },
  { key: 'payments', label: 'Payments', group: 'Finance' },
  { key: 'invoices', label: 'Invoices', group: 'Finance' },
  { key: 'notifications', label: 'Notifications', group: 'Engagement' },
  { key: 'blog', label: 'Blog', group: 'Engagement' },
  { key: 'reports', label: 'Reports', group: 'System' },
  { key: 'settings', label: 'Settings', group: 'System' },
  { key: 'users', label: 'Users', group: 'System' },
  { key: 'audit-logs', label: 'Audit logs', group: 'System' },
  { key: 'access-control', label: 'Access control', group: 'System' },
] as const;

export type AccessResourceKey = (typeof ACCESS_RESOURCES)[number]['key'];

export const ACCESS_RESOURCE_KEYS = ACCESS_RESOURCES.map((r) => r.key);

// Roles whose access is editable by the SuperAdmin from the Access Control UI.
// SuperAdmin (always Full) and Student (fixed to its own portal) are excluded.
export const MANAGED_ROLES: UserRole[] = [
  UserRole.Admin,
  UserRole.Staff,
  UserRole.Instructor,
];

type Matrix = Record<string, Record<string, AccessLevel>>;

const F = AccessLevel.Full;
const R = AccessLevel.Read;
const N = AccessLevel.None;

// Default matrix = the approved "after" design. Instructor's real teaching
// powers live in the role-locked /instructor portal, so its admin-console
// defaults are None (a SuperAdmin may still grant more here later).
export const DEFAULT_MATRIX: Matrix = {
  [UserRole.Admin]: {
    dashboard: F, leads: F, admissions: F, students: F, enrollments: F,
    courses: F, lessons: F, batches: F, attendance: F, assignments: F,
    submissions: F, categories: F, instructors: F, certificates: F,
    fees: F, payments: F, invoices: F, notifications: F, blog: F,
    reports: F, settings: F, users: R, 'audit-logs': F, 'access-control': N,
  },
  [UserRole.Staff]: {
    dashboard: R, leads: F, admissions: F, students: F, enrollments: F,
    courses: N, lessons: N, batches: R, attendance: R, assignments: N,
    submissions: N, categories: N, instructors: N, certificates: N,
    fees: R, payments: R, invoices: R, notifications: F, blog: N,
    reports: R, settings: N, users: N, 'audit-logs': N, 'access-control': N,
  },
  [UserRole.Instructor]: {
    dashboard: N, leads: N, admissions: N, students: N, enrollments: N,
    courses: N, lessons: N, batches: N, attendance: N, assignments: N,
    submissions: N, categories: N, instructors: N, certificates: N,
    fees: N, payments: N, invoices: N, notifications: N, blog: N,
    reports: N, settings: N, users: N, 'audit-logs': N, 'access-control': N,
  },
};

export function defaultLevel(role: UserRole, resource: string): AccessLevel {
  if (role === UserRole.SuperAdmin) return AccessLevel.Full;
  return DEFAULT_MATRIX[role]?.[resource] ?? AccessLevel.None;
}
