import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Processes an array of transactions into monthly data.
 * Groups by month, sums up amounts by direction.
 *
 * @param {Object[]} transactions - Array of transaction objects
 * @param {number} count - Number of months to display
 * @param {string} direction - 'credit' for earnings, 'debit' for spending, 'all' for both
 */
function processMonthlyData(transactions, count = 6, direction = 'credit') {
  const now = new Date();
  const monthlyData = [];

  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData.push({
      month: MONTHS[date.getMonth()],
      fullMonth: `${MONTHS[date.getMonth()]} ${date.getFullYear()}`,
      key: monthKey,
      earnings: 0,
      spending: 0,
      withdrawals: 0,
      count: 0,
    });
  }

  transactions.forEach((tx) => {
    const txDate = new Date(tx.created_at);
    const txMonthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
    const bucket = monthlyData.find((m) => m.key === txMonthKey);

    if (!bucket) return;

    const amt = parseFloat(tx.amount) || 0;
    if (amt <= 0) return;

    if (tx.direction === 'credit') {
      bucket.earnings += amt;
      bucket.count += 1;
    } else if (tx.direction === 'debit') {
      // Skip platform_fee and processing_fee for spending chart (they're sub-costs)
      if (tx.type === 'platform_fee' || tx.type === 'processing_fee') {
        bucket.spending += amt;
      } else if (tx.type === 'withdrawal') {
        bucket.withdrawals += amt;
      } else {
        bucket.spending += amt;
        bucket.count += 1;
      }
    }
  });

  return monthlyData.map((m) => ({
    ...m,
    earnings: Math.round(m.earnings * 100) / 100,
    spending: Math.round(m.spending * 100) / 100,
    withdrawals: Math.round(m.withdrawals * 100) / 100,
  }));
}

/**
 * Custom tooltip for the chart
 */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="mt-2 flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-sm text-gray-600 capitalize">{entry.name}:</span>
          <span className="text-sm font-bold text-ink-900">
            {new Intl.NumberFormat('en-ET', {
              style: 'currency',
              currency: 'ETB',
              minimumFractionDigits: 0,
            }).format(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Custom bar shape with rounded corners
 */
function RoundedBar(props) {
  const { fill, x, y, width, height } = props;
  if (!height || height <= 0) return null;

  const radius = Math.min(6, width / 2, height);

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        rx={radius}
        ry={radius}
      />
    </g>
  );
}

/**
 * EarningsChart — displays a bar chart of monthly earnings or spending
 *
 * @param {Object[]} transactions - Array of transaction objects with created_at, amount, direction, type
 * @param {number} months - Number of months to display (default: 6)
 * @param {string} direction - 'credit' for earnings, 'debit' for spending (default: 'credit')
 * @param {string} barColor - Bar fill color (default: '#10b981' for earnings, '#ef4444' for spending)
 * @param {string} barColorHighlight - Highlight color for peak month
 */
export default function EarningsChart({ transactions = [], months = 6, direction = 'credit', barColor, barColorHighlight }) {
  const chartData = useMemo(
    () => processMonthlyData(transactions, months, direction),
    [transactions, months, direction]
  );

  const dataKey = direction === 'debit' ? 'spending' : 'earnings';
  const defaultColor = direction === 'debit' ? '#ef4444' : '#10b981';
  const defaultHighlight = direction === 'debit' ? '#dc2626' : '#059669';
  const fill = barColor || defaultColor;
  const highlight = barColorHighlight || defaultHighlight;

  const maxValue = Math.max(...chartData.map((d) => d[dataKey]), 1);

  const formatCurrency = (value) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value;
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          barCategoryGap="20%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f0f0f0"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickFormatter={formatCurrency}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
          <Bar
            dataKey={dataKey}
            name={direction === 'debit' ? 'Spending' : 'Earnings'}
            fill={fill}
            shape={<RoundedBar />}
            animationBegin={0}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry[dataKey] === maxValue
                    ? highlight
                    : fill
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
