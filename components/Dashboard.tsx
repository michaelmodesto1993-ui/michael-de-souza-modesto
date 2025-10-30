import React, { useState, useMemo } from 'react';
import { Transaction, Account, ReconciliationStatus, TransactionType } from '../types';
import TransactionTable from './TransactionTable';
import { BrainCircuitIcon, CheckCircleIcon, AlertTriangleIcon, ListIcon, ImportIcon, FileDownIcon } from './Icons';
import { Page } from '../App';
import * as XLSX from 'xlsx';

// Add XLSX to window to make it accessible for the script tag
declare global {
    interface Window {
        XLSX: typeof XLSX;
    }
}
const XLSX_ = window.XLSX;


interface DashboardProps {
    transactions: Transaction[];
    accounts: Account[];
    onUpdateTransaction: (transactionId: string, accountId: string | null) => void;
    onReconcile: () => void;
    setPage: (page: Page) => void;
}

const StatCard: React.FC<{ title: string; value: string; subtext: string; icon: React.ReactNode }> = ({ title, value, subtext, icon }) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{value}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{subtext}</p>
        </div>
        <div className="text-slate-300 dark:text-slate-600">{icon}</div>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({
    transactions,
    accounts,
    onUpdateTransaction,
    onReconcile,
    setPage
}) => {
    const [doubleEntryAccountId, setDoubleEntryAccountId] = useState<string>('');
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

    const stats = useMemo(() => {
        const total = transactions.length;
        const reconciled = transactions.filter(t => t.reconciliation.status !== ReconciliationStatus.UNRECONCILED).length;
        const pendingAmount = transactions
            .filter(t => t.reconciliation.status === ReconciliationStatus.UNRECONCILED)
            .reduce((sum, t) => sum + (t.type === TransactionType.DEBIT ? t.amount : 0), 0); // Sum only debits as pending expenses
        
        const reconciledPercent = total > 0 ? (reconciled / total) * 100 : 0;

        return {
            total,
            reconciled,
            pendingAmount,
            reconciledPercent,
            hasUnreconciled: reconciled < total,
            hasReconciled: reconciled > 0
        };
    }, [transactions]);

    const handleExport = (format: 'xlsx' | 'ods' | 'txt' | 'ofx') => {
        if (!doubleEntryAccountId) {
            alert('Por favor, selecione uma conta de partida dobrada para exportar.');
            return;
        }

        const reconciledTxs = transactions.filter(tx => tx.reconciliation.accountId);
        if (reconciledTxs.length === 0) {
            alert('Nenhuma transação conciliada para exportar.');
            return;
        }

        const data = reconciledTxs.map(tx => {
            const isDebit = tx.type === TransactionType.DEBIT;
            const debitAccount = isDebit ? tx.reconciliation.accountId : doubleEntryAccountId;
            const creditAccount = isDebit ? doubleEntryAccountId : tx.reconciliation.accountId;
            return {
                Data: tx.date,
                Descrição: tx.description,
                'Conta Débito': debitAccount,
                'Conta Crédito': creditAccount,
                Valor: tx.amount.toFixed(2),
            };
        });

        const filename = `conciliacao_${new Date().toISOString().split('T')[0]}`;

        if (format === 'xlsx' || format === 'ods') {
            const ws = XLSX_.utils.json_to_sheet(data);
            const wb = XLSX_.utils.book_new();
            XLSX_.utils.book_append_sheet(wb, ws, 'Conciliação');
            XLSX_.writeFile(wb, `${filename}.${format}`);
        } else if (format === 'txt') {
            let txtContent = "Data;Descrição;Conta Débito;Conta Crédito;Valor\n";
            data.forEach(row => {
                txtContent += `${row.Data};${row.Descrição};${row['Conta Débito']};${row['Conta Crédito']};${row.Valor}\n`;
            });
            const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.setAttribute("download", `${filename}.txt`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (format === 'ofx') {
            // Simplified OFX for journal entries (custom format)
            let ofxContent = `OFXHEADER:100\nDATA:OFXSGML\nVERSION:102\nSECURITY:NONE\nENCODING:USASCII\nCHARSET:1252\nCOMPRESSION:NONE\nOLDFILEUID:NONE\nNEWFILEUID:NONE\n\n<OFX>\n<SIGNONMSGSRSV1>\n<SONRS>\n<STATUS>\n<CODE>0\n<SEVERITY>INFO\n</STATUS>\n<DTSERVER>${new Date().toISOString().replace(/\.\d{3}/, '').replace(/[-T:]/g, '').substring(0, 14)}\n<LANGUAGE>POR\n</SONRS>\n</SIGNONMSGSRSV1>\n<BANKMSGSRSV1>\n<STMTTRNRS>\n<TRNUID>1\n<STATUS>\n<CODE>0\n<SEVERITY>INFO\n</STATUS>\n<STMTRS>\n<CURDEF>BRL\n<BANKACCTFROM>\n<BANKID>000\n<ACCTID>${doubleEntryAccountId}\n<ACCTTYPE>CHECKING\n</BANKACCTFROM>\n<BANKTRANLIST>\n`;
            reconciledTxs.forEach(tx => {
                ofxContent += `<STMTTRN>\n<TRNTYPE>${tx.type === TransactionType.CREDIT ? 'CREDIT' : 'DEBIT'}\n<DTPOSTED>${tx.date.replace(/-/g, '')}120000[-3:BRT]\n<TRNAMT>${tx.type === TransactionType.CREDIT ? '' : '-'}${tx.amount.toFixed(2)}\n<FITID>${tx.id}\n<MEMO>${tx.description} (Conciliado para: ${tx.reconciliation.accountId})\n</STMTTRN>\n`;
            });
            ofxContent += `</BANKTRANLIST>\n</STMTRS>\n</STMTTRNRS>\n</BANKMSGSRSV1>\n</OFX>`;
            
            const blob = new Blob([ofxContent], { type: 'application/x-ofx' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.setAttribute("download", `${filename}.ofx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Painel de Controle</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <StatCard title="Conciliado" value={`${stats.reconciledPercent.toFixed(0)}%`} subtext={`${stats.reconciled} de ${stats.total} transações`} icon={<CheckCircleIcon className="w-8 h-8 text-green-400 dark:text-green-600"/>} />
                <StatCard title="Pendentes" value={`R$ ${stats.pendingAmount.toFixed(2).replace('.', ',')}`} subtext={`em ${stats.total - stats.reconciled} transações`} icon={<AlertTriangleIcon className="w-8 h-8 text-yellow-400 dark:text-yellow-600"/>} />
                <StatCard title="Total de Lançamentos" value={stats.total.toString()} subtext="no período importado" icon={<ListIcon className="w-8 h-8 text-blue-400 dark:text-blue-600"/>} />
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
                 <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                         <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Lançamentos Bancários</h2>
                         <p className="text-sm text-slate-500 dark:text-slate-400">Revise e concilie suas transações mais recentes.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                         <button
                            onClick={() => onReconcile()}
                            disabled={!stats.hasUnreconciled}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                        >
                            <BrainCircuitIcon className="w-5 h-5" />
                            Conciliação com IA
                        </button>
                        <button
                            onClick={() => setPage('import')}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                        >
                            <ImportIcon className="w-5 h-5" />
                            Importar Extrato
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                                disabled={!stats.hasReconciled}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <FileDownIcon className="w-5 h-5" />
                                Exportar Relatório
                            </button>
                            {isExportMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-700 rounded-md shadow-lg z-10 border dark:border-slate-600">
                                    <button onClick={() => { handleExport('xlsx'); setIsExportMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600">Excel (.xlsx)</button>
                                    <button onClick={() => { handleExport('ods'); setIsExportMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600">ODS (.ods)</button>
                                    <button onClick={() => { handleExport('txt'); setIsExportMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600">Texto (.txt)</button>
                                    <button onClick={() => { handleExport('ofx'); setIsExportMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600">OFX (.ofx)</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Conta de Partida Dobrada (Banco)</label>
                     <select
                        value={doubleEntryAccountId}
                        onChange={(e) => setDoubleEntryAccountId(e.target.value)}
                        className="mt-1 block w-full max-w-xs rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200"
                      >
                        <option value="">Selecione a conta do banco...</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.id} - {acc.name}
                          </option>
                        ))}
                      </select>
                </div>
                 <TransactionTable 
                    transactions={transactions} 
                    accounts={accounts} 
                    onUpdateTransaction={onUpdateTransaction} 
                />
            </div>
        </div>
    );
};

export default Dashboard;