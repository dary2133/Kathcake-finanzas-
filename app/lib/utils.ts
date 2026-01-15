export const formatCurrency = (amount: number, currency: string, symbol: string) => {
    return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: currency,
        currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount).replace(currency, symbol + ' '); // Manual override to ensure custom symbol usage
};

export const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};
