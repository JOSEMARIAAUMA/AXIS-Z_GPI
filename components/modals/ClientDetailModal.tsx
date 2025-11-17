import React, { useState, useEffect } from 'react';
import type { Client } from '../../types';
import { ClientStatus, ClientType } from '../../types';
import Modal from '../ui/Modal';
import { ChevronUpIcon, ChevronDownIcon } from '../icons/Icons';

const CollapsibleSection = ({ title, isOpen, onToggle, children }: { title: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode; }) => {
    return (
        <div className="border-t border-brand-surface pt-3 mt-3">
            <button onClick={onToggle} className="w-full flex justify-between items-center font-bold text-brand-primary mb-2 text-left">
                <span>{title}</span>
                {isOpen ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
            </button>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="pt-1 pb-2">{children}</div>
            </div>
        </div>
    );
};

const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
        <label className="block text-xs font-medium text-brand-text-secondary">{label}</label>
        {children}
    </div>
);

const toInputDate = (dateString?: string) => (dateString ? dateString.split('T')[0] : '');
const fromInputDate = (dateString: string) => dateString ? new Date(dateString).toISOString() : undefined;

const ClientDetailModal = ({ client, onClose, onSave }: { client: Client | null; onClose: () => void; onSave: (updatedClient: Client) => void; }) => {
    const [editedClient, setEditedClient] = useState<Client | null>(client);
    const [openSections, setOpenSections] = useState({
        personal: true,
        contact: true,
        crm: true,
    });

    useEffect(() => {
        setEditedClient(client);
    }, [client]);

    if (!editedClient) return null;

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditedClient(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditedClient(prev => prev ? { ...prev, [name]: fromInputDate(value) } : null);
    };

    const handleSave = () => {
        if (editedClient) {
            onSave(editedClient);
        }
    };

    return (
        <Modal title={`Detalles del Cliente: ${editedClient.name} ${editedClient.lastName || ''}`} onClose={onClose}>
            <div className="text-sm space-y-4">
                <CollapsibleSection title="Datos Personales" isOpen={openSections.personal} onToggle={() => toggleSection('personal')}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField label="Nombre"><input type="text" name="name" value={editedClient.name} onChange={handleChange} className="mt-1 block w-full bg-brand-surface text-brand-text rounded p-2" /></FormField>
                        <FormField label="Apellidos"><input type="text" name="lastName" value={editedClient.lastName || ''} onChange={handleChange} className="mt-1 block w-full bg-brand-surface text-brand-text rounded p-2" /></FormField>
                        <FormField label="DNI"><input type="text" name="dni" value={editedClient.dni || ''} onChange={handleChange} className="mt-1 block w-full bg-brand-surface text-brand-text rounded p-2" /></FormField>
                        <FormField label="Fecha de Nacimiento"><input type="date" name="birthDate" value={toInputDate(editedClient.birthDate)} onChange={handleDateChange} className="mt-1 block w-full bg-brand-surface text-brand-text rounded p-2" /></FormField>
                        <FormField label="Género"><select name="gender" value={editedClient.gender || ''} onChange={handleChange} className="mt-1 block w-full bg-brand-surface text-brand-text rounded p-2"><option value="">-</option><option value="M">Masculino</option><option value="F">Femenino</option></select></FormField>
                        <FormField label="Estado Civil"><input type="text" name="civilStatus" value={editedClient.civilStatus || ''} onChange={handleChange} className="mt-1 block w-full bg-brand-surface text-brand-text rounded p-2" /></FormField>
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title="Datos de Contacto" isOpen={openSections.contact} onToggle={() => toggleSection('contact')}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField label="Teléfono 1"><input type="tel" name="phone" value={editedClient.phone} onChange={handleChange} className="mt-1 block w-full bg-brand-surface text-brand-text rounded p-2" /></FormField>
                        <FormField label="Teléfono 2"><input type="tel" name="phone2" value={editedClient.phone2 || ''} onChange={handleChange} className="mt-1 block w-full bg-brand-surface text-brand-text rounded p-2" /></FormField>
                        <FormField label="Email"><input type="email" name="email" value={editedClient.email} onChange={handleChange} className="mt-1 block w-full bg-brand-surface text-brand-text rounded p-2" /></FormField>
                        <FormField label="Dirección"><input type="text" name="address" value={editedClient.address || ''} onChange={handleChange} className="mt-1 block w-full bg-brand-surface text-brand-text rounded p-2" /></FormField>
                        <FormField label="Código Postal"><input type="text" name="postalCode" value={editedClient.postalCode || ''} onChange={handleChange} className="mt-1 block w-full bg-brand-surface text-brand-text rounded p-2" /></FormField>
                        <FormField label="Localidad"><input type="text" name="city" value={editedClient.city || ''} onChange={handleChange} className="mt-1 block w-full bg-brand-surface text-brand-text rounded p-2" /></FormField>
                        <FormField label="Provincia"><input type="text" name="province" value={editedClient.province || ''} onChange={handleChange} className="mt-1 block w-full bg-brand-surface text-brand-text rounded p-2" /></FormField>
                        <FormField label="País"><input type="text" name="country" value={editedClient.country || ''} onChange={handleChange} className="mt-1 block w-full bg-brand-surface text-brand-text rounded p-2" /></FormField>
                    </div>
                </CollapsibleSection>
                
                <CollapsibleSection title="Datos CRM" isOpen={openSections.crm} onToggle={() => toggleSection('crm')}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField label="Estado">
                            <select name="status" value={editedClient.status} onChange={handleChange} className="mt-1 block w-full bg-brand-surface text-brand-text rounded p-2">
                                {Object.values(ClientStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Tipo Cliente">
                            <select name="clientType" value={editedClient.clientType} onChange={handleChange} className="mt-1 block w-full bg-brand-surface text-brand-text rounded p-2">
                                {Object.values(ClientType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Grupo"><input type="text" name="group" value={editedClient.group || ''} onChange={handleChange} className="mt-1 block w-full bg-brand-surface text-brand-text rounded p-2" /></FormField>
                        <FormField label="Fecha Registro"><input type="date" name="registrationDate" value={toInputDate(editedClient.registrationDate)} onChange={handleDateChange} className="mt-1 block w-full bg-brand-surface text-brand-text rounded p-2" disabled /></FormField>
                    </div>
                     <div className="mt-4">
                        <FormField label="Notas">
                            <textarea name="notes" value={editedClient.notes || ''} onChange={handleChange} rows={4} className="mt-1 block w-full bg-brand-surface text-brand-text rounded p-2" />
                        </FormField>
                    </div>
                </CollapsibleSection>

                <div className="flex justify-end space-x-2 pt-4 border-t border-brand-surface">
                    <button onClick={onClose} className="py-2 px-4 rounded-lg bg-brand-surface hover:bg-gray-600">Cancelar</button>
                    <button onClick={handleSave} className="py-2 px-4 rounded-lg bg-brand-primary text-white hover:bg-blue-400">Guardar Cambios</button>
                </div>
            </div>
        </Modal>
    );
};

export default ClientDetailModal;
