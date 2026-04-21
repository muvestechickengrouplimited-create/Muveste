'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../lib/firebase';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { useToast } from '../ui/Toast';
import { formatRWF } from '../../lib/utils';

// ─── Inline Validation (Zod-like but without the dependency) ─────────────
interface ValidationErrors {
  date?: string;
  feedQty?: string;
  water?: string;
  medicationsGiven?: string;
  freshEggs?: string;
  pricePerFreshEgg?: string;
  checkedEggs?: string;
  pricePerCheckedEgg?: string;
  brokenEggs?: string;
  avgWeight?: string;
  feedPrice?: string;
  expenses?: string;
  notes?: string;
  newBirds?: string;
  mortality?: string;
  freshEggsSold?: string;
  checkedEggsSold?: string;
}

function validate(fields: {
  date: string;
  feedQty: string;
  water: string;
  medicationsGiven: string;
  freshEggs: string;
  pricePerFreshEgg: string;
  checkedEggs: string;
  pricePerCheckedEgg: string;
  brokenEggs: string;
  avgWeight: string;
  feedPrice: string;
  expenses: string;
  notes: string;
  newBirds: string;
  mortality: string;
  freshEggsSold: string;
  checkedEggsSold: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!fields.date) errors.date = 'Date is required';
  
  const checkNum = (val: string, label: string, min = 0) => {
    if (val === '' || isNaN(Number(val)) || Number(val) < min) {
      return `${label} must be ${min} or more`;
    }
  };

  const errFeed = checkNum(fields.feedQty, 'Feed qty');
  if (errFeed) errors.feedQty = errFeed;

  const errWater = checkNum(fields.water, 'Water');
  if (errWater) errors.water = errWater;

  if (fields.medicationsGiven && fields.medicationsGiven.length > 200)
    errors.medicationsGiven = 'Medications Given must be 200 characters or less';

  const errFresh = checkNum(fields.freshEggs, 'Fresh eggs');
  if (errFresh) errors.freshEggs = errFresh;

  const errPriceFresh = checkNum(fields.pricePerFreshEgg, 'Price per fresh egg');
  if (errPriceFresh) errors.pricePerFreshEgg = errPriceFresh;

  const errChecked = checkNum(fields.checkedEggs, 'Checked eggs');
  if (errChecked) errors.checkedEggs = errChecked;

  const errPriceChecked = checkNum(fields.pricePerCheckedEgg, 'Price per checked egg');
  if (errPriceChecked) errors.pricePerCheckedEgg = errPriceChecked;

  const errBroken = checkNum(fields.brokenEggs, 'Broken eggs');
  if (errBroken) errors.brokenEggs = errBroken;

  const errWeight = checkNum(fields.avgWeight, 'Average weight');
  if (errWeight) errors.avgWeight = errWeight;

  const errExp = checkNum(fields.expenses, 'Expenses');
  if (errExp) errors.expenses = errExp;

  const errFeedPrice = checkNum(fields.feedPrice, 'Feed price');
  if (errFeedPrice) errors.feedPrice = errFeedPrice;

  if (fields.notes && fields.notes.length > 300)
    errors.notes = 'Notes must be 300 characters or less';

  const errNewBirds = checkNum(fields.newBirds, 'New birds');
  if (errNewBirds) errors.newBirds = errNewBirds;

  const errMortality = checkNum(fields.mortality, 'Mortality');
  if (errMortality) errors.mortality = errMortality;

  const errFreshEggsSold = checkNum(fields.freshEggsSold, 'Fresh eggs sold');
  if (errFreshEggsSold) errors.freshEggsSold = errFreshEggsSold;

  const errCheckedEggsSold = checkNum(fields.checkedEggsSold, 'Checked eggs sold');
  if (errCheckedEggsSold) errors.checkedEggsSold = errCheckedEggsSold;

  return errors;
}

