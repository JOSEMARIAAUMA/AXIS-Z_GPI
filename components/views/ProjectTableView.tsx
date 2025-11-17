



import React, { useState, useMemo, useEffect } from 'react';
import type { Project, Unit, Client, FiltersState } from '../../types';
import { Status } from '../../types';
import { STATUS_COLORS } from '../../constants';
import Modal from '../ui/Modal';
import UnitDetailModal from '../modals/UnitDetailModal';
import {
    MapPinIcon,
    WrenchScrewdriverIcon,
    BanknotesIcon,
    DocumentChartBarIcon,
    ArrowsPointingOutIcon,
    BuildingLibraryIcon,
    CheckIcon,
    Cog6ToothIcon,
    XCircleIcon,
    QueueListIcon,
    InformationCircleIcon,
    CurrencyEuroIcon
} from '../icons/Icons';
import Filters from '../Filters';

interface ProjectTableViewProps {
    project: Project;
    clients: Client[];
    setProjects: (updater: (prevProjects: Project[]) => Project[]) => void;
    filters: FiltersState;
    setFilters: React.Dispatch<React.SetStateAction<FiltersState>>;
}

const BulkActionsModal: React.FC<{
    selectedUnitIds: Set<string>;
    onClose: () => void;
    onSave: (updates: Partial<Unit>, noteOption: 'append' | 'overwrite', notes: string) => void;
}> = ({ selectedUnitIds, onClose, onSave }) => {
    const [status, setStatus] = useState('');
    const [reservationDate, setReservationDate] = useState('');
    const [saleDate, setSaleDate] = useState('');
    const [notes, setNotes] = useState('');
    const [noteDate, setNoteDate] = useState(new Date().toISOString().split('T')[0]);
    const [noteOption, setNoteOption] = useState<'append' | 'overwrite'>('append');
    
    const fromInputDate = (dateString: string) =>
        dateString ? new Date(dateString).toISOString() : undefined;

    const handleSave = () => {
        const updates: Partial<Unit> = {};
        if (status) updates.status = status as Status;
        
        if (status === Status.Reserved || status === Status.Sold) {
             if (reservationDate) updates.reservationDate = fromInputDate(reservationDate);
        }
        if (status === Status.Sold) {
            if (saleDate) updates.saleDate = fromInputDate(saleDate);
        }
        
        const noteWithDate = notes.trim() ? `[${noteDate}]: ${notes.trim()}` : '';

        onSave(updates, noteOption, noteWithDate);
        onClose();
    };

    return (
        <Modal title={`Acciones para ${selectedUnitIds.size} viviendas`} onClose={onClose}>
            <div className="space-y-4 p-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Cambiar Estado</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="mt-1 block w-full bg-brand-surface text-brand-text rounded-md p-2"
                        >
                            <option value="">-- No cambiar --</option>
                            {Object.values(Status).map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Fecha de la Nota</label>
                        <input
                            type="date"
                            value={noteDate}
                            onChange={(e) => setNoteDate(e.target.value)}
                            className="mt-1 block w-full bg-brand-surface text-brand-text rounded-md p-2"
                        />
                    </div>
                </div>

                {(status === Status.Reserved || status === Status.Sold) && (
                    <div>
                        <label className="block text-sm font-medium">Asignar Fecha de Reserva</label>
                        <input
                            type="date"
                            value={reservationDate}
                            onChange={(e) => setReservationDate(e.target.value)}
                            className="mt-1 block w-full bg-brand-surface text-brand-text rounded-md p-2"
                        />
                    </div>
                )}
                {status === Status.Sold && (
                    <div>
                        <label className="block text-sm font-medium">Asignar Fecha de Venta</label>
                        <input
                            type="date"
                            value={saleDate}
                            onChange={(e) => setSaleDate(e.target.value)}
                            className="mt-1 block w-full bg-brand-surface text-brand-text rounded-md p-2"
                        />
                    </div>
                )}
                
                <div>
                    <label className="block text-sm font-medium">Notas Comunes</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        placeholder="Escribe aquí las notas que se aplicarán a todas las viviendas seleccionadas..."
                        className="mt-1 block w-full bg-brand-surface text-brand-text rounded-md p-2"
                    />
                    <div className="mt-2 flex items-center space-x-4">
                         <label className="flex items-center">
                            <input
                                type="radio"
                                name="noteOption"
                                value="append"
                                checked={noteOption === 'append'}
                                onChange={() => setNoteOption('append')}
                                className="h-4 w-4 text-brand-primary bg-brand-surface border-brand-surface focus:ring-brand-primary"
                            />
                            <span className="ml-2 text-sm">Añadir a notas existentes</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="noteOption"
                                value="overwrite"
                                checked={noteOption === 'overwrite'}
                                onChange={() => setNoteOption('overwrite')}
                                className="h-4 w-4 text-brand-primary bg-brand-surface border-brand-surface focus:ring-brand-primary"
                            />
                            <span className="ml-2 text-sm">Sobrescribir notas</span>
                        </label>
                    </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                    <button
                        onClick={onClose}
                        className="py-2 px-4 rounded-lg bg-brand-surface hover:bg-gray-600 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="py-2 px-4 rounded-lg bg-brand-primary text-white hover:bg-blue-400 transition-colors"
                    >
                        Aplicar Cambios
                    </button>
                </div>
            </div>
        </Modal>
    );
};

// [NUEVO] Mapeo de iconos para grupos dinámicos
const groupIcons: Record<string, React.ReactNode> = {
    'DATOS GENERALES': <InformationCircleIcon className="h-4 w-4" />,
    'UBICACIÓN': <MapPinIcon className="h-4 w-4" />,
    'ESPECIFICACIONES': <WrenchScrewdriverIcon className="h-4 w-4" />,
    'SUPERFICIES ÚTILES INTERIORES VIVIENDAS': <ArrowsPointingOutIcon className="h-4 w-4" />,
    'SUP. ÚTILES RESUMEN (M²)': <ArrowsPointingOutIcon className="h-4 w-4" />,
    'ÚTIL SERV.COM.': <ArrowsPointingOutIcon className="h-4 w-4" />,
    'TOTAL ÚTIL VIVIENDAS': <ArrowsPointingOutIcon className="h-4 w-4" />,
    'SUP. CONSTRUIDAS (M²)': <BuildingLibraryIcon className="h-4 w-4" />,
    'CONSTRUIDO INTERIOR. CRITERIO VPP': <BuildingLibraryIcon className="h-4 w-4" />,
    'CONSTRUIDO INTERIOR. CRITERIO LIBRE': <BuildingLibraryIcon className="h-4 w-4" />,
    'CONSTRUIDO REAL PRIVATIVO EXTERIOR(CRITERIO URBANÍSTICO)': <BuildingLibraryIcon className="h-4 w-4" />,
    'CONSTRUIDO TOTAL': <BuildingLibraryIcon className="h-4 w-4" />,
    'PRECIOS MÁX. VIV': <CurrencyEuroIcon className="h-4 w-4" />,
    'GESTIÓN': <BanknotesIcon className="h-4 w-4" />,
};

const defaultIcon = <Cog6ToothIcon className="h-4 w-4" />;

// [MODIFICADO] Mapeo de colores para grupos dinámicos, incluyendo los nuevos grupos
const groupColors: Record<string, string> = {
    'SELECCIONAR': 'general',
    'DATOS GENERALES': 'specs',
    'UBICACIÓN': 'location',
    'ESPECIFICACIONES': 'specs',
    'SUPERFICIES ÚTILES INTERIORES VIVIENDAS': 'useful2',
    'SUP. ÚTILES RESUMEN (M²)': 'useful',
    'ÚTIL SERV.COM.': 'useful2',
    'TOTAL ÚTIL VIVIENDAS': 'useful2',
    'SUP. CONSTRUIDAS (M²)': 'built',
    'CONSTRUIDO INTERIOR. CRITERIO VPP': 'built2',
    'CONSTRUIDO INTERIOR. CRITERIO LIBRE': 'built2',
    'CONSTRUIDO REAL PRIVATIVO EXTERIOR(CRITERIO URBANÍSTICO)': 'exterior',
    'CONSTRUIDO TOTAL': 'total',
    'PRECIOS MÁX. VIV': 'prices',
    'GESTIÓN': 'management',
};
const defaultColor = 'general';


const ProjectTableView: React.FC<ProjectTableViewProps> = ({
    project,
    clients,
    setProjects,
    filters,
    setFilters
}) => {
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [lastSelectedRowId, setLastSelectedRowId] = useState<string | null>(null);
    const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);

    // [MODIFICADO] Genera la estructura de grupos de columnas dinámicamente, inyectando la columna 'ESTADO'
    const columnGroups = useMemo(() => {
        if (!project.unitColumnHeaders || !project.unitColumnGroups) return {};

        // Copias para evitar mutar las props
        const headers = [...project.unitColumnHeaders];
        const groups = [...project.unitColumnGroups];
        
        const statusColumnName = 'ESTADO';

        // Eliminar si ya existe para evitar duplicados
        const existingStatusIndex = headers.findIndex(h => h.toUpperCase() === statusColumnName);
        if (existingStatusIndex > -1) {
            headers.splice(existingStatusIndex, 1);
            groups.splice(existingStatusIndex, 1);
        }
        
        // Inyectar la columna ESTADO en la segunda posición (índice 1)
        headers.splice(1, 0, statusColumnName);
        // Asignarla al mismo grupo que la primera columna
        if(groups.length > 0) {
           groups.splice(1, 0, groups[0]);
        } else {
           groups.splice(1, 0, 'SELECCIONAR'); // Fallback
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
    }, [project.unitColumnHeaders, project.unitColumnGroups]);

    const [visibleGroups, setVisibleGroups] = useState<Record<string, boolean>>({});

    // [MODIFICADO] Inicializa los grupos visibles cuando cambian los grupos de columnas
    useEffect(() => {
        const initialVisibility: Record<string, boolean> = {};
        Object.keys(columnGroups).forEach(groupName => {
             // Heurística para ocultar grupos por defecto
            const lowerGroupName = groupName.toLowerCase();
            const isAreaDetail = lowerGroupName.includes('útiles') && !lowerGroupName.includes('resumen') && !lowerGroupName.includes('interiores');
            const isBuilt = lowerGroupName.includes('construidas');

            initialVisibility[groupName] = !isAreaDetail && !isBuilt;
        });
         // Siempre mostrar el primer grupo (ID, Estado)
        const firstGroupName = Object.keys(columnGroups)[0];
        if(firstGroupName) initialVisibility[firstGroupName] = true;

        setVisibleGroups(initialVisibility);
    }, [columnGroups]);


    const toggleGroup = (groupName: string) => {
        setVisibleGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
    };

    const filteredUnits = useMemo(() => {
        return project.units.filter((unit) => {
            const otherFiltersPass =
                (filters.building === '' || String(unit.building) === filters.building) &&
                (filters.floor === '' || String(unit.floor) === filters.floor) &&
                (filters.bedrooms === '' || String(unit.bedrooms) === filters.bedrooms) &&
                (filters.status === '' || unit.status === filters.status) &&
                (filters.type === '' || String(unit.type) === filters.type) &&
                (filters.position === '' || String(unit.position) === filters.position) &&
                (filters.orientation === '' || String(unit.orientation) === filters.orientation);

            if (!otherFiltersPass) return false;
            
            if (filters.priceRange) {
                const price = unit.price;
                switch (filters.priceRange) {
                    case '<100': return price < 100000;
                    case '100-150': return price >= 100000 && price < 150000;
                    case '150-200': return price >= 150000 && price < 200000;
                    case '>200': return price >= 200000;
                    default: return true;
                }
            }
            
            return true;
        });
    }, [project.units, filters]);
    
    const handleDeselectAll = () => {
        setSelectedRows(new Set());
        setLastSelectedRowId(null);
    };

    const handleSelectVisible = () => {
        const visibleIds = new Set(filteredUnits.map(u => u.id));
        setSelectedRows(visibleIds);
    };

    const handleRowClick = (unit: Unit, event: React.MouseEvent) => {
        const clickedUnitId = unit.id;

        // Si se hace click en la celda de estado, siempre abrir modal y no afectar selección de fila
        const target = event.target as HTMLElement;
        if (target.closest('[data-column-type="status-cell"]')) {
             setSelectedUnit(unit);
             return;
        }

        const newSelectedRows = new Set(selectedRows);

        if (event.shiftKey && lastSelectedRowId) {
            const unitIds = filteredUnits.map(u => u.id);
            const lastIndex = unitIds.indexOf(lastSelectedRowId);
            const currentIndex = unitIds.indexOf(clickedUnitId);

            if (lastIndex !== -1 && currentIndex !== -1) {
                const [start, end] = [lastIndex, currentIndex].sort((a, b) => a - b);
                const rangeIds = unitIds.slice(start, end + 1);
                
                const selectionWithRange = new Set<string>();
                rangeIds.forEach(id => selectionWithRange.add(id));
                setSelectedRows(selectionWithRange);
            }
        } else if (event.ctrlKey) {
            if (newSelectedRows.has(clickedUnitId)) {
                newSelectedRows.delete(clickedUnitId);
            } else {
                newSelectedRows.add(clickedUnitId);
            }
            setSelectedRows(newSelectedRows);
            setLastSelectedRowId(clickedUnitId);
        } else {
            if (selectedRows.has(clickedUnitId) && selectedRows.size === 1) {
                setSelectedRows(new Set());
                setLastSelectedRowId(null);
            } else {
                setSelectedRows(new Set([clickedUnitId]));
                setLastSelectedRowId(clickedUnitId);
            }
        }
    };

    const handleSaveUnit = (updatedUnit: Unit) => {
        setProjects((prevProjects) =>
            prevProjects.map((p) => {
                if (p.id === project.id) {
                    return {
                        ...p,
                        units: p.units.map((u) => (u.id === updatedUnit.id ? updatedUnit : u))
                    };
                }
                return p;
            })
        );
    };

    const handleBulkUpdate = (updates: Partial<Unit>, noteOption: 'append' | 'overwrite', newNotes: string) => {
        setProjects(prevProjects =>
            prevProjects.map(p => {
                if (p.id === project.id) {
                    const newUnits = p.units.map(unit => {
                        if (selectedRows.has(unit.id)) {
                            let finalNotes = unit.notes || '';
                            if (newNotes.trim()) {
                                if (noteOption === 'append') {
                                    finalNotes = finalNotes ? `${finalNotes}\n${newNotes}` : newNotes;
                                } else { // overwrite
                                    finalNotes = newNotes;
                                }
                            }
                            
                            const unitSpecificUpdates = { ...updates };

                            if (unitSpecificUpdates.status === Status.Available) {
                                unitSpecificUpdates.buyerId = undefined;
                                unitSpecificUpdates.reservationDate = undefined;
                                unitSpecificUpdates.saleDate = undefined;
                            }
                            
                            return {
                                ...unit,
                                ...unitSpecificUpdates,
                                notes: finalNotes,
                            };
                        }
                        return unit;
                    });
                    return { ...p, units: newUnits };
                }
                return p;
            })
        );
        setIsActionsModalOpen(false);
    };

    const formatValue = (value: any, key: string) => {
        // Handle null/undefined/empty string first
        if (value === undefined || value === null || value === '') {
            return <span className="text-brand-text-secondary">-</span>;
        }

        const upperKey = key.toUpperCase();

        // Handle special non-numeric keys
        if (upperKey === 'ESTADO') {
            return (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[value as Status] || ''}`}>
                    {value}
                </span>
            );
        }
        
        if (key.toLowerCase() === 'comprador') {
            return clients.find((c) => c.id === value)?.name || '-';
        }

        // Handle numbers
        if (typeof value === 'number') {
            // Handle the zero case
            if (value === 0) {
                // Exception for NIVEL column
                if (upperKey === 'NIVEL') {
                    return '0';
                }
                return <span className="text-brand-text-secondary">-</span>;
            }

            // Handle non-zero numbers
            const integerColumns = ['Nº DORM', 'Nº BAÑOS', 'FASE', 'PORTAL', 'NIVEL'];
            if (integerColumns.includes(upperKey)) {
                return value.toLocaleString('es-ES', {
                    maximumFractionDigits: 0
                });
            }
            
            if (key.toLowerCase().includes('precio') || key.toLowerCase().includes('máximo')) {
                return value.toLocaleString('es-ES', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                });
            }
            
            // Default number format
            return value.toLocaleString('es-ES', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
        
        // Default fallback
        return String(value);
    };
    
    const allVisibleCols = Object.entries(columnGroups).flatMap(([groupName, groupData]) => 
        visibleGroups[groupName] ? groupData.cols : []
    );
        
    const firstColumnKey = project.unitColumnHeaders?.find(c => c.trim() !== "") || 'id';

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="shrink-0">
                <Filters project={project} filters={filters} setFilters={setFilters} showPriceRangeFilter />
                <div className="bg-brand-bg-dark p-2 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <span className="text-sm font-semibold text-brand-text w-28 text-center">
                            {selectedRows.size} seleccionada{selectedRows.size !== 1 ? 's' : ''}
                        </span>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handleSelectVisible}
                                title="Seleccionar Visibles"
                                className="p-2 text-brand-text-secondary hover:text-brand-primary rounded-full hover:bg-brand-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={filteredUnits.length === 0}
                            >
                                <QueueListIcon className="h-6 w-6" />
                            </button>
                            <button
                                onClick={handleDeselectAll}
                                title="Anular Selección"
                                className="p-2 text-brand-text-secondary hover:text-brand-primary rounded-full hover:bg-brand-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={selectedRows.size === 0}
                            >
                                <XCircleIcon className="h-6 w-6" />
                            </button>
                             <button
                                onClick={() => setIsActionsModalOpen(true)}
                                title="Acciones"
                                className="p-2 text-brand-text-secondary hover:text-brand-primary rounded-full hover:bg-brand-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={selectedRows.size === 0}
                            >
                                <Cog6ToothIcon className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    
                </div>
            </div>

            <div className="flex-1 min-h-0">
                <div className="h-full w-full overflow-auto rounded-lg shadow-lg bg-brand-bg-light">
                    <table className="min-w-full text-sm text-left text-brand-text-secondary border-separate border-spacing-0">
                        <thead className="text-xs text-white uppercase sticky top-0 z-20">
                            <tr>
                                {Object.entries(columnGroups).map(([groupName, groupData]) =>
                                    visibleGroups[groupName] ? (
                                        <th
                                            key={groupName}
                                            colSpan={groupData.cols.length}
                                            className={`py-1 px-2 text-center border-b-2 border-brand-bg-dark bg-header-${groupData.color}-main whitespace-nowrap ${groupName === 'SELECCIONAR' || groupName.trim() === '' ? 'sticky left-0 z-30' : ''}`}
                                        >
                                           <div className="flex items-center justify-center space-x-2">
                                                <span>{groupName}</span>
                                                {groupName !== 'SELECCIONAR' && groupName.trim() !== '' && (
                                                    <button
                                                        onClick={() => toggleGroup(groupName)}
                                                        title={`Mostrar/Ocultar ${groupName}`}
                                                        className={`p-0.5 rounded-full transition-colors duration-200 ${
                                                            visibleGroups[groupName]
                                                                ? 'text-white/80 hover:bg-white/20'
                                                                : 'text-white/40 hover:bg-white/20'
                                                        }`}
                                                    >
                                                        {groupData.icon}
                                                    </button>
                                                )}
                                            </div>
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
                                                  isFirstCol ? 'sticky left-0 z-20' : ''
                                              }`}
                                          >
                                              {colKey}
                                          </th>
                                      );
                                  })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-surface">
                            {filteredUnits.map((unit) => {
                                const isSelected = selectedRows.has(unit.id);
                                return (
                                <tr
                                    key={unit.id}
                                    onClick={(e) => handleRowClick(unit, e)}
                                    className={`${
                                        isSelected ? 'bg-brand-surface' : 'bg-brand-bg-light'
                                    } hover:bg-brand-surface/50 cursor-pointer select-none`}
                                >
                                {allVisibleCols.map((colKey, index) => {
                                    const isFirstCol = colKey === firstColumnKey;
                                    const isEstadoCol = colKey.toUpperCase() === 'ESTADO';
                                    const cellValue = isEstadoCol ? unit.status : unit[colKey];
                                    
                                    return (
                                        <td
                                            key={`${colKey}-${index}`}
                                            data-column-type={isEstadoCol ? 'status-cell' : undefined}
                                            className={`py-2 whitespace-nowrap text-center relative transition-colors
                                                ${ isFirstCol ? 'sticky left-0 z-10 border-r border-brand-surface font-semibold' : ''} 
                                                ${ isSelected ? 'bg-brand-surface' : 'bg-brand-bg-light' } 
                                                ${ isFirstCol ? 'pl-8 pr-2' : 'px-2' }
                                                ${ isEstadoCol ? 'hover:bg-brand-surface' : '' }
                                            `}
                                        >
                                            {isFirstCol && isSelected && <CheckIcon className="h-4 w-4 text-brand-primary absolute left-2 top-1/2 -translate-y-1/2" />}
                                            {formatValue(cellValue, colKey)}
                                        </td>
                                    );

                                })}
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedUnit && (
                <UnitDetailModal
                    unit={selectedUnit}
                    project={project}
                    clients={clients}
                    onClose={() => setSelectedUnit(null)}
                    onSave={handleSaveUnit}
                />
            )}
            
            {isActionsModalOpen && (
                <BulkActionsModal
                    selectedUnitIds={selectedRows}
                    onClose={() => setIsActionsModalOpen(false)}
                    onSave={handleBulkUpdate}
                />
            )}
        </div>
    );
};

export default ProjectTableView;