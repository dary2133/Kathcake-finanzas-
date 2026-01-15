// app/lib/bulkImport.ts

import * as XLSX from 'xlsx';
import * as pdfjs from 'pdfjs-dist';
import { ParsedRecord } from '@/app/lib/types';

// Set worker source for PDF.js - using CDN for simplicity in local environment
// @ts-ignore
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

/**
 * Parse an Excel file (xls or xlsx) and return an array of ParsedRecord.
 * Expected columns: fecha, producto, cantidad, precio_unitario, total, tipo (INCOME/EXPENSE)
 */
export async function parseExcel(file: File): Promise<ParsedRecord[]> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    // Map rows to ParsedRecord
    const records: ParsedRecord[] = jsonData.map(row => {
        const date = row['fecha'] || row['date'] || '';
        const description = row['producto'] || row['description'] || '';
        const amount = parseFloat(row['total'] || row['amount'] || '0');
        const type = (row['tipo'] || row['type'] || 'INCOME').toUpperCase() as 'INCOME' | 'EXPENSE';
        const quantity = row['cantidad'] ? parseInt(row['cantidad'], 10) : undefined;
        const category = row['categoria'] || row['category'] || '';
        return {
            date,
            description,
            amount,
            type,
            category,
            quantity,
        } as ParsedRecord;
    });

    return records;
}

/**
 * Parse a PDF file using pdfjs-dist for client-side text extraction.
 */
export async function parsePdf(file: File): Promise<ParsedRecord[]> {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item: any) => item.str);
        fullText += strings.join(' ') + '\n';
    }

    const lines = fullText.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
    const records: ParsedRecord[] = [];

    // Regex for YYYY-MM-DD or DD/MM/YYYY and typical sales row
    const lineRegex = /(\d{2,4}[-/]\d{2}[-/]\d{2,4})\s+([^\s]+)\s+(\d+)\s+(\d+(?:[.,]\d+)?)\s+(\d+(?:[.,]\d+)?)/;

    for (const line of lines) {
        const match = lineRegex.exec(line);
        if (match) {
            const date = match[1];
            const product = match[2];
            const qty = match[3];
            const total = match[5];

            records.push({
                date,
                description: product,
                amount: parseFloat(total.replace(',', '.')),
                type: 'INCOME',
                quantity: parseInt(qty, 10),
                category: 'Ventas',
            } as ParsedRecord);
        }
    }
    return records;
}

/**
 * Convert an image file (JPG/PNG) to a base64 data URL.
 * The resulting string can be stored in the Transaction.attachmentUrl field.
 */
export function getBase64FromFile(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') resolve(reader.result);
            else reject(new Error('Failed to read file'));
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}
