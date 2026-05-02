/**
 * Multi-Vendor Demo Dataset (GymOS SaaS)
 * ──────────────────────────────────────────────────────────────
 * Production-grade, fully-relational dummy dataset that simulates
 * real GymOS multi-vendor (multi-tenant) operations.
 *
 *   • 1 super_admin
 *   • 5 vendors (gyms) — owners + 2-3 employees each
 *   • 5-6 plans / vendor
 *   • 25-40 members / vendor
 *   • 2-5 payments / member
 *   • 20-30 leads / vendor
 *   • 15-25 expenses / vendor
 *
 * All data is spread across the LAST 6 MONTHS so analytics, charts
 * and revenue dashboards render meaningful trends.
 *
 * NOTE: This file is a pure data fixture. It is NOT wired into the
 * live single-vendor mockDb (see src/data/mockDb.ts). It exists so
 * the multi-tenant SaaS layer can consume it when wiring is built.
 *
 *  import { seedDemoData } from '@/data/seedDemoData';
 *  const data = seedDemoData();
 */

import { addDays, subDays, subMonths, format } from 'date-fns';

// ─── Types ─────────────────────────────────────────────────────
export type Role = 'super_admin' | 'owner' | 'employee';
export type MemberStatus = 'active' | 'expired' | 'new';
export type PaymentStatus = 'paid' | 'pending' | 'overdue';
export type LeadStatus = 'new' | 'contacted' | 'converted';
export type ExpenseCategory = 'Rent' | 'Electricity' | 'Equipment' | 'Salary' | 'Utilities' | 'Marketing';

export interface Vendor {
  id: string;
  name: string;          // gym name
  city: string;
  owner_id: string;
  performance: 'high' | 'medium' | 'low';
  created_at: string;
}

export interface User {
  id: string;
  role: Role;
  vendor_id: string | null;
  name: string;
  phone?: string;
  email?: string;
}

export interface Plan {
  id: string;
  vendor_id: string;
  name: string;
  category: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly' | 'Premium' | 'Couple';
  price: number;
  duration_days: number;
}

export interface Member {
  id: string;
  vendor_id: string;
  name: string;
  phone: string;
  plan_id: string;
  status: MemberStatus;
  join_date: string;
  expiry_date: string;
}

export interface Payment {
  id: string;
  vendor_id: string;
  member_id: string;
  amount: number;
  status: PaymentStatus;
  date: string;
  method: 'cash' | 'upi' | 'card' | 'bank_transfer';
}

export interface Lead {
  id: string;
  vendor_id: string;
  name: string;
  phone: string;
  goal: string;
  status: LeadStatus;
  created_at: string;
}

export interface Expense {
  id: string;
  vendor_id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
}

export type Permission =
  | 'dashboard:view' | 'dashboard:edit'
  | 'members:view' | 'members:edit'
  | 'payments:view' | 'payments:edit'
  | 'leads:view' | 'leads:edit'
  | 'expenses:view' | 'expenses:edit'
  | 'plans:view' | 'plans:edit'
  | 'website:view' | 'website:edit'
  | 'recycle:view' | 'recycle:edit'
  | 'reports:view' | 'settings:view' | 'settings:edit';

export interface PermissionGrant {
  user_id: string;
  vendor_id: string;
  permissions: Permission[];
}

export interface SeedDataset {
  users: User[];
  vendors: Vendor[];
  plans: Plan[];
  members: Member[];
  payments: Payment[];
  leads: Lead[];
  expenses: Expense[];
  permissions: PermissionGrant[];
}

// ─── Deterministic helpers ─────────────────────────────────────
let __idCounter = 0;
const id = (prefix: string) => `${prefix}_${++__idCounter}`;

function pick<T>(arr: T[], i: number): T { return arr[i % arr.length]; }
function rand(seed: number) { return Math.abs(Math.sin(seed) * 10000) % 1; }
function fmtDate(d: Date) { return format(d, 'yyyy-MM-dd'); }
function fmtIso(d: Date) { return d.toISOString(); }
function phone(seed: number) {
  const base = 9000000000 + Math.floor(rand(seed) * 999999999);
  return `+91 ${base}`;
}

