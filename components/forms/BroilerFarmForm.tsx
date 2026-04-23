'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { useToast } from '../ui/Toast';

// ─── Validation ─────────────────────────────────────────────────────────────
interface ValidationErrors {
  date?: string;
  batch?: string;
  feedQty?: string;
  water?: string;
  medications?: string;
  numberOfBirds?: string;
  mortality?: string;
  birdsSold?: string;
  avgWeight?: string;
  pricePerKg?: string;
  price?: string; // feed price
  expenses?: string;
  notes?: string;
}

function validate(f: {
  date: string;
  batch: string;
  feedQty: string;
  water: string;
  medications: string;
  numberOfBirds: string;
  mortality: string;
  birdsSold: string;
  avgWeight: string;
  pricePerKg: string;
  price: string;
  expenses: string;
  notes: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!f.date)                                      errors.date           = 'Date is required';
  if (!f.batch)                                     errors.batch          = 'Batch is required';
  if (f.feedQty     === '' || Number(f.feedQty)  < 0) errors.feedQty      = 'Feed qty must be 0 or more';
  if (f.water       === '' || Number(f.water)    < 0) errors.water        = 'Water must be 0 or more';
  if (f.medications && f.medications.length > 200)
                                                       errors.medications = 'Max 200 characters';
  if (f.numberOfBirds === '' || Number(f.numberOfBirds) < 0) errors.numberOfBirds = 'Number of birds must be 0 or more';
  if (f.mortality   === '' || Number(f.mortality) < 0) errors.mortality   = 'Mortality must be 0 or more';
  if (f.birdsSold   && Number(f.birdsSold) < 0) errors.birdsSold   = 'Birds sold must be 0 or more';
  if (f.avgWeight   === '' || Number(f.avgWeight) < 0) errors.avgWeight   = 'Avg weight must be 0 or more';
  if (f.pricePerKg  === '' || Number(f.pricePerKg) < 0) errors.pricePerKg= 'Price must be 0 or more';
  if (f.price       === '' || Number(f.price)  < 0)     errors.price      = 'Feed price must be 0 or more';
  if (f.expenses    === '' || Number(f.expenses)  < 0) errors.expenses    = 'Expenses must be 0 or more';
  if (f.notes && f.notes.length > 300) errors.notes = 'Notes must be 300 characters or less';
  return errors;
}

// ─── Shared input class ─────────────────────────────────────────────────────
const inputCls =
  'flex h-11 w-full rounded-xl border-2 border-gray-100 bg-white px-4 py-3 text-sm text-[#111827] ' +
  'focus-visible:outline-none focus:border-[#F5C518] ' +
  'transition-colors';

