import React, { useState, useMemo } from 'react';
import type { Vehicle, Role, Status } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon } from '../components/icons';

type SortableKeys = keyof Vehicle | 'vtvStatus' | 'hidrogruaStatus';

const SortableHeader: React.FC<{
    title: string;
    sortKey: SortableKeys;
    sortConfig: { key: SortableKeys | null; direction: 'ascending' | 'descending' };
    requestSort: (key: SortableKeys) => void;
    className?: string;
}> = ({ title, sortKey, sortConfig, requestSort, className }) => {
    const isSorted = sortConfig.key === sortKey;
    const directionIcon = isSorted ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : '↕';
    
    return (
        <th scope="col" className={`px-2 py-2 md:px-6 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${className}`}>
            <button onClick={() => requestSort(sortKey)} className="flex items-center gap-1 md:gap-2 hover:text-gray-700 dark:hover:text-gray-100 whitespace-nowrap">
                {title}
                <span className="text-gray-400">{directionIcon}</span>
            </button>
        </th>
    );
};

const VehiclesView: React.FC<{
    vehicles: Vehicle[];
    handleOpenVehicleForm: (vehicle: Vehicle | null) => void;
    handleDeleteVehicle: (vehicleId: string) => void;
    userRole: Role | null;
}> = ({ vehicles, handleOpenVehicleForm, handleDeleteVehicle, userRole }) => {
    
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys | null; direction: 'ascending' | 'descending' }>({ key: 'numeroUnidad', direction: 'ascending' });
    const [expandedVehicleIds, setExpandedVehicleIds] = useState<Record<string, boolean>>({});

    const toggleVehicleExpand = (id: string) => {
        setExpandedVehicleIds(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const sortedVehicles = useMemo(() => {
        let sortableItems = [...vehicles];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue: any = a[sortConfig.key as keyof Vehicle];
                let bValue: any = b[sortConfig.key as keyof Vehicle];
                
                if (sortConfig.key === 'vtvStatus' || sortConfig.key === 'hidrogruaStatus') {
                     const statusOrder: { [key: string]: number } = { 'Vencida': 1, 'Por Vencer': 2, 'Vigente': 3, 'N/A': 4 };
                     aValue = statusOrder[a[sortConfig.key]?.text || 'N/A'];
                     bValue = statusOrder[b[sortConfig.key]?.text || 'N/A'];
                }

                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
                
                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [vehicles, sortConfig]);

    const requestSort = (key: SortableKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getStatusChipClass = (status?: Status) => {
        if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200';
        switch(status.color) {
            case 'green': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'yellow': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'red': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200';
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        try {
            const [year, month, day] = dateString.split('-');
            if (!year || !month || !day) return dateString;
            return `${day}-${month}-${year}`;
        } catch (e) { return dateString; }
    };

    return (
        <div className="p-6 md:p-8 h-full overflow-y-auto custom-scrollbar">
            <header className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Gestión de Vehículos</h1>
                <button 
                    onClick={() => handleOpenVehicleForm(null)} 
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center gap-2 text-sm font-semibold shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={userRole !== 'Admin'}
                >
                    <PlusIcon /> <span>Nuevo Vehículo</span>
                </button>
            </header>
                {/* Vista Desktop y Tablet (md y mayores) */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <SortableHeader title="N° de Unidad" sortKey="numeroUnidad" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader title="Tipo" sortKey="tipo" sortConfig={sortConfig} requestSort={requestSort} className="hidden md:table-cell" />
                                <SortableHeader title="Patente" sortKey="patente" sortConfig={sortConfig} requestSort={requestSort} />
                                <th scope="col" className="px-2 py-2 md:px-6 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Último Service</th>
                                <SortableHeader title="Vencimiento VTV" sortKey="vtvVencimiento" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader title="Estado VTV" sortKey="vtvStatus" sortConfig={sortConfig} requestSort={requestSort} className="hidden md:table-cell text-center" />
                                <SortableHeader title="Vencimiento Hidrogrúa" sortKey="vencimientoHidrogrua" sortConfig={sortConfig} requestSort={requestSort} />
                                <th scope="col" className="hidden md:table-cell px-2 py-2 md:px-6 md:py-3 text-center text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rueda Auxilio</th>
                                <th scope="col" className="hidden md:table-cell px-2 py-2 md:px-6 md:py-3 text-center text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Novedades Status</th>
                                <th scope="col" className="px-2 py-2 md:px-6 md:py-3 text-right text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {sortedVehicles.map(vehicle => (
                                <tr key={vehicle.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-2 py-2 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100">{vehicle.numeroUnidad}</td>
                                    <td className="hidden md:table-cell px-2 py-2 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 dark:text-gray-300">{vehicle.tipo}</td>
                                    <td className="px-2 py-2 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 dark:text-gray-300 font-mono">{vehicle.patente}</td>
                                    <td className="px-2 py-2 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 dark:text-gray-300">
                                        {vehicle.ultimoServiceFecha 
                                            ? `${formatDate(vehicle.ultimoServiceFecha)} (${vehicle.ultimoServiceKm !== null ? vehicle.ultimoServiceKm.toLocaleString('es-ES') : 'N/A'} km)`
                                            : 'N/A'
                                        }
                                    </td>
                                    <td className="px-2 py-2 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 dark:text-gray-300">{formatDate(vehicle.vtvVencimiento)}</td>
                                    <td className="hidden md:table-cell px-2 py-2 md:px-6 md:py-4 whitespace-nowrap text-center">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusChipClass(vehicle.vtvStatus)}`}>
                                            {vehicle.vtvStatus.text}
                                        </span>
                                    </td>
                                    <td className="px-2 py-2 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm">
                                        {vehicle.tipo === 'Camion' ? (
                                            <div className="flex flex-col items-start">
                                                <span>{formatDate(vehicle.vencimientoHidrogrua || '')}</span>
                                                <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusChipClass(vehicle.hidrogruaStatus)}`}>
                                                    {vehicle.hidrogruaStatus?.text || 'N/A'}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 dark:text-gray-500">N/A</span>
                                        )}
                                    </td>
                                    <td className="hidden md:table-cell px-2 py-2 md:px-6 md:py-4 whitespace-nowrap text-center">
                                        {vehicle.ruedaAuxilio ? (
                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                                Sí
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                                                No
                                            </span>
                                        )}
                                    </td>
                                    <td className="hidden md:table-cell px-2 py-2 md:px-6 md:py-4 whitespace-nowrap text-center">
                                        {(() => {
                                            const pendingNovedades = vehicle.novedades?.filter(n => n.estado === 'Pendiente') || [];
                                            const hasPending = pendingNovedades.length > 0;
                                            
                                            if (hasPending) {
                                                return (
                                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                                                        Pendiente ({pendingNovedades.length})
                                                    </span>
                                                );
                                            } else {
                                                return (
                                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                                        Cerrado
                                                    </span>
                                                );
                                            }
                                        })()}
                                    </td>
                                    <td className="px-2 py-2 md:px-6 md:py-4 whitespace-nowrap text-right text-xs md:text-sm font-medium">
                                        <button onClick={() => handleOpenVehicleForm(vehicle)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-2 md:mr-4 disabled:opacity-50 disabled:cursor-not-allowed" title="Editar" disabled={userRole !== 'Admin'}><PencilIcon /></button>
                                        <button onClick={() => handleDeleteVehicle(vehicle.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed" title="Eliminar" disabled={userRole !== 'Admin'}><TrashIcon /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Vista Móvil (Menor a md): Lista de tarjetas expandibles */}
            <div className="md:hidden space-y-4">
                {sortedVehicles.map(vehicle => {
                    const isExpanded = !!expandedVehicleIds[vehicle.id];
                    const pendingNovedades = vehicle.novedades?.filter(n => n.estado === 'Pendiente') || [];
                    const hasPending = pendingNovedades.length > 0;

                    return (
                        <div key={vehicle.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                            {/* Cabecera de la Tarjeta */}
                            <button 
                                onClick={() => toggleVehicleExpand(vehicle.id)}
                                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50/75 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <div className="space-y-1.5 min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-bold text-blue-700 dark:text-blue-450 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-md border border-blue-100 dark:border-blue-900/60">
                                            Unidad {vehicle.numeroUnidad}
                                        </span>
                                        <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/60 px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-600/40">
                                            {vehicle.patente}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Tipo: <span className="font-bold text-gray-800 dark:text-gray-200">{vehicle.tipo}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 ml-2">
                                    <span className={`px-2.5 py-0.5 text-[10px] uppercase font-extrabold rounded-full ${getStatusChipClass(vehicle.vtvStatus)}`}>
                                        VTV: {vehicle.vtvStatus.text}
                                    </span>
                                    <div className="text-gray-400 dark:text-gray-500">
                                        {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                    </div>
                                </div>
                            </button>

                            {/* Detalle Expandible de la Unidad */}
                            {isExpanded && (
                                <div className="p-4 bg-gray-50/50 dark:bg-gray-900/10 border-t border-gray-150 dark:border-gray-700 space-y-3.5 text-xs animate-fadeIn">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="block text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold">Último Service</span>
                                            <span className="font-bold text-gray-800 dark:text-gray-200">
                                                {vehicle.ultimoServiceFecha 
                                                    ? `${formatDate(vehicle.ultimoServiceFecha)} (${vehicle.ultimoServiceKm !== null ? vehicle.ultimoServiceKm.toLocaleString('es-ES') : 'N/A'} km)`
                                                    : 'N/A'
                                                }
                                            </span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold">Vencimiento VTV</span>
                                            <span className="font-bold text-gray-800 dark:text-gray-200">{formatDate(vehicle.vtvVencimiento)}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="block text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold">Auxilio</span>
                                            {vehicle.ruedaAuxilio ? (
                                                <span className="px-2.5 py-0.5 inline-flex text-[10px] leading-5 font-bold rounded-full bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-305 border border-green-200/20 mt-1">
                                                    Sí disponible
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-0.5 inline-flex text-[10px] leading-5 font-bold rounded-full bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-305 border border-red-200/20 mt-1">
                                                    No disponible
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <span className="block text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold">Novedades</span>
                                            <div className="mt-1">
                                                {hasPending ? (
                                                    <span className="px-2.5 py-0.5 inline-flex text-[10px] leading-5 font-bold rounded-full bg-yellow-105 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-305 border border-yellow-250/20">
                                                        Pendiente ({pendingNovedades.length})
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-0.5 inline-flex text-[10px] leading-5 font-bold rounded-full bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-305 border border-green-200/20">
                                                        Cerrado
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {vehicle.tipo === 'Camion' && (
                                        <div className="border-t border-gray-150 dark:border-gray-700/50 pt-2.5">
                                            <span className="block text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold">Hidrogrúa</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="font-bold text-gray-800 dark:text-gray-200">Vence: {formatDate(vehicle.vencimientoHidrogrua || '')}</span>
                                                <span className={`px-2 py-0.5 inline-flex text-[10px] leading-4 font-bold rounded-full ${getStatusChipClass(vehicle.hidrogruaStatus)}`}>
                                                    {vehicle.hidrogruaStatus?.text || 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Botones de Acción */}
                                    <div className="flex justify-end items-center gap-3 pt-3 border-t border-gray-150 dark:border-gray-700">
                                        <button 
                                            onClick={() => handleOpenVehicleForm(vehicle)} 
                                            className="text-xs text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold flex items-center gap-1.5 p-1.5 px-3 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                                            title="Editar" 
                                            disabled={userRole !== 'Admin'}
                                        >
                                            <PencilIcon /> <span>Editar</span>
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteVehicle(vehicle.id)} 
                                            className="text-xs text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 font-bold flex items-center gap-1.5 p-1.5 px-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                                            title="Eliminar" 
                                            disabled={userRole !== 'Admin'}
                                        >
                                            <TrashIcon /> <span>Eliminar</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

             {vehicles.length === 0 && 
                <div className="text-center text-gray-500 dark:text-gray-400 p-8">
                    No hay vehículos para mostrar.
                </div>
             }
        </div>
    );
};

export default VehiclesView;