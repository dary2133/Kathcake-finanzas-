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

    // Handle YYYY-MM-DD strings to avoid timezone shifts
    const parts = dateString.split('-');
    if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        return new Date(year, month, day).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    return new Date(dateString).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

export const parseLocalDate = (dateString: string) => {
    if (!dateString) return new Date();
    const parts = dateString.split('-');
    if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    return new Date(dateString);
};