// ─── Component ──────────────────────────────────────────────────────────────
export function BroilerFarmForm({ onSubmitSuccess }: { onSubmitSuccess?: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [batches, setBatches] = useState<string[][]>([]);
  const [numberOfBirds, setNumberOfBirds] = useState('');
  const [avgWeight,     setAvgWeight]     = useState('');
  const [birdsSold,     setBirdsSold]     = useState('');
  const [pricePerKg,    setPricePerKg]    = useState('');
  const [totalWeight,   setTotalWeight]   = useState(0);
  const [kgsSold,       setKgsSold]       = useState(0);
  const [revenue,       setRevenue]       = useState(0);
  const [isPrefilled,   setIsPrefilled]   = useState(false);
  const [isUpdateMode,  setIsUpdateMode]  = useState(false);

  // Full field state
  const [fields, setFields] = useState({
    date:             new Date().toISOString().split('T')[0],
    batch:            '',
    feedQty:          '',
    water:            '',
    medications:      '',
    numberOfBirds:    '',
    mortality:        '',
    birdsSold:        '',
    avgWeight:        '',
    pricePerKg:       '',
    price:            '', // Feed Price
    expenses:         '0',
    notes:            '',
  });
  const [errors,    setErrors]    = useState<ValidationErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const MEMORY_KEY = 'broilerFarmLastSubmitted';

  // Fetch active batches
  useEffect(() => {
    fetch('/api/admin/batches')
      .then(r => r.json())
      .then(data => {
        const active = data.filter((b: string[]) => b[2] === 'Active');
        setBatches(active);
      });
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(MEMORY_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Object.keys(parsed).length > 0) {
          setFields(prev => ({ ...prev, ...parsed, date: prev.date }));
          if (parsed.numberOfBirds !== undefined) setNumberOfBirds(parsed.numberOfBirds);
          if (parsed.avgWeight !== undefined) setAvgWeight(parsed.avgWeight);
          if (parsed.birdsSold !== undefined) setBirdsSold(parsed.birdsSold);
          if (parsed.pricePerKg !== undefined) setPricePerKg(parsed.pricePerKg);
        }
      } catch (e) {
        console.error('Failed to parse memory', e);
      }
    }
  }, []);

  // Real-time auto-calculation
  useEffect(() => {
    const birds  = Number(numberOfBirds) || 0;
    const mortalityNum = Number(fields.mortality) || 0;
    const soldBirdsNum = Number(birdsSold) || 0;
    const live = birds - mortalityNum - soldBirdsNum;
    const weight = Number(avgWeight)     || 0;
    const price  = Number(pricePerKg)    || 0;
    
    const ks = soldBirdsNum * weight;
    const tw = live * weight;
    const rev = ks * price;

    setKgsSold(ks);
    setTotalWeight(tw);
    setRevenue(rev);

    const fQty = Number(fields.feedQty) || 0;
    const fPrice = Number(fields.price) || 0;
    const autoExp = fQty * fPrice;
    if (String(autoExp) !== fields.expenses) {
      setFields(prev => ({ ...prev, expenses: String(autoExp) }));
    }
  }, [numberOfBirds, fields.mortality, birdsSold, avgWeight, pricePerKg, fields.feedQty, fields.price, fields.expenses]);

  const mortalityNum = Number(fields.mortality) || 0;
  const soldBirdsNum = Number(birdsSold) || 0;
  const liveBirds = (Number(numberOfBirds) || 0) - mortalityNum - soldBirdsNum;

  // Check if a report already exists for the selected date and batch
  useEffect(() => {
    if (!fields.batch || !fields.date) {
      setIsUpdateMode(false);
      return;
    }

    fetch(`/api/broiler-farm?batch=${fields.batch}&date=${fields.date}`)
      .then(r => r.json())
      .then(result => {
        if (result.success && result.data) {
          const d = result.data;
          setFields(prev => ({
            ...prev,
            feedQty:       String(d.feedQty),
            water:         String(d.water),
            medications:   d.medications || '',
            numberOfBirds: String(d.numberOfBirds),
            mortality:     String(d.mortality),
            birdsSold:     String(d.birdsSold || '0'),
            avgWeight:     String(d.avgWeight),
            pricePerKg:    String(d.pricePerKg),
            price:         String(d.price),
            expenses:      String(d.expenses),
            notes:         d.notes || '',
          }));
          setNumberOfBirds(String(d.numberOfBirds));
          setAvgWeight(String(d.avgWeight));
          setBirdsSold(String(d.birdsSold || '0'));
          setPricePerKg(String(d.pricePerKg));
          setIsUpdateMode(true);
          setIsPrefilled(false);
        } else {
          setIsUpdateMode(false);
          // If not in update mode, we still might want to prefill live birds from the LAST report
          fetch(`/api/broiler-farm?batch=${fields.batch}&last=1`)
            .then(r => r.json())
            .then(data => {
              if (data && data.liveBirds !== undefined) {
                const val = String(data.liveBirds);
                setFields(prev => ({ ...prev, numberOfBirds: val, mortality: '0', birdsSold: '0', feedQty: '', water: '', medications: '', avgWeight: '', pricePerKg: '', price: '', notes: '' }));
                setNumberOfBirds(val);
                setIsPrefilled(true);
              }
            }).catch(() => {});
        }
      })
      .catch(() => {
        setIsUpdateMode(false);
      });
  }, [fields.batch, fields.date]);

  function updateField(name: keyof typeof fields, value: string) {
    const updated = { ...fields, [name]: value };
    setFields(updated);
    if (submitted) setErrors(validate(updated));
    if (name === 'numberOfBirds') setNumberOfBirds(value);
    if (name === 'avgWeight')     setAvgWeight(value);
    if (name === 'birdsSold')     setBirdsSold(value);
    if (name === 'pricePerKg')    setPricePerKg(value);
  }

  function resetForm() {
    const fresh = {
      date:             new Date().toISOString().split('T')[0],
      batch:            '',
      feedQty:          '',
      water:            '',
      medications:      '',
      numberOfBirds:    '',
      mortality:        '',
      birdsSold:        '',
      avgWeight:        '',
      pricePerKg:       '',
      price:            '',
      expenses:         '0',
      notes:            '',
    };
    setFields(fresh);
    setNumberOfBirds('');
    setAvgWeight('');
    setBirdsSold('');
    setPricePerKg('');
    setTotalWeight(0);
    setRevenue(0);
    setKgsSold(0);
    setErrors({});
    setSubmitted(false);
    setIsPrefilled(false);
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
        date:             fields.date,
        batch:            fields.batch,
        feedQty:          Number(fields.feedQty),
        water:            Number(fields.water),
        medications:      fields.medications,
        numberOfBirds:    Number(fields.numberOfBirds),
        mortality:        Number(fields.mortality),
        birdsSold:        Number(fields.birdsSold),
        avgWeight:        Number(fields.avgWeight),
        pricePerKg:       Number(fields.pricePerKg),
        price:            Number(fields.price),
        expenses:         Number(fields.expenses),
        notes:            fields.notes,
      };

      const res = await fetch('/api/broiler-farm', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          Authorization:   `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to submit report');

      if (result.updated) {
        toast('✅ Broiler Farm daily report updated successfully!', 'success');
      } else {
        toast('✅ Broiler Farm daily report submitted successfully!', 'success');
      }
      localStorage.setItem(MEMORY_KEY, JSON.stringify(fields));

      resetForm();
      router.refresh();
      onSubmitSuccess?.();
    } catch (error: unknown) {
      console.error('Submission error:', error);
      const msg = error instanceof Error ? error.message : 'An error occurred during submission';
      toast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="bg-white border-b border-gray-50 p-6">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold text-[#2D2D2D]">Daily Broiler Farm Report</CardTitle>
            <CardDescription className="text-sm text-gray-500 mt-1">
              Track feed, mortality, and sales per batch.
            </CardDescription>
            {isUpdateMode && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">Update Mode: Report already exists for this date</span>
              </div>
            )}
          </div>
          <div className="bg-[#FFF8E1] p-2 rounded-xl">
             <svg className="w-6 h-6 text-[#E07B00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
             </svg>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date */}
            <div className="w-full space-y-1.5">
              <label htmlFor="bf-date" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                Date
              </label>
              <input
                id="bf-date"
                type="date"
                value={fields.date}
                onChange={(e) => updateField('date', e.target.value)}
                required
                className={inputCls}
              />
              {errors.date && <p className="text-xs text-red-500 font-medium">{errors.date}</p>}
            </div>

            {/* Batch Selection */}
            <div className="w-full space-y-1.5">
              <label htmlFor="bf-batch" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                Select Batch
              </label>
              <select
                id="bf-batch"
                value={fields.batch}
                onChange={(e) => updateField('batch', e.target.value)}
                required
                className={inputCls}
              >
                <option value="">Select batch...</option>
                {batches.map(batch => (
                  <option key={batch[0]} value={batch[0]}>
                    {batch[0]}
                  </option>
                ))}
              </select>
              {errors.batch && <p className="text-xs text-red-500 font-medium">{errors.batch}</p>}
            </div>

            {/* Feed Qty */}
            <div className="w-full space-y-1.5">
              <label htmlFor="bf-feedQty" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                Feed Qty (kg)
              </label>
              <input
                id="bf-feedQty"
                type="number"
                min="0"
                step="0.5"
                placeholder="150"
                value={fields.feedQty}
                onChange={(e) => updateField('feedQty', e.target.value)}
                required
                className={inputCls}
              />
              {errors.feedQty && <p className="text-xs text-red-500 font-medium">{errors.feedQty}</p>}
            </div>

            {/* Feed Price */}
            <div className="w-full space-y-1.5">
              <label htmlFor="bf-price" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                Feed Price (RWF/kg)
              </label>
              <input
                id="bf-price"
                type="number"
                min="0"
                step="1"
                placeholder="850"
                value={fields.price}
                onChange={(e) => updateField('price', e.target.value)}
                required
                className={inputCls}
              />
              {errors.price && <p className="text-xs text-red-500 font-medium">{errors.price}</p>}
            </div>

            {/* Water */}
            <div className="w-full space-y-1.5">
              <label htmlFor="bf-water" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                Water (L)
              </label>
              <input
                id="bf-water"
                type="number"
                min="0"
                step="1"
                placeholder="500"
                value={fields.water}
                onChange={(e) => updateField('water', e.target.value)}
                required
                className={inputCls}
              />
              {errors.water && <p className="text-xs text-red-500 font-medium">{errors.water}</p>}
            </div>

            {/* Medications */}
            <div className="w-full space-y-1.5">
              <label htmlFor="bf-medications" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                Medications Given
              </label>
              <input
                id="bf-medications"
                type="text"
                maxLength={200}
                placeholder="e.g. Vitamins, Vaccines"
                value={fields.medications}
                onChange={(e) => updateField('medications', e.target.value)}
                className={inputCls}
              />
              {errors.medications && (
                <p className="text-xs text-red-500 font-medium">{errors.medications}</p>
              )}
            </div>

            {/* Number of Birds */}
            <div className="w-full space-y-1.5">
              <label htmlFor="bf-numberOfBirds" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                Live Birds Remaining (Opening)
              </label>
              <input
                id="bf-numberOfBirds"
                type="number"
                min="0"
                step="1"
                placeholder="1000"
                value={fields.numberOfBirds}
                onChange={(e) => {
                  updateField('numberOfBirds', e.target.value);
                  if (isPrefilled) setIsPrefilled(false);
                }}
                required
                className={inputCls}
              />
              {isPrefilled && (
                <p className="text-[10px] text-[#1B6B3A] font-bold mt-1 uppercase tracking-tight">
                  Auto-filled from last report
                </p>
              )}
              {errors.numberOfBirds && (
                <p className="text-xs text-red-500 font-medium">{errors.numberOfBirds}</p>
              )}
            </div>

            {/* Mortality */}
            <div className="w-full space-y-1.5">
              <label htmlFor="bf-mortality" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                Mortality
              </label>
              <input
                id="bf-mortality"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={fields.mortality}
                onChange={(e) => updateField('mortality', e.target.value)}
                required
                className={inputCls}
              />
              {errors.mortality && <p className="text-xs text-red-500 font-medium">{errors.mortality}</p>}
            </div>

            {/* Birds Sold Today */}
            <div className="w-full space-y-1.5">
              <label htmlFor="bf-birdsSold" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                Birds Sold Today
              </label>
              <input
                id="bf-birdsSold"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={fields.birdsSold}
                onChange={(e) => updateField('birdsSold', e.target.value)}
                className={inputCls}
              />
              {errors.birdsSold && <p className="text-xs text-red-500 font-medium">{errors.birdsSold}</p>}
            </div>

            {/* Live Birds - Read Only Box */}
            <div className="w-full">
              <div className="bg-[#EAF5EE] border border-[#1B6B3A]/20 rounded-xl p-4 h-[72px] flex flex-col justify-center">
                <p className="text-[10px] text-[#1B6B3A] font-bold uppercase tracking-wider">
                  Live Birds Remaining (Closing)
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold font-mono text-[#1B6B3A]">
                    {liveBirds}
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase font-medium">
                    Birds - Mort - Sold
                  </p>
                </div>
              </div>
            </div>

            {/* Avg Weight */}
            <div className="w-full space-y-1.5">
              <label htmlFor="bf-avgWeight" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                Avg Weight (kg)
              </label>
              <input
                id="bf-avgWeight"
                type="number"
                min="0"
                step="0.01"
                placeholder="1.8"
                value={fields.avgWeight}
                onChange={(e) => updateField('avgWeight', e.target.value)}
                required
                className={inputCls}
              />
              {errors.avgWeight && <p className="text-xs text-red-500 font-medium">{errors.avgWeight}</p>}
            </div>

             {/* Price Per kg */}
             <div className="w-full space-y-1.5">
              <label htmlFor="bf-pricePerKg" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                Price Per kg (RWF)
              </label>
              <input
                id="bf-pricePerKg"
                type="number"
                min="0"
                step="1"
                placeholder="3200"
                value={fields.pricePerKg}
                onChange={(e) => updateField('pricePerKg', e.target.value)}
                required
                className={inputCls}
              />
              {errors.pricePerKg && <p className="text-xs text-red-500 font-medium">{errors.pricePerKg}</p>}
            </div>

            {/* Calculated Weight Stats */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 md:col-span-1">
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Kgs Sold Today</p>
               <p className="text-xl font-bold font-mono text-[#2D2D2D]">{kgsSold.toFixed(2)} kg</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 md:col-span-1">
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Flock Weight</p>
               <p className="text-xl font-bold font-mono text-[#2D2D2D]">{totalWeight.toFixed(2)} kg</p>
            </div>

            {/* Expenses — read-only */}
            <div className="w-full space-y-1.5">
              <label htmlFor="bf-expenses" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                Total Expenses (RWF)
              </label>
              <div className="relative">
                <input
                  id="bf-expenses"
                  type="text"
                  readOnly
                  value={Number(fields.expenses).toLocaleString()}
                  className={`${inputCls} bg-gray-50 font-mono font-bold text-[#E07B00] border-gray-100 cursor-not-allowed`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold uppercase">
                  AUTO
                </div>
              </div>
            </div>

            {/* Revenue & Profit — auto calculated display */}
            <div className="grid grid-cols-2 gap-3 md:col-span-1">
               <div className="bg-[#FFF8E1] border border-[#F5C518]/30 rounded-xl p-3 flex flex-col justify-center">
                  <p className="text-[9px] text-[#E07B00] font-bold uppercase">Revenue</p>
                  <p className="text-sm font-bold font-mono text-[#2D2D2D] mt-0.5">{revenue.toLocaleString()}</p>
               </div>
               <div className={`border rounded-xl p-3 flex flex-col justify-center ${revenue - Number(fields.expenses) >= 0 ? 'bg-[#EAF5EE] border-[#1B6B3A]/20' : 'bg-red-50 border-red-200'}`}>
                  <p className={`text-[9px] font-bold uppercase ${revenue - Number(fields.expenses) >= 0 ? 'text-[#1B6B3A]' : 'text-red-500'}`}>Profit</p>
                  <p className={`text-sm font-bold font-mono mt-0.5 ${revenue - Number(fields.expenses) >= 0 ? 'text-[#1B6B3A]' : 'text-red-500'}`}>{(revenue - Number(fields.expenses)).toLocaleString()}</p>
               </div>
            </div>

            {/* Notes — full width */}
            <div className="w-full space-y-1.5 md:col-span-2">
              <label htmlFor="bf-notes" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                Notes
              </label>
              <textarea
                id="bf-notes"
                rows={3}
                maxLength={300}
                placeholder="Any unusual observations..."
                value={fields.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                className="flex w-full rounded-xl border-2 border-gray-100 bg-white px-4 py-3 text-sm text-[#111827] focus:outline-none focus:border-[#F5C518] transition-colors resize-none"
              />
              <p className="text-[10px] text-gray-400 text-right font-medium">
                {fields.notes.length}/300
              </p>
            </div>
          </div>

          {/* ── Submit ────────────────────────────────────────────────── */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full h-14 rounded-2xl text-base font-bold transition shadow-sm flex items-center justify-center gap-2
              ${isLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#1B6B3A] text-white hover:bg-[#15522c] active:scale-[0.98]'}`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                {isUpdateMode ? 'Update Daily Report' : 'Submit Daily Report'}
              </>
            )}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
