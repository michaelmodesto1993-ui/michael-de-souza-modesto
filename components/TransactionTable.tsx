import React from 'react';
import { Transaction, Account, ReconciliationStatus } from '../types';
import AccountSelector from './AccountSelector';

interface TransactionTableProps {
  transactions: Transaction[];
  accounts: Account[];
  onUpdateTransaction: (transactionId: string, accountId: string | null) => void;
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

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, accounts, onUpdateTransaction }) => {
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
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-900 dark:text-slate-200 font-medium max-w-sm truncate">{tx.description}</td>
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
