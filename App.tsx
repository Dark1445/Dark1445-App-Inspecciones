
import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Types
import type { Tool, Operation, Personnel, Course, User, Role, Vehicle } from './types';

// Services
import {
    initializeAirtable, testAirtableConnection,
    getTools, createTool, updateTool, deleteTool,
    getOperations, createOperation, updateOperation, deleteOperation,
    getPersonnel, createPersonnel, updatePersonnel, deletePersonnel,
    getCourses, createCourse, updateCourse, deleteCourse,
    getUsers, createUser, updateUser, deleteUser,
    getVehicles, createVehicle, updateVehicle, deleteVehicle
} from './services/airtableApiService';


// Views
import DashboardView from './views/DashboardView';
import CanvasView from './views/CanvasView';
import ToolManagementView from './views/ToolManagementView';
import DiagramaView from './views/DiagramaView';
import SettingsView from './views/SettingsView';
import VehiclesView from './views/VehiclesView';

// Components
import LoginScreen from './components/LoginScreen';
import ToolFormModal from './components/ToolFormModal';
import OperationFormModal from './components/OperationFormModal';
import NotificationFormModal from './components/NotificationFormModal';
import ConfirmModal from './components/ConfirmModal';
import AlertModal from './components/AlertModal';
import CourseFormModal from './components/CourseFormModal';
import PersonnelFormModal from './components/PersonnelFormModal';
import UserFormModal from './components/UserFormModal';
import VehicleFormModal from './components/VehicleFormModal';
import {
    GridViewIcon, WrenchIcon, ClipboardListIcon, ShieldCheckIcon,
    UsersIcon, BookOpenIcon, CalendarDaysIcon, SettingsIcon,
    LogoutIcon, MoonIcon, SunIcon, TruckIcon, SyncIcon, ChartPieIcon
} from './components/icons';

// Main view types
export type View = 'Dashboard' | 'Canvas' | 'Tools' | 'Diagrama' | 'Vehicles' | 'Settings';

