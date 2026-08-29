import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const formatCurrency = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return value;
};

const formatFullCurrency = (value) => {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 0,
  }).format(value);
};

/**
 * Custom tooltip for the chart
 */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xl min-w-[200px]">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-1">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-gray-600">{entry.name}</span>
          </div>
          <span className="text-xs font-bold text-ink-900">{formatFullCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Custom legend
 */
function CustomLegend({ payload }) {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-xs font-semibold text-gray-600">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * RevenueComparisonChart — displays monthly revenue trends
 *
 * @param {Object[]} data - Array of monthly revenue data
 */
export default function RevenueComparisonChart({ data = [] }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((item) => ({
      name: item.month,
      'Payment Volume': item.payment_volume || 0,
      'Platform Revenue': item.platform_revenue || 0,
      'Released Funds': item.released_funds || 0,
    }));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
          <span className="text-2xl">📊</span>
        </div>
        <p className="mt-3 text-sm font-semibold text-gray-500">No revenue data yet</p>
        <p className="text-xs text-gray-400">Revenue data will appear here once transactions occur</p>
      </div>
    );
  }

  // Calculate totals for summary
  const totals = chartData.reduce(
    (acc, item) => ({
      paymentVolume: acc.paymentVolume + item['Payment Volume'],
      platformRevenue: acc.platformRevenue + item['Platform Revenue'],
      releasedFunds: acc.releasedFunds + item['Released Funds'],
    }),
    { paymentVolume: 0, platformRevenue: 0, releasedFunds: 0 }
  );

  return (
    <div className="w-full">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-center">
          <p className="text-[10px] font-bold uppercase text-emerald-600">Total Volume</p>
          <p className="mt-1 text-lg font-extrabold text-emerald-900">{formatCurrency(totals.paymentVolume)}</p>
        </div>
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-center">
          <p className="text-[10px] font-bold uppercase text-blue-600">Total Revenue</p>
          <p className="mt-1 text-lg font-extrabold text-blue-900">{formatCurrency(totals.platformRevenue)}</p>
        </div>
        <div className="rounded-xl bg-violet-50 border border-violet-200 p-3 text-center">
          <p className="text-[10px] font-bold uppercase text-violet-600">Total Released</p>
          <p className="mt-1 text-lg font-extrabold text-violet-900">{formatCurrency(totals.releasedFunds)}</p>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorReleased" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="name"
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
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          <Area
            type="monotone"
            dataKey="Payment Volume"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorVolume)"
            animationBegin={0}
            animationDuration={800}
          />
          <Area
            type="monotone"
            dataKey="Platform Revenue"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
            animationBegin={200}
            animationDuration={800}
          />
          <Area
            type="monotone"
            dataKey="Released Funds"
            stroke="#8b5cf6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorReleased)"
            animationBegin={400}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
