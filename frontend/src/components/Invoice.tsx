import type { Product, Setting } from '../types';
import React from 'react';

interface InvoiceProps {
    sale: any;
    settings: any;
    sellerName?: string;
}

export default function Invoice({ sale, settings, sellerName }: InvoiceProps) {
    if (!sale) return null;

    const currency = settings?.currencySymbol || 'RD$';
    const taxRate = settings?.taxRate || 18;

    return (
        <div id="invoice-receipt" className="bg-white p-10 max-w-[450px] mx-auto text-slate-900 font-sans shadow-2xl relative overflow-hidden border-t-[6px] border-slate-900">
            {/* Logo Section */}
            <div className="flex flex-col items-center mb-8">
                {settings?.logo ? (
                    <img src={settings.logo} alt="Business Logo" className="w-24 h-24 object-contain mb-4" />
                ) : (
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-4">
                        <span className="text-white font-black text-2xl italic tracking-tighter">K</span>
                    </div>
                )}
                <h1 className="text-2xl font-black uppercase italic tracking-tighter leading-none">{settings?.businessName || 'KathCake Reposteria'}</h1>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 italic">Facturación Electrónica</p>
            </div>

            {/* Compact Header Info */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-6 mb-6">
                <div className="text-[10px] font-bold text-slate-500 space-y-1">
                    <p className="flex items-center gap-2"><span className="w-1 h-1 bg-slate-300 rounded-full"></span> {settings?.address}</p>
                    <p className="flex items-center gap-2"><span className="w-1 h-1 bg-slate-300 rounded-full"></span> {settings?.phone}</p>
                    <p className="flex items-center gap-2"><span className="w-1 h-1 bg-slate-300 rounded-full"></span> {settings?.email}</p>
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic leading-none mb-1">Factura N°</p>
                    <p className="text-base font-black italic tracking-tighter leading-none">{sale.invoiceNumber}</p>
                </div>
            </div>

            {/* Sale Info Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 text-[11px]">
                <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 italic">Fecha de Emisión</label>
                    <p className="font-bold text-slate-900">{new Date(sale.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 italic">Vendedor</label>
                    <p className="font-bold text-slate-900 truncate">{sellerName || sale.seller?.name || 'Vendedor'}</p>
                </div>
                <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 italic">Cliente</label>
                    <p className="font-bold text-slate-900">{sale.customer?.name || 'Cliente de Mostrador'}</p>
                </div>
                <div className="text-right">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 italic">Estado / Pago</label>
                    <p className="font-black uppercase italic text-emerald-600">
                        {sale.status === 'paid' ? 'PAGADA' : sale.status} - {sale.paymentMethod === 'cash' ? 'EFECTIVO' : 'TARJETA'}
                    </p>
                </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
                <div className="grid grid-cols-12 gap-2 text-[8px] font-black uppercase text-slate-400 mb-3 px-2 italic tracking-widest border-b border-slate-50 pb-2">
                    <div className="col-span-1">#</div>
                    <div className="col-span-6">Descripción del Producto</div>
                    <div className="col-span-2 text-center">Cant</div>
                    <div className="col-span-3 text-right">Total</div>
                </div>

                <div className="space-y-4">
                    {sale.items?.map((item: any, idx: number) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 text-[11px] px-2 items-center group">
                            <div className="col-span-1 font-black text-slate-300 italic">{(idx + 1).toString().padStart(2, '0')}</div>
                            <div className="col-span-6 font-black text-slate-900 uppercase italic tracking-tighter truncate">{item.productName}</div>
                            <div className="col-span-2 text-center font-bold text-slate-500">x{item.quantity}</div>
                            <div className="col-span-3 text-right font-black text-slate-900 italic">{currency}{(item.unitPrice * item.quantity).toFixed(2)}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Clear, Bold Totals Section */}
            <div className="bg-slate-50 rounded-3xl p-8 space-y-3 mb-8">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                    <span>Subtotal Neto</span>
                    <span className="text-slate-600 font-bold">{currency}{sale.subtotal?.toFixed(2)}</span>
                </div>
                {sale.discount > 0 && (
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-red-400 italic">
                        <span>Descuento aplicado</span>
                        <span className="font-bold">-{currency}{sale.discount?.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                    <span>ITBIS ({taxRate}%)</span>
                    <span className="text-slate-600 font-bold">{currency}{sale.tax?.toFixed(2)}</span>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-200/60 flex justify-between items-end">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-slate-900 italic tracking-widest leading-none">Total Final</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase mt-1">Impuestos incluidos</span>
                    </div>
                    <div className="text-right">
                        <span className="text-4xl font-black italic tracking-tighter leading-none text-slate-900">
                            {currency}{sale.total?.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Social Media & Footer */}
            <div className="text-center space-y-6">
                <div className="flex justify-center gap-6 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                    {/* These are placeholder icons for the print view */}
                    <span className="text-[8px] font-bold uppercase tracking-widest">Instagram: {settings?.instagram || '@kathcake'}</span>
                    <span className="text-[8px] font-bold uppercase tracking-widest">Web: {settings?.website || 'kathcake.com'}</span>
                </div>

                <div className="pt-6 border-t border-dashed border-slate-200">
                    <p className="text-[14px] font-black uppercase italic tracking-tighter mb-1 leading-none">¡Gracias por preferirnos!</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">KathCake - Dulzura que se comparte</p>
                </div>

                <div className="flex flex-col items-center gap-2 opacity-10">
                    <div className="w-full h-8 border-y-2 border-slate-900 flex items-center justify-around font-black text-[6px]">
                        ||| || |||| || ||| || |||| || |||| || ||| || |||| || ||| || |||| ||
                    </div>
                    <span className="text-[7px] font-black">7 452309 881204</span>
                </div>
            </div>
        </div>
    );
}
