'use client';

import { useState } from 'react';
import { ParsedRecord, TransactionType, Transaction } from '@/app/lib/types';
import { parseExcel, parsePdf, getBase64FromFile } from '@/app/lib/bulkImport';
import { addTransactions } from '@/app/lib/actions';

interface BulkUploadFormProps {
    type: TransactionType;
    onSuccess: () => void;
}

export default function BulkUploadForm({ type, onSuccess }: BulkUploadFormProps) {
    const [isParsing, setIsParsing] = useState(false);
    const [preview, setPreview] = useState<ParsedRecord[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        setError(null);
        setPreview([]);

        try {
            let records: ParsedRecord[] = [];
            const fileExt = file.name.split('.').pop()?.toLowerCase();

            if (fileExt === 'xlsx' || fileExt === 'xls') {
                records = await parseExcel(file);
            } else if (fileExt === 'pdf') {
                records = await parsePdf(file);
            } else if (['jpg', 'jpeg', 'png'].includes(fileExt || '')) {
                // For images, we just create one entry with the image attached if we don't have OCR
                const base64 = await getBase64FromFile(file);
                records = [{
                    date: new Date().toISOString().split('T')[0],
                    description: `Carga de imagen: ${file.name}`,
                    category: type === 'INCOME' ? 'Ventas' : 'Insumos',
                    amount: 0,
                    type: type,
                    attachmentUrl: base64
                }];
            } else {
                throw new Error('Formato de archivo no soportado. Usa Excel, PDF o Imagen.');
            }

            // Filter by type if information is available in the file
            const filtered = records.filter(r => !r.type || r.type === type);
            setPreview(filtered);
        } catch (err: any) {
            setError(err.message || 'Error al procesar el archivo');
        } finally {
            setIsParsing(false);
        }
    };

    const handleConfirm = async () => {
        if (preview.length === 0) return;

        const newTransactions: Transaction[] = preview.map(record => ({
            id: crypto.randomUUID(),
            date: record.date || new Date().toISOString().split('T')[0],
            type: record.type || type,
            category: record.category || (type === 'INCOME' ? 'Ventas' : 'Otros'),
            description: record.description || 'Importación masiva',
            amount: record.amount || 0,
            paymentMethod: 'Transferencia', // Default
            status: 'PAID',
            attachmentUrl: record.attachmentUrl
        }));

        await addTransactions(newTransactions);
        setPreview([]);
        onSuccess();
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">Carga Masiva</h3>
                <span className="text-xs text-slate-400">PDF, Excel, JPG</span>
            </div>

            <div className="relative group">
                <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.xlsx,.xls,.jpg,.jpeg,.png"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="border-2 border-dashed border-slate-200 group-hover:border-purple-400 rounded-xl p-8 text-center transition-colors">
                    <p className="text-slate-500 text-sm">
                        {isParsing ? 'Procesando...' : 'Suelta aquí tu reporte o haz clic para subir'}
                    </p>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-lg border border-rose-100">
                    {error}
                </div>
            )}

            {preview.length > 0 && (
                <div className="space-y-4 animate-fade-in">
                    <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 sticky top-0 border-b border-slate-100">
                                <tr>
                                    <th className="px-4 py-2 font-semibold text-slate-600">Fecha</th>
                                    <th className="px-4 py-2 font-semibold text-slate-600">Descripción</th>
                                    <th className="px-4 py-2 text-right font-semibold text-slate-600">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {preview.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="px-4 py-2 text-slate-500">{row.date}</td>
                                        <td className="px-4 py-2 text-slate-700 font-medium">{row.description}</td>
                                        <td className="px-4 py-2 text-right font-bold text-slate-800">{row.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setPreview([])}
                            className="flex-1 py-2 px-4 rounded-xl text-slate-600 font-medium bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex-1 py-2 px-4 rounded-xl text-white font-medium bg-purple-600 hover:bg-purple-700 transition-colors"
                        >
                            Confirmar Importación ({preview.length})
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
