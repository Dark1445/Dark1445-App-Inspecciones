
import React, { useState, useEffect } from 'react';
import type { User, Role, Course } from '../types';
import { PlusIcon, PencilIcon, TrashIcon } from '../components/icons';
import { View } from '../App';

interface SettingsViewProps {
    users: User[];
    handleOpenUserForm: (user: User | null) => void;
    handleDeleteUser: (userId: string) => void;
    userRole: Role | null;
    presentationEligibleViews: { view: View, label: string }[];
    guestPermissions: Set<View>;
    onGuestPermissionsChange: (newPermissions: Set<View>) => void;
    guestEligibleViews: { view: View, label: string }[];
    courses: Course[];
    handleOpenCourseForm: (course: Course | null) => void;
    handleDeleteCourse: (courseId: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
    users, 
    handleOpenUserForm, 
    handleDeleteUser, 
    userRole, 
    presentationEligibleViews, 
    guestPermissions, 
    onGuestPermissionsChange, 
    guestEligibleViews,
    courses,
    handleOpenCourseForm,
    handleDeleteCourse
}) => {
    const [presentationInterval, setPresentationInterval] = useState('10');
    const [selectedViews, setSelectedViews] = useState<View[]>([]);

    useEffect(() => {
        const savedInterval = localStorage.getItem('presentationInterval');
        if (savedInterval) {
            setPresentationInterval(savedInterval);
        }

        const savedViewsJSON = localStorage.getItem('presentationViews');
        if (savedViewsJSON) {
            try {
                const parsedViews = JSON.parse(savedViewsJSON);
                if (Array.isArray(parsedViews)) {
                    setSelectedViews(parsedViews);
                }
            } catch (e) {
                // If parsing fails, use default of all eligible views
                setSelectedViews(presentationEligibleViews.map(v => v.view));
            }
        } else {
            // Default selection if nothing is saved
            setSelectedViews(presentationEligibleViews.map(v => v.view));
        }

    }, [presentationEligibleViews]);

    const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPresentationInterval(value);
        localStorage.setItem('presentationInterval', value);
    };

    const handleViewSelectionChange = (view: View) => {
        const newSelectedViews = selectedViews.includes(view)
            ? selectedViews.filter(v => v !== view)
            : [...selectedViews, view];
            
        setSelectedViews(newSelectedViews);
        localStorage.setItem('presentationViews', JSON.stringify(newSelectedViews));
    };
    
    const handleGuestPermissionToggle = (view: View) => {
        const newPermissions = new Set(guestPermissions);
        if (newPermissions.has(view)) {
            newPermissions.delete(view);
        } else {
            newPermissions.add(view);
        }
        onGuestPermissionsChange(newPermissions);
    };

    return (
        <div className="relative p-6 md:p-8 h-full overflow-y-auto custom-scrollbar">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Configuración</h1>
            </header>
            
            {/* Presentation Mode Section */}
            <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200 border-b pb-3 dark:border-gray-700">Modo Presentación</h2>
                <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                        <p className="text-gray-600 dark:text-gray-300">Intervalo de cambio de vista (en segundos).</p>
                        <input
                            type="number"
                            min="10"
                            value={presentationInterval}
                            onChange={handleIntervalChange}
                            className="w-24 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold mb-2 text-gray-600 dark:text-gray-300">Vistas a Incluir</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {presentationEligibleViews.map(item => (
                                <label key={item.view} className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={selectedViews.includes(item.view)}
                                        onChange={() => handleViewSelectionChange(item.view)}
                                        className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 dark:checked:bg-blue-600"
                                    />
                                    <span className="text-gray-700 dark:text-gray-200">{item.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
            
            {userRole === 'Admin' && (
                <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200 border-b pb-3 dark:border-gray-700">Permisos de Invitado</h2>
                    <div className="pt-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Selecciona las vistas que los usuarios con el rol 'Invitado' pueden ver.</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {guestEligibleViews.map(item => (
                                <label key={item.view} className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={guestPermissions.has(item.view)}
                                        onChange={() => handleGuestPermissionToggle(item.view)}
                                        className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 dark:checked:bg-blue-600"
                                    />
                                    <span className="text-gray-700 dark:text-gray-200">{item.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </section>
            )}
            
            {/* Courses Management Section */}
            <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
                <header className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4 border-b pb-3 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Gestión de Cursos / Certificaciones / Carnet</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Administra los cursos habilitados para la asignación y vencimientos del personal.</p>
                    </div>
                    <button 
                        onClick={() => handleOpenCourseForm(null)} 
                        className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center gap-2 text-sm font-semibold shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                        disabled={userRole !== 'Admin'}
                    >
                        <PlusIcon /> <span>Nuevo Curso</span>
                    </button>
                </header>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre del Curso</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Descripción</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {courses.map(course => (
                                <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{course.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-550 dark:text-gray-350 whitespace-normal max-w-md">{course.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenCourseForm(course)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" title="Editar" disabled={userRole !== 'Admin'}><PencilIcon /></button>
                                        <button onClick={() => handleDeleteCourse(course.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" title="Eliminar" disabled={userRole !== 'Admin'}><TrashIcon /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {courses.length === 0 && <div className="text-center text-gray-500 dark:text-gray-400 p-8">No hay cursos para mostrar.</div>}
            </section>
            
            {/* User Management Section */}
            <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                 <header className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Gestión de Usuarios</h2>
                    <button 
                        onClick={() => handleOpenUserForm(null)} 
                        className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center gap-2 text-sm font-semibold shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={userRole !== 'Admin'}
                    >
                        <PlusIcon /> <span>Nuevo Usuario</span>
                    </button>
                </header>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre de Usuario</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rol</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{user.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'Admin' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenUserForm(user)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4 disabled:opacity-50 disabled:cursor-not-allowed" title="Editar" disabled={userRole !== 'Admin'}><PencilIcon /></button>
                                        <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed" title="Eliminar" disabled={userRole !== 'Admin' || user.role === 'Admin'}><TrashIcon /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {users.length === 0 && <div className="text-center text-gray-500 dark:text-gray-400 p-8">No hay usuarios para mostrar.</div>}
            </section>
            
            <div className="absolute bottom-4 right-4 text-right text-xs text-gray-400 dark:text-gray-500">
                <p>Creador: Damian Fernandez</p>
                <p>Mail: ndf033@gmail.com</p>
            </div>
        </div>
    );
};

export default SettingsView;
