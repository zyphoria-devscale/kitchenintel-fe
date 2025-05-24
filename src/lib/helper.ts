

export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

// Helper function to format large numbers
export const formatNumber = (value: number) => {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
};

// Helper function to convert timestamp to readable date
export const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('id-ID', {
        month: 'short',
        day: 'numeric'
    });
};

// Helper function to get day name from timestamp
export const getDayName = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('id-ID', {
        weekday: 'short'
    });
};