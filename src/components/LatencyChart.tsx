import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { LatencyRecord } from '@/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface LatencyChartProps {
  data: LatencyRecord[];
  range: '24h' | '7d' | '30d';
  isDark: boolean;
}

export const LatencyChart: React.FC<LatencyChartProps> = ({ data, range, isDark }) => {
  const rangeMs: Record<string, number> = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };
  const cutoff = Date.now() - (rangeMs[range] || rangeMs['24h']);
  const filteredData = data.filter((d) => new Date(d.timestamp).getTime() >= cutoff);

  const labels = filteredData.map((d) => {
    const date = new Date(d.timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Latency (ms)',
        data: filteredData.map((d) => d.latency),
        borderColor: '#c96442',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(201, 100, 66, 0.3)');
          gradient.addColorStop(1, 'rgba(201, 100, 66, 0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
    ],
  };

  const textColor = isDark ? 'rgba(176, 174, 165, 0.85)' : '#5e5d59';
  const gridColor = isDark ? 'rgba(209, 207, 197, 0.08)' : 'rgba(240, 238, 230, 0.8)';

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? '#30302e' : '#faf9f5',
        titleColor: isDark ? 'rgba(250, 249, 245, 0.95)' : '#141413',
        bodyColor: isDark ? 'rgba(176, 174, 165, 0.85)' : '#5e5d59',
        borderColor: isDark ? 'rgba(209, 207, 197, 0.12)' : '#f0eee6',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        display: true,
        grid: { color: gridColor },
        ticks: { color: textColor, maxTicksLimit: 6, font: { size: 11 } },
      },
      y: {
        display: true,
        grid: { color: gridColor },
        ticks: { color: textColor, font: { size: 11 } },
        beginAtZero: true,
      },
    },
  };

  if (filteredData.length === 0) {
    return (
      <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
        No latency data yet. Run a check to see trends.
      </div>
    );
  }

  return (
    <div style={{ height: '200px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};
