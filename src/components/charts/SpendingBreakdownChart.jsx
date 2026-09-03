import { useMemo } from 'react';
import { getPlatformCurrency } from '../../utils/format';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const COLORS = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#64748b', // slate
];

/**
 * Processes transactions into spending by freelancer data
 */
function processSpendingData(transactions) {
  const freelancerMap = {};

  transactions.forEach((tx) => {
    // Only count debit transactions (money going out) for spending
    if (tx.direction === 'debit' && tx.freelancer) {
      const freelancerId = tx.freelancer.id;
      const freelancerName = tx.freelancer.name || 'Unknown';

      if (!freelancerMap[freelancerId]) {
        freelancerMap[freelancerId] = {
          id: freelancerId,
          name: freelancerName,
          total: 0,
          count: 0,
          avatar: freelancerName.charAt(0).toUpperCase(),
        };
      }

      freelancerMap[freelancerId].total += parseFloat(tx.amount) || 0;
      freelancerMap[freelancerId].count += 1;
    }
  });

  // Sort by total spending (highest first)
  return Object.values(freelancerMap)
    .sort((a, b) => b.total - a.total)
    .map((item, index) => ({
      ...item,
      total: Math.round(item.total * 100) / 100,
      color: COLORS[index % COLORS.length],
      name: item.name.length > 12 ? item.name.substring(0, 12) + '...' : item.name,
      fullName: item.name,
    }));
}

/**
 * Custom tooltip for pie chart
 */
function CustomPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: data.color }} />
        <p className="text-sm font-bold text-ink-900">{data.fullName}</p>
      </div>
      <div className="mt-2 space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-xs text-gray-500">Total Spent</span>
          <span className="text-sm font-bold text-ink-900">
            {new Intl.NumberFormat('en-ET', {
              style: 'currency',
              currency: getPlatformCurrency(),
              minimumFractionDigits: 0,
            }).format(data.total)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-xs text-gray-500">Transactions</span>
          <span className="text-xs font-semibold text-gray-700">{data.count}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Custom tooltip for bar chart
 */
function CustomBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
      <p className="text-sm font-bold text-ink-900">{label}</p>
      <p className="mt-1 text-sm text-gray-600">
        {new Intl.NumberFormat('en-ET', {
          style: 'currency',
          currency: getPlatformCurrency(),
          minimumFractionDigits: 0,
        }).format(payload[0].value)}
      </p>
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
      <rect x={x} y={y} width={width} height={height} fill={fill} rx={radius} ry={radius} />
    </g>
  );
}

/**
 * Custom legend
 */
function CustomLegend({ payload }) {
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-4">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-[11px] text-gray-600">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * SpendingBreakdownChart — displays spending by freelancer as pie chart and bar chart
 *
 * @param {Object[]} transactions - Array of transaction objects with freelancer info
 * @param {'pie'|'bar'} variant - Chart type (default: 'pie')
 */
export default function SpendingBreakdownChart({ transactions = [], variant = 'pie' }) {
  const spendingData = useMemo(
    () => processSpendingData(transactions),
    [transactions]
  );

  const totalSpent = spendingData.reduce((sum, d) => sum + d.total, 0);

  if (spendingData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
          <span className="text-2xl">💸</span>
        </div>
        <p className="mt-3 text-sm font-semibold text-gray-500">No freelancer spending data</p>
        <p className="text-xs text-gray-400">Pay freelancers to see spending breakdown</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {variant === 'pie' ? (
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Pie Chart */}
          <div className="w-full lg:w-1/2">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={spendingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="total"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {spendingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Freelancers List */}
          <div className="w-full lg:w-1/2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Top Freelancers</h4>
            {spendingData.slice(0, 5).map((item, index) => (
              <div key={item.id} className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white shrink-0"
                  style={{ backgroundColor: item.color }}
                >
                  {item.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink-900 truncate">{item.fullName}</p>
                    <p className="text-sm font-bold text-ink-900">{formatETB(item.total)}</p>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(item.total / totalSpent) * 100}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {((item.total / totalSpent) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={spendingData.slice(0, 8)}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              width={50}
            />
            <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
            <Bar dataKey="total" name="Spending" shape={<RoundedBar />} animationBegin={0} animationDuration={800}>
              {spendingData.slice(0, 8).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// Simple format helper
function formatETB(amount) {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: getPlatformCurrency(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
