/**
 * Sidebar — User list with search/filter and activity indicators
 */
import { useState, useMemo } from 'react';
import { useStore, TelemetryUser } from '../store';
import { ACTIVITY_CONFIG } from './LiveMap';

export default function Sidebar() {
  const users = useStore((s) => s.users);
  const selectedUserId = useStore((s) => s.selectedUserId);
  const selectUser = useStore((s) => s.selectUser);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('ALL');

  const userList = useMemo(() => {
    const arr = Array.from(users.values());
    return arr
      .filter((u) => {
        if (filter !== 'ALL') {
          if (filter === 'ONLINE' && !u.isOnline) return false;
          if (filter !== 'ONLINE' && filter !== 'ALL' && u.activity !== filter) return false;
        }
        if (search) {
          const q = search.toLowerCase();
          return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        // Online first, then by name
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [users, search, filter]);

  const filters = ['ALL', 'ONLINE', 'MOCK_INTERVIEW', 'CODING_SANDBOX', 'ATS_SCANNER', 'CAREER_COACH'];

  return (
    <aside className="w-72 bg-slate-900/50 border-r border-slate-800 flex flex-col overflow-hidden">
      {/* Search */}
      <div className="p-3 border-b border-slate-800/50">
        <input
          type="text"
          placeholder="Search users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-800/80 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-1 px-3 py-2 overflow-x-auto border-b border-slate-800/50">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`whitespace-nowrap text-[10px] px-2 py-1 rounded-md font-semibold transition-colors ${
              filter === f
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {f === 'ALL' ? 'All' : f.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto">
        {userList.map((user) => (
          <UserRow
            key={user.userId}
            user={user}
            selected={selectedUserId === user.userId}
            onClick={() => selectUser(selectedUserId === user.userId ? null : user.userId)}
          />
        ))}
        {userList.length === 0 && (
          <p className="text-center text-slate-600 text-xs py-8">No matching users</p>
        )}
      </div>

      <div className="p-3 border-t border-slate-800/50">
        <p className="text-[10px] text-slate-600 text-center">
          {users.size} total · {Array.from(users.values()).filter((u) => u.isOnline).length} online
        </p>
      </div>
    </aside>
  );
}

function UserRow({
  user,
  selected,
  onClick,
}: {
  user: TelemetryUser;
  selected: boolean;
  onClick: () => void;
}) {
  const cfg = ACTIVITY_CONFIG[user.activity] || ACTIVITY_CONFIG['IDLE'];

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 border-b border-slate-800/30 transition-colors hover:bg-slate-800/40 ${
        selected ? 'bg-cyan-500/10 border-l-2 border-l-cyan-400' : ''
      }`}
    >
      <div className="relative">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ backgroundColor: cfg.color + '25', color: cfg.color }}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
        {user.isOnline && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white truncate">{user.name}</p>
        <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
      </div>
      <span
        className="text-[9px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap"
        style={{ backgroundColor: cfg.color + '20', color: cfg.color }}
      >
        {cfg.label}
      </span>
    </button>
  );
}
