
import React, { useState, useEffect, useMemo } from 'react';
import type { Personnel, Course, PersonnelCourse, PersonnelEvent, PersonnelEventType } from '../types';
import { PERSONNEL_SECTORS } from '../definitions';
import { calculateAge } from '../utils/dateUtils';
import { TrashIcon, PlusIcon } from './icons';
import Modal from './Modal';

interface PersonnelFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (personnel: Personnel) => void;
    onDelete: (personnelId: string) => void;
    editingPersonnel: Personnel | null;
    coursesList: Course[];
}

const PersonnelFormModal: React.FC<PersonnelFormModalProps> = ({ isOpen, onClose, onSave, onDelete, editingPersonnel, coursesList }) => {
    const [formData, setFormData] = useState<Omit<Personnel, 'id'>>({
        firstName: '', lastName: '', dob: '', sector: 'Mantenimiento', courses: [], diagramStartDate: '', diagramType: null, events: []
    });
    const [newCourse, setNewCourse] = useState<{ courseId: string; issueDate: string; expiryDate: string }>({
        courseId: '', issueDate: '', expiryDate: ''
    });
    const [newEvent, setNewEvent] = useState<{ type: Exclude<PersonnelEventType, 'Franco'>; startDate: string; endDate: string }>({
        type: 'Vacaciones', startDate: '', endDate: ''
    });


    useEffect(() => {
        if (isOpen) {
            if (editingPersonnel) {
                setFormData({ ...editingPersonnel });
            } else {
                setFormData({ firstName: '', lastName: '', dob: '', sector: 'Mantenimiento', courses: [], diagramStartDate: '', diagramType: null, events: [] });
            }
            setNewCourse({ courseId: '', issueDate: '', expiryDate: '' });
            setNewEvent({ type: 'Vacaciones', startDate: '', endDate: '' });
        }
    }, [isOpen, editingPersonnel]);

    const age = useMemo(() => calculateAge(formData.dob), [formData.dob]);
    const getCourseName = (id: string) => coursesList.find(c => c.id === id)?.name || 'Desconocido';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            // If sector is changed to something other than Jerarquico, clear diagram type
            if (name === 'sector' && value !== 'Jerarquico') {
                newState.diagramType = null;
            }
             // If sector is changed to Jerarquico, set a default diagram type
            if (name === 'sector' && value === 'Jerarquico') {
                newState.diagramType = prev.diagramType || '10x5';
            }
            return newState;
        });
    };

    const handleCourseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewCourse(prev => ({ ...prev, [name]: value }));
    };
    
    const handleNewEventChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewEvent(prev => ({ ...prev, [name]: value }));
    };

    const handleAddCourse = () => {
        if (newCourse.courseId && newCourse.issueDate && newCourse.expiryDate && !formData.courses.some(c => c.courseId === newCourse.courseId)) {
            setFormData(prev => ({ ...prev, courses: [...prev.courses, { ...newCourse }] }));
            setNewCourse({ courseId: '', issueDate: '', expiryDate: '' });
        }
    };
    
    const handleAddEvent = () => {
        if (newEvent.startDate && newEvent.endDate && newEvent.startDate <= newEvent.endDate) {
            setFormData(prev => ({
                ...prev,
                events: [...prev.events, { ...newEvent, id: new Date().toISOString() }]
            }));
            setNewEvent({ type: 'Vacaciones', startDate: '', endDate: '' });
        } else {
            alert("La fecha de inicio debe ser anterior o igual a la fecha de fin.");
        }
    };

    const handleRemoveCourse = (courseIdToRemove: string) => {
        setFormData(prev => ({ ...prev, courses: prev.courses.filter(c => c.courseId !== courseIdToRemove) }));
    };

    const handleRemoveEvent = (eventId: string) => {
        setFormData(prev => ({
            ...prev,
            events: prev.events.filter(event => event.id !== eventId)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: editingPersonnel?.id || '', ...formData });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
                    {editingPersonnel ? 'Editar Personal' : 'Nuevo Personal'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Nombre" required className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" />
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Apellido" required className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de Nacimiento</label>
                            <input type="date" name="dob" value={formData.dob} onChange={handleChange} required className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" />
                        </div>
                        <div className="flex items-end">
                            <p className="text-gray-700 dark:text-gray-300">Edad: <span className="font-bold">{age !== null ? `${age} años` : 'N/A'}</span></p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Sector</label>
                            <select name="sector" value={formData.sector} onChange={handleChange} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                                {PERSONNEL_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Inicio de Diagrama</label>
                            <input type="date" name="diagramStartDate" value={formData.diagramStartDate || ''} onChange={handleChange} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" />
                        </div>
                        {formData.sector === 'Jerarquico' && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Tipo de Diagrama (Solo Jerarquico)</label>
                                <select name="diagramType" value={formData.diagramType || '10x5'} onChange={handleChange} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                                    <option value="10x5">10x5 (10 días de trabajo x 5 de franco)</option>
                                    <option value="8x4">8x4 (8 días de trabajo x 4 de franco)</option>
                                    <option value="5x2">5x2 (5 días de trabajo x 2 de franco)</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Courses Section */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h3 className="text-lg font-semibold mb-4">Cursos y Certificaciones</h3>
                        <div className="space-y-2 mb-4">
                            {formData.courses.map(pc => (
                                <div key={pc.courseId} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                                    <p className="font-medium">{getCourseName(pc.courseId)}</p>
                                    <div className="text-sm text-gray-600 dark:text-gray-300">
                                        <span>Realizado: {pc.issueDate}</span> | <span>Vence: {pc.expiryDate}</span>
                                    </div>
                                    <button type="button" onClick={() => handleRemoveCourse(pc.courseId)} className="text-red-500 hover:text-red-700"><TrashIcon /></button>
                                </div>
                            ))}
                            {formData.courses.length === 0 && <p className="text-sm text-gray-500">No hay cursos asignados.</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border border-dashed rounded-md">
                             <select name="courseId" value={newCourse.courseId} onChange={handleCourseChange} className="md:col-span-2 w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm">
                                <option value="">-- Seleccionar Curso --</option>
                                {coursesList.filter(c => !formData.courses.some(pc => pc.courseId === c.id)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                             <input type="date" title="Fecha de realización" name="issueDate" value={newCourse.issueDate} onChange={handleCourseChange} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm" />
                             <input type="date" title="Fecha de vencimiento" name="expiryDate" value={newCourse.expiryDate} onChange={handleCourseChange} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm" />
                            <button type="button" onClick={handleAddCourse} className="md:col-span-4 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 py-2 rounded-md flex items-center justify-center gap-2 hover:bg-blue-200 transition text-sm">
                                <PlusIcon /> Asignar Curso
                            </button>
                        </div>
                    </div>
                    
                    {/* Events Section */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h3 className="text-lg font-semibold mb-4">Eventos Especiales (Vacaciones, Licencias, etc.)</h3>
                        <div className="space-y-2 mb-4">
                            {formData.events.map(event => (
                                <div key={event.id} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                                    <p className="font-medium">{event.type}</p>
                                    <div className="text-sm text-gray-600 dark:text-gray-300">
                                        <span>{event.startDate}</span> al <span>{event.endDate}</span>
                                    </div>
                                    <button type="button" onClick={() => handleRemoveEvent(event.id)} className="text-red-500 hover:text-red-700"><TrashIcon /></button>
                                </div>
                            ))}
                            {formData.events.length === 0 && <p className="text-sm text-gray-500">No hay eventos especiales asignados.</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border border-dashed rounded-md items-center">
                            <select name="type" value={newEvent.type} onChange={handleNewEventChange} className="md:col-span-1 w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm">
                                <option value="Vacaciones">Vacaciones</option>
                                <option value="Compensatorio">Compensatorio</option>
                                <option value="Enfermedad">Enfermedad</option>
                                <option value="Operación">Operación</option>
                            </select>
                            <input type="date" title="Fecha de Inicio" name="startDate" value={newEvent.startDate} onChange={handleNewEventChange} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm" />
                            <input type="date" title="Fecha de Fin" name="endDate" value={newEvent.endDate} onChange={handleNewEventChange} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm" />
                            <button type="button" onClick={handleAddEvent} className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 py-2 rounded-md flex items-center justify-center gap-2 hover:bg-blue-200 transition text-sm">
                                <PlusIcon /> Asignar Evento
                            </button>
                        </div>
                    </div>


                    <div className="flex justify-between items-center pt-4">
                        <div>
                            {editingPersonnel && (
                                <button type="button" onClick={() => onDelete(editingPersonnel.id)} className="bg-red-600 text-white py-2 px-6 rounded-lg hover:bg-red-700 transition">Eliminar</button>
                            )}
                        </div>
                        <div className="flex space-x-4">
                            <button type="button" onClick={onClose} className="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 transition">Cancelar</button>
                            <button type="submit" className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition">Guardar</button>
                        </div>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default PersonnelFormModal;
