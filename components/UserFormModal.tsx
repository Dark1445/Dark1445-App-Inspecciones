
import React, { useState, useEffect } from 'react';
import type { User, Role } from '../types';
import Modal from './Modal';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: User) => void;
    editingUser: User | null;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSave, editingUser }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'Invitado' as Role,
    });
    
    useEffect(() => {
        if (isOpen) {
            setFormData({
                username: editingUser?.username || '',
                password: '', // Always clear password for security
                role: editingUser?.role || 'Invitado',
            });
        }
    }, [isOpen, editingUser]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // For editing, if password is not changed, keep the old one.
        // This simple implementation requires re-entering password.
        if (!formData.password && !editingUser) {
            alert("La contraseña es requerida para nuevos usuarios.");
            return;
        }

        const userToSave: User = {
            id: editingUser?.id || '',
            username: formData.username,
            // In a real app, you wouldn't handle passwords this way.
            // You'd send it to a backend to be hashed.
            password: formData.password || (editingUser?.password || ''),
            role: formData.role,
        };

        if (!userToSave.password) {
             alert("La contraseña no puede estar vacía.");
             return;
        }
        
        onSave(userToSave);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
                    {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre de Usuario</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder={editingUser ? "Dejar en blanco para no cambiar" : ""}
                            className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                        />
                    </div>
                     <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol</label>
                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                        >
                            <option value="Admin">Admin</option>
                            <option value="Invitado">Invitado</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 transition">Cancelar</button>
                        <button type="submit" className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition">Guardar</button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default UserFormModal;