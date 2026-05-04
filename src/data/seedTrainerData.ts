/**
 * Trainer Management seed data (Personal Training).
 * ──────────────────────────────────────────────────
 * Generates relational trainer / assignment / session data for the
 * existing multi-vendor demo dataset. Consumed by `seedDemoData()` so
 * the data flows through the standard `loadDemo()` → localStorage path
 * (idempotent — replaces, never appends).
 *
 *   import { buildTrainerSeed } from '@/data/seedTrainerData';
 *   const { trainers, trainer_assignments, trainer_sessions }
 *     = buildTrainerSeed(vendors, members, { now, idFactory });
 */
import { addDays, subDays, subMonths, format } from 'date-fns';
import type {
  Vendor,
  Member,
  Trainer,
  TrainerAssignment,
  TrainerSession,
} from './seedDemoData';

export interface TrainerSeed {
  trainers: Trainer[];
  trainer_assignments: TrainerAssignment[];
  trainer_sessions: TrainerSession[];
}

/** Empty shape — useful as a default / typing reference. */
export const trainerSeedData: TrainerSeed = {
  trainers: [],
  trainer_assignments: [],
  trainer_sessions: [],
};

const TRAINER_TEMPLATES = [
  { name: 'Raj Bhatia',     specialization: 'Strength & Conditioning', experience: 8 },
  { name: 'Priya Kumar',    specialization: 'Yoga & Flexibility',      experience: 6 },
  { name: 'Vikram Power',   specialization: 'CrossFit & HIIT',         experience: 5 },
  { name: 'Meera Sharma',   specialization: 'Zumba & Cardio',          experience: 4 },
  { name: 'Karthik Joshi',  specialization: 'Functional Training',     experience: 7 },
  { name: 'Amit Verma',     specialization: 'Weight Loss',             experience: 3 },
  { name: 'Sneha Iyer',     specialization: 'Pilates & Mobility',      experience: 5 },
];
const PT_PRICES = [4999, 7999, 9999, 11999];
const PT_TOTALS = [12, 16, 20, 24];

function rand(seed: number) { return Math.abs(Math.sin(seed) * 10000) % 1; }
function fmtDate(d: Date) { return format(d, 'yyyy-MM-dd'); }
function fmtIso(d: Date) { return d.toISOString(); }
function phone(seed: number) {
  const base = 9000000000 + Math.floor(rand(seed) * 999999999);
  return `+91 ${base}`;
}

export interface BuildTrainerOpts {
  /** Reference "now" so dates align with the rest of the dataset. */
  now?: Date;
  /** Shared id factory so ids stay deterministic & non-colliding. */
  idFactory?: (prefix: string) => string;
}

export function buildTrainerSeed(
  vendors: Vendor[],
  members: Member[],
  opts: BuildTrainerOpts = {},
): TrainerSeed {
  const now = opts.now ?? new Date();
  let __c = 0;
  const id = opts.idFactory ?? ((p: string) => `${p}_${++__c}`);

  const trainers: Trainer[] = [];
  const trainer_assignments: TrainerAssignment[] = [];
  const trainer_sessions: TrainerSession[] = [];

  vendors.forEach((vendor, vi) => {
    // 2–4 trainers per vendor
    const tCount = 2 + (vi % 3);
    const vendorTrainers: Trainer[] = [];
    for (let t = 0; t < tCount; t++) {
      const tpl = TRAINER_TEMPLATES[(vi * 2 + t) % TRAINER_TEMPLATES.length];
      const tr: Trainer = {
        id: id('trainer'),
        vendor_id: vendor.id,
        name: tpl.name,
        phone: phone(vi * 1000 + t * 7),
        specialization: tpl.specialization,
        experience: tpl.experience,
        is_active: t < tCount - 1 || tCount === 1, // last one inactive (variety) unless solo
        created_at: fmtIso(subMonths(now, 6 + (vi % 4))),
      };
      trainers.push(tr);
      vendorTrainers.push(tr);
    }

    // Assign ~35% of vendor's members as PT clients (8–15 typical)
    const vendorMembers = members.filter(m => m.vendor_id === vendor.id);
    const ptCount = Math.min(15, Math.max(8, Math.floor(vendorMembers.length * 0.35)));
    const activeTrainers = vendorTrainers.filter(t => t.is_active);
    if (activeTrainers.length === 0) return;

    for (let i = 0; i < ptCount; i++) {
      const m = vendorMembers[i];
      if (!m) break;
      // Mix performance: trainer 0 high, last low
      const trainer = activeTrainers[i % activeTrainers.length];
      const perfBias = i % activeTrainers.length === 0 ? 0.7 : i % activeTrainers.length === activeTrainers.length - 1 ? 0.2 : 0.45;
      const total = PT_TOTALS[i % PT_TOTALS.length];
      const completed = Math.min(total, Math.max(0, Math.floor(total * perfBias + (rand(vi * 31 + i) - 0.5) * 4)));
      const startDaysAgo = 30 + Math.floor(rand(vi * 13 + i) * 30); // 30–60d ago
      const start = subDays(now, startDaysAgo);
      const end = addDays(start, 90);
      const price = PT_PRICES[i % PT_PRICES.length];

      const a: TrainerAssignment = {
        id: id('assign'),
        vendor_id: vendor.id,
        trainer_id: trainer.id,
        member_id: m.id,
        plan_type: 'PT',
        start_date: fmtDate(start),
        end_date: fmtDate(end),
        total_sessions: total,
        sessions_completed: completed,
        price,
        created_at: fmtIso(start),
      };
      trainer_assignments.push(a);

      // Session log: completed sessions spread over last 30 days
      for (let k = 0; k < completed; k++) {
        const dayOffset = Math.floor(rand(vi * 71 + i * 17 + k * 3) * 30);
        const sd = subDays(now, dayOffset);
        trainer_sessions.push({
          id: id('session'),
          vendor_id: vendor.id,
          trainer_id: trainer.id,
          member_id: m.id,
          assignment_id: a.id,
          date: fmtDate(sd),
          status: 'completed',
          created_at: fmtIso(sd),
        });
      }
      // Occasional missed session for realism
      if (i % 4 === 0) {
        const md = subDays(now, 6 + (i % 10));
        trainer_sessions.push({
          id: id('session'),
          vendor_id: vendor.id,
          trainer_id: trainer.id,
          member_id: m.id,
          assignment_id: a.id,
          date: fmtDate(md),
          status: 'missed',
          created_at: fmtIso(md),
        });
      }
    }
  });

  return { trainers, trainer_assignments, trainer_sessions };
}
