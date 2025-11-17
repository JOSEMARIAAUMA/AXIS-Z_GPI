import React, { useState, useMemo, useCallback } from 'react';
import type { Client, Project } from '../../types';
import { ClientStatus, ClientType } from '../../types';
import Modal from '../ui/Modal';
import * as XLSX from 'xlsx';

type ImportStep = 'upload' | 'mapping' | 'options' | 'summary';

const autoMapHeaders: Record<string, (keyof Client)[]> = {
  'nombre': ['name'], 'first name': ['name'],
  'apellidos': ['lastName'], 'last name': ['lastName'],
  'telefono': ['phone', 'phone2'], 'telefono1': ['phone'], 'mobile': ['phone'],
  'email': ['email'], 'correo': ['email'], 'correo electronico': ['email'],
  'direccion': ['address'],
  'cp': ['postalCode'], 'codigo postal': ['postalCode'],
  'localidad': ['city'], 'ciudad': ['city'],
  'provincia': ['province'],
  'pais': ['country'],
  'dni': ['dni'],
  'fecha nacimiento': ['birthDate'], 'dob': ['birthDate'],
  'fecha registro': ['registrationDate'], 'fecha alta': ['registrationDate'],
  'estado': ['status'],
  'tipo': ['clientType'], 'tipo cliente': ['clientType'],
  'grupo': ['group'],
  'genero': ['gender'],
  'estado civil': ['civilStatus'],
  'notas': ['notes'],
};

const clientModelFields = Object.keys(autoMapHeaders).reduce((acc, key) => {
    autoMapHeaders[key].forEach(field => acc.add(field));
    return acc;
}, new Set<string>());

