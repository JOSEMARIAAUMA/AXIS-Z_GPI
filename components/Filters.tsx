import React, { useMemo } from 'react';
import type { Project, FiltersState } from '../types';
import { Status } from '../types';
import { FunnelSlashIcon } from './icons/Icons';
import HoverDropdown from './ui/HoverDropdown';

interface FiltersProps {
  project: Project;
  filters: FiltersState;
  setFilters: React.Dispatch<React.SetStateAction<FiltersState>>;
  showPriceRangeFilter?: boolean;
}

const Filters: React.FC<FiltersProps> = ({ project, filters, setFilters, showPriceRangeFilter = false }) => {
    
    const filterOptions = useMemo(() => {
        const units = project.units || [];
        const getUniqueSorted = (key: keyof typeof units[0], numeric = false) => {
            const unique = [...new Set(units.map(u => u[key]))];
            if (numeric) {
                return unique.sort((a, b) => Number(a) - Number(b));
            }
            return unique.sort((a,b) => String(a).localeCompare(String(b)));
        };

        return {
            buildings: getUniqueSorted('building'),
            floors: getUniqueSorted('floor', true),
            bedrooms: getUniqueSorted('bedrooms', true),
            statuses: Object.values(Status),
            types: getUniqueSorted('type'),
            positions: getUniqueSorted('position'),
            orientations: getUniqueSorted('orientation'),
        };
    }, [project.units]);

    const handleFilterChange = (filterName: keyof FiltersState, value: string) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
    };

    const clearFilters = () => {
        setFilters({
            building: '',
            floor: '',
            bedrooms: '',
            status: '',
            type: '',
            position: '',
            orientation: '',
            priceRange: '',
        });
    };
    
    const priceRangeOptions = [
        { value: '<100', label: '< 100k €' },
        { value: '100-150', label: '100-150k €' },
        { value: '150-200', label: '150-200k €' },
        { value: '>200', label: '> 200k €' },
    ];


    return (
        <div>
            <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-2 items-end`}>
                <HoverDropdown label="Edificio" options={filterOptions.buildings} value={filters.building} onChange={value => handleFilterChange('building', value)} />
                <HoverDropdown label="Planta" options={filterOptions.floors} value={filters.floor} onChange={value => handleFilterChange('floor', value)} />
                <HoverDropdown label="Dormitorios" options={filterOptions.bedrooms} value={filters.bedrooms} onChange={value => handleFilterChange('bedrooms', value)} />
                <HoverDropdown label="Estado" options={filterOptions.statuses} value={filters.status} onChange={value => handleFilterChange('status', value)} />
                <HoverDropdown label="Tipo" options={filterOptions.types} value={filters.type} onChange={value => handleFilterChange('type', value)} />
                <HoverDropdown label="Posición" options={filterOptions.positions} value={filters.position} onChange={value => handleFilterChange('position', value)} />
                <HoverDropdown label="Orientación" options={filterOptions.orientations} value={filters.orientation} onChange={value => handleFilterChange('orientation', value)} />
                
                {showPriceRangeFilter && (
                    <div className="lg:col-span-1">
                         <HoverDropdown 
                            label="Rango de Precio" 
                            options={priceRangeOptions} 
                            value={filters.priceRange} 
                            onChange={value => handleFilterChange('priceRange', value)} 
                        />
                    </div>
                )}

                <button 
                    onClick={clearFilters} 
                    className="flex items-center justify-center bg-brand-surface hover:bg-gray-600 text-brand-text-secondary font-semibold py-1.5 px-3 rounded-lg transition-colors text-sm"
                >
                    <FunnelSlashIcon className="h-4 w-4 mr-2" />
                    Limpiar
                </button>
            </div>
        </div>
    );
};

export default Filters;