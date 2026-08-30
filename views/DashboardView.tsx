import React, { useState, useMemo } from 'react';
import type { Tool, Operation, Personnel, Course, Vehicle, Status } from '../types';
import { 
    calculateAge, 
    calculateDiagramStatus, 
    getPersonnelCourseStatus, 
    getDiagramDayStatus 
} from '../utils/dateUtils';

interface DashboardViewProps {
    tools: Tool[];
    operations: Operation[];
    personnel: Personnel[];
    courses: Course[];
    vehicles: Vehicle[];
    onNavigate?: (view: 'Dashboard' | 'Canvas' | 'Tools' | 'Maintenance' | 'Diagrama' | 'Vehicles' | 'Settings') => void;
    allowedViews?: string[];
}

const DashboardView: React.FC<DashboardViewProps> = ({
    tools,
    operations,
    personnel,
    courses,
    vehicles,
    onNavigate,
    allowedViews,
}) => {
    // Sector filter for overall dashboard
    const [selectedSector, setSelectedSector] = useState<string>('Todos');

    // Get list of sectors for filter
    const sectors = useMemo(() => {
        const set = new Set<string>();
        personnel.forEach(p => { if (p.sector) set.add(p.sector); });
        return ['Todos', ...Array.from(set).sort()];
    }, [personnel]);

    // Filter tools based on selected sector (matched by operations -> assigned tools, or show all tools)
    // For tools and vehicles, sector filter is optional but we can filter personnel and operations by sector!
    // Let's filter personnel by sector if selected.
    const filteredPersonnel = useMemo(() => {
        if (selectedSector === 'Todos') return personnel;
        return personnel.filter(p => p.sector === selectedSector);
    }, [personnel, selectedSector]);

    // Helper to render small navigation buttons on cards
    const renderGoToButton = (targetView: string, titleStr: string = "Ver sección") => {
        if (!onNavigate || (allowedViews && !allowedViews.includes(targetView))) return null;
        return (
            <button
                onClick={() => onNavigate(targetView as any)}
                title={titleStr}
                className="text-[11px] font-semibold px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700/50 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white dark:hover:text-white text-blue-600 dark:text-blue-400 transition-all duration-200 flex items-center justify-center gap-1 shadow-sm hover:shadow-md active:scale-95 cursor-pointer ml-auto"
            >
                <span>Ver de cerca</span>
                <i className="fas fa-chevron-right text-[8px]"></i>
            </button>
        );
    };

    // Filter operations based on personnel sector? 
    // To keep it simple and accurate, selectedSector filters personnel widgets, while we keep overall overview metrics easily accessible.

    // ----------------------------------------
    // TOOL METRICS
    // ----------------------------------------
    const toolMetrics = useMemo(() => {
        const total = tools.length;
        const vigente = tools.filter(t => t.status.text === 'Vigente').length;
        const porVencer = tools.filter(t => t.status.text === 'Por Vencer').length;
        const vencida = tools.filter(t => t.status.text === 'Vencida').length;
        const na = tools.filter(t => t.status.text === 'N/A').length;

        // Group tools by tool types to see distribution
        const typeDistribution: { [key: string]: number } = {};
        tools.forEach(t => {
            const key = t.tipo || 'Sin Tipo';
            typeDistribution[key] = (typeDistribution[key] || 0) + 1;
        });

        // Critical Tools: Expired or Expiring in less than 30 days, sorted by days left
        const criticalTools = [...tools]
            .filter(t => t.status.text === 'Vencida' || t.status.text === 'Por Vencer')
            .sort((a, b) => {
                const daysA = a.daysUntilExpiry ?? 999;
                const daysB = b.daysUntilExpiry ?? 999;
                return daysA - daysB;
            })
            .slice(0, 5);

        return { total, vigente, porVencer, vencida, na, typeDistribution, criticalTools };
    }, [tools]);

    // ----------------------------------------
    // OPERATION METRICS
    // ----------------------------------------
    const opMetrics = useMemo(() => {
        const total = operations.length;
        const operando = operations.filter(o => o.estado === 'Operando').length;
        const programada = operations.filter(o => o.estado === 'Programada').length;
        const terminaron = operations.filter(o => o.estado === 'Terminaron').length;
        const cancelada = operations.filter(o => o.estado === 'Op. Cancelada').length;

        // Operadoras active counts
        const operadoras: { [key: string]: number } = {};
        operations.forEach(o => {
            if (o.estado === 'Operando') {
                const key = o.operadora || 'Desconocida';
                operadoras[key] = (operadoras[key] || 0) + 1;
            }
        });

        // Yacimientos active counts
        const yacimientos: { [key: string]: number } = {};
        operations.forEach(o => {
            if (o.estado === 'Operando') {
                const key = o.yacimiento || 'Desconocio';
                yacimientos[key] = (yacimientos[key] || 0) + 1;
            }
        });

        // Assigned vs Unassigned tools
        const assignedToolIds = new Set<string>();
        operations.forEach(o => {
            if (o.estado === 'Operando' && o.assignedTools) {
                o.assignedTools.forEach(id => assignedToolIds.add(id));
            }
        });

        const activeAssignedToolsCount = assignedToolIds.size;
        const unassignedToolsCount = Math.max(0, tools.length - activeAssignedToolsCount);

        return { 
            total, 
            operando, 
            programada, 
            terminaron, 
            cancelada, 
            operadoras, 
            yacimientos,
            activeAssignedToolsCount,
            unassignedToolsCount
        };
    }, [operations, tools]);

    // ----------------------------------------
    // PERSONNEL METRICS
    // ----------------------------------------
    const personnelMetrics = useMemo(() => {
        const total = filteredPersonnel.length;
        
        // Today's Date
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        let workingCount = 0;
        let francoCount = 0;
        let vacacionesCount = 0;
        let enfermedadCount = 0;
        let compensatorioCount = 0;
        let operacionEventCount = 0;

        filteredPersonnel.forEach(p => {
            // 1. Check Events for Today
            const activeEvent = p.events?.find(e => {
                return todayStr >= e.startDate && todayStr <= e.endDate;
            });

            if (activeEvent) {
                switch(activeEvent.type) {
                    case 'Vacaciones': vacacionesCount++; break;
                    case 'Enfermedad': enfermedadCount++; break;
                    case 'Compensatorio': compensatorioCount++; break;
                    case 'Operación': operacionEventCount++; break;
                }
            } else {
                // 2. Check Diagram Status if no active event
                const diagramStatus = getDiagramDayStatus(p.diagramStartDate, today, p.diagramType);
                if (diagramStatus === 'Work') {
                    workingCount++;
                } else if (diagramStatus === 'Franco') {
                    francoCount++;
                } else {
                    workingCount++; // Default to active diagram or work
                }
            }
        });

        const workingTotal = workingCount + operacionEventCount;
        const unavailableTotal = vacacionesCount + enfermedadCount + compensatorioCount + francoCount;

        // Course states
        let courseVigente = 0;
        let coursePorVencer = 0;
        let courseVencido = 0;

        filteredPersonnel.forEach(p => {
            const status = getPersonnelCourseStatus(p);
            if (status.text === 'Vigente') courseVigente++;
            else if (status.text === 'Por Vencer') coursePorVencer++;
            else if (status.text === 'Vencida') courseVencido++;
        });

        // Find critical course renewals
        const criticalCourses: { personName: string; courseName: string; expiry: string; status: Status }[] = [];
        filteredPersonnel.forEach(p => {
            p.courses.forEach(pc => {
                const courseInfo = courses.find(c => c.id === pc.courseId);
                const expiryDateStr = pc.expiryDate;
                if (!expiryDateStr) return;

                const expiryDate = new Date(expiryDateStr + 'T00:00:00');
                const now = new Date();
                now.setHours(0,0,0,0);
                const limit = new Date();
                limit.setDate(now.getDate() + 45); // critical in 45 days

                if (expiryDate < limit) {
                    let text: Status['text'] = 'Vigente';
                    let color: Status['color'] = 'green';
                    if (expiryDate < now) {
                        text = 'Vencida';
                        color = 'red';
                    } else {
                        text = 'Por Vencer';
                        color = 'yellow';
                    }
                    
                    criticalCourses.push({
                        personName: `${p.lastName}, ${p.firstName}`,
                        courseName: courseInfo?.name || 'Curso Desconocido',
                        expiry: expiryDateStr,
                        status: { text, color }
                    });
                }
            });
        });

        // Sort by expiration date ascending
        criticalCourses.sort((a,b) => a.expiry.localeCompare(b.expiry));

        return {
            total,
            workingTotal,
            workingCount,
            francoCount,
            vacacionesCount,
            enfermedadCount,
            compensatorioCount,
            operacionEventCount,
            unavailableTotal,
            courseVigente,
            coursePorVencer,
            courseVencido,
            criticalCourses: criticalCourses.slice(0, 5)
        };
    }, [filteredPersonnel, courses]);

    // ----------------------------------------
    // VEHICLE METRICS
    // ----------------------------------------
    const vehicleMetrics = useMemo(() => {
        const total = vehicles.length;
        const vtvVigente = vehicles.filter(v => v.vtvStatus?.text === 'Vigente').length;
        const vtvPorVencer = vehicles.filter(v => v.vtvStatus?.text === 'Por Vencer').length;
        const vtvVencido = vehicles.filter(v => v.vtvStatus?.text === 'Vencida').length;

        // Pending Novedades (maintenance remarks) count
        let totalNovedadesPendientes = 0;
        const vehiclesWithNovedades: { unidad: string; patente: string; count: number; novedades: string[] }[] = [];

        vehicles.forEach(v => {
            const pendingList = v.novedades?.filter(n => n.estado === 'Pendiente') || [];
            if (pendingList.length > 0) {
                totalNovedadesPendientes += pendingList.length;
                vehiclesWithNovedades.push({
                    unidad: v.numeroUnidad,
                    patente: v.patente,
                    count: pendingList.length,
                    novedades: pendingList.map(p => p.descripcion)
                });
            }
        });

        // Upcoming VTV alerts
        const upcomingVTV = [...vehicles]
            .sort((a, b) => (a.vtvVencimiento || '9999').localeCompare(b.vtvVencimiento || '9999'))
            .slice(0, 5);

        return {
            total,
            vtvVigente,
            vtvPorVencer,
            vtvVencido,
            totalNovedadesPendientes,
            vehiclesWithNovedades,
            upcomingVTV
        };
    }, [vehicles]);


    // Helper to format date nicely
    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        try {
            const [year, month, day] = dateStr.split('-');
            return `${day}/${month}/${year}`;
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="p-6 md:p-8 h-full overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-gray-900">
            {/* Header / Filter Toolbar */}
            <header className="flex flex-col lg:flex-row justify-between lg:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                        <span className="text-blue-600 dark:text-blue-400">
                            <i className="fas fa-chart-pie"></i>
                        </span>
                        Panel de Métricas y Control
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Resumen en tiempo real del estado de activos, personal, habilitaciones y vehículos.
                    </p>
                </div>

                {/* Filter Selector */}
                <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm self-start lg:self-auto">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Sector:</label>
                    <div className="flex flex-wrap gap-1">
                        {sectors.map(sec => (
                            <button
                                key={sec}
                                onClick={() => setSelectedSector(sec)}
                                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                                    selectedSector === sec
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                {sec}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* QUICK STATS CARDS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* 1. heramientas card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Herramientas Totales</p>
                            <h3 className="text-3xl font-extrabold mt-2 text-gray-800 dark:text-gray-100">{toolMetrics.total}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                            <i className="fas fa-wrench text-xl"></i>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center text-xs gap-2">
                        <div className="flex gap-3">
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                {toolMetrics.vigente} Vigentes
                            </span>
                            {toolMetrics.vencida > 0 && (
                                <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 animate-pulse">
                                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                    {toolMetrics.vencida} Vencidas
                                </span>
                            )}
                        </div>
                        {renderGoToButton('Tools', 'Ir a Herramientas')}
                    </div>
                </div>

                {/* 2. active operations card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Operaciones en Curso</p>
                            <h3 className="text-3xl font-extrabold mt-2 text-gray-800 dark:text-gray-100">{opMetrics.operando}</h3>
                        </div>
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <i className="fas fa-clipboard-list text-xl"></i>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center text-xs gap-2">
                        <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
                            <span className="text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                {opMetrics.programada} Prog.
                            </span>
                            <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
                                {opMetrics.activeAssignedToolsCount} asignadas
                            </span>
                        </div>
                        {renderGoToButton('Canvas', 'Ir a Canvas')}
                    </div>
                </div>

                {/* 3. personnel available card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Personal Hoy</p>
                            <h3 className="text-3xl font-extrabold mt-2 text-gray-800 dark:text-gray-100">
                                {personnelMetrics.workingTotal} / {personnelMetrics.total}
                            </h3>
                        </div>
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <i className="fas fa-users text-xl"></i>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center text-xs gap-2">
                        <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                {Math.round((personnelMetrics.workingTotal / (personnelMetrics.total || 1)) * 100)}% de guardia
                            </span>
                            <span className="text-amber-500 font-medium font-mono">
                                {personnelMetrics.francoCount} franco
                            </span>
                        </div>
                        {renderGoToButton('Diagrama', 'Ir a Diagrama')}
                    </div>
                </div>

                {/* 4. vehicle novedades card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Novedades de Vehículos</p>
                            <h3 className={`text-3xl font-extrabold mt-2 ${
                                vehicleMetrics.totalNovedadesPendientes > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-800 dark:text-gray-100'
                            }`}>{vehicleMetrics.totalNovedadesPendientes}</h3>
                        </div>
                        <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
                            <i className="fas fa-truck text-xl"></i>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center text-xs gap-2">
                        <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
                            {vehicleMetrics.vtvVencido > 0 ? (
                                <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 animate-pulse">
                                    {vehicleMetrics.vtvVencido} VTV Vencidas!
                                </span>
                            ) : (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                        VTVs al día
                                    </span>
                            )}
                            <span className="text-amber-500 dark:text-amber-400 font-medium">
                                {vehicleMetrics.vtvPorVencer} por vencer
                            </span>
                        </div>
                        {renderGoToButton('Vehicles', 'Ir a Vehículos')}
                    </div>
                </div>
            </div>

            {/* MAIN METRIC SECTIONS (2 columns layout) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                
                {/* COLUMN 1 CARD 1: HERRAMIENTAS - INSPECTIONS AND CRITICAL EXPIRATIONS */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                <i className="fas fa-calendar-check text-emerald-500"></i>
                                Estado de Inspecciones de Herramientas
                            </h2>
                            {renderGoToButton('Tools', 'Ir a Herramientas')}
                        </div>
                        
                        {/* Progress Ring / Segment Bar */}
                        <div className="mb-6">
                            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 block mb-2 uppercase">Proporción de Estado de Certificación:</span>
                            <div className="h-6 w-full rounded-full bg-gray-100 dark:bg-gray-700 flex overflow-hidden shadow-inner">
                                {toolMetrics.vigente > 0 && (
                                    <div 
                                        style={{ width: `${(toolMetrics.vigente / toolMetrics.total) * 100}%` }} 
                                        className="bg-emerald-500 h-full flex items-center justify-center text-[10px] text-white font-bold transition-all hover:opacity-90"
                                        title={`Vigente: ${toolMetrics.vigente} (${Math.round((toolMetrics.vigente / toolMetrics.total) * 100)}%)`}
                                    >
                                        {Math.round((toolMetrics.vigente / toolMetrics.total) * 100)}%
                                    </div>
                                )}
                                {toolMetrics.porVencer > 0 && (
                                    <div 
                                        style={{ width: `${(toolMetrics.porVencer / toolMetrics.total) * 100}%` }} 
                                        className="bg-amber-400 h-full flex items-center justify-center text-[10px] text-gray-900 font-bold transition-all hover:opacity-90"
                                        title={`Por Vencer: ${toolMetrics.porVencer} (${Math.round((toolMetrics.porVencer / toolMetrics.total) * 100)}%)`}
                                    >
                                        {Math.round((toolMetrics.porVencer / toolMetrics.total) * 100)}%
                                    </div>
                                )}
                                {toolMetrics.vencida > 0 && (
                                    <div 
                                        style={{ width: `${(toolMetrics.vencida / toolMetrics.total) * 100}%` }} 
                                        className="bg-rose-500 h-full flex items-center justify-center text-[10px] text-white font-bold transition-all hover:opacity-90 animate-pulse"
                                        title={`Vencida: ${toolMetrics.vencida} (${Math.round((toolMetrics.vencida / toolMetrics.total) * 100)}%)`}
                                    >
                                        {Math.round((toolMetrics.vencida / toolMetrics.total) * 100)}%
                                    </div>
                                )}
                                {toolMetrics.na > 0 && (
                                    <div 
                                        style={{ width: `${(toolMetrics.na / toolMetrics.total) * 100}%` }} 
                                        className="bg-gray-400 h-full flex items-center justify-center text-[10px] text-white font-bold transition-all hover:opacity-90"
                                        title={`N/A: ${toolMetrics.na} (${Math.round((toolMetrics.na / toolMetrics.total) * 100)}%)`}
                                    >
                                        {Math.round((toolMetrics.na / toolMetrics.total) * 100)}%
                                    </div>
                                )}
                            </div>

                            {/* Legend labels */}
                            <div className="grid grid-cols-4 gap-2 mt-3 text-[11px] text-center font-medium text-gray-500 dark:text-gray-400">
                                <div className="flex items-center justify-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span> Vigente ({toolMetrics.vigente})</div>
                                <div className="flex items-center justify-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block"></span> Por Vencer ({toolMetrics.porVencer})</div>
                                <div className="flex items-center justify-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block"></span> Vencida ({toolMetrics.vencida})</div>
                                <div className="flex items-center justify-center gap-1"><span className="w-2.5 h-2.5 rounded bg-gray-400 inline-block"></span> N/A ({toolMetrics.na})</div>
                            </div>
                        </div>

                        {/* Critical Expirations Table */}
                        <div>
                            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 block mb-3 uppercase flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                                Próximos Vencimientos Críticos o Vencidos (Máx 5):
                            </span>
                            {toolMetrics.criticalTools.length === 0 ? (
                                <div className="text-center py-6 text-sm text-gray-400 dark:text-gray-500">
                                    No hay herramientas con vencimiento próximo. 👍
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700 text-xs">
                                        <thead>
                                            <tr className="text-gray-400 uppercase tracking-wider text-[10px]">
                                                <th className="py-2 text-left">Serial</th>
                                                <th className="py-2 text-left">Herramientas / Detalle</th>
                                                <th className="py-2 text-center">Expiración</th>
                                                <th className="py-2 text-right">Días Restantes</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {toolMetrics.criticalTools.map(t => (
                                                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                    <td className="py-2.5 font-bold font-mono text-gray-700 dark:text-gray-300">{t.serial}</td>
                                                    <td className="py-2.5">
                                                        <div className="font-medium text-gray-800 dark:text-gray-200">{t.herramienta}</div>
                                                        <div className="text-[10px] text-gray-400 dark:text-gray-500 truncate max-w-[150px]">{t.detalle}</div>
                                                    </td>
                                                    <td className="py-2.5 text-center">
                                                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                                            t.status.text === 'Vencida' 
                                                                ? 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400' 
                                                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400'
                                                        }`}>
                                                            {t.nextInspectionDate ? formatDate(t.nextInspectionDate.toISOString().split('T')[0]) : 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 text-right font-bold text-gray-900 dark:text-gray-100 font-mono">
                                                        {t.daysUntilExpiry === 0 ? (
                                                            <span className="text-red-600 dark:text-red-400">Vencida</span>
                                                        ) : (
                                                            <span className="text-amber-600 dark:text-amber-400">{t.daysUntilExpiry} d</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* COLUMN 1 CARD 2: OPERATIONS AND TOOL ASSIGNMENT */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                <i className="fas fa-satellite-dish text-indigo-500"></i>
                                Estado de Operaciones
                            </h2>
                            {renderGoToButton('Canvas', 'Ir a Canvas')}
                        </div>

                        {/* Operando, programadas etc stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl mb-6 text-center shadow-inner">
                            <div className="border-r border-gray-200 dark:border-gray-700 last:border-none">
                                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 block">Total</span>
                                <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{opMetrics.total}</span>
                            </div>
                            <div className="border-r border-gray-200 dark:border-gray-700 last:border-none">
                                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 block">Operando</span>
                                <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{opMetrics.operando}</span>
                            </div>
                            <div className="border-r border-gray-200 dark:border-gray-700 last:border-none">
                                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 block">Programada</span>
                                <span className="text-xl font-extrabold text-purple-600 dark:text-purple-400">{opMetrics.programada}</span>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 block">Terminadas</span>
                                <span className="text-xl font-extrabold text-gray-600 dark:text-gray-300">{opMetrics.terminaron}</span>
                            </div>
                        </div>

                        {/* Busiest Operadoras y Yacimientos */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 block mb-3 uppercase">Bases Operadoras Activas:</span>
                                {Object.keys(opMetrics.operadoras).length === 0 ? (
                                    <p className="text-xs text-gray-400 py-4 text-center">Sin operaciones activas.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {Object.entries(opMetrics.operadoras).map(([name, count]) => (
                                            <div key={name} className="flex justify-between items-center text-xs bg-gray-50 dark:bg-gray-700/30 p-2 rounded-lg">
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">{name}</span>
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 rounded font-bold">{count} op.</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 block mb-3 uppercase">Yacimientos Activos:</span>
                                {Object.keys(opMetrics.yacimientos).length === 0 ? (
                                    <p className="text-xs text-gray-400 py-4 text-center">Sin yacimientos activos.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {Object.entries(opMetrics.yacimientos).map(([name, count]) => (
                                            <div key={name} className="flex justify-between items-center text-xs bg-gray-50 dark:bg-gray-700/30 p-2 rounded-lg">
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">{name}</span>
                                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 rounded font-bold">{count} op.</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                        <span>Eficiencia de Uso de Activos:</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                            {opMetrics.activeAssignedToolsCount} de {tools.length} herramientas en despliegue operativo.
                        </span>
                    </div>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* COLUMN 2 CARD 1: PERSONNEL COMPLIANCE & AVAILABILITY */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                <i className="fas fa-user-shield text-amber-500"></i>
                                Disponibilidad de Personal {selectedSector !== 'Todos' && `(${selectedSector})`}
                            </h2>
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                <span className="text-xs font-semibold px-2 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400">Hoy</span>
                                {renderGoToButton('Diagrama', 'Ir a Diagrama')}
                            </div>
                        </div>

                        {/* Calendar availability segments */}
                        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-950/20">
                                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Activos (Trabajo)</p>
                                <p className="text-2xl font-extrabold mt-1 text-emerald-700 dark:text-emerald-300">{personnelMetrics.workingCount}</p>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-2.5 rounded-lg border border-blue-100 dark:border-blue-950/20">
                                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">En Operación</p>
                                <p className="text-2xl font-extrabold mt-1 text-blue-700 dark:text-blue-300">{personnelMetrics.operacionEventCount}</p>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-900/10 p-2.5 rounded-lg border border-amber-100 dark:border-amber-950/20">
                                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Franco</p>
                                <p className="text-2xl font-extrabold mt-1 text-amber-700 dark:text-amber-300">{personnelMetrics.francoCount}</p>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/10 p-2.5 rounded-lg border border-purple-100 dark:border-purple-950/20">
                                <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">Licencias/Vacac.</p>
                                <p className="text-2xl font-extrabold mt-1 text-purple-700 dark:text-purple-300">
                                    {personnelMetrics.vacacionesCount + personnelMetrics.enfermedadCount + personnelMetrics.compensatorioCount}
                                </p>
                            </div>
                        </div>

                        {/* Training compliance bar */}
                        <div className="mb-6">
                            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 block mb-2 uppercase">Habilitaciones y Cursos del Personal:</span>
                            <div className="h-4 w-full rounded-full bg-gray-100 dark:bg-gray-700 flex overflow-hidden">
                                {personnelMetrics.courseVigente > 0 && (
                                    <div 
                                        style={{ width: `${(personnelMetrics.courseVigente / (personnelMetrics.total || 1)) * 100}%` }} 
                                        className="bg-emerald-500 h-full"
                                        title={`Vigente: ${personnelMetrics.courseVigente}`}
                                    />
                                )}
                                {personnelMetrics.coursePorVencer > 0 && (
                                    <div 
                                        style={{ width: `${(personnelMetrics.coursePorVencer / (personnelMetrics.total || 1)) * 100}%` }} 
                                        className="bg-amber-400 h-full"
                                        title={`Por Vencer: ${personnelMetrics.coursePorVencer}`}
                                    />
                                )}
                                {personnelMetrics.courseVencido > 0 && (
                                    <div 
                                        style={{ width: `${(personnelMetrics.courseVencido / (personnelMetrics.total || 1)) * 100}%` }} 
                                        className="bg-rose-500 h-full animate-pulse"
                                        title={`Vencido: ${personnelMetrics.courseVencido}`}
                                    />
                                )}
                            </div>
                            <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-2 font-medium">
                                <span>Vigentes ({personnelMetrics.courseVigente})</span>
                                <span className="text-amber-500">Por Vencer ({personnelMetrics.coursePorVencer})</span>
                                <span className="text-rose-500 font-bold">Vencidos ({personnelMetrics.courseVencido})</span>
                            </div>
                        </div>

                        {/* Critical Courses Expiring list */}
                        <div>
                            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 block mb-3 uppercase flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                                Renovaciones Críticas de Cursos del Personal (Menos de 45 días):
                            </span>
                            {personnelMetrics.criticalCourses.length === 0 ? (
                                <p className="text-center py-4 text-xs text-gray-400 dark:text-gray-500">
                                    Todo el personal cuenta con sus cursos y licencias al día. 👍
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {personnelMetrics.criticalCourses.map((c, idx) => (
                                        <div 
                                            key={idx} 
                                            className="flex justify-between items-center text-xs p-2.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-5 dark:bg-gray-800/40"
                                        >
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-gray-200">{c.personName}</p>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400">{c.courseName}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    c.status.text === 'Vencida' 
                                                        ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400' 
                                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400'
                                                }`}>
                                                    Vence: {formatDate(c.expiry)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* COLUMN 2 CARD 2: VEHICLE HEALTH & LOG */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                <i className="fas fa-truck-monster text-rose-500"></i>
                                Estado Mecánico de la Flota de Vehículos
                            </h2>
                            {renderGoToButton('Vehicles', 'Ir a Vehículos')}
                        </div>

                        {/* VTV & Hidrogrua Status Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div className="bg-gray-5 dark:bg-gray-700/20 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">VTV de la Flota</span>
                                <div className="flex justify-between items-center mt-3">
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Vigente</div>
                                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{vehicleMetrics.vtvVigente}</div>
                                    </div>
                                    <div className="text-center px-2 border-l border-r border-gray-200 dark:border-gray-700">
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Por Vencer</div>
                                        <div className="text-lg font-bold text-amber-500">{vehicleMetrics.vtvPorVencer}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Vencida</div>
                                        <div className={`text-lg font-bold ${vehicleMetrics.vtvVencido > 0 ? 'text-rose-600 dark:text-rose-400 animate-pulse font-extrabold' : 'text-gray-500'}`}>{vehicleMetrics.vtvVencido}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-5 dark:bg-gray-700/20 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Seguridad & Novedades</span>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">
                                        Vehículos con novedad de falla pendiente registrada:
                                    </p>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Unidades en taller/falla:</span>
                                    <span className={`px-2.5 py-0.5 rounded font-bold text-xs ${
                                        vehicleMetrics.totalNovedadesPendientes > 0 
                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' 
                                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                                    }`}>
                                        {vehicleMetrics.vehiclesWithNovedades.length} unidades
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Listed Vehicle Novedades */}
                        <div>
                            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 block mb-3 uppercase">Detalle de Anomalías Activas en Flota:</span>
                            {vehicleMetrics.vehiclesWithNovedades.length === 0 ? (
                                <p className="text-center py-6 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/10 rounded-xl border border-emerald-100 dark:border-emerald-950/20">
                                    ✓ No hay novedades pendientes en ningún vehículo.
                                </p>
                            ) : (
                                <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                                    {vehicleMetrics.vehiclesWithNovedades.map((vn, idx) => (
                                        <div key={idx} className="bg-gray-50 dark:bg-gray-700/30 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300">
                                            <div className="flex justify-between font-bold mb-1">
                                                <span className="text-blue-600 dark:text-blue-400">Unidad N° {vn.unidad}</span>
                                                <span className="text-[10px] text-gray-400 uppercase tracking-widest">{vn.patente}</span>
                                            </div>
                                            <p className="text-gray-500 dark:text-gray-400 leading-relaxed pl-2 border-l-2 border-amber-400">
                                                {vn.novedades.join(', ')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DashboardView;