const ClientImportModal: React.FC<{
  allClients: Client[];
  allProjects: Project[];
  onClose: () => void;
  onComplete: (newClients: Client[], updatedClients: Client[]) => void;
}> = ({ allClients, allProjects, onClose, onComplete }) => {
  const [step, setStep] = useState<ImportStep>('upload');
  const [fileData, setFileData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, keyof Client | 'ignore'>>({});
  const [importOptions, setImportOptions] = useState({
    duplicates: 'skip', // 'skip' or 'update'
    defaultStatus: ClientStatus.Active,
    defaultClientType: ClientType.Interested,
    defaultProjectId: '',
    defaultGroup: '',
  });
  const [validationResult, setValidationResult] = useState<{
    newClients: Client[];
    updatedClients: Client[];
    errors: { rowIndex: number; message: string }[];
  } | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      const fileHeaders = json[0] as string[];
      const fileRows = json.slice(1).map(row => {
          const rowData: Record<string, any> = {};
          fileHeaders.forEach((header, i) => {
              rowData[header] = (row as any[])[i];
          });
          return rowData;
      });

      setHeaders(fileHeaders);
      setFileData(fileRows);
      performAutoMapping(fileHeaders);
      setStep('mapping');
    };
    reader.readAsArrayBuffer(file);
  };
  
  const performAutoMapping = (fileHeaders: string[]) => {
    const newMapping: Record<string, keyof Client | 'ignore'> = {};
    const usedFields = new Set<string>();

    fileHeaders.forEach(header => {
        const normalizedHeader = header.toLowerCase().trim();
        const possibleFields = autoMapHeaders[normalizedHeader];
        if (possibleFields) {
            const fieldToUse = possibleFields.find(f => !usedFields.has(f));
            if(fieldToUse) {
                newMapping[header] = fieldToUse;
                usedFields.add(fieldToUse);
                return;
            }
        }
        newMapping[header] = 'ignore';
    });
    setMapping(newMapping);
  };

  const handleProcessAndValidate = () => {
    const errors: { rowIndex: number; message: string }[] = [];
    const newClients: Client[] = [];
    const updatedClients: Partial<Client> & { id: string }[] = [];
    const existingClientsMap = new Map(allClients.map(c => [c.dni || c.email, c]));

    fileData.forEach((row, index) => {
      const client: Partial<Client> = {};
      
      Object.entries(mapping).forEach(([header, field]) => {
        if (field !== 'ignore' && row[header] !== undefined) {
          (client as any)[field] = row[header];
        }
      });
      
      // Apply defaults
      if (!client.status) client.status = importOptions.defaultStatus;
      if (!client.clientType) client.clientType = importOptions.defaultClientType;
      if (!client.group && importOptions.defaultGroup) client.group = importOptions.defaultGroup;
      if (!client.registrationDate) client.registrationDate = new Date().toISOString();

      // Validation
      if (!client.name || !client.email) {
        errors.push({ rowIndex: index + 2, message: 'Faltan Nombre o Email.' });
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(client.email)) {
          errors.push({ rowIndex: index + 2, message: `Email inválido: ${client.email}`});
          return;
      }

      const existingClient = existingClientsMap.get(client.dni!) || existingClientsMap.get(client.email);

      if (existingClient) {
        if (importOptions.duplicates === 'update') {
          updatedClients.push({ ...client, id: existingClient.id });
        }
      } else {
        newClients.push({
            ...client,
            id: `cli-${Date.now()}-${index}`,
            name: client.name!,
            email: client.email!,
            phone: client.phone || '',
            status: client.status!,
            clientType: client.clientType!,
            registrationDate: client.registrationDate!
        } as Client);
      }
    });

    setValidationResult({ 
        newClients: newClients as Client[], 
        updatedClients: updatedClients as Client[], 
        errors 
    });
    setStep('summary');
  };

  const renderContent = () => {
    switch (step) {
      case 'upload':
        return (
          <div className="text-center p-8 border-2 border-dashed border-brand-surface rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Subir archivo Excel (.xlsx)</h3>
            <p className="text-sm text-brand-text-secondary mb-4">Arrastra un archivo aquí o haz clic para seleccionarlo.</p>
            <input type="file" accept=".xlsx" onChange={handleFile} className="hidden" id="file-upload" />
            <label htmlFor="file-upload" className="cursor-pointer bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-400">
              Seleccionar Archivo
            </label>
          </div>
        );
      case 'mapping':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Correlación de Columnas</h3>
            <p className="text-sm text-brand-text-secondary">Asigna las columnas de tu archivo a los campos del CRM. Hemos intentado adivinarlo por ti.</p>
            <div className="grid grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-2">
              {headers.map(header => (
                <div key={header}>
                  <label className="block text-sm font-medium text-brand-text">{header}</label>
                  <select 
                    value={mapping[header] || 'ignore'}
                    onChange={e => setMapping(prev => ({ ...prev, [header]: e.target.value as keyof Client | 'ignore' }))}
                    className="mt-1 block w-full bg-brand-surface text-brand-text rounded-md p-2 text-sm"
                  >
                    <option value="ignore">-- Ignorar --</option>
                    {[...clientModelFields].sort().map(field => <option key={field} value={field}>{field}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <h4 className="font-semibold pt-2">Previsualización (primeras 5 filas)</h4>
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead className="bg-brand-surface"><tr>{headers.map(h => <th key={h} className="p-1 text-left font-semibold">{h}</th>)}</tr></thead>
                    <tbody>
                        {fileData.slice(0, 5).map((row, i) => <tr key={i} className="border-b border-brand-surface/50">{headers.map(h => <td key={h} className="p-1 truncate">{String(row[h] || '')}</td>)}</tr>)}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={() => setStep('options')} className="py-2 px-4 rounded-lg bg-brand-primary text-white hover:bg-blue-400">Siguiente</button>
            </div>
          </div>
        );
      case 'options':
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Opciones de Importación</h3>
                <div>
                    <h4 className="font-semibold mb-2">Manejo de Duplicados</h4>
                    <p className="text-xs text-brand-text-secondary mb-2">Si un cliente con el mismo DNI o Email ya existe:</p>
                    <div className="flex space-x-4">
                        <label><input type="radio" name="duplicates" value="skip" checked={importOptions.duplicates === 'skip'} onChange={e => setImportOptions(prev => ({...prev, duplicates: e.target.value}))} /> Saltar</label>
                        <label><input type="radio" name="duplicates" value="update" checked={importOptions.duplicates === 'update'} onChange={e => setImportOptions(prev => ({...prev, duplicates: e.target.value}))} /> Actualizar</label>
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold mb-2">Valores por Defecto</h4>
                    <p className="text-xs text-brand-text-secondary mb-2">Se aplicarán a las filas que no tengan un valor específico.</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm">Estado</label>
                            <select value={importOptions.defaultStatus} onChange={e => setImportOptions(prev => ({...prev, defaultStatus: e.target.value as ClientStatus}))} className="mt-1 block w-full bg-brand-surface rounded p-2">
                                {Object.values(ClientStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm">Tipo de Cliente</label>
                            <select value={importOptions.defaultClientType} onChange={e => setImportOptions(prev => ({...prev, defaultClientType: e.target.value as ClientType}))} className="mt-1 block w-full bg-brand-surface rounded p-2">
                                {Object.values(ClientType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                           <label className="text-sm">Grupo</label>
                           <input type="text" value={importOptions.defaultGroup} onChange={e => setImportOptions(prev => ({...prev, defaultGroup: e.target.value.toUpperCase()}))} className="mt-1 block w-full bg-brand-surface rounded p-2" />
                        </div>
                    </div>
                </div>
                 <div className="flex justify-between pt-4">
                    <button onClick={() => setStep('mapping')} className="py-2 px-4 rounded-lg bg-brand-surface hover:bg-gray-600">Atrás</button>
                    <button onClick={handleProcessAndValidate} className="py-2 px-4 rounded-lg bg-brand-primary text-white hover:bg-blue-400">Validar y Resumir</button>
                </div>
            </div>
        );
      case 'summary':
        if (!validationResult) return null;
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Resumen de la Importación</h3>
                <div className="p-4 bg-brand-surface rounded-lg space-y-2">
                    <p>Nuevos clientes a importar: <span className="font-bold text-green-400">{validationResult.newClients.length}</span></p>
                    <p>Clientes existentes a actualizar: <span className="font-bold text-yellow-400">{validationResult.updatedClients.length}</span></p>
                    <p>Filas con errores (se omitirán): <span className="font-bold text-red-400">{validationResult.errors.length}</span></p>
                </div>
                {validationResult.errors.length > 0 && (
                    <div>
                        <h4 className="font-semibold mb-2">Detalle de Errores</h4>
                        <ul className="text-xs max-h-32 overflow-y-auto bg-brand-bg-dark p-2 rounded">
                            {validationResult.errors.map(err => <li key={err.rowIndex}>Fila {err.rowIndex}: {err.message}</li>)}
                        </ul>
                    </div>
                )}
                 <div className="flex justify-between pt-4">
                    <button onClick={() => setStep('options')} className="py-2 px-4 rounded-lg bg-brand-surface hover:bg-gray-600">Atrás</button>
                    <button 
                        onClick={() => onComplete(validationResult.newClients, validationResult.updatedClients as Client[])} 
                        className="py-2 px-4 rounded-lg bg-green-600 text-white hover:bg-green-500"
                        disabled={validationResult.newClients.length === 0 && validationResult.updatedClients.length === 0}
                    >
                        Confirmar e Importar
                    </button>
                </div>
            </div>
        );
    }
  };

  return (
    <Modal title="Asistente de Importación de Clientes" onClose={onClose}>
      {renderContent()}
    </Modal>
  );
};

export default ClientImportModal;