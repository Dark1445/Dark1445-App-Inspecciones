import React, { useState, useEffect } from 'react';
import type { Vehicle, VehicleType, VehicleNovedad } from '../types';
import Modal from './Modal';
import { getVehicleNovedades, createVehicleNovedad, updateVehicleNovedad } from '../services/airtableApiService';
import { PlusIcon, CheckCircleIcon, ClockIcon } from './icons';

interface VehicleFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (vehicle: Partial<Vehicle>) => void;
    editingVehicle: Vehicle | null;
    onNovedadChange?: () => void;
}

const VehicleFormModal: React.FC<VehicleFormModalProps> = ({ isOpen, onClose, onSave, editingVehicle, onNovedadChange }) => {
    const [formData, setFormData] = useState<{
        numeroUnidad: string;
        patente: string;
        tipo: VehicleType;
        ultimoServiceFecha: string;
        ultimoServiceKm: number | null;
        vtvVencimiento: string;
        vencimientoHidrogrua: string;
        ruedaAuxilio: boolean;
    }>({
        numeroUnidad: '',
        patente: '',
        tipo: 'Pick up',
        ultimoServiceFecha: '',
        ultimoServiceKm: null,
        vtvVencimiento: '',
        vencimientoHidrogrua: '',
        ruedaAuxilio: false,
    });

    const [novedades, setNovedades] = useState<VehicleNovedad[]>([]);
    const [isLoadingNovedades, setIsLoadingNovedades] = useState(false);
    const [newNovedad, setNewNovedad] = useState('');
    const [showClosedNovedades, setShowClosedNovedades] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (editingVehicle) {
                setFormData({
                    numeroUnidad: editingVehicle.numeroUnidad,
                    patente: editingVehicle.patente,
                    tipo: editingVehicle.tipo,
                    ultimoServiceFecha: editingVehicle.ultimoServiceFecha,
                    ultimoServiceKm: editingVehicle.ultimoServiceKm ?? null,
                    vtvVencimiento: editingVehicle.vtvVencimiento,
                    vencimientoHidrogrua: editingVehicle.vencimientoHidrogrua || '',
                    ruedaAuxilio: editingVehicle.ruedaAuxilio || false,
                });
                fetchNovedades(editingVehicle.id);
            } else {
                setFormData({
                    numeroUnidad: '',
                    patente: '',
                    tipo: 'Pick up',
                    ultimoServiceFecha: '',
                    ultimoServiceKm: null,
                    vtvVencimiento: '',
                    vencimientoHidrogrua: '',
                    ruedaAuxilio: false,
                });
                setNovedades([]);
            }
        }
    }, [isOpen, editingVehicle]);

    const fetchNovedades = async (vehicleId: string) => {
        setIsLoadingNovedades(true);
        try {
            const data = await getVehicleNovedades(vehicleId);
            // Sort by date descending
            setNovedades(data.sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion)));
        } catch (error) {
            console.error("Error fetching novedades:", error);
        } finally {
            setIsLoadingNovedades(false);
        }
    };

    const handleAddNovedad = async () => {
        if (!newNovedad.trim() || !editingVehicle) return;
        
        const today = new Date().toISOString().split('T')[0];
        try {
            await createVehicleNovedad({
                vehicleId: editingVehicle.id,
                descripcion: newNovedad,
                fechaCreacion: today,
                estado: 'Pendiente'
            });
            setNewNovedad('');
            await fetchNovedades(editingVehicle.id);
            if (onNovedadChange) onNovedadChange();
        } catch (error) {
            console.error("Error adding novedad:", error);
        }
    };

    const handleCloseNovedad = async (novedad: VehicleNovedad) => {
        if (!editingVehicle) return;
        const today = new Date().toISOString().split('T')[0];
        try {
            await updateVehicleNovedad(novedad.id, {
                estado: 'Cerrado',
                fechaCierre: today
            });
            await fetchNovedades(editingVehicle.id);
            if (onNovedadChange) onNovedadChange();
        } catch (error) {
            console.error("Error closing novedad:", error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({
                ...prev,
                [name]: checked,
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: name === 'ultimoServiceKm'
                    ? (value === '' ? null : parseInt(value, 10))
                    : value,
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: editingVehicle?.id, ...formData });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
                    {editingVehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="numeroUnidad" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">N° de Unidad</label>
                            <input type="text" id="numeroUnidad" name="numeroUnidad" value={formData.numeroUnidad} onChange={handleChange} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" required />
                        </div>
                        <div>
                            <label htmlFor="patente" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Patente</label>
                            <input type="text" id="patente" name="patente" value={formData.patente} onChange={handleChange} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" required />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Vehículo</label>
                        <select id="tipo" name="tipo" value={formData.tipo} onChange={handleChange} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" required>
                            <option value="Pick up">Pick up</option>
                            <option value="Camion">Camion</option>
                            <option value="Van">Van</option>
                        </select>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="vtvVencimiento" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vencimiento VTV</label>
                            <input type="date" id="vtvVencimiento" name="vtvVencimiento" value={formData.vtvVencimiento} onChange={handleChange} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" />
                        </div>
                        {formData.tipo === 'Camion' && (
                             <div>
                                <label htmlFor="vencimientoHidrogrua" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vencimiento Hidrogrúa</label>
                                <input type="date" id="vencimientoHidrogrua" name="vencimientoHidrogrua" value={formData.vencimientoHidrogrua} onChange={handleChange} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" />
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <input 
                            type="checkbox" 
                            id="ruedaAuxilio" 
                            name="ruedaAuxilio" 
                            checked={formData.ruedaAuxilio} 
                            onChange={handleChange} 
                            className="w-5 h-5 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2"
                        />
                        <label htmlFor="ruedaAuxilio" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                            Cuenta con rueda de auxilio
                        </label>
                    </div>
                     <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Último Service (Opcional)</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="ultimoServiceFecha" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
                                <input type="date" id="ultimoServiceFecha" name="ultimoServiceFecha" value={formData.ultimoServiceFecha} onChange={handleChange} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" />
                            </div>
                             <div>
                                <label htmlFor="ultimoServiceKm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kilometraje</label>
                                <input type="number" id="ultimoServiceKm" name="ultimoServiceKm" value={formData.ultimoServiceKm ?? ''} onChange={handleChange} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" />
                            </div>
                        </div>
                    </div>

                    {editingVehicle && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Hoja de Vida / Novedades</h3>
                                <button 
                                    type="button" 
                                    onClick={() => setShowClosedNovedades(!showClosedNovedades)}
                                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                                >
                                    <ClockIcon className="w-4 h-4" />
                                    {showClosedNovedades ? 'Ocultar Historial' : 'Ver Historial'}
                                </button>
                            </div>
                            
                            <div className="space-y-4 mb-4">
                                <div className="flex space-x-2">
                                    <input 
                                        type="text" 
                                        placeholder="Agregar nueva novedad..." 
                                        value={newNovedad}
                                        onChange={(e) => setNewNovedad(e.target.value)}
                                        className="flex-1 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleAddNovedad}
                                        className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition flex items-center"
                                    >
                                        <PlusIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                                    {isLoadingNovedades ? (
                                        <div className="text-center py-4">Cargando novedades...</div>
                                    ) : (() => {
                                        const pendingNovedades = novedades.filter(n => n.estado === 'Pendiente');
                                        
                                        return (
                                            <>
                                                {pendingNovedades.length === 0 ? (
                                                    <div className="text-center py-4 text-gray-500 italic">No hay novedades pendientes.</div>
                                                ) : (
                                                    pendingNovedades.map((n) => (
                                                        <div key={n.id} className="p-3 rounded-lg border bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <p className="text-sm text-gray-800 dark:text-gray-200">{n.descripcion}</p>
                                                                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                                        <span className="flex items-center">
                                                                            <ClockIcon className="w-3 h-3 mr-1" />
                                                                            Creada: {n.fechaCreacion}
                                                                        </span>
                                                                        <span className="px-2 py-0.5 rounded-full bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200">
                                                                            {n.estado}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => handleCloseNovedad(n)}
                                                                    className="text-green-600 hover:text-green-700 p-1"
                                                                    title="Cerrar novedad"
                                                                >
                                                                    <CheckCircleIcon className="w-6 h-6" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                                
                                                {showClosedNovedades && (
                                                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                        <h4 className="text-md font-semibold text-gray-600 dark:text-gray-400 mb-3">Historial (Cerradas)</h4>
                                                        {(() => {
                                                            const closedNovedades = novedades.filter(n => n.estado === 'Cerrado');
                                                            if (closedNovedades.length === 0) {
                                                                return <div className="text-center py-2 text-gray-500 italic text-sm">No hay novedades cerradas en el historial.</div>;
                                                            }
                                                            return closedNovedades.map((n) => (
                                                                <div key={n.id} className="p-3 rounded-lg border bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 mb-2 opacity-80">
                                                                    <div className="flex justify-between items-start">
                                                                        <div>
                                                                            <p className="text-sm text-gray-800 dark:text-gray-200">{n.descripcion}</p>
                                                                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                                                <span className="flex items-center">
                                                                                    <ClockIcon className="w-3 h-3 mr-1" />
                                                                                    Creada: {n.fechaCreacion}
                                                                                </span>
                                                                                <span className="flex items-center">
                                                                                    <CheckCircleIcon className="w-3 h-3 mr-1 text-green-500" />
                                                                                    Cerrada: {n.fechaCierre}
                                                                                </span>
                                                                                <span className="px-2 py-0.5 rounded-full bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200">
                                                                                    {n.estado}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ));
                                                        })()}
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 transition">Cancelar</button>
                        <button type="submit" className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition">Guardar</button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default VehicleFormModal;