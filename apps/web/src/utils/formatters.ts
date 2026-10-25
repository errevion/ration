export function formatMetricAmount(amount: number): string {
  if (amount === 0) return "0";
  const sign = amount < 0 ? "-" : "";
  const val = Math.abs(amount);

  if (val < 1000) {
    return `${sign}${Math.round(val)}`;
  }
  if (val < 1_000_000) {
    const thousands = val / 1000;
    const formatted =
      thousands >= 100
        ? Math.round(thousands).toString()
        : (Math.round(thousands * 10) / 10).toString();
    return `${sign}${formatted}k`;
  }
  if (val < 1_000_000_000) {
    const millions = val / 1_000_000;
    const formatted =
      millions >= 100
        ? Math.round(millions).toString()
        : (Math.round(millions * 10) / 10).toString();
    return `${sign}${formatted}m`;
  }

  const billions = val / 1_000_000_000;
  const formatted =
    billions >= 100 ? Math.round(billions).toString() : (Math.round(billions * 10) / 10).toString();
  return `${sign}${formatted}b`;
}

export function formatCurrency(amount: number, currency: string): string {
  const rounded = Math.round(amount);
  return `${currency}${rounded.toLocaleString()}`;
}
