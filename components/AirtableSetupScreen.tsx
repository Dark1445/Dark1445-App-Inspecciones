
import React, { useState } from 'react';
import { ToolsIcon } from './icons';

interface AirtableSetupScreenProps {
    onConfigSave: () => void;
}

const AirtableSetupScreen: React.FC<AirtableSetupScreenProps> = ({ onConfigSave }) => {
    const [apiKey, setApiKey] = useState('');
    const [baseId, setBaseId] = useState('');
    const [error, setError] = useState('');

    const handleSave = () => {
        if (!apiKey.trim() || !baseId.trim()) {
            setError('Por favor, completa ambos campos.');
            return;
        }
        setError('');
        localStorage.setItem('airtableApiKey', apiKey);
        localStorage.setItem('airtableBaseId', baseId);
        onConfigSave();
    };

    return (
        <div className="flex items-center justify-center h-dvh bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-lg p-8 space-y-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <div className="text-center">
                    <ToolsIcon />
                    <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-gray-100">Configuración de Airtable</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Introduce tus credenciales de Airtable para conectar la aplicación.
                    </p>
                </div>
                <div className="space-y-6">
                    <div>
                        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Personal Access Token (API Key)
                        </label>
                        <input
                            id="apiKey"
                            name="apiKey"
                            type="password"
                            autoComplete="off"
                            required
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="pat..."
                        />
                    </div>
                    <div>
                        <label htmlFor="baseId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Base ID</label>
                        <input
                            id="baseId"
                            name="baseId"
                            type="text"
                            autoComplete="off"
                            required
                            value={baseId}
                            onChange={(e) => setBaseId(e.target.value)}
                            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="app..."
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <div>
                        <button onClick={handleSave} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                            Guardar y Conectar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AirtableSetupScreen;
