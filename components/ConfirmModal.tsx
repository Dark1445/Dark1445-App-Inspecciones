
import React from 'react';
import Modal from './Modal';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    text: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, text }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md text-center">
                <h3 className="text-lg font-bold mb-4">{title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">{text}</p>
                <div className="flex justify-center space-x-4">
                    <button onClick={onClose} className="bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-6 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} className="bg-red-600 text-white py-2 px-6 rounded-lg hover:bg-red-700 transition">
                        Confirmar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmModal;
