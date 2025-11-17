
import React from 'react';
import { XMarkIcon } from '../icons/Icons';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-brand-bg-light rounded-lg shadow-xl w-full max-w-3xl max-h-[95vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-brand-surface">
          <h2 className="text-xl font-semibold text-brand-text">{title}</h2>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text">
            <XMarkIcon />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;