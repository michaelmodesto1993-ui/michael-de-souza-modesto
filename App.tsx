import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import Adjustments from './components/Adjustments';
import Import from './components/Import';

import { Transaction, Account, LearningExample, ReconciliationStatus, TransactionType } from './types';
import { SPED_CHART_OF_ACCOUNTS, AVATAR_OPTIONS } from './constants';
import { reconcileTransactions } from './services/geminiService';

export type Page = 'dashboard' | 'import' | 'settings' | 'adjustments';
type AccountPlan = 'sped' | 'custom';

const LEARNING_EXAMPLES_KEY = 'conciliaFacil_learningExamples';
const CUSTOM_ACCOUNTS_KEY = 'conciliaFacil_customAccounts';
const ACTIVE_PLAN_KEY = 'conciliaFacil_activePlan';
const AVATAR_URL_KEY = 'conciliaFacil_avatarUrl';

function App() {
  const [currentPage, setPage] = useState<Page>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [spedAccounts] = useState<Account[]>(SPED_CHART_OF_ACCOUNTS);
  const [customAccounts, setCustomAccounts] = useState<Account[]>([]);
  const [activePlan, setActivePlan] = useState<AccountPlan>('sped');
  
  const [learningExamples, setLearningExamples] = useState<LearningExample[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string>(AVATAR_OPTIONS[0]);

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const accounts = activePlan === 'sped' ? spedAccounts : customAccounts;
  
  useEffect(() => {
    try {
      const storedLearning = localStorage.getItem(LEARNING_EXAMPLES_KEY);
      if (storedLearning) setLearningExamples(JSON.parse(storedLearning));

      const storedCustomAccounts = localStorage.getItem(CUSTOM_ACCOUNTS_KEY);
      if (storedCustomAccounts) setCustomAccounts(JSON.parse(storedCustomAccounts));

      const storedActivePlan = localStorage.getItem(ACTIVE_PLAN_KEY) as AccountPlan;
      if (storedActivePlan) setActivePlan(storedActivePlan);

      const storedAvatar = localStorage.getItem(AVATAR_URL_KEY);
      if (storedAvatar) setAvatarUrl(storedAvatar);

    } catch (e) {
      console.error("Failed to load data from localStorage", e);
    }
  }, []);

  const handleTransactionsParsed = (parsedTransactions: Transaction[]) => {
    setTransactions(parsedTransactions);
    setError(null);
    setPage('dashboard'); // Navigate to dashboard after import
  };

  const handleSetCustomAccounts = (newAccounts: Account[]) => {
    setCustomAccounts(newAccounts);
    localStorage.setItem(CUSTOM_ACCOUNTS_KEY, JSON.stringify(newAccounts));
  }

  const handleSetActivePlan = (plan: AccountPlan) => {
    setActivePlan(plan);
    localStorage.setItem(ACTIVE_PLAN_KEY, plan);
  }

  const handleSetAvatarUrl = (url: string) => {
    setAvatarUrl(url);
    localStorage.setItem(AVATAR_URL_KEY, url);
  };

  const handleUpdateTransaction = useCallback((transactionId: string, accountId: string | null) => {
    setTransactions(currentTransactions => {
      const newTransactions = currentTransactions.map(tx => {
        if (tx.id === transactionId) {
          const updatedTx = {
            ...tx,
            reconciliation: {
              accountId: accountId,
              status: accountId ? ReconciliationStatus.MANUAL : ReconciliationStatus.UNRECONCILED,
            },
          };

          if (accountId) {
            const newExample: LearningExample = {
              description: updatedTx.description,
              amount: updatedTx.type === TransactionType.DEBIT ? -updatedTx.amount : updatedTx.amount,
              type: updatedTx.type,
              accountId: accountId,
            };
            
            setLearningExamples(prev => {
                const isDuplicate = prev.some(ex => JSON.stringify(ex) === JSON.stringify(newExample));
                if (!isDuplicate) {
                    const updated = [...prev, newExample];
                    localStorage.setItem(LEARNING_EXAMPLES_KEY, JSON.stringify(updated));
                    return updated;
                }
                return prev;
            });
          }
          return updatedTx;
        }
        return tx;
      });
      return newTransactions;
    });
  }, []);

  const handleReconcile = async () => {
    setLoading(true);
    setLoadingMessage('A IA está analisando suas transações...');
    setError(null);
    try {
      const suggestions = await reconcileTransactions(transactions, accounts, learningExamples);
      
      setTransactions(currentTransactions => {
        const updatedTransactions = currentTransactions.map(tx => {
          const suggestion = suggestions.find(s => s.transactionId === tx.id);
          if (suggestion && tx.reconciliation.status === ReconciliationStatus.UNRECONCILED) {
            return {
              ...tx,
              reconciliation: {
                accountId: suggestion.accountId,
                status: ReconciliationStatus.AUTOMATIC,
              },
            };
          }
          return tx;
        });
        return updatedTransactions;
      });

    } catch (err: any) {
      console.error("Erro na conciliação com IA:", err);
      setError(err.message || "Ocorreu um erro ao tentar conciliar com a IA.");
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard 
            transactions={transactions}
            accounts={accounts}
            onUpdateTransaction={handleUpdateTransaction}
            onReconcile={handleReconcile}
            setPage={setPage}
        />;
      case 'import':
        return <Import 
            onTransactionsParsed={handleTransactionsParsed}
            setLoading={setLoading}
            setLoadingMessage={setLoadingMessage}
            setError={setError}
        />;
      case 'settings':
        return <Settings
            spedAccounts={spedAccounts}
            customAccounts={customAccounts}
            onCustomAccountsChange={handleSetCustomAccounts}
            activePlan={activePlan}
            onActivePlanChange={handleSetActivePlan}
        />;
      case 'adjustments':
        return <Adjustments 
          avatarUrl={avatarUrl}
          onAvatarChange={handleSetAvatarUrl}
        />;
      default:
        return <div>Página não encontrada</div>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-50 font-sans">
      <Sidebar currentPage={currentPage} setPage={setPage} avatarUrl={avatarUrl} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-slate-50 dark:bg-slate-900">
        {loading && (
          <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
              <p className="mt-4 text-slate-700 dark:text-slate-300 font-semibold">{loadingMessage}</p>
            </div>
          </div>
        )}
        {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
                <strong className="font-bold">Erro!</strong>
                <span className="block sm:inline ml-2">{error}</span>
                <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                    <span className="text-2xl">×</span>
                </button>
            </div>
        )}
        {renderPage()}
      </main>
    </div>
  );
}

export default App;