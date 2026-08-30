
import React from 'react';
import type { Tool, Role } from '../types';
import { isNotificationActive } from '../utils/dateUtils';
import { BellIcon, EyeIcon } from './icons';

interface ToolItemProps {
    tool: Tool;
    isAssigned: boolean;
    assignedToEquipment?: string;
    onSelect: (tool: Tool) => void;
    onNotificationClick: (toolId: string) => void;
    userRole: Role | null;
    onDragAttemptFailed: (title: string, text: string) => void;
    onXoverDetailsClick?: (tool: Tool) => void;
}

const ToolItem: React.FC<ToolItemProps> = ({ tool, isAssigned, assignedToEquipment, onSelect, onNotificationClick, userRole, onDragAttemptFailed, onXoverDetailsClick }) => {
    const isExpired = tool.status.text === 'Vencida';
    const isDraggable = userRole === 'Admin';
    const notificationIsActive = isNotificationActive(tool);

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

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        if (userRole !== 'Admin') {
            e.preventDefault();
            return;
        }

        e.dataTransfer.setData('text/plain', tool.id);
    };

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('.notification-btn')) return;
        if (!isAssigned && userRole === 'Admin') {
            onSelect(tool);
        }
    };
    
    const isClickable = !isAssigned && userRole === 'Admin';

    const itemClasses = [
        'p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm border-l-4 transition mb-3',
        borderColorClass,
        isDraggable ? 'cursor-grab' : (isClickable ? 'cursor-pointer' : 'cursor-not-allowed'),
        isClickable ? 'hover:bg-gray-100 dark:hover:bg-gray-600' : 'opacity-80',
        // Shading for assigned tools to make them visually distinct
        isAssigned ? 'bg-gray-200 dark:bg-gray-650' : '',
        isOneExpired && !isAssigned ? 'bg-orange-50/40 dark:bg-orange-950/10' : ''
    ].filter(Boolean).join(' ');
    
    const getTooltipText = (): string => {
        if (isOneExpired) {
            return 'Atención: Una de las inspecciones (Semestral o Anual) está vencida.';
        }
        if (isExpired && isDraggable) {
            return 'Atención: La inspección de la herramienta está vencida (Se puede asignar con advertencia).';
        }
        if (isExpired) {
            return 'La inspección de la herramienta está vencida.';
        }
        if (isAssigned && isDraggable) {
            return `Herramienta ya asignada a ${assignedToEquipment || 'un equipo'}. Arrastra para reasignar a otra operación.`;
        }
        if (isDraggable) {
            return 'Arrastrar para asignar a una operación.';
        }
        if (userRole !== 'Admin') {
            return 'Solo los administradores pueden asignar herramientas.';
        }
        return '';
    };


    return (
        <div 
            draggable={userRole === 'Admin'} 
            onDragStart={handleDragStart} 
            onClick={handleClick} 
            className={itemClasses}
            title={getTooltipText()}
        >
            <div className="flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold text-gray-800 dark:text-gray-100">
                            {tool.herramienta}
                            {tool.herramienta === 'Elevador SDE' && tool.sdeDiametro && (
                                <span className="text-blue-600 dark:text-blue-400 font-semibold ml-1.5 text-xs">
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
                                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded-full hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition flex items-center justify-center"
                                title="Ver características de Xover"
                            >
                                <EyeIcon />
                            </button>
                        )}
                        {tool.herramienta === 'Reaction Bracket' && tool.reactionBracketOption && (
                            <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                                {tool.reactionBracketOption}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        {tool.serial}
                        {tool.herramienta === 'Elevador SDE' && (tool.sdeCapacidad || tool.detalle) && (
                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 ml-2 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/60">
                                {tool.sdeCapacidad || tool.detalle}
                            </span>
                        )}
                        {tool.herramienta === 'Cabeza Elevadora' && tool.cabezaElevadoraConexion && (
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold ml-2">({tool.cabezaElevadoraConexion})</span>
                        )}
                    </p>
                    {isAssigned && assignedToEquipment && (
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1">
                            <span>📍 {assignedToEquipment}</span>
                        </p>
                    )}
                </div>
                <div className="text-right flex items-center gap-3">
                    <div>
                        <p className={`text-sm font-semibold ${isOneExpired ? 'text-orange-500 dark:text-orange-450' : 'text-gray-700 dark:text-gray-200'}`}>{tool.status.text}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Vence: {tool.nextInspectionDate ? tool.nextInspectionDate.toLocaleDateString('es-ES') : 'N/A'}
                        </p>
                    </div>
                    <button 
                        title="Configurar Alerta" 
                        className={`notification-btn ${notificationIsActive ? 'notification-active' : ''} text-gray-400 hover:text-amber-500`}
                        onClick={() => onNotificationClick(tool.id)}
                        disabled={userRole !== 'Admin'}
                    >
                       <BellIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ToolItem;