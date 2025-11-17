
import React, { useState, useMemo, useEffect } from 'react';
import type { Project, Unit, Client } from '../../types';
import { Status } from '../../types';
import Modal from '../ui/Modal';
import { ChevronUpIcon, ChevronDownIcon, ListBulletIcon } from '../icons/Icons';
import NotesHistoryModal from './NotesHistoryModal';

const DetailItem = ({ label, value }: { label: string; value: string | number | undefined }) => (
    <div>
        <p className="text-xs text-brand-text-secondary leading-tight">{label}</p>
        <p className="font-semibold leading-tight">{value || '-'}</p>
    </div>
);

const CollapsibleSection = ({
  title,
  isOpen,
  onToggle,
  children
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => {
  return (
    <div className="border-t border-brand-surface pt-2">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center font-bold text-brand-primary mb-1 text-left"
      >
        <span>{title}</span>
        {isOpen ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
      </button>
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
         <div className="pt-1 pb-2">{children}</div>
      </div>
    </div>
  );
};

const STATUS_TRANSLATIONS: Record<Status, string> = {
  [Status.Available]: 'Disponible',
  [Status.Reserved]: 'Reservado',
  [Status.Sold]: 'Vendido',
};

const UnitDetailModal = ({
    unit,
    project,
    clients,
    onClose,
    onSave
}: {
    unit: Unit | null;
    project: Project;
    clients: Client[];
    onClose: () => void;
    onSave: (updatedUnit: Unit) => void;
}) => {
    const [editedUnit, setEditedUnit] = useState<Unit | null>(unit);
    const [newNoteText, setNewNoteText] = useState('');
    const [newNoteDate, setNewNoteDate] = useState(new Date().toISOString().split('T')[0]);
    const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

    const [openSections, setOpenSections] = useState({
        general: true,
        surfaces: true,
        management: true,
    });
    
    useEffect(() => {
        setEditedUnit(unit);
    }, [unit]);

    const parsedNotes = useMemo(() => {
        if (!editedUnit?.notes) return [];
        return editedUnit.notes.split('\n')
            .map(line => {
                const match = line.match(/\[(.*?)\]:\s*(.*)/s);
                if (match) return { date: match[1], text: match[2] };
                return null;
            })
            .filter((note): note is { date: string; text: string } => note !== null);
    }, [editedUnit?.notes]);

    const [currentNoteIndex, setCurrentNoteIndex] = useState(parsedNotes.length > 0 ? parsedNotes.length - 1 : 0);

    useEffect(() => {
      if (parsedNotes.length > 0) {
        setCurrentNoteIndex(prevIndex => Math.min(prevIndex, parsedNotes.length - 1));
      } else {
        setCurrentNoteIndex(0);
      }
    }, [parsedNotes]);


    if (!editedUnit) return null;
    
    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleSave = () => {
        const unitToSave = { ...editedUnit };
        if (newNoteText.trim()) {
            const newNoteEntry = `[${newNoteDate}]: ${newNoteText.trim()}`;
            unitToSave.notes = unitToSave.notes
                ? `${unitToSave.notes}\n${newNoteEntry}`
                : newNoteEntry;
        }
        onSave(unitToSave);
        onClose();
    };

    const unassignedGarages = project.garages.filter(
        (g) => !project.units.some((u) => u.garageId === g.id) || editedUnit.garageId === g.id
    );
    const unassignedStorages = project.storages.filter(
        (s) => !project.units.some((u) => u.storageId === s.id) || editedUnit.storageId === s.id
    );

    const formatArea = (area: number) =>
        area.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formatPrice = (price: number) =>
        price.toLocaleString('es-ES', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });

    const toInputDate = (dateString?: string) => (dateString ? dateString.split('T')[0] : '');
    const fromInputDate = (dateString: string) =>
        dateString ? new Date(dateString).toISOString() : undefined;

    return (
        <>
        <Modal title={`Detalles de la Vivienda: ${editedUnit.id}`} onClose={onClose}>
            <div className="text-sm">
                
                <CollapsibleSection title="Información General" isOpen={openSections.general} onToggle={() => toggleSection('general')}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1">
                        <DetailItem label="ID Vivienda" value={editedUnit.id} />
                        <DetailItem label="Edificio" value={editedUnit.building} />
                        <DetailItem label="Planta" value={editedUnit.floor} />
                        <DetailItem label="Tipo" value={editedUnit.type} />
                        <DetailItem label="Dormitorios" value={editedUnit.bedrooms} />
                        <DetailItem label="Baños" value={editedUnit.bathrooms} />
                        <DetailItem label="Orientación" value={editedUnit.orientation} />
                        <DetailItem label="Precio" value={formatPrice(editedUnit.price)} />
                    </div>
                </CollapsibleSection>
                
                <CollapsibleSection title="Superficies (m²)" isOpen={openSections.surfaces} onToggle={() => toggleSection('surfaces')}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1">
                        <DetailItem label="Útil Total" value={formatArea(editedUnit.totalUsefulArea)} />
                        <DetailItem label="Construida Total" value={formatArea(editedUnit.totalBuiltArea)} />
                        <DetailItem label="Útil Vivienda" value={formatArea(editedUnit.usefulLivingArea)} />
                        <DetailItem label="Construida Vivienda" value={formatArea(editedUnit.builtLivingArea)} />
                        <DetailItem label="Útil Terraza" value={formatArea( (editedUnit.usefulCoveredTerrace || 0) + (editedUnit.usefulUncoveredTerrace || 0))} />
                        <DetailItem label="Const. Zonas Comunes" value={formatArea(editedUnit.builtCommonArea)} />
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title="Gestión" isOpen={openSections.management} onToggle={() => toggleSection('management')}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                        <div>
                            <label className="block text-xs font-medium">Estado</label>
                            <select value={editedUnit.status} onChange={(e) => setEditedUnit({ ...editedUnit, status: e.target.value as Status })} className="mt-1 block w-full bg-brand-surface text-brand-text rounded-md p-2 text-sm">
                                {Object.values(Status).map((s) => (<option key={s} value={s}>{STATUS_TRANSLATIONS[s]}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium">Comprador</label>
                            <select value={editedUnit.buyerId || ''} onChange={(e) => setEditedUnit({ ...editedUnit, buyerId: e.target.value || undefined })} className="mt-1 block w-full bg-brand-surface text-brand-text rounded-md p-2 text-sm">
                                <option value="">-- Seleccionar Comprador --</option>
                                {clients.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                            </select>
                        </div>

                        {(editedUnit.status === Status.Reserved || editedUnit.status === Status.Sold) && (
                            <div>
                                <label className="block text-xs font-medium">Fecha de Reserva</label>
                                <input type="date" value={toInputDate(editedUnit.reservationDate)} onChange={(e) => setEditedUnit({ ...editedUnit, reservationDate: fromInputDate(e.target.value) })} className="mt-1 block w-full bg-brand-surface text-brand-text rounded-md p-2 text-sm" />
                            </div>
                        )}

                        {editedUnit.status === Status.Sold && (
                            <div>
                                <label className="block text-xs font-medium">Fecha de Venta</label>
                                <input type="date" value={toInputDate(editedUnit.saleDate)} onChange={(e) => setEditedUnit({ ...editedUnit, saleDate: fromInputDate(e.target.value) })} className="mt-1 block w-full bg-brand-surface text-brand-text rounded-md p-2 text-sm" />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-medium">Garaje Vinculado</label>
                            <select value={editedUnit.garageId || ''} onChange={(e) => setEditedUnit({ ...editedUnit, garageId: e.target.value || undefined })} className="mt-1 block w-full bg-brand-surface text-brand-text rounded-md p-2 text-sm">
                                <option value="">-- Sin asignar --</option>
                                {unassignedGarages.map((g) => (<option key={g.id} value={g.id}>{g.id} ({formatArea(g.usefulArea)}m²)</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium">Trastero Vinculado</label>
                            <select value={editedUnit.storageId || ''} onChange={(e) => setEditedUnit({ ...editedUnit, storageId: e.target.value || undefined })} className="mt-1 block w-full bg-brand-surface text-brand-text rounded-md p-2 text-sm">
                                <option value="">-- Sin asignar --</option>
                                {unassignedStorages.map((s) => (<option key={s.id} value={s.id}>{s.id} ({formatArea(s.usefulArea)}m²)</option>))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-2">
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium">Historial de Notas</label>
                            <div className="flex items-center space-x-2">
                                <span className="text-xs text-brand-text-secondary">
                                    {parsedNotes.length > 0 ? `${currentNoteIndex + 1} de ${parsedNotes.length}`: '0 de 0'}
                                </span>
                                <button onClick={() => setCurrentNoteIndex(i => Math.max(0, i - 1))} disabled={currentNoteIndex <= 0} className="p-1 rounded-full hover:bg-brand-surface disabled:opacity-50"><ChevronUpIcon className="h-4 w-4" /></button>
                                <button onClick={() => setCurrentNoteIndex(i => Math.min(parsedNotes.length - 1, i + 1))} disabled={currentNoteIndex >= parsedNotes.length - 1} className="p-1 rounded-full hover:bg-brand-surface disabled:opacity-50"><ChevronDownIcon className="h-4 w-4" /></button>
                                <button onClick={() => setIsNotesModalOpen(true)} title="Ver y buscar en historial" className="p-1 rounded-full hover:bg-brand-surface"><ListBulletIcon className="h-4 w-4" /></button>
                            </div>
                        </div>
                        <div className="h-20 bg-brand-surface p-2 rounded-md text-xs whitespace-pre-wrap overflow-y-auto scrollbar-thin scrollbar-thumb-brand-primary/50 scrollbar-track-transparent">
                            {parsedNotes.length > 0 && parsedNotes[currentNoteIndex] ? (
                                <>
                                    <p className="font-semibold text-brand-primary">[{parsedNotes[currentNoteIndex].date}]</p>
                                    <p>{parsedNotes[currentNoteIndex].text}</p>
                                </>
                            ) : (
                                 <span className="text-brand-text-secondary">No hay notas.</span>
                            )}
                        </div>
                    </div>
                    <div className="mt-2">
                        <label className="block text-sm font-medium">Añadir Nueva Nota</label>
                        <div className="flex items-start space-x-2 mt-1">
                            <textarea value={newNoteText} onChange={(e) => setNewNoteText(e.target.value)} rows={3} placeholder="Escribir nueva anotación..." className="block w-full bg-brand-surface text-brand-text rounded-md p-2 resize-none text-sm" />
                            <input type="date" value={newNoteDate} onChange={(e) => setNewNoteDate(e.target.value)} className="block bg-brand-surface text-brand-text rounded-md p-2 text-sm h-[38px]" />
                        </div>
                    </div>
                </CollapsibleSection>

                <div className="flex justify-end space-x-2 pt-2 border-t border-brand-surface mt-2">
                    <button onClick={onClose} className="py-2 px-4 rounded-lg bg-brand-surface hover:bg-gray-600 transition-colors">Cancelar</button>
                    <button onClick={handleSave} className="py-2 px-4 rounded-lg bg-brand-primary text-white hover:bg-blue-400 transition-colors">Guardar Cambios</button>
                </div>
            </div>
        </Modal>

        {isNotesModalOpen && (
            <NotesHistoryModal 
                notes={parsedNotes}
                unitId={editedUnit.id}
                onClose={() => setIsNotesModalOpen(false)}
                onSelectNote={(index) => setCurrentNoteIndex(index)}
            />
        )}
        </>
    );
};

export default UnitDetailModal;
