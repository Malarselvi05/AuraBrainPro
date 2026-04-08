'use client';

import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';
import { Flame, TrendingUp, Clock, Trophy, Zap } from 'lucide-react';

interface Stats {
  identityStatement: string;
  dailyFocusLogs: Record<string, number>;
}
interface SubTask { status: string; }
interface Task {
  id: string; title: string;
  timeSpentSeconds: number;
  subtasks?: SubTask[];
}
interface Props {
  stats: Stats;
  tasks: Task[];
  auraPoints: number;
  streak: number;
}

const getHeatColor = (seconds: number, isFuture: boolean) => {
  if (isFuture) return 'transparent';
  if (seconds === 0) return 'rgba(255,255,255,0.05)';
  if (seconds < 1800) return 'rgba(37,99,235,0.25)';
  if (seconds < 3600) return 'rgba(37,99,235,0.5)';
  if (seconds < 7200) return 'rgba(37,99,235,0.75)';
  return '#2563eb';
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'rgba(8,8,20,0.98)', border: '1px solid rgba(37,99,235,0.4)', borderRadius: '12px', padding: '10px 16px' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem' }}>{label}</p>
        <p style={{ color: '#fff', fontWeight: 900, fontSize: '1.1rem' }}>{payload[0].value}h</p>
      </div>
    );
  }
  return null;
};

export default function StatsDashboard({ stats, tasks, auraPoints, streak }: Props) {
  // Last 14 days chart
  const chartData = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const seconds = stats.dailyFocusLogs?.[key] || 0;
      return { date: key, label, hours: parseFloat((seconds / 3600).toFixed(2)) };
    });
  }, [stats.dailyFocusLogs]);

  // 12-week heatmap
  const heatmapData = useMemo(() => {
    const today = new Date();
    const weeks: { date: string; seconds: number; isFuture: boolean }[][] = [];
    const start = new Date(today);
    start.setDate(today.getDate() - 83); // ~12 weeks back
    start.setDate(start.getDate() - start.getDay()); // align to Sunday

    const cur = new Date(start);
    while (cur <= today || weeks[weeks.length - 1]?.length < 7) {
      if (!weeks.length || weeks[weeks.length - 1].length === 7) weeks.push([]);
      const key = cur.toISOString().split('T')[0];
      weeks[weeks.length - 1].push({
        date: key,
        seconds: stats.dailyFocusLogs?.[key] || 0,
        isFuture: cur > today,
      });
      cur.setDate(cur.getDate() + 1);
      if (weeks.length > 12 && weeks[weeks.length - 1].length === 7) break;
    }
    return weeks;
  }, [stats.dailyFocusLogs]);

  const totalFocusSeconds = Object.values(stats.dailyFocusLogs || {}).reduce((a, b) => a + b, 0);
  const totalHours = Math.floor(totalFocusSeconds / 3600);
  const activeDays = Object.values(stats.dailyFocusLogs || {}).filter(s => s >= 600).length;

  const statCards = [
    { icon: <Clock size={20} color="#2563eb" />, label: 'Total Focus', value: `${totalHours}h`, bg: 'rgba(37,99,235,0.06)', border: 'rgba(37,99,235,0.2)' },
    { icon: <Flame size={20} color="#f97316" />, label: 'Focus Streak', value: `${streak}d`, bg: 'rgba(249,115,22,0.06)', border: 'rgba(249,115,22,0.2)' },
    { icon: <Zap size={20} color="#a78bfa" />, label: 'Aura Points', value: `${auraPoints}`, bg: 'rgba(167,139,250,0.06)', border: 'rgba(167,139,250,0.2)' },
    { icon: <Trophy size={20} color="#10b981" />, label: 'Active Days', value: `${activeDays}`, bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.2)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {statCards.map((c, i) => (
          <div key={i} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '20px', padding: '1.4rem 1.2rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.7rem' }}>{c.icon}</div>
            <p style={{ fontSize: '0.58rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.1rem', fontWeight: 700 }}>{c.label}</p>
            <p className="outfit" style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1.1, marginTop: '0.3rem' }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Area Chart */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
          <TrendingUp size={18} color="#2563eb" />
          <p style={{ fontWeight: 800, fontSize: '0.95rem' }}>Focus Hours — Last 14 Days</p>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="hours" stroke="#2563eb" strokeWidth={2.5}
              fill="url(#focusGrad)"
              dot={{ r: 3, fill: '#2563eb', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#fff', strokeWidth: 2, stroke: '#2563eb' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Heatmap */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Flame size={18} color="#f97316" />
            <p style={{ fontWeight: 800, fontSize: '0.95rem' }}>Activity Grid — Last 12 Weeks</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)' }}>
            <span>Less</span>
            {[0, 1800, 3600, 5400, 7200].map((s, i) => (
              <div key={i} style={{ width: 11, height: 11, borderRadius: 3, background: getHeatColor(s, false), border: '1px solid rgba(255,255,255,0.06)' }} />
            ))}
            <span>More</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '3px', overflowX: 'auto', paddingBottom: '4px' }}>
          {/* Day labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', paddingTop: '0px' }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} style={{ height: 11, width: 14, fontSize: '0.58rem', color: 'rgba(255,255,255,0.2)', lineHeight: '11px', marginBottom: '0px' }}>{d}</div>
            ))}
          </div>
          {/* Week columns */}
          {heatmapData.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {week.map((day, di) => (
                <div key={di}
                  title={`${day.date}: ${Math.round(day.seconds / 60)}min`}
                  style={{
                    width: 11, height: 11, borderRadius: 3,
                    background: getHeatColor(day.seconds, day.isFuture),
                    border: day.isFuture ? 'none' : '1px solid rgba(255,255,255,0.04)',
                    cursor: 'default', transition: 'transform 0.1s'
                  }} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Per-Mission Stats */}
      {tasks.length > 0 && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.4rem' }}>
            <Trophy size={18} color="#10b981" />
            <p style={{ fontWeight: 800, fontSize: '0.95rem' }}>Mission Breakdown</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tasks.map(task => {
              const done = (task.subtasks || []).filter(st => st.status === 'completed').length;
              const total = (task.subtasks || []).length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const totalSec = task.timeSpentSeconds || 0;
              const h = Math.floor(totalSec / 3600);
              const m = Math.floor((totalSec % 3600) / 60);
              const isComplete = pct === 100 && total > 0;
              return (
                <div key={task.id} style={{
                  background: isComplete ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isComplete ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '16px', padding: '1.1rem 1.4rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isComplete && <span style={{ fontSize: '0.8rem' }}>🏆</span>}
                      <p className="outfit" style={{ fontWeight: 700, fontSize: '0.9rem' }}>{task.title}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.7rem', opacity: 0.55 }}>
                      <span>{h > 0 ? `${h}h ` : ''}{m}m</span>
                      <span style={{ color: isComplete ? '#10b981' : 'inherit' }}>{done}/{total} days · {pct}%</span>
                    </div>
                  </div>
                  <div style={{ height: '5px', background: 'rgba(255,255,255,0.07)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: isComplete ? '#10b981' : 'linear-gradient(90deg, #2563eb, #a78bfa)',
                      borderRadius: '10px', transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
