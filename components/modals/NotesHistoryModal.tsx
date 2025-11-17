
import React, { useState, useMemo } from 'react';
import Modal from '../ui/Modal';
import { MagnifyingGlassIcon } from '../icons/Icons';

interface Note {
  date: string;
  text: string;
}

interface NotesHistoryModalProps {
  notes: Note[];
  onClose: () => void;
  onSelectNote: (index: number) => void;
  unitId: string;
}

const NotesHistoryModal: React.FC<NotesHistoryModalProps> = ({ notes, onClose, onSelectNote, unitId }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes;

    const lowerCaseQuery = searchQuery.toLowerCase();
    
    // Check for date format dd/mm/yyyy
    const dateMatch = searchQuery.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dateMatch) {
        const [, dd, mm, yyyy] = dateMatch;
        const searchDate = `${yyyy}-${mm}-${dd}`;
        return notes.filter(note => note.date === searchDate);
    }

    return notes.filter(note => 
        note.text.toLowerCase().includes(lowerCaseQuery) ||
        note.date.toLowerCase().includes(lowerCaseQuery)
    );
  }, [notes, searchQuery]);

  return (
    <Modal title={`Historial de Notas - Vivienda ${unitId}`} onClose={onClose}>
        <div className="flex flex-col space-y-3">
            <div className="relative">
                <input
                    type="text"
                    placeholder="Buscar por texto o fecha (dd/mm/yyyy)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-brand-surface text-brand-text rounded-md p-2 pl-10 text-sm"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-text-secondary" />
            </div>
            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-2">
                {filteredNotes.length > 0 ? (
                    filteredNotes.slice().reverse().map((note, index) => {
                        const originalIndex = notes.findIndex(n => n.date === note.date && n.text === note.text);
                        return (
                            <div 
                                key={index} 
                                onClick={() => {
                                    onSelectNote(originalIndex);
                                    onClose();
                                }}
                                className="bg-brand-surface p-2 rounded-md cursor-pointer hover:bg-brand-primary/20"
                            >
                                <p className="font-semibold text-brand-primary text-xs">[{note.date}]</p>
                                <p className="text-sm whitespace-pre-wrap">{note.text}</p>
                            </div>
                        )
                    })
                ) : (
                    <p className="text-center text-brand-text-secondary p-4">No se encontraron notas.</p>
                )}
            </div>
        </div>
    </Modal>
  );
};

export default NotesHistoryModal;