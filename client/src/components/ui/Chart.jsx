import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

/**
 * Custom chart tooltip wrapper.
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 text-slate-100 p-3 rounded-lg shadow-xl text-xs space-y-1">
        {label && <p className="font-semibold text-slate-400">{label}</p>}
        {payload.map((item, idx) => (
          <p key={idx} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: item.color || item.fill }}
            />
            {item.name}: <span className="font-bold">{item.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * AreaChart wrapper for revenue and analytics trends.
 */
export const AnalyticsAreaChart = ({
  data = [],
  xKey = 'name',
  yKey = 'value',
  label = 'Value',
  color = '#6366f1', // electric indigo
  height = 300,
}) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
          <XAxis
            dataKey={xKey}
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dx={-5}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey={yKey}
            name={label}
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#chartGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * PieChart wrapper for category distributions.
 */
export const AnalyticsPieChart = ({
  data = [], // [{ name: 'Pending', value: 12 }]
  height = 300,
  colors = ['#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#a855f7'],
}) => {
  return (
    <div className="flex flex-col items-center justify-center" style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsAreaChart;
