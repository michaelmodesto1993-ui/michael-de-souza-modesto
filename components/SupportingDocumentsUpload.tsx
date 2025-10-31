import React, { useCallback } from 'react';
import { PaperclipIcon, TrashIcon, UploadIcon } from './Icons';
import { SupportingDocument } from '../types';
import * as XLSX from 'xlsx';

declare global {
    interface Window {
        XLSX: typeof XLSX;
    }
}
const XLSX_ = window.XLSX;

interface SupportingDocumentsUploadProps {
  documents: SupportingDocument[];
  onUpload: (files: SupportingDocument[]) => void;
  onRemove: (fileName: string) => void;
}

const SupportingDocumentsUpload: React.FC<SupportingDocumentsUploadProps> = ({ documents, onUpload, onRemove }) => {
    
    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const filePromises = Array.from(files).map((file: File) => {
            return new Promise<SupportingDocument>((resolve, reject) => {
                const fileName = file.name.toLowerCase();
                const isExcel = fileName.endsWith('.xlsx');
                const isCsv = fileName.endsWith('.csv');

                if (isExcel || isCsv) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const data = e.target?.result as ArrayBuffer;
                            let textContent = '';
                            if (isExcel) {
                                const workbook = XLSX_.read(data, { type: 'array' });
                                workbook.SheetNames.forEach(sheetName => {
                                    textContent += `Conteúdo do arquivo ${file.name} (Planilha: ${sheetName}):\n`;
                                    const worksheet = workbook.Sheets[sheetName];
                                    textContent += XLSX_.utils.sheet_to_csv(worksheet);
                                    textContent += '\n\n';
                                });
                            } else { // isCsv
                               textContent = new TextDecoder().decode(data);
                               textContent = `Conteúdo do arquivo CSV ${file.name}:\n${textContent}\n\n`;
                            }

                            resolve({
                                name: file.name,
                                content: textContent,
                                mimeType: 'text/plain', 
                            });
                        } catch (error) {
                            console.error(`Error parsing ${file.name}:`, error);
                            reject(new Error(`Falha ao processar o arquivo ${file.name}.`));
                        }
                    };
                    reader.onerror = (error) => reject(error);
                    reader.readAsArrayBuffer(file);
                } else { // For images, PDF, etc.
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        resolve({
                            name: file.name,
                            content: e.target?.result as string, // data URL
                            mimeType: file.type,
                        });
                    };
                    reader.onerror = (error) => reject(error);
                    reader.readAsDataURL(file);
                }
            });
        });

        try {
            const loadedDocuments = await Promise.all(filePromises);
            onUpload(loadedDocuments);
        } catch (error) {
            console.error("Error processing supporting documents:", error);
        }
        
        event.target.value = ''; // Reset input
    }, [onUpload]);

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-md font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <PaperclipIcon className="w-5 h-5" />
                    Documentos de Apoio (Opcional)
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Anexe comprovantes (PDF, Imagens) ou planilhas (XLSX, CSV) para ajudar a IA na conciliação.
                </p>
            </div>

            <label htmlFor="support-doc-upload" className="relative flex justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600">
                <div className="text-center">
                    <UploadIcon className="mx-auto h-8 w-8 text-slate-400" />
                    <span className="mt-2 block text-sm font-semibold text-teal-600 dark:text-teal-500">
                        Clique para carregar arquivos
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">PDF, PNG, JPG, XLSX, CSV</p>
                </div>
            </label>
            <input 
                id="support-doc-upload" 
                type="file" 
                className="hidden" 
                onChange={handleFileChange} 
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.xlsx,.csv"
            />
            
            {documents.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-600 dark:text-slate-300">Arquivos Carregados:</h4>
                    <ul className="divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-md">
                        {documents.map((doc) => (
                            <li key={doc.name} className="flex items-center justify-between p-2 text-sm">
                                <span className="truncate text-slate-700 dark:text-slate-200 font-medium">{doc.name}</span>
                                <button onClick={() => onRemove(doc.name)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full" aria-label={`Remover ${doc.name}`}>
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SupportingDocumentsUpload;