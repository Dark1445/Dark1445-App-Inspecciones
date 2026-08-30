
import React from 'react';

export const PlusIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

export const CheckCircleIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const ClockIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const CogsIcon = () => <i className="fas fa-cogs"></i>;
export const SearchIcon = () => <i className="fas fa-search"></i>;
export const PdfIcon = () => <i className="fas fa-file-pdf"></i>;
export const MoonIcon = () => <i className="fas fa-moon"></i>;
export const SunIcon = () => <i className="fas fa-sun"></i>;
export const LogoutIcon = () => <i className="fas fa-sign-out-alt"></i>;
export const BellIcon = () => <i className="fas fa-bell"></i>;
export const TrashIcon = () => <i className="fas fa-trash-alt"></i>;
export const TimesIcon = () => <i className="fas fa-times"></i>;
export const ToolsIcon = () => <i className="fas fa-tools text-4xl text-blue-600 dark:text-blue-500"></i>;
export const PlaceholderIcon = () => <i className="fas fa-cogs text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>;
export const PencilIcon = () => <i className="fas fa-pencil-alt"></i>;
export const UserCircleIcon = () => <i className="fas fa-user-circle"></i>;
export const SyncIcon = () => <i className="fas fa-sync-alt"></i>;
export const EyeIcon = () => <i className="fas fa-eye"></i>;
export const EyeSlashIcon = () => <i className="fas fa-eye-slash"></i>;
export const ArrowsExpandIcon = () => <i className="fas fa-expand-arrows-alt"></i>;
export const ArrowsCollapseIcon = () => <i className="fas fa-compress-arrows-alt"></i>;
export const HistoryIcon = () => <i className="fas fa-history"></i>;

export const ChevronUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
);

export const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

export const ChevronLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

export const ChevronRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
);

// Icons for main views
export const GridViewIcon = () => <i className="fas fa-th-large"></i>;
export const WrenchIcon = () => <i className="fas fa-wrench"></i>;
export const ClipboardListIcon = () => <i className="fas fa-clipboard-list"></i>;
export const ShieldCheckIcon = () => <i className="fas fa-shield-alt"></i>;
export const UsersIcon = () => <i className="fas fa-users"></i>;
export const BookOpenIcon = () => <i className="fas fa-book-open"></i>;
export const CalendarDaysIcon = () => <i className="fas fa-calendar-days"></i>;
export const SettingsIcon = () => <i className="fas fa-cog"></i>;
export const TruckIcon = () => <i className="fas fa-truck"></i>;
export const ChartPieIcon = () => <i className="fas fa-chart-pie"></i>;
