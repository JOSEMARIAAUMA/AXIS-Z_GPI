

import React, { useState, useMemo, useCallback } from 'react';
import type { Client, AugmentedClient, Project } from '../../types';
import { ClientStatus, ClientType } from '../../types';
import ClientTable from './crm/ClientTable';
import ClientImportModal from '../modals/ClientImportModal';
import { PlusIcon, ArrowDownOnSquareIcon, Cog6ToothIcon, XCircleIcon, QueueListIcon, FunnelSlashIcon } from '../icons/Icons';
import { normalizeString } from '../../utils';
import Modal from '../ui/Modal';
import HoverDropdown from '../ui/HoverDropdown';
import ClientDetailModal from '../modals/ClientDetailModal';

const BulkActionsModal: React.FC<{
    selectedClientIds: Set<string>;
    onClose: () => void;
    onSave: (updates: Partial<Client>) => void;
}> = ({ selectedClientIds, onClose, onSave }) => {
    const [status, setStatus] = useState('');
    const [clientType, setClientType] = useState('');
    const [group, setGroup] = useState('');

    const handleSave = () => {
        const updates: Partial<Client> = {};
        if (status) updates.status = status as ClientStatus;
        if (clientType) updates.clientType = clientType as ClientType;
        if (group) updates.group = group;
        onSave(updates);
        onClose();
    };

    return (
        <Modal title={`Acciones para ${selectedClientIds.size} clientes`} onClose={onClose}>
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
                            {Object.values(ClientStatus).map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Cambiar Tipo</label>
                        <select
                            value={clientType}
                            onChange={(e) => setClientType(e.target.value)}
                            className="mt-1 block w-full bg-brand-surface text-brand-text rounded-md p-2"
                        >
                            <option value="">-- No cambiar --</option>
                            {Object.values(ClientType).map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium">Asignar Grupo</label>
                    <input
                        type="text"
                        value={group}
                        onChange={(e) => setGroup(e.target.value.toUpperCase())}
                        placeholder="Ej: A, B, VIP..."
                        className="mt-1 block w-full bg-brand-surface text-brand-text rounded-md p-2"
                    />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                    <button onClick={onClose} className="py-2 px-4 rounded-lg bg-brand-surface hover:bg-gray-600">Cancelar</button>
                    <button onClick={handleSave} className="py-2 px-4 rounded-lg bg-brand-primary text-white hover:bg-blue-400">Aplicar</button>
                </div>
            </div>
        </Modal>
    );
};


const ClientsView: React.FC<{
    clients: AugmentedClient[];
    allProjects: Project[];
    setClients: React.Dispatch<React.SetStateAction<Client[]>>;
}> = ({ clients, allProjects, setClients }) => {
    
    const [filters, setFilters] = useState({
        status: '',
        clientType: '',
        promocionNombre: '',
        group: '',
        rangoEdad: '',
        añoRegistro: '',
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [lastSelectedRowId, setLastSelectedRowId] = useState<string | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isBulkActionsModalOpen, setIsBulkActionsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<AugmentedClient | null>(null);

    const filterOptions = useMemo(() => {
        const getUniqueSorted = (key: keyof AugmentedClient, numeric = false) => {
            const unique = [...new Set(clients.map(c => c[key]).filter(Boolean))];
             if (numeric) {
                return unique.sort((a, b) => Number(a) - Number(b));
            }
            return unique.sort((a,b) => String(a).localeCompare(String(b)));
        };
        return {
            status: Object.values(ClientStatus),
            clientType: Object.values(ClientType),
            promocionNombre: getUniqueSorted('promocionNombre') as string[],
            group: getUniqueSorted('group') as string[],
            rangoEdad: getUniqueSorted('rangoEdad') as string[],
            añoRegistro: getUniqueSorted('añoRegistro', true) as number[],
        };
    }, [clients]);

    const filteredClients = useMemo(() => {
        let filtered = [...clients];

        // Apply dropdown filters
        filtered = filtered.filter(client => {
            return (filters.status === '' || client.status === filters.status) &&
                   (filters.clientType === '' || client.clientType === filters.clientType) &&
                   (filters.promocionNombre === '' || client.promocionNombre === filters.promocionNombre) &&
                   (filters.group === '' || client.group === filters.group) &&
                   (filters.rangoEdad === '' || client.rangoEdad === filters.rangoEdad) &&
                   (filters.añoRegistro === '' || String(client.añoRegistro) === filters.añoRegistro);
        });

        // Apply universal search
        if (searchQuery.trim()) {
            const normalizedQuery = normalizeString(searchQuery.trim());
            const searchKeys: (keyof AugmentedClient)[] = [
                'name', 'lastName', 'dni', 'email', 'phone', 'phone2',
                'promocionNombre', 'viviendaId', 'garajeId', 'trasteroId',
                'city', 'province', 'country'
            ];

            filtered = filtered.filter(client => {
                return searchKeys.some(key => {
                    const value = client[key];
                    return value ? normalizeString(String(value)).includes(normalizedQuery) : false;
                });
            });
        }

        return filtered;
    }, [clients, filters, searchQuery]);

    const handleFilterChange = useCallback((filterName: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
    }, []);
    
    const handleClearFilters = useCallback(() => setFilters({
        status: '',
        clientType: '',
        promocionNombre: '',
        group: '',
        rangoEdad: '',
        añoRegistro: '',
    }), []);

    const handleImportComplete = useCallback((importedClients: Client[], updatedClients: Client[]) => {
        setClients(prev => {
            const existingIds = new Set(prev.map(c => c.id));
            const newClients = importedClients.filter(c => !existingIds.has(c.id));
            
            const clientMap = new Map(prev.map(c => [c.id, c]));
            updatedClients.forEach(uc => clientMap.set(uc.id, { ...clientMap.get(uc.id), ...uc }));

            return [...Array.from(clientMap.values()), ...newClients];
        });
        setIsImportModalOpen(false);
    }, [setClients]);
    
    const handleBulkUpdate = (updates: Partial<Client>) => {
        const now = new Date().toISOString();
        setClients(prev =>
            prev.map(client =>
                selectedRows.has(client.id)
                    ? { ...client, ...updates, lastActivityDate: now }
                    : client
            )
        );
        setIsBulkActionsModalOpen(false);
    };

    const handleSaveClient = useCallback((updatedClient: Client) => {
        setClients(prevClients => 
            prevClients.map(c => c.id === updatedClient.id ? { ...(c as Client), ...updatedClient } : c)
        );
        setEditingClient(null);
    }, [setClients]);


    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="shrink-0 p-2 bg-brand-bg-light rounded-t-lg space-y-3">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Base de Datos de Clientes</h2>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => setIsImportModalOpen(true)} className="flex items-center bg-brand-primary/80 text-white font-semibold py-2 px-3 rounded-lg hover:bg-brand-primary transition-colors text-sm">
                            <PlusIcon className="h-4 w-4"/>
                            <span className="ml-2">Importar</span>
                        </button>
                    </div>
                </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 items-end">
                    <HoverDropdown label="Estado" options={filterOptions.status} value={filters.status} onChange={value => handleFilterChange('status', value)} />
                    <HoverDropdown label="Tipo Cliente" options={filterOptions.clientType} value={filters.clientType} onChange={value => handleFilterChange('clientType', value)} />
                    <HoverDropdown label="Promoción" options={filterOptions.promocionNombre} value={filters.promocionNombre} onChange={value => handleFilterChange('promocionNombre', value)} />
                    <HoverDropdown label="Grupo" options={filterOptions.group} value={filters.group} onChange={value => handleFilterChange('group', value)} />
                    <HoverDropdown label="Rango Edad" options={filterOptions.rangoEdad} value={filters.rangoEdad} onChange={value => handleFilterChange('rangoEdad', value)} />
                    <HoverDropdown label="Año Registro" options={filterOptions.añoRegistro} value={filters.añoRegistro} onChange={value => handleFilterChange('añoRegistro', value)} />
                    <button 
                        onClick={handleClearFilters} 
                        className="flex items-center justify-center bg-brand-surface hover:bg-gray-600 text-brand-text-secondary font-semibold py-1.5 px-3 rounded-lg transition-colors text-sm h-[37px]"
                    >
                        <FunnelSlashIcon className="h-4 w-4 mr-2" />
                        Limpiar
                    </button>
                 </div>
                 <div className="flex justify-between items-center">
                    <input
                        type="text"
                        placeholder="Buscar por nombre, DNI, email, teléfono, promoción, vivienda..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-brand-surface text-brand-text rounded-md p-2 text-sm placeholder:text-brand-text-secondary/70"
                    />
                </div>
            </div>
             <div className="shrink-0 bg-brand-bg-dark p-2 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <span className="text-sm font-semibold text-brand-text w-28 text-center">
                        {selectedRows.size} seleccionada{selectedRows.size !== 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center space-x-2">
                         <button onClick={() => setSelectedRows(new Set(filteredClients.map(c => c.id)))} title="Seleccionar Visibles" className="p-2 text-brand-text-secondary hover:text-brand-primary rounded-full hover:bg-brand-surface"><QueueListIcon /></button>
                         <button onClick={() => setSelectedRows(new Set())} title="Anular Selección" className="p-2 text-brand-text-secondary hover:text-brand-primary rounded-full hover:bg-brand-surface" disabled={selectedRows.size === 0}><XCircleIcon /></button>
                         <button onClick={() => setIsBulkActionsModalOpen(true)} title="Acciones en lote" className="p-2 text-brand-text-secondary hover:text-brand-primary rounded-full hover:bg-brand-surface" disabled={selectedRows.size < 2}><Cog6ToothIcon /></button>
                         <button title="Exportar Selección" className="p-2 text-brand-text-secondary hover:text-brand-primary rounded-full hover:bg-brand-surface" disabled={selectedRows.size === 0}><ArrowDownOnSquareIcon /></button>
                    </div>
                </div>
            </div>
            <div className="flex-1 min-h-0">
                <ClientTable
                    clients={filteredClients}
                    selectedRows={selectedRows}
                    setSelectedRows={setSelectedRows}
                    lastSelectedRowId={lastSelectedRowId}
                    setLastSelectedRowId={setLastSelectedRowId}
                    onEditClient={setEditingClient}
                />
            </div>

            {isImportModalOpen && (
                <ClientImportModal
                    allClients={clients}
                    allProjects={allProjects}
                    onClose={() => setIsImportModalOpen(false)}
                    onComplete={handleImportComplete}
                />
            )}
            {isBulkActionsModalOpen && (
                <BulkActionsModal
                    selectedClientIds={selectedRows}
                    onClose={() => setIsBulkActionsModalOpen(false)}
                    onSave={handleBulkUpdate}
                />
            )}
             {editingClient && (
                <ClientDetailModal
                    client={editingClient}
                    onClose={() => setEditingClient(null)}
                    onSave={handleSaveClient}
                />
            )}
        </div>
    );
};

export default ClientsView;