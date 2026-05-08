import React from 'react';
import { Card } from '../../../../components/ui/Card';

const USERS = [
  { date: '2026-03-01', dept: 'Broiler Farm', email: 'broiler@muveste.com', role: 'broiler_farm' },
  { date: '2026-03-01', dept: 'Butchery', email: 'butchery@muveste.com', role: 'butcher' },
  { date: '2026-03-01', dept: 'Finance', email: 'finance@muveste.com', role: 'finance' },
  { date: '2026-03-01', dept: 'Admin', email: 'admin@muveste.com', role: 'admin' }
];

export default function AdminUsersPage() {
  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1B6B3A]">System Users</h1>
          <p className="text-[#111827] opacity-70 text-base">Directory of authorized department accounts</p>
        </div>
      </div>

      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="flex justify-between items-center p-5 bg-white border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#2D2D2D]">Active Accounts</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider text-xs border-b border-gray-200">
                <th className="p-4 font-semibold">Date Created</th>
                <th className="p-4 font-semibold">Department</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Role ID</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {USERS.map((user, i) => (
                <tr key={i} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                  <td className="p-4 text-gray-500">{user.date}</td>
                  <td className="p-4 font-medium text-gray-900">{user.dept}</td>
                  <td className="p-4 font-mono text-gray-600">{user.email}</td>
                  <td className="p-4">
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded font-mono">
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="bg-[#EAF5EE] text-[#1B6B3A] text-xs px-3 py-1 rounded-full font-semibold border border-[#1B6B3A]/20">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-xs text-gray-400 text-center">Accounts are securely managed via the external Firebase Authentication console.</p>
    </div>
  );
}
