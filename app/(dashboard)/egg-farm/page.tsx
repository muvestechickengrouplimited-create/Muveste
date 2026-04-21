'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EggFarmForm } from '../../../components/forms/EggFarmForm';
import { StatCard } from '../../../components/ui/StatCard';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { formatRWF, formatDate } from '../../../lib/utils';
import { auth } from '../../../lib/firebase';

// ─── Types ─────────────────────────────────────────────────────────────────
interface EggFarmRecord {
  date: string;
  feedQty: number;
  feedPrice: number;
  water: number;
  medicationsGiven: string;
  newBirds: number;
  birdsSold: number;
  priceOfBirdsSold: number;
  mortality: number;
  liveBirds: number;
  freshEggs: number;
  pricePerFreshEgg: number;
  checkedEggs: number;
  pricePerCheckedEgg: number;
  brokenEggs: number;
  totalEggs: number;
  freshEggsSold: number;
  checkedEggsSold: number;
  freshEggsLeftInStock: number;
  checkedEggsLeftInStock: number;
  avgWeight: number;
  expenses: number;
  revenue: number;
  rateOfLay: number;
  notes: string;
  submittedBy: string;
  timestamp: string;
}

// ─── Icons ─────────────────────────────────────────────────────────────────
const EggIcon = ({ color = "currentColor" }: { color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke={color} strokeWidth={1.8}>
    <ellipse cx="12" cy="13" rx="7" ry="9" />
  </svg>
);

const RevenueIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const WeightIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 12h12l3-12H3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3" />
    </svg>
);

