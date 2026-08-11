import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  Warehouse,
  FileText,
  LogOut,
  Building2,
  Menu,
  X,
  User as UserIcon,
  UserPlus,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard size={16} /> },
  { label: 'Customers', to: '/customers', icon: <Users size={16} />, roles: ['ADMIN', 'SALES', 'ACCOUNTS'] },
  { label: 'Products', to: '/products', icon: <Package size={16} /> },
  { label: 'Stock', to: '/stock', icon: <Warehouse size={16} /> },
  { label: 'Challans', to: '/challans', icon: <FileText size={16} />, roles: ['ADMIN', 'SALES', 'ACCOUNTS'] },
  { label: 'Users', to: '/users', icon: <UserPlus size={16} />, roles: ['ADMIN'] },
];

export const Navbar: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleItems = navItems.filter(
    (item) => !item.roles || hasRole(...(item.roles as Parameters<typeof hasRole>))
  );

  return (
    <header className="bg-zinc-950 text-zinc-100 border-b border-zinc-800 sticky top-0 z-50 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <div className="w-8 h-8 bg-zinc-100 text-zinc-950 rounded flex items-center justify-center font-bold shadow-sm">
                <Building2 size={18} />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-white block leading-none">MINI ERP</span>
                <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase block mt-1">Operations Portal</span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {visibleItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-zinc-800 text-white font-semibold shadow-inner border border-zinc-700/60'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                    )
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Right: Theme Toggle, User Profile & Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Sun / Moon Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-md border border-transparent hover:border-zinc-800 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-700"
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun size={18} className="text-amber-400 transition-transform duration-200 hover:rotate-45" />
              ) : (
                <Moon size={18} className="transition-transform duration-200 hover:-rotate-12" />
              )}
            </button>

            {user && (
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800">
                <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
                  <UserIcon size={12} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-zinc-200 leading-tight">{user.name}</p>
                  <span className="inline-block text-[10px] font-mono font-medium text-zinc-400 leading-none">
                    {user.role}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-md border border-transparent hover:border-zinc-800 transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Actions & Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-md transition-all cursor-pointer"
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun size={18} className="text-amber-400" />
              ) : (
                <Moon size={18} />
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-900 focus:outline-none"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 pt-2 pb-4 space-y-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium',
                  isActive ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                )
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}

          {user && (
            <div className="pt-3 mt-3 border-t border-zinc-800 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-200">{user.name}</p>
                <p className="text-xs text-zinc-500 font-mono">{user.role}</p>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-md"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
