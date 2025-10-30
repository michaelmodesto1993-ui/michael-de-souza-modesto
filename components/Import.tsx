import React, { useState, useCallback } from 'react';
import { Transaction, TransactionType, ReconciliationStatus } from '../types';
import { UploadIcon } from './Icons';
import { parseBankStatementWithAI } from '../services/geminiService';

interface ImportProps {
  onTransactionsParsed: (transactions: Transaction[]) => void;
  setLoading: (loading: boolean) => void;
  setLoadingMessage: (message: string) => void;
  setError: (error: string | null) => void;
}

const parseOfx = (ofxContent: string): { date: string, description: string, amount: number }[] => {
    const transactions: { date: string, description: string, amount: number }[] = [];
    const tranListMatch = ofxContent.match(/<BANKTRANLIST>([\s\S]*?)<\/BANKTRANLIST>/);
    if (!tranListMatch) throw new Error("Formato OFX inválido: <BANKTRANLIST> não encontrada.");
    const tranListContent = tranListMatch[1];
    const transactionMatches = tranListContent.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/g);
    if (!transactionMatches) return [];

    transactionMatches.forEach(t => {
        const memoMatch = t.match(/<MEMO>(.*?)</);
        const amountMatch = t.match(/<TRNAMT>(.*?)</);
        const dateMatch = t.match(/<DTPOSTED>(.*?)</);

        if (memoMatch && amountMatch && dateMatch) {
            const amount = parseFloat(amountMatch[1]);
            const rawDate = dateMatch[1].substring(0, 8);
            const formattedDate = `${rawDate.substring(0, 4)}-${rawDate.substring(4, 6)}-${rawDate.substring(6, 8)}`;
            transactions.push({ date: formattedDate, description: memoMatch[1].trim(), amount });
        }
    });
    return transactions;
}

const Import: React.FC<ImportProps> = ({ onTransactionsParsed, setLoading, setLoadingMessage, setError }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setFileName(file.name);

    try {
      const text = await file.text();
      let rawTransactions: { date: string, description: string, amount: number }[] = [];

      if (file.name.toLowerCase().endsWith('.ofx')) {
        setLoadingMessage('Processando arquivo OFX...');
        rawTransactions = parseOfx(text);
      } else {
        setLoadingMessage('Analisando extrato com IA...');
        rawTransactions = await parseBankStatementWithAI(text);
      }
      
      let filteredTransactions = rawTransactions;
      if (startDate) {
        filteredTransactions = filteredTransactions.filter(t => t.date >= startDate);
      }
      if (endDate) {
        filteredTransactions = filteredTransactions.filter(t => t.date <= endDate);
      }

      const transactions: Transaction[] = filteredTransactions.map((t, index) => ({
        id: `tx-${Date.now()}-${index}`,
        date: t.date,
        description: t.description,
        amount: Math.abs(t.amount),
        type: t.amount < 0 ? TransactionType.DEBIT : TransactionType.CREDIT,
        reconciliation: { accountId: null, status: ReconciliationStatus.UNRECONCILED },
      }));

      onTransactionsParsed(transactions);
    } catch (err: any) {
      console.error("Erro ao processar o arquivo:", err);
      setError(err.message || "Não foi possível processar o arquivo.");
    } finally {
      setLoading(false);
      setLoadingMessage('');
      event.target.value = '';
    }
  }, [onTransactionsParsed, setLoading, setLoadingMessage, setError, startDate, endDate]);

  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Importar Extrato Bancário</h1>
        <div className="max-w-xl mx-auto">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label htmlFor="start-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Data Inicial</label>
                        <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm sm:text-sm bg-white dark:bg-slate-700"/>
                    </div>
                    <div>
                        <label htmlFor="end-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Data Final</label>
                        <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm sm:text-sm bg-white dark:bg-slate-700"/>
                    </div>
                </div>

                <label htmlFor="file-upload" className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600">
                    <div className="text-center">
                        <UploadIcon className="mx-auto h-10 w-10 text-slate-400" />
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            <span className="font-semibold text-teal-600 dark:text-teal-500">Clique para carregar</span> ou arraste e solte
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">OFX, CSV ou TXT</p>
                        {fileName && (
                            <p className="mt-4 text-sm font-medium text-green-700 bg-green-100 dark:bg-green-900/50 dark:text-green-400 px-3 py-1 rounded-full">{fileName}</p>
                        )}
                    </div>
                    <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".csv,.ofx,.txt" />
                </label>
            </div>
        </div>
    </div>
  );
};

export default Import;
