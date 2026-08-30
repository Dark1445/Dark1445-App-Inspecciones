
import React, { useState } from 'react';
import type { Operation, Tool, Role } from '../types';
import { TimesIcon, ChevronDownIcon, ChevronUpIcon, EyeIcon } from './icons';

interface OperationCardProps {
    operation: Operation;
    assignedToolsData: Tool[];
    onDropTool: (operationId: string, toolId: string) => void;
    onRemoveTool: (operationId: string, toolId: string) => void;
    userRole: Role | null;
    isExpanded: boolean;
    onToggleExpansion: () => void;
    onEditOperation?: (operation: Operation) => void;
    onDeleteOperation?: (id: string) => void;
    forceExpand?: boolean;
    onXoverDetailsClick?: (tool: Tool) => void;
}

const OperationCard: React.FC<OperationCardProps> = ({ operation, assignedToolsData, onDropTool, onRemoveTool, userRole, isExpanded, onToggleExpansion, onEditOperation, onDeleteOperation, forceExpand, onXoverDetailsClick }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [isMinimized, setIsMinimized] = useState(true);

    React.useEffect(() => {
        if (forceExpand) {
            setIsMinimized(false);
        } else {
            setIsMinimized(true);
        }
    }, [forceExpand]);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (userRole === 'Admin') {
            setIsDragOver(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        if (userRole !== 'Admin') return;
        
        const toolId = e.dataTransfer.getData('text/plain');
        if (toolId) {
            onDropTool(operation.id, toolId);
        }
    };
    
    const cardClasses = [
        'bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex flex-col border-2 transition-all duration-200',
        isMinimized ? '' : 'h-full',
        isDragOver ? 'border-blue-500 border-dashed' : 'border-transparent'
    ].join(' ');

    const getStatusChipClass = (estado: string) => {
        switch(estado) {
            case 'Operando': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'Programada': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
            case 'Terminaron': return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200';
            case 'Op. Cancelada': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        }
    };

    return (
        <div 
            className={cardClasses}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className={`flex-shrink-0 ${isMinimized ? '' : 'mb-3 border-b border-gray-200 dark:border-gray-700 pb-3'}`}>
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                        {operation.equipo}
                        <span className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">({assignedToolsData.length})</span>
                    </h3>
                    <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusChipClass(operation.estado)}`}>
                            {operation.estado}
                        </span>
                        <button
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="w-6 h-6 flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-bold transition-all border border-gray-200 dark:border-gray-700 cursor-pointer text-sm"
                            title={isMinimized ? "Expandir" : "Minimizar"}
                        >
                            {isMinimized ? '+' : '-'}
                        </button>
                        {userRole === 'Admin' && onDeleteOperation && (
                            <button
                                onClick={() => onDeleteOperation(operation.id)}
                                className="w-6 h-6 flex items-center justify-center rounded-md bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold transition-all border border-red-200/80 dark:border-red-900/50 cursor-pointer text-xs"
                                title="Eliminar operación"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{operation.operadora} - {operation.yacimiento}</p>
                <div className="flex justify-between items-center mt-2.5">
                    <span className="text-xs font-mono bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-2.5 py-1 rounded-full border border-gray-200/80 dark:border-gray-600 font-semibold">{operation.solicitud}</span>
                    {userRole === 'Admin' && onEditOperation && (
                        <button
                            onClick={() => onEditOperation(operation)}
                            className="bg-gray-50 dark:bg-gray-700/80 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-450 text-[11px] font-bold py-1 px-2.5 rounded-lg flex items-center gap-1.5 transition-all border border-gray-200 dark:border-gray-600 shadow-sm"
                            title="Editar operación"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.25 h-3.25">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                            </svg>
                            <span>Editar</span>
                        </button>
                    )}
                </div>
            </div>

            {!isMinimized && (
                <>
                    <div className="flex-grow min-h-[100px] mb-3">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Herramientas Asignadas:</h4>
                            {assignedToolsData.length > 0 && (
                                <button
                                    onClick={onToggleExpansion}
                                    className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                    title={isExpanded ? "Ocultar herramientas" : "Mostrar herramientas"}
                                >
                                    {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                </button>
                            )}
                        </div>
                        
                        {assignedToolsData.length > 0 ? (
                            <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-64 overflow-y-auto custom-scrollbar' : 'max-h-0 overflow-hidden'}`}>
                                <ul className="space-y-2 pt-1 pr-2">
                                    {assignedToolsData.map(tool => {
                                        const hasBothInspections = !!(tool.statusParcial && tool.statusFull);
                                        const isOneExpired = hasBothInspections && (tool.statusParcial?.text === 'Vencida' || tool.statusFull?.text === 'Vencida');

                                        const borderColorClass = isOneExpired
                                            ? 'border-orange-500'
                                            : {
                                                red: 'border-red-500',
                                                yellow: 'border-yellow-500',
                                                green: 'border-green-500',
                                                gray: 'border-gray-400 dark:border-gray-500',
                                            }[tool.status.color];

                                        const bgClass = isOneExpired
                                            ? 'bg-orange-50 dark:bg-orange-950/20'
                                            : 'bg-gray-50 dark:bg-gray-700/50';

                                        return (
                                            <li key={tool.id} className={`${bgClass} p-2 rounded-md flex items-center text-sm border-l-4 ${borderColorClass} space-x-2`}>
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <p className="font-medium text-gray-800 dark:text-gray-200">
                                                            {tool.herramienta}
                                                            {tool.herramienta === 'Elevador SDE' && tool.sdeDiametro && (
                                                                <span className="text-blue-600 dark:text-blue-400 font-semibold ml-1 text-xs">
                                                                    ({tool.sdeDiametro})
                                                                </span>
                                                            )}
                                                        </p>
                                                        {tool.herramienta.toLowerCase() === 'xover' && onXoverDetailsClick && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onXoverDetailsClick(tool);
                                                                }}
                                                                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center justify-center"
                                                                title="Ver características de Xover"
                                                            >
                                                                <EyeIcon />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                                        {tool.serial}
                                                        {tool.herramienta === 'Elevador SDE' && (tool.sdeCapacidad || tool.detalle) && (
                                                            <span className="text-[11px] font-sans font-semibold text-indigo-600 dark:text-indigo-400 ml-1.5">
                                                                · {tool.sdeCapacidad || tool.detalle}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                        {tool.nextInspectionDate ? tool.nextInspectionDate.toLocaleDateString('es-ES') : 'N/A'}
                                                    </p>
                                                </div>
                                                {userRole === 'Admin' && (
                                                    <button 
                                                        onClick={() => onRemoveTool(operation.id, tool.id)}
                                                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex-shrink-0"
                                                        title="Liberar herramienta"
                                                    >
                                                        <TimesIcon />
                                                    </button>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">
                                <p>Arrastra una herramienta aquí</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400 mt-auto pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
                        <p><strong>Tipo:</strong> {operation.tipoOperacion}</p>
                        <p><strong>Fechas:</strong> {(operation.fechaInicio && operation.fechaFin) ? `${operation.fechaInicio} al ${operation.fechaFin}` : (operation.fechaInicio || operation.fechaFin || 'N/A')}</p>
                        {operation.buidsheet && <p><strong>Buidsheet:</strong> {operation.buidsheet}</p>}
                        {operation.DT && <p><strong>DT:</strong> {operation.DT}</p>}
                    </div>
                </>
            )}
        </div>
    );
};

export default OperationCard;