import React, { useState, useEffect, useRef, useCallback } from 'react';
import Modal from './Modal';
import { Operation } from '../types';
import { OPERADORAS, ESTADOS_OPERACION, TIPOS_OPERACION, YACIMIENTOS } from '../definitions';

interface OperationFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (operation: Partial<Operation> & { id?: string }) => void;
    editingOperation: Operation | null;
}

// Internal Autocomplete Component
interface AutocompleteProps {
    label: string;
    options: string[];
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
}

const AutocompleteCombobox: React.FC<AutocompleteProps> = ({ label, options, value, onChange, required }) => {
    const [inputValue, setInputValue] = useState(value);
    const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setInputValue(value); }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const currentInput = e.target.value;
        setInputValue(currentInput);
        onChange(currentInput);
        if (currentInput) {
            setFilteredOptions(
                options.filter(opt => opt.toLowerCase().includes(currentInput.toLowerCase()))
            );
            setIsOpen(true);
        } else {
            setFilteredOptions([]);
            setIsOpen(false);
        }
    };

    const handleOptionClick = (option: string) => {
        setInputValue(option);
        onChange(option);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => {
                   setFilteredOptions(options.filter(opt => opt.toLowerCase().includes(inputValue.toLowerCase())));
                   setIsOpen(true);
                }}
                className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required={required}
            />
            {isOpen && filteredOptions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                    {filteredOptions.map((option, index) => (
                        <li
                            key={index}
                            onClick={() => handleOptionClick(option)}
                            className="p-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-700"
                        >
                            {option}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};


const OperationFormModal: React.FC<OperationFormModalProps> = ({ isOpen, onClose, onSave, editingOperation }) => {
    // FIX: Added buidsheet and DT to form state
    const [formData, setFormData] = useState({
        equipo: '', operadora: '', diametro: '', estado: ESTADOS_OPERACION[0],
        tipoOperacion: '', yacimiento: '', fechaInicio: '', fechaFin: '', solicitud: '',
        buidsheet: '', DT: ''
    });

    useEffect(() => {
        if (editingOperation) {
            // FIX: Populate buidsheet and DT when editing an operation
            setFormData({
                equipo: editingOperation.equipo,
                operadora: editingOperation.operadora,
                diametro: editingOperation.diametro,
                estado: editingOperation.estado,
                tipoOperacion: editingOperation.tipoOperacion,
                yacimiento: editingOperation.yacimiento,
                fechaInicio: editingOperation.fechaInicio,
                fechaFin: editingOperation.fechaFin,
                solicitud: editingOperation.solicitud,
                buidsheet: editingOperation.buidsheet || '',
                DT: editingOperation.DT || '',
            });
        } else {
            // FIX: Reset buidsheet and DT for new operations
             setFormData({
                equipo: '', operadora: '', diametro: '', estado: ESTADOS_OPERACION[0],
                tipoOperacion: '', yacimiento: '', fechaInicio: '', fechaFin: '', solicitud: '',
                buidsheet: '', DT: ''
            });
        }
    }, [editingOperation, isOpen]);


    const handleChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: editingOperation?.id, ...formData });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
                    {editingOperation ? 'Editar Operación' : 'Nueva Operación'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="equipo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Equipo / ID</label>
                            <input type="text" id="equipo" value={formData.equipo} onChange={(e) => handleChange('equipo', e.target.value)} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                         <AutocompleteCombobox label="Operadora" options={OPERADORAS} value={formData.operadora} onChange={(v) => handleChange('operadora', v)} required />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AutocompleteCombobox label="Yacimiento" options={YACIMIENTOS} value={formData.yacimiento} onChange={(v) => handleChange('yacimiento', v)} required />
                        <AutocompleteCombobox label="Tipo de Operación" options={TIPOS_OPERACION} value={formData.tipoOperacion} onChange={(v) => handleChange('tipoOperacion', v)} required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="estado" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
                            <select id="estado" value={formData.estado} onChange={(e) => handleChange('estado', e.target.value)} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required >
                                {ESTADOS_OPERACION.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="diametro" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Diámetro</label>
                            <input type="text" id="diametro" value={formData.diametro} onChange={(e) => handleChange('diametro', e.target.value)} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                    </div>
                    {/* FIX: Added form fields for buidsheet and DT */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="buidsheet" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buidsheet</label>
                            <input type="text" id="buidsheet" value={formData.buidsheet} onChange={(e) => handleChange('buidsheet', e.target.value)} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" />
                        </div>
                        <div>
                            <label htmlFor="DT" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DT</label>
                            <input type="text" id="DT" value={formData.DT} onChange={(e) => handleChange('DT', e.target.value)} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="fechaInicio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Inicio</label>
                            <input type="date" id="fechaInicio" value={formData.fechaInicio} onChange={(e) => handleChange('fechaInicio', e.target.value)} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="fechaFin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Fin</label>
                            <input type="date" id="fechaFin" value={formData.fechaFin} onChange={(e) => handleChange('fechaFin', e.target.value)} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="solicitud" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número de Solicitud</label>
                        <input type="text" id="solicitud" value={formData.solicitud} onChange={(e) => handleChange('solicitud', e.target.value)} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 transition">Cancelar</button>
                        <button type="submit" className="bg-indigo-600 text-white py-2 px-6 rounded-lg hover:bg-indigo-700 transition">Guardar</button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default OperationFormModal;