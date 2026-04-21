'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../lib/firebase';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { useToast } from '../ui/Toast';

// ─── Validation ─────────────────────────────────────────────────────────────
interface ValidationErrors {
  date?: string;
  meatReceived?: string;
  meatSold?: string;
  pricePerKg?: string;
  damaged?: string;
  expenses?: string;
  notes?: string;
}

function validate(fields: {
  date: string;
  meatReceived: string;
  meatSold: string;
  pricePerKg: string;
  damaged: string;
  expenses: string;
  notes: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!fields.date)
    errors.date = 'Date is required';
  if (fields.meatReceived === '' || Number(fields.meatReceived) < 0)
    errors.meatReceived = 'Meat Received must be 0 or more';
  if (fields.meatSold === '' || Number(fields.meatSold) < 0)
    errors.meatSold = 'Meat Sold must be 0 or more';
  if (fields.pricePerKg === '' || Number(fields.pricePerKg) < 0)
    errors.pricePerKg = 'Price/kg must be 0 or more';
  if (fields.damaged === '' || Number(fields.damaged) < 0)
    errors.damaged = 'Damaged must be 0 or more';
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
function ButcherForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [fields, setFields] = useState({
    date: new Date().toISOString().split('T')[0],
    meatReceived: '',
    meatSold: '',
    pricePerKg: '',
    damaged: '',
    expenses: '',
    notes: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // We no longer load fields from localStorage here to ensure empty inputs on laptop
  }, []);

  // ── Auto-calculated values ────────────────────────────────────────────────
  const meatReceivedNum = Number(fields.meatReceived) || 0;
  const meatSoldNum = Number(fields.meatSold) || 0;
  const priceNum = Number(fields.pricePerKg) || 0;
  const damagedNum = Number(fields.damaged) || 0;
  const expensesNum = Number(fields.expenses) || 0;

  const [totalSales, setTotalSales] = useState(0);
  const [stockLeft, setStockLeft] = useState(0);
  const [profit, setProfit] = useState(0);
  const [previousStock, setPreviousStock] = useState(0);

  // Fetch previous stock
  useEffect(() => {
    async function fetchPreviousStock() {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const res = await fetch('/api/butcher', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
             setPreviousStock(Number(json.data[0].stockLeft) || 0);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch previous stock', err);
      }
    }
    fetchPreviousStock();
  }, []);

  useEffect(() => {
    const sales = meatSoldNum * priceNum;
    const stock = previousStock + meatReceivedNum - meatSoldNum - damagedNum;
    setTotalSales(sales);
    setStockLeft(stock);
    setProfit(sales - expensesNum);
  }, [meatSoldNum, priceNum, damagedNum, expensesNum, meatReceivedNum, previousStock]);

  // ── Field update ──────────────────────────────────────────────────────────
  function updateField(name: keyof typeof fields, value: string) {
    const updated = { ...fields, [name]: value };
    setFields(updated);
    if (submitted) setErrors(validate(updated));
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  function resetForm() {
    setFields({
      date: new Date().toISOString().split('T')[0],
      meatReceived: '',
      meatSold: '',
      pricePerKg: '',
      damaged: '',
      expenses: '',
      notes: '',
    });
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
        date: fields.date,
        meatReceived: Number(fields.meatReceived),
        meatSold: Number(fields.meatSold),
        pricePerKg: Number(fields.pricePerKg),
        damaged: Number(fields.damaged),
        expenses: Number(fields.expenses),
        notes: fields.notes,
      };

      const res = await fetch('/api/butcher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to submit report');

      toast('✅ Butchery daily report submitted successfully!', 'success');
      // localStorage.setItem(MEMORY_KEY, JSON.stringify(fields)); // Stopped saving for desktop autofill
      
      // Right after submit, re-fetch the previous stock so the new submission reflects as the next day's starting stock.
      try {
        const fetchRes = await fetch('/api/butcher', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (fetchRes.ok) {
          const json = await fetchRes.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
             setPreviousStock(Number(json.data[0].stockLeft) || 0);
          }
        }
      } catch (err) {
        console.warn('Failed to update stock after submit', err);
      }

      resetForm();
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
        <CardTitle>Butchery Form</CardTitle>
        <CardDescription>
          Enter today's meat received, sales, damaged meat, and expenses.
          Total Sales and Profit are auto-calculated in real time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Date */}
            <div className="w-full space-y-1.5">
              <label htmlFor="bt-date" className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                id="bt-date"
                type="date"
                value={fields.date}
                onChange={(e) => updateField('date', e.target.value)}
                required
                className={inputClass}
              />
              {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
            </div>

            {/* Meat Received */}
            <div className="w-full space-y-1.5">
              <label htmlFor="bt-meatReceived" className="block text-sm font-medium text-gray-700">
                Meat Received (kg)
              </label>
              <input
                id="bt-meatReceived"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 150.5"
                value={fields.meatReceived}
                onChange={(e) => updateField('meatReceived', e.target.value)}
                required
                className={inputClass}
              />
              {errors.meatReceived && (
                <p className="text-sm text-red-500">{errors.meatReceived}</p>
              )}
            </div>

            {/* Meat Sold */}
            <div className="w-full space-y-1.5">
              <label htmlFor="bt-meatSold" className="block text-sm font-medium text-gray-700">
                Meat Sold (kg)
              </label>
              <input
                id="bt-meatSold"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 140.25"
                value={fields.meatSold}
                onChange={(e) => updateField('meatSold', e.target.value)}
                required
                className={inputClass}
              />
              {errors.meatSold && (
                <p className="text-sm text-red-500">{errors.meatSold}</p>
              )}
            </div>

            {/* Price Per kg */}
            <div className="w-full space-y-1.5">
              <label htmlFor="bt-pricePerKg" className="block text-sm font-medium text-gray-700">
                Price/kg (RWF)
              </label>
              <input
                id="bt-pricePerKg"
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 4000"
                value={fields.pricePerKg}
                onChange={(e) => updateField('pricePerKg', e.target.value)}
                required
                className={inputClass}
              />
              {errors.pricePerKg && (
                <p className="text-sm text-red-500">{errors.pricePerKg}</p>
              )}
            </div>

            {/* Damaged Meat */}
            <div className="w-full space-y-1.5">
              <label htmlFor="bt-damaged" className="block text-sm font-medium text-gray-700">
                Damaged (kg)
              </label>
              <input
                id="bt-damaged"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 2.5"
                value={fields.damaged}
                onChange={(e) => updateField('damaged', e.target.value)}
                required
                className={inputClass}
              />
              {errors.damaged && (
                <p className="text-sm text-red-500">{errors.damaged}</p>
              )}
            </div>

            {/* Expenses */}
            <div className="w-full space-y-1.5">
              <label htmlFor="bt-expenses" className="block text-sm font-medium text-gray-700">
                Expenses (RWF)
              </label>
              <input
                id="bt-expenses"
                type="number"
                min="0"
                step="100"
                placeholder="e.g. 15000"
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Total Sales */}
            <div className="bg-[#FFF8E1] border-2 border-[#F5C518] rounded-xl p-4">
              <label className="text-sm font-semibold text-[#E07B00]">
                Total Sales (RWF)
              </label>
              <p className="text-xl font-bold text-[#2D2D2D] font-mono mt-1">
                {totalSales.toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Auto: Meat Sold × Price/kg
              </p>
            </div>

            {/* Stock Left */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <label className="text-sm font-semibold text-blue-700">
                Stock Left (kg)
              </label>
              <p className="text-xl font-bold text-[#2D2D2D] font-mono mt-1">
                {stockLeft.toFixed(2)}
              </p>
              <p className="text-[10px] text-gray-500 mt-1 mb-1">
                Incl. {previousStock.toFixed(2)} kg previous stock
              </p>
              <p className="text-[10px] text-gray-400">
                Auto: Prev + Rec - Sold - Dmg
              </p>
            </div>

            {/* Profit — green if positive, red if negative */}
            <div
              className={`border-2 rounded-xl p-4 ${profit >= 0
                ? 'bg-[#EAF5EE] border-[#1B6B3A]'
                : 'bg-red-50 border-[#D9534F]'
                }`}
            >
              <label className="text-sm font-semibold text-gray-700">
                Net Profit (RWF)
              </label>
              <p
                className={`text-xl font-bold font-mono mt-1 ${profit >= 0 ? 'text-[#1B6B3A]' : 'text-[#D9534F]'
                  }`}
              >
                {profit.toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Auto: Sales - Exp
              </p>
            </div>
          </div>

          {/* ── Notes ─────────────────────────────────────────────────── */}
          <div className="w-full space-y-1.5">
            <label htmlFor="bt-notes" className="block text-sm font-medium text-gray-700">
              Notes{' '}
              <span className="text-gray-400 font-normal">(Optional, max 300 chars)</span>
            </label>
            <textarea
              id="bt-notes"
              rows={3}
              maxLength={300}
              placeholder="Any observations, quality issues, or remarks…"
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

export default ButcherForm;
