interface StatsBarProps {
  stats: {
    totalUsers: number;
    onlineUsers: number;
    totalInterviews: number;
    totalApplications: number;
  };
  onlineCount: number;
}

export default function StatsBar({ stats, onlineCount }: StatsBarProps) {
  const items = [
    { label: 'Total Users', value: stats.totalUsers, color: 'text-cyan-400' },
    { label: 'Online Now', value: onlineCount, color: 'text-emerald-400' },
    { label: 'Mock Interviews', value: stats.totalInterviews, color: 'text-amber-400' },
    { label: 'Job Applications', value: stats.totalApplications, color: 'text-violet-400' },
  ];

  return (
    <div className="flex gap-2 px-4 py-2 bg-slate-900/50 border-b border-slate-800/50">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex-1 bg-slate-800/40 rounded-lg px-3 py-1.5 flex items-center justify-between"
        >
          <span className="text-[10px] text-slate-500 uppercase tracking-wide">{item.label}</span>
          <span className={`text-sm font-bold font-mono ${item.color}`}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}
