// components/print-button.jsx
import React, { useState } from 'react';
import { usePrinterManager } from './printer-manager';

const PrintButton = ({ saleData, companyInfo, onPrintComplete }: any) => {
    const [printing, setPrinting] = useState(false);
    const { printerStatus, printReceipt, testPrinter } = usePrinterManager();

    const handlePrint = async () => {
        if (!saleData || saleData.items?.length === 0) {
            alert('No hay datos para imprimir');
            return;
        }

        setPrinting(true);

        try {
            const result = await printReceipt(saleData, companyInfo);

            if (onPrintComplete) {
                onPrintComplete(result);
            }

            // Mostrar notificación según el método usado
            if (result.method === 'direct') {
                alert('✅ Factura impresa directamente en la impresora térmica');
            } else {
                alert('📄 Se abrió ventana de impresión. Use Ctrl+P para imprimir.');
            }
        } catch (error) {
            alert('❌ Error al imprimir: ' + error.message);
        } finally {
            setPrinting(false);
        }
    };

    const handleTestPrint = async () => {
        const result = await testPrinter();
        alert(result.message);
    };

    return (
        <div className="print-controls">
            <button
                onClick={handlePrint}
                disabled={printing || !printerStatus.available}
                className={`print-btn ${printerStatus.type === 'local-service' ? 'direct-print' : 'browser-print'}`}
            >
                {printing ? (
                    <>🔄 Imprimiendo...</>
                ) : printerStatus.type === 'local-service' ? (
                    <>🖨️ Imprimir Factura (Directo)</>
                ) : (
                    <>🖨️ Imprimir Factura (Navegador)</>
                )}
            </button>

            <div className="printer-status">
                <small>
                    {printerStatus.loading ? '🔍 Detectando impresora...' :
                        printerStatus.type === 'local-service' ?
                            '✅ Impresión directa disponible' :
                            '🌐 Usando impresión del navegador'}
                </small>
            </div>

            <button
                onClick={handleTestPrint}
                className="test-print-btn"
                title="Probar impresora"
            >
                🔧 Probar
            </button>
        </div>
    );
};

export default PrintButton;
