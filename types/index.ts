export type UserRole =
  | 'egg_farm'
  | 'broiler_farm'
  | 'egg_kiosk'
  | 'butcher'
  | 'finance'
  | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
}

export interface BaseReport {
  id?: string;
  date: string;
  submittedBy: string;
  createdAt?: string;
}

export interface EggFarmReport extends BaseReport {
  flockAgeWeeks: number;
  mortality: number;
  feedConsumedKg: number;
  eggsProducedTrays: number;
  damagedEggs: number;
  notes?: string;
}

export interface BroilerFarmReport extends BaseReport {
  flockAgeDays: number;
  mortality: number;
  feedConsumedKg: number;
  averageWeightKg: number;
  notes?: string;
}

export interface EggKioskReport extends BaseReport {
  eggsReceivedTrays: number;
  eggsSoldTrays: number;
  pricePerTray: number;
  totalRevenue: number;
  notes?: string;
}

export interface butcherReport extends BaseReport {
  birdsSlaughtered: number;
  totalMeatWeightKg: number;
  meatSoldKg: number;
  pricePerKg: number;
  totalRevenue: number;
  notes?: string;
}

export interface FinanceSummary {
  id?: string;
  date: string;
  department: string;
  revenue: number;
  expenses: number;
  profit: number;
  notes?: string;
}

export interface AdminLog {
  id?: string;
  timestamp: string;
  userEmail: string;
  department: string;
  action: string;
  details: string;
}
