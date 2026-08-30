
import React, { useState, useMemo, useEffect } from 'react';
import type { Tool, Role } from '../types';
import { generatePDFReport, ReportSortOption } from '../services/reportService';
import { PlusIcon, PencilIcon, TrashIcon, PdfIcon, SearchIcon, ChevronDownIcon, ChevronRightIcon, ArrowsExpandIcon, ArrowsCollapseIcon, HistoryIcon } from '../components/icons';
import Modal from '../components/Modal';
import InspectionTimelineModal from '../components/InspectionTimelineModal';

interface ToolManagementViewProps {
    tools: Tool[];
    handleOpenToolForm: (tool: Tool | null) => void;
    handleDeleteTool: (toolId: string) => void;
    userRole: Role | null;
}

const ToolManagementView: React.FC<ToolManagementViewProps> = ({ tools, handleOpenToolForm, handleDeleteTool, userRole }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isTimelineOpen, setIsTimelineOpen] = useState(false);

    const filteredTools = useMemo(() => {
        if (!searchTerm) {
            return tools;
        }
        const term = searchTerm.toLowerCase();
        return tools.filter(tool => {
            const matchesBasic = tool.serial.toLowerCase().includes(term) ||
                tool.herramienta.toLowerCase().includes(term);
            
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
    }, [tools, searchTerm]);

    const groupedTools = useMemo(() => {
        const groups: { [key: string]: Tool[] } = {};
        filteredTools.forEach(tool => {
            let key = tool.herramienta;
            if (tool.herramienta === 'Elevador SDE') {
                let diam = tool.sdeDiametro;
                if (!diam && tool.detalle) {
                    const capMatch = tool.detalle.match(/(100\s*TN|150\s*TN|250\s*TN)/i);
                    if (capMatch) {
                        const rest = tool.detalle.replace(capMatch[0], '').trim();
                        if (rest) diam = rest;
                    } else if (!tool.detalle.toLowerCase().includes('tn')) {
                        diam = tool.detalle.trim();
                    }
                }
                key = diam ? `Elevador SDE (${diam})` : 'Elevador SDE (Sin Diámetro)';
            }
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(tool);
        });
        
        return Object.keys(groups).sort().reduce((obj, key) => {
            obj[key] = groups[key];
            return obj;
        }, {} as { [key: string]: Tool[] });
    }, [filteredTools]);

    useEffect(() => {
        if (searchTerm) {
            setExpandedGroups(new Set(Object.keys(groupedTools)));
        }
    }, [searchTerm, groupedTools]);

    const toggleGroup = (groupName: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupName)) {
                next.delete(groupName);
            } else {
                next.add(groupName);
            }
            return next;
        });
    };
    
    const handleExpandAll = () => {
        setExpandedGroups(new Set(Object.keys(groupedTools)));
    };
    
    const handleCollapseAll = () => {
        setExpandedGroups(new Set());
    };

    const handleGenerateReport = (sortBy: ReportSortOption) => {
        generatePDFReport(tools, sortBy);
        setIsReportModalOpen(false);
    };

    const getStatusChipClass = (status: Tool['status']) => {
        switch(status.color) {
            case 'green': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
            case 'yellow': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
            case 'red': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200';
        }
    };
    
    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        try {
            const [year, month, day] = dateString.split('-');
            if (!year || !month || !day) return dateString;
            return `${day}/${month}/${year}`;
        } catch (e) {
            return dateString;
        }
    };

    const getGroupSummary = (groupTools: Tool[]) => {
        const total = groupTools.length;
        const expired = groupTools.filter(t => t.status.text === 'Vencida').length;
        const expiring = groupTools.filter(t => t.status.text === 'Por Vencer').length;
        
        return { total, expired, expiring };
    };

    return (
        <div className="h-full flex flex-col bg-gray-100 dark:bg-gray-900">
            <header className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-900 flex flex-col md:flex-row justify-between md:items-center gap-3 px-3 md:px-8 py-3 md:py-4 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                <h1 className="text-xl md:text-3xl font-bold text-gray-800 dark:text-white">Gestión de Herramientas</h1>
                <div className="flex flex-wrap items-center gap-2 md:gap-4">
                    <div className="relative flex-grow sm:flex-grow-0">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Buscar..."
                            className="w-full p-1.5 md:p-2 pl-8 md:pl-10 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs md:text-sm text-gray-900 dark:text-white dark:placeholder-gray-400"
                        />
                        <div className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"><SearchIcon /></div>
                    </div>
                    <button onClick={handleExpandAll} title="Expandir Todo" className="hidden sm:inline-flex p-2 text-gray-600 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                        <ArrowsExpandIcon />
                    </button>
                    <button onClick={handleCollapseAll} title="Contraer Todo" className="hidden sm:inline-flex p-2 text-gray-600 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                        <ArrowsCollapseIcon />
                    </button>
                    <button 
                        onClick={() => setIsTimelineOpen(true)}
                        title="Ver línea de tiempo de inspecciones"
                        className="hidden sm:inline-flex bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-1.5 px-3 md:py-2 md:px-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition duration-300 items-center justify-center gap-1.5 md:gap-2 text-xs md:text-sm font-semibold shadow-sm"
                    >
                        <HistoryIcon /> <span>Línea de Tiempo</span>
                    </button>
                    <button 
                        onClick={() => setIsReportModalOpen(true)}
                        title="Generar Informe PDF"
                        className="bg-green-600 text-white py-1.5 px-3 md:py-2 md:px-4 rounded-lg hover:bg-green-700 transition duration-300 flex items-center justify-center gap-1.5 md:gap-2 text-xs md:text-sm font-semibold shadow-md inline-flex">
                        <PdfIcon /> <span>Reporte</span>
                    </button>
                    <button 
                        onClick={() => handleOpenToolForm(null)} 
                        className="bg-blue-600 text-white py-1.5 px-3 md:py-2 md:px-4 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center gap-1.5 md:gap-2 text-xs md:text-sm font-semibold shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed inline-flex"
                        disabled={userRole !== 'Admin'}
                    >
                        <PlusIcon /> <span>Nuevo</span>
                    </button>
                </div>
            </header>
            
            <div className="flex-grow overflow-y-auto custom-scrollbar p-3 md:p-8">
                <div className="space-y-4">
                    {Object.keys(groupedTools).length > 0 ? (
                        Object.entries(groupedTools).map(([groupName, groupTools]: [string, Tool[]]) => {
                            const isExpanded = expandedGroups.has(groupName);
                            const summary = getGroupSummary(groupTools);
                            
                            return (
                                <div key={groupName} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
                                    <button 
                                        onClick={() => toggleGroup(groupName)}
                                        className="w-full flex items-center justify-between p-4 cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors select-none text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="text-gray-500 dark:text-gray-400">
                                                {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">{groupName}</h3>
                                            <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-100 text-xs px-2 py-0.5 rounded-full font-mono font-bold">
                                                {summary.total}
                                            </span>
                                        </div>
                                        <div className="flex gap-1.5 md:gap-2 text-xs md:text-sm">
                                            {summary.expired > 0 && (
                                                <span className="text-red-700 dark:text-red-300 font-bold bg-red-100 dark:bg-red-900/40 px-1.5 py-0.5 md:px-2 md:py-0.5 rounded border border-red-200 dark:border-red-800 text-center flex items-center justify-center">
                                                    {summary.expired} <span className="hidden sm:inline ml-1">Vencida{summary.expired > 1 ? 's' : ''}</span><span className="sm:hidden ml-1">V</span>
                                                </span>
                                            )}
                                            {summary.expiring > 0 && (
                                                <span className="text-yellow-700 dark:text-yellow-300 font-bold bg-yellow-100 dark:bg-yellow-900/40 px-1.5 py-0.5 md:px-2 md:py-0.5 rounded border border-yellow-200 dark:border-yellow-800 text-center flex items-center justify-center">
                                                    {summary.expiring} <span className="hidden sm:inline ml-1">Por Vencer</span><span className="sm:hidden ml-1">PV</span>
                                                </span>
                                            )}
                                            {summary.expired === 0 && summary.expiring === 0 && (
                                                <span className="text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                                                    <i className="fas fa-check-circle"></i> OK
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                    
                                    {isExpanded && (
                                        <div className="overflow-x-auto border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                <thead className="bg-gray-100 dark:bg-gray-900">
                                                    <tr>
                                                        <th scope="col" className="hidden md:table-cell px-3 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Detalle / Tipo</th>
                                                        <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Serial</th>
                                                        <th scope="col" className="hidden md:table-cell px-3 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Última Insp.</th>
                                                        <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Próxima Insp.</th>
                                                        <th scope="col" className="hidden md:table-cell px-3 md:px-6 py-2 md:py-3 text-center text-[10px] md:text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Días</th>
                                                        <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-center text-[10px] md:text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                                                        <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-right text-[10px] md:text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                    {groupTools.map(tool => (
                                                        <tr key={tool.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                            <td className="hidden md:table-cell px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                                                                {tool.herramienta?.toLowerCase() === 'xover' ? (
                                                                    <div>
                                                                        <div className="text-xs md:text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 flex-wrap">
                                                                            <span>Xover</span>
                                                                            {tool.xoverCuelloPesca && <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-[9px] md:text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">C. Pesca</span>}
                                                                        </div>
                                                                        <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-0.5">
                                                                            <div><span className="font-semibold text-gray-400 dark:text-gray-500">P/B:</span> {tool.xoverPin || '—'} / {tool.xoverBox || '—'}</div>
                                                                            <div><span className="font-semibold text-gray-400 dark:text-gray-500">Largo:</span> {tool.xoverLargo ? `${tool.xoverLargo}"` : '—'}</div>
                                                                        </div>
                                                                    </div>
                                                                ) : tool.herramienta === 'Elevador SDE' ? (
                                                                    <div>
                                                                        <div className="text-xs md:text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 flex-wrap">
                                                                            {tool.sdeDiametro && (
                                                                                <span className="text-blue-600 dark:text-blue-400 font-bold">
                                                                                    {tool.sdeDiametro}
                                                                                </span>
                                                                            )}
                                                                            <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] md:text-xs px-2 py-0.5 rounded font-semibold border border-indigo-200 dark:border-indigo-800/50">
                                                                                {tool.sdeCapacidad || tool.detalle || '-'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                            Handling tool
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <div className="text-xs md:text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 flex-wrap">
                                                                            <span>{tool.detalle || '-'}</span>
                                                                            {tool.herramienta === 'Reaction Bracket' && tool.reactionBracketOption && (
                                                                                <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-[9px] md:text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                                                                                    {tool.reactionBracketOption}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {tool.herramienta === 'Cabeza Elevadora' && tool.cabezaElevadoraConexion ? (
                                                                            <div className="text-[10px] md:text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">Conexión: {tool.cabezaElevadoraConexion}</div>
                                                                        ) : (
                                                                            <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">{tool.tipo}</div>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </td>
                                                            <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-600 dark:text-gray-300 font-mono">{tool.serial}</td>
                                                            <td className="hidden md:table-cell px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-600 dark:text-gray-300">
                                                                {tool.ultimaInspeccionParcial || tool.ultimaInspeccionFull ? (
                                                                    <div className="text-[10px] md:text-xs space-y-1">
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="font-semibold text-blue-600 dark:text-blue-400">P:</span>
                                                                            <span>{formatDate(tool.ultimaInspeccionParcial || '')}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="font-semibold text-purple-600 dark:text-purple-400">F:</span>
                                                                            <span>{formatDate(tool.ultimaInspeccionFull || '')}</span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    tool.herramienta?.toLowerCase() === 'xover' ? (
                                                                        <div className="space-y-1">
                                                                            <div className="text-xs md:text-sm">{formatDate(tool.ultimaInspeccion)}</div>
                                                                            <div className="flex flex-wrap gap-1 mt-1 justify-start">
                                                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider ${tool.xoverBoxInspected ? 'bg-green-100 text-green-800 dark:bg-green-950/45 dark:text-green-300 border border-green-200/30' : 'bg-gray-150 text-gray-400 dark:bg-gray-700/55'}`}>
                                                                                    Box {tool.xoverBoxInspected ? '✓' : '✗'}
                                                                                </span>
                                                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider ${tool.xoverPinInspected ? 'bg-green-100 text-green-800 dark:bg-green-950/45 dark:text-green-300 border border-green-200/30' : 'bg-gray-150 text-gray-400 dark:bg-gray-700/55'}`}>
                                                                                    Pin {tool.xoverPinInspected ? '✓' : '✗'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-xs md:text-sm">{formatDate(tool.ultimaInspeccion)}</div>
                                                                    )
                                                                )}
                                                            </td>
                                                            <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-600 dark:text-gray-300">
                                                                {tool.ultimaInspeccionParcial || tool.ultimaInspeccionFull ? (
                                                                    <div className="text-[10px] md:text-xs space-y-1">
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="font-semibold text-blue-600 dark:text-blue-400">P:</span>
                                                                            <span className={tool.statusParcial?.color === 'red' ? 'text-red-600 font-bold' : tool.statusParcial?.color === 'yellow' ? 'text-yellow-600 font-bold' : ''}>
                                                                                {tool.nextInspectionParcialDate ? tool.nextInspectionParcialDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric'}) : 'N/A'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="font-semibold text-purple-600 dark:text-purple-400">F:</span>
                                                                            <span className={tool.statusFull?.color === 'red' ? 'text-red-600 font-bold' : tool.statusFull?.color === 'yellow' ? 'text-yellow-600 font-bold' : ''}>
                                                                                {tool.nextInspectionFullDate ? tool.nextInspectionFullDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric'}) : 'N/A'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-xs md:text-sm">
                                                                        {tool.nextInspectionDate ? tool.nextInspectionDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric'}) : 'N/A'}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="hidden md:table-cell px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-center text-xs md:text-sm font-bold">
                                                                {tool.ultimaInspeccionParcial || tool.ultimaInspeccionFull ? (
                                                                    <div className="text-[10px] md:text-xs space-y-1 text-center font-bold">
                                                                        <div>
                                                                            <span className="font-semibold text-blue-600 dark:text-blue-400">P:</span>{' '}
                                                                            {tool.daysUntilParcialExpiry !== null && tool.daysUntilParcialExpiry !== undefined ? (
                                                                                <span className={tool.statusParcial?.color === 'red' ? 'text-red-600' : tool.statusParcial?.color === 'yellow' ? 'text-yellow-600' : 'text-green-600'}>{tool.daysUntilParcialExpiry}d</span>
                                                                            ) : '-'}
                                                                        </div>
                                                                        <div>
                                                                            <span className="font-semibold text-purple-600 dark:text-purple-400">F:</span>{' '}
                                                                            {tool.daysUntilFullExpiry !== null && tool.daysUntilFullExpiry !== undefined ? (
                                                                                <span className={tool.statusFull?.color === 'red' ? 'text-red-600' : tool.statusFull?.color === 'yellow' ? 'text-yellow-600' : 'text-green-600'}>{tool.daysUntilFullExpiry}d</span>
                                                                            ) : '-'}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-center font-bold text-xs md:text-sm">
                                                                        {tool.status.text === 'Por Vencer' && tool.daysUntilExpiry !== null && tool.daysUntilExpiry !== undefined ? (
                                                                            <span className="text-yellow-600 dark:text-yellow-400">{tool.daysUntilExpiry}</span>
                                                                        ) : (
                                                                            <span className="text-gray-400 dark:text-gray-600">-</span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-center">
                                                                <span className={`px-2 md:px-3 py-0.5 md:py-1 inline-flex text-[10px] md:text-xs leading-5 font-bold rounded-full border ${getStatusChipClass(tool.status)}`}>
                                                                    {tool.status.text}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-right text-xs md:text-sm font-medium">
                                                                <button onClick={() => handleOpenToolForm(tool)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3 md:mr-4 disabled:opacity-50 disabled:cursor-not-allowed" title="Editar" disabled={userRole !== 'Admin'}><PencilIcon /></button>
                                                                <button onClick={() => handleDeleteTool(tool.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed" title="Eliminar" disabled={userRole !== 'Admin'}><TrashIcon /></button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                            {searchTerm ? 'No se encontraron herramientas que coincidan con la búsqueda.' : 'No hay herramientas cargadas en el sistema.'}
                        </div>
                    )}
                </div>
            </div>
            
            <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)}>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md w-full max-w-md">
                    <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100">Opciones de Informe PDF</h2>
                    <div className="space-y-3">
                        <button
                            onClick={() => handleGenerateReport('status')}
                            className="w-full text-left p-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition border border-gray-200 dark:border-gray-600"
                        >
                            <p className="font-semibold text-gray-800 dark:text-gray-100">Por Estado (Prioridad)</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Informe acotado. Incluye solo herramientas vencidas y por vencer, ordenadas por urgencia.</p>
                        </button>
                        <button
                            onClick={() => handleGenerateReport('tipo')}
                            className="w-full text-left p-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition border border-gray-200 dark:border-gray-600"
                        >
                            <p className="font-semibold text-gray-800 dark:text-gray-100">Por Tipo de Herramienta</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Informe acotado. Incluye solo herramientas vencidas y por vencer, agrupadas por tipo.</p>
                        </button>
                        <button
                            onClick={() => handleGenerateReport('herramienta')}
                            className="w-full text-left p-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition border border-gray-200 dark:border-gray-600"
                        >
                            <p className="font-semibold text-gray-800 dark:text-gray-100">Por Nombre de Herramienta</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Informe acotado. Incluye solo herramientas vencidas y por vencer, ordenadas alfabéticamente por nombre.</p>
                        </button>
                        <button
                            onClick={() => handleGenerateReport('informe-categorizado')}
                            className="w-full text-left p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition border border-blue-200 dark:border-blue-800"
                        >
                            <p className="font-semibold text-gray-800 dark:text-gray-100">Informe Categorizado (Mantenimiento, Handling, CRT)</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Informe detallafo con categorías predefinidas por hoja.</p>
                        </button>
                    </div>
                    <div className="mt-8 flex justify-end">
                        <button onClick={() => setIsReportModalOpen(false)} className="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 transition">Cancelar</button>
                    </div>
                </div>
            </Modal>
            
            <InspectionTimelineModal 
                isOpen={isTimelineOpen} 
                onClose={() => setIsTimelineOpen(false)} 
                tools={tools} 
            />
        </div>
    );
};

export default ToolManagementView;