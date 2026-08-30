
import React, { useState, useMemo } from 'react';
import type { Tool, Operation, Role } from '../types';
import ToolItem from '../components/ToolItem';
import OperationCard from '../components/OperationCard';
import XoverDetailsModal from '../components/XoverDetailsModal';
import {
    SearchIcon, PlaceholderIcon,
    ChevronLeftIcon, ChevronRightIcon,
    ClipboardListIcon
} from '../components/icons';
import { generateOperationsReport } from '../services/reportService';


interface CanvasViewProps {
    tools: Tool[];
    operations: Operation[];
    assignedToolIds: Set<string>;
    handleDropToolOnOperation: (operationId: string, toolId: string) => void;
    handleRemoveToolFromOperation: (operationId: string, toolId: string) => void;
    handleOpenNotificationModal: (toolId: string) => void;
    userRole: Role | null;
    onShowAlert: (title: string, text: string) => void;
    handleOpenOperationForm: (operation: Operation | null) => void;
    handleDeleteOperation: (operationId: string) => void;
}

const CanvasView: React.FC<CanvasViewProps> = ({
    tools,
    operations,
    assignedToolIds,
    handleDropToolOnOperation,
    handleRemoveToolFromOperation,
    handleOpenNotificationModal,
    userRole,
    onShowAlert,
    handleOpenOperationForm,
    handleDeleteOperation,
}) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [collapsedOperations, setCollapsedOperations] = useState<Set<string>>(new Set());
    const [assignedToolSearch, setAssignedToolSearch] = useState('');
    const [selectedToolName, setSelectedToolName] = useState('all');
    const [filterExpiredInWell, setFilterExpiredInWell] = useState(false);
    
    // States for Xover Characteristics Modal
    const [isXoverModalOpen, setIsXoverModalOpen] = useState(false);
    const [xoverModalTool, setXoverModalTool] = useState<Tool | null>(null);

    const handleOpenXoverDetails = (tool: Tool) => {
        setXoverModalTool(tool);
        setIsXoverModalOpen(true);
    };

    const handleCloseXoverDetails = () => {
        setIsXoverModalOpen(false);
        setXoverModalTool(null);
    };
    const [filterExpiringSoonInWell, setFilterExpiringSoonInWell] = useState(false);

    const toolNames = useMemo(() => {
        const names = new Set<string>();
        tools.forEach(t => {
            if (t.herramienta) names.add(t.herramienta);
        });
        return Array.from(names).sort();
    }, [tools]);

    const filteredOperations = useMemo(() => {
        let result = operations;

        // Filtro por nombre de herramienta seleccionada
        if (selectedToolName !== 'all') {
            result = result.filter(op => {
                const opTools = op.assignedTools.map(id => tools.find(t => t.id === id)).filter((t): t is Tool => !!t);
                return opTools.some(tool => tool.herramienta === selectedToolName);
            });
        }

        // Filtro por búsqueda de herramientas asignadas (texto)
        if (assignedToolSearch.trim()) {
            const term = assignedToolSearch.toLowerCase().trim();
            result = result.filter(op => {
                const opTools = op.assignedTools.map(id => tools.find(t => t.id === id)).filter((t): t is Tool => !!t);
                return opTools.some(tool => {
                    const matchesBasic = tool.herramienta.toLowerCase().includes(term) || 
                        tool.serial.toLowerCase().includes(term);
                    const isXover = tool.herramienta?.toLowerCase() === 'xover';
                    if (isXover) {
                        const matchesPin = tool.xoverPin ? tool.xoverPin.toLowerCase().includes(term) : false;
                        const matchesBox = tool.xoverBox ? tool.xoverBox.toLowerCase().includes(term) : false;
                        return matchesBasic || matchesPin || matchesBox;
                    }
                    if (tool.herramienta === 'Elevador SDE') {
                        const matchesDiam = tool.sdeDiametro ? tool.sdeDiametro.toLowerCase().includes(term) : false;
                        const matchesCap = tool.sdeCapacidad ? tool.sdeCapacidad.toLowerCase().includes(term) : false;
                        return matchesBasic || matchesDiam || matchesCap;
                    }
                    return matchesBasic;
                });
            });
        }

        // Filtro por vencidas o por vencer en pozo (asignadas)
        if (filterExpiredInWell || filterExpiringSoonInWell) {
            result = result.filter(op => {
                const opTools = op.assignedTools.map(id => tools.find(t => t.id === id)).filter((t): t is Tool => !!t);
                return opTools.some(tool => {
                    if (filterExpiredInWell && tool.status.text === 'Vencida') return true;
                    if (filterExpiringSoonInWell && tool.status.text === 'Por Vencer') return true;
                    return false;
                });
            });
        }

        return result;
    }, [operations, tools, assignedToolSearch, selectedToolName, filterExpiredInWell, filterExpiringSoonInWell]);

    const toggleOperationExpansion = (operationId: string) => {
        setCollapsedOperations(prev => {
            const newSet = new Set(prev);
            if (newSet.has(operationId)) {
                newSet.delete(operationId);
            } else {
                newSet.add(operationId);
            }
            return newSet;
        });
    };


    const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

    const toolToEquipmentMap = useMemo(() => {
        const map = new Map<string, string>();
        operations.forEach(op => {
            if (op.assignedTools && Array.isArray(op.assignedTools)) {
                op.assignedTools.forEach(toolId => {
                    map.set(toolId, op.equipo);
                });
            }
        });
        return map;
    }, [operations]);

    const sortedAndFilteredTools = useMemo(() => {
        const statusOrder: { [key in Tool['status']['text']]: number } = {
            'Vencida': 1,
            'Por Vencer': 2,
            'Vigente': 3,
            'N/A': 4
        };

        return tools
            .filter(tool => {
                if (statusFilter !== 'all' && tool.status.text !== statusFilter) {
                    return false;
                }
                if (searchTerm) {
                    const term = searchTerm.toLowerCase();
                    const matchesBasic = tool.herramienta.toLowerCase().includes(term) || 
                        tool.serial.toLowerCase().includes(term);
                    const isXover = tool.herramienta?.toLowerCase() === 'xover';
                    if (isXover) {
                        const matchesPin = tool.xoverPin ? tool.xoverPin.toLowerCase().includes(term) : false;
                        const matchesBox = tool.xoverBox ? tool.xoverBox.toLowerCase().includes(term) : false;
                        if (!matchesBasic && !matchesPin && !matchesBox) {
                            return false;
                        }
                    } else if (tool.herramienta === 'Elevador SDE') {
                        const matchesDiam = tool.sdeDiametro ? tool.sdeDiametro.toLowerCase().includes(term) : false;
                        const matchesCap = tool.sdeCapacidad ? tool.sdeCapacidad.toLowerCase().includes(term) : false;
                        if (!matchesBasic && !matchesDiam && !matchesCap) {
                            return false;
                        }
                    } else if (!matchesBasic) {
                        return false;
                    }
                }
                return true;
            })
            .sort((a, b) => {
                const orderA = statusOrder[a.status.text];
                const orderB = statusOrder[b.status.text];
                if (orderA !== orderB) {
                    return orderA - orderB;
                }
                // Secondary sort by next inspection date (ascending, nulls last)
                const dateA = a.nextInspectionDate?.getTime() || Infinity;
                const dateB = b.nextInspectionDate?.getTime() || Infinity;
                if (orderA === 4) return 0; // Don't sort N/A by date
                return dateA - dateB;
            });
    }, [tools, statusFilter, searchTerm]);

    return (
        <div className="flex h-full overflow-hidden">
            {/* Left Sidebar */}
            <aside className={`relative transition-all duration-300 flex flex-col ${isSidebarCollapsed ? 'w-12 md:w-20' : 'w-72 sm:w-80 md:w-1/3 md:max-w-sm'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full shrink-0 z-10`}>
                <button 
                    onClick={toggleSidebar} 
                    className="absolute -right-4 top-8 z-20 bg-white dark:bg-gray-700 h-8 w-8 rounded-full shadow-md flex items-center justify-center border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-transform transform hover:scale-110 cursor-pointer"
                    aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {isSidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                </button>
                
                {/* Wrapper for all sidebar content to handle visibility */}
                <div className={`flex flex-col flex-grow min-h-0 transition-opacity duration-200 ${isSidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <div className="p-3 md:p-4 border-b border-gray-200 dark:border-gray-700">
                        <h1 className="text-lg md:text-xl font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">Herramientas</h1>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">Arrastra a una operación</p>
                    </div>
                    <div className="p-3 md:p-4 space-y-3 md:space-y-4">
                        <div className="relative">
                            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar por nombre o serial..." className="w-full text-xs md:text-sm p-2 pl-9 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:placeholder-gray-400" />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"><SearchIcon /></div>
                        </div>
                        <div>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full text-xs md:text-sm p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                                <option value="all">Todas las herramientas</option>
                                <option value="Por Vencer">Por Vencer</option>
                                <option value="Vencida">Vencidas</option>
                            </select>
                        </div>
                        <div className="text-center p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md">
                            <p className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-200">
                                Total en Campo: <span className="text-blue-600 dark:text-blue-400 font-bold ml-1">{assignedToolIds.size}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex-grow overflow-y-auto custom-scrollbar p-3 md:p-4">
                        {sortedAndFilteredTools.length > 0 ? (
                            sortedAndFilteredTools.map(tool => (
                                <ToolItem 
                                    key={tool.id} 
                                    tool={tool}
                                    isAssigned={assignedToolIds.has(tool.id)}
                                    assignedToEquipment={toolToEquipmentMap.get(tool.id)}
                                    onSelect={() => {}} 
                                    onNotificationClick={handleOpenNotificationModal}
                                    userRole={userRole}
                                    onDragAttemptFailed={onShowAlert}
                                    onXoverDetailsClick={handleOpenXoverDetails}
                                />
                            ))
                        ) : (
                            <div className="text-center text-gray-500 dark:text-gray-400 p-8">No se encontraron herramientas.</div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Right Content */}
            <main className="flex-grow p-4 md:p-6 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 md:gap-4 mb-4 md:mb-6">
                    <div>
                        <h2 className="text-lg md:text-xl font-bold text-gray-850 dark:text-gray-100">Control de Operaciones</h2>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Asigna herramientas arrastrándolas a cada equipo</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
                        <div className="relative flex-grow sm:flex-grow-0 sm:w-72">
                            <input
                                type="text"
                                value={assignedToolSearch}
                                onChange={e => setAssignedToolSearch(e.target.value)}
                                placeholder="Buscar herramientas asignadas..."
                                className="w-full text-sm p-2 pl-9 pr-8 bg-white dark:bg-gray-800 border border-gray-350 dark:border-gray-605 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:placeholder-gray-400 text-gray-800 dark:text-gray-100 transition-all font-medium"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-550">
                                <SearchIcon />
                            </div>
                            {assignedToolSearch && (
                                <button
                                    onClick={() => setAssignedToolSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <div className="flex-grow sm:flex-grow-0 sm:w-56">
                            <select
                                value={selectedToolName}
                                onChange={e => setSelectedToolName(e.target.value)}
                                className="w-full text-sm p-2 bg-white dark:bg-gray-800 border border-gray-350 dark:border-gray-605 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-gray-800 dark:text-gray-100 transition-all font-medium cursor-pointer"
                            >
                                <option value="all">🔧 Todas las herramientas</option>
                                {toolNames.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={() => generateOperationsReport(operations, tools)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md hover:shadow-lg transition duration-200 flex items-center justify-center gap-2 text-sm whitespace-nowrap cursor-pointer"
                        >
                            <ClipboardListIcon />
                            Generar informe de op.
                        </button>
                        {userRole === 'Admin' && (
                            <button
                                onClick={() => handleOpenOperationForm(null)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md hover:shadow-lg transition duration-200 flex items-center justify-center gap-2 text-sm whitespace-nowrap"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Nueva Operación
                            </button>
                        )}
                    </div>
                </div>

                {/* Checkboxes para filtrar alertas en pozo */}
                <div className="flex flex-wrap items-center gap-4 mb-6 p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-150 dark:border-gray-700/55">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Alertas en Pozo:</span>
                    <label className="flex items-center gap-2 text-xs md:text-sm font-semibold text-red-650 dark:text-red-400 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={filterExpiredInWell}
                            onChange={e => setFilterExpiredInWell(e.target.checked)}
                            className="rounded border-gray-300 dark:border-gray-600 text-red-650 focus:ring-red-500 h-4 w-4 bg-white dark:bg-gray-700 cursor-pointer"
                        />
                        <span>⚠️ Vencidas en Pozo</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs md:text-sm font-semibold text-yellow-600 dark:text-yellow-450 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={filterExpiringSoonInWell}
                            onChange={e => setFilterExpiringSoonInWell(e.target.checked)}
                            className="rounded border-gray-300 dark:border-gray-600 text-yellow-500 focus:ring-yellow-500 h-4 w-4 bg-white dark:bg-gray-700 cursor-pointer"
                        />
                        <span>⏳ Por Vencer en Pozo</span>
                    </label>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
                    {operations.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-800/50 rounded-lg p-8 min-h-[400px]">
                            <PlaceholderIcon />
                            <h2 className="text-2xl font-semibold text-gray-600 dark:text-gray-300">Área de Operaciones</h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">No hay operaciones creadas aún.</p>
                            {userRole === 'Admin' && (
                                <button
                                    onClick={() => handleOpenOperationForm(null)}
                                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl shadow transition duration-200 text-sm"
                                >
                                    Crear Operación
                                </button>
                            )}
                        </div>
                    ) : filteredOperations.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-800/50 rounded-lg p-8 min-h-[400px]">
                            <div className="text-gray-400 dark:text-gray-500 mb-2">
                                <SearchIcon />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300">Sin Resultados</h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">Ninguna operación tiene asignada una herramienta que coincida con la búsqueda o con los filtros de alertas seleccionados.</p>
                            <button
                                onClick={() => {
                                    setAssignedToolSearch('');
                                    setSelectedToolName('all');
                                    setFilterExpiredInWell(false);
                                    setFilterExpiringSoonInWell(false);
                                }}
                                className="mt-4 bg-gray-150 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600/80 text-gray-700 dark:text-gray-200 font-semibold py-2 px-4 rounded-xl shadow transition duration-200 text-sm cursor-pointer"
                            >
                                Limpiar Filtros
                            </button>
                        </div>
                    ) : (
                        filteredOperations.map(op => {
                            let cardsTools = op.assignedTools.map(id => tools.find(t => t.id === id)).filter((t): t is Tool => !!t);
                            if (selectedToolName !== 'all') {
                                cardsTools = cardsTools.filter(t => t.herramienta === selectedToolName);
                            }
                            if (assignedToolSearch.trim()) {
                                const term = assignedToolSearch.toLowerCase().trim();
                                cardsTools = cardsTools.filter(t => 
                                    t.herramienta.toLowerCase().includes(term) || 
                                    t.serial.toLowerCase().includes(term)
                                );
                            }
                            if (filterExpiredInWell || filterExpiringSoonInWell) {
                                cardsTools = cardsTools.filter(tool => {
                                    if (filterExpiredInWell && tool.status.text === 'Vencida') return true;
                                    if (filterExpiringSoonInWell && tool.status.text === 'Por Vencer') return true;
                                    return false;
                                });
                            }

                            return (
                                <OperationCard 
                                    key={op.id}
                                    operation={op}
                                    assignedToolsData={cardsTools}
                                    onDropTool={handleDropToolOnOperation}
                                    onRemoveTool={handleRemoveToolFromOperation}
                                    userRole={userRole}
                                    isExpanded={selectedToolName !== 'all' || assignedToolSearch.trim() !== '' || filterExpiredInWell || filterExpiringSoonInWell || !collapsedOperations.has(op.id)}
                                    onToggleExpansion={() => toggleOperationExpansion(op.id)}
                                    onEditOperation={handleOpenOperationForm}
                                    onDeleteOperation={handleDeleteOperation}
                                    forceExpand={selectedToolName !== 'all' || assignedToolSearch.trim() !== '' || filterExpiredInWell || filterExpiringSoonInWell}
                                    onXoverDetailsClick={handleOpenXoverDetails}
                                />
                            );
                        })
                    )}
                </div>
            </main>

            {/* Read-Only Xover Characteristics Modal */}
            <XoverDetailsModal 
                isOpen={isXoverModalOpen} 
                onClose={handleCloseXoverDetails} 
                tool={xoverModalTool} 
            />
        </div>
    );
};

export default CanvasView;