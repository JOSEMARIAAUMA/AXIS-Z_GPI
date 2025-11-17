import React, { useMemo, useState } from 'react';
import type { Project, Unit, Client, FiltersState } from '../../types';
import { STATUS_COLORS, BEDROOM_COLORS } from '../../constants';
import Filters from '../Filters';
import UnitDetailModal from '../modals/UnitDetailModal';

interface UnitCardProps {
  unit: Unit;
  onClick: () => void;
}

const UnitCard: React.FC<UnitCardProps> = ({ unit, onClick }) => {
    const statusColor = STATUS_COLORS[unit.status];
    const bedroomColor = BEDROOM_COLORS[unit.bedrooms] || 'border-l-4 border-gray-500';

    return (
        <div 
            onClick={onClick}
            className={`bg-brand-surface rounded-lg shadow-md p-3 text-xs cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-200 ${bedroomColor}`}>
            <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-brand-text">{unit.id}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>
                    {unit.status}
                </span>
            </div>
            <div className="text-brand-text-secondary space-y-1">
                <p>{unit.bedrooms} dorm. / {unit.totalBuiltArea.toLocaleString('es-ES', { maximumFractionDigits: 0 })} m²</p>
                <p>{unit.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
            </div>
        </div>
    );
};

interface ReservationsViewProps {
  project: Project;
  clients: Client[];
  setProjects: (updater: (prevProjects: Project[]) => Project[]) => void;
  filters: FiltersState;
  setFilters: React.Dispatch<React.SetStateAction<FiltersState>>;
}

const ReservationsView: React.FC<ReservationsViewProps> = ({ project, clients, setProjects, filters, setFilters }) => {
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    
    const filteredUnits = useMemo(() => {
        if (!project.units) return [];
        return project.units.filter(unit => {
            return (filters.building === '' || unit.building === filters.building) &&
                   (filters.floor === '' || unit.floor === parseInt(filters.floor, 10)) &&
                   (filters.bedrooms === '' || unit.bedrooms === parseInt(filters.bedrooms, 10)) &&
                   (filters.status === '' || unit.status === filters.status) &&
                   (filters.type === '' || unit.type === filters.type) &&
                   (filters.position === '' || unit.position === filters.position) &&
                   (filters.orientation === '' || unit.orientation === filters.orientation);
        });
    }, [project.units, filters]);

    const unitsByBuildingAndFloor = useMemo(() => {
        const grouped: Record<string, Record<string, Unit[]>> = {};
        filteredUnits.forEach(unit => {
            if (!grouped[unit.building]) {
                grouped[unit.building] = {};
            }
            if (!grouped[unit.building][unit.floor]) {
                grouped[unit.building][unit.floor] = [];
            }
            grouped[unit.building][unit.floor].push(unit);
        });
        // Sort floors numerically
        for (const building in grouped) {
            grouped[building] = Object.fromEntries(
                Object.entries(grouped[building]).sort(([a], [b]) => parseInt(b) - parseInt(a))
            );
        }
        return grouped;
    }, [filteredUnits]);

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

    return (
        <>
            <div className="space-y-8 overflow-y-auto h-full pr-2">
                <Filters project={project} filters={filters} setFilters={setFilters} />

                <div className="space-y-10">
                    {Object.keys(unitsByBuildingAndFloor).sort().map(building => (
                        <div key={building} className="bg-brand-bg-light p-4 rounded-lg shadow-lg">
                            <h2 className="text-2xl font-semibold mb-4 border-b-2 border-brand-primary pb-2">Edificio {building}</h2>
                            <div className="space-y-4">
                                {Object.keys(unitsByBuildingAndFloor[building]).map(floor => (
                                    <div key={floor} className="flex items-start">
                                        <div className="w-24 text-right pr-4 pt-2 shrink-0">
                                            <span className="font-bold text-lg text-brand-text-secondary">Planta {floor}</span>
                                        </div>
                                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 border-l border-brand-surface pl-4">
                                            {unitsByBuildingAndFloor[building][floor]
                                                .sort((a,b) => a.id.localeCompare(b.id))
                                                .map(unit => (
                                                    <UnitCard key={unit.id} unit={unit} onClick={() => setSelectedUnit(unit)} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
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
        </>
    );
};

export default ReservationsView;
