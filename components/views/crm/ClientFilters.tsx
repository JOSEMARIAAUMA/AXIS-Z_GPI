import React, { useMemo } from 'react';
import type { AugmentedClient } from '../../../types';
import { ClientStatus, ClientType } from '../../../types';
import { FunnelSlashIcon } from '../../icons/Icons';

interface ClientFiltersProps {
  clients: AugmentedClient[];
  filters: Record<string, Set<string>>;
  onFilterChange: (filterName: string, value: string) => void;
  onClearFilters: () => void;
}

const FilterSection: React.FC<{
  title: string;
  options: string[];
  selected: Set<string>;
  onToggle: (value: string) => void;
}> = ({ title, options, selected, onToggle }) => {
  if (options.length === 0) return null;

  return (
    <div>
      <h4 className="font-semibold text-brand-text mb-2 text-sm">{title}</h4>
      <ul className="space-y-1 max-h-48 overflow-y-auto pr-1">
        {options.map(option => (
          <li key={option}>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.has(option)}
                onChange={() => onToggle(option)}
                className="h-4 w-4 rounded bg-brand-surface border-brand-surface text-brand-primary focus:ring-brand-primary"
              />
              <span className="text-sm text-brand-text-secondary">{option}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};

const ClientFilters: React.FC<ClientFiltersProps> = ({ clients, filters, onFilterChange, onClearFilters }) => {
  const filterOptions = useMemo(() => {
    const getUniqueSorted = (key: keyof AugmentedClient) =>
      [...new Set(clients.map(c => c[key]).filter(Boolean))]
        .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));

    return {
      status: Object.values(ClientStatus),
      clientType: Object.values(ClientType),
      promocionNombre: getUniqueSorted('promocionNombre'),
      group: getUniqueSorted('group'),
      rangoEdad: getUniqueSorted('rangoEdad'),
      gender: getUniqueSorted('gender'),
      añoRegistro: getUniqueSorted('añoRegistro'),
    };
  }, [clients]);

  return (
    <div className="w-64 bg-brand-bg-light p-4 rounded-lg flex-shrink-0 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Segmentar</h3>
        <button onClick={onClearFilters} className="p-1 text-brand-text-secondary hover:text-brand-primary" title="Borrar filtros">
            <FunnelSlashIcon />
        </button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto">
        <FilterSection title="Estado" options={filterOptions.status} selected={filters.status || new Set()} onToggle={(v) => onFilterChange('status', v)} />
        <FilterSection title="Tipo de Cliente" options={filterOptions.clientType} selected={filters.clientType || new Set()} onToggle={(v) => onFilterChange('clientType', v)} />
        <FilterSection title="Promoción" options={filterOptions.promocionNombre as string[]} selected={filters.promocionNombre || new Set()} onToggle={(v) => onFilterChange('promocionNombre', v)} />
        <FilterSection title="Grupo" options={filterOptions.group as string[]} selected={filters.group || new Set()} onToggle={(v) => onFilterChange('group', v)} />
        <FilterSection title="Rango de Edad" options={filterOptions.rangoEdad as string[]} selected={filters.rangoEdad || new Set()} onToggle={(v) => onFilterChange('rangoEdad', v)} />
        <FilterSection title="Género" options={filterOptions.gender as string[]} selected={filters.gender || new Set()} onToggle={(v) => onFilterChange('gender', v)} />
        <FilterSection title="Año de Registro" options={filterOptions.añoRegistro.map(String)} selected={filters.añoRegistro || new Set()} onToggle={(v) => onFilterChange('añoRegistro', v)} />
      </div>
    </div>
  );
};

export default ClientFilters;
