/**
 * Demo-mode multi-vendor types.
 * Re-exported from seedDemoData so consumers have one import path.
 */
export type {
  Role,
  MemberStatus,
  PaymentStatus,
  LeadStatus,
  ExpenseCategory,
  Vendor,
  User as DemoUser,
  Plan as DemoPlan,
  Member as DemoMember,
  Payment as DemoPayment,
  Lead as DemoLead,
  Expense as DemoExpense,
  Permission,
  PermissionGrant,
  SeedDataset,
} from '@/data/seedDemoData';

export interface VendorLockState {
  /** vendorId -> locked? */
  [vendorId: string]: boolean;
}