// ─── Static reference data ─────────────────────────────────────
const FIRST_NAMES = [
  'Aarav', 'Priya', 'Rohan', 'Ananya', 'Vikram', 'Sneha', 'Arjun', 'Meera',
  'Karthik', 'Divya', 'Rahul', 'Pooja', 'Aditya', 'Neha', 'Siddharth', 'Riya',
  'Manish', 'Kavita', 'Nikhil', 'Anita', 'Deepak', 'Swati', 'Amit', 'Ishita',
  'Rajesh', 'Tanvi', 'Suresh', 'Pallavi', 'Harshad', 'Lavanya', 'Mohit', 'Nandini',
  'Omkar', 'Preeti', 'Sanjay', 'Tara', 'Uday', 'Vidya', 'Yash', 'Zara',
];
const LAST_NAMES = [
  'Patel', 'Sharma', 'Gupta', 'Singh', 'Reddy', 'Iyer', 'Kumar', 'Nair',
  'Joshi', 'Verma', 'Mehta', 'Agarwal', 'Rao', 'Kapoor', 'Chauhan', 'Malhotra',
  'Tiwari', 'Das', 'Bhat', 'Saxena', 'Pawar', 'Krishnan', 'Bansal', 'Pillai',
];
const FITNESS_GOALS = ['Weight Loss', 'Muscle Gain', 'General Fitness', 'Strength Training', 'Yoga', 'Cardio'];
const PAY_METHODS: Payment['method'][] = ['cash', 'upi', 'card', 'bank_transfer'];

const VENDOR_DEFS: Array<Pick<Vendor, 'name' | 'city' | 'performance'>> = [
  { name: 'IronCore Fitness', city: 'Mumbai',    performance: 'high'   },
  { name: 'PowerHouse Gym',   city: 'Bengaluru', performance: 'high'   },
  { name: 'FlexZone Studio',  city: 'Delhi',     performance: 'medium' },
  { name: 'BeastMode Arena',  city: 'Pune',      performance: 'low'    },  // overdue-heavy
  { name: 'PulseFit Club',    city: 'Hyderabad', performance: 'medium' },
];

const PLAN_TEMPLATES: Array<Omit<Plan, 'id' | 'vendor_id'>> = [
  { name: 'Basic Monthly',     category: 'Monthly',     price: 999,   duration_days: 30  },
  { name: 'Quarterly Saver',   category: 'Quarterly',   price: 2499,  duration_days: 90  },
  { name: 'Half-Yearly Pro',   category: 'Half-Yearly', price: 4499,  duration_days: 180 },
  { name: 'Yearly Saver',      category: 'Yearly',      price: 7999,  duration_days: 365 },
  { name: 'Premium Coaching',  category: 'Premium',     price: 1999,  duration_days: 30  },
  { name: 'Couple Plan',       category: 'Couple',      price: 2199,  duration_days: 30  },
];

const RECURRING_EXPENSES: Array<Omit<Expense, 'id' | 'vendor_id' | 'date'>> = [
  { title: 'Monthly Rent',                category: 'Rent',        amount: 45000 },
  { title: 'Electricity Bill',            category: 'Electricity', amount: 12000 },
  { title: 'Trainer Salary',              category: 'Salary',      amount: 25000 },
  { title: 'Reception Salary',            category: 'Salary',      amount: 15000 },
  { title: 'Water Supply',                category: 'Utilities',   amount: 3000  },
];
const ADHOC_EXPENSES: Array<Omit<Expense, 'id' | 'vendor_id' | 'date'>> = [
  { title: 'Equipment Maintenance',       category: 'Equipment',   amount: 8000  },
  { title: 'New Dumbbell Set',            category: 'Equipment',   amount: 18000 },
  { title: 'Treadmill Replacement',       category: 'Equipment',   amount: 35000 },
  { title: 'Social Media Ads',            category: 'Marketing',   amount: 5000  },
  { title: 'Local Hoardings',             category: 'Marketing',   amount: 7500  },
  { title: 'Internet & Wi-Fi',            category: 'Utilities',   amount: 2200  },
];

const PERMISSION_PRESETS: Record<string, Permission[]> = {
  manager:    ['dashboard:view','members:view','members:edit','payments:view','payments:edit','leads:view','leads:edit','expenses:view','plans:view','reports:view'],
  trainer:    ['dashboard:view','members:view','members:edit','leads:view','leads:edit'],
  reception:  ['dashboard:view','members:view','payments:view','leads:view','leads:edit'],
  viewer:     ['dashboard:view','members:view','payments:view','reports:view'],
};

