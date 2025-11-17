import React, { useMemo, useState, useEffect } from 'react';
import type { Project } from '../../types';
import { Status } from '../../types';
import { STATUS_COLORS } from '../../constants';
import { MapPinIcon, WrenchScrewdriverIcon, BanknotesIcon, DocumentChartBarIcon, Cog6ToothIcon } from '../icons/Icons';

interface GaragesViewProps {
    project: Project;
    filters: { status: string; type: string; };
    setFilters: React.Dispatch<React.SetStateAction<{ status: string; type: string; }>>;
}

const STATUS_TRANSLATIONS: Record<Status, string> = {
  [Status.Available]: 'Disponible',
  [Status.Reserved]: 'Reservado',
  [Status.Sold]: 'Vendido',
};

// Mapeo de iconos para grupos dinámicos
const groupIcons: Record<string, React.ReactNode> = {
    'SELECCIONAR': <DocumentChartBarIcon className="h-5 w-5" />,
    'UBICACIÓN': <MapPinIcon className="h-7 w-7" />,
    'ESPECIFICACIONES': <WrenchScrewdriverIcon className="h-7 w-7" />,
    'GESTIÓN': <BanknotesIcon className="h-7 w-7" />,
};
const defaultIcon = <Cog6ToothIcon className="h-7 w-7" />;

// Mapeo de colores para grupos dinámicos
const groupColors: Record<string, string> = {
    'SELECCIONAR': 'general',
    'UBICACIÓN': 'location',
    'ESPECIFICACIONES': 'specs',
    'GESTIÓN': 'management',
};
const defaultColor = 'general';

