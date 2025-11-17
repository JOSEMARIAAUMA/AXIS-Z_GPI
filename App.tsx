



import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/views/DashboardView';
import ProjectTableView from './components/views/ProjectTableView';
import ReservationsView from './components/views/ReservationsView';
import ClientsView from './components/views/ClientsView';
import GeneralDataView from './components/views/GeneralDataView';
import GaragesView from './components/views/GaragesView';
import StoragesView from './components/views/StoragesView';
import ProjectHeader from './components/ProjectHeader';
import { SAMPLE_CLIENTS } from './constants';
import type { Project, Client, FiltersState, AugmentedClient, Unit } from './types';
import { Status } from './types';
import { calculateAge, getAgeRange } from './utils';

const initialFilters: FiltersState = {
  building: '',
  floor: '',
  bedrooms: '',
  status: '',
  type: '',
  position: '',
  orientation: '',
  priceRange: '',
};

export default function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState('general');
  
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const savedProjects = window.localStorage.getItem('architech-projects');
      return savedProjects ? JSON.parse(savedProjects) : [];
    } catch (error) {
      console.error("Failed to load projects from localStorage", error);
      return [];
    }
  });
  const [clients, setClients] = useState<Client[]>(() => {
     try {
      const savedClients = window.localStorage.getItem('architech-clients');
      return savedClients ? JSON.parse(savedClients) : SAMPLE_CLIENTS;
    } catch (error) {
      console.error("Failed to load clients from localStorage", error);
      return SAMPLE_CLIENTS;
    }
  });
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
    const savedProjects = window.localStorage.getItem('architech-projects');
    const initialProjects = savedProjects ? JSON.parse(savedProjects) : [];
    if(initialProjects.length > 0) {
      const savedSelectedId = window.localStorage.getItem('architech-selected-project-id');
      return savedSelectedId || initialProjects[0].id;
    }
    return null;
  });

  // Separate filter states for each view
  const [dashboardFilters, setDashboardFilters] = useState<FiltersState>(initialFilters);
  const [tableViewFilters, setTableViewFilters] = useState<FiltersState>(initialFilters);
  const [reservationsFilters, setReservationsFilters] = useState<FiltersState>(initialFilters);
  const [garagesFilters, setGaragesFilters] = useState({ status: '', type: '' });
  const [storagesFilters, setStoragesFilters] = useState({ status: '' });

  useEffect(() => {
    try {
      window.localStorage.setItem('architech-projects', JSON.stringify(projects));
    } catch (error) {
      console.error("Failed to save projects to localStorage", error);
    }
  }, [projects]);

  useEffect(() => {
    try {
      window.localStorage.setItem('architech-clients', JSON.stringify(clients));
    } catch (error) {
      console.error("Failed to save clients to localStorage", error);
    }
  }, [clients]);

  useEffect(() => {
    if (selectedProjectId) {
      window.localStorage.setItem('architech-selected-project-id', selectedProjectId);
    } else {
      window.localStorage.removeItem('architech-selected-project-id');
    }
  }, [selectedProjectId]);

  // [NUEVO] Lógica para crear un escenario de ventas personalizado para el proyecto "DUNAS"
  // Se ejecuta una sola vez y guarda los cambios permanentemente.
  useEffect(() => {
    const DUNAS_SEED_KEY = 'dunas_scenario_seeded_v1';
    const isSeeded = window.localStorage.getItem(DUNAS_SEED_KEY);

    // Solo se ejecuta si no se ha hecho antes, hay clientes y el proyecto DUNAS existe
    const dunasProject = projects.find(p => p.name.toUpperCase().includes('DUNAS'));
    if (isSeeded || !dunasProject || clients.length < 5) {
      return;
    }

    console.log("Seeding DUNAS project scenario...");

    // Crear una copia profunda para modificarla de forma segura
    let updatedProjects = JSON.parse(JSON.stringify(projects));
    const projectToUpdate = updatedProjects.find((p: Project) => p.id === dunasProject.id);

    if (!projectToUpdate) return;
    
    const findClient = (name: string) => clients.find(c => c.name === name);
    const findUnit = (id: string) => projectToUpdate.units.find((u: Unit) => u.id === id);

    const assignments = [
      { unitId: 'DUNAS-B1-P1-A', clientName: 'John Doe', status: Status.Sold, garage: true, storage: true },
      { unitId: 'DUNAS-B1-P2-B', clientName: 'Jane Smith', status: Status.Reserved },
      { unitId: 'DUNAS-B1-PB-C', clientName: 'Laura García', status: Status.Sold },
      { unitId: 'DUNAS-B2-P1-D', clientName: 'Carlos Rodriguez', status: Status.Reserved },
    ];

    assignments.forEach(assignment => {
      const unit = findUnit(assignment.unitId);
      const client = findClient(assignment.clientName);

      if (unit && client) {
        unit.buyerId = client.id;
        unit.status = assignment.status;

        const reservationDate = new Date();
        reservationDate.setDate(reservationDate.getDate() - Math.floor(Math.random() * 200 + 30)); // Entre 1 y 7 meses atrás
        unit.reservationDate = reservationDate.toISOString();

        if (assignment.status === Status.Sold) {
          const saleDate = new Date(reservationDate);
          saleDate.setDate(saleDate.getDate() + Math.floor(Math.random() * 60 + 15)); // Entre 15 y 75 días después de la reserva
          unit.saleDate = saleDate.toISOString();
        }

        if (assignment.garage) {
          const availableGarage = projectToUpdate.garages.find((g: any) => !projectToUpdate.units.some((u: Unit) => u.garageId === g.id && u.id !== unit.id));
          if (availableGarage) unit.garageId = availableGarage.id;
        }

        if (assignment.storage) {
          const availableStorage = projectToUpdate.storages.find((s: any) => !projectToUpdate.units.some((u: Unit) => u.storageId === s.id && u.id !== unit.id));
          if (availableStorage) unit.storageId = availableStorage.id;
        }
      }
    });

    setProjects(updatedProjects);
    window.localStorage.setItem(DUNAS_SEED_KEY, 'true');
    
  }, [projects, clients]);


  const selectedProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);
  
  const augmentedClients = useMemo((): AugmentedClient[] => {
    const allUnits = projects.flatMap(p => p.units.map(u => ({ ...u, promocionId: p.id, promocionNombre: p.name })));

    return clients.map(client => {
      const linkedUnit = allUnits.find(u => u.buyerId === client.id);
      
      const age = client.birthDate ? calculateAge(client.birthDate) : undefined;
      const ageRange = age ? getAgeRange(age) : undefined;
      const registrationYear = client.registrationDate ? new Date(client.registrationDate).getFullYear() : undefined;

      return {
        ...client,
        idC: client.id,
        promocionId: linkedUnit?.promocionId,
        promocionNombre: linkedUnit?.promocionNombre,
        viviendaId: linkedUnit?.id,
        garajeId: linkedUnit?.garageId,
        trasteroId: linkedUnit?.storageId,
        edad: age,
        rangoEdad: ageRange,
        añoRegistro: registrationYear,
      };
    });
  }, [clients, projects]);

  const handleSetProjects = (newProjectsOrUpdater: Project[] | ((prevProjects: Project[]) => Project[])) => {
    setProjects(prevProjects => {
      const newProjects = typeof newProjectsOrUpdater === 'function' 
        ? newProjectsOrUpdater(prevProjects) 
        : newProjectsOrUpdater;

      if (newProjects.length > 0 && !newProjects.some(p => p.id === selectedProjectId)) {
        setSelectedProjectId(newProjects[0].id);
      } else if (newProjects.length === 0) {
        setSelectedProjectId(null);
      }
      return newProjects;
    });
  };

  const renderView = () => {
    if (!selectedProject && currentView !== 'clients') {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-8 bg-brand-bg-light rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold mb-4">Ningún Proyecto Seleccionado</h2>
            <p className="text-brand-text-secondary">Por favor, importa un proyecto para comenzar.</p>
          </div>
        </div>
      );
    }
    switch (currentView) {
      case 'general':
        return <GeneralDataView project={selectedProject!} />;
      case 'dashboard':
        return <DashboardView 
                  project={selectedProject!} 
                  filters={dashboardFilters}
                  setFilters={setDashboardFilters}
                />;
      case 'table':
        return <ProjectTableView 
                  project={selectedProject!} 
                  clients={clients} 
                  setProjects={handleSetProjects}
                  filters={tableViewFilters}
                  setFilters={setTableViewFilters}
                />;
      case 'reservations':
        return <ReservationsView 
                  project={selectedProject!}
                  clients={clients}
                  setProjects={handleSetProjects}
                  filters={reservationsFilters}
                  setFilters={setReservationsFilters} 
                />;
      case 'clients':
        return <ClientsView 
                  clients={augmentedClients} 
                  allProjects={projects}
                  setClients={setClients} 
                />;
      case 'garages':
        return <GaragesView 
                  project={selectedProject!}
                  filters={garagesFilters}
                  setFilters={setGaragesFilters}
                />;
      case 'storages':
        return <StoragesView 
                  project={selectedProject!}
                  filters={storagesFilters}
                  setFilters={setStoragesFilters}
                />;
      default:
        return <GeneralDataView project={selectedProject!} />;
    }
  };

  return (
    <div className="flex h-screen bg-brand-bg-dark font-sans">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />
      <main className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <ProjectHeader 
            projects={projects}
            setProjects={handleSetProjects}
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
        />
        <div className="flex-1 pt-2 pr-4 pb-4 sm:pr-6 sm:pb-6 lg:pr-8 lg:pb-8 bg-brand-bg-dark overflow-hidden">
          {renderView()}
        </div>
      </main>
    </div>
  );
}