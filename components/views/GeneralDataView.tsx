import React, { useMemo } from 'react';
import type { Project } from '../../types';

const Card = ({ title, children, className = '' }: { title: string, children: React.ReactNode, className?: string }) => (
    <div className={`bg-brand-bg-light rounded-sm shadow-md flex flex-col ${className}`}>
        <h3 className="bg-brand-surface text-brand-text font-bold p-1 px-2 text-xs rounded-t-sm">{title}</h3>
        <div className="p-2 space-y-1 text-xs flex-grow">
            {children}
        </div>
    </div>
);

const formatValue = (value: any, decimals = 2): string => {
    if (value === undefined || value === null || value === '' || (typeof value === 'number' && isNaN(value))) return '-';
    if (typeof value === 'number') {
        return value.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }
    return String(value);
};


const DataRow = ({ label, value, unit, highlight = false }: { label: string, value: string | number | undefined, unit?: string, highlight?: boolean }) => (
    <div className={`flex justify-between items-baseline ${highlight ? 'text-brand-text font-semibold' : 'text-brand-text-secondary'} border-b border-brand-surface/20 py-0.5`}>
        <span className="text-brand-text-secondary mr-2">{label}:</span>
        <div className="text-right flex-shrink-0">
             <span className={`font-semibold ${highlight ? 'text-brand-primary' : 'text-brand-text'}`}>{formatValue(value)}</span>
             {unit && <span className="ml-1 text-brand-text-secondary">{unit}</span>}
        </div>
    </div>
);

