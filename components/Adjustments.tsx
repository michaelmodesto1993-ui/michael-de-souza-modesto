import React, { useState, useEffect, useRef } from 'react';
import { AVATAR_OPTIONS } from '../constants';
import { KeyIcon, CheckCircleIcon, AlertTriangleIcon, SpinnerIcon, UploadIcon, TrashIcon } from './Icons';
import { UserProfile } from '../types';

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
    userProfile: UserProfile;
    onUserProfileChange: (profile: UserProfile) => void;
}

const ApiKeyStatus: React.FC<{ status: 'checking' | 'set' | 'not_set' }> = ({ status }) => {
    const statusConfig = {
        checking: {
            icon: <SpinnerIcon className="w-5 h-5 animate-spin text-slate-500" />,
            text: 'Verificando status da chave...',
            color: 'text-slate-500 dark:text-slate-400',
            bgColor: 'bg-slate-100 dark:bg-slate-700/50',
        },
        set: {
            icon: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
            text: 'Status: Ativa. A chave de API está pronta para uso.',
            color: 'text-green-700 dark:text-green-300',
            bgColor: 'bg-green-100 dark:bg-green-900/40',
        },
        not_set: {
            icon: <AlertTriangleIcon className="w-5 h-5 text-red-500" />,
            text: 'Status: Requer Atenção. Nenhuma chave de API selecionada.',
            color: 'text-red-700 dark:text-red-300',
            bgColor: 'bg-red-100 dark:bg-red-900/40',
        }
    };

    const { icon, text, color, bgColor } = statusConfig[status];

    return (
        <div className={`flex items-center gap-3 px-4 py-2 rounded-lg ${bgColor}`}>
            {icon}
            <p className={`text-sm font-medium ${color}`}>{text}</p>
        </div>
    );
};

const Adjustments: React.FC<AdjustmentsProps> = ({ avatarUrl, onAvatarChange, userProfile, onUserProfileChange }) => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem('fontSize') || '100', 10));
    const [isAvatarModalOpen, setAvatarModalOpen] = useState(false);
    const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'set' | 'not_set'>('checking');
    const [profileForm, setProfileForm] = useState<UserProfile>(userProfile);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [manualKeyInput, setManualKeyInput] = useState('');

    useEffect(() => {
        setProfileForm(userProfile);
    }, [userProfile]);
    
    useEffect(() => {
        const savedKey = localStorage.getItem('conciliaFacil_manualApiKey');
        if (savedKey) {
            setManualKeyInput(savedKey);
        }
    }, []);

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

    const handleProfileFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
    };

    const handleProfileSave = (e: React.FormEvent) => {
        e.preventDefault();
        onUserProfileChange(profileForm);
        alert('Perfil atualizado com sucesso!');
    };
    
    const handleAvatarUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                onAvatarChange(result);
            };
            reader.readAsDataURL(file);
        }
    };


    const handleSelectKey = async () => {
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
            try {
                await window.aistudio.openSelectKey();
                setApiKeyStatus('set');
            } catch (error) {
                 console.error("Error opening API key selection:", error);
                 alert("Não foi possível abrir a caixa de diálogo para selecionar a chave de API.");
            }
        } else {
            alert("A funcionalidade de seleção de chave de API não está disponível neste ambiente. A inserção manual não é suportada por motivos de segurança.");
        }
    };
    
    const handleSaveManualKey = () => {
        if (manualKeyInput.trim()) {
            localStorage.setItem('conciliaFacil_manualApiKey', manualKeyInput.trim());
            alert('Chave de API manual salva. Ela terá prioridade sobre a chave selecionada.');
        } else {
            alert('O campo da chave de API não pode estar vazio.');
        }
    };

    const handleClearManualKey = () => {
        localStorage.removeItem('conciliaFacil_manualApiKey');
        setManualKeyInput('');
        alert('Chave de API manual removida.');
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Ajustes</h1>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <KeyIcon className="w-5 h-5" />
                    Gerenciamento da Chave de API
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-prose">
                    Para usar os recursos de IA, você precisa selecionar uma chave de API do Google AI Studio. Por razões de segurança, a plataforma exige que a chave seja selecionada através de um diálogo seguro, não permitindo a inserção manual. O uso da API pode incorrer em custos.
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-teal-600 dark:text-teal-500 hover:underline ml-1">
                        Saiba mais sobre preços.
                    </a>
                </p>
                <div className="mt-4 space-y-3">
                    <ApiKeyStatus status={apiKeyStatus} />
                    <button 
                        onClick={handleSelectKey}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                        {apiKeyStatus === 'set' ? 'Alterar Chave de API' : 'Selecionar Chave de API'}
                    </button>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-md font-semibold text-slate-800 dark:text-slate-200">Inserção Manual (Não Recomendado)</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-prose">
                        Se a opção segura acima não estiver disponível, você pode inserir sua chave de API manualmente. Esteja ciente de que armazenar chaves no navegador é menos seguro. A chave manual terá prioridade sobre a chave selecionada.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                        <input 
                            type="password"
                            placeholder="Cole sua chave de API aqui"
                            value={manualKeyInput}
                            onChange={(e) => setManualKeyInput(e.target.value)}
                            className="block w-full max-w-sm rounded-md border-0 py-1.5 pl-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:ring-2 focus:ring-teal-600 sm:text-sm"
                        />
                        <button
                            onClick={handleSaveManualKey}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
                        >
                            Salvar
                        </button>
                        {manualKeyInput && (
                             <button
                                onClick={handleClearManualKey}
                                className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"
                                aria-label="Limpar chave manual"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Perfil</h2>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1 flex flex-col items-center text-center">
                        <img src={avatarUrl} alt="Avatar atual" className="h-24 w-24 rounded-full object-cover mb-4" />
                        <div className="flex flex-col space-y-2 w-full">
                           <button 
                                onClick={handleAvatarUploadClick}
                                className="w-full px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <UploadIcon className="w-4 h-4" />
                                Carregar Imagem
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleAvatarFileChange} accept="image/*" className="hidden" />
                            <button 
                                onClick={() => setAvatarModalOpen(true)}
                                className="w-full px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                            >
                                Escolher da Galeria
                            </button>
                        </div>
                    </div>
                    <form onSubmit={handleProfileSave} className="md:col-span-2 space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nome</label>
                            <input type="text" name="name" id="name" value={profileForm.name} onChange={handleProfileFormChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm sm:text-sm bg-white dark:bg-slate-700"/>
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">E-mail</label>
                            <input type="email" name="email" id="email" value={profileForm.email} onChange={handleProfileFormChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm sm:text-sm bg-white dark:bg-slate-700"/>
                        </div>
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Cargo</label>
                            <input type="text" name="role" id="role" value={profileForm.role} onChange={handleProfileFormChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm sm:text-sm bg-white dark:bg-slate-700"/>
                        </div>
                        <div className="text-right">
                             <button 
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
                            >
                                Salvar Alterações
                            </button>
                        </div>
                    </form>
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
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Selecione um Avatar</h3>
                            <button onClick={() => setAvatarModalOpen(false)} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-2xl font-bold">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
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