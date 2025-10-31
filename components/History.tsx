import React from 'react';
import { LearningExample, Account } from '../types';
import { BrainCircuitIcon, TrashIcon } from './Icons';

interface HistoryProps {
    learningExamples: LearningExample[];
    accounts: Account[];
    onDeleteLearningExample: (exampleId: string) => void;
}

const History: React.FC<HistoryProps> = ({ learningExamples, accounts, onDeleteLearningExample }) => {
    const getAccountName = (accountId: string) => {
        const account = accounts.find(a => a.id === accountId);
        return account ? `${account.id} - ${account.name}` : 'Conta não encontrada';
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Aprendizado da IA</h1>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Regras de Conciliação</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Aqui estão as regras que a IA aprendeu com suas conciliações manuais. Você pode remover regras que não são mais válidas.
                </p>

                <div className="mt-4 flow-root">
                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            {learningExamples.length > 0 ? (
                                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                                    <table className="min-w-full divide-y divide-slate-300 dark:divide-slate-700">
                                        <thead className="bg-slate-100 dark:bg-slate-900">
                                            <tr>
                                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-200 sm:pl-6">Descrição da Transação</th>
                                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-200">Conta Associada</th>
                                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Excluir</span></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                                            {learningExamples.map((example) => (
                                                <tr key={example.id}>
                                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 dark:text-slate-200 sm:pl-6">{example.description}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 dark:text-slate-400">{getAccountName(example.accountId)}</td>
                                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                        <button onClick={() => onDeleteLearningExample(example.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300" aria-label={`Excluir regra para ${example.description}`}>
                                                            <TrashIcon className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-10 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                                    <BrainCircuitIcon className="mx-auto h-12 w-12 text-slate-400" />
                                    <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-200">Nenhuma regra aprendida ainda</h3>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Comece a conciliar transações manualmente para ensinar a IA.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default History;