// ─── Page ──────────────────────────────────────────────────────────────────
export default function EggFarmDashboard() {
  const [records, setRecords] = useState<EggFarmRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        setError('Not authenticated. Please refresh the page.');
        return;
      }

      const res = await fetch('/api/egg-farm', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to load records');
        return;
      }

      const data: { data: EggFarmRecord[] } = await res.json();
      setRecords(data.data || []);
    } catch (err) {
      console.error('Failed to fetch egg-farm records:', err);
      setError('Failed to load records. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derive today's totals from fetched records ─────────────────────────
  const todayRecords = records.filter((r) => r.date === todayStr);

  const todayTotal = todayRecords.reduce((s, r) => s + r.totalEggs, 0);
  const todayExpenses = todayRecords.reduce((s, r) => s + r.expenses, 0);
  const todayRevenue = todayRecords.reduce((s, r) => s + r.revenue, 0);
  const todayProfit = todayRevenue - todayExpenses;

  // ── Recent 7 days ──────────────────────────────────────────────────────
  const cutoff7 = new Date();
  cutoff7.setDate(cutoff7.getDate() - 7);
  const recent7 = records
    .filter((r) => new Date(r.date) >= cutoff7)
    .slice(0, 20); 

  if (loading && records.length === 0) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-8 max-w-7xl mx-auto">
          <div className="h-10 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-28 bg-gray-200 rounded-2xl"></div>
            <div className="h-28 bg-gray-200 rounded-2xl"></div>
            <div className="h-28 bg-gray-200 rounded-2xl"></div>
            <div className="h-28 bg-gray-200 rounded-2xl"></div>
          </div>
          <div className="h-96 bg-gray-200 rounded-2xl mt-8"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <div className="space-y-8 pb-8">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#1B6B3A]">
          Egg Farm — Daily Report
        </h1>
        <p className="text-[#111827] opacity-70 text-base">{todayLabel}</p>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total eggs today"
          value={todayTotal.toLocaleString()}
          icon={<EggIcon color="#1B6B3A" />}
          className="border-l-4 border-[#1B6B3A]"
        />
        <StatCard
          title="Total expenses"
          value={formatRWF(todayExpenses)}
          icon={<RevenueIcon />}
          className="border-l-4 border-[#E07B00] text-[#E07B00]"
        />
        <StatCard
          title="Total revenue"
          value={formatRWF(todayRevenue)}
          icon={<RevenueIcon />}
          className="border-l-4 border-[#22C55E]"
        />
        <StatCard
          title="Total profit"
          value={formatRWF(todayProfit)}
          icon={<RevenueIcon />}
          className={`border-l-4 ${todayProfit >= 0 ? 'border-[#1B6B3A] text-[#1B6B3A]' : 'border-red-500 text-red-500'}`}
        />
      </div>

      {/* ── Main Content: Form (60%) + Table (40%) ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Form — 60% */}
        <div className="lg:col-span-3">
          <EggFarmForm />
        </div>

        {/* Recent Submissions Table — 40% */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#111827]">
              Recent Submissions{' '}
              <span className="text-xs font-normal text-gray-400 ml-1">
                (last 7 days)
              </span>
            </h2>
            <button
              onClick={fetchRecords}
              className="text-xs text-[#1B6B3A] hover:underline font-medium"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1B6B3A] border-t-transparent" />
                <p className="text-sm text-gray-400">Loading records…</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : recent7.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.07)] py-12 flex flex-col items-center gap-2">
              <span className="text-4xl">🥚</span>
              <p className="text-sm text-gray-400">No submissions in the last 7 days.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Flock</TableHead>
                  <TableHead>Prod.</TableHead>
                  <TableHead>Lay %</TableHead>
                  <TableHead>Sold</TableHead>
                  <TableHead>Eggs Stock</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Expenses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent7.map((record, idx) => (
                  <TableRow key={`${record.date}-${idx}`}>
                    <TableCell className="whitespace-nowrap font-medium text-xs">
                      {formatDate(record.date)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <div className="flex flex-col">
                        <span className="font-bold text-blue-700">{record.liveBirds}</span>
                        <div className="flex flex-col text-[10px] text-gray-400">
                           <span>-{record.mortality} dead</span>
                           {record.birdsSold > 0 && <span>-{record.birdsSold} sold</span>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {record.totalEggs}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-purple-700">
                      {record.rateOfLay ? `${record.rateOfLay.toFixed(1)}%` : '0%'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                       {record.freshEggsSold + record.checkedEggsSold}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-orange-700">
                      <div className="flex flex-col">
                        <span>{record.freshEggsLeftInStock} fresh</span>
                        {record.checkedEggsLeftInStock > 0 && (
                          <span className="text-[10px] text-gray-500 font-normal">{record.checkedEggsLeftInStock} chk</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-[#1B6B3A] font-semibold text-xs whitespace-nowrap">
                      {formatRWF(record.revenue)}
                    </TableCell>
                    <TableCell className="font-mono text-[#E07B00] text-xs whitespace-nowrap">
                      {formatRWF(record.expenses)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
        </div>
      </div>
      <div className="block md:hidden">
        <EggFarmMobile />
      </div>
    </>
  );
}

// ─── Mobile Component ───────────────────────────────────────────────────────
function EggFarmMobile() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const MEMORY_KEY = 'eggFarmMobileLastSubmitted';

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Field states
  const [newBirds, setNewBirds] = useState('0');
  const [birdsSold, setBirdsSold] = useState('0');
  const [priceOfBirdsSold, setPriceOfBirdsSold] = useState('0');
  const [mortality, setMortality] = useState('0');
  const [feedQty, setFeedQty] = useState('');
  const [water, setWater] = useState('');
  const [meds, setMeds] = useState('');
  
  const [freshEggs, setFreshEggs] = useState('');
  const [priceFresh, setPriceFresh] = useState('');
  
  const [checkedEggs, setCheckedEggs] = useState('');
  const [priceChecked, setPriceChecked] = useState('');
  
  const [brokenEggs, setBrokenEggs] = useState('');
  const [avgWeight, setAvgWeight] = useState('');
  
  const [feedPrice, setFeedPrice] = useState('');
  const [expenses, setExpenses] = useState('0');
  const [freshEggsSold, setFreshEggsSold] = useState('0');
  const [checkedEggsSold, setCheckedEggsSold] = useState('0');
  const [notes, setNotes] = useState('');

  const [lastStock, setLastStock] = useState({ liveBirds: 0, freshEggsLeftInStock: 0, checkedEggsLeftInStock: 0 });
  const [fetchingStock, setFetchingStock] = useState(true);

  useEffect(() => {
    // Fetch live birds and stock
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
              checkedEggsLeftInStock: data.checkedEggsLeftInStock || 0
            });
            // Prefill "Live Birds (yesterday)" with the fetched value
            if (data.liveBirds !== undefined) {
              setNewBirds(String(data.liveBirds));
            }
          }
        } catch(e) {
          console.warn('Failed to fetch last egg stock', e);
        }
      }
      setFetchingStock(false);
    });
  }, []);

  const nB = Number(newBirds) || 0;
  const bS = Number(birdsSold) || 0;
  const pbS = Number(priceOfBirdsSold) || 0;
  const m = Number(mortality) || 0;
  const currentLiveBirds = nB - bS - m;

  const f = Number(freshEggs) || 0;
  const pf = Number(priceFresh) || 0;
  const c = Number(checkedEggs) || 0;
  const pc = Number(priceChecked) || 0;
  const b = Number(brokenEggs) || 0;
  
  const totalEggs = f + c + b;
  const soldFresh = Number(freshEggsSold) || 0;
  const soldChecked = Number(checkedEggsSold) || 0;
  
  const currentFreshEggsInStock = lastStock.freshEggsLeftInStock + f - soldFresh;
  const currentCheckedEggsInStock = lastStock.checkedEggsLeftInStock + c - soldChecked;

  const rateOfLay = currentLiveBirds > 0 ? (totalEggs / currentLiveBirds) * 100 : 0;

  const revenue = (soldFresh * pf) + (soldChecked * pc) + (bS * pbS);
  
  // Auto-calculate expenses: feedQty * feedPrice
  const calculatedExpenses = (Number(feedQty) || 0) * (Number(feedPrice) || 0);
  const profit = revenue - calculatedExpenses;

  // Sync expenses
  useEffect(() => {
    setExpenses(String(calculatedExpenses));
  }, [calculatedExpenses]);

  const resetForm = (updatedStock?: { liveBirds: number }) => {
    setNewBirds(String(updatedStock?.liveBirds ?? lastStock.liveBirds)); setBirdsSold('0'); setPriceOfBirdsSold('0'); setMortality('0');
    setFeedQty(''); setWater(''); setMeds('');
    setFreshEggs(''); setPriceFresh('');
    setCheckedEggs(''); setPriceChecked('');
    setBrokenEggs(''); setAvgWeight('');
    setFreshEggsSold('0'); setCheckedEggsSold('0');
    setExpenses(''); setNotes('');
    setSubmitted(false); setCurrentStep(1);
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!feedQty || !water || !feedPrice) return alert('Please fill required inputs (Feed Qty, Feed Price, Water)');
    }
    if (currentStep === 2) {
      if (!freshEggs || !priceFresh || !checkedEggs || !priceChecked) return alert('Please fill production and prices');
    }
    if (currentStep === 3) {
        if (!brokenEggs || !avgWeight) return alert('Please fill broken eggs and weight');
    }
    setCurrentStep((s) => s + 1);
  };
  const prevStep = () => setCurrentStep((s) => s - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const payload = {
        date: selectedDate,
        feedQty: Number(feedQty),
        water: Number(water),
        medicationsGiven: meds,
        newBirds: nB,
        birdsSold: bS,
        priceOfBirdsSold: pbS,
        mortality: m,
        liveBirds: currentLiveBirds,
        freshEggs: f,
        pricePerFreshEgg: pf,
        checkedEggs: c,
        pricePerCheckedEgg: pc,
        brokenEggs: b,
        totalEggs,
        freshEggsSold: soldFresh,
        checkedEggsSold: soldChecked,
        freshEggsLeftInStock: currentFreshEggsInStock,
        checkedEggsLeftInStock: currentCheckedEggsInStock,
        avgWeight: Number(avgWeight),
        feedPrice: Number(feedPrice),
        expenses: Number(expenses),
        revenue,
        rateOfLay,
        notes,
      };

      const res = await fetch('/api/egg-farm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

       if (!res.ok) throw new Error('Failed to submit report');

      setLastStock({
        liveBirds: currentLiveBirds,
        freshEggsLeftInStock: currentFreshEggsInStock,
        checkedEggsLeftInStock: currentCheckedEggsInStock
      });
      setSubmitted(true);
      resetForm({ liveBirds: currentLiveBirds });
      router.refresh();
    } catch (err) {
      alert('Error submitting report.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = ["Inputs", "Production", "Expenses & Weight", "Submit"];
  const stepTitle = stepTitles[currentStep - 1];

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-gray-50">
        <div className="w-16 h-16 bg-[#EAF5EE] rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[#1B6B3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-[#2D2D2D] mb-2">Report Submitted!</h3>
        <p className="text-sm text-gray-400 mb-6">Daily egg farm production metrics saved.</p>
        <button onClick={() => resetForm()} className="bg-[#1B6B3A] text-white rounded-2xl px-8 py-3 text-sm font-bold active:scale-95">
          Submit Another
        </button>
      </div>
    );
  }

  const mobileInput = "w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3 text-sm text-[#2D2D2D] focus:border-[#F5C518] outline-none h-12";

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-[#1B6B3A] px-4 py-3 flex items-center justify-between">
        <a href="/dashboard" className="text-white/70 text-xs">← Back</a>
        <span className="text-white text-sm font-bold">Egg Farm Report</span>
        <input 
          type="date" 
          value={selectedDate} 
          onChange={(e) => setSelectedDate(e.target.value)} 
          className="bg-white/10 text-white text-[10px] font-bold px-2 py-1 rounded border border-white/20 outline-none"
        />
      </div>

      <div className="bg-[#164F2C] px-4 py-3">
        <div className="bg-white/15 h-1 rounded-full mb-1">
          <div className="bg-[#F5C518] h-full rounded-full transition-all" style={{width: `${(currentStep/totalSteps)*100}%`}} />
        </div>
        <p className="text-white/50 text-[10px] uppercase font-bold tracking-wider">Step {currentStep} of {totalSteps}: {stepTitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase">Live Birds (yesterday)</label>
                <input required type="number" value={newBirds} onChange={e => setNewBirds(e.target.value)} className={mobileInput} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase">Mortality</label>
                <input required type="number" value={mortality} onChange={e => setMortality(e.target.value)} className={mobileInput} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase">Birds Sold</label>
                <input required type="number" value={birdsSold} onChange={e => setBirdsSold(e.target.value)} className={mobileInput} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase">Price of Birds Sold</label>
                <input required type="number" value={priceOfBirdsSold} onChange={e => setPriceOfBirdsSold(e.target.value)} className={mobileInput} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase">Feed (kg)</label>
                <input required type="number" value={feedQty} onChange={e => setFeedQty(e.target.value)} className={mobileInput} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase">Feed Price (RWF)</label>
                <input required type="number" value={feedPrice} onChange={e => setFeedPrice(e.target.value)} className={mobileInput} placeholder="e.g. 800" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase">Water (L)</label>
                <input required type="number" value={water} onChange={e => setWater(e.target.value)} className={mobileInput} />
              </div>
              <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase">Feed Expenses</label>
                  <div className={`${mobileInput} bg-gray-50 font-bold text-[#E07B00] flex items-center`}>
                    {calculatedExpenses.toLocaleString()}
                  </div>
              </div>
            </div>
            <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase">Medications</label>
                <input type="text" value={meds} onChange={e => setMeds(e.target.value)} className={mobileInput} placeholder="e.g. Vitamins" />
            </div>
            <button type="button" onClick={nextStep} className="w-full bg-[#F5C518] text-[#2D2D2D] font-bold py-4 rounded-2xl shadow-lg">Next Step →</button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase">Fresh Eggs</label>
                <input required type="number" value={freshEggs} onChange={e => setFreshEggs(e.target.value)} className={mobileInput} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase">Price (RWF)</label>
                <input required type="number" value={priceFresh} onChange={e => setPriceFresh(e.target.value)} className={mobileInput} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase">Checked Eggs</label>
                <input required type="number" value={checkedEggs} onChange={e => setCheckedEggs(e.target.value)} className={mobileInput} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase">Price (RWF)</label>
                <input required type="number" value={priceChecked} onChange={e => setPriceChecked(e.target.value)} className={mobileInput} />
              </div>
            </div>
            <div className="bg-[#FFF8E1] p-4 rounded-2xl border border-[#F5C518]">
                <p className="text-[10px] font-bold text-[#E07B00] uppercase">Estimated Revenue</p>
                <p className="text-xl font-bold text-[#2D2D2D]">{formatRWF(revenue)}</p>
            </div>
            <div className="flex flex-col gap-2">
                <button type="button" onClick={nextStep} className="w-full bg-[#F5C518] text-[#2D2D2D] font-bold py-4 rounded-2xl">Next Step →</button>
                <button type="button" onClick={prevStep} className="text-gray-400 text-sm font-semibold py-2">← Back</button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase">Broken Eggs</label>
                    <input required type="number" value={brokenEggs} onChange={e => setBrokenEggs(e.target.value)} className={mobileInput} />
                    <p className="text-[10px] text-red-400">Broken eggs have zero value</p>
                </div>
                <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase">Avg Weight (kg)</label>
                    <input required type="number" step="0.01" value={avgWeight} onChange={e => setAvgWeight(e.target.value)} className={mobileInput} />
                </div>
                <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase">Fresh Eggs Sold</label>
                    <input required type="number" value={freshEggsSold} onChange={e => setFreshEggsSold(e.target.value)} className={mobileInput} />
                </div>
                <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase">Checked Eggs Sold</label>
                    <input required type="number" value={checkedEggsSold} onChange={e => setCheckedEggsSold(e.target.value)} className={mobileInput} />
                </div>
                <div className="flex flex-col gap-2">
                    <button type="button" onClick={nextStep} className="w-full bg-[#F5C518] text-[#2D2D2D] font-bold py-4 rounded-2xl">Final Step →</button>
                    <button type="button" onClick={prevStep} className="text-gray-400 text-sm font-semibold py-2">← Back</button>
                </div>
            </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
             <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Total Eggs Production</p>
              <p className="text-xl font-bold text-[#2D2D2D]">{totalEggs}</p>
              <p className="text-[10px] text-gray-400 mt-1">Fresh: {f} | Checked: {c} | Broken: {b}</p>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Fresh Stock</p>
                <p className="text-xl font-bold text-orange-700">{fetchingStock ? '...' : currentFreshEggsInStock}</p>
              </div>
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Checked Stock</p>
                <p className="text-xl font-bold text-orange-700">{fetchingStock ? '...' : currentCheckedEggsInStock}</p>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border-2 ${profit >= 0 ? 'bg-[#EAF5EE] border-[#1B6B3A]' : 'bg-red-50 border-[#D9534F]'}`}>
              <p className={`text-[10px] font-bold uppercase ${profit >= 0 ? 'text-[#1B6B3A]' : 'text-[#D9534F]'}`}>Daily Profit</p>
              <p className={`text-xl font-bold ${profit >= 0 ? 'text-[#1B6B3A]' : 'text-[#D9534F]'}`}>{formatRWF(profit)}</p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <p className="text-[10px] font-bold text-purple-800 uppercase">Rate of Lay</p>
              <p className="text-xl font-bold text-purple-900">{rateOfLay.toFixed(1)}%</p>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase">Notes (Optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3 text-sm text-[#2D2D2D] focus:border-[#F5C518] outline-none" rows={3} />
            </div>

            <div className="flex flex-col gap-2">
                <button type="submit" disabled={loading} className="w-full bg-[#1B6B3A] text-white font-bold py-4 rounded-2xl shadow-lg">
                    {loading ? 'Submitting...' : 'Submit Final Report'}
                </button>
                <button type="button" onClick={prevStep} className="text-gray-400 text-sm font-semibold py-2">← Back to Edit</button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
