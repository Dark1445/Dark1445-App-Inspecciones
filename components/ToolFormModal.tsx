
import React, { useState, useEffect, useCallback } from 'react';
import type { Tool } from '../types';
import { TOOL_DEFINITIONS, SDE_DIAMETROS, SDE_CAPACIDADES } from '../definitions';
import Modal from './Modal';

interface ToolFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (tool: Omit<Tool, 'id' | 'nextInspectionDate' | 'status'> & { id?: string }) => void;
    onDelete: (toolId: string) => void;
    editingTool: Tool | null;
    tools: Tool[];
}

const ToolFormModal: React.FC<ToolFormModalProps> = ({ isOpen, onClose, onSave, onDelete, editingTool, tools = [] }) => {
    const [formData, setFormData] = useState({
        tipo: Object.keys(TOOL_DEFINITIONS)[0],
        herramienta: '',
        detalle: '',
        serial: '',
        ultimaInspeccion: '',
        tipoUltimaInspeccion: 'Parcial' as 'Parcial' | 'Full',
        certificadoRef: '',
        ultimaInspeccionParcial: '',
        ultimaInspeccionFull: '',
        xoverPin: '',
        xoverBox: '',
        xoverLargo: '',
        xoverCuelloPesca: false,
        xoverPinInspected: false,
        xoverBoxInspected: false,
        reactionBracketOption: null as 'Paleta' | 'Cuerpo' | 'Brazo' | null,
        cabezaElevadoraConexion: '',
        sdeDiametro: '',
        sdeCapacidad: '',
    });

    const resetForm = useCallback(() => {
        const initialTipo = Object.keys(TOOL_DEFINITIONS)[0];
        const initialHerramientas = Object.keys(TOOL_DEFINITIONS[initialTipo]);
        const initialHerramienta = initialHerramientas.length > 0 ? initialHerramientas[0] : '';

        let sdeDiam = editingTool?.sdeDiametro || '';
        let sdeCap = editingTool?.sdeCapacidad || '';
        if (editingTool?.herramienta === 'Elevador SDE') {
            if (!sdeDiam && !sdeCap && editingTool.detalle) {
                const capMatch = editingTool.detalle.match(/(100\s*TN|150\s*TN|250\s*TN)/i);
                if (capMatch) {
                    sdeCap = capMatch[1].toUpperCase();
                    const rest = editingTool.detalle.replace(capMatch[0], '').trim();
                    if (rest) sdeDiam = rest;
                } else if (!editingTool.detalle.toLowerCase().includes('tn')) {
                    sdeDiam = editingTool.detalle.trim();
                } else {
                    sdeCap = editingTool.detalle.trim();
                }
            }
        }

        setFormData({
            tipo: editingTool?.tipo || initialTipo,
            herramienta: editingTool?.herramienta || initialHerramienta,
            detalle: editingTool?.detalle || '',
            serial: editingTool?.serial || '',
            ultimaInspeccion: editingTool?.ultimaInspeccion || '',
            tipoUltimaInspeccion: editingTool?.tipoUltimaInspeccion || 'Parcial',
            certificadoRef: editingTool?.certificadoRef || '',
            ultimaInspeccionParcial: editingTool?.ultimaInspeccionParcial || '',
            ultimaInspeccionFull: editingTool?.ultimaInspeccionFull || '',
            xoverPin: editingTool?.xoverPin || '',
            xoverBox: editingTool?.xoverBox || '',
            xoverLargo: editingTool?.xoverLargo || '',
            xoverCuelloPesca: editingTool?.xoverCuelloPesca || false,
            xoverPinInspected: editingTool?.xoverPinInspected || false,
            xoverBoxInspected: editingTool?.xoverBoxInspected || false,
            reactionBracketOption: editingTool?.reactionBracketOption || null,
            cabezaElevadoraConexion: editingTool?.cabezaElevadoraConexion || '',
            sdeDiametro: sdeDiam,
            sdeCapacidad: sdeCap,
        });
    }, [editingTool]);

    useEffect(() => {
        if (isOpen) {
            resetForm();
        }
    }, [isOpen, resetForm]);

    const handleTipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTipo = e.target.value;
        const firstHerramienta = Object.keys(TOOL_DEFINITIONS[newTipo])[0];
        setFormData(prev => ({ 
            ...prev, 
            tipo: newTipo, 
            herramienta: firstHerramienta, 
            detalle: '',
            xoverPin: firstHerramienta.toLowerCase() === 'xover' ? prev.xoverPin : '',
            xoverBox: firstHerramienta.toLowerCase() === 'xover' ? prev.xoverBox : '',
            xoverLargo: firstHerramienta.toLowerCase() === 'xover' ? prev.xoverLargo : '',
            xoverCuelloPesca: firstHerramienta.toLowerCase() === 'xover' ? prev.xoverCuelloPesca : false,
            xoverPinInspected: firstHerramienta.toLowerCase() === 'xover' ? prev.xoverPinInspected : false,
            xoverBoxInspected: firstHerramienta.toLowerCase() === 'xover' ? prev.xoverBoxInspected : false,
            reactionBracketOption: firstHerramienta === 'Reaction Bracket' ? prev.reactionBracketOption : null,
            cabezaElevadoraConexion: firstHerramienta === 'Cabeza Elevadora' ? prev.cabezaElevadoraConexion : '',
            sdeDiametro: firstHerramienta === 'Elevador SDE' ? prev.sdeDiametro : '',
            sdeCapacidad: firstHerramienta === 'Elevador SDE' ? prev.sdeCapacidad : '',
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const target = e.target;
        const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
        setFormData(prev => ({ ...prev, [target.name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let finalDetalle = formData.detalle;
        if (formData.herramienta === 'Elevador SDE') {
            finalDetalle = [formData.sdeDiametro?.trim(), formData.sdeCapacidad?.trim()].filter(Boolean).join(' ');
        }
        onSave({ 
            id: editingTool?.id, 
            ...formData,
            detalle: finalDetalle,
        });
    };

    const handleDelete = () => {
        if (editingTool) {
            onDelete(editingTool.id);
        }
    };
    
    const currentDefinition = TOOL_DEFINITIONS[formData.tipo]?.[formData.herramienta];
    const showDetalleDropdown = currentDefinition?.details;
    const showDetalleInput = currentDefinition?.hasDetailField;
    const showTipoInspeccion = currentDefinition && 'partial' in currentDefinition && 'full' in currentDefinition;
    const hasInspection = currentDefinition && ('standard' in currentDefinition || showTipoInspeccion);
    const isXover = formData.herramienta?.toLowerCase() === 'xover';
    const isElevadorSde = formData.herramienta === 'Elevador SDE';

    const isDuplicateSerial = React.useMemo(() => {
        const serialTrimmed = formData.serial ? formData.serial.trim().toLowerCase() : '';
        if (!serialTrimmed) return false;
        return tools.some(t => t.id !== editingTool?.id && t.serial && t.serial.trim().toLowerCase() === serialTrimmed);
    }, [formData.serial, tools, editingTool]);

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className={`bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md w-full ${isXover ? 'max-w-4xl' : 'max-w-2xl'} transition-all duration-300 max-h-[90vh] overflow-y-auto`}>
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    {isXover && <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Módulo Especial</span>}
                    {editingTool ? 'Editar Herramienta' : 'Agregar Nueva Herramienta'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                            <select id="tipo" name="tipo" value={formData.tipo} onChange={handleTipoChange} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required>
                                {Object.keys(TOOL_DEFINITIONS).map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="herramienta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Herramienta</label>
                            <select id="herramienta" name="herramienta" value={formData.herramienta} onChange={handleChange} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required>
                                {Object.keys(TOOL_DEFINITIONS[formData.tipo] || {}).map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                    </div>

                    {formData.herramienta === 'Reaction Bracket' && (
                        <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-950/40 space-y-3">
                            <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Parte del Reaction Bracket (Seleccione una)</span>
                            <div className="flex flex-wrap gap-4">
                                {['Paleta', 'Cuerpo', 'Brazo'].map((opt) => (
                                    <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                                        <input 
                                            type="radio" 
                                            name="reactionBracketOption" 
                                            value={opt} 
                                            checked={formData.reactionBracketOption === opt}
                                            onChange={(e) => setFormData(prev => ({ ...prev, reactionBracketOption: e.target.value as any }))}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-705 cursor-pointer"
                                        />
                                        <span>{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {formData.herramienta === 'Cabeza Elevadora' && (
                        <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-950/40 space-y-3">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="cabezaElevadoraConexion" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Conexión</label>
                                <input 
                                    type="text" 
                                    id="cabezaElevadoraConexion"
                                    name="cabezaElevadoraConexion"
                                    value={formData.cabezaElevadoraConexion}
                                    onChange={handleChange}
                                    placeholder="Ej: 4-1/2 IF"
                                    className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                            </div>
                        </div>
                    )}

                    {isXover ? (
                        /* Specialized Xover Section */
                        <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                            {/* Graphic Visual Representation */}
                            <div>
                                <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider text-xs">Visualización Técnica de Xover</span>
                                <div className="relative">
                                    <svg viewBox="0 0 600 240" className="w-full bg-slate-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl shadow-inner p-2">
                                        <defs>
                                            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(148, 163, 184, 0.05)" strokeWidth="1" />
                                            </pattern>
                                            <linearGradient id="steel" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="#e2e8f0" />
                                                <stop offset="40%" stopColor="#f8fafc" />
                                                <stop offset="70%" stopColor="#cbd5e1" />
                                                <stop offset="100%" stopColor="#94a3b8" />
                                            </linearGradient>
                                        </defs>
                                        <rect width="100%" height="100%" fill="url(#grid)" rx="8" />
                                        
                                        {/* Center axis line */}
                                        <line x1="40" y1="110" x2="560" y2="110" stroke="#94a3b8" strokeDasharray="5,5" strokeWidth="1.5" />

                                        {/* Outer metal shape */}
                                        <path 
                                            d="M 100 80 L 190 80 L 190 55 L 340 55 L 340 80 L 370 80 L 370 85 L 440 95 L 440 125 L 370 135 L 370 140 L 340 140 L 340 165 L 190 165 L 190 140 L 100 140 Z" 
                                            fill="url(#steel)" 
                                            stroke="#475569" 
                                            strokeWidth="1.8" 
                                        />

                                        {/* Box Socket Inner cavity left side */}
                                        <rect 
                                            x="100" 
                                            y="92" 
                                            width="35" 
                                            height="36" 
                                            fill={formData.xoverBoxInspected ? "rgba(16, 185, 129, 0.2)" : "rgba(30, 41, 59, 0.05)"} 
                                            stroke={formData.xoverBoxInspected ? "#10b981" : "#475569"} 
                                            strokeWidth={formData.xoverBoxInspected ? "2.5" : "1.5"} 
                                            rx="1" 
                                        />
                                        <line x1="135" y1="92" x2="135" y2="128" stroke={formData.xoverBoxInspected ? "#10b981" : "#475569"} strokeWidth="1.5" />

                                        {/* Pin snouted thread block right side */}
                                        <polygon 
                                            points="370,85 440,95 440,125 370,135" 
                                            fill={formData.xoverPinInspected ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.1)"} 
                                            stroke={formData.xoverPinInspected ? "#10b981" : "#475569"} 
                                            strokeWidth={formData.xoverPinInspected ? "2.5" : "1.5"} 
                                        />
                                        {/* Threads on Pin */}
                                        <line x1="385" y1="87" x2="385" y2="133" stroke="#64748b" strokeWidth="1.2" />
                                        <line x1="400" y1="89" x2="400" y2="131" stroke="#64748b" strokeWidth="1.2" />
                                        <line x1="415" y1="91" x2="415" y2="129" stroke="#64748b" strokeWidth="1.2" />
                                        <line x1="430" y1="93" x2="430" y2="127" stroke="#64748b" strokeWidth="1.2" />

                                        {/* Fishing neck highlight */}
                                        {formData.xoverCuelloPesca && (
                                            <g>
                                                <rect x="190" y="55" width="150" height="110" fill="rgba(59, 130, 246, 0.12)" stroke="#2563eb" strokeWidth="2" strokeDasharray="3,3" />
                                                <path d="M 230 50 L 250 35 L 310 35 L 290 50" fill="none" stroke="#2563eb" strokeWidth="1.2" />
                                                <text x="270" y="30" textAnchor="middle" className="text-[10px] font-bold fill-blue-600 dark:fill-blue-400">Cuello: SÍ</text>
                                            </g>
                                        )}

                                        {/* Box Label Line & Text */}
                                        <path d="M 115 92 L 115 45 L 140 45" fill="none" stroke="#64748b" strokeWidth="1" />
                                        <circle cx="115" cy="92" r="3" fill="#64748b" />
                                        <text x="145" y="49" className="text-xs font-bold fill-gray-800 dark:fill-gray-200">
                                            Box: <tspan className="fill-blue-600 dark:fill-blue-400 font-extrabold">{formData.xoverBox || "N/A"}</tspan>
                                        </text>
                                        {formData.xoverBoxInspected && (
                                            <text x="145" y="62" className="text-[10px] font-bold fill-green-600 dark:fill-green-400">✓ BOX INSPECCIONADO</text>
                                        )}

                                        {/* Cuello de Pesca default pointer */}
                                        {!formData.xoverCuelloPesca && (
                                            <g>
                                                <path d="M 265 55 L 265 40 L 235 40" fill="none" stroke="#94a3b8" strokeWidth="1" />
                                                <circle cx="265" cy="55" r="3" fill="#94a3b8" />
                                                <text x="160" y="44" className="text-[11px] font-semibold fill-gray-400">Sin Cuello Pesca</text>
                                            </g>
                                        )}

                                        {/* Pin Label Line & Text */}
                                        <path d="M 405 90 L 405 45 L 430 45" fill="none" stroke="#64748b" strokeWidth="1" />
                                        <circle cx="405" cy="90" r="3" fill="#64748b" />
                                        <text x="435" y="49" className="text-xs font-bold fill-gray-800 dark:fill-gray-200">
                                            Pin: <tspan className="fill-blue-600 dark:fill-blue-400 font-extrabold">{formData.xoverPin || "N/A"}</tspan>
                                        </text>
                                        {formData.xoverPinInspected && (
                                            <text x="435" y="62" className="text-[10px] font-bold fill-green-600 dark:fill-green-400">✓ PIN INSPECCIONADO</text>
                                        )}

                                        {/* Dimension Line and ticks (Largo) */}
                                        <line x1="100" y1="140" x2="100" y2="205" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
                                        <line x1="440" y1="125" x2="440" y2="205" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
                                        
                                        <line x1="100" y1="195" x2="440" y2="195" stroke="#475569" strokeWidth="1.2" />
                                        <path d="M 100 195 L 110 191 M 100 195 L 110 199" stroke="#475569" strokeWidth="1.2" />
                                        <path d="M 440 195 L 430 191 M 440 195 L 430 199" stroke="#475569" strokeWidth="1.2" />
                                        
                                        <rect x="220" y="185" width="100" height="20" fill="#f8fafc" className="dark:fill-slate-900" rx="4" />
                                        <text x="270" y="199" textAnchor="middle" className="text-xs font-bold fill-gray-800 dark:fill-gray-200">
                                            Largo: <tspan className="fill-blue-600 dark:fill-blue-400 font-extrabold">{formData.xoverLargo || "—"}</tspan> inch
                                        </text>
                                    </svg>
                                </div>
                            </div>

                            {/* Xover Grid Inputs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 dark:bg-gray-900/20 rounded-xl border border-gray-100 dark:border-gray-800/80">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1 border-b border-gray-200/50 dark:border-gray-800/80 pb-1">Especificaciones Mecánicas</h4>
                                    <div>
                                        <label htmlFor="xoverPin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pin (Ej: 2-7/8" IF)</label>
                                        <input type="text" id="xoverPin" name="xoverPin" value={formData.xoverPin} onChange={handleChange} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="2-7/8 REG, XT39, etc." />
                                    </div>
                                    <div>
                                        <label htmlFor="xoverBox" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Box (Ej: 3-1/2" IF)</label>
                                        <input type="text" id="xoverBox" name="xoverBox" value={formData.xoverBox} onChange={handleChange} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="3-1/2 IF, REG, etc." />
                                    </div>
                                    <div>
                                        <label htmlFor="xoverLargo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Largo Total (inch)</label>
                                        <input type="text" id="xoverLargo" name="xoverLargo" value={formData.xoverLargo} onChange={handleChange} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Ej: 12" />
                                    </div>
                                    <div className="flex items-center pt-2">
                                        <input 
                                            type="checkbox" 
                                            id="xoverCuelloPesca" 
                                            name="xoverCuelloPesca" 
                                            checked={formData.xoverCuelloPesca} 
                                            onChange={handleChange} 
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer" 
                                        />
                                        <label htmlFor="xoverCuelloPesca" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">Tiene Cuello de Pesca</label>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1 border-b border-gray-200/50 dark:border-gray-800/80 pb-1">Inspección Semestral Especial</h4>
                                    <div>
                                        <label htmlFor="ultimaInspeccion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Última Inspección Completa</label>
                                        <input type="date" id="ultimaInspeccion" name="ultimaInspeccion" value={formData.ultimaInspeccion} onChange={handleChange} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" required={hasInspection} />
                                    </div>
                                    <div className="bg-white dark:bg-gray-800/40 p-3 rounded-lg border border-gray-200 dark:border-gray-800/80 space-y-3">
                                        <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-none">Extremos Inspeccionados</span>
                                        <div className="flex flex-col gap-2">
                                            <label className="flex items-center cursor-pointer select-none">
                                                <input 
                                                    type="checkbox" 
                                                    name="xoverBoxInspected" 
                                                    checked={formData.xoverBoxInspected} 
                                                    onChange={handleChange} 
                                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer" 
                                                />
                                                <span className="ml-2 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-[11px] font-bold text-gray-600 dark:text-gray-300 mr-2 border border-gray-200 dark:border-gray-600">BOX</span>
                                                <span className="text-sm text-gray-700 dark:text-gray-300">Se inspeccionó Rosca Hembra (Box)</span>
                                            </label>
                                            <label className="flex items-center cursor-pointer select-none">
                                                <input 
                                                    type="checkbox" 
                                                    name="xoverPinInspected" 
                                                    checked={formData.xoverPinInspected} 
                                                    onChange={handleChange} 
                                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer" 
                                                />
                                                <span className="ml-2 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-[11px] font-bold text-gray-600 dark:text-gray-300 mr-2 border border-gray-200 dark:border-gray-600">PIN</span>
                                                <span className="text-sm text-gray-700 dark:text-gray-300">Se inspeccionó Rosca Macho (Pin)</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="serial" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-semibold">N° de Serie</label>
                                        <input 
                                            type="text" 
                                            id="serial" 
                                            name="serial" 
                                            value={formData.serial} 
                                            onChange={handleChange} 
                                            className={`w-full p-2 bg-white dark:bg-gray-700 border ${isDuplicateSerial ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm font-bold placeholder-red-400`} 
                                            required 
                                        />
                                        {isDuplicateSerial && (
                                            <p className="text-red-500 text-xs font-semibold mt-1">
                                                ⚠️ Número de serie ya registrado (duplicado).
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Standard Non-Xover UI fields */
                        <>
                            {isElevadorSde ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-950/40">
                                        <div>
                                            <label htmlFor="sdeDiametro" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                Diámetro (inch) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                list="sde-diametros-list"
                                                type="text"
                                                id="sdeDiametro"
                                                name="sdeDiametro"
                                                value={formData.sdeDiametro}
                                                onChange={handleChange}
                                                placeholder='Ej: 2 7/8", 3 1/2", 4 1/2", 5"...'
                                                className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                                                required
                                            />
                                            <datalist id="sde-diametros-list">
                                                {SDE_DIAMETROS.map(d => <option key={d} value={d} />)}
                                            </datalist>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Escribe o selecciona el diámetro del elevador SDE.</p>
                                        </div>
                                        <div>
                                            <label htmlFor="sdeCapacidad" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                Capacidad (Toneladas)
                                            </label>
                                            <select
                                                id="sdeCapacidad"
                                                name="sdeCapacidad"
                                                value={formData.sdeCapacidad}
                                                onChange={handleChange}
                                                className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            >
                                                <option value="">Seleccionar...</option>
                                                {SDE_CAPACIDADES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Capacidad de carga nominal.</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="serial" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">N° de Serie</label>
                                        <input 
                                            type="text" 
                                            id="serial" 
                                            name="serial" 
                                            value={formData.serial} 
                                            onChange={handleChange} 
                                            className={`w-full p-2 bg-white dark:bg-gray-700 border ${isDuplicateSerial ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`} 
                                            required 
                                        />
                                        {isDuplicateSerial && (
                                            <p className="text-red-500 text-xs font-semibold mt-1">
                                                ⚠️ Número de serie ya registrado (duplicado).
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {showDetalleDropdown ? (
                                        <div>
                                            <label htmlFor="detalle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Detalle</label>
                                            <select id="detalle" name="detalle" value={formData.detalle} onChange={handleChange} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                                              <option value="">Seleccionar...</option>
                                              {currentDefinition.details?.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>
                                    ) : showDetalleInput ? (
                                        <div>
                                            <label htmlFor="detalle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Detalle / Observación</label>
                                            <input
                                                type="text"
                                                id="detalle"
                                                name="detalle"
                                                value={formData.detalle}
                                                onChange={handleChange}
                                                className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Opcional"
                                            />
                                        </div>
                                    ) : null}
                                    <div className={ (showDetalleDropdown || showDetalleInput) ? '' : 'md:col-span-2' }>
                                        <label htmlFor="serial" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 columns-2">N° de Serie</label>
                                        <input 
                                            type="text" 
                                            id="serial" 
                                            name="serial" 
                                            value={formData.serial} 
                                            onChange={handleChange} 
                                            className={`w-full p-2 bg-white dark:bg-gray-700 border ${isDuplicateSerial ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`} 
                                            required 
                                        />
                                        {isDuplicateSerial && (
                                            <p className="text-red-500 text-xs font-semibold mt-1">
                                                ⚠️ Número de serie ya registrado (duplicado).
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                            {hasInspection && (
                                showTipoInspeccion ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <div className="col-span-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Control de Inspección Doble (Semestral y Anual)</span>
                                        </div>
                                        <div>
                                            <label htmlFor="ultimaInspeccionParcial" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Última Inspección Parcial (Semestral)</label>
                                            <input type="date" id="ultimaInspeccionParcial" name="ultimaInspeccionParcial" value={formData.ultimaInspeccionParcial} onChange={handleChange} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                                        </div>
                                        <div>
                                            <label htmlFor="ultimaInspeccionFull" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Última Inspección Full (Anual)</label>
                                            <input type="date" id="ultimaInspeccionFull" name="ultimaInspeccionFull" value={formData.ultimaInspeccionFull} onChange={handleChange} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="ultimaInspeccion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Última Inspección</label>
                                            <input type="date" id="ultimaInspeccion" name="ultimaInspeccion" value={formData.ultimaInspeccion} onChange={handleChange} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required={hasInspection} />
                                        </div>
                                    </div>
                                )
                            )}
                        </>
                    )}

                    <div>
                        <label htmlFor="certificadoRef" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Referencia Certificado</label>
                        <input type="text" id="certificadoRef" name="certificadoRef" value={formData.certificadoRef} onChange={handleChange} placeholder="Ej: Certificado-123.pdf en carpeta 'Inspecciones'" className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <button type="button" onClick={onClose} className="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 transition">Cancelar</button>
                        <button type="submit" className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition">Guardar</button>
                        {editingTool && (
                            <button type="button" onClick={handleDelete} className="bg-red-600 text-white py-2 px-6 rounded-lg hover:bg-red-700 transition">Eliminar</button>
                        )}
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default ToolFormModal;