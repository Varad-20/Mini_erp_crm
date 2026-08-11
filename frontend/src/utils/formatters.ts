export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
};

export const formatNumber = (n: number | null | undefined): string => {
  if (n === null || n === undefined) return '—';
  return new Intl.NumberFormat('en-IN').format(n);
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const getApiErrorMessage = (error: unknown, fallback = 'An error occurred'): string => {
  if (error && typeof error === 'object') {
    const axiosErr = error as { response?: { data?: { message?: string } }, message?: string };
    if (axiosErr?.response?.data?.message) {
      return axiosErr.response.data.message;
    }
    if (axiosErr?.message === 'Network Error') {
      return 'Network Error: Cannot connect to the server. Is it running?';
    }
  }
  return fallback;
};
