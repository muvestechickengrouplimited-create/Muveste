import React, { useEffect, useState } from 'react';
import { auth } from '../../lib/firebase';
import { Card, CardContent } from '../ui/Card';

interface ActivityLog {
  date: string;
  time: string;
  department: string;
  action: string;
  user: string;
  status: string;
}

const DEPT_COLORS: Record<string, string> = {
  'Egg Farm': '#1B6B3A',
  'Broiler Farm': '#E07B00',
  'Egg Kiosk': '#F5C518',
  'butcher': '#2D2D2D',
  'Finance': '#9FE1CB'
};

export function ActivityFeed() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/admin/activity', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setLogs(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  return (
    <Card>
      <div className="p-5 border-b border-gray-100 bg-white">
        <h2 className="text-lg font-bold text-[#2D2D2D]">Recent System Activity</h2>
      </div>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400 animate-pulse">Loading activity feed...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No recent activity detected.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log, idx) => {
              const color = DEPT_COLORS[log.department] || '#cbd5e1';
              return (
                <div key={idx} className="flex justify-between items-center px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <div>
                      <p className="font-medium text-sm text-gray-800">
                        <span className="font-semibold">{log.department}</span> {log.action.toLowerCase()}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{log.date} at {log.time} — {log.user}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${log.status === 'Submitted' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                    {log.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
