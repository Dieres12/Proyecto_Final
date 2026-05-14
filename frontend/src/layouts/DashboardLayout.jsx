// src/layouts/DashboardLayout.jsx
import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, GraduationCap, Bus, Map, CreditCard,
  ClipboardList, Navigation, LogOut, Menu, X, ChevronRight,
  UserCheck, Shield
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN', 'PADRE'] },
  { to: '/tracking', icon: Navigation, label: 'GPS en Vivo', roles: ['ADMIN', 'PADRE'] },
  { to: '/students', icon: GraduationCap, label: 'Estudiantes', roles: ['ADMIN', 'PADRE'] },
  { to: '/attendance', icon: ClipboardList, label: 'Asistencia', roles: ['ADMIN', 'PADRE'] },
  { to: '/payments', icon: CreditCard, label: 'Pagos', roles: ['ADMIN', 'PADRE'] },
  { to: '/parents', icon: Users, label: 'Padres', roles: ['ADMIN'] },
  { to: '/drivers', icon: UserCheck, label: 'Pilotos', roles: ['ADMIN'] },
  { to: '/buses', icon: Bus, label: 'Autobuses', roles: ['ADMIN'] },
  { to: '/routes', icon: Map, label: 'Rutas', roles: ['ADMIN'] },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNav = navItems.filter(item => item.roles.includes(user?.role));

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? 'w-full' : ''}`}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Bus size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm leading-none">Transportes</h1>
            <p className="text-brand-400 font-bold text-sm leading-none mt-0.5">Génesis</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50">
          <div className="w-8 h-8 rounded-full bg-brand-900 flex items-center justify-center flex-shrink-0">
            <span className="text-brand-400 font-bold text-xs">
              {user?.email?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.email}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Shield size={10} className="text-brand-400" />
              <span className="text-brand-400 text-xs">{user?.role}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {filteredNav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => mobile && setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
               ${isActive
                 ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30'
                 : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
               }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'} />
                {label}
                {isActive && <ChevronRight size={14} className="ml-auto text-brand-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                     text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-all duration-150 w-full"
        >
          <LogOut size={17} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-950 border-r border-slate-800 flex-shrink-0 flex-col">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 bg-slate-950 border-r border-slate-800 flex flex-col z-10">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-slate-950 border-b border-slate-800 px-4 lg:px-6 py-3 flex items-center gap-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <Menu size={22} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-500">Sistema activo</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
