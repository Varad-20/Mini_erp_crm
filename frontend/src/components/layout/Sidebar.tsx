import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  Warehouse,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Customers', to: '/customers', icon: <Users size={18} />, roles: ['ADMIN', 'SALES', 'ACCOUNTS'] },
  { label: 'Products', to: '/products', icon: <Package size={18} /> },
  { label: 'Stock', to: '/stock', icon: <Warehouse size={18} /> },
  { label: 'Challans', to: '/challans', icon: <FileText size={18} />, roles: ['ADMIN', 'SALES', 'ACCOUNTS'] },
];

export const Sidebar: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleItems = navItems.filter(
    (item) => !item.roles || hasRole(...(item.roles as Parameters<typeof hasRole>))
  );

  return (
    <aside
      className={cn(
        'flex flex-col bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-300 ease-in-out flex-shrink-0 relative z-20',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-slate-800/80', collapsed && 'justify-center px-2')}>
        <div className="w-8 h-8 bg-indigo-500 shadow-md shadow-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Building2 size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-white tracking-wide truncate">Mini ERP</p>
            <p className="text-xs text-slate-400 font-medium truncate">Operations Portal</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'sidebar-item',
                isActive ? 'sidebar-item-active' : 'sidebar-item-inactive',
                collapsed && 'justify-center px-2'
              )
            }
            title={collapsed ? item.label : undefined}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User & Actions */}
      <div className={cn('p-3 border-t border-slate-800 space-y-1', collapsed && 'flex flex-col items-center')}>
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'sidebar-item sidebar-item-inactive w-full',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>

        {/* User info */}
        {!collapsed && user && (
          <div className="px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 shadow-inner">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-indigo-300 font-medium tracking-wide truncate mt-0.5">{user.role}</p>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={cn(
            'sidebar-item sidebar-item-inactive w-full text-red-400 hover:text-red-300 hover:bg-red-900/20',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};