const TableCard = ({ title, headers, data, className = '' }: { title: string, headers: string[], data: (string | number)[][], className?: string }) => (
    <Card title={title} className={className}>
        <table className="w-full text-xs">
            <thead>
                <tr className="text-left">
                    {headers.map((h, i) => <th key={i} className={`pb-1 font-semibold text-brand-text-secondary ${i > 0 ? 'text-right' : ''}`}>{h}</th>)}
                </tr>
            </thead>
            <tbody>
                {data.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-brand-surface/20">
                        {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className={`py-0.5 ${cellIndex > 0 ? 'text-right font-semibold text-brand-text' : 'text-brand-text-secondary'}`}>
                                {cellIndex === 0 ? cell : formatValue(cell)}
                                {cellIndex === row.length -1 && <span className="ml-1 text-brand-text-secondary">Euros</span>}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </Card>
);

interface GeneralDataViewProps {
  project: Project;
}

const GeneralDataView: React.FC<GeneralDataViewProps> = ({ project }) => {
    
    const summary = useMemo(() => {
        if (!project) return {};

        const unitsSR = project.units.filter(u => u.floor > 0);
        const unitsBR = project.units.filter(u => u.floor <= 0);

        const builtSR = unitsSR.reduce((sum, u) => sum + u.totalBuiltArea, 0);
        const builtBR = unitsBR.reduce((sum, u) => sum + u.totalBuiltArea, 0);

        const saleValueViviendas = project.units.reduce((sum, u) => sum + u.price, 0);
        const saleValueGarajes = project.garages.reduce((sum, g) => sum + g.price, 0);
        const saleValueTrasteros = project.storages.reduce((sum, t) => sum + t.price, 0);
        
        const supConstRealBajoRasante = project.garages.reduce((s, g) => s + g.builtArea, 0) + project.storages.reduce((s, t) => s + t.builtArea, 0);
        const supConstRealTotalResidencial = project.units.reduce((s, u) => s + u.totalBuiltArea, 0);
        
        const supUtilViviendas = project.units.reduce((s, u) => s + u.usefulLivingArea, 0);
        const supUtilTrasteros = project.storages.reduce((s, u) => s + u.usefulArea, 0);
        const supUtilGarajes = project.garages.reduce((s, u) => s + u.usefulArea, 0);

        return {
            numViviendas: project.units.length,
            numPlazasGaraje: project.garages.length,
            numTrasteros: project.storages.length,
            builtSR,
            builtBR,
            totalEdificabilidad: builtSR + builtBR,
            plantasSR: project.maxFloorsSR,
            plantasBR: project.floorsBR,
            saleValueViviendas,
            saleValueGarajes,
            saleValueTrasteros,
            totalSaleValue: saleValueViviendas + saleValueGarajes + saleValueTrasteros,
            supConstRealBajoRasante,
            supConstRealTotalResidencial,
            supConstRealNetoViviendas: project.units.reduce((s, u) => s + u.builtLivingArea, 0),
            supConstRealZonasComunes: project.units.reduce((s, u) => s + u.builtCommonArea, 0),
            supUtilViviendas,
            supUtilTrasteros,
            supUtilGarajes,
            supUtilTotalSR: supUtilViviendas,
            supUtilTotalBR: supUtilGarajes + supUtilTrasteros,
        };
    }, [project]);
    
    return (
        <div className="p-1 h-full overflow-y-auto bg-gray-100/10 rounded">
            <div className="flex justify-end mb-2">
                <button className="bg-gray-300 text-gray-800 font-bold py-1 px-3 text-xs rounded-sm hover:bg-gray-400">
                    REACTIVAR
                </button>
            </div>
            <div className="flex flex-col gap-2">
                {/* --- ROW 1 --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                    <Card title="1. DATOS GENERALES" className="h-full">
                        <DataRow label="PROMOCIÓN" value={project.name} />
                        <DataRow label="CÓDIGO" value={project.code} />
                        <DataRow label="RÉGIMEN" value={project.regime} />
                        <DataRow label="LOCALIDAD" value={project.locality} />
                        <DataRow label="SITUACIÓN" value={project.location} />
                        <DataRow label="USO" value={project.use} />
                        <DataRow label="TIPOLOGÍA" value={project.typology} />
                        <DataRow label="TIPO DE OBRA" value={project.workType} />
                        <DataRow label="FASE DEL PROYECTO" value={project.projectPhase} />
                        <DataRow label="SISTEMA DE GESTIÓN" value={project.managementSystem} />
                    </Card>
                    <Card title="5. AGENTES" className="h-full">
                        <DataRow label="PROPIEDAD" value={project.property} />
                        <DataRow label="PROMOTORA/GESTORA" value={project.promoter} />
                        <DataRow label="ARQUITECTO" value={project.architect} />
                        <DataRow label="ESTUDIO" value={project.studio} />
                        <DataRow label="ARQUITECTO TÉCNICO 1" value={project.technicalArchitect1} />
                        <DataRow label="ARQUITECTO TÉCNICO 2" value={project.technicalArchitect2} />
                        <DataRow label="COMERCIALIZADORA" value={project.marketer} />
                        <DataRow label="DOCUMENTACIÓN COMERCIAL" value={project.commercialDocs} />
                        <DataRow label="INFOGRAFÍAS" value={project.infographics} />
                        <DataRow label="GESTORA DE MATERIALES" value={project.materialsManager} />
                    </Card>
                    <Card title="PROJECT MANAGEMENT" className="h-full">
                        <DataRow label="PROJECT MONITORING" value={project.projectMonitoring} />
                        <DataRow label="CONSTRUCTORA" value={project.constructor} />
                        <DataRow label="JEFE DE OBRAS" value={project.headOfWorks} />
                        <DataRow label="ENCARGADO DE OBRA" value={project.worksManager} />
                        <DataRow label="GEOTÉCNICO" value={project.geotechnical} />
                        <DataRow label="TOPOGRÁFICO" value={project.topographical} />
                        <DataRow label="ICT" value={project.ict} />
                        <DataRow label="OCT" value={project.oct} />
                        <DataRow label="SEGURO DECENAL" value={project.decennialInsurance} />
                    </Card>
                </div>

                {/* --- ROW 2 --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                    <Card title="2. DATOS DEL SUELO" className="h-full">
                        <DataRow label="Nº MÁX. VIVIENDAS" value={project.maxDwellings} unit="Uds" />
                        <DataRow label="Nº MÍNIMO PLZ. GARAJE" value={project.minGarageSpaces} unit="Uds" />
                        <DataRow label="Nº LOCALES COMERCIALES" value={project.commercialPremises} unit="Uds" />
                        <DataRow label="SUPERFICIE DE PARCELA" value={project.plotArea} unit="m²c" />
                        <DataRow label="EDIFICABILIDAD MÁXIMA" value={project.maxEdificability} unit="m²t" />
                        <DataRow label="PLANTAS MÁX. SR" value={project.maxFloorsSR} unit="Niveles" />
                        <DataRow label="PLANTAS BR" value={project.floorsBR} unit="Niveles" />
                        <DataRow label="PEM PROYECTO" value={formatValue(project.pemProject, 2)} unit="Euros" />
                    </Card>
                    <Card title="6. SUP. CONSTRUIDAS REALES" className="h-full">
                        <DataRow label="BAJO RASANTE" value={summary.supConstRealBajoRasante} unit="m²c" />
                        <DataRow label="TOTAL RESIDENCIAL" value={summary.supConstRealTotalResidencial} unit="m²c" />
                        <DataRow label="COMERCIAL" value={0} unit="m²c" />
                        <DataRow label="NETO VIVIENDAS" value={summary.supConstRealNetoViviendas} unit="m²c" />
                        <DataRow label="EXTERIORES VIVIENDAS" value={0} unit="m²c" />
                        <DataRow label="ZONAS COMUNES EXTERIORES" value={0} unit="m²c" />
                        <DataRow label="TOTAL ZONAS COMUNES" value={summary.supConstRealZonasComunes} unit="m²c" />
                    </Card>
                    <Card title="8. SUPERFICIES ÚTILES" className="h-full">
                        <DataRow label="VIVIENDAS" value={summary.supUtilViviendas} unit="m²u" />
                        <DataRow label="COMERCIAL" value={0} unit="m²u" />
                        <DataRow label="Total SR" value={summary.supUtilTotalSR} unit="m²u" highlight/>
                        <DataRow label="TRASTEROS" value={summary.supUtilTrasteros} unit="m²u" />
                        <DataRow label="GARAJES" value={summary.supUtilGarajes} unit="m²u" />
                        <DataRow label="Total BR" value={summary.supUtilTotalBR} unit="m²u" highlight/>
                        <DataRow label="SALON SOCIAL" value={0} unit="m²u" />
                        <DataRow label="ZONA COMÚN EXTERIOR" value={0} unit="m²u" />
                    </Card>
                </div>

                {/* --- ROW 3 --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                    <Card title="3. DATOS DEL PROYECTO" className="h-full">
                        <DataRow label="Nº DE VIVIENDAS/APARTAMENTOS" value={summary.numViviendas} unit="Uds" />
                        <DataRow label="Nº PLAZAS GARAJE" value={summary.numPlazasGaraje} unit="Uds" />
                        <DataRow label="Nº DE TRASTEROS" value={summary.numTrasteros} unit="Uds" />
                        <DataRow label="EDIFICADO SR" value={summary.builtSR} unit="m²c" />
                        <DataRow label="EDIFICADO BR" value={summary.builtBR} unit="m²c" />
                        <DataRow label="EDIFICABILIDAD TOTAL" value={summary.totalEdificabilidad} unit="m²c" highlight />
                        <DataRow label="PLANTAS SR" value={summary.plantasSR} unit="Niveles" />
                        <DataRow label="PLANTAS BR" value={summary.plantasBR} unit="Niveles" />
                    </Card>
                    <Card title="7. SUP. CONSTRUIDAS URBANÍSTICAS" className="h-full">
                        <DataRow label="BAJO RASANTE" value={0} unit="Uds" />
                        <DataRow label="TOTAL RESIDENCIAL" value={0} unit="m²c" />
                        <DataRow label="COMERCIAL" value={0} unit="m²c" />
                        <DataRow label="NETO VIVIENDAS" value={0} unit="m²c" />
                        <DataRow label="ZONAS COMUNES INT" value={0} unit="m²c" />
                        <DataRow label="ZONAS COMUNES EXT" value={0} unit="m²c" />
                        <DataRow label="TOTAL ZONAS COMUNES" value={0} unit="m²c" />
                    </Card>
                    <Card title="9. VALORES DE VENTA" className="h-full">
                        <DataRow label="VIVIENDAS" value={summary.saleValueViviendas} unit="Euros" />
                        <DataRow label="GARAJES" value={summary.saleValueGarajes} unit="Euros" />
                        <DataRow label="TRASTEROS" value={summary.saleValueTrasteros} unit="Euros" />
                        <DataRow label="LOCALES" value={0} unit="Euros" />
                        <DataRow label="PRECIO DE VENTA TOTAL" value={summary.totalSaleValue} unit="Euros" highlight/>
                        <DataRow label="FECHA DE LICENCIA" value={project.licenseDate} />
                        <DataRow label="FECHA ACTA DE REPLANTEO" value={project.replanningActDate} />
                        <DataRow label="FECHA CFO" value={project.cfoDate} />
                    </Card>
                </div>

                {/* --- ROW 4 --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                    <Card title="10. DATOS ECONÓMICOS" className="h-full">
                        <DataRow label="PEM CONTRATADO" value={project.pemContracted} unit="Euros" />
                        <DataRow label="COSTES DE URBANIZACIÓN" value={project.urbanizationCosts} unit="Euros" />
                        <DataRow label="ICIO" value={project.icio} unit="Euros" />
                        <DataRow label="TASAS LICENCIA" value={project.licenseFees} unit="Euros" />
                        <DataRow label="FIANZA RESIDUOS" value={project.residualDeposit} unit="Euros" />
                        <DataRow label="FIANZA URBANIZACIÓN" value={project.urbanizationDeposit} unit="Euros" />
                    </Card>
                    <TableCard title="PEM unitario (COAC)" headers={['', '2023']} data={[
                        ['Residencial', 1150.00],
                        ['Comercial', 500.00],
                        ['Urb. Interior', 93.66],
                        ['Aparcamiento', 550.00]
                    ]} className="h-full" />
                    <div className="flex flex-col gap-2">
                        <TableCard title="PEM-Uso" headers={['', 'Sup. Proyecto', 'PEM-Uso']} data={[
                            ['Residencial', 1150.00, 1322500],
                            ['Comercial', 500.00, 250000],
                            ['Urb. Interior', 93.66, 8772.1956],
                            ['Aparcamiento', 550.00, 302500]
                        ]} />
                        <Card title="">
                            <DataRow label="PEM TOTAL" value={1883772.20} unit="Euros" highlight />
                        </Card>
                    </div>
                </div>

                {/* --- ROW 5 --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 pt-2">
                     <Card title="">
                         <DataRow label="IPREM" value={project.iprem} />
                         <DataRow label="REGIMEN" value={project.regime2} />
                     </Card>
                      <Card title="">
                         <DataRow label="MÁXIMOS 2025" value={project.maximos2025} />
                         <DataRow label="PRECIO LIMITADO" value={project.precioLimitado} />
                     </Card>
                     <Card title="">
                          <DataRow label="MODULO BASICO" value={project.moduloBasico} unit="Euros" />
                         <DataRow label="MODULO PONDERADO" value={project.moduloPonderado} unit="Euros" />
                     </Card>
                      <Card title="">
                         <DataRow label="PRECIO REFERENCIA" value={project.precioReferencia} unit="Euros" />
                         <DataRow label="PRECIO REF. ANEJOS" value={project.precioRefAnejos} unit="Euros" />
                     </Card>
                </div>
            </div>
        </div>
    );
};

export default GeneralDataView;
