import React, { useMemo } from 'react';
import type { Project } from '../../types';
import { Status } from '../../types';
import { STATUS_COLORS } from '../../constants';

interface StoragesViewProps {
    project: Project;
    filters: { status: string; };
    setFilters: React.Dispatch<React.SetStateAction<{ status: string; }>>;
}

const STATUS_TRANSLATIONS: Record<Status, string> = {
  [Status.Available]: 'Disponible',
  [Status.Reserved]: 'Reservado',
  [Status.Sold]: 'Vendido',
};

const StoragesView: React.FC<StoragesViewProps> = ({ project, filters, setFilters }) => {

    const storagesWithStatus = useMemo(() => {
        return project.storages.map(storage => {
            const linkedUnit = project.units.find(u => u.storageId === storage.id);
            return {
                ...storage,
                linkedUnitId: linkedUnit?.id,
                status: linkedUnit?.status || Status.Available,
            };
        });
    }, [project.storages, project.units]);
    
    const filteredStorages = useMemo(() => {
        return storagesWithStatus.filter(s => {
            return filters.status === '' || 
                   (filters.status === 'Available' && s.status === Status.Available) ||
                   (filters.status === 'Linked' && s.status !== Status.Available);
        });
    }, [storagesWithStatus, filters]);

    const formatValue = (value: any, key: string) => {
       if (value === undefined || value === null || value === '') return '-';

       if (key.toLowerCase().includes('status')) {
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
    
    const displayHeaders = useMemo(() => {
        const baseHeaders = project.storageColumnHeaders || [];
        const headers = [...baseHeaders];
        headers.splice(1, 0, 'Estado');
        headers.push('Vivienda Vinculada');
        return headers;
    }, [project.storageColumnHeaders]);

    const firstColumnKey = project.storageColumnHeaders?.length > 0 ? project.storageColumnHeaders[0] : 'id';

    return (
        <div className="flex flex-col h-full overflow-hidden space-y-4">
            <div className="shrink-0 space-y-4">
                 <div className="bg-brand-bg-light p-4 rounded-lg shadow-lg flex items-center space-x-4">
                    <div className="w-48">
                        <label className="text-xs font-medium text-brand-text-secondary">Estado</label>
                        <select value={filters.status} onChange={(e) => setFilters({status: e.target.value})} className="mt-1 block w-full bg-brand-surface text-brand-text rounded-md p-2 text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none">
                            <option value="">Todos</option>
                            <option value="Available">Disponibles</option>
                            <option value="Linked">Vinculados</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-brand-bg-light rounded-lg shadow-lg">
                <table className="w-full text-sm text-left text-brand-text-secondary border-separate border-spacing-0">
                    <thead className="text-xs text-brand-text uppercase bg-brand-surface sticky top-0 z-10">
                        <tr>
                           {displayHeaders.map((header, index) => (
                             <th key={index} scope="col" className="px-6 py-3 whitespace-nowrap text-center">{header}</th>
                           ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-surface">
                        {filteredStorages.map(storage => (
                            <tr key={storage.id} className="bg-brand-bg-light hover:bg-brand-surface/50">
                                {displayHeaders.map((header, index) => {
                                    let cellValue;
                                    let cellKey = header;
                                    if (header === 'Estado') {
                                        cellValue = storage.status;
                                        cellKey = 'status';
                                    } else if (header === 'Vivienda Vinculada') {
                                        cellValue = storage.linkedUnitId;
                                    } else {
                                        cellValue = storage[header];
                                    }
                                    return (
                                        <td key={index} className={`px-6 py-4 whitespace-nowrap text-center ${header === firstColumnKey ? 'font-medium text-brand-text' : ''}`}>
                                           {formatValue(cellValue, cellKey)}
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

export default StoragesView;