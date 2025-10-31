import React, { useState } from 'react';
import { Transaction, Account, ReconciliationStatus } from '../types';
import AccountSelector from './AccountSelector';
import { EditIcon, CheckIcon, XIcon } from './Icons';

interface TransactionTableProps {
  transactions: Transaction[];
  accounts: Account[];
  onUpdateTransaction: (transactionId: string, accountId: string | null) => void;
  onUpdateTransactionDescription: (transactionId: string, newDescription: string) => void;
}

const StatusBadge: React.FC<{ status: ReconciliationStatus }> = ({ status }) => {
  const statusInfo = {
    [ReconciliationStatus.UNRECONCILED]: { text: 'Não Conciliado', color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' },
    [ReconciliationStatus.AUTOMATIC]: { text: 'Automático', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
    [ReconciliationStatus.MANUAL]: { text: 'Manual', color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
  };

  const { text, color } = statusInfo[status];
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>
      {text}
    </span>
  );
};

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, accounts, onUpdateTransaction, onUpdateTransactionDescription }) => {
  const [editingRow, setEditingRow] = useState<{ id: string; description: string } | null>(null);

  const handleSave = () => {
    if (!editingRow) return;

    const newDescription = editingRow.description.trim();
    const originalTransaction = transactions.find(tx => tx.id === editingRow.id);

    // Se a descrição estiver vazia ou não tiver mudado, apenas cancele a edição.
    if (newDescription === '' || newDescription === originalTransaction?.description) {
      setEditingRow(null);
      return;
    }
    
    onUpdateTransactionDescription(editingRow.id, newDescription);
    setEditingRow(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditingRow(null);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500 dark:text-slate-400">
        <p>Nenhuma transação para exibir.</p>
        <p className="text-sm">Por favor, carregue um extrato bancário para começar.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-slate-300 dark:divide-slate-700">
              <thead className="bg-slate-100 dark:bg-slate-900">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-200 sm:pl-6">Data</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-200">Descrição</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-200">Valor (R$)</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-200">Status</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-200 w-1/3">Conta de Conciliação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-slate-500 dark:text-slate-400 sm:pl-6">{tx.date}</td>
                    <td className="px-3 py-4 text-sm text-slate-900 dark:text-slate-200 font-medium">
                      {editingRow?.id === tx.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingRow.description}
                            onChange={(e) => setEditingRow({ ...editingRow, description: e.target.value })}
                            onKeyDown={handleKeyDown}
                            className="block w-full rounded-md border-0 py-1.5 pl-2 bg-inherit ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:ring-2 focus:ring-teal-600 sm:text-sm"
                            autoFocus
                          />
                          <button onClick={handleSave} className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 p-1 rounded-full">
                            <CheckIcon className="w-5 h-5" />
                          </button>
                          <button onClick={() => setEditingRow(null)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full">
                            <XIcon className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between group">
                          <span className="max-w-sm truncate">{tx.description}</span>
                          <button 
                            onClick={() => setEditingRow({ id: tx.id, description: tx.description })} 
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 ml-2"
                            aria-label="Editar descrição"
                          >
                            <EditIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className={`whitespace-nowrap px-3 py-4 text-sm font-mono ${tx.type === 'DEBIT' ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
                      {tx.type === 'DEBIT' ? '-' : '+'} {tx.amount.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 dark:text-slate-400">
                      <StatusBadge status={tx.reconciliation.status} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 dark:text-slate-400">
                      <AccountSelector
                        value={tx.reconciliation.accountId}
                        onChange={(accountId) => onUpdateTransaction(tx.id, accountId)}
                        accounts={accounts}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionTable;
