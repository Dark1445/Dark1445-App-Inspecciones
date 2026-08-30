import React, { useState, useEffect } from 'react';
import type { Course } from '../types';
import Modal from './Modal';

interface CourseFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (course: Course) => void;
    editingCourse: Course | null;
}

const CourseFormModal: React.FC<CourseFormModalProps> = ({ isOpen, onClose, onSave, editingCourse }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName(editingCourse?.name || '');
            setDescription(editingCourse?.description || '');
        }
    }, [isOpen, editingCourse]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: editingCourse?.id || '',
            name,
            description,
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
                    {editingCourse ? 'Editar Curso' : 'Nuevo Curso'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="course-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Curso</label>
                        <input
                            type="text"
                            id="course-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="course-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción (Opcional)</label>
                        <textarea
                            id="course-description"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
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

export default CourseFormModal;