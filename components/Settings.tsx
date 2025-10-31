import React, { useState, useCallback } from 'react';
import { Account } from '../types';
import { UploadIcon, TrashIcon } from './Icons';
import { parseChartOfAccountsWithAI } from '../services/geminiService';
import * as XLSX from 'xlsx';

declare global {
    interface Window {
        XLSX: typeof XLSX;
    }
}
const XLSX_ = window.XLSX;

interface SettingsProps {
    spedAccounts: Account[];
    customAccounts: Account[];
    onCustomAccountsChange: (accounts: Account[]) => void;
    activePlan: 'sped' | 'custom';
    onActivePlanChange: (plan: 'sped' | 'custom') => void;
    onDeleteCustomAccount: (accountId: string) => void;
    onClearCustomAccounts: () => void;
}

type Tab = 'sped' | 'custom';

const Settings: React.FC<SettingsProps> = ({ 
    spedAccounts, 
    customAccounts, 
    onCustomAccountsChange, 
    activePlan, 
    onActivePlanChange,
    onDeleteCustomAccount,
    onClearCustomAccounts
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('sped');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);
        try {
            let fileContent: string;
            const fileName = file.name.toLowerCase();

            if (fileName.endsWith('.xlsx')) {
                const data = await file.arrayBuffer();
                const workbook = XLSX_.read(data);
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                fileContent = XLSX_.utils.sheet_to_csv(worksheet);
            } else { // For .csv, .txt, .ofx
                fileContent = await file.text();
            }

            const parsedAccounts = await parseChartOfAccountsWithAI(fileContent);
            onCustomAccountsChange(parsedAccounts);
        } catch (err: any) {
            setError(err.message || "Não foi possível processar o arquivo do plano de contas.");
        } finally {
            setLoading(false);
            event.target.value = ''; // Reset file input
        }
    }, [onCustomAccountsChange]);

    const renderAccountList = (accounts: Account[], onDelete?: (accountId: string) => void) => (
        <div className="mt-4 max-h-96 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {accounts.map(acc => (
                    <li key={acc.id} className="p-3 flex justify-between items-center text-sm group">
                        <div>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{acc.name}</span>
                            <span className="font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded ml-2">{acc.id}</span>
                        </div>
                        {onDelete && (
                            <button 
                                onClick={() => onDelete(acc.id)} 
                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label={`Excluir conta ${acc.name}`}
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Configurações do Plano de Contas</h1>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Plano de Contas Ativo</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Selecione qual plano de contas o sistema e a IA devem usar para a conciliação.
                </p>
                <div className="mt-4 flex space-x-2 rounded-lg bg-slate-100 dark:bg-slate-900 p-1">
                    <button onClick={() => onActivePlanChange('sped')} className={`w-full rounded-md py-2 text-sm font-medium ${activePlan === 'sped' ? 'bg-white dark:bg-slate-700 shadow text-teal-700 dark:text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800'}`}>
                        Plano Padrão SPED
                    </button>
                    <button onClick={() => onActivePlanChange('custom')} className={`w-full rounded-md py-2 text-sm font-medium ${activePlan === 'custom' ? 'bg-white dark:bg-slate-700 shadow text-teal-700 dark:text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800'}`}>
                        Plano Personalizado
                    </button>
                </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="border-b border-slate-200 dark:border-slate-700">
                    <nav className="-mb-px flex space-x-6">
                        <button onClick={() => setActiveTab('sped')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'sped' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-500'}`}>
                            Plano Padrão SPED
                        </button>
                        <button onClick={() => setActiveTab('custom')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'custom' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-500'}`}>
                            Plano Personalizado
                        </button>
                    </nav>
                </div>
                
                <div className="mt-6">
                    {activeTab === 'sped' ? (
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Esta é a lista de contas padrão do sistema, baseada no SPED.</p>
                            {renderAccountList(spedAccounts)}
                        </div>
                    ) : (
                        <div>
                            <div className="flex flex-wrap justify-between items-start gap-4">
                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-prose">Carregue um arquivo (XLSX, CSV, OFX, TXT) com seu próprio plano de contas. A IA irá analisá-lo e preencher a lista abaixo.</p>
                                {customAccounts.length > 0 && (
                                     <button 
                                        onClick={onClearCustomAccounts}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-semibold rounded-lg shadow-sm hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                        Excluir Plano Personalizado
                                    </button>
                                )}
                            </div>
                            
                            <label htmlFor="coa-upload" className="relative flex justify-center w-full px-6 py-10 border-2 border-dashed rounded-lg cursor-pointer mt-4 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600">
                                {loading ? (
                                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                                ) : (
                                    <div className="text-center">
                                        <UploadIcon className="mx-auto h-10 w-10 text-slate-400" />
                                        <span className="mt-2 block text-sm font-semibold text-teal-600 dark:text-teal-500">Carregar um arquivo</span>
                                    </div>
                                )}
                            </label>
                            <input id="coa-upload" type="file" className="hidden" onChange={handleFileUpload} accept=".csv,.txt,.xlsx,.ofx" />
                            
                            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                            
                            {customAccounts.length > 0 ? renderAccountList(customAccounts, onDeleteCustomAccount) : 
                                <p className="mt-4 text-sm text-slate-400 italic">Nenhum plano de contas personalizado carregado.</p>
                            }
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;