/**
 * AgriConnect Standard Formatting Utilities
 * Provides consistent formatting for currency, quantities, and dates across all portals.
 */

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '₹0.00';
  }
  return `₹${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatPricePerKg = (price) => {
  if (price === null || price === undefined || isNaN(Number(price))) {
    return '₹0.00/kg';
  }
  return `₹${Number(price).toFixed(2)}/kg`;
};

export const formatQuantity = (quantity, unit = 'kg') => {
  if (quantity === null || quantity === undefined || isNaN(Number(quantity))) {
    return `0 ${unit}`;
  }
  return `${Number(quantity).toLocaleString('en-IN', { maximumFractionDigits: 2 })} ${unit}`;
};

export const formatDate = (dateInput, includeTime = false) => {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    const options = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      ...(includeTime ? { hour: 'numeric', minute: '2-digit', hour12: true } : {}),
    };
    return d.toLocaleDateString('en-IN', options);
  } catch {
    return String(dateInput);
  }
};

export const formatStatus = (status) => {
  if (!status) return '';
  return status
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

export default {
  formatCurrency,
  formatPricePerKg,
  formatQuantity,
  formatDate,
  formatStatus,
};
