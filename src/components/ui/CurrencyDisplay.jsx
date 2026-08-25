import { usePlatform } from '../../hooks/usePlatform';
import { formatCurrency, formatCurrencyCompact } from '../../utils/format';

/**
 * Displays an amount in the platform's default currency.
 *
 * Usage:
 *   <CurrencyDisplay amount={1500} />
 *   <CurrencyDisplay amount={1500} compact />
 *   <CurrencyDisplay amount={1500} currency="USD" />
 */
export default function CurrencyDisplay({ amount, compact = false, currency, className }) {
  const { settings } = usePlatform();
  const displayCurrency = currency ?? settings.default_currency ?? 'ETB';

  if (compact) {
    return (
      <span className={className}>
        {formatCurrencyCompact(amount, displayCurrency)}
      </span>
    );
  }

  return (
    <span className={className}>
      {formatCurrency(amount, displayCurrency)}
    </span>
  );
}
