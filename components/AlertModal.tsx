
import React from 'react';
import Modal from './Modal';

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    text: string;
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, title, text }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900 mb-4">
                    <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">{text}</p>
                <div className="flex justify-center">
                    <button onClick={onClose} className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Entendido
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AlertModal;