const App: React.FC = () => {
    // Loading and error state
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Data state
    const [tools, setTools] = useState<Tool[]>([]);
    const [operations, setOperations] = useState<Operation[]>([]);
    const [personnel, setPersonnel] = useState<Personnel[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);

    // UI and Auth state
    const [currentUser, setCurrentUser] = useState<{ username: string; role: Role } | null>(null);
    const [currentView, setCurrentView] = useState<View>('Dashboard');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isPresentationModeActive, setPresentationModeActive] = useState(false);
    const [guestPermissions, setGuestPermissions] = useState<Set<View>>(new Set());


    // Modal states
    const [isToolFormOpen, setIsToolFormOpen] = useState(false);
    const [editingTool, setEditingTool] = useState<Tool | null>(null);

    const [isOperationFormOpen, setIsOperationFormOpen] = useState(false);
    const [editingOperation, setEditingOperation] = useState<Operation | null>(null);

    const [isNotificationFormOpen, setIsNotificationFormOpen] = useState(false);
    const [notificationTool, setNotificationTool] = useState<Tool | null>(null);
    
    const [isCourseFormOpen, setIsCourseFormOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);

    const [isPersonnelFormOpen, setIsPersonnelFormOpen] = useState(false);
    const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);
    
    const [isUserFormOpen, setIsUserFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    
    const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', text: '', onConfirm: () => {} });
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', text: '' });
    
    // Data fetching logic
    const handleRefreshData = useCallback(async () => {
        if (!currentUser) return;
        setIsLoading(true);
        setError(null);
        try {
            const [toolsData, operationsData, personnelData, coursesData, vehiclesData] = await Promise.all([
                getTools(),
                getOperations(),
                getPersonnel(),
                getCourses(),
                getVehicles(),
            ]);
            setTools(toolsData);
            setOperations(operationsData);
            setPersonnel(personnelData);
            setCourses(coursesData);
            setVehicles(vehiclesData);
        } catch (err: any) {
            setError(err.message || 'Error al cargar los datos de la aplicación.');
            showAlert('Error de Actualización', err.message || 'No se pudieron cargar los datos más recientes.');
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    // Initial load: Fetch only users first
    const fetchInitialData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            initializeAirtable();
            await testAirtableConnection();
            const usersData = await getUsers();
            setUsers(usersData);
        } catch (err: any) {
            setError(err.message || 'Error al cargar los datos de configuración.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInitialData();
         // Dark mode setup
        const darkModePreference = localStorage.getItem('darkMode') === 'true';
        setIsDarkMode(darkModePreference);
        document.documentElement.classList.toggle('dark', darkModePreference);

        // Load guest permissions
        try {
            const storedPermissions = localStorage.getItem('guestViewPermissions');
            if (storedPermissions) {
                setGuestPermissions(new Set(JSON.parse(storedPermissions)));
            } else {
                // Set default permissions if none are stored
                setGuestPermissions(new Set(['Dashboard', 'Canvas', 'Tools', 'Personnel', 'Diagrama', 'Vehicles']));
            }
        } catch (e) {
            console.error("Failed to load guest permissions from localStorage", e);
            setGuestPermissions(new Set(['Dashboard', 'Canvas', 'Tools', 'Personnel', 'Diagrama', 'Vehicles']));
        }
    }, [fetchInitialData]);

    // Fetch all other data after successful login
    useEffect(() => {
        if (currentUser) {
            handleRefreshData();
        }
    }, [currentUser, handleRefreshData]);


    const toggleDarkMode = () => {
        setIsDarkMode(prev => {
            const newMode = !prev;
            localStorage.setItem('darkMode', String(newMode));
            document.documentElement.classList.toggle('dark', newMode);
            return newMode;
        });
    };
    
    const handleGuestPermissionsChange = (newPermissions: Set<View>) => {
        setGuestPermissions(newPermissions);
        localStorage.setItem('guestViewPermissions', JSON.stringify(Array.from(newPermissions)));
    };
    
    // Derived state
    const assignedToolIds = useMemo(() => {
        const ids = new Set<string>();
        operations.forEach(op => {
            if (op.assignedTools) {
                op.assignedTools.forEach(toolId => ids.add(toolId));
            }
        });
        return ids;
    }, [operations]);
    
    // Handlers
    const handleLoginSuccess = (user: { username: string; role: Role }) => {
        setCurrentUser(user);
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setCurrentView('Dashboard');
    };
    
    const showAlert = (title: string, text: string) => {
        setAlertModal({ isOpen: true, title, text });
    };

    // --- CRUD Handlers ---
    const handleSaveTool = async (tool: Omit<Tool, 'id' | 'nextInspectionDate' | 'status'> & { id?: string }) => {
        // Verificar si el número de serie ya está registrado para evitar carga doble
        const serialTrimmed = tool.serial ? tool.serial.trim().toLowerCase() : '';
        if (serialTrimmed) {
            const duplicate = tools.find(t => t.id !== tool.id && t.serial && t.serial.trim().toLowerCase() === serialTrimmed);
            if (duplicate) {
                showAlert(
                    'Número de Serie Duplicado',
                    `La herramienta con el número de serie "${tool.serial}" ya está registrada en el sistema (${duplicate.herramienta} - ${duplicate.tipo}). Por favor, utiliza un número de serie diferente para evitar cargas dobles.`
                );
                return;
            }
        }

        try {
            if (tool.id) {
                await updateTool(tool.id, tool);
            } else {
                await createTool(tool);
            }
            setTools(await getTools());
            setIsToolFormOpen(false);
        } catch (err: any) {
            showAlert('Error', err.message || 'No se pudo guardar la herramienta.');
        }
    };
    
    const handleDeleteTool = (toolId: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Confirmar Eliminación',
            text: '¿Estás seguro de que quieres eliminar esta herramienta? Esta acción no se puede deshacer.',
            onConfirm: async () => {
                try {
                    await deleteTool(toolId);
                    setTools(await getTools());
                } catch (err: any) {
                     showAlert('Error', err.message || 'No se pudo eliminar la herramienta.');
                } finally {
                    setConfirmModal({ isOpen: false, title: '', text: '', onConfirm: () => {} });
                }
            }
        });
    };

    const handleSaveOperation = async (operation: Partial<Operation> & { id?: string }) => {
        try {
            if (operation.id) {
                await updateOperation(operation.id, operation);
            } else {
                await createOperation(operation);
            }
            setOperations(await getOperations());
            setIsOperationFormOpen(false);
        } catch (err: any) {
            showAlert('Error', err.message || 'No se pudo guardar la operación.');
        }
    };

    const handleDeleteOperation = (operationId: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Confirmar Eliminación',
            text: '¿Estás seguro de que quieres eliminar esta operación?',
            onConfirm: async () => {
                try {
                    await deleteOperation(operationId);
                    setOperations(await getOperations());
                } catch (err: any) {
                    showAlert('Error', err.message || 'No se pudo eliminar la operación.');
                } finally {
                    setConfirmModal({ isOpen: false, title: '', text: '', onConfirm: () => {} });
                }
            }
        });
    };
    
    const handleSavePersonnel = async (person: Personnel) => {
        try {
            if (person.id) {
                await updatePersonnel(person.id, person);
            } else {
                await createPersonnel(person);
            }
            setPersonnel(await getPersonnel());
            setIsPersonnelFormOpen(false);
        } catch (err: any) {
            showAlert('Error', err.message || 'No se pudo guardar el registro de personal.');
        }
    };

    const handleDeletePersonnel = (personnelId: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Confirmar Eliminación',
            text: '¿Estás seguro de que quieres eliminar a esta persona?',
            onConfirm: async () => {
                try {
                    await deletePersonnel(personnelId);
                    setPersonnel(await getPersonnel());
                    setConfirmModal({ isOpen: false, title: '', text: '', onConfirm: () => {} });
                } catch (err: any) {
                    showAlert('Error', err.message || 'No se pudo eliminar al personal.');
                }
            }
        });
    };
    
    const handleSaveCourse = async (course: Course) => {
        try {
            if (course.id) {
                await updateCourse(course.id, course);
            } else {
                await createCourse(course);
            }
            setCourses(await getCourses());
            setIsCourseFormOpen(false);
        } catch (err: any) {
            showAlert('Error', err.message || 'No se pudo guardar el curso.');
        }
    };

    const handleDeleteCourse = (courseId: string) => {
         setConfirmModal({
            isOpen: true,
            title: 'Confirmar Eliminación',
            text: '¿Estás seguro de que quieres eliminar este curso?',
            onConfirm: async () => {
                try {
                    await deleteCourse(courseId);
                    setCourses(await getCourses());
                } catch (err: any) {
                    showAlert('Error', err.message || 'No se pudo eliminar el curso.');
                } finally {
                    setConfirmModal({ isOpen: false, title: '', text: '', onConfirm: () => {} });
                }
            }
        });
    };
    
    const handleSaveUser = async (user: User) => {
        try {
            if (user.id) {
                await updateUser(user.id, user);
            } else {
                await createUser(user);
            }
            setUsers(await getUsers());
            setIsUserFormOpen(false);
        } catch (err: any) {
            showAlert('Error', err.message || 'No se pudo guardar el usuario.');
        }
    };
    
    const handleDeleteUser = (userId: string) => {
        if (users.find(u => u.id === userId)?.role === 'Admin') {
            showAlert('Acción no permitida', 'No se puede eliminar al usuario Administrador.');
            return;
        }
        setConfirmModal({
            isOpen: true,
            title: 'Confirmar Eliminación',
            text: '¿Estás seguro de que quieres eliminar este usuario?',
            onConfirm: async () => {
                try {
                    await deleteUser(userId);
                    setUsers(await getUsers());
                } catch (err: any) {
                    showAlert('Error', err.message || 'No se pudo eliminar el usuario.');
                } finally {
                    setConfirmModal({ isOpen: false, title: '', text: '', onConfirm: () => {} });
                }
            }
        });
    };

    const handleSaveVehicle = async (vehicle: Partial<Vehicle>) => {
        try {
            if (vehicle.id) {
                await updateVehicle(vehicle.id, vehicle);
            } else {
                await createVehicle(vehicle);
            }
            setVehicles(await getVehicles());
            setIsVehicleFormOpen(false);
        } catch (err: any) {
            showAlert('Error', err.message || 'No se pudo guardar el vehículo.');
        }
    };

    const handleDeleteVehicle = (vehicleId: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Confirmar Eliminación',
            text: '¿Estás seguro de que quieres eliminar este vehículo?',
            onConfirm: async () => {
                try {
                    await deleteVehicle(vehicleId);
                    setVehicles(await getVehicles());
                } catch (err: any) {
                    showAlert('Error', err.message || 'No se pudo eliminar el vehículo.');
                } finally {
                    setConfirmModal({ isOpen: false, title: '', text: '', onConfirm: () => {} });
                }
            }
        });
    };
    
    // --- Modal Openers ---
    const handleOpenToolForm = (tool: Tool | null) => {
        setEditingTool(tool);
        setIsToolFormOpen(true);
    };

    const handleOpenOperationForm = (operation: Operation | null) => {
        setEditingOperation(operation);
        setIsOperationFormOpen(true);
    };
    
    const handleOpenNotificationModal = (toolId: string) => {
        const toolToNotify = tools.find(t => t.id === toolId);
        if (toolToNotify) {
            setNotificationTool(toolToNotify);
            setIsNotificationFormOpen(true);
        }
    };
    
    const handleOpenCourseForm = (course: Course | null) => {
        setEditingCourse(course);
        setIsCourseFormOpen(true);
    };

    const handleOpenPersonnelForm = (person: Personnel | null) => {
        setEditingPersonnel(person);
        setIsPersonnelFormOpen(true);
    };
    
    const handleOpenUserForm = (user: User | null) => {
        setEditingUser(user);
        setIsUserFormOpen(true);
    };

    const handleOpenVehicleForm = (vehicle: Vehicle | null) => {
        setEditingVehicle(vehicle);
        setIsVehicleFormOpen(true);
    };

    const handleSaveNotification = async (toolId: string, days: number, emails: string[]) => {
         try {
            await updateTool(toolId, { notificationDays: days, notificationEmails: emails });
            setTools(await getTools());
            setIsNotificationFormOpen(false);
        } catch (err: any) {
             showAlert('Error', err.message || 'No se pudo guardar la notificación.');
        }
    };

    // Drag & Drop
    const handleDropToolOnOperation = async (operationId: string, toolId: string) => {
        const operation = operations.find(op => op.id === operationId);
        if (!operation) return;

        if (operation.assignedTools.includes(toolId)) return;

        const tool = tools.find(t => t.id === toolId);
        const isExpired = tool?.status.text === 'Vencida';

        // Verificar si la herramienta ya está asignada a otra operación
        const otherOperation = operations.find(op => op.id !== operationId && op.assignedTools.includes(toolId));

        if (otherOperation) {
            const toolName = tool ? `${tool.herramienta} (${tool.serial})` : 'esta herramienta';

            setConfirmModal({
                isOpen: true,
                title: 'Herramienta ya Asignada',
                text: `La herramienta "${toolName}" ya se encuentra asignada al equipo "${otherOperation.equipo}" (${otherOperation.operadora || 'Sin Operadora'}). ¿Deseas liberarla de allí y asignarla a este equipo?`,
                onConfirm: async () => {
                    try {
                        setIsLoading(true);
                        // Cerrar modal antes de procesar para mejorar UX
                        setConfirmModal({ isOpen: false, title: '', text: '', onConfirm: () => {} });
                        
                        // 1. Remover de el otro equipo
                        const otherUpdatedTools = otherOperation.assignedTools.filter(id => id !== toolId);
                        await updateOperation(otherOperation.id, { assignedTools: otherUpdatedTools });

                        // 2. Agregar al equipo actual
                        const currentUpdatedTools = [...operation.assignedTools, toolId];
                        await updateOperation(operationId, { assignedTools: currentUpdatedTools });

                        // 3. Actualizar la lista de operaciones
                        setOperations(await getOperations());

                        // Mostrar advertencia si la herramienta tiene la inspección vencida
                        if (isExpired && tool) {
                            showAlert(
                                'Advertencia de Inspección',
                                `Atención: La herramienta "${tool.herramienta}" (Serie: ${tool.serial}) tiene la inspección VENCIDA, pero ha sido asignada al equipo "${operation.equipo}".`
                            );
                        }
                    } catch (err: any) {
                        showAlert('Error', err.message || 'No se pudo transferir la herramienta.');
                    } finally {
                        setIsLoading(false);
                    }
                }
            });
        } else {
            const updatedTools = [...operation.assignedTools, toolId];
            try {
                await updateOperation(operationId, { assignedTools: updatedTools });
                setOperations(await getOperations());

                // Mostrar advertencia si la herramienta tiene la inspección vencida
                if (isExpired && tool) {
                    showAlert(
                        'Advertencia de Inspección',
                        `Atención: La herramienta "${tool.herramienta}" (Serie: ${tool.serial}) tiene la inspección VENCIDA, pero ha sido asignada al equipo "${operation.equipo}".`
                    );
                }
            } catch (err: any) {
                showAlert('Error', err.message || 'No se pudo asignar la herramienta.');
            }
        }
    };

    const handleRemoveToolFromOperation = async (operationId: string, toolId: string) => {
        const operation = operations.find(op => op.id === operationId);
        if (operation) {
            const updatedTools = operation.assignedTools.filter(id => id !== toolId);
             try {
                await updateOperation(operationId, { assignedTools: updatedTools });
                setOperations(await getOperations());
            } catch (err: any) {
                showAlert('Error', err.message || 'No se pudo liberar la herramienta.');
            }
        }
    };

    // Navigation and View data
    const navItems: { view: View; icon: React.ReactNode; label: string; roles: Role[] }[] = [
        { view: 'Dashboard', icon: <ChartPieIcon />, label: 'Métricas', roles: ['Admin', 'Invitado'] },
        { view: 'Canvas', icon: <GridViewIcon />, label: 'Canvas', roles: ['Admin', 'Invitado'] },
        { view: 'Tools', icon: <WrenchIcon />, label: 'Herramientas', roles: ['Admin', 'Invitado'] },
        { view: 'Diagrama', icon: <CalendarDaysIcon />, label: 'Diagrama', roles: ['Admin', 'Invitado'] },
        { view: 'Vehicles', icon: <TruckIcon />, label: 'Vehículos', roles: ['Admin', 'Invitado'] },
        { view: 'Settings', icon: <SettingsIcon />, label: 'Configuración', roles: ['Admin'] },
    ];

    const visibleNavItems = useMemo(() => {
        if (!currentUser) return [];
        return navItems.filter(item => {
            if (currentUser.role === 'Admin') {
                return item.roles.includes('Admin');
            }
            if (currentUser.role === 'Invitado') {
                return item.roles.includes('Invitado') && guestPermissions.has(item.view);
            }
            return false;
        });
    }, [currentUser, guestPermissions]);

    useEffect(() => {
        // When the visible nav items change, check if the current view is still valid.
        const isCurrentViewVisible = visibleNavItems.some(item => item.view === currentView);
        if (currentUser && !isCurrentViewVisible) {
            // If not, reset to the first available view.
            setCurrentView(visibleNavItems[0]?.view || 'Canvas');
        }
    }, [visibleNavItems, currentView, currentUser]);
    
    const presentationEligibleViews = useMemo(() => visibleNavItems
        .filter(item => item.view !== 'Settings')
        .map(item => ({ view: item.view, label: item.label })), [visibleNavItems]);
        
    const guestEligibleViews = useMemo(() => navItems
        .filter(item => item.roles.includes('Invitado'))
        .map(item => ({ view: item.view, label: item.label })),
        []
    );
        
    const currentViewLabel = navItems.find(item => item.view === currentView)?.label || 'Tablero';

    // Presentation Mode Logic
    useEffect(() => {
        let intervalId: number | undefined;

        if (isPresentationModeActive) {
            const intervalSeconds = parseInt(localStorage.getItem('presentationInterval') || '10', 10);
            
            const savedViewsJSON = localStorage.getItem('presentationViews');
            const defaultCycle: View[] = presentationEligibleViews.map(v => v.view);
            let viewCycle: View[] = defaultCycle;

            if (savedViewsJSON) {
                try {
                    const parsedViews = JSON.parse(savedViewsJSON);
                    if (Array.isArray(parsedViews) && parsedViews.length > 0) {
                        viewCycle = parsedViews;
                    }
                } catch (e) {
                    console.error("Could not parse presentation views from localStorage", e);
                }
            }
            
            // Filter the view cycle based on the user's current permissions.
            const accessibleViewCycle = viewCycle.filter(view => 
                visibleNavItems.some(item => item.view === view)
            );

            if (accessibleViewCycle.length > 0) {
                intervalId = window.setInterval(() => {
                    setCurrentView(prevView => {
                        const currentIndex = accessibleViewCycle.indexOf(prevView);
                        const nextIndex = (currentIndex === -1) ? 0 : (currentIndex + 1) % accessibleViewCycle.length;
                        return accessibleViewCycle[nextIndex];
                    });
                }, intervalSeconds * 1000);
            } else {
                setPresentationModeActive(false);
            }
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isPresentationModeActive, presentationEligibleViews, visibleNavItems]);
    
    const togglePresentationMode = () => {
        setPresentationModeActive(prev => !prev);
    };

    
    // --- Render Logic ---
    if (isLoading && !currentUser) { // Initial loading for login
        return (
            <div className="flex items-center justify-center h-dvh bg-gray-100 dark:bg-gray-900">
                <div className="text-xl font-semibold">Cargando...</div>
            </div>
        );
    }

    if (error && !currentUser) { // Initial error before login
         return (
            <div className="flex items-center justify-center h-dvh bg-gray-100 dark:bg-gray-900">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md w-full max-w-lg text-center">
                    <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error de Configuración o Conexión</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{error || 'La librería de Airtable no se ha cargado correctamente.'}</p>
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-left text-sm text-gray-500 dark:text-gray-400">
                        <h3 className="font-semibold mb-2">Pasos para solucionar el problema:</h3>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Asegúrate de tener conexión a internet.</li>
                            <li>Verifica que los valores de 'AIRTABLE_API_KEY' y 'AIRTABLE_BASE_ID' en el archivo `config.ts` son correctos.</li>
                            <li>Revisa la consola del navegador (F12) para ver mensajes de error detallados.</li>
                        </ol>
                    </div>
                    <button onClick={fetchInitialData} className="mt-6 bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition">
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }
    
    if (!currentUser) {
        return <LoginScreen onLoginSuccess={handleLoginSuccess} users={users} />;
    }
    
    const renderView = () => {
        switch(currentView) {
            case 'Dashboard': return <DashboardView tools={tools} operations={operations} personnel={personnel} courses={courses} vehicles={vehicles} onNavigate={setCurrentView} allowedViews={visibleNavItems.map(item => item.view)} />;
            case 'Canvas': return <CanvasView tools={tools} operations={operations} assignedToolIds={assignedToolIds} handleDropToolOnOperation={handleDropToolOnOperation} handleRemoveToolFromOperation={handleRemoveToolFromOperation} handleOpenNotificationModal={handleOpenNotificationModal} userRole={currentUser.role} onShowAlert={showAlert} handleOpenOperationForm={handleOpenOperationForm} handleDeleteOperation={handleDeleteOperation} />;
            case 'Tools': return <ToolManagementView tools={tools} handleOpenToolForm={handleOpenToolForm} handleDeleteTool={handleDeleteTool} userRole={currentUser.role}/>;
            case 'Diagrama': return <DiagramaView personnel={personnel} courses={courses} handleOpenPersonnelForm={handleOpenPersonnelForm} userRole={currentUser.role} />;
            case 'Vehicles': return <VehiclesView vehicles={vehicles} handleOpenVehicleForm={handleOpenVehicleForm} handleDeleteVehicle={handleDeleteVehicle} userRole={currentUser.role} />;
            case 'Settings': return <SettingsView users={users} handleOpenUserForm={handleOpenUserForm} handleDeleteUser={handleDeleteUser} userRole={currentUser.role} presentationEligibleViews={presentationEligibleViews} guestPermissions={guestPermissions} onGuestPermissionsChange={handleGuestPermissionsChange} guestEligibleViews={guestEligibleViews} courses={courses} handleOpenCourseForm={handleOpenCourseForm} handleDeleteCourse={handleDeleteCourse} />;
            default: return <div>Vista no encontrada</div>;
        }
    };
    
    return (
        <div className="flex flex-col-reverse md:flex-row h-dvh bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans overflow-hidden">
            <aside className="w-full md:w-20 h-14 md:h-dvh bg-white dark:bg-gray-800 flex flex-row md:flex-col items-center justify-between shadow-lg border-t md:border-t-0 md:border-r border-gray-200 dark:border-gray-700 px-4 md:px-0 py-1.5 md:py-4 shrink-0 z-20">
                <nav className="w-full md:w-auto">
                    <ul className="flex md:flex-col justify-around md:justify-start md:space-y-2 w-full">
                        {visibleNavItems.map(item => (
                             <li key={item.view}>
                                <button
                                    title={item.label}
                                    onClick={() => setCurrentView(item.view)}
                                    className={`w-11 h-11 md:w-14 md:h-14 flex items-center justify-center rounded-xl transition-all duration-300 ${currentView === item.view ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-gray-700'}`}
                                >
                                    <span className="text-lg md:text-xl">{item.icon}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="hidden md:flex flex-col space-y-4">
                     <button title={isDarkMode ? 'Modo Claro' : 'Modo Oscuro'} onClick={toggleDarkMode} className="w-14 h-14 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-gray-700 transition-colors duration-300 text-xl"><span className="transform transition-transform duration-500 ease-in-out">{isDarkMode ? <SunIcon /> : <MoonIcon />}</span></button>
                    <button title="Cerrar Sesión" onClick={handleLogout} className="w-14 h-14 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-300 text-xl"><LogoutIcon /></button>
                </div>
            </aside>
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white dark:bg-gray-800 shadow-sm px-4 py-2.5 md:p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 z-10">
                    <h1 className="text-lg md:text-xl font-bold truncate pr-2">{currentViewLabel}</h1>
                    <div className="flex items-center gap-2.5 md:gap-6 shrink-0">
                        {/* Refresh Button */}
                        <button
                            onClick={handleRefreshData}
                            disabled={isLoading}
                            title="Actualizar Datos"
                            className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-wait transition-colors p-1"
                        >
                            <span className={`text-lg md:text-xl ${isLoading ? 'animate-spin' : ''}`}>
                                <SyncIcon />
                            </span>
                        </button>
                        
                        {/* Dark Mode toggle on Mobile */}
                        <button 
                            title={isDarkMode ? 'Modo Claro' : 'Modo Oscuro'} 
                            onClick={toggleDarkMode} 
                            className="md:hidden text-gray-500 dark:text-gray-400 hover:text-blue-600 p-1 text-lg flex items-center justify-center"
                        >
                            {isDarkMode ? <SunIcon /> : <MoonIcon />}
                        </button>

                        {/* Presentation mode on desktop only */}
                        <div className="hidden sm:flex items-center gap-2">
                            <label htmlFor="presentation-switch" className="text-sm font-medium cursor-pointer">Modo Presentación</label>
                            <div className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
                                <input 
                                    type="checkbox" 
                                    name="presentation-switch" 
                                    id="presentation-switch" 
                                    checked={isPresentationModeActive} 
                                    onChange={togglePresentationMode}
                                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                />
                                <label 
                                    htmlFor="presentation-switch" 
                                    className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-600 cursor-pointer"
                                ></label>
                            </div>
                        </div>

                        {/* Welcoming user details */}
                        <div className="text-xs md:text-sm text-right text-gray-650 dark:text-gray-300">
                            <span className="hidden sm:inline">Bienvenido, </span>
                            <span className="font-bold">{currentUser.username}</span>
                            <span className="hidden md:inline"> ({currentUser.role})</span>
                        </div>

                        {/* Logout button on mobile */}
                        <button 
                            title="Cerrar Sesión" 
                            onClick={handleLogout} 
                            className="md:hidden text-red-500 hover:text-red-700 p-1 text-lg flex items-center justify-center"
                        >
                            <LogoutIcon />
                        </button>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto">
                    { isLoading ? 
                        <div className="flex items-center justify-center h-full"><div className="text-xl font-semibold">Cargando datos...</div></div> :
                        renderView()
                    }
                </div>
            </main>
            
            {/* Modals */}
            <ToolFormModal isOpen={isToolFormOpen} onClose={() => setIsToolFormOpen(false)} onSave={handleSaveTool} onDelete={handleDeleteTool} editingTool={editingTool} tools={tools} />
            <OperationFormModal isOpen={isOperationFormOpen} onClose={() => setIsOperationFormOpen(false)} onSave={handleSaveOperation} editingOperation={editingOperation} />
            <NotificationFormModal isOpen={isNotificationFormOpen} onClose={() => setIsNotificationFormOpen(false)} onSave={handleSaveNotification} tool={notificationTool} />
            <CourseFormModal isOpen={isCourseFormOpen} onClose={() => setIsCourseFormOpen(false)} onSave={handleSaveCourse} editingCourse={editingCourse} />
            <PersonnelFormModal isOpen={isPersonnelFormOpen} onClose={() => setIsPersonnelFormOpen(false)} onSave={handleSavePersonnel} onDelete={handleDeletePersonnel} editingPersonnel={editingPersonnel} coursesList={courses} />
            <UserFormModal isOpen={isUserFormOpen} onClose={() => setIsUserFormOpen(false)} onSave={handleSaveUser} editingUser={editingUser} />
            <VehicleFormModal isOpen={isVehicleFormOpen} onClose={() => setIsVehicleFormOpen(false)} onSave={handleSaveVehicle} editingVehicle={editingVehicle} onNovedadChange={handleRefreshData} />


            <ConfirmModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} onConfirm={confirmModal.onConfirm} title={confirmModal.title} text={confirmModal.text} />
            <AlertModal isOpen={alertModal.isOpen} onClose={() => setAlertModal({ ...alertModal, isOpen: false })} title={alertModal.title} text={alertModal.text} />
        </div>
    );
};

export default App;