// ─── Builder ───────────────────────────────────────────────────
export function seedDemoData(): SeedDataset {
  __idCounter = 0;
  const now = new Date();

  const users: User[] = [];
  const vendors: Vendor[] = [];
  const plans: Plan[] = [];
  const members: Member[] = [];
  const payments: Payment[] = [];
  const leads: Lead[] = [];
  const expenses: Expense[] = [];
  const permissions: PermissionGrant[] = [];

  // 1. Super Admin
  users.push({
    id: 'super_admin_1',
    role: 'super_admin',
    vendor_id: null,
    name: 'GymOS Admin',
    email: 'admin@gymos.io',
  });

  // 2. Vendors + owners + employees
  VENDOR_DEFS.forEach((vd, vi) => {
    const vendorId = `vendor_${vi + 1}`;
    const ownerId = `user_owner_${vi + 1}`;
    const ownerName = `${pick(FIRST_NAMES, vi * 3)} ${pick(LAST_NAMES, vi * 5)}`;

    vendors.push({
      id: vendorId,
      name: vd.name,
      city: vd.city,
      owner_id: ownerId,
      performance: vd.performance,
      created_at: fmtIso(subMonths(now, 12 + vi)),
    });

    users.push({
      id: ownerId, role: 'owner', vendor_id: vendorId,
      name: ownerName, phone: phone(vi * 17 + 1),
      email: `owner${vi + 1}@${vd.name.toLowerCase().replace(/\s+/g, '')}.com`,
    });
    permissions.push({
      user_id: ownerId, vendor_id: vendorId,
      permissions: ['members:edit','payments:edit','leads:edit','expenses:edit','reports:view','settings:edit',
                    'members:view','payments:view','leads:view','expenses:view'],
    });

    // 2-3 employees per vendor with varied permission presets
    const empCount = 2 + (vi % 2); // 2 or 3
    const presetKeys = Object.keys(PERMISSION_PRESETS);
    for (let e = 0; e < empCount; e++) {
      const empId = `user_emp_${vi + 1}_${e + 1}`;
      const empName = `${pick(FIRST_NAMES, vi * 7 + e * 11)} ${pick(LAST_NAMES, vi * 11 + e * 7)}`;
      const presetKey = presetKeys[(vi + e) % presetKeys.length];
      users.push({
        id: empId, role: 'employee', vendor_id: vendorId,
        name: empName, phone: phone(vi * 31 + e * 13),
      });
      permissions.push({
        user_id: empId, vendor_id: vendorId,
        permissions: PERMISSION_PRESETS[presetKey],
      });
    }

    // 3. Plans (5-6 per vendor)
    const planCount = 5 + (vi % 2);
    const vendorPlans: Plan[] = [];
    for (let p = 0; p < planCount; p++) {
      const t = PLAN_TEMPLATES[p];
      const plan: Plan = { id: id('plan'), vendor_id: vendorId, ...t };
      plans.push(plan);
      vendorPlans.push(plan);
    }

    // 4. Members (25-40 per vendor) — 60% active / 25% expired / 15% new
    const memberCount = 25 + Math.floor(rand(vi + 1) * 16); // 25..40
    const vendorMembers: Member[] = [];
    for (let m = 0; m < memberCount; m++) {
      const plan = pick(vendorPlans, m);
      const r = rand(vi * 100 + m);
      let status: MemberStatus;
      let joinDate: Date;
      let expiryDate: Date;

      if (r < 0.60) {
        // active — joined 1-150 days ago, still inside plan window
        status = 'active';
        const daysAgo = 5 + Math.floor(rand(vi * 7 + m) * 145);
        joinDate = subDays(now, daysAgo);
        expiryDate = addDays(joinDate, plan.duration_days);
        if (expiryDate < now) expiryDate = addDays(now, 5 + Math.floor(rand(m) * 25));
      } else if (r < 0.85) {
        // expired — plan ended 1-60 days ago
        status = 'expired';
        const expAgo = 1 + Math.floor(rand(vi * 9 + m) * 60);
        expiryDate = subDays(now, expAgo);
        joinDate = subDays(expiryDate, plan.duration_days);
      } else {
        // new — joined within last 14 days
        status = 'new';
        joinDate = subDays(now, Math.floor(rand(vi * 13 + m) * 14));
        expiryDate = addDays(joinDate, plan.duration_days);
      }

      const member: Member = {
        id: id('member'),
        vendor_id: vendorId,
        name: `${pick(FIRST_NAMES, vi * 17 + m)} ${pick(LAST_NAMES, vi * 13 + m * 3)}`,
        phone: phone(vi * 53 + m * 7),
        plan_id: plan.id,
        status,
        join_date: fmtDate(joinDate),
        expiry_date: fmtDate(expiryDate),
      };
      members.push(member);
      vendorMembers.push(member);

      // 5. Payments (2-5 per member) — distribution depends on vendor performance
      const payCount = 2 + Math.floor(rand(vi * 19 + m) * 4); // 2..5
      const overdueBoost = vd.performance === 'low' ? 0.25 : 0; // low performer → more overdue

      for (let k = 0; k < payCount; k++) {
        const monthsBack = k; // payment k: k months ago (current cycle = 0)
        const base = subMonths(now, monthsBack);
        const day = 1 + Math.floor(rand(vi * 23 + m * 5 + k) * 27);
        const pDate = new Date(base.getFullYear(), base.getMonth(), Math.min(day, 27));
        if (pDate > now) continue;

        const pr = rand(vi * 31 + m * 7 + k * 3) - overdueBoost;
        let pStatus: PaymentStatus;
        if (pr > 0.30) pStatus = 'paid';
        else if (pr > 0.10) pStatus = 'pending';
        else pStatus = 'overdue';

        // High performers tilt more toward paid
        if (vd.performance === 'high' && pStatus !== 'paid' && rand(k + m) > 0.5) pStatus = 'paid';

        payments.push({
          id: id('pay'),
          vendor_id: vendorId,
          member_id: member.id,
          amount: plan.price,
          status: pStatus,
          date: fmtDate(pDate),
          method: pick(PAY_METHODS, vi + m + k),
        });
      }
    }

    // 6. Leads (20-30 per vendor) — 40% new / 40% contacted / 20% converted
    const leadCount = 20 + Math.floor(rand(vi * 41 + 7) * 11); // 20..30
    for (let l = 0; l < leadCount; l++) {
      const r = rand(vi * 43 + l * 5);
      const status: LeadStatus = r < 0.4 ? 'new' : r < 0.8 ? 'contacted' : 'converted';
      // Spread across last 6 months, no same-day clustering
      const daysAgo = Math.floor(rand(vi * 47 + l * 11) * 180);
      leads.push({
        id: id('lead'),
        vendor_id: vendorId,
        name: `${pick(FIRST_NAMES, vi * 23 + l * 3)} ${pick(LAST_NAMES, vi * 19 + l)}`,
        phone: phone(vi * 67 + l * 5),
        goal: pick(FITNESS_GOALS, vi + l),
        status,
        created_at: fmtIso(subDays(now, daysAgo)),
      });
    }

    // 7. Expenses (15-25 per vendor) — recurring monthly + ad-hoc, last 6 months
    const adhocTarget = 15 + Math.floor(rand(vi * 53 + 3) * 11) - RECURRING_EXPENSES.length * 6; // ensure 15..25 total
    // Recurring: 6 months × 5 items (cap to last 6 months)
    for (let mb = 0; mb < 6; mb++) {
      const monthDate = subMonths(now, mb);
      RECURRING_EXPENSES.forEach((re, idx) => {
        const day = Math.min(1 + idx * 4, 27);
        const eDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
        if (eDate > now) return;
        // amount jitter ±10%
        const jitter = 1 + (rand(vi * 71 + mb * 11 + idx) - 0.5) * 0.2;
        expenses.push({
          id: id('exp'),
          vendor_id: vendorId,
          title: re.title,
          category: re.category,
          amount: Math.round(re.amount * jitter),
          date: fmtDate(eDate),
        });
      });
    }
    // Ad-hoc expenses spread across the last 6 months
    const numAdhoc = Math.max(0, Math.min(ADHOC_EXPENSES.length, adhocTarget + ADHOC_EXPENSES.length));
    for (let a = 0; a < numAdhoc; a++) {
      const ah = ADHOC_EXPENSES[a % ADHOC_EXPENSES.length];
      const daysAgo = Math.floor(rand(vi * 79 + a * 13) * 175) + 2;
      const eDate = subDays(now, daysAgo);
      expenses.push({
        id: id('exp'),
        vendor_id: vendorId,
        title: ah.title,
        category: ah.category,
        amount: ah.amount,
        date: fmtDate(eDate),
      });
    }
  });

  return { users, vendors, plans, members, payments, leads, expenses, permissions };
}

// ─── Convenience selectors (multi-tenant filtering) ─────────────
export function filterByVendor<T extends { vendor_id: string }>(rows: T[], vendorId: string): T[] {
  return rows.filter(r => r.vendor_id === vendorId);
}

export function summarizeDataset(d: SeedDataset) {
  return {
    users: d.users.length,
    vendors: d.vendors.length,
    plans: d.plans.length,
    members: d.members.length,
    payments: d.payments.length,
    leads: d.leads.length,
    expenses: d.expenses.length,
    permissions: d.permissions.length,
    revenue_paid: d.payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
    revenue_overdue: d.payments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0),
  };
}
