
import React, { useState, useEffect } from 'react';
import type { Tool } from '../types';
import Modal from './Modal';

interface NotificationFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (toolId: string, days: number, emails: string[]) => void;
    tool: Tool | null;
}

const NotificationFormModal: React.FC<NotificationFormModalProps> = ({ isOpen, onClose, onSave, tool }) => {
    const [days, setDays] = useState<string>('');
    const [emails, setEmails] = useState<string>('');

    useEffect(() => {
        if (tool) {
            setDays(tool.notificationDays?.toString() || '');
            setEmails((tool.notificationEmails || []).join(', '));
        }
    }, [tool]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (tool) {
            const emailArray = emails.split(',').map(email => email.trim()).filter(Boolean);
            onSave(tool.id, parseInt(days, 10), emailArray);
        }
    };

    if (!tool) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">Configurar Alerta</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{`${tool.herramienta} (${tool.serial})`}</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="notification-days" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Avisar con (días de antelación)</label>
                        <input type="number" id="notification-days" min="1" value={days} onChange={(e) => setDays(e.target.value)} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div>
                        <label htmlFor="notification-emails" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correos (separados por coma)</label>
                        <textarea id="notification-emails" rows={3} value={emails} onChange={(e) => setEmails(e.target.value)} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="ejemplo1@mail.com, ejemplo2@mail.com"></textarea>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        <i className="fas fa-info-circle mr-1"></i>
                        Esta configuración se guarda para ser usada por un servicio de backend para el envío real de correos.
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 transition">Cancelar</button>
                        <button type="submit" className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition">Guardar</button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default NotificationFormModal;
