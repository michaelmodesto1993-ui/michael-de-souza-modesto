// @google/genai Coding Guidelines:
// - Always use `import {GoogleGenAI} from "@google/genai";`.
// - The API key must be obtained exclusively from `process.env.API_KEY`.
// - When using generate content for text answers, use `ai.models.generateContent`.
// - To get JSON, set `responseMimeType: "application/json"` and provide a `responseSchema`.
// - Extract text from the response with `response.text`.
import { GoogleGenAI, Type } from "@google/genai";
import { Account, LearningExample, Transaction, ReconciliationStatus } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export async function parseBankStatementWithAI(statementText: string): Promise<{ date: string, description: string, amount: number }[]> {
    const model = 'gemini-2.5-flash';
    
    const prompt = `Analise o seguinte extrato bancário e extraia as transações. Retorne um array JSON de objetos, onde cada objeto representa uma transação e tem as chaves "date" (no formato "YYYY-MM-DD"), "description" (uma descrição limpa), e "amount" (um número, negativo para débitos, positivo para créditos).
    
    Extrato:
    ${statementText}
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        date: { type: Type.STRING, description: "Data da transação no formato YYYY-MM-DD" },
                        description: { type: Type.STRING, description: "Descrição da transação" },
                        amount: { type: Type.NUMBER, description: "Valor da transação, negativo para débitos" },
                    },
                    required: ["date", "description", "amount"],
                },
            },
            maxOutputTokens: 8192,
            thinkingConfig: { thinkingBudget: 192 },
        },
    });

    const jsonText = response.text.trim();
    try {
        const result = JSON.parse(jsonText);
        return result;
    } catch (e) {
        console.error("Erro ao fazer parse do JSON da IA:", e);
        throw new Error("A IA retornou um formato de JSON inválido.");
    }
}

export async function parseChartOfAccountsWithAI(fileContent: string): Promise<Account[]> {
    const model = 'gemini-2.5-flash';

    const prompt = `Você é um especialista em contabilidade. Analise o seguinte texto, que contém um plano de contas, e extraia todas as contas para um formato JSON. O formato do texto pode variar (CSV, lista, etc.). Retorne um array de objetos, onde cada objeto tem as chaves "id" (o código da conta) e "name" (o nome da conta).
    
    Exemplo de Texto:
    "1.01.01.01.001, Caixa Geral"
    "Ativo Circulante;1.01"

    Conteúdo do Arquivo:
    ${fileContent}
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING, description: "O código da conta contábil" },
                        name: { type: Type.STRING, description: "O nome da conta contábil" },
                    },
                    required: ["id", "name"],
                },
            },
            maxOutputTokens: 8192,
            thinkingConfig: { thinkingBudget: 192 },
        },
    });

    const jsonText = response.text.trim();
    try {
        const result = JSON.parse(jsonText);
        // Basic validation to ensure we have an array of objects with id and name
        if (Array.isArray(result) && result.every(item => typeof item === 'object' && 'id' in item && 'name' in item)) {
            return result;
        }
        throw new Error("O JSON retornado não corresponde ao esquema esperado.");
    } catch (e) {
        console.warn("Falha ao parsear JSON, tentando reparar. Erro original:", e);

        try {
            // Attempt to repair by finding the last complete object in a potential array
            const startIndex = jsonText.indexOf('[');
            const lastBraceIndex = jsonText.lastIndexOf('}');
            
            if (startIndex !== -1 && lastBraceIndex > startIndex) {
                // We have what looks like an array with at least one object.
                const potentialJsonArray = jsonText.substring(startIndex, lastBraceIndex + 1) + ']';
                const result = JSON.parse(potentialJsonArray);
                
                if (Array.isArray(result) && result.every(item => typeof item === 'object' && 'id' in item && 'name' in item)) {
                    console.log("JSON reparado com sucesso!");
                    return result;
                }
            }
        } catch (repairError) {
            console.error("A tentativa de reparo do JSON falhou:", repairError);
            // Fall through to throw the original error
        }
        
        console.error("Erro ao fazer parse do plano de contas da IA:", e);
        throw new Error("A IA retornou um formato de JSON inválido para o plano de contas.");
    }
}


type ReconciliationSuggestion = {
    transactionId: string;
    accountId: string;
}

export async function reconcileTransactions(
    transactions: Transaction[],
    accounts: Account[],
    learningExamples: LearningExample[]
): Promise<ReconciliationSuggestion[]> {
    const model = 'gemini-2.5-pro';

    const examplesString = learningExamples.length > 0 ? `
    Use as seguintes regras, baseadas em correções manuais do usuário, como prioridade máxima para a conciliação. Estas são as "regras de ouro" e devem ser seguidas:
    ${learningExamples.map(ex => `- Para transações com descrição similar a "${ex.description}", use a conta ${ex.accountId} (${accounts.find(a => a.id === ex.accountId)?.name})`).join('\n')}
    ` : '';

    const accountsString = accounts.map(acc => `- ${acc.id}: ${acc.name}`).join('\n');

    const transactionsToReconcile = transactions
        .filter(tx => tx.reconciliation.status === ReconciliationStatus.UNRECONCILED)
        .map(tx => ({ id: tx.id, description: tx.description, amount: tx.amount, type: tx.type }));

    if (transactionsToReconcile.length === 0) {
        return [];
    }

    const prompt = `
    Você é um assistente de contabilidade especialista. Sua tarefa é sugerir a conta contábil correta para cada uma das transações bancárias a seguir, com base no plano de contas brasileiro (SPED) fornecido.
    
    ${examplesString}

    Plano de Contas Disponível para consulta (use as regras acima como prioridade):
    ${accountsString}

    Transações para Conciliar:
    ${JSON.stringify(transactionsToReconcile, null, 2)}

    Analise cada transação e retorne a ID da conta mais apropriada do plano de contas.
    Responda com um array JSON de objetos, onde cada objeto contém "transactionId" e "accountId".
    
    Exemplo de Resposta:
    [
      { "transactionId": "tx-12345-0", "accountId": "4.02.01.01.002" },
      { "transactionId": "tx-12345-1", "accountId": "2.01.01.01.001" }
    ]
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        transactionId: { type: Type.STRING },
                        accountId: { type: Type.STRING },
                    },
                    required: ["transactionId", "accountId"],
                }
            },
            maxOutputTokens: 8192,
            thinkingConfig: { thinkingBudget: 192 },
        },
    });

    try {
        const jsonText = response.text.trim();
        if (!jsonText) return [];
        const result: ReconciliationSuggestion[] = JSON.parse(jsonText);
        // Filter out invalid suggestions
        return result.filter(suggestion => 
            accounts.some(acc => acc.id === suggestion.accountId) &&
            transactionsToReconcile.some(tx => tx.id === suggestion.transactionId)
        );
    } catch (e) {
        console.error("Erro ao fazer parse do JSON da IA para conciliação:", e);
        throw new Error("A IA retornou um formato de JSON inválido para a conciliação.");
    }
}