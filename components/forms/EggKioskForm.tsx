'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../lib/firebase';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { useToast } from '../ui/Toast';

// ─── Validation ─────────────────────────────────────────────────────────────
interface ValidationErrors {
  location?:     string;
  date?:         string;
  traysReceived?: string;
  traysSold?:     string;
  pricePerTray?:  string;
  damagedTrays?:  string;
  expenses?:     string;
  notes?:        string;
}

function validate(fields: {
  location:     string;
  date:         string;
  traysReceived: string;
  traysSold:     string;
  pricePerTray:  string;
  damagedTrays:  string;
  expenses:     string;
  notes:        string;
}): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!fields.location)
    errors.location = 'Please select a location';
  if (!fields.date)
    errors.date = 'Date is required';
  if (fields.traysReceived === '' || Number(fields.traysReceived) < 0)
    errors.traysReceived = 'Trays Received must be 0 or more';
  if (fields.traysSold === '' || Number(fields.traysSold) < 0)
    errors.traysSold = 'Trays Sold must be 0 or more';
  if (fields.pricePerTray === '' || Number(fields.pricePerTray) < 0)
    errors.pricePerTray = 'Price/Tray must be 0 or more';
  if (fields.damagedTrays === '' || Number(fields.damagedTrays) < 0)
    errors.damagedTrays = 'Damaged Trays must be 0 or more';
  if (fields.expenses === '' || Number(fields.expenses) < 0)
    errors.expenses = 'Expenses must be 0 or more';
  if (fields.notes && fields.notes.length > 300)
    errors.notes = 'Notes must be 300 characters or less';
  return errors;
}

// ─── Input helper ────────────────────────────────────────────────────────────
const inputClass =
  'flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm ' +
  'text-[#111827] focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-[#F5C518] focus-visible:ring-offset-2 transition-colors ' +
  'placeholder:text-gray-400';

// ─── Component ───────────────────────────────────────────────────────────────
export function EggKioskForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [fields, setFields] = useState({
    location:     '',
    date:         new Date().toISOString().split('T')[0],
    traysReceived: '',
    traysSold:     '',
    pricePerTray:  '',
    damagedTrays:  '',
    expenses:     '',
    notes:        '',
  });
  const [errors, setErrors]     = useState<ValidationErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const MEMORY_KEY = 'eggKioskFormLastSubmitted';

  useEffect(() => {
    const saved = localStorage.getItem(MEMORY_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.location) {
          setFields(prev => ({ ...prev, location: parsed.location }));
        }
      } catch (e) {
        console.error('Failed to parse memory', e);
      }
    }
  }, []);

  // ── Auto-calculated values ────────────────────────────────────────────────
  const traysReceivedNum = Number(fields.traysReceived) || 0;
  const traysSoldNum   = Number(fields.traysSold)   || 0;
  const priceNum      = Number(fields.pricePerTray) || 0;
  const damagedNum    = Number(fields.damagedTrays) || 0;
  const expensesNum   = Number(fields.expenses)    || 0;

  const [totalSales, setTotalSales] = useState(0);
  const [profit, setProfit]         = useState(0);
  const [traysLeft, setTraysLeft]   = useState(0);
  const [previousStock, setPreviousStock] = useState(0);

  // Fetch previous stock when location changes
  useEffect(() => {
    async function fetchPreviousStock() {
      if (!fields.location) {
        setPreviousStock(0);
        return;
      }
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const res = await fetch('/api/egg-kiosk', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data)) {
             const locRecords = json.data.filter((r: any) => r.location === fields.location);
             if (locRecords.length > 0) {
               // The records are returned newest-first from the backend GET handler
               setPreviousStock(Number(locRecords[0].traysLeft) || 0);
             } else {
               setPreviousStock(0);
             }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch previous stock', err);
      }
    }
    fetchPreviousStock();
  }, [fields.location]);

  useEffect(() => {
    const sales       = traysSoldNum * priceNum;
    const left        = Math.round((previousStock + traysReceivedNum - traysSoldNum - damagedNum) * 100) / 100;
    setTotalSales(sales);
    setTraysLeft(left);
    setProfit(sales - expensesNum);
  }, [traysReceivedNum, traysSoldNum, priceNum, damagedNum, expensesNum, previousStock]);

  // ── Field update ──────────────────────────────────────────────────────────
  function updateField(name: keyof typeof fields, value: string) {
    const updated = { ...fields, [name]: value };
    setFields(updated);
    if (submitted) setErrors(validate(updated));
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  function resetForm(keepLocation: boolean = false) {
    setFields((prev) => ({
      location:     keepLocation ? prev.location : '',
      date:         new Date().toISOString().split('T')[0],
      traysReceived: '',
      traysSold:     '',
      pricePerTray:  '',
      damagedTrays:  '',
      expenses:     '',
      notes:        '',
    }));
    setErrors({});
    setSubmitted(false);
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);

    const validationErrors = validate(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast('Please fix the highlighted errors before submitting.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        toast('Authentication error. Please log in again.', 'error');
        setIsLoading(false);
        return;
      }

      const payload = {
        location:     fields.location,
        date:         fields.date,
        traysReceived: Number(fields.traysReceived),
        traysSold:     Number(fields.traysSold),
        pricePerTray:  Number(fields.pricePerTray),
        damagedTrays:  Number(fields.damagedTrays),
        expenses:     Number(fields.expenses),
        notes:        fields.notes,
      };

      const res = await fetch('/api/egg-kiosk', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to submit report');

      toast('✅ Egg Kiosk daily report submitted successfully!', 'success');
      localStorage.setItem(MEMORY_KEY, JSON.stringify({ location: fields.location }));
      
      // Right after submit, the location might still be selected.
      // We need to re-fetch the previous stock so the new submission reflects as the next day's starting stock.
      try {
        const fetchRes = await fetch('/api/egg-kiosk', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (fetchRes.ok) {
          const json = await fetchRes.json();
          if (json.data && Array.isArray(json.data)) {
             const locRecords = json.data.filter((r: any) => r.location === fields.location);
             if (locRecords.length > 0) {
               setPreviousStock(Number(locRecords[0].traysLeft) || 0);
             }
          }
        }
      } catch (err) {
        console.warn('Failed to update stock after submit', err);
      }

      resetForm(true); // pass true to keep the location intact
      router.refresh();
    } catch (error: unknown) {
      console.error('Submission error:', error);
      const msg =
        error instanceof Error ? error.message : 'An error occurred during submission';
      toast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Egg Kiosk Report</CardTitle>
        <CardDescription>
          Enter today's sales, inventory, and expense data. Total Sales and Profit
          are auto-calculated in real time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>

          {/* ── Row 1: Date + Trays Received ───────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Location */}
            <div className="w-full space-y-1.5 md:col-span-2 lg:col-span-1">
              <label htmlFor="ek-location" className="block text-sm font-medium text-gray-700">
                Kiosk Location
              </label>
              <select
                id="ek-location"
                value={fields.location}
                onChange={(e) => updateField('location', e.target.value)}
                required
                className={inputClass}
              >
                <option value="" disabled>Select location...</option>
                <option value="Batsinda, Kigali">Batsinda, Kigali</option>
                <option value="Nyabugogo, Kigali">Nyabugogo, Kigali</option>
              </select>
              {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
            </div>

            {/* Date */}
            <div className="w-full space-y-1.5">
              <label htmlFor="ek-date" className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                id="ek-date"
                type="date"
                value={fields.date}
                onChange={(e) => updateField('date', e.target.value)}
                required
                className={inputClass}
              />
              {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
            </div>

            {/* Trays Received */}
            <div className="w-full space-y-1.5">
              <label htmlFor="ek-traysReceived" className="block text-sm font-medium text-gray-700">
                Trays Received
              </label>
              <input
                id="ek-traysReceived"
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 500"
                value={fields.traysReceived}
                onChange={(e) => updateField('traysReceived', e.target.value)}
                required
                className={inputClass}
              />
              {errors.traysReceived && (
                <p className="text-sm text-red-500">{errors.traysReceived}</p>
              )}
            </div>

            {/* Trays Sold */}
            <div className="w-full space-y-1.5">
              <label htmlFor="ek-traysSold" className="block text-sm font-medium text-gray-700">
                Trays Sold
              </label>
              <input
                id="ek-traysSold"
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 400"
                value={fields.traysSold}
                onChange={(e) => updateField('traysSold', e.target.value)}
                required
                className={inputClass}
              />
              {errors.traysSold && (
                <p className="text-sm text-red-500">{errors.traysSold}</p>
              )}
            </div>

            {/* Price Per Egg */}
            <div className="w-full space-y-1.5">
              <label htmlFor="ek-pricePerTray" className="block text-sm font-medium text-gray-700">
                Price/Tray (RWF)
              </label>
              <input
                id="ek-pricePerTray"
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 150"
                value={fields.pricePerTray}
                onChange={(e) => updateField('pricePerTray', e.target.value)}
                required
                className={inputClass}
              />
              {errors.pricePerTray && (
                <p className="text-sm text-red-500">{errors.pricePerTray}</p>
              )}
            </div>

            {/* Damaged Trays */}
            <div className="w-full space-y-1.5">
              <label htmlFor="ek-damagedTrays" className="block text-sm font-medium text-gray-700">
                Damaged Trays
              </label>
              <input
                id="ek-damagedTrays"
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 5"
                value={fields.damagedTrays}
                onChange={(e) => updateField('damagedTrays', e.target.value)}
                required
                className={inputClass}
              />
              {errors.damagedTrays && (
                <p className="text-sm text-red-500">{errors.damagedTrays}</p>
              )}
            </div>

            {/* Expenses */}
            <div className="w-full space-y-1.5">
              <label htmlFor="ek-expenses" className="block text-sm font-medium text-gray-700">
                Expenses (RWF)
              </label>
              <input
                id="ek-expenses"
                type="number"
                min="0"
                step="100"
                placeholder="e.g. 5000"
                value={fields.expenses}
                onChange={(e) => updateField('expenses', e.target.value)}
                required
                className={inputClass}
              />
              {errors.expenses && (
                <p className="text-sm text-red-500">{errors.expenses}</p>
              )}
            </div>
          </div>

          {/* ── Auto-calculated boxes ──────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-6 border-b pb-6 border-gray-100">

            {/* Trays Left */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400">Trays Left</p>
              <p className={`text-xl font-bold font-mono
                ${traysLeft < 0 
                  ? 'text-[#D9534F]' 
                  : traysLeft < 10 
                    ? 'text-[#E07B00]' 
                    : 'text-[#1B6B3A]'}`}>
                {traysLeft}
              </p>
              <p className="text-[10px] text-gray-500 mt-1 mb-1">
                Previous Stock: {previousStock}
              </p>
              <p className="text-[10px] text-gray-400">
                {traysLeft < 0 ? 'Check your numbers!' : 
                 traysLeft < 10 ? 'Running low!' : 'In stock'}
              </p>
            </div>

            {/* Total Sales */}
            <div className="bg-[#FFF8E1] border-2 border-[#F5C518] rounded-xl p-4">
              <label className="text-sm font-semibold text-[#E07B00]">Total Sales (RWF)</label>
              <p className="text-2xl font-bold text-[#2D2D2D] font-mono mt-1">
                {totalSales.toLocaleString()}
              </p>
            </div>

            {/* Profit */}
            <div className={`border-2 rounded-xl p-4 ${profit >= 0 ? 'bg-[#EAF5EE] border-[#1B6B3A]' : 'bg-red-50 border-[#D9534F]'}`}>
              <label className="text-sm font-semibold text-gray-700">Profit (RWF)</label>
              <p className={`text-2xl font-bold font-mono mt-1 ${profit >= 0 ? 'text-[#1B6B3A]' : 'text-[#D9534F]'}`}>
                {profit.toLocaleString()}
              </p>
            </div>
          </div>

          {/* ── Notes ─────────────────────────────────────────────────── */}
          <div className="w-full space-y-1.5">
            <label htmlFor="ek-notes" className="block text-sm font-medium text-gray-700">
              Notes{' '}
              <span className="text-gray-400 font-normal">(Optional, max 300 chars)</span>
            </label>
            <textarea
              id="ek-notes"
              rows={3}
              maxLength={300}
              placeholder="Any observations, issues, or remarks…"
              value={fields.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm
                         text-[#111827] placeholder:text-gray-400 focus-visible:outline-none
                         focus:ring-2 focus:ring-[#F5C518] focus:ring-offset-2 transition-colors resize-none"
            />
            <div className="flex justify-between items-center">
              {errors.notes ? (
                <p className="text-sm text-red-500">{errors.notes}</p>
              ) : (
                <span />
              )}
              <p className="text-xs text-gray-400 text-right">{fields.notes.length}/300</p>
            </div>
          </div>

          {/* ── Submit ────────────────────────────────────────────────── */}
          <Button
            type="submit"
            className="w-full md:w-auto text-base h-12"
            isLoading={isLoading}
          >
            Submit Daily Report
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
