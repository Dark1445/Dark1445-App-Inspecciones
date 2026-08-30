
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Personnel, PersonnelEvent, Role, Course } from '../types';
import { getDiagramDayStatus } from '../utils/dateUtils';
import { SearchIcon, PencilIcon, ChevronLeftIcon, ChevronRightIcon, EyeIcon, EyeSlashIcon, PlusIcon } from '../components/icons';
import Modal from '../components/Modal';

interface DiagramaViewProps {
    personnel: Personnel[];
    courses: Course[];
    handleOpenPersonnelForm: (personnel: Personnel | null) => void;
    userRole: Role | null;
}

const EVENT_STYLES: { [key in Exclude<PersonnelEvent['type'], 'Franco'>]: string } = {
    'Operación': 'bg-orange-500 text-white',
    'Vacaciones': 'bg-green-500 text-white',
    'Compensatorio': 'bg-yellow-500 text-black',
    'Enfermedad': 'bg-purple-500 text-white',
};
const FRANCO_STYLE = 'bg-blue-600 text-white';

const DiagramaView: React.FC<DiagramaViewProps> = ({ personnel, courses, handleOpenPersonnelForm, userRole }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewDate, setViewDate] = useState(new Date());
    const [isHiddenModalOpen, setIsHiddenModalOpen] = useState(false);
    const [sliderValue, setSliderValue] = useState(new Date().getDate());
    const [hiddenPersonnelIds, setHiddenPersonnelIds] = useState<Set<string>>(() => {
        try {
            const item = window.localStorage.getItem('hiddenPersonnelIds');
            return item ? new Set(JSON.parse(item)) : new Set();
        } catch (error) {
            console.error("Failed to parse hidden personnel from localStorage", error);
            return new Set();
        }
    });

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const todayCellRef = useRef<HTMLTableCellElement>(null);

    useEffect(() => {
        try {
            window.localStorage.setItem('hiddenPersonnelIds', JSON.stringify(Array.from(hiddenPersonnelIds)));
        } catch (error) {
            console.error("Failed to save hidden personnel to localStorage", error);
        }
    }, [hiddenPersonnelIds]);

    const handleHidePersonnel = (personnelId: string) => {
        setHiddenPersonnelIds(prev => new Set(prev).add(personnelId));
    };

    const handleUnhidePersonnel = (personnelId: string) => {
        setHiddenPersonnelIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(personnelId);
            return newSet;
        });
    };

    const handlePreviousMonth = () => {
        setViewDate(current => new Date(current.getFullYear(), current.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(current => new Date(current.getFullYear(), current.getMonth() + 1, 1));
    };

    const dates = useMemo(() => {
        const dateArray: Date[] = [];
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            dateArray.push(new Date(year, month, i));
        }
        return dateArray;
    }, [viewDate]);

    const gridDays = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        
        let startOffset = firstDayOfMonth.getDay() - 1;
        if (startOffset < 0) {
            startOffset = 6; 
        }

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysArray: { date: Date; dayNum: number; isPadding: boolean }[] = [];

        for (let i = 0; i < startOffset; i++) {
            daysArray.push({ date: new Date(), dayNum: 0, isPadding: true });
        }

        for (let i = 1; i <= daysInMonth; i++) {
            daysArray.push({
                date: new Date(year, month, i),
                dayNum: i,
                isPadding: false
            });
        }

        return daysArray;
    }, [viewDate]);

    useEffect(() => {
        if (todayCellRef.current && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const todayCell = todayCellRef.current;
            const containerWidth = container.clientWidth;
            const todayCellLeft = todayCell.offsetLeft;
            const todayCellWidth = todayCell.offsetWidth;
            const scrollLeft = todayCellLeft - (containerWidth / 2) + (todayCellWidth / 2);
            container.scrollLeft = scrollLeft;
        }
    }, [dates]);

    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const day = parseInt(e.target.value);
        setSliderValue(day);
        
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const ths = container.querySelectorAll('thead th');
            const targetTh = ths[day] as HTMLTableCellElement;
            if (targetTh) {
                const containerWidth = container.clientWidth;
                const targetLeft = targetTh.offsetLeft;
                const targetWidth = targetTh.offsetWidth;
                const scrollLeft = targetLeft - (containerWidth / 2) + (targetWidth / 2);
                container.scrollTo({ left: scrollLeft, behavior: 'auto' });
            }
        }
    };

    const handleScroll = () => {
        if (scrollTimeoutRef.current) return;

        scrollTimeoutRef.current = setTimeout(() => {
            if (scrollContainerRef.current) {
                const container = scrollContainerRef.current;
                const scrollLeft = container.scrollLeft;
                const containerWidth = container.clientWidth;
                const centerPosition = scrollLeft + (containerWidth / 2);

                const ths = container.querySelectorAll('thead th');
                let closestDay = 1;
                let minDistance = Infinity;

                for (let i = 1; i < ths.length; i++) {
                    const th = ths[i] as HTMLTableCellElement;
                    const thCenter = th.offsetLeft + (th.offsetWidth / 2);
                    const distance = Math.abs(thCenter - centerPosition);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestDay = i;
                    }
                }
                setSliderValue(closestDay);
            }
            scrollTimeoutRef.current = null;
        }, 100);
    };

    const filteredPersonnel = useMemo(() => {
        return personnel.filter(p =>
            !hiddenPersonnelIds.has(p.id) &&
            `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [personnel, searchTerm, hiddenPersonnelIds]);
    
    const hiddenPersonnelList = useMemo(() => {
        return personnel.filter(p => hiddenPersonnelIds.has(p.id))
            .sort((a,b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));
    }, [personnel, hiddenPersonnelIds]);


    const groupedPersonnel = useMemo(() => {
        const groups: { [key: string]: Personnel[] } = {};
        filteredPersonnel.forEach(p => {
            let key = p.sector || 'Sin Sector';
            if (p.sector === 'Jerarquico') {
                key = `Jerarquico (${p.diagramType || '10x5'})`;
            }
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(p);
        });

        const customPersonnelOrder: { [key: string]: number } = {
            'Martínez, Eric': 1, 'Maldonado, Nicolas': 2, 'Huenchupan, Daian': 3,
            'Furlon, Jonatan': 1, 'Canosa, Gonzalo': 2,
        };
        for (const sector in groups) {
            groups[sector].sort((a, b) => {
                const nameA = `${a.lastName}, ${a.firstName}`;
                const nameB = `${b.lastName}, ${b.firstName}`;
                const orderA = customPersonnelOrder[nameA];
                const orderB = customPersonnelOrder[nameB];
                if (orderA !== undefined && orderB !== undefined) return orderA - orderB;
                if (orderA !== undefined) return -1;
                if (orderB !== undefined) return 1;
                return nameA.localeCompare(nameB);
            });
        }
        
        const sectorOrder = ['ODS', 'Convencional', 'Mantenimiento', 'Laboratorio', 'Jerarquico (10x5)', 'Jerarquico (5x2)', 'Sin Sector'];
        return Object.entries(groups).sort((a, b) => {
            const indexA = sectorOrder.indexOf(a[0]);
            const indexB = sectorOrder.indexOf(b[0]);
            return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB);
        });
    }, [filteredPersonnel]);

    const getCellContent = (person: Personnel, date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        for (const event of person.events) {
            if (dateStr >= event.startDate && dateStr <= event.endDate) {
                return { text: event.type.charAt(0).toUpperCase(), style: EVENT_STYLES[event.type], title: event.type };
            }
        }
        const diagramStatus = getDiagramDayStatus(person.diagramStartDate, date, person.diagramType);
        if (diagramStatus === 'Franco') {
            return { text: 'F', style: FRANCO_STYLE, title: 'Franco' };
        }
        return { text: '', style: 'bg-white dark:bg-gray-800', title: 'Día de diagrama' };
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    };

    return (
        <div className="p-2 md:p-4 h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
            <header className="flex flex-col lg:flex-row justify-between lg:items-center mb-3 md:mb-4 flex-shrink-0 gap-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-4">
                    <h1 className="text-lg md:text-2xl font-bold truncate">Diagrama de Personal R&M</h1>
                    <div className="flex items-center justify-between sm:justify-start gap-2 bg-white dark:bg-gray-800 p-1.5 md:p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <button onClick={handlePreviousMonth} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" aria-label="Mes anterior"><ChevronLeftIcon /></button>
                        <div className="flex flex-col items-center shrink-0">
                            <span className="font-semibold w-24 md:w-32 text-center capitalize text-xs md:text-sm">{viewDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</span>
                            <input 
                                type="range" 
                                min="1" 
                                max={dates.length} 
                                value={sliderValue} 
                                onChange={handleSliderChange}
                                className="w-20 md:w-24 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 mt-1 accent-blue-600"
                                title="Deslizar días"
                            />
                        </div>
                        <button onClick={handleNextMonth} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" aria-label="Mes siguiente"><ChevronRightIcon /></button>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-grow sm:flex-grow-0">
                        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar persona..." className="w-full text-xs md:text-sm sm:w-48 md:w-64 p-2 pl-9 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 focus:outline-none" />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><SearchIcon /></div>
                    </div>
                    {userRole === 'Admin' && (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button 
                                onClick={() => handleOpenPersonnelForm(null)} 
                                className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-2 rounded-md text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm transition duration-300 cursor-pointer flex-1 sm:flex-initial whitespace-nowrap"
                            >
                                <PlusIcon /> <span>Nuevo</span>
                            </button>
                            <button 
                                onClick={() => setIsHiddenModalOpen(true)}
                                disabled={hiddenPersonnelList.length === 0}
                                className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2.5 py-2 rounded-md text-xs md:text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex-1 sm:flex-initial whitespace-nowrap">
                                <EyeIcon /> 
                                <span>Ocultos ({hiddenPersonnelList.length})</span>
                            </button>
                        </div>
                    )}
                    <div className="flex items-center gap-x-2 gap-y-1 text-[10px] md:text-xs flex-wrap md:ml-2">
                        <span className="flex items-center gap-1"><span className="h-3 w-3 bg-orange-500 rounded-sm"></span>O: Operación</span>
                        <span className="flex items-center gap-1"><span className="h-3 w-3 bg-blue-600 rounded-sm"></span>F: Franco</span>
                        <span className="flex items-center gap-1"><span className="h-3 w-3 bg-green-500 rounded-sm"></span>V: Vacaciones</span>
                        <span className="flex items-center gap-1"><span className="h-3 w-3 bg-yellow-500 rounded-sm"></span>C: Compensatorio</span>
                        <span className="flex items-center gap-1"><span className="h-3 w-3 bg-purple-500 rounded-sm"></span>E: Enfermedad</span>
                    </div>
                </div>
            </header>

            {/* Vista Escritorio (Escondido en pantallas < lg) */}
            <div ref={scrollContainerRef} onScroll={handleScroll} className="hidden lg:block flex-grow overflow-auto custom-scrollbar border border-gray-200 dark:border-gray-700 rounded-lg shadow-md">
                <table className="min-w-full text-center text-xs border-collapse">
                    <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10 shadow-sm">
                        <tr>
                            <th className="sticky left-0 bg-gray-100 dark:bg-gray-800 p-2 border-r border-b border-gray-200 dark:border-gray-700 min-w-[200px] z-20">Apellido y Nombre</th>
                            {dates.map(date => (
                                <th key={date.toISOString()} ref={isToday(date) ? todayCellRef : null} className={`p-1 border-b border-l border-gray-200 dark:border-gray-700 min-w-[40px] ${isToday(date) ? 'bg-red-500 text-white' : ''}`}>
                                    <div>{['D', 'L', 'M', 'M', 'J', 'V', 'S'][date.getDay()]}</div>
                                    <div className="font-bold text-base">{date.getDate()}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {groupedPersonnel.map(([groupName, people]) => (
                            <React.Fragment key={groupName}>
                                <tr className="bg-gray-200 dark:bg-gray-700/80">
                                    <td colSpan={dates.length + 1} className="sticky left-0 text-left p-1 pl-4 font-semibold text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700/80 border-r border-gray-200 dark:border-gray-700">Sector: {groupName}</td>
                                </tr>
                                {people.map(person => {
                                    const expired: string[] = [];
                                    const expiringSoon: string[] = [];
                                    
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);

                                    const thirtyDaysFromNow = new Date();
                                    thirtyDaysFromNow.setDate(today.getDate() + 30);
                                    thirtyDaysFromNow.setHours(0, 0, 0, 0);

                                    person.courses?.forEach(pc => {
                                        if (!pc.expiryDate) return;
                                        const expiryDate = new Date(pc.expiryDate + 'T00:00:00');
                                        if (isNaN(expiryDate.getTime())) return;
                                        
                                        const courseName = courses.find(c => c.id === pc.courseId)?.name || 'Curso';

                                        if (expiryDate < today) {
                                            expired.push(`${courseName} (vencido el ${pc.expiryDate})`);
                                        } else if (expiryDate <= thirtyDaysFromNow) {
                                            expiringSoon.push(`${courseName} (vence el ${pc.expiryDate})`);
                                        }
                                    });

                                    const tooltipParts: string[] = [];
                                    if (expired.length > 0) {
                                        tooltipParts.push("❌ CURSOS VENCIDOS:");
                                        expired.forEach(c => tooltipParts.push(`• ${c}`));
                                    }
                                    if (expiringSoon.length > 0) {
                                        if (tooltipParts.length > 0) tooltipParts.push("");
                                        tooltipParts.push("🕒 CURSOS POR VENCER (30 DÍAS):");
                                        expiringSoon.forEach(c => tooltipParts.push(`• ${c}`));
                                    }
                                    
                                    const tooltipText = tooltipParts.length > 0
                                        ? tooltipParts.join('\n')
                                        : "Cursos al día / Vigentes";

                                    const nameColorClass = expired.length > 0
                                        ? 'text-red-600 dark:text-red-400 font-bold'
                                        : expiringSoon.length > 0
                                            ? 'text-yellow-600 dark:text-yellow-500 font-bold'
                                            : 'text-gray-900 dark:text-gray-100';

                                    return (
                                        <tr key={person.id} className="group">
                                            <td className="sticky left-0 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700/50 p-2 border-r border-b border-gray-200 dark:border-gray-700 text-left font-medium flex justify-between items-center z-10">
                                                <div className="relative group/tooltip inline-block cursor-help" title={tooltipText}>
                                                    <span className={`${nameColorClass} hover:underline`}>
                                                        {person.lastName}, {person.firstName}
                                                    </span>
                                                    {(expired.length > 0 || expiringSoon.length > 0) && (
                                                        <div className="pointer-events-none absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block bg-gray-900 dark:bg-gray-950 text-white text-[11px] rounded-lg p-3 shadow-xl border border-gray-700/80 z-50 min-w-[260px] max-w-[320px] whitespace-normal font-normal">
                                                            {expired.length > 0 && (
                                                                <div className="mb-2">
                                                                    <div className="text-red-400 font-bold mb-1">🔴 Vencidos:</div>
                                                                    <ul className="list-disc pl-4 space-y-0.5 text-gray-300">
                                                                        {expired.map((c, idx) => <li key={idx}>{c}</li>)}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                            {expiringSoon.length > 0 && (
                                                                <div>
                                                                    <div className="text-yellow-400 font-bold mb-1">🟡 Por Vencer (30d):</div>
                                                                    <ul className="list-disc pl-4 space-y-0.5 text-gray-300">
                                                                        {expiringSoon.map((c, idx) => <li key={idx}>{c}</li>)}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                            <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-950"></div>
                                                        </div>
                                                    )}
                                                </div>
                                                {userRole === 'Admin' && (
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleHidePersonnel(person.id)} className="text-gray-400 hover:text-red-500 text-xs cursor-pointer" title="Ocultar del diagrama"><EyeSlashIcon/></button>
                                                        <button onClick={() => handleOpenPersonnelForm(person)} className="text-gray-400 hover:text-blue-500 text-xs cursor-pointer" title="Editar"><PencilIcon/></button>
                                                    </div>
                                                )}
                                            </td>
                                            {dates.map(date => {
                                                const cell = getCellContent(person, date);
                                                return <td key={date.toISOString()} title={cell.title} className={`p-2 border-b border-l border-gray-200 dark:border-gray-700 font-bold transition-colors ${cell.style} ${isToday(date) ? 'outline outline-1 outline-red-500 -outline-offset-1' : ''}`}>{cell.text}</td>;
                                            })}
                                        </tr>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
                {groupedPersonnel.length === 0 && (<div className="p-8 text-center text-gray-500">No se encontró personal con los filtros aplicados.</div>)}
            </div>

            {/* Vista Móvil: Listado de tarjetas de personal con calendario mensual integrado */}
            <div className="lg:hidden flex-grow overflow-y-auto custom-scrollbar space-y-6 pb-6 pr-1">
                {groupedPersonnel.map(([groupName, people]) => (
                    <div key={groupName} className="space-y-3">
                        <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider pl-1 border-l-2 border-blue-500 ml-1">
                            Sector: {groupName}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-1">
                            {people.map(person => {
                                const expired: string[] = [];
                                const expiringSoon: string[] = [];
                                
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);

                                const thirtyDaysFromNow = new Date();
                                thirtyDaysFromNow.setDate(today.getDate() + 30);
                                thirtyDaysFromNow.setHours(0, 0, 0, 0);

                                person.courses?.forEach(pc => {
                                    if (!pc.expiryDate) return;
                                    const expiryDate = new Date(pc.expiryDate + 'T00:00:00');
                                    if (isNaN(expiryDate.getTime())) return;
                                    
                                    const courseName = courses.find(c => c.id === pc.courseId)?.name || 'Curso';

                                    if (expiryDate < today) {
                                        expired.push(`${courseName} (vencido el ${pc.expiryDate})`);
                                    } else if (expiryDate <= thirtyDaysFromNow) {
                                        expiringSoon.push(`${courseName} (vence el ${pc.expiryDate})`);
                                    }
                                });

                                const nameColorClass = expired.length > 0
                                    ? 'text-red-600 dark:text-red-400 font-black'
                                    : expiringSoon.length > 0
                                        ? 'text-yellow-600 dark:text-yellow-500 font-bold'
                                        : 'text-gray-900 dark:text-gray-100';

                                return (
                                    <div key={person.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-all space-y-3">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="min-w-0">
                                                <h3 className={`${nameColorClass} text-sm font-bold truncate`}>
                                                    {person.lastName}, {person.firstName}
                                                </h3>
                                                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Diagrama: {person.diagramType || 'Sin asignar'}</p>
                                            </div>
                                            {userRole === 'Admin' && (
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <button onClick={() => handleHidePersonnel(person.id)} className="text-gray-400 hover:text-red-500 p-1.5 text-sm cursor-pointer rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Ocultar del diagrama"><EyeSlashIcon/></button>
                                                    <button onClick={() => handleOpenPersonnelForm(person)} className="text-gray-400 hover:text-blue-500 p-1.5 text-sm cursor-pointer rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Editar"><PencilIcon/></button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Estado de Capacitaciones y Cursos (Mobile Friendly) */}
                                        {(expired.length > 0 || expiringSoon.length > 0) && (
                                            <div className="text-[10px] p-2 bg-red-50/50 dark:bg-red-950/10 border border-red-100/40 dark:border-red-900/20 rounded-lg space-y-1.5">
                                                {expired.length > 0 && (
                                                    <div>
                                                        <div className="text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                                                            <span>🔴 Cursos vencidos ({expired.length}):</span>
                                                        </div>
                                                        <ul className="list-disc pl-4 space-y-0.5 text-gray-500 dark:text-gray-400">
                                                            {expired.map((c, i) => <li key={i}>{c}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                                {expiringSoon.length > 0 && (
                                                    <div>
                                                        <div className="text-yellow-600 dark:text-yellow-500 font-bold flex items-center gap-1">
                                                            <span>🟡 Cursos por vencer ({expiringSoon.length}):</span>
                                                        </div>
                                                        <ul className="list-disc pl-4 space-y-0.5 text-gray-500 dark:text-gray-400">
                                                            {expiringSoon.map((c, i) => <li key={i}>{c}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Calendario Estilo Cuadrícula de 7 Columnas */}
                                        <div className="pt-1">
                                            <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-extrabold text-gray-400 dark:text-gray-500 uppercase mb-1">
                                                <div>Lun</div>
                                                <div>Mar</div>
                                                <div>Mié</div>
                                                <div>Jue</div>
                                                <div>Vie</div>
                                                <div>Sáb</div>
                                                <div>Dom</div>
                                            </div>
                                            <div className="grid grid-cols-7 gap-1">
                                                {gridDays.map((day, dIdx) => {
                                                    if (day.isPadding) {
                                                        return <div key={`pad-${dIdx}`} className="aspect-square bg-gray-50/40 dark:bg-gray-800/20 rounded-lg"></div>;
                                                    }

                                                    const cell = getCellContent(person, day.date);
                                                    const dayIsToday = isToday(day.date);

                                                    return (
                                                        <div 
                                                            key={day.date.toISOString()}
                                                            title={`${day.date.toLocaleDateString('es-ES')}: ${cell.title}`}
                                                            className={`aspect-square flex flex-col items-center justify-center rounded-lg font-bold relative transition-colors ${cell.style} ${dayIsToday ? 'outline outline-2 outline-red-500 z-10' : ''}`}
                                                        >
                                                            <span className="text-[10px] md:text-sm">{day.dayNum}</span>
                                                            {cell.text && (
                                                                <span className="text-[8px] absolute bottom-0.5 font-extrabold opacity-95">{cell.text}</span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
                {groupedPersonnel.length === 0 && (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-805 rounded-xl border border-gray-200 dark:border-gray-700/50">
                        No se encontró personal con los filtros aplicados.
                    </div>
                )}
            </div>
            
            <Modal isOpen={isHiddenModalOpen} onClose={() => setIsHiddenModalOpen(false)}>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md w-full max-w-lg max-h-[80vh] flex flex-col">
                    <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Personal Oculto</h2>
                    <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
                        {hiddenPersonnelList.length > 0 ? (
                            <ul className="space-y-2">
                                {hiddenPersonnelList.map(person => (
                                    <li key={person.id} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                                        <span className="font-medium">{person.lastName}, {person.firstName}</span>
                                        <button 
                                            onClick={() => handleUnhidePersonnel(person.id)}
                                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 flex items-center gap-1 text-sm font-semibold"
                                            title="Volver a mostrar en el diagrama"
                                        >
                                            <EyeIcon /> Mostrar
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">No hay personal oculto.</p>
                        )}
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button onClick={() => setIsHiddenModalOpen(false)} className="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 transition">Cerrar</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
export default DiagramaView;