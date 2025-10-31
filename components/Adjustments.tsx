import React, { useState, useEffect } from 'react';
import { AVATAR_OPTIONS } from '../constants';
import { KeyIcon } from './Icons';

interface AdjustmentsProps {
    avatarUrl: string;
    onAvatarChange: (url: string) => void;
    apiKey: string;
    onApiKeyChange: (key: string) => void;
}

const Adjustments: React.FC<AdjustmentsProps> = ({ avatarUrl, onAvatarChange, apiKey, onApiKeyChange }) => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem('fontSize') || '100', 10));
    const [isAvatarModalOpen, setAvatarModalOpen] = useState(false);
    const [currentApiKey, setCurrentApiKey] = useState(apiKey);
    const [isKeyVisible, setIsKeyVisible] = useState(false);

    useEffect(() => {
        setCurrentApiKey(apiKey);
    }, [apiKey]);

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
    
    const handleSelectAvatar = (url: string) => {
        onAvatarChange(url);
        setAvatarModalOpen(false);
    };

    const handleSaveKey = () => {
        onApiKeyChange(currentApiKey);
        alert('Chave de API salva com sucesso!');
    };

    const handleClearKey = () => {
        setCurrentApiKey('');
        onApiKeyChange('');
        alert('Chave de API removida.');
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Ajustes</h1>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center">
                    <KeyIcon className="w-5 h-5 mr-2 text-slate-500" />
                    Chave de API do Google Gemini
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Sua chave de API é necessária para que as funcionalidades de inteligência artificial funcionem. Ela é salva localmente no seu navegador. Obtenha sua chave em{' '}
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-teal-600 dark:text-teal-500 hover:underline">
                        Google AI Studio
                    </a>.
                </p>
                <div className="mt-4">
                    <label htmlFor="api-key" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Sua Chave de API
                    </label>
                    <div className="relative mt-1">
                        <input
                            type={isKeyVisible ? 'text' : 'password'}
                            id="api-key"
                            value={currentApiKey}
                            onChange={(e) => setCurrentApiKey(e.target.value)}
                            placeholder="Cole sua chave de API aqui"
                            className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 pr-10"
                        />
                         <button
                            type="button"
                            onClick={() => setIsKeyVisible(!isKeyVisible)}
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            aria-label={isKeyVisible ? "Ocultar chave" : "Mostrar chave"}
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                {isKeyVisible ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243l-4.243-4.243" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.432 0 .639C20.577 16.49 16.64 19.5 12 19.5s-8.573-3.007-9.963-7.178z" />
                                )}
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                           </svg>
                        </button>
                    </div>
                </div>
                <div className="mt-4 flex items-center justify-end space-x-3">
                    {apiKey && (
                        <button onClick={handleClearKey} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                            Limpar Chave
                        </button>
                    )}
                    <button onClick={handleSaveKey} className="px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-teal-700 disabled:bg-teal-300 disabled:cursor-not-allowed transition-colors">
                        Salvar Chave
                    </button>
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