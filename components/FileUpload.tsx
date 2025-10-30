import React, { useState, useCallback } from 'react';
import { Transaction, TransactionType, ReconciliationStatus } from '../types';
import { UploadIcon } from './Icons';
import { parseBankStatementWithAI } from '../services/geminiService';

interface FileUploadProps {
  onTransactionsParsed: (transactions: Transaction[]) => void;
  setLoading: (loading: boolean) => void;
  setLoadingMessage: (message: string) => void;
  setError: (error: string | null) => void;
}

const parseOfx = (ofxContent: string): { date: string, description: string, amount: number }[] => {
    const transactions: { date: string, description: string, amount: number }[] = [];
    
    const tranListMatch = ofxContent.match(/<BANKTRANLIST>([\s\S]*?)<\/BANKTRANLIST>/);
    if (!tranListMatch) {
        throw new Error("Formato OFX inválido: tag <BANKTRANLIST> não encontrada.");
    }
    const tranListContent = tranListMatch[1];

    const transactionMatches = tranListContent.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/g);
    if (!transactionMatches) {
        return [];
    }

    transactionMatches.forEach(t => {
        const memoMatch = t.match(/<MEMO>(.*?)</);
        const amountMatch = t.match(/<TRNAMT>(.*?)</);
        const dateMatch = t.match(/<DTPOSTED>(.*?)</);

        if (memoMatch && amountMatch && dateMatch) {
            const amount = parseFloat(amountMatch[1]);
            const rawDate = dateMatch[1].substring(0, 8); // YYYYMMDD from YYYYMMDDHHMMSS...
            const formattedDate = `${rawDate.substring(0, 4)}-${rawDate.substring(4, 6)}-${rawDate.substring(6, 8)}`;
            
            transactions.push({
                date: formattedDate,
                description: memoMatch[1].trim(),
                amount: amount,
            });
        }
    });

    return transactions;
}


const FileUpload: React.FC<FileUploadProps> = ({ onTransactionsParsed, setLoading, setLoadingMessage, setError }) => {
  const [fileName, setFileName] = useState<string | null>(null);

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

      const transactions: Transaction[] = rawTransactions.map((t, index) => ({
        id: `tx-${Date.now()}-${index}`,
        date: t.date,
        description: t.description,
        amount: Math.abs(t.amount),
        type: t.amount < 0 ? TransactionType.DEBIT : TransactionType.CREDIT,
        reconciliation: {
          accountId: null,
          status: ReconciliationStatus.UNRECONCILED,
        },
      }));

      onTransactionsParsed(transactions);
    } catch (err: any) {
      console.error("Erro ao processar o arquivo:", err);
      setError(err.message || "Não foi possível processar o arquivo. Verifique o formato ou o conteúdo.");
    } finally {
      setLoading(false);
      setLoadingMessage('');
      event.target.value = '';
    }
  }, [onTransactionsParsed, setLoading, setLoadingMessage, setError]);

  return (
    <div className="w-full max-w-lg mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
      <label
        htmlFor="file-upload"
        className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <UploadIcon className="w-10 h-10 mb-3 text-slate-400 dark:text-slate-500" />
          <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-teal-600 dark:text-teal-500">Clique para carregar</span> ou arraste e solte
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Extrato bancário em formato OFX, CSV ou TXT</p>
          {fileName && (
            <p className="mt-4 text-sm font-medium text-green-700 bg-green-100 dark:bg-green-900/50 dark:text-green-400 px-3 py-1 rounded-full">{fileName}</p>
          )}
        </div>
        <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".csv,.ofx,.txt" />
      </label>
    </div>
  );
};

export default FileUpload;