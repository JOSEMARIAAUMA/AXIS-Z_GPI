
import React from 'react';
import { ChartBarIcon, TableCellsIcon, BuildingStorefrontIcon, UsersIcon, ChevronLeftIcon, ChevronRightIcon, BuildingOfficeIcon, InformationCircleIcon, CarIcon, ArchiveBoxIcon } from './icons/Icons';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  currentView: string;
  setCurrentView: (view: string) => void;
}

interface NavItemProps {
  icon: React.ReactNode;
  text: string;
  active: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, text, active, isCollapsed, onClick }) => (
  <li
    onClick={onClick}
    className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors duration-200 ${
      active ? 'text-brand-primary' : 'text-brand-text-secondary hover:text-brand-primary'
    }`}
  >
    {icon}
    <span className={`ml-4 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>{text}</span>
  </li>
);

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed, currentView, setCurrentView }) => {
  const navItems = [
    { id: 'general', text: 'Datos Generales', icon: <InformationCircleIcon /> },
    { id: 'dashboard', text: 'Gráficos', icon: <ChartBarIcon /> },
    { id: 'table', text: 'Datos de Proyecto', icon: <TableCellsIcon /> },
    { id: 'reservations', text: 'Reservas', icon: <BuildingStorefrontIcon /> },
    { id: 'garages', text: 'Garajes', icon: <CarIcon /> },
    { id: 'storages', text: 'Trasteros', icon: <ArchiveBoxIcon /> },
    { id: 'clients', text: 'Clientes', icon: <UsersIcon /> },
  ];

  return (
    <aside className={`fixed top-0 left-0 h-full bg-brand-bg-dark text-white flex flex-col transition-all duration-300 z-30 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex items-center justify-between p-4 border-b border-brand-surface h-16">
        {!isCollapsed && <BuildingOfficeIcon className="h-8 w-8 text-brand-primary" />}
        <span className={`text-xl font-bold transition-opacity duration-300 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>AXIS-Z GPI</span>
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 rounded-full hover:bg-brand-surface">
          {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
      </div>
      <nav className="flex-1 p-3">
        <ul>
          {navItems.map(item => (
            <NavItem
              key={item.id}
              icon={item.icon}
              text={item.text}
              isCollapsed={isCollapsed}
              active={currentView === item.id}
              onClick={() => setCurrentView(item.id)}
            />
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-brand-surface">
        {/* User profile section could go here */}
      </div>
    </aside>
  );
};

export default Sidebar;