// ─── Component ─────────────────────────────────────────────────────────────
export function EggFarmForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Field-level form state
  const [fields, setFields] = useState({
    date: new Date().toISOString().split('T')[0],
    newBirds: '0',
    birdsSold: '0',
    priceOfBirdsSold: '0',
    mortality: '0',
    feedQty: '',
    water: '',
    medicationsGiven: '',
    freshEggs: '',
    pricePerFreshEgg: '',
    checkedEggs: '',
    pricePerCheckedEgg: '',
    brokenEggs: '',
    totalEggs: '',
    freshEggsSold: '0',
    checkedEggsSold: '0',
    avgWeight: '',
    feedPrice: '',
    expenses: '0',
    notes: '',
  });



  const [lastStock, setLastStock] = useState({ liveBirds: 0, freshEggsLeftInStock: 0, checkedEggsLeftInStock: 0 });
  const [fetchingStock, setFetchingStock] = useState(true);

  useEffect(() => {
    return auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const res = await fetch('/api/egg-farm?last=1', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setLastStock({
              liveBirds: data.liveBirds || 0,
              freshEggsLeftInStock: data.freshEggsLeftInStock || 0,
              checkedEggsLeftInStock: data.checkedEggsLeftInStock || 0,
            });
            // Prefill "Live Birds (yesterday)" with the fetched value
            setFields(prev => ({ ...prev, newBirds: String(data.liveBirds || 0) }));
          }
        } catch (e) {
          console.error('Failed to fetch last stock', e);
        }
      }
      setFetchingStock(false);
    });
  }, []);

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitted, setSubmitted] = useState(false);

  // Auto-calculated logic
  const freshEggs = Number(fields.freshEggs) || 0;
  const pricePerFreshEgg = Number(fields.pricePerFreshEgg) || 0;
  const checkedEggs = Number(fields.checkedEggs) || 0;
  const pricePerCheckedEgg = Number(fields.pricePerCheckedEgg) || 0;
  const brokenEggs = Number(fields.brokenEggs) || 0;
  const newBirds = Number(fields.newBirds) || 0;
  const mortality = Number(fields.mortality) || 0;
  const freshEggsSold = Number(fields.freshEggsSold) || 0;
  const checkedEggsSold = Number(fields.checkedEggsSold) || 0;
  const birdsSold = Number(fields.birdsSold) || 0;
  const priceOfBirdsSold = Number(fields.priceOfBirdsSold) || 0;
  
  const currentLiveBirds = newBirds - birdsSold - mortality;
  const currentFreshEggsInStock = lastStock.freshEggsLeftInStock + freshEggs - freshEggsSold;
  const currentCheckedEggsInStock = lastStock.checkedEggsLeftInStock + checkedEggs - checkedEggsSold;
  
  // Auto-calculate expenses: feedQty * feedPrice
  const fQty = Number(fields.feedQty) || 0;
  const fPrice = Number(fields.feedPrice) || 0;
  const expenses = fQty * fPrice;

  // Sync expenses back to fields state if different (to ensure payload is correct)
  useEffect(() => {
    if (String(expenses) !== fields.expenses) {
      setFields(prev => ({ ...prev, expenses: String(expenses) }));
    }
  }, [expenses, fields.expenses]);

  const totalEggs = freshEggs + checkedEggs + brokenEggs;
  const rateOfLay = currentLiveBirds > 0 ? (totalEggs / currentLiveBirds) * 100 : 0;
  const revenue = (freshEggsSold * pricePerFreshEgg) + (checkedEggsSold * pricePerCheckedEgg) + (birdsSold * priceOfBirdsSold);
  const profit = revenue - expenses;

  function updateField(name: keyof typeof fields, value: string) {
    const updated = { ...fields, [name]: value };
    setFields(updated);
    if (submitted) {
      setErrors(validate(updated));
    }
  }

  function resetForm(updatedStock?: { liveBirds: number; }) {
    setFields({
      date: new Date().toISOString().split('T')[0],
      newBirds: String(updatedStock?.liveBirds ?? lastStock.liveBirds),
      birdsSold: '0',
      priceOfBirdsSold: '0',
      mortality: '0',
      feedQty: '',
      water: '',
      medicationsGiven: '',
      freshEggs: '',
      pricePerFreshEgg: '',
      checkedEggs: '',
      pricePerCheckedEgg: '',
      brokenEggs: '',
      totalEggs: '',
      freshEggsSold: '0',
      checkedEggsSold: '0',
      avgWeight: '',
      feedPrice: '',
      expenses: '0',
      notes: '',
    });
    setErrors({});
    setSubmitted(false);
  }

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
        feedQty: Number(fields.feedQty),
        water: Number(fields.water),
        medicationsGiven: fields.medicationsGiven,
        newBirds,
        birdsSold,
        priceOfBirdsSold,
        mortality,
        liveBirds: currentLiveBirds,
        freshEggs: Number(fields.freshEggs),
        pricePerFreshEgg: Number(fields.pricePerFreshEgg),
        checkedEggs: Number(fields.checkedEggs),
        pricePerCheckedEgg: Number(fields.pricePerCheckedEgg),
        brokenEggs: Number(fields.brokenEggs),
        totalEggs,
        freshEggsSold,
        checkedEggsSold,
        freshEggsLeftInStock: currentFreshEggsInStock,
        checkedEggsLeftInStock: currentCheckedEggsInStock,
        avgWeight: Number(fields.avgWeight),
        feedPrice: Number(fields.feedPrice),
        expenses,
        revenue,
        rateOfLay,
        notes: fields.notes,
      };

      const res = await fetch('/api/egg-farm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to submit report');
      }

      toast('✅ Egg Farm daily report submitted successfully!', 'success');
      const nextStock = {
        liveBirds: currentLiveBirds,
        freshEggsLeftInStock: currentFreshEggsInStock,
        checkedEggsLeftInStock: currentCheckedEggsInStock
      };
      setLastStock(nextStock);
      resetForm(nextStock);
      router.refresh();
    } catch (error: unknown) {
      console.error('Submission error:', error);
      const msg = error instanceof Error ? error.message : 'An error occurred during submission';
      toast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C518] focus-visible:ring-offset-2 transition-colors";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Egg Farm Report</CardTitle>
        <CardDescription>
          Enter today's production metrics. Revenue and totals are calculated automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* 1. Date (Full width or split) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="w-full space-y-1.5">
              <label htmlFor="ef-date" className="block text-sm font-medium text-gray-700">Date</label>
              <input id="ef-date" type="date" value={fields.date} onChange={(e) => updateField('date', e.target.value)} required className={inputClasses} />
              {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
            </div>

            <div className="w-full space-y-1.5">
              <label htmlFor="ef-meds" className="block text-sm font-medium text-gray-700">Medications Given</label>
              <input id="ef-meds" type="text" maxLength={200} placeholder="e.g. Vitamins" value={fields.medicationsGiven} onChange={(e) => updateField('medicationsGiven', e.target.value)} className={inputClasses} />
              {errors.medicationsGiven && <p className="text-sm text-red-500">{errors.medicationsGiven}</p>}
            </div>
          </div>

          {/* 2. Inputs (2 cols for related fields) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="w-full space-y-1.5">
              <label htmlFor="ef-newbirds" className="block text-sm font-medium text-gray-700">Number of live birds (yesterday)</label>
              <input id="ef-newbirds" type="number" value={fields.newBirds} onChange={(e) => updateField('newBirds', e.target.value)} required className={inputClasses} />
              {errors.newBirds && <p className="text-sm text-red-500">{errors.newBirds}</p>}
            </div>
            <div className="w-full space-y-1.5">
              <label htmlFor="ef-mortality" className="block text-sm font-medium text-gray-700">Mortality (Deaths)</label>
              <input id="ef-mortality" type="number" value={fields.mortality} onChange={(e) => updateField('mortality', e.target.value)} required className={inputClasses} />
              {errors.mortality && <p className="text-sm text-red-500">{errors.mortality}</p>}
            </div>

            <div className="w-full space-y-1.5">
              <label htmlFor="ef-birds-sold" className="block text-sm font-medium text-gray-700">Birds Sold</label>
              <input id="ef-birds-sold" type="number" value={fields.birdsSold} onChange={(e) => updateField('birdsSold', e.target.value)} required className={inputClasses} />
            </div>
            <div className="w-full space-y-1.5">
              <label htmlFor="ef-birds-price" className="block text-sm font-medium text-gray-700">Price of Birds Sold (RWF)</label>
              <input id="ef-birds-price" type="number" value={fields.priceOfBirdsSold} onChange={(e) => updateField('priceOfBirdsSold', e.target.value)} required className={inputClasses} />
            </div>

            <div className="w-full space-y-1.5">
              <label htmlFor="ef-feed" className="block text-sm font-medium text-gray-700">Feed Qty (kg)</label>
              <input id="ef-feed" type="number" step="0.5" value={fields.feedQty} onChange={(e) => updateField('feedQty', e.target.value)} required className={inputClasses} />
              {errors.feedQty && <p className="text-sm text-red-500">{errors.feedQty}</p>}
            </div>
            <div className="w-full space-y-1.5">
              <label htmlFor="ef-water" className="block text-sm font-medium text-gray-700">Water (L)</label>
              <input id="ef-water" type="number" value={fields.water} onChange={(e) => updateField('water', e.target.value)} required className={inputClasses} />
              {errors.water && <p className="text-sm text-red-500">{errors.water}</p>}
            </div>

            <div className="w-full space-y-1.5">
              <label htmlFor="ef-feed-price" className="block text-sm font-medium text-gray-700">Feed Price (RWF/kg)</label>
              <input id="ef-feed-price" type="number" value={fields.feedPrice} onChange={(e) => updateField('feedPrice', e.target.value)} required className={inputClasses} />
              {errors.feedPrice && <p className="text-sm text-red-500">{errors.feedPrice}</p>}
            </div>

            <div className="w-full space-y-1.5">
              <label htmlFor="ef-fresh" className="block text-sm font-medium text-gray-700">Fresh Eggs</label>
              <input id="ef-fresh" type="number" value={fields.freshEggs} onChange={(e) => updateField('freshEggs', e.target.value)} required className={inputClasses} />
              {errors.freshEggs && <p className="text-sm text-red-500">{errors.freshEggs}</p>}
            </div>
            <div className="w-full space-y-1.5">
              <label htmlFor="ef-price-fresh" className="block text-sm font-medium text-gray-700">Price per Fresh Egg (RWF)</label>
              <input id="ef-price-fresh" type="number" value={fields.pricePerFreshEgg} onChange={(e) => updateField('pricePerFreshEgg', e.target.value)} required className={inputClasses} />
              {errors.pricePerFreshEgg && <p className="text-sm text-red-500">{errors.pricePerFreshEgg}</p>}
            </div>

            <div className="w-full space-y-1.5">
              <label htmlFor="ef-checked" className="block text-sm font-medium text-gray-700">Checked Eggs (easily broken)</label>
              <input id="ef-checked" type="number" value={fields.checkedEggs} onChange={(e) => updateField('checkedEggs', e.target.value)} required className={inputClasses} />
              {errors.checkedEggs && <p className="text-sm text-red-500">{errors.checkedEggs}</p>}
            </div>
            <div className="w-full space-y-1.5">
              <label htmlFor="ef-price-checked" className="block text-sm font-medium text-gray-700">Price per Checked Egg (RWF)</label>
              <input id="ef-price-checked" type="number" value={fields.pricePerCheckedEgg} onChange={(e) => updateField('pricePerCheckedEgg', e.target.value)} required className={inputClasses} />
              {errors.pricePerCheckedEgg && <p className="text-sm text-red-500">{errors.pricePerCheckedEgg}</p>}
            </div>

            <div className="w-full space-y-1.5">
              <label htmlFor="ef-broken" className="block text-sm font-medium text-gray-700">Broken Eggs (completely broken)</label>
              <input id="ef-broken" type="number" value={fields.brokenEggs} onChange={(e) => updateField('brokenEggs', e.target.value)} required className={inputClasses} />
              <p className="text-xs text-red-400">Broken eggs have no value</p>
              {errors.brokenEggs && <p className="text-sm text-red-500">{errors.brokenEggs}</p>}
            </div>
            
            {/* Eggs Sold */}
            <div className="w-full space-y-1.5">
              <label htmlFor="ef-sold-fresh" className="block text-sm font-medium text-gray-700">Fresh Eggs Sold Today</label>
              <input id="ef-sold-fresh" type="number" value={fields.freshEggsSold} onChange={(e) => updateField('freshEggsSold', e.target.value)} required className={inputClasses} />
              {errors.freshEggsSold && <p className="text-sm text-red-500">{errors.freshEggsSold}</p>}
            </div>
            
            <div className="w-full space-y-1.5">
              <label htmlFor="ef-sold-checked" className="block text-sm font-medium text-gray-700">Checked Eggs Sold Today</label>
              <input id="ef-sold-checked" type="number" value={fields.checkedEggsSold} onChange={(e) => updateField('checkedEggsSold', e.target.value)} required className={inputClasses} />
              {errors.checkedEggsSold && <p className="text-sm text-red-500">{errors.checkedEggsSold}</p>}
            </div>

            <div className="w-full space-y-1.5">
              <label htmlFor="ef-weight" className="block text-sm font-medium text-gray-700">Average Weight (kg)</label>
              <input id="ef-weight" type="number" step="0.01" value={fields.avgWeight} onChange={(e) => updateField('avgWeight', e.target.value)} required className={inputClasses} />
              {errors.avgWeight && <p className="text-sm text-red-500">{errors.avgWeight}</p>}
            </div>
          </div>

          <div className="w-full space-y-1.5">
            <label htmlFor="ef-expenses" className="block text-sm font-medium text-gray-700">Feed Expenses (RWF)</label>
            <div className="relative">
              <input 
                id="ef-expenses" 
                type="text" 
                readOnly 
                value={expenses.toLocaleString()} 
                className={`${inputClasses} bg-gray-50 font-mono font-bold text-[#E07B00] cursor-not-allowed`} 
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-medium">
                AUTO (QTY × PRICE)
              </div>
            </div>
            {errors.expenses && <p className="text-sm text-red-500">{errors.expenses}</p>}
          </div>

          <div className="w-full space-y-1.5">
            <label htmlFor="ef-revenue" className="block text-sm font-medium text-gray-700">Daily Revenue (RWF)</label>
            <div className="relative">
              <input 
                id="ef-revenue" 
                type="text" 
                readOnly 
                value={revenue.toLocaleString()} 
                className={`${inputClasses} bg-gray-50 font-mono font-bold text-[#1B6B3A] cursor-not-allowed`} 
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-medium">
                AUTO (SOLD × PRICE)
              </div>
            </div>
          </div>

          {/* 3. Auto-calculated Display Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {/* Live Birds Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs text-blue-800 font-bold uppercase">Live Birds</p>
              <p className="text-xl font-bold text-blue-900 font-mono">
                {fetchingStock ? '...' : currentLiveBirds}
              </p>
              <p className="text-[10px] text-blue-600 mt-1">
                Started ({newBirds}) - Sold ({birdsSold}) - Died ({mortality})
              </p>
            </div>

            {/* Total Eggs Box */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 font-bold uppercase">Total Prod.</p>
              <p className="text-xl font-bold text-[#2D2D2D] font-mono">{totalEggs}</p>
              <p className="text-[10px] text-gray-400 mt-1">
                F ({freshEggs}) + C ({checkedEggs}) + B ({brokenEggs})
              </p>
            </div>

            {/* Rate of Lay Box */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <p className="text-xs text-purple-800 font-bold uppercase">Rate of Lay</p>
              <p className="text-xl font-bold text-purple-900 font-mono">
                {rateOfLay.toFixed(1)}%
              </p>
              <p className="text-[10px] text-purple-600 mt-1">
                (Prod / Live) × 100
              </p>
            </div>

            {/* Fresh Eggs in Stock Box */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <p className="text-xs text-orange-800 font-bold uppercase">Fresh Stock</p>
              <p className="text-xl font-bold text-orange-900 font-mono">
                {fetchingStock ? '...' : currentFreshEggsInStock}
              </p>
              <p className="text-[10px] text-orange-600 mt-1">
                Prev ({lastStock.freshEggsLeftInStock}) + Prod ({freshEggs}) - Sold ({freshEggsSold})
              </p>
            </div>

            {/* Checked Eggs in Stock Box */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <p className="text-xs text-orange-800 font-bold uppercase">Checked Stock</p>
              <p className="text-xl font-bold text-orange-900 font-mono">
                {fetchingStock ? '...' : currentCheckedEggsInStock}
              </p>
              <p className="text-[10px] text-orange-600 mt-1">
                Prev ({lastStock.checkedEggsLeftInStock}) + Prod ({checkedEggs}) - Sold ({checkedEggsSold})
              </p>
            </div>

            {/* Profit Box */}
            <div className={`border-2 rounded-xl p-4 ${profit >= 0 ? 'bg-[#EAF5EE] border-[#1B6B3A]' : 'bg-red-50 border-[#D9534F]'}`}>
              <p className={`text-xs font-bold uppercase ${profit >= 0 ? 'text-[#1B6B3A]' : 'text-[#D9534F]'}`}>DAILY PROFIT</p>
              <p className={`text-xl font-bold font-mono ${profit >= 0 ? 'text-[#1B6B3A]' : 'text-[#D9534F]'}`}>
                {formatRWF(profit)}
              </p>
              <p className="text-[10px] font-medium text-gray-500 mt-1">Rev: {revenue} | Exp: {expenses}</p>
            </div>
          </div>

          {/* 4. Notes */}
          <div className="w-full space-y-1.5">
            <label htmlFor="ef-notes" className="block text-sm font-medium text-gray-700">Notes <span className="text-gray-400 font-normal">(Optional, max 300)</span></label>
            <textarea id="ef-notes" rows={2} maxLength={300} value={fields.notes} onChange={(e) => updateField('notes', e.target.value)} className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-[#111827] focus-visible:outline-none focus:ring-2 focus:ring-[#F5C518] resize-none" />
            <p className="text-xs text-gray-400 text-right">{fields.notes.length}/300</p>
          </div>

          <Button type="submit" className="w-full md:w-auto text-base h-12 px-8" isLoading={isLoading}>
            Submit Daily Report
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
