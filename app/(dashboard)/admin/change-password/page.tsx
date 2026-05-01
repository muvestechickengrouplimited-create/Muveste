'use client';

import React, { useState } from 'react';
import { auth } from '../../../../lib/firebase';
import { useRouter } from 'next/navigation';

const STAFF_ACCOUNTS = [
  { email: 'eggfarm@30plus.rw', label: 'Egg Farm' },
  { email: 'broiler@30plus.rw', label: 'Broiler Farm' },
  { email: 'eggkiosk@30plus.rw', label: 'Egg Kiosk' },
  { email: 'butcher@30plus.rw', label: 'Butchery' },
  { email: 'finance@30plus.rw', label: 'Finance' },
  { email: 'admin@30plus.rw', label: 'Admin (Your Account)' }
];

export default function AdminChangePassword() {
  const [selectedUser, setSelectedUser] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleChangePassword = async () => {
    setError('');
    setSuccess(false);

    if (!selectedUser) {
      setError('Please select a user account');
      return;
    }
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('You must be logged in');
      }

      const response = await fetch('/api/admin/users/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: selectedUser,
          newPassword: newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setSelectedUser('');

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-8">
      {/* Header */}
      <div>
        <p className="text-xs text-[#E07B00] font-bold tracking-widest uppercase mb-1">
          ADMIN SECURITY
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-[#1B6B3A]">Manage Passwords</h1>
        <p className="text-sm text-gray-500 mt-2">
          Securely reset the password for any staff account. The user will be able to log in immediately with the new password.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 space-y-6">
          
          {/* User Selection */}
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-2 uppercase tracking-wide">
              Select Staff Account
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-[#F5C518] transition-colors bg-white cursor-pointer"
            >
              <option value="" disabled>Choose an account...</option>
              {STAFF_ACCOUNTS.map(acc => (
                <option key={acc.email} value={acc.email}>
                  {acc.label} ({acc.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* New Password */}
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-2 uppercase tracking-wide">
                New Password
              </label>
              <input
                type="text"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-[#F5C518] transition-colors"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-2 uppercase tracking-wide">
                Confirm Password
              </label>
              <input
                type="text"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Type it again"
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-[#F5C518] transition-colors"
              />
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-50 border-l-4 border-[#D9534F] rounded-r-xl p-4 flex items-center gap-3">
              <span className="text-[#D9534F] font-bold">⚠️</span>
              <p className="text-sm text-[#D9534F] font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-[#EAF5EE] border-l-4 border-[#1B6B3A] rounded-r-xl p-4 flex items-center gap-3">
              <span className="text-[#1B6B3A] font-bold">✅</span>
              <p className="text-sm text-[#1B6B3A] font-medium">Password successfully changed!</p>
            </div>
          )}

          {/* Action Area */}
          <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
            <button
              onClick={() => router.push('/admin')}
              className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
            >
              ← Back to Overview
            </button>
            <button
              onClick={handleChangePassword}
              disabled={loading}
              className="bg-[#1B6B3A] text-white rounded-xl px-8 py-3.5 text-sm font-bold shadow-md hover:bg-[#15522c] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                'Change Password'
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Security Info */}
      <div className="bg-[#FFF8E1] border border-[#F5C518]/30 rounded-2xl p-5 flex gap-4">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 text-xl shadow-sm">
          🛡️
        </div>
        <div>
          <h4 className="font-bold text-[#E07B00] text-sm mb-1">Admin Security Notice</h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            As an administrator, you have the authority to forcibly reset staff passwords. 
            Once changed, the old password will immediately become invalid. The staff member 
            will need the new password to log back into their dashboard. Please communicate 
            the new password to them securely.
          </p>
        </div>
      </div>
    </div>
  );
}
