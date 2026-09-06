import {
  BarChart3, Briefcase, CalendarClock, FileText, Kanban, Sun, Users,
} from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/', label: 'Today', icon: Sun, end: true, title: 'Today' },
  { to: '/board', label: 'Board', icon: Kanban, title: 'Pipeline' },
  { to: '/applications', label: 'Applications', icon: Briefcase, title: 'Applications' },
  { to: '/interviews', label: 'Interviews', icon: CalendarClock, title: 'Interviews' },
  { to: '/contacts', label: 'Contacts', icon: Users, title: 'Contacts' },
  { to: '/documents', label: 'Documents', icon: FileText, title: 'Documents' },
  { to: '/insights', label: 'Insights', icon: BarChart3, title: 'Insights' },
];

/** The four that earn a slot in the phone tab bar. */
export const MOBILE_PRIMARY = ['/', '/board'];
export const MOBILE_SECONDARY = ['/interviews'];
