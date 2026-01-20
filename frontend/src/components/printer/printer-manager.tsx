// components/printer/printer-manager.js
import React, { useState, useEffect } from 'react';

const LOCAL_SERVICE_URL = 'http://localhost:3001';

export const usePrinterManager = () => {
    const [printerStatus, setPrinterStatus] = useState({
        available: false,
        loading: true,
        type: 'unknown'
    });

    // Detectar si el servicio local está disponible
    useEffect(() => {
        checkPrinterService();
    }, []);

    const checkPrinterService = async () => {
        try {
            const response = await fetch(`${LOCAL_SERVICE_URL}/status`, {
                method: 'GET',
                // Timeout corto para no bloquear si no hay servicio
                signal: AbortSignal.timeout(1000)
            });

            if (response.ok) {
                const data = await response.json();
                setPrinterStatus({
                    available: true,
                    loading: false,
                    type: 'local-service',
                    details: data
                });
                return true;
            }
        } catch (error) {
            // Silenciar error - solo significa que no hay servicio local
        }

        // Si no hay servicio local, verificar otras opciones
        const browserPrintAvailable = 'print' in window;
        setPrinterStatus({
            available: browserPrintAvailable,
            loading: false,
            type: browserPrintAvailable ? 'browser' : 'none'
        });

        return false;
    };

    const printReceipt = async (saleData: any, companyInfo: any = {}) => {
        // Preparar datos para impresión
        const printData = {
            receipt: {
                invoiceNumber: saleData.invoiceNumber || `VENTA-${Date.now()}`,
                customerName: saleData.customer?.name || 'Mostrador',
                items: saleData.items || [],
                subtotal: saleData.subtotal || 0,
                tax: saleData.tax || 0,
                discount: saleData.discount || 0,
                total: saleData.total || 0,
                footerMessage: companyInfo.footerMessage || '¡Gracias por su compra!',
                timestamp: new Date().toISOString()
            }
        };

        // INTENTO 1: Servicio local (impresión directa)
        if (printerStatus.type === 'local-service') {
            try {
                const response = await fetch(`${LOCAL_SERVICE_URL}/print/receipt`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(printData)
                });

                if (response.ok) {
                    const result = await response.json();
                    return {
                        success: true,
                        method: 'direct',
                        message: '✅ Factura impresa directamente',
                        data: result
                    };
                }
            } catch (error) {
                console.log('Servicio local no disponible, usando navegador');
            }
        }

        // INTENTO 2: Impresión en navegador
        return await printInBrowser(printData.receipt);
    };

    const printInBrowser = (receiptData: any) => {
        return new Promise((resolve) => {
            const printWindow = window.open('', '_blank');

            const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Factura ${receiptData.invoiceNumber}</title>
    <style>
        @media print {
            @page { margin: 0; size: 80mm; }
            body { 
                font-family: 'Courier New', monospace;
                font-size: 12px;
                width: 80mm;
                margin: 0;
                padding: 10px;
            }
            .no-print { display: none !important; }
        }
        
        .receipt {
            width: 80mm;
            padding: 10px;
        }
        .header { text-align: center; margin-bottom: 10px; }
        .item { display: flex; justify-content: space-between; }
        .total { font-weight: bold; border-top: 2px solid #000; padding-top: 5px; }
        button { margin-top: 20px; padding: 10px 20px; }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            <h3>KATHCAKE POS</h3>
            <p>${new Date().toLocaleString()}</p>
            <hr>
            <p><strong>FACTURA:</strong> ${receiptData.invoiceNumber}</p>
            <p><strong>CLIENTE:</strong> ${receiptData.customerName}</p>
            <hr>
        </div>
        
        <div class="items">
            ${receiptData.items.map(item => `
                <div class="item">
                    <span>${item.name} x${item.quantity}</span>
                    <span>$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `).join('')}
        </div>
        
        <hr>
        <div class="item">SUBTOTAL: $${receiptData.subtotal.toFixed(2)}</div>
        <div class="item">IVA: $${receiptData.tax.toFixed(2)}</div>
        ${receiptData.discount > 0 ?
                    `<div class="item">DESCUENTO: -$${receiptData.discount.toFixed(2)}</div>` : ''}
        <div class="item total">TOTAL: $${receiptData.total.toFixed(2)}</div>
        <hr>
        
        <div class="footer">
            <p>${receiptData.footerMessage}</p>
        </div>
    </div>
    
    <div class="no-print" style="text-align: center;">
        <button onclick="window.print()">🖨️ Imprimir Ahora</button>
        <button onclick="window.close()">Cerrar</button>
    </div>
    
    <script>
        // Auto-imprimir después de medio segundo
        setTimeout(() => {
            window.print();
            // Opcional: cerrar después de 2 segundos
            setTimeout(() => {
                window.close();
            }, 2000);
        }, 500);
    </script>
</body>
</html>`;

            printWindow.document.write(html);
            printWindow.document.close();

            resolve({
                success: true,
                method: 'browser',
                message: '📄 Abriendo ventana de impresión...'
            });
        });
    };

    const testPrinter = async () => {
        if (printerStatus.type === 'local-service') {
            try {
                const response = await fetch(`${LOCAL_SERVICE_URL}/print/test`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ test: true })
                });

                if (response.ok) {
                    return { success: true, message: '✅ Prueba enviada a impresora' };
                }
            } catch (error) {
                return {
                    success: false,
                    message: '❌ Error con servicio local',
                    error: error.message
                };
            }
        }

        // Si no hay servicio, usar navegador
        return await printInBrowser({
            invoiceNumber: 'TEST-001',
            customerName: 'PRUEBA',
            items: [{ name: 'Producto prueba', quantity: 1, price: 100 }],
            subtotal: 100,
            tax: 16,
            total: 116,
            footerMessage: 'Prueba de impresión'
        });
    };

    return {
        printerStatus,
        printReceipt,
        testPrinter,
        checkPrinterService
    };
};
