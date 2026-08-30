
import React, { useMemo, useState } from 'react';
import Modal from './Modal';
import type { Tool } from '../types';
import { SearchIcon, TimesIcon } from './icons';

interface InspectionTimelineModalProps {
    isOpen: boolean;
    onClose: () => void;
    tools: Tool[];
}

const InspectionTimelineModal: React.FC<InspectionTimelineModalProps> = ({ isOpen, onClose, tools }) => {
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [zoomLevel, setZoomLevel] = useState<number>(1); // 0.5 to 2

    const timelineData = useMemo(() => {
        // Filtrar solo herramientas que tienen fecha de inspección
        let filtered = tools.filter(t => t.ultimaInspeccion);
        
        // Aplicar filtros de fecha si existen
        if (startDate) {
            filtered = filtered.filter(t => t.ultimaInspeccion >= startDate);
        }
        if (endDate) {
            filtered = filtered.filter(t => t.ultimaInspeccion <= endDate);
        }

        // Ordenar por fecha descendente
        const sorted = [...filtered].sort((a, b) => 
            new Date(b.ultimaInspeccion).getTime() - new Date(a.ultimaInspeccion).getTime()
        );

        // Agrupar por Mes Año
        const grouped: { [key: string]: Tool[] } = {};
        sorted.forEach(tool => {
            const date = new Date(tool.ultimaInspeccion + 'T00:00:00');
            const key = date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(tool);
        });

        return Object.entries(grouped);
    }, [tools, startDate, endDate]);

    const formatDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
    };

    // Estilo dinámico basado en el zoom
    const monthColumnWidth = 280 * zoomLevel;
    const nodePositionTop = 10;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md w-full max-w-[95vw] max-h-[90vh] flex flex-col">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                            <i className="fas fa-history text-blue-500"></i>
                            Línea de Tiempo de Inspecciones
                        </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Desde:</label>
                            <input 
                                type="date" 
                                value={startDate} 
                                onChange={(e) => setStartDate(e.target.value)}
                                className="p-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Hasta:</label>
                            <input 
                                type="date" 
                                value={endDate} 
                                onChange={(e) => setEndDate(e.target.value)}
                                className="p-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                            />
                        </div>
                        {(startDate || endDate) && (
                            <button onClick={clearFilters} className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1">
                                <TimesIcon /> Limpiar
                            </button>
                        )}
                        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>
                        <div className="flex items-center gap-3">
                            <label className="text-xs font-bold text-gray-500 uppercase">Zoom:</label>
                            <input 
                                type="range" 
                                min="0.6" 
                                max="1.8" 
                                step="0.1" 
                                value={zoomLevel} 
                                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                                className="w-24 accent-blue-500"
                            />
                        </div>
                    </div>
                </header>
                
                <div className="flex-grow overflow-x-auto custom-scrollbar pb-6 pt-16">
                    {timelineData.length > 0 ? (
                        <div className="relative flex min-w-max px-10">
                            {/* Línea Horizontal de Fondo */}
                            <div className="absolute top-[1.15rem] left-0 right-0 h-1 bg-blue-200 dark:bg-blue-900 z-0"></div>
                            
                            {timelineData.map(([monthYear, monthTools]) => (
                                <div 
                                    key={monthYear} 
                                    className="relative flex flex-col items-center z-10"
                                    style={{ width: `${monthColumnWidth}px`, margin: `0 ${20 * zoomLevel}px` }}
                                >
                                    {/* Nodo de Mes */}
                                    <div className="absolute top-[0.65rem] h-5 w-5 rounded-full bg-blue-500 border-4 border-white dark:border-gray-800 shadow-sm z-20"></div>
                                    
                                    {/* Etiqueta de Mes */}
                                    <div className="absolute top-[-55px] text-center w-full">
                                        <h3 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter whitespace-nowrap">
                                            {monthYear}
                                        </h3>
                                        {(() => {
                                            const uniqueDates = Array.from(new Set(monthTools.map(t => t.ultimaInspeccion))).sort((a, b) => new Date(b as string).getTime() - new Date(a as string).getTime());
                                            const formattedDates = uniqueDates.map(formatDate).join(', ');
                                            return (
                                                <span 
                                                    className="text-[10px] text-gray-400 font-bold bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full cursor-help"
                                                    title={`Fechas: ${formattedDates}`}
                                                >
                                                    {uniqueDates.length} {uniqueDates.length === 1 ? 'Jornada' : 'Jornadas'}
                                                </span>
                                            );
                                        })()}
                                    </div>

                                    {/* Lista Vertical de Herramientas bajo ese mes */}
                                    <div className="space-y-4 w-full pt-4">
                                        {monthTools.map(tool => (
                                            <div key={`${tool.id}-${tool.ultimaInspeccion}`} className="bg-white dark:bg-gray-700/40 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] origin-top">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 truncate">
                                                            {tool.tipo}
                                                        </span>
                                                        {tool.tipoUltimaInspeccion && (
                                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                                                tool.tipoUltimaInspeccion === 'Full' 
                                                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' 
                                                                : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                                                            }`}>
                                                                {tool.tipoUltimaInspeccion}
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="min-h-[2.5rem]">
                                                        <h4 className="font-bold text-gray-900 dark:text-white text-xs leading-tight line-clamp-2" title={tool.herramienta}>
                                                            {tool.herramienta}
                                                        </h4>
                                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono mt-1">S/N: {tool.serial}</p>
                                                    </div>
                                                    
                                                    <div className="pt-2 border-t border-gray-100 dark:border-gray-600 mt-1">
                                                        <div className="flex justify-between items-center text-[10px]">
                                                            <span className="text-gray-400 italic">Fecha:</span>
                                                            <span className="font-black text-gray-800 dark:text-gray-200">{formatDate(tool.ultimaInspeccion)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-gray-500 dark:text-gray-400 w-full">
                            <i className="fas fa-calendar-times text-5xl mb-4 opacity-20"></i>
                            <p className="text-lg font-semibold">No se encontraron registros</p>
                            <p className="text-sm">Prueba ajustando el rango de fechas.</p>
                        </div>
                    )}
                </div>

                <div className="mt-8 flex justify-end">
                    <button 
                        onClick={onClose} 
                        className="bg-gray-800 dark:bg-gray-700 text-white py-2 px-10 rounded-xl hover:bg-black transition-colors shadow-lg font-bold"
                    >
                        Cerrar Historial
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default InspectionTimelineModal;
