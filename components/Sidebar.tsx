import React from 'react';
import { LogoIcon, DashboardIcon, ImportIcon, SettingsIcon, AdjustmentsIcon } from './Icons';
import { Page } from '../App';

interface SidebarProps {
  currentPage: Page;
  setPage: (page: Page) => void;
  avatarUrl: string;
}

const Avatar: React.FC<{ src: string }> = ({ src }) => (
    <img className="h-10 w-10 rounded-full object-cover" src={src} alt="User avatar" />
);

const NavLink: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
  return (
    <a
      href="#"
      onClick={(e) => { e.preventDefault(); onClick(); }}
      className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${
        isActive
          ? 'bg-white/10 text-white'
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span className="mr-3">{icon}</span>
      {label}
    </a>
  );
};

const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Painel de Controle', icon: <DashboardIcon className="w-5 h-5" /> },
    { id: 'import', label: 'Importações', icon: <ImportIcon className="w-5 h-5" /> },
    { id: 'settings', label: 'Configurações', icon: <SettingsIcon className="w-5 h-5" /> },
    { id: 'adjustments', label: 'Ajustes', icon: <AdjustmentsIcon className="w-5 h-5" /> },
];

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setPage, avatarUrl }) => {
  return (
    <aside className="flex flex-col w-64 bg-slate-900 text-white h-full shadow-2xl flex-shrink-0">
      <div className="flex items-center justify-center h-20 border-b border-slate-700/50">
        <LogoIcon className="w-8 h-8 text-teal-400" />
        <h1 className="text-xl font-bold ml-2 text-slate-100">ConciliaFácil</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Menu</p>
        {navItems.map(item => (
            <NavLink
                key={item.id}
                icon={item.icon}
                label={item.label}
                isActive={currentPage === item.id}
                onClick={() => setPage(item.id)}
            />
        ))}
      </nav>
      <div className="p-4 border-t border-slate-700/50">
        <div className="flex items-center">
            <Avatar src={avatarUrl} />
            <div className="ml-3">
                <p className="text-sm font-semibold text-slate-200">Usuário</p>
                <p className="text-xs text-slate-400">Plano Padrão</p>
            </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;