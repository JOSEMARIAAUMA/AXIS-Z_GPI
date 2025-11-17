import React, { useMemo, useState } from 'react';
import type { Project, FiltersState, Unit } from '../../types';
import { Status } from '../../types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Filters from '../Filters';

const ChartContainer = ({ title, children, headerContent }: { title: string, children?: React.ReactNode, headerContent?: React.ReactNode }) => (
    <div className="bg-brand-bg-light p-4 rounded-lg shadow-lg flex flex-col h-80">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-brand-text">{title}</h3>
            {headerContent}
        </div>
        <div className="flex-grow">
            {children}
        </div>
    </div>
);

interface DashboardViewProps {
  project: Project;
  filters: FiltersState;
  setFilters: React.Dispatch<React.SetStateAction<FiltersState>>;
}

const getWeek = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};


const DashboardView: React.FC<DashboardViewProps> = ({ project, filters, setFilters }) => {
    
    const [timeScale, setTimeScale] = useState<'month' | 'week' | 'year'>('month');

    const filteredUnits = useMemo(() => {
        let units = project.units.filter(unit => {
            return (filters.building === '' || unit.building === filters.building) &&
                   (filters.floor === '' || unit.floor === parseInt(filters.floor, 10)) &&
                   (filters.bedrooms === '' || unit.bedrooms === parseInt(filters.bedrooms, 10)) &&
                   (filters.status === '' || unit.status === filters.status) &&
                   (filters.type === '' || unit.type === filters.type) &&
                   (filters.position === '' || unit.position === filters.position) &&
                   (filters.orientation === '' || unit.orientation === filters.orientation);
        });

        if (filters.priceRange) {
            units = units.filter(unit => {
                const price = unit.price;
                switch (filters.priceRange) {
                    case '<100': return price < 100000;
                    case '100-150': return price >= 100000 && price < 150000;
                    case '150-200': return price >= 150000 && price < 200000;
                    case '>200': return price >= 200000;
                    default: return true;
                }
            });
        }
        return units;

    }, [project.units, filters]);

    const groupAndStackBy = (data: Unit[], key: keyof Unit, nameFormatter?: (value: any) => string) => {
        const grouped = data.reduce((acc, unit) => {
            const groupVal = unit[key];
            const groupName = nameFormatter ? nameFormatter(groupVal) : String(groupVal || 'N/A');
            
            if (!acc[groupName]) {
                acc[groupName] = { name: groupName, sortKey: groupVal, [Status.Available]: 0, [Status.Reserved]: 0, [Status.Sold]: 0 };
            }
            acc[groupName][unit.status]++;
            return acc;
        }, {} as Record<string, any>);
        
        return Object.values(grouped).sort((a,b) => {
            if(typeof a.sortKey === 'number' && typeof b.sortKey === 'number') {
                return a.sortKey - b.sortKey;
            }
            return String(a.sortKey).localeCompare(String(b.sortKey));
        });
    };

    const statusByBuildingData = useMemo(() => groupAndStackBy(filteredUnits, 'building'), [filteredUnits]);
    const statusByTypeData = useMemo(() => groupAndStackBy(filteredUnits, 'type'), [filteredUnits]);

    const statusByPriceRangeData = useMemo(() => {
        if (filteredUnits.length === 0) return [];

        const prices = filteredUnits.map(u => u.price).filter(p => p > 0);
        if(prices.length === 0) return [];
        
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        const roundedMin = Math.floor(minPrice / 25000) * 25000;
        let roundedMax = Math.ceil(maxPrice / 25000) * 25000;

        if (roundedMin >= roundedMax) {
            roundedMax = roundedMin + 25000;
        }

        const range = roundedMax - roundedMin;
        const numIntervals = Math.min(Math.max(Math.floor(range/25000), 1), 5); // Entre 1 y 5 rangos
        const intervalSize = Math.ceil((range / numIntervals) / 5000) * 5000; // Redondea al múltiplo de 5000 más cercano

        const intervals = Array.from({ length: numIntervals }, (_, i) => {
            const start = roundedMin + i * intervalSize;
            const end = start + intervalSize;
            const formatK = (val: number) => `${Math.round(val / 1000)}k`;
            
            return {
                name: `${formatK(start)} - ${formatK(end)}`,
                start,
                end,
                [Status.Available]: 0,
                [Status.Reserved]: 0,
                [Status.Sold]: 0,
            };
        });

        filteredUnits.forEach(unit => {
            const price = unit.price;
            for (let i = 0; i < intervals.length; i++) {
                if (price >= intervals[i].start && price < intervals[i].end) {
                    intervals[i][unit.status]++;
                    break;
                }
            }
        });

        return intervals;
    }, [filteredUnits]);

    const evolutionData = useMemo(() => {
        const datedUnits = project.units.filter(u => u.reservationDate || u.saleDate);
        if (datedUnits.length === 0) return [];

        const allDates = datedUnits.flatMap(u => [u.reservationDate, u.saleDate]).filter(Boolean).map(d => new Date(d!));
        if (allDates.length === 0) return [];
        
        let minDate = new Date(Math.min.apply(null, allDates as any));
        let maxDate = new Date(Math.max.apply(null, allDates as any));
        
        const data: { [key: string]: { name: string; Reservas: number; Ventas: number } } = {};
        
        let currentDate = new Date(minDate);
        
        while(currentDate <= maxDate) {
            let key = '';
            let nextDate = new Date(currentDate);

            if(timeScale === 'month') {
                key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
                nextDate.setMonth(nextDate.getMonth() + 1);
            } else if (timeScale === 'week') {
                key = getWeek(currentDate);
                nextDate.setDate(nextDate.getDate() + 7);
            } else { // year
                key = `${currentDate.getFullYear()}`;
                nextDate.setFullYear(nextDate.getFullYear() + 1);
            }

            if(!data[key]) data[key] = { name: key, Reservas: 0, Ventas: 0 };
            
            if (timeScale === 'month') currentDate.setMonth(currentDate.getMonth() + 1);
            else if (timeScale === 'week') currentDate.setDate(currentDate.getDate() + 7);
            else currentDate.setFullYear(currentDate.getFullYear() + 1);
        }

        datedUnits.forEach(unit => {
            if (unit.reservationDate) {
                const date = new Date(unit.reservationDate);
                let key = '';
                if(timeScale === 'month') key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                else if (timeScale === 'week') key = getWeek(date);
                else key = `${date.getFullYear()}`;
                if (data[key]) data[key].Reservas++;
            }
            if (unit.saleDate) {
                const date = new Date(unit.saleDate);
                let key = '';
                if(timeScale === 'month') key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                else if (timeScale === 'week') key = getWeek(date);
                else key = `${date.getFullYear()}`;
                if (data[key]) data[key].Ventas++;
            }
        });

        const sortedData = Object.values(data).sort((a, b) => a.name.localeCompare(b.name));
        
        // Acumular valores
        for (let i = 1; i < sortedData.length; i++) {
            sortedData[i].Reservas += sortedData[i-1].Reservas;
            sortedData[i].Ventas += sortedData[i-1].Ventas;
        }

        return sortedData;
    }, [project.units, timeScale]);


    const tooltipStyle = { backgroundColor: '#4a5568', border: '1px solid #63b3ed', borderRadius: '0.5rem', color: '#edf2f7' };
    const tooltipLabelStyle = { color: '#edf2f7', fontWeight: 'bold' };

    const renderStackedBarChart = (title: string, data: any[]) => (
        <ChartContainer title={title}>
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                    <XAxis dataKey="name" stroke="#c1cbe0" fontSize={12} />
                    <YAxis stroke="#c1cbe0" fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} cursor={{fill: 'rgba(160, 174, 192, 0.1)'}}/>
                    <Legend wrapperStyle={{fontSize: '12px'}}/>
                    <Bar dataKey={Status.Available} stackId="a" fill="#16a34a" name="Disponibles" />
                    <Bar dataKey={Status.Reserved} stackId="a" fill="#2563eb" name="Reservadas" />
                    <Bar dataKey={Status.Sold} stackId="a" fill="#b91c1c" name="Vendidas" />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
    
    const TimeScaleSelector = () => (
        <div className="flex items-center space-x-1 bg-brand-surface p-1 rounded-md">
            {(['week', 'month', 'year'] as const).map(scale => (
                <button
                    key={scale}
                    onClick={() => setTimeScale(scale)}
                    className={`px-3 py-1 text-xs font-semibold rounded ${
                        timeScale === scale ? 'bg-brand-primary text-white' : 'text-brand-text-secondary hover:bg-brand-bg-dark'
                    }`}
                >
                    {scale === 'week' ? 'Semana' : scale === 'month' ? 'Mes' : 'Año'}
                </button>
            ))}
        </div>
    );

    return (
        <div className="flex flex-col h-full overflow-hidden space-y-3">
            <div className="shrink-0">
                <Filters project={project} filters={filters} setFilters={setFilters} showPriceRangeFilter />
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-4 overflow-y-auto">
                {renderStackedBarChart("Estado por Edificio", statusByBuildingData)}
                {renderStackedBarChart("Estado por Tipo", statusByTypeData)}
                {renderStackedBarChart("Estado por Rango de Precio", statusByPriceRangeData)}
                
                <div className="xl:col-span-3">
                     <ChartContainer title="Evolución de Ventas y Reservas (Acumulado)" headerContent={<TimeScaleSelector />}>
                        <ResponsiveContainer width="100%" height="100%">
                             <LineChart data={evolutionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                                <XAxis dataKey="name" stroke="#c1cbe0" fontSize={12} tick={{ dy: 5 }} />
                                <YAxis stroke="#c1cbe0" fontSize={12} allowDecimals={false} />
                                <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} cursor={{stroke: '#63b3ed', strokeWidth: 1}}/>
                                <Legend wrapperStyle={{fontSize: '12px'}}/>
                                <Line type="monotone" dataKey="Reservas" stroke="#8884d8" dot={false} strokeWidth={2} />
                                <Line type="monotone" dataKey="Ventas" stroke="#82ca9d" dot={false} strokeWidth={2} />
                             </LineChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;