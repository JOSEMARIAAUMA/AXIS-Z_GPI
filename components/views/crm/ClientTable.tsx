import React, { useCallback } from 'react';
import type { AugmentedClient } from '../../../types';
import { CheckIcon } from '../../icons/Icons';

const columns = [
  { key: 'status', label: 'Estado', width: 120 },
  { key: 'clientType', label: 'Tipo Cliente', width: 120 },
  { key: 'promocionNombre', label: 'Promoción', width: 150 },
  { key: 'viviendaId', label: 'Vivienda', width: 100 },
  { key: 'garajeId', label: 'Garaje', width: 100 },
  { key: 'trasteroId', label: 'Trastero', width: 100 },
  { key: 'idC', label: 'ID Cliente', width: 120 },
  { key: 'group', label: 'Grupo', width: 80 },
  { key: 'name', label: 'Nombre', width: 120 },
  { key: 'lastName', label: 'Apellidos', width: 150 },
  { key: 'dni', label: 'DNI', width: 100 },
  { key: 'phone', label: 'Teléfono 1', width: 120 },
  { key: 'phone2', label: 'Teléfono 2', width: 120 },
  { key: 'email', label: 'Email', width: 200 },
  { key: 'address', label: 'Dirección', width: 200 },
  { key: 'postalCode', label: 'CP', width: 80 },
  { key: 'city', label: 'Localidad', width: 120 },
  { key: 'province', label: 'Provincia', width: 120 },
  { key: 'country', label: 'País', width: 100 },
  { key: 'registrationDate', label: 'Fecha Registro', width: 120 },
  { key: 'birthDate', label: 'Fecha Nacimiento', width: 120 },
  { key: 'edad', label: 'Edad', width: 80 },
  { key: 'rangoEdad', label: 'Rango Edad', width: 100 },
  { key: 'civilStatus', label: 'Estado Civil', width: 100 },
  { key: 'notes', label: 'Notas', width: 250 },
];

const formatValue = (value: any, key: string) => {
    if (value === undefined || value === null) return '-';
    if (key.includes('Date')) {
        try {
            if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
                 const date = new Date(value);
                 if (isNaN(date.getTime())) return value;
                 return date.toLocaleDateString('es-ES', { timeZone: 'UTC' });
            }
            return value;
        } catch {
            return value;
        }
    }
    if (key === 'status') {
        const isActive = value === 'ACTIVO';
        const color = isActive ? 'bg-status-active' : 'bg-brand-surface';
        const textColor = isActive ? 'text-white' : 'text-brand-text';
        return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color} ${textColor}`}>{value}</span>
    }
    return String(value);
};

const ClientTable: React.FC<{
  clients: AugmentedClient[];
  selectedRows: Set<string>;
  setSelectedRows: React.Dispatch<React.SetStateAction<Set<string>>>;
  lastSelectedRowId: string | null;
  setLastSelectedRowId: React.Dispatch<React.SetStateAction<string | null>>;
  onEditClient: (client: AugmentedClient) => void;
}> = ({ clients, selectedRows, setSelectedRows, lastSelectedRowId, setLastSelectedRowId, onEditClient }) => {
    
    const handleRowClick = useCallback((client: AugmentedClient, index: number, event: React.MouseEvent) => {
        const newSelectedRows = new Set(selectedRows);
        if (event.shiftKey && lastSelectedRowId) {
            const lastIndex = clients.findIndex(c => c.id === lastSelectedRowId);
            if (lastIndex !== -1) {
                const [start, end] = [lastIndex, index].sort((a, b) => a - b);
                for (let i = start; i <= end; i++) {
                    newSelectedRows.add(clients[i].id);
                }
            }
        } else if (event.ctrlKey || event.metaKey) {
            if (newSelectedRows.has(client.id)) {
                newSelectedRows.delete(client.id);
            } else {
                newSelectedRows.add(client.id);
            }
        } else {
            if (selectedRows.has(client.id) && selectedRows.size === 1) {
                newSelectedRows.clear();
            } else {
                newSelectedRows.clear();
                newSelectedRows.add(client.id);
            }
        }
        setSelectedRows(newSelectedRows);
        setLastSelectedRowId(client.id);
    }, [clients, selectedRows, lastSelectedRowId, setSelectedRows, setLastSelectedRowId]);


    return (
        <div className="w-full h-full overflow-auto">
            <table className="min-w-full text-sm border-separate border-spacing-0">
                <thead className="sticky top-0 z-10">
                    <tr className="text-xs font-bold text-brand-text uppercase bg-brand-surface">
                        <th style={{ width: 40 }} className="p-2 border-b border-brand-bg-dark"></th>
                        {columns.map(col => (
                            <th key={col.key} style={{ width: col.width }} className="p-2 text-left border-b border-brand-bg-dark">
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {clients.map((client, index) => {
                        const isSelected = selectedRows.has(client.id);
                        return (
                            <tr
                                key={client.id}
                                onClick={(e) => handleRowClick(client, index, e)}
                                className={`select-none cursor-pointer ${isSelected ? 'bg-brand-primary/20' : 'hover:bg-brand-surface/50'}`}
                            >
                                <td 
                                    className="p-2 border-b border-brand-surface flex items-center justify-center h-12"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEditClient(client);
                                    }}
                                >
                                    <div className={`h-5 w-5 rounded border-2 ${isSelected ? 'bg-brand-primary border-brand-primary' : 'border-brand-text-secondary'} flex items-center justify-center`}>
                                        {isSelected && <CheckIcon className="h-4 w-4 text-white" />}
                                    </div>
                                </td>
                                {columns.map(col => (
                                    <td key={col.key} className="truncate p-2 border-b border-brand-surface text-brand-text-secondary">
                                        {formatValue((client as any)[col.key], col.key)}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default ClientTable;