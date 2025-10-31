import React from 'react';
import { LogoIcon, XIcon } from './Icons';
import { Page } from '../App';
import { UserProfile } from '../types';

interface SidebarProps {
  currentPage: Page;
  setPage: (page: Page) => void;
  avatarUrl: string;
  userProfile: UserProfile;
  navItems: { id: Page; label: string; icon: React.ReactNode }[];
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
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

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setPage, avatarUrl, userProfile, navItems, isSidebarOpen, setIsSidebarOpen }) => {
  
  const handleNavClick = (page: Page) => {
    setPage(page);
    setIsSidebarOpen(false); // Close sidebar on mobile after navigation
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-slate-900 text-white h-full shadow-2xl flex-shrink-0 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between h-20 border-b border-slate-700/50 px-4">
        <div className="flex items-center">
          <LogoIcon className="w-8 h-8 text-teal-400" />
          <h1 className="text-xl font-bold ml-2 text-slate-100">ConciliaFácil</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 text-slate-400 hover:text-white" aria-label="Fechar menu">
            <XIcon className="w-6 h-6" />
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Menu</p>
        {navItems.map(item => (
            <NavLink
                key={item.id}
                icon={item.icon}
                label={item.label}
                isActive={currentPage === item.id}
                onClick={() => handleNavClick(item.id)}
            />
        ))}
      </nav>
      <div className="p-4 border-t border-slate-700/50">
        <div className="flex items-center">
            <Avatar src={avatarUrl} />
            <div className="ml-3">
                <p className="text-sm font-semibold text-slate-200 truncate">{userProfile.name}</p>
                <p className="text-xs text-slate-400 truncate">{userProfile.role}</p>
            </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;