const GaragesView: React.FC<GaragesViewProps> = ({ project, filters, setFilters }) => {

    const garagesWithStatus = useMemo(() => {
        return project.garages.map(garage => {
            const linkedUnit = project.units.find(u => u.garageId === garage.id);
            return {
                ...garage,
                linkedUnitId: linkedUnit?.id,
                status: linkedUnit?.status || Status.Available,
            };
        });
    }, [project.garages, project.units]);

    const filteredGarages = useMemo(() => {
        return garagesWithStatus.filter(g => {
            const statusFilter = filters.status === '' || 
                                 (filters.status === 'Available' && g.status === Status.Available) ||
                                 (filters.status === 'Linked' && g.status !== Status.Available);
            
            // Usar el valor dinámico del tipo desde la fila
            const typeKey = Object.keys(g).find(k => k.toUpperCase().startsWith('TIPO')) || 'type';
            const typeValue = g[typeKey];
            const typeFilter = filters.type === '' || typeValue === filters.type;

            return statusFilter && typeFilter;
        });
    }, [garagesWithStatus, filters]);
    
    // Genera la estructura de grupos de columnas dinámicamente desde el proyecto
    const columnGroups = useMemo(() => {
        if (!project.garageColumnHeaders || !project.garageColumnGroups) return {};

        const headers = [...project.garageColumnHeaders];
        const groups = [...project.garageColumnGroups];

        const statusColumnName = 'ESTADO';
        if (!headers.includes(statusColumnName)) {
            headers.splice(1, 0, statusColumnName);
            groups.splice(1, 0, groups[0] || 'GESTIÓN'); // Fallback to a group
        }

        const dynamicGroups: Record<string, { cols: string[], color: string, icon: React.ReactNode }> = {};
        
        groups.forEach((groupName, index) => {
            const colName = headers[index];
            if (!dynamicGroups[groupName]) {
                dynamicGroups[groupName] = {
                    cols: [],
                    color: groupColors[groupName] || defaultColor,
                    icon: groupIcons[groupName] || defaultIcon,
                };
            }
            dynamicGroups[groupName].cols.push(colName);
        });
        return dynamicGroups;
    }, [project.garageColumnHeaders, project.garageColumnGroups]);

    const [visibleGroups, setVisibleGroups] = useState<Record<string, boolean>>({});

    // Inicializa los grupos visibles
    useEffect(() => {
        const initialVisibility: Record<string, boolean> = {};
        Object.keys(columnGroups).forEach(groupName => {
            initialVisibility[groupName] = true; // Mostrar todos por defecto
        });
        setVisibleGroups(initialVisibility);
    }, [columnGroups]);
    
    const toggleGroup = (groupName: string) => {
        setVisibleGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
    };

    const garageTypes = useMemo(() => {
        const typeKey = project.garageColumnHeaders?.find(h => h.toUpperCase().startsWith('TIPO'));
        if (!typeKey) return [];
        return [...new Set(project.garages.map(g => g[typeKey]).filter(Boolean).sort())]
    }, [project.garages, project.garageColumnHeaders]);
    

    const formatValue = (value: any, key: string) => {
       if (value === undefined || value === null || value === '') return '-';

       if (key.toUpperCase().includes('ESTADO')) {
            const translatedStatus = STATUS_TRANSLATIONS[value as Status] || value;
            return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[value as Status]}`}>{translatedStatus}</span>
       }

       if (typeof value === 'number') {
           if (key.toLowerCase().includes('precio')) {
                return value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
           }
            return value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
       }
       return String(value);
    }
    
    const allVisibleCols = Object.entries(columnGroups).flatMap(([groupName, groupData]) => 
        visibleGroups[groupName] ? groupData.cols : []
    );

    const borderColorClasses: Record<string, string> = {
        location: 'border-[#587B7F]',
        specs: 'border-[#800020]',
        management: 'border-brand-primary',
        general: 'border-brand-surface',
    };
    
    const firstColumnKey = project.garageColumnHeaders?.find(c => c.trim() !== "") || 'id';

    return (
        <div className="flex flex-col h-full overflow-hidden space-y-4">
            <div className="shrink-0 space-y-4">
                <div className="bg-brand-bg-light p-4 rounded-lg shadow-lg flex items-center justify-between">
                     <div className="flex items-center space-x-4">
                        <div className="w-48">
                            <label className="text-xs font-medium text-brand-text-secondary">Estado</label>
                            <select value={filters.status} onChange={(e) => setFilters(f => ({...f, status: e.target.value}))} className="mt-1 block w-full bg-brand-surface text-brand-text rounded-md p-2 text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none">
                                <option value="">Todos</option>
                                <option value="Available">Disponibles</option>
                                <option value="Linked">Vinculados</option>
                            </select>
                        </div>
                        <div className="w-48">
                            <label className="text-xs font-medium text-brand-text-secondary">Tipo</label>
                            <select value={filters.type} onChange={(e) => setFilters(f => ({...f, type: e.target.value}))} className="mt-1 block w-full bg-brand-surface text-brand-text rounded-md p-2 text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none">
                                <option value="">Todos</option>
                                {garageTypes.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        {Object.entries(columnGroups)
                        .filter(([groupName]) => groupName !== 'SELECCIONAR' && groupName.trim() !== '')
                        .map(([groupName, groupData]) => (
                        <button
                            key={groupName}
                            onClick={() => toggleGroup(groupName)}
                            title={groupName}
                            className={`py-1 px-2 border-b-4 transition-all duration-200 ${borderColorClasses[groupData.color] || 'border-brand-surface'} ${!visibleGroups[groupName] ? 'border-opacity-40' : 'border-opacity-100'}`}
                        >
                            <div className={`transition-opacity duration-200 text-brand-text ${
                                visibleGroups[groupName]
                                    ? 'opacity-90'
                                    : 'opacity-40 hover:opacity-75'
                            }`}>
                                {groupData.icon}
                            </div>
                        </button>
                    ))}
                    </div>
                </div>
            </div>
            
            <div className="flex-1 overflow-auto bg-brand-bg-light rounded-lg shadow-lg">
                <table className="w-full text-sm text-left text-brand-text-secondary border-separate border-spacing-0">
                    <thead className="text-xs text-brand-text uppercase bg-brand-surface sticky top-0 z-10">
                       <tr>
                            {Object.entries(columnGroups).map(([groupName, groupData]) =>
                                visibleGroups[groupName] ? (
                                    <th
                                        key={groupName}
                                        colSpan={groupData.cols.length}
                                        className={`p-2 text-center border-b-2 border-brand-bg-dark bg-header-${groupData.color}-main whitespace-nowrap ${groupName === 'SELECCIONAR' || groupName.trim() === '' ? 'sticky left-0 z-20' : ''}`}
                                    >
                                        {groupName}
                                    </th>
                                ) : null
                            )}
                        </tr>
                        <tr>
                            {allVisibleCols.map((colKey, index) => {
                                  const groupName = Object.keys(columnGroups).find(gn => columnGroups[gn].cols.includes(colKey))!;
                                  const groupData = columnGroups[groupName];
                                  const isFirstCol = colKey === firstColumnKey;
                                  return (
                                      <th
                                          key={`${colKey}-${index}`}
                                          scope="col"
                                          className={`p-2 whitespace-nowrap border-b-2 border-brand-bg-dark text-center font-semibold bg-header-${groupData?.color || defaultColor}-sub ${
                                              isFirstCol ? 'sticky left-0 z-10' : ''
                                          }`}
                                      >
                                          {colKey}
                                      </th>
                                  );
                              })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-surface">
                        {filteredGarages.map(garage => (
                            <tr key={garage.id} className="bg-brand-bg-light hover:bg-brand-surface/50">
                                {allVisibleCols.map((colKey, index) => {
                                    const isFirstCol = colKey === firstColumnKey;
                                    const value = colKey.toUpperCase() === 'ESTADO' ? garage.status : (colKey === 'linkedUnitId' ? garage.linkedUnitId : garage[colKey]);

                                    return (
                                        <td
                                            key={`${colKey}-${index}`}
                                            className={`px-4 py-2 whitespace-nowrap text-center ${
                                                isFirstCol ? 'sticky left-0 z-1 bg-brand-bg-light font-semibold border-r border-brand-surface' : ''
                                            }`}
                                        >
                                           {formatValue(value, colKey)}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GaragesView;