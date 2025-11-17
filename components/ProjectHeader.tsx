import React, { useRef, useState } from 'react';
import type { Project, Unit, Garage, Storage } from '../types';
import { Status } from '../types';
import { PlusIcon, TrashIcon, ArrowPathIcon } from './icons/Icons';

interface ProjectHeaderProps {
  projects: Project[];
  setProjects: (updater: (prevProjects: Project[]) => Project[]) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
}

/**
 * [MODIFICADO] Parsea un string en formato numérico español (es-ES) a un número.
 * - Elimina el símbolo '€' y espacios.
 * - Elimina los puntos '.' como separadores de miles.
 * - Reemplaza la coma ',' decimal por un punto '.'.
 * @param str El string a convertir.
 * @returns El número parseado, o 0 si no es válido.
 */
const cleanNumber = (str: string | undefined): number => {
    if (!str) return 0;
    
    let value = str.toString().trim();
    
    // Eliminar el símbolo de euro y espacios adicionales
    value = value.replace(/€/g, '').trim();

    // Eliminar los puntos de millares
    value = value.replace(/\./g, '');

    // Reemplazar la coma decimal por un punto
    value = value.replace(',', '.');
    
    // Eliminar cualquier caracter no numérico restante (excepto el punto decimal y el signo negativo)
    value = value.replace(/[^0-9.-]/g, '');

    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
};


// Helper para obtener el valor de un objeto de fila, buscando por múltiples claves posibles de forma insensible a mayúsculas.
const getValueFromRow = (row: Record<string, any>, keys: string[]): any => {
    // Crea un mapa de claves normalizadas (minúsculas, sin espacios) a claves originales para una búsqueda eficiente
    const lowerCaseRowKeys: Record<string, string> = Object.keys(row).reduce((acc, key) => {
        acc[key.trim().toLowerCase()] = key;
        return acc;
    }, {} as Record<string, string>);

    for (const searchKey of keys) {
        const normalizedSearchKey = searchKey.trim().toLowerCase();
        const originalKey = lowerCaseRowKeys[normalizedSearchKey];
        if (originalKey && row[originalKey] !== undefined) {
            return row[originalKey];
        }
    }
    return undefined;
};

/**
 * [NUEVO] Parsea el contenido de un CSV, manejando delimitador, cabeceras simples o dobles y validación de columnas.
 * @param csvText Contenido del fichero CSV.
 * @param hasGroupHeader Indica si el CSV tiene una doble cabecera (grupos y columnas).
 * @returns Un objeto con los datos parseados, las cabeceras de columna y opcionalmente las cabeceras de grupo.
 */
const parseCsvData = (csvText: string, hasGroupHeader: boolean) => {
    const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < (hasGroupHeader ? 2 : 1)) {
        return { data: [], columnHeaders: [], groupHeaders: [] };
    }

    // [MODIFICADO] Usa punto y coma (;) como separador
    const sanitize = (header: string) => header.trim().replace(/\uFEFF/g, ''); // Elimina BOM

    let groupHeaders: string[] = [];
    let columnHeaders: string[] = [];
    let dataLines: string[] = [];

    if (hasGroupHeader) {
        groupHeaders = lines[0].split(';').map(sanitize);
        columnHeaders = lines[1].split(';').map(sanitize);
        dataLines = lines.slice(2);
    } else {
        columnHeaders = lines[0].split(';').map(sanitize);
        dataLines = lines.slice(1);
    }
    
    const expectedColumnCount = columnHeaders.length;

    // [NUEVO] Control de integridad por fila
    if (hasGroupHeader && groupHeaders.length !== expectedColumnCount) {
        throw new Error(`Inconsistencia en cabeceras: la fila de grupos tiene ${groupHeaders.length} columnas, pero la de cabeceras tiene ${expectedColumnCount}.`);
    }

    const data = dataLines.map((line, index) => {
        // [MODIFICADO] Usa punto y coma (;) como separador para las filas
        const values = line.split(';');

        // [NUEVO] Control de integridad del número de columnas por fila
        if (values.length !== expectedColumnCount) {
            const lineNumber = index + (hasGroupHeader ? 3 : 2);
            throw new Error(`Error en la línea ${lineNumber}: Se esperaban ${expectedColumnCount} columnas pero se encontraron ${values.length}. Contenido: "${line}"`);
        }

        const rowObject: Record<string, string> = {};
        columnHeaders.forEach((header, i) => {
            rowObject[header] = values[i]?.trim() || '';
        });
        return rowObject;
    });

    return { data, columnHeaders, groupHeaders };
};


const ProjectHeader: React.FC<ProjectHeaderProps> = ({ projects, setProjects, selectedProjectId, setSelectedProjectId }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProjectId(e.target.value);
  };
  
  const handleDeleteProject = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este proyecto?')) {
        setProjects(prevProjects => prevProjects.filter(p => p.id !== selectedProjectId));
    }
  };

  const handleImportClick = () => {
    setIsUpdating(false);
    fileInputRef.current?.click();
  };
  
  const handleUpdateClick = () => {
      setIsUpdating(true);
      fileInputRef.current?.click();
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length !== 4) {
        alert("Por favor, selecciona exactamente 4 archivos CSV para el proyecto (DS GENERALES, TS GENERAL, GARAJES, TRASTEROS BR).");
        return;
    }

    try {
        const readFileAsText = (file: File): Promise<string> =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target?.result as string);
            reader.onerror = reject;
            reader.readAsText(file, 'ISO-8859-1'); // Use a compatible encoding
          });
        
        const fileMap = new Map<string, string>();
        const filePromises = Array.from(files).map(async file => {
            const content = await readFileAsText(file);
            const fileNameUpper = file.name.toUpperCase();
            if (fileNameUpper.includes('DS GENERALES')) fileMap.set('DS GENERALES', content);
            else if (fileNameUpper.includes('TS GENERAL')) fileMap.set('TS GENERAL', content);
            else if (fileNameUpper.includes('GARAJES')) fileMap.set('GARAJES', content);
            else if (fileNameUpper.includes('TRASTEROS BR')) fileMap.set('TRASTEROS BR', content);
        });
        
        await Promise.all(filePromises);

        const projectInfoText = fileMap.get('DS GENERALES');
        const unitsText = fileMap.get('TS GENERAL');
        const garagesText = fileMap.get('GARAJES');
        const storagesText = fileMap.get('TRASTEROS BR');
        
        if (!projectInfoText || !unitsText || !garagesText || !storagesText) {
            throw new Error("Uno o más archivos de proyecto requeridos faltan o su nombre no es reconocido (DS GENERALES, TS GENERAL, GARAJES, TRASTEROS BR).");
        }
        
        const parsedProjectData = parseProjectFiles(projectInfoText, unitsText, garagesText, storagesText);
        
        if(isUpdating && selectedProjectId) {
            setProjects(prevProjects => prevProjects.map(p => {
                if(p.id === selectedProjectId) {
                    return { ...p, ...parsedProjectData, id: p.id }; // Keep original ID
                }
                return p;
            }));
            alert("Proyecto actualizado correctamente.");
        } else {
            const newProject = { ...parsedProjectData, id: `proj-${Date.now()}`};
            setProjects(prevProjects => [...prevProjects, newProject]);
            setSelectedProjectId(newProject.id);
        }

    } catch (error) {
        console.error("Error procesando los archivos de proyecto:", error);
        alert(`Error al importar el proyecto: ${(error as Error).message}`);
    } finally {
        if(fileInputRef.current) fileInputRef.current.value = "";
        setIsUpdating(false);
    }
  };
  
  const parseProjectFiles = (projectInfoText: string, unitsText: string, garagesText: string, storagesText: string): Omit<Project, 'id'> => {
    
    // 1. Parse DS GENERALES (Key-Value)
    const projectInfo: Partial<Project> = {};
    const keyMap: Record<string, keyof Project> = {
        'PROMOCIÓN': 'name', 'CÓDIGO': 'code', 'RÉGIMEN': 'regime', 'LOCALIDAD': 'locality', 'SITUACIÓN': 'location',
        'USO': 'use', 'TIPOLOGÍA': 'typology', 'TIPO DE OBRA': 'workType', 'FASE DEL PROYECTO': 'projectPhase',
        'SISTEMA DE GESTIÓN': 'managementSystem', 'Nº MÁX. VIVIENDAS': 'maxDwellings', 'Nº MÍNIMO PLZ. GARAJE': 'minGarageSpaces',
        'Nº LOCALES COMERCIALES': 'commercialPremises', 'SUPERFICIE DE PARCELA': 'plotArea', 'EDIFICABILIDAD MÁXIMA': 'maxEdificability',
        'PLANTAS MÁX. SR': 'maxFloorsSR', 'PLANTAS BR': 'floorsBR', 'PEM PROYECTO': 'pemProject', 'PROPIEDAD': 'property',
        'PROMOTORA/GESTORA': 'promoter', 'ARQUITECTO': 'architect', 'ESTUDIO': 'studio', 'ARQUITECTO TÉCNICO 1': 'technicalArchitect1',
        'ARQUITECTO TÉCNICO 2': 'technicalArchitect2', 'COMERCIALIZADORA': 'marketer', 'DOCUMENTACIÓN COMERCIAL': 'commercialDocs',
        'INFOGRAFÍAS': 'infographics', 'GESTORA DE MATERIALES': 'materialsManager', 'PROJECT MANAGMENT': 'projectManagement',
        'PROJECT MONITORING': 'projectMonitoring', 'CONSTRUCTORA': 'constructor', 'JEFE DE OBRAS': 'headOfWorks',
        'ENCARGADO DE OBRAS': 'worksManager', 'GEOTÉCNICO': 'geotechnical', 'TOPOGRÁFIICO': 'topographical', 'ICT': 'ict',
        'OCT': 'oct', 'SEGURO DECENAL': 'decennialInsurance', 'FECHA DE LICENCIA': 'licenseDate',
        'FECHA ACTA DE REPLANTEO': 'replanningActDate', 'FECHA CFO': 'cfoDate', 'PEM CONTRATADO': 'pemContracted',
        'COSTES DE URBANIZACIÓN': 'urbanizationCosts', 'ICIO': 'icio', 'TASAS LICENCIA': 'licenseFees',
        'FIANZA RESIDUOS': 'residualDeposit', 'FIANZA URBANIZACIÓN': 'urbanizationDeposit', 'IPREM': 'iprem',
        'MÁXIMOS 2025': 'maximos2025', 'PRECIO LIMITADO': 'precioLimitado', 'MODULO BASICO': 'moduloBasico',
        'MODULO PONDERADO': 'moduloPonderado', 'PRECIO REFERENCIA': 'precioReferencia', 'PRECIO REF. ANEJOS': 'precioRefAnejos',
    };
    const numericKeys: (keyof Project)[] = [
        'maxDwellings', 'minGarageSpaces', 'commercialPremises', 'plotArea', 'maxEdificability', 'maxFloorsSR', 'floorsBR',
        'pemProject', 'pemContracted', 'urbanizationCosts', 'icio', 'licenseFees', 'residualDeposit', 'urbanizationDeposit',
        'moduloBasico', 'moduloPonderado', 'precioReferencia', 'precioRefAnejos'
    ];

    projectInfoText.split('\n').forEach(line => {
        const parts = line.split(';');
        if (parts.length >= 2) {
            const key = parts[0].trim().replace(':', '');
            const value = parts.slice(1).join(';').trim();
            if (key === 'RÉGIMEN') {
                if (!projectInfo.regime) projectInfo.regime = value;
                else projectInfo.regime2 = value;
            } else {
                const mappedKey = keyMap[key];
                if (mappedKey) (projectInfo as any)[mappedKey] = numericKeys.includes(mappedKey) ? cleanNumber(value) : value;
            }
        }
    });

    // 2. Parse TS GENERAL (Units) - con doble cabecera
    const { data: unitsData, columnHeaders: unitColumnHeaders, groupHeaders: unitColumnGroups } = parseCsvData(unitsText, true);
    const units: Unit[] = unitsData.map(row => ({
        ...row, // Incluir todas las columnas dinámicas
        // Sobrescribir/Tipar las columnas conocidas
        id: getValueFromRow(row, ['ID VIVIENDA', 'VIVIENDAS']),
        bedrooms: parseInt(getValueFromRow(row, ['Nº DORM', 'DORM.']) || '0'),
        bathrooms: parseInt(getValueFromRow(row, ['Nº BAÑOS', 'BAÑOS']) || '0'),
        building: getValueFromRow(row, ['EDIFICIO']),
        floor: parseInt(getValueFromRow(row, ['NIVEL', 'PLANTA']) || '0'),
        // [CORREGIDO] Asegurar que FASE y PORTAL se parseen como números
        'FASE': parseInt(getValueFromRow(row, ['FASE']) || '0'),
        'PORTAL': parseInt(getValueFromRow(row, ['PORTAL']) || '0'),
        type: getValueFromRow(row, ['TIPO']),
        position: getValueFromRow(row, ['POSICIÓN']),
        orientation: getValueFromRow(row, ['ORIENTACIÓN']),
        usefulLivingArea: cleanNumber(getValueFromRow(row, ['SUP. ÚTIL VIVIENDA', 'SUP.UTIL.VIVIENDA'])),
        usefulCoveredTerrace: cleanNumber(getValueFromRow(row, ['SUP. ÚTIL TERRAZA CUB.', 'SUP.UTIL.TERRAZA CUB.'])),
        usefulUncoveredTerrace: cleanNumber(getValueFromRow(row, ['SUP. ÚTIL TERRAZA DESC.', 'SUP.UTIL.TERRAZA DESC.'])),
        totalUsefulArea: cleanNumber(getValueFromRow(row, ['SUP. ÚTIL TOTAL', 'SUP.UTIL.TOTAL'])),
        builtLivingArea: cleanNumber(getValueFromRow(row, ['SUP. CONST. VIVIENDA', 'SUP.CONST.VIVIENDA'])),
        builtCommonArea: cleanNumber(getValueFromRow(row, ['SUP. CONST. Z.C.', 'SUP.CONST.Z.C.'])),
        totalBuiltArea: cleanNumber(getValueFromRow(row, ['SUP. CONST. TOTAL', 'SUP.CONST.TOTAL'])),
        price: cleanNumber(getValueFromRow(row, ['PRECIO DE VENTA', 'PRECIO VENTA', 'PRECIO MÁXIMO', 'MÁXIMO'])),
        status: Status.Available, // Default status
        // Mapeo numérico para todas las demás columnas que parezcan números
        ...Object.fromEntries(Object.entries(row).map(([key, value]) => {
             // [CORREGIDO] Heurística para convertir a número columnas con formato numérico, incluyendo ceros.
            if (typeof value === 'string' && value.trim() !== '' && /^[0-9.,\s€]+$/.test(value) && isNaN(Number(key))) {
                return [key, cleanNumber(value)];
            }
            return [key, value];
        }))
    })).filter(u => u.id);

    // 3. Parse GARAJES (Garages) - con doble cabecera
    const { data: garagesData, columnHeaders: garageColumnHeaders, groupHeaders: garageColumnGroups } = parseCsvData(garagesText, true);
    const garages: Garage[] = garagesData.map(row => ({
        ...row,
        id: getValueFromRow(row, ['ID-G']),
        linkedStorageId: getValueFromRow(row, ['TRASTERO VINC']),
        builtArea: cleanNumber(getValueFromRow(row, ['CONST-G'])),
        usefulArea: cleanNumber(getValueFromRow(row, ['ÚTIL PRIV-G'])),
        price: cleanNumber(getValueFromRow(row, ['PRECIO MÁX-G'])),
        type: getValueFromRow(row, ['TIPO-G']),
    })).filter(g => g.id);
    
    // 4. Parse TRASTEROS BR (Storages) - con cabecera simple
    const { data: storagesData, columnHeaders: storageColumnHeaders } = parseCsvData(storagesText, false);
    const storages: Storage[] = storagesData.map(row => ({
        ...row,
        id: getValueFromRow(row, ['ID-T']),
        linkedGarageId: getValueFromRow(row, ['PLAZA VINCULADA']),
        builtArea: cleanNumber(getValueFromRow(row, ['CONST-T'])),
        usefulArea: cleanNumber(getValueFromRow(row, ['ÚTIL PRIV-T'])),
        price: cleanNumber(getValueFromRow(row, ['PRECIO MÁX-T'])),
    })).filter(s => s.id);
    
    return {
      ...projectInfo,
      name: projectInfo.name || 'Proyecto Importado',
      units,
      unitColumnHeaders,
      unitColumnGroups,
      garages,
      garageColumnHeaders,
      garageColumnGroups,
      storages,
      storageColumnHeaders,
    };
  };


  return (
    <header className="flex items-center justify-between p-4 bg-brand-bg-light border-b border-brand-surface h-16 shrink-0">
      <div className="flex items-center space-x-4">
        {projects.length > 0 ? (
            <>
            <select
              value={selectedProjectId || ''}
              onChange={handleProjectChange}
              className="bg-brand-surface text-brand-text rounded-md p-2 focus:ring-2 focus:ring-brand-primary focus:outline-none"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {selectedProjectId && (
                 <div className="flex items-center space-x-2">
                    <button onClick={handleUpdateClick} title="Actualizar Datos del Proyecto" className="p-2 text-brand-text-secondary hover:text-green-400 rounded-md hover:bg-brand-surface">
                        <ArrowPathIcon />
                    </button>
                    <button onClick={handleDeleteProject} title="Eliminar Proyecto" className="p-2 text-brand-text-secondary hover:text-red-400 rounded-md hover:bg-brand-surface">
                        <TrashIcon />
                    </button>
                 </div>
            )}
            </>
        ) : (
            <span className="text-brand-text-secondary">No hay proyectos cargados</span>
        )}
      </div>
      <div>
        <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
        <button 
          onClick={handleImportClick}
          className="flex items-center bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-400 transition-colors"
        >
          <PlusIcon />
          <span className="ml-2">Importar Proyecto</span>
        </button>
      </div>
    </header>
  );
};

export default ProjectHeader;