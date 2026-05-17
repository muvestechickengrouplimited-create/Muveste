'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../lib/firebase';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { useToast } from '../ui/Toast';

interface ValidationErrors {
  date?: string;
  meatReceived?: string;
  buyingPricePerKg?: string;
  meatSold?: string;
  sellingPricePerKg?: string;
  damaged?: string;
  expenses?: string;
  notes?: string;
}

function validate(fields: {
  date: string;
  meatReceived: string;
  buyingPricePerKg: string;
  meatSold: string;
  sellingPricePerKg: string;
  damaged: string;
  expenses: string;
  notes: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!fields.date)
    errors.date = 'Date is required';
  if (fields.meatReceived === '' || Number(fields.meatReceived) < 0)
    errors.meatReceived = 'Meat Received must be 0 or more';
  if (fields.buyingPricePerKg === '' || Number(fields.buyingPricePerKg) < 0)
    errors.buyingPricePerKg = 'Buying Price/kg must be 0 or more';
  if (fields.meatSold === '' || Number(fields.meatSold) < 0)
    errors.meatSold = 'Meat Sold must be 0 or more';
  if (fields.sellingPricePerKg === '' || Number(fields.sellingPricePerKg) < 0)
    errors.sellingPricePerKg = 'Selling Price/kg must be 0 or more';
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
  'flex h-12 md:h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 md:px-3 md:py-2 text-base md:text-sm ' +
  'text-[#111827] focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-[#F5C518] focus-visible:ring-offset-2 transition-colors ' +
  'placeholder:text-gray-400';

/** Get today's date as YYYY-MM-DD in local timezone (not UTC) */
function getLocalDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ─── Component ───────────────────────────────────────────────────────────────
function ButcherKibungoForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [fields, setFields] = useState({
    date: getLocalDateStr(),
    meatReceived: '',
    buyingPricePerKg: '',
    meatSold: '',
    sellingPricePerKg: '',
    damaged: '',
    expenses: '',
    notes: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const [previousStock, setPreviousStock] = useState(0);
  const [loadingStock, setLoadingStock] = useState(true);
  const [savedStockLeft, setSavedStockLeft] = useState<number | null>(null);
  const justSubmittedRef = useRef(false);

  // Re-fetch previousStock every time the date changes
  useEffect(() => {
    if (!fields.date) return;
    // Skip clearing savedStockLeft if we just submitted (form reset triggers this)
    if (justSubmittedRef.current) {
      justSubmittedRef.current = false;
      return;
    }
    setLoadingStock(true);
    setSavedStockLeft(null);
    fetch(`/api/butcher-kibungo?lastStock=1&forDate=${fields.date}`)
      .then(r => r.json())
      .then(data => {
        setPreviousStock(data.previousStock || 0);
      })
      .catch(() => setPreviousStock(0))
      .finally(() => setLoadingStock(false));
  }, [fields.date]);

  // ── Auto-calculated values ────────────────────────────────────────────────
  const meatReceivedNum = Number(fields.meatReceived) || 0;
  const buyingPricePerKgNum = Number(fields.buyingPricePerKg) || 0;
  const meatSoldNum = Number(fields.meatSold) || 0;
  const sellingPricePerKgNum = Number(fields.sellingPricePerKg) || 0;
  const damagedNum = Number(fields.damaged) || 0;
  const expensesNum = Number(fields.expenses) || 0;

  // Detect if the user has started filling in data
  const formHasInput = fields.meatReceived !== '' || fields.meatSold !== '' || fields.damaged !== '';

  // Stock Left logic:
  // 1. User is typing → formula with yesterday's base (for editing support)
  // 2. Just submitted (savedStockLeft set) → show saved result directly
  // 3. Fresh form → show carry-over from previous day
  const stockLeft = formHasInput
    ? previousStock + meatReceivedNum - meatSoldNum - damagedNum
    : (savedStockLeft !== null ? savedStockLeft : previousStock);

  const [totalCost, setTotalCost] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [profit, setProfit] = useState(0);

  useEffect(() => {
    const cost = meatReceivedNum * buyingPricePerKgNum;
    const sales = meatSoldNum * sellingPricePerKgNum;
    setTotalCost(cost);
    setTotalSales(sales);
    setProfit(sales - cost - expensesNum);
  }, [meatReceivedNum, buyingPricePerKgNum, meatSoldNum, sellingPricePerKgNum, expensesNum]);

  // ── Field update ──────────────────────────────────────────────────────────
  function updateField(name: keyof typeof fields, value: string) {
    const updated = { ...fields, [name]: value };
    setFields(updated);
    if (submitted) setErrors(validate(updated));
    // Clear saved stock when user starts editing
    if (name === 'meatReceived' || name === 'meatSold' || name === 'damaged') {
      setSavedStockLeft(null);
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  function resetForm() {
    setFields({
      date: getLocalDateStr(),
      meatReceived: '',
      buyingPricePerKg: '',
      meatSold: '',
      sellingPricePerKg: '',
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
        buyingPricePerKg: Number(fields.buyingPricePerKg),
        meatSold: Number(fields.meatSold),
        sellingPricePerKg: Number(fields.sellingPricePerKg),
        damaged: Number(fields.damaged),
        expenses: Number(fields.expenses),
        previousStock,
        stockLeft,
        notes: fields.notes,
      };

      const res = await fetch('/api/butcher-kibungo', {
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
      
      // Save the result stockLeft so it shows correctly after form resets
      setSavedStockLeft(result.stockLeft ?? stockLeft);
      justSubmittedRef.current = true; // prevent useEffect from clearing savedStockLeft

      resetForm();
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
        <CardTitle>Butchery — Kibungo Form</CardTitle>
        <CardDescription>
          Enter today's meat received, sales, damaged meat, and expenses.
          Total Sales and Profit are auto-calculated in real time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Date */}
            <div className="w-full space-y-1.5 md:col-span-2">
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
                onWheel={(e) => e.currentTarget.blur()}
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
                onWheel={(e) => e.currentTarget.blur()}
              />
              {errors.meatReceived && (
                <p className="text-sm text-red-500">{errors.meatReceived}</p>
              )}
            </div>

            {/* Buying Price */}
            <div className="w-full space-y-1.5">
              <label htmlFor="bt-buyingPricePerKg" className="block text-sm font-medium text-gray-700">
                Buying Price/kg (RWF) <span className="text-xs text-gray-400 font-normal ml-1">Price you paid per kg</span>
              </label>
              <input
                id="bt-buyingPricePerKg"
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 3500"
                value={fields.buyingPricePerKg}
                onChange={(e) => updateField('buyingPricePerKg', e.target.value)}
                required
                className={inputClass}
                onWheel={(e) => e.currentTarget.blur()}
              />
              {errors.buyingPricePerKg && (
                <p className="text-sm text-red-500">{errors.buyingPricePerKg}</p>
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
                onWheel={(e) => e.currentTarget.blur()}
              />
              {errors.meatSold && (
                <p className="text-sm text-red-500">{errors.meatSold}</p>
              )}
            </div>

            {/* Selling Price */}
            <div className="w-full space-y-1.5">
              <label htmlFor="bt-sellingPricePerKg" className="block text-sm font-medium text-gray-700">
                Selling Price/kg (RWF) <span className="text-xs text-gray-400 font-normal ml-1">Price you sell per kg</span>
              </label>
              <input
                id="bt-sellingPricePerKg"
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 4000"
                value={fields.sellingPricePerKg}
                onChange={(e) => updateField('sellingPricePerKg', e.target.value)}
                required
                className={inputClass}
                onWheel={(e) => e.currentTarget.blur()}
              />
              {errors.sellingPricePerKg && (
                <p className="text-sm text-red-500">{errors.sellingPricePerKg}</p>
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
                onWheel={(e) => e.currentTarget.blur()}
              />
              {errors.damaged && (
                <p className="text-sm text-red-500">{errors.damaged}</p>
              )}
            </div>

            {/* Expenses */}
            <div className="w-full space-y-1.5">
              <label htmlFor="bt-expenses" className="block text-sm font-medium text-gray-700">
                Other Expenses (RWF) <span className="text-xs text-gray-400 font-normal ml-1">Transport, packaging, etc</span>
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
                onWheel={(e) => e.currentTarget.blur()}
              />
              {errors.expenses && (
                <p className="text-sm text-red-500">{errors.expenses}</p>
              )}
            </div>
          </div>

          {/* ── Auto-calculated boxes ──────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Total Cost */}
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 overflow-hidden">
              <p className="text-xs text-red-400 font-bold uppercase tracking-wide">
                TOTAL COST
              </p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-red-500 truncate">
                RWF {totalCost.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Received × Buying Price
              </p>
            </div>

            {/* Total Sales */}
            <div className="bg-[#FEF3C7] border-2 border-[#D97706] rounded-xl p-4 overflow-hidden">
              <p className="text-xs font-bold text-[#D97706] uppercase tracking-wide">
                TOTAL SALES
              </p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-[#1a1814] truncate">
                RWF {totalSales.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Sold × Selling Price
              </p>
            </div>

            {/* Profit */}
            <div className={`rounded-xl p-4 border-2 overflow-hidden ${profit >= 0 ? 'bg-[#e8f5e8] border-[#006400]/30' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-xs font-bold uppercase tracking-wide ${profit >= 0 ? 'text-[#006400]' : 'text-red-500'}`}>
                {profit >= 0 ? 'PROFIT' : 'LOSS'}
              </p>
              <p className={`text-xl sm:text-2xl font-bold font-mono truncate ${profit >= 0 ? 'text-[#006400]' : 'text-red-500'}`}>
                RWF {Math.abs(profit).toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Sales - Cost - Expenses
              </p>
            </div>
            
            {/* Stock Left */}
            <div className="md:col-span-3">
              <div className={`rounded-xl p-4 border-2
                ${stockLeft < 0
                  ? 'bg-red-50 border-red-200'
                  : stockLeft < 10
                    ? 'bg-[#FEF3C7] border-[#D97706]/30'
                    : 'bg-[#e8f5e8] border-[#006400]/20'}`}>
                
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wide
                      ${stockLeft < 0
                        ? 'text-red-500'
                        : stockLeft < 10
                          ? 'text-[#D97706]'
                          : 'text-[#006400]'}`}>
                      STOCK LEFT
                    </p>
                    <p className={`text-2xl sm:text-3xl font-bold font-mono mt-1 truncate
                      ${stockLeft < 0
                        ? 'text-red-500'
                        : stockLeft < 10
                          ? 'text-[#D97706]'
                          : 'text-[#006400]'}`}>
                      {stockLeft} kg
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {stockLeft < 0
                        ? '⚠️ Check your numbers!'
                        : stockLeft < 10
                          ? '⚠️ Stock running low!'
                          : '✅ Stock available'}
                    </p>
                  </div>

                  <div className="text-right text-xs text-gray-400 space-y-1">
                    <p>Yesterday: 
                      <span className="font-semibold text-gray-600 ml-1">
                        {loadingStock ? '...' : `${previousStock} kg`}
                      </span>
                    </p>
                    <p>+ Received: 
                      <span className="font-semibold text-gray-600 ml-1">
                        {meatReceivedNum} kg
                      </span>
                    </p>
                    <p>- Sold: 
                      <span className="font-semibold text-gray-600 ml-1">
                        {meatSoldNum} kg
                      </span>
                    </p>
                    <p>- Damaged: 
                      <span className="font-semibold text-gray-600 ml-1">
                        {damagedNum} kg
                      </span>
                    </p>
                  </div>
                </div>
              </div>
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
          <div className="sticky bottom-4 md:relative w-full md:w-auto z-10">
            <Button
              type="submit"
              className="w-full text-base h-[52px] text-[15px]"
              isLoading={isLoading}
            >
              Submit Daily Report
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default ButcherKibungoForm;
