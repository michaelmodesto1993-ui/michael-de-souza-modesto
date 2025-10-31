import React, { useState, useEffect } from 'react';
import { AVATAR_OPTIONS } from '../constants';
import { KeyIcon } from './Icons';

// FIX: Moved the AIStudio interface into the `declare global` block to ensure it's
// a single, globally-scoped type, which resolves the TypeScript error about
// subsequent property declarations having conflicting types.
declare global {
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }

    interface Window {
        aistudio?: AIStudio;
    }
}

interface AdjustmentsProps {
    avatarUrl: string;
    onAvatarChange: (url: string) => void;
}

const Adjustments: React.FC<AdjustmentsProps> = ({ avatarUrl, onAvatarChange }) => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem('fontSize') || '100', 10));
    const [isAvatarModalOpen, setAvatarModalOpen] = useState(false);
    const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'set' | 'not_set'>('checking');

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [theme]);

    useEffect(() => {
        document.documentElement.style.fontSize = `${fontSize}%`;
        localStorage.setItem('fontSize', fontSize.toString());
    }, [fontSize]);

    useEffect(() => {
        const checkApiKey = async () => {
            if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
                try {
                    const hasKey = await window.aistudio.hasSelectedApiKey();
                    setApiKeyStatus(hasKey ? 'set' : 'not_set');
                } catch (error) {
                    console.error("Error checking API key status:", error);
                    setApiKeyStatus('not_set');
                }
            } else {
                setApiKeyStatus('not_set'); 
            }
        };
        checkApiKey();
    }, []);
    
    const handleSelectAvatar = (url: string) => {
        onAvatarChange(url);
        setAvatarModalOpen(false);
    };

    const handleSelectKey = async () => {
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
            await window.aistudio.openSelectKey();
            // Assume success and update UI immediately due to potential race condition
            setApiKeyStatus('set');
        } else {
            alert("A funcionalidade de seleção de chave de API não está disponível neste ambiente.");
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Ajustes</h1>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <KeyIcon className="w-5 h-5" />
                    Gerenciamento da Chave de API
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Para usar a IA, você precisa selecionar uma chave de API do Google AI Studio. O uso da API pode incorrer em custos. 
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-teal-600 dark:text-teal-500 hover:underline ml-1">
                        Saiba mais sobre preços.
                    </a>
                </p>
                <div className="mt-4 flex items-center space-x-4">
                    <button 
                        onClick={handleSelectKey}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                        {apiKeyStatus === 'set' ? 'Alterar Chave de API' : 'Selecionar Chave de API'}
                    </button>
                    <div>
                        {apiKeyStatus === 'checking' && <p className="text-sm text-slate-500 dark:text-slate-400">Verificando status...</p>}
                        {apiKeyStatus === 'set' && <p className="text-sm text-green-600 dark:text-green-400 font-medium">Chave de API selecionada.</p>}
                        {apiKeyStatus === 'not_set' && <p className="text-sm text-red-600 dark:text-red-400 font-medium">Nenhuma chave de API selecionada.</p>}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Perfil</h2>
                <div className="mt-4 flex items-center space-x-4">
                    <img src={avatarUrl} alt="Avatar atual" className="h-16 w-16 rounded-full object-cover" />
                    <div>
                        <button 
                            onClick={() => setAvatarModalOpen(true)}
                            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        >
                            Alterar Avatar
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Tema</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Personalize a aparência do sistema para claro ou escuro.
                </p>
                <div className="mt-4 flex space-x-2 rounded-lg bg-slate-100 dark:bg-slate-900 p-1">
                    <button onClick={() => setTheme('light')} className={`w-full rounded-md py-2 text-sm font-medium ${theme === 'light' ? 'bg-white dark:bg-slate-700 shadow text-teal-700 dark:text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800'}`}>
                        Claro
                    </button>
                    <button onClick={() => setTheme('dark')} className={`w-full rounded-md py-2 text-sm font-medium ${theme === 'dark' ? 'bg-white dark:bg-slate-700 shadow text-teal-700 dark:text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800'}`}>
                        Escuro
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Tamanho da Fonte</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Ajuste o tamanho da fonte para melhor legibilidade.
                </p>
                <div className="mt-4 flex items-center space-x-4">
                    <input
                        type="range"
                        min="80"
                        max="120"
                        step="5"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                    />
                    <span className="font-semibold text-teal-600 dark:text-teal-400 w-12 text-center">{fontSize}%</span>
                </div>
            </div>

            {isAvatarModalOpen && (
                <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setAvatarModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Selecione um Avatar</h3>
                            <button onClick={() => setAvatarModalOpen(false)} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-2xl font-bold">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4">
                                {AVATAR_OPTIONS.map(url => (
                                    <button key={url} onClick={() => handleSelectAvatar(url)} className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 dark:focus:ring-offset-slate-800">
                                        <img src={url} alt="Opção de avatar" className="h-16 w-16 rounded-full object-cover transition-transform hover:scale-110" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Adjustments;