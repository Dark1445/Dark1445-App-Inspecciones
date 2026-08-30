import React from 'react';
import type { Tool } from '../types';
import Modal from './Modal';

interface XoverDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    tool: Tool | null;
}

const XoverDetailsModal: React.FC<XoverDetailsModalProps> = ({ isOpen, onClose, tool }) => {
    if (!isOpen || !tool) return null;

    const hasBothInspections = !!(tool.statusParcial && tool.statusFull);
    const isOneExpired = hasBothInspections && (tool.statusParcial?.text === 'Vencida' || tool.statusFull?.text === 'Vencida');

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-4xl transition-all duration-300 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-700 pb-4 mb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                                Especificaciones de Xover
                            </span>
                            {isOneExpired && (
                                <span className="bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                                    ⚠️ Alerta de Inspección
                                </span>
                            )}
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-2">
                            {tool.herramienta} — Serie: {tool.serial}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl font-semibold leading-none p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        title="Cerrar"
                    >
                        &times;
                    </button>
                </div>

                <div className="space-y-8">
                    {/* Graphic Visual Representation */}
                    <div>
                        <span className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                            Visualización Técnica de Xover
                        </span>
                        <div className="relative">
                            <svg viewBox="0 0 600 240" className="w-full bg-slate-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl shadow-inner p-2">
                                <defs>
                                    <pattern id="modal-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(148, 163, 184, 0.05)" strokeWidth="1" />
                                    </pattern>
                                    <linearGradient id="modal-steel" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#e2e8f0" />
                                        <stop offset="40%" stopColor="#f8fafc" />
                                        <stop offset="70%" stopColor="#cbd5e1" />
                                        <stop offset="100%" stopColor="#94a3b8" />
                                    </linearGradient>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#modal-grid)" rx="8" />
                                
                                {/* Center axis line */}
                                <line x1="40" y1="110" x2="560" y2="110" stroke="#94a3b8" strokeDasharray="5,5" strokeWidth="1.5" />

                                {/* Outer metal shape */}
                                <path 
                                    d="M 100 80 L 190 80 L 190 55 L 340 55 L 340 80 L 370 80 L 370 85 L 440 95 L 440 125 L 370 135 L 370 140 L 340 140 L 340 165 L 190 165 L 190 140 L 100 140 Z" 
                                    fill="url(#modal-steel)" 
                                    stroke="#475569" 
                                    strokeWidth="1.8" 
                                />

                                {/* Box Socket Inner cavity left side */}
                                <rect 
                                    x="100" 
                                    y="92" 
                                    width="35" 
                                    height="36" 
                                    fill={tool.xoverBoxInspected ? "rgba(16, 185, 129, 0.2)" : "rgba(30, 41, 59, 0.05)"} 
                                    stroke={tool.xoverBoxInspected ? "#10b981" : "#475569"} 
                                    strokeWidth={tool.xoverBoxInspected ? "2.5" : "1.5"} 
                                    rx="1" 
                                />
                                <line x1="135" y1="92" x2="135" y2="128" stroke={tool.xoverBoxInspected ? "#10b981" : "#475569"} strokeWidth="1.5" />

                                {/* Pin snouted thread block right side */}
                                <polygon 
                                    points="370,85 440,95 440,125 370,135" 
                                    fill={tool.xoverPinInspected ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.1)"} 
                                    stroke={tool.xoverPinInspected ? "#10b981" : "#475569"} 
                                    strokeWidth={tool.xoverPinInspected ? "2.5" : "1.5"} 
                                />
                                {/* Threads on Pin */}
                                <line x1="385" y1="87" x2="385" y2="133" stroke="#64748b" strokeWidth="1.2" />
                                <line x1="400" y1="89" x2="400" y2="131" stroke="#64748b" strokeWidth="1.2" />
                                <line x1="415" y1="91" x2="415" y2="129" stroke="#64748b" strokeWidth="1.2" />
                                <line x1="430" y1="93" x2="430" y2="127" stroke="#64748b" strokeWidth="1.2" />

                                {/* Fishing neck highlight */}
                                {tool.xoverCuelloPesca && (
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
                                    Box: <tspan className="fill-blue-600 dark:fill-blue-400 font-extrabold">{tool.xoverBox || "N/A"}</tspan>
                                </text>
                                {tool.xoverBoxInspected && (
                                    <text x="145" y="62" className="text-[10px] font-bold fill-green-600 dark:fill-green-400">✓ BOX INSPECCIONADO</text>
                                )}

                                {/* Cuello de Pesca default pointer */}
                                {!tool.xoverCuelloPesca && (
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
                                    Pin: <tspan className="fill-blue-600 dark:fill-blue-400 font-extrabold">{tool.xoverPin || "N/A"}</tspan>
                                </text>
                                {tool.xoverPinInspected && (
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
                                    Largo: <tspan className="fill-blue-600 dark:fill-blue-400 font-extrabold">{tool.xoverLargo || "—"}</tspan> inch
                                </text>
                            </svg>
                        </div>
                    </div>

                    {/* Specifications Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-150 dark:border-gray-700/50">
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 border-b border-gray-200/50 dark:border-gray-700 pb-1">
                                Datos Técnicos
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pin</span>
                                    <span className="font-bold text-gray-800 dark:text-gray-100">{tool.xoverPin || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Box</span>
                                    <span className="font-bold text-gray-800 dark:text-gray-100">{tool.xoverBox || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Largo Total</span>
                                    <span className="font-bold text-gray-800 dark:text-gray-100">{tool.xoverLargo ? `${tool.xoverLargo} inch` : 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cuello de Pesca</span>
                                    <span className={`font-bold px-2 py-0.5 rounded text-xs ${tool.xoverCuelloPesca ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                        {tool.xoverCuelloPesca ? 'Sí' : 'No'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 border-b border-gray-200/50 dark:border-gray-700 pb-1">
                                Estado de Inspección (Semestral)
                            </h3>
                            <div className="grid grid-cols-1 gap-3 text-sm">
                                <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-200/60 dark:border-gray-700">
                                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Extremo Box</span>
                                    <span className={`font-bold text-xs px-2.5 py-1 rounded-full ${tool.xoverBoxInspected ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                                        {tool.xoverBoxInspected ? '✓ Inspeccionado' : '✗ No Inspeccionado'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-200/60 dark:border-gray-700">
                                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Extremo Pin</span>
                                    <span className={`font-bold text-xs px-2.5 py-1 rounded-full ${tool.xoverPinInspected ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                                        {tool.xoverPinInspected ? '✓ Inspeccionado' : '✗ No Inspeccionado'}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Última Inspección</span>
                                    <span className="font-bold text-gray-800 dark:text-gray-100">
                                        {tool.ultimaInspeccion ? new Date(tool.ultimaInspeccion + 'T00:00:00').toLocaleDateString('es-ES') : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-150 dark:border-gray-700">
                            <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Referencia del Certificado</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {tool.certificadoRef || 'Sin referencia registrada.'}
                            </span>
                        </div>
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-150 dark:border-gray-700 flex flex-col justify-center">
                            <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Próxima Fecha Límite</span>
                            <span className={`text-base font-bold ${tool.status.color === 'red' ? 'text-red-600 dark:text-red-400' : tool.status.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-450' : 'text-green-600 dark:text-green-400'}`}>
                                {tool.nextInspectionDate ? tool.nextInspectionDate.toLocaleDateString('es-ES') : 'N/A'} ({tool.status.text})
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end border-t border-gray-100 dark:border-gray-700 pt-4">
                    <button
                        onClick={onClose}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default XoverDetailsModal;
