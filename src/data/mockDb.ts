import { addDays, subDays, format, subMonths } from 'date-fns';

const STORAGE_KEY = 'gymos_mock_db';

// ─── Types ───
export interface MockDb {
  gym_settings: GymSettingsRow[];
  plans: PlanRow[];
  members: MemberRow[];
  payments: PaymentRow[];
  expenses: ExpenseRow[];
  leads: LeadRow[];
  website_content: WebsiteContentRow[];
  contact_settings: ContactSettingsRow[];
}

export interface GymSettingsRow {
  id: string; user_id: string; gym_name: string; logo_url: string | null;
  primary_color: string; secondary_color: string; accent_color: string; highlight_color: string;
  card_color?: string | null;
  heading_color?: string | null;
  description_color?: string | null;
  button_color?: string | null;
  created_at: string; updated_at: string;
}
export interface PlanRow {
  id: string; user_id: string; name: string; price: number; duration_days: number;
  category?: string; benefits?: string[]; is_highlighted?: boolean; show_on_homepage?: boolean; created_at: string;
}
export interface MemberRow {
  id: string; user_id: string; name: string; phone: string; plan_id: string | null;
  start_date: string; expiry_date: string; status: string; created_at: string;
}
export interface PaymentRow {
  id: string; user_id: string; member_id: string; amount: number; payment_date: string;
  method: string; status: string; note: string | null; created_at: string;
}
export interface ExpenseRow {
  id: string; user_id: string; title: string; amount: number; expense_date: string;
  category: string | null; created_at: string;
}
export interface LeadRow {
  id: string; user_id: string; name: string; phone: string; fitness_goal: string | null;
  status: string; created_at: string; updated_at: string;
}
export interface WebsiteContentRow {
  id: string; user_id: string; section_key: string; is_enabled: boolean;
  content: any; created_at: string; updated_at: string;
}
export interface ContactSettingsRow {
  id: string; user_id: string; gym_id: string | null;
  whatsapp_number: string | null; whatsapp_message: string | null; instagram_url: string | null;
  created_at: string; updated_at: string;
}

// ─── Helpers ───
let counter = 0;
export function genId(): string {
  counter++;
  return `mock-${Date.now()}-${counter}-${Math.random().toString(36).slice(2, 8)}`;
}

const DEMO_USER_ID = 'demo-user';

function emptyDb(): MockDb {
  return {
    gym_settings: [],
    plans: [],
    members: [],
    payments: [],
    expenses: [],
    leads: [],
    website_content: [],
    contact_settings: [],
  };
}

// ─── Persistence ───
export function loadDb(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      console.log('[mockDb] Loaded from localStorage:', {
        plans: parsed.plans?.length ?? 0,
        members: parsed.members?.length ?? 0,
        payments: parsed.payments?.length ?? 0,
        website_content: parsed.website_content?.length ?? 0,
      });
      return parsed;
    }
  } catch (e) {
    console.error('[mockDb] Failed to parse localStorage:', e);
  }
  console.log('[mockDb] No existing data in localStorage, starting empty');
  return emptyDb();
}

export function saveDb(db: MockDb) {
  const json = JSON.stringify(db);
  localStorage.setItem(STORAGE_KEY, json);
  console.log('[mockDb] Saved to localStorage:', {
    plans: db.plans?.length ?? 0,
    members: db.members?.length ?? 0,
    payments: db.payments?.length ?? 0,
    website_content: db.website_content?.length ?? 0,
  });
}

// ─── Seed Data ───
export function createSeedData(): MockDb {
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const nowIso = now.toISOString();

  // Plans
  const plans: PlanRow[] = [
  // ─── Monthly ───
  { id: genId(), user_id: DEMO_USER_ID, name: 'Basic Monthly', price: 999, duration_days: 30, category: 'Monthly', benefits: ['Gym access', 'Locker facility'], is_highlighted: false, created_at: nowIso },

  { id: genId(), user_id: DEMO_USER_ID, name: 'Standard Monthly', price: 1499, duration_days: 30, category: 'Monthly', benefits: ['Gym access', 'Trainer guidance', 'Diet tips'], is_highlighted: false, show_on_homepage: true, created_at: nowIso },

  { id: genId(), user_id: DEMO_USER_ID, name: 'Premium Monthly', price: 1999, duration_days: 30, category: 'Monthly', benefits: ['Personal trainer', 'Diet plan', 'Body analysis'], is_highlighted: true, show_on_homepage: true, created_at: nowIso },

  // ─── Quarterly ───
  { id: genId(), user_id: DEMO_USER_ID, name: 'Quarterly Basic', price: 2499, duration_days: 90, category: 'Quarterly', benefits: ['Gym access', 'Locker'], is_highlighted: false, created_at: nowIso },

  { id: genId(), user_id: DEMO_USER_ID, name: 'Quarterly Standard', price: 3499, duration_days: 90, category: 'Quarterly', benefits: ['Trainer support', 'Diet consultation'], is_highlighted: false, created_at: nowIso },

  { id: genId(), user_id: DEMO_USER_ID, name: 'Quarterly Premium', price: 4999, duration_days: 90, category: 'Quarterly', benefits: ['Personal trainer', 'Weekly tracking', 'Diet plan'], is_highlighted: true, show_on_homepage: true, created_at: nowIso },

  // ─── Half-Yearly ───
  { id: genId(), user_id: DEMO_USER_ID, name: 'Half-Year Basic', price: 4499, duration_days: 180, category: 'Half-Yearly', benefits: ['Gym access', 'Locker'], is_highlighted: false, created_at: nowIso },

  { id: genId(), user_id: DEMO_USER_ID, name: 'Half-Year Premium', price: 6999, duration_days: 180, category: 'Half-Yearly', benefits: ['Trainer', 'Diet plan', 'Monthly tracking'], is_highlighted: true, created_at: nowIso },

  // ─── Yearly ───
  { id: genId(), user_id: DEMO_USER_ID, name: 'Yearly Saver', price: 7999, duration_days: 365, category: 'Yearly', benefits: ['Unlimited gym access', 'Locker', 'Discounted renewal'], is_highlighted: false, created_at: nowIso },

  { id: genId(), user_id: DEMO_USER_ID, name: 'Yearly Premium', price: 11999, duration_days: 365, category: 'Yearly', benefits: ['Personal trainer', 'Diet plan', 'Body transformation program'], is_highlighted: true, created_at: nowIso },

  // ─── Special Segments ───
  { id: genId(), user_id: DEMO_USER_ID, name: 'Women Special Plan', price: 1299, duration_days: 30, category: 'Female', benefits: ['Women-only batch', 'Female trainer', 'Yoga + cardio'], is_highlighted: false, created_at: nowIso },

  { id: genId(), user_id: DEMO_USER_ID, name: 'Couple Plan Monthly', price: 2199, duration_days: 30, category: 'Couple', benefits: ['Access for 2 people', 'Discounted price', 'Shared trainer'], is_highlighted: true, created_at: nowIso },

  { id: genId(), user_id: DEMO_USER_ID, name: 'Student Plan', price: 799, duration_days: 30, category: 'Student', benefits: ['Gym access', 'Valid ID required'], is_highlighted: false, created_at: nowIso },
];

  const indianNames = [
    'Aarav Patel', 'Priya Sharma', 'Rohan Gupta', 'Ananya Singh', 'Vikram Reddy',
    'Sneha Iyer', 'Arjun Kumar', 'Meera Nair', 'Karthik Joshi', 'Divya Verma',
    'Rahul Mehta', 'Pooja Agarwal', 'Aditya Rao', 'Neha Kapoor', 'Siddharth Chauhan',
    'Riya Malhotra', 'Manish Tiwari', 'Kavita Das', 'Nikhil Bhat', 'Anita Saxena',
    'Deepak Soni', 'Swati Pandey', 'Amit Jha', 'Ishita Banerjee', 'Rajesh Yadav',
    'Tanvi Mishra', 'Suresh Kulkarni', 'Pallavi Deshmukh',
  ];

  const members: MemberRow[] = indianNames.map((name, i) => {
    const planIdx = i % 3;
    const plan = plans[planIdx];
    let startDate: Date;
    let expiryDate: Date;

    if (i < 15) {
      // Recent / active: spread joins across last 9 months for richer monthly/yearly trends
      const monthsBack = i % 9;
      const baseDate = subMonths(now, monthsBack);
      const dayOffset = Math.floor(Math.random() * 25);
      startDate = subDays(baseDate, dayOffset);
      expiryDate = addDays(startDate, plan.duration_days + Math.floor(Math.random() * 60));
    } else if (i < 20) {
      // Expiring soon
      startDate = subDays(now, plan.duration_days - 3);
      expiryDate = addDays(now, Math.floor(Math.random() * 6) + 1);
    } else {
      // Expired (churned)
      startDate = subDays(now, plan.duration_days + Math.floor(Math.random() * 30) + 10);
      expiryDate = subDays(now, Math.floor(Math.random() * 20) + 1);
    }

    return {
      id: genId(), user_id: DEMO_USER_ID, name, phone: `+91 ${9000000000 + i * 1111}`,
      plan_id: plan.id, start_date: format(startDate, 'yyyy-MM-dd'), expiry_date: format(expiryDate, 'yyyy-MM-dd'),
      status: expiryDate < now ? 'expired' : 'active', created_at: startDate.toISOString(),
    };
  });

  // Payments — current cycle for each member + history across last 11 months
  const statuses = ['paid', 'paid', 'paid', 'paid', 'pending', 'overdue'];
  const methods = ['cash', 'upi', 'card', 'bank_transfer'];
  const payments: PaymentRow[] = [];
  members.forEach((m, i) => {
    const plan = plans.find(p => p.id === m.plan_id)!;
    // Current cycle payment
    payments.push({
      id: genId(), user_id: DEMO_USER_ID, member_id: m.id, amount: plan.price,
      payment_date: m.start_date, method: methods[i % methods.length],
      status: statuses[i % statuses.length], note: null, created_at: m.created_at,
    });
  });

  // Historical paid renewals across the last 11 months for richer analytics
  for (let monthsBack = 1; monthsBack <= 11; monthsBack++) {
    const monthDate = subMonths(now, monthsBack);
    // 6-12 payments per past month, varying members
    const count = 6 + Math.floor(Math.random() * 7);
    for (let k = 0; k < count; k++) {
      const m = members[(monthsBack * 3 + k) % members.length];
      const plan = plans.find(p => p.id === m.plan_id)!;
      const day = 1 + Math.floor(Math.random() * 27);
      const pDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
      payments.push({
        id: genId(), user_id: DEMO_USER_ID, member_id: m.id, amount: plan.price,
        payment_date: format(pDate, 'yyyy-MM-dd'), method: methods[k % methods.length],
        status: 'paid', note: 'Historical renewal', created_at: pDate.toISOString(),
      });
    }
  }

  // Today payment so Today tab is non-empty
  if (members.length > 0) {
    const m0 = members[0];
    const plan0 = plans.find(p => p.id === m0.plan_id)!;
    payments.push({
      id: genId(), user_id: DEMO_USER_ID, member_id: m0.id, amount: plan0.price,
      payment_date: today, method: 'upi', status: 'paid',
      note: "Today's collection", created_at: nowIso,
    });
  }

  // Expenses — recurring monthly expenses across last 12 months + this-month items
  const recurringExpenses = [
    { title: 'Monthly Rent', amount: 45000, category: 'Rent' },
    { title: 'Electricity Bill', amount: 12000, category: 'Utilities' },
    { title: 'Staff Salary - Trainer 1', amount: 25000, category: 'Salary' },
    { title: 'Staff Salary - Trainer 2', amount: 22000, category: 'Salary' },
    { title: 'Staff Salary - Reception', amount: 15000, category: 'Salary' },
    { title: 'Water Supply', amount: 3000, category: 'Utilities' },
  ];
  const adhocExpenses = [
    { title: 'Equipment Maintenance', amount: 8000, category: 'Equipment' },
    { title: 'Protein Supplements Stock', amount: 15000, category: 'Inventory' },
    { title: 'Marketing - Social Media', amount: 5000, category: 'Marketing' },
    { title: 'New Dumbbells Set', amount: 18000, category: 'Equipment' },
  ];
  const expenses: ExpenseRow[] = [];
  for (let monthsBack = 0; monthsBack <= 11; monthsBack++) {
    const monthDate = subMonths(now, monthsBack);
    recurringExpenses.forEach((e, idx) => {
      const day = Math.min(1 + idx * 4, 27);
      const eDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
      // Skip future dates if monthsBack === 0 and day > today
      if (eDate > now) return;
      expenses.push({
        id: genId(), user_id: DEMO_USER_ID, title: e.title, amount: e.amount,
        expense_date: format(eDate, 'yyyy-MM-dd'), category: e.category,
        created_at: eDate.toISOString(),
      });
    });
  }
  // Recent ad-hoc expenses (this month)
  adhocExpenses.forEach((e, i) => {
    const eDate = subDays(now, i * 3 + 1);
    expenses.push({
      id: genId(), user_id: DEMO_USER_ID, title: e.title, amount: e.amount,
      expense_date: format(eDate, 'yyyy-MM-dd'), category: e.category,
      created_at: eDate.toISOString(),
    });
  });

  // Leads
  const leadData = [
    { name: 'Akash Malhotra', phone: '+91 9876543210', goal: 'Weight Loss', status: 'new' },
    { name: 'Ritika Oberoi', phone: '+91 9876543211', goal: 'Muscle Gain', status: 'new' },
    { name: 'Varun Dhawan', phone: '+91 9876543212', goal: 'General Fitness', status: 'new' },
    { name: 'Simran Kaur', phone: '+91 9876543213', goal: 'Weight Loss', status: 'contacted' },
    { name: 'Kunal Thakur', phone: '+91 9876543214', goal: 'Strength Training', status: 'contacted' },
    { name: 'Megha Gupta', phone: '+91 9876543215', goal: 'Yoga', status: 'contacted' },
    { name: 'Harsh Vardhan', phone: '+91 9876543216', goal: 'Muscle Gain', status: 'visit_scheduled' },
    { name: 'Nisha Agarwal', phone: '+91 9876543217', goal: 'General Fitness', status: 'visit_scheduled' },
    { name: 'Pranav Desai', phone: '+91 9876543218', goal: 'Weight Loss', status: 'visit_scheduled' },
    { name: 'Shruti Rao', phone: '+91 9876543219', goal: 'Strength Training', status: 'joined' },
    { name: 'Yash Mittal', phone: '+91 9876543220', goal: 'Muscle Gain', status: 'joined' },
    { name: 'Tanya Chandra', phone: '+91 9876543221', goal: 'General Fitness', status: 'joined' },
    { name: 'Manav Singhania', phone: '+91 9876543222', goal: 'Weight Loss', status: 'joined' },
    { name: 'Komal Bhatt', phone: '+91 9876543223', goal: 'Yoga', status: 'lost' },
    { name: 'Rohit Choudhary', phone: '+91 9876543224', goal: 'Muscle Gain', status: 'lost' },
    { name: 'Aditi Sharma', phone: '+91 9876543225', goal: 'General Fitness', status: 'new' },
    { name: 'Gaurav Saxena', phone: '+91 9876543226', goal: 'Strength Training', status: 'new' },
    { name: 'Bhavna Puri', phone: '+91 9876543227', goal: 'Weight Loss', status: 'contacted' },
  ];
  const leads: LeadRow[] = leadData.map((l, i) => ({
    id: genId(), user_id: DEMO_USER_ID, name: l.name, phone: l.phone,
    fitness_goal: l.goal, status: l.status,
    created_at: subDays(now, Math.floor(Math.random() * 30)).toISOString(),
    updated_at: nowIso,
  }));

  // Website content
  const website_content: WebsiteContentRow[] = [
    {
      id: genId(), user_id: DEMO_USER_ID, section_key: 'hero', is_enabled: true,
      content: {
        title: 'Transform Your Body. Build Your Discipline.',
        subtitle: 'World-class equipment, expert trainers, and a community that pushes you beyond limits.',
        image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80',
        video_url: '',
        cta_text: 'Start Free Trial',
      },
      created_at: nowIso, updated_at: nowIso,
    },
    {
      id: genId(), user_id: DEMO_USER_ID, section_key: 'pricing', is_enabled: true,
      content: {
        title: 'Choose Your Plan',
        subtitle: 'Flexible plans designed to fit your fitness journey.',
        cta_note: '⚡ Limited slots — Join now',
      },
      created_at: nowIso, updated_at: nowIso,
    },
    {
      id: genId(), user_id: DEMO_USER_ID, section_key: 'trainers', is_enabled: true,
      content: {
        title: 'Meet Our Trainers',
        subtitle: 'Certified professionals dedicated to your transformation.',
        items: [
          { name: 'Raj Fitness', specialization: 'Strength & Conditioning', image_url: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=600&q=80', show_on_homepage: true },
          { name: 'Priya Wellness', specialization: 'Yoga & Flexibility', image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80', show_on_homepage: true },
          { name: 'Vikram Power', specialization: 'CrossFit & HIIT', image_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80', show_on_homepage: true },
          { name: 'Meera Cardio', specialization: 'Zumba & Dance Fitness', image_url: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=600&q=80', show_on_homepage: true },
          { name: 'Arjun Kumar', specialization: 'Boxing & MMA', image_url: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600&q=80', show_on_homepage: true },
          { name: 'Sneha Iyer', specialization: 'Pilates & Core Training', image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&q=80', show_on_homepage: true },
          { name: 'Karthik Joshi', specialization: 'Functional Training', image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80' },
          { name: 'Divya Verma', specialization: 'Weight Loss Specialist', image_url: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=600&q=80' },
          { name: 'Rahul Mehta', specialization: 'Sports Performance', image_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80' },
          { name: 'Anita Saxena', specialization: 'Senior Fitness Coach', image_url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80' },
        ],
      },
      created_at: nowIso, updated_at: nowIso,
    },
    {
      id: genId(), user_id: DEMO_USER_ID, section_key: 'testimonials', is_enabled: true,
      content: {
        title: 'What Our Members Say',
        subtitle: 'Real results from real people.',
        items: [
          { name: 'Ankit Verma', content: 'Lost 15kg in 4 months! The trainers are amazing and the environment keeps you motivated.' },
          { name: 'Rashmi Iyer', content: 'Best gym experience ever. The equipment is top-notch and the community is so supportive.' },
          { name: 'Deepak Nair', content: "I've been a member for 2 years. The consistency and dedication of the trainers is unmatched." },
          { name: 'Sunita Joshi', content: 'The yoga sessions transformed my health completely. Highly recommend to everyone!' },
          { name: 'Manish Tiwari', content: 'Gained 8kg of lean muscle in 6 months — coaches really know their stuff.' },
          { name: 'Kavita Das', content: 'Friendly community, clean facility, and amazing personal trainers. Worth every rupee.' },
          { name: 'Nikhil Bhat', content: 'The HIIT sessions are next level. Pushed my limits and saw real results in 3 months.' },
          { name: 'Anita Saxena', content: 'As a senior, I felt welcomed and trained safely. My mobility has improved drastically.' },
          { name: 'Riya Malhotra', content: 'Women-only batches are a game-changer. Comfortable, supportive, and effective.' },
          { name: 'Suresh Kulkarni', content: 'Best investment I made for my health. Lost 12kg and gained confidence.' },
          { name: 'Karan Singh', content: 'Great transformation journey!', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
          { name: 'Pooja Fitness', content: 'My 6-month transformation story', video_url: 'https://www.youtube.com/watch?v=ScMzIvxBSi4' },
        ],
      },
      created_at: nowIso, updated_at: nowIso,
    },
    {
      id: genId(), user_id: DEMO_USER_ID, section_key: 'gallery', is_enabled: true,
      content: {
        title: 'Gallery',
        items: [
          { url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80', type: 'image', caption: 'Training Area' },
          { url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80', type: 'image', caption: 'Weight Section' },
          { url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&q=80', type: 'image', caption: 'Cardio Zone' },
          { url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80', type: 'image', caption: 'Group Classes' },
          { url: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=600&q=80', type: 'image', caption: 'Personal Training' },
          { url: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=600&q=80', type: 'image', caption: 'Yoga Studio' },
          { url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80', type: 'image', caption: 'Free Weights' },
          { url: 'https://images.unsplash.com/photo-1570829460005-c840387bb1ca?w=600&q=80', type: 'image', caption: 'Cycling Area' },
          { url: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=600&q=80', type: 'image', caption: 'Boxing Ring' },
          { url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&q=80', type: 'image', caption: 'Stretching Zone' },
          { url: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&q=80', type: 'image', caption: 'Locker Room' },
          { url: 'https://images.unsplash.com/photo-1507398941214-572c25f4b1dc?w=600&q=80', type: 'image', caption: 'Reception' },
        ],
      },
      created_at: nowIso, updated_at: nowIso,
    },
    {
      id: genId(), user_id: DEMO_USER_ID, section_key: 'services', is_enabled: true,
      content: {
        title: 'Our Services',
        subtitle: 'Explore our range of fitness programs.',
        items: [
          { title: 'Weight Training', description: 'Build muscle and strength with guided weight training programs.', icon: '🏋️', image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80', show_on_homepage: true },
          { title: 'Cardio Training', description: 'Burn calories and improve cardiovascular health with expert-led cardio sessions.', icon: '🫀', image_url: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=600&q=80', show_on_homepage: true },
          { title: 'Personal Training', description: 'One-on-one sessions tailored to your specific fitness goals.', icon: '💪', image_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80', show_on_homepage: true },
          { title: 'Yoga Classes', description: 'Find inner peace and flexibility with our expert yoga instructors.', icon: '🧘', image_url: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=600&q=80', show_on_homepage: true },
          { title: 'Zumba Sessions', description: 'Dance your way to fitness with high-energy Zumba classes.', icon: '💃', image_url: 'https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?w=600&q=80', show_on_homepage: true },
          { title: 'CrossFit', description: 'High-intensity functional training for maximum results.', icon: '🔥', image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80', show_on_homepage: true },
          { title: 'HIIT Training', description: 'Short bursts of intense exercise for rapid fat loss and endurance.', icon: '⚡', image_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80' },
          { title: 'Strength Conditioning', description: 'Progressive overload programs for building raw power and athleticism.', icon: '💎', image_url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&q=80' },
          { title: 'Functional Training', description: 'Real-world movement patterns to improve daily life performance.', icon: '🎯', image_url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80' },
          { title: 'Fat Loss Program', description: 'Structured plans combining cardio, diet, and strength for fat loss.', icon: '🔥', image_url: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=600&q=80' },
          { title: 'Kick Boxing', description: 'High-energy kickboxing classes to build strength and endurance.', icon: '🥊', image_url: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600&q=80' },
          { title: 'Nutrition Coaching', description: 'Personalized diet plans to complement your workout routine.', icon: '🥗', image_url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80' },
        ],
      },
      created_at: nowIso, updated_at: nowIso,
    },
    {
      id: genId(), user_id: DEMO_USER_ID, section_key: 'equipment', is_enabled: true,
      content: {
        title: 'World-Class Equipment',
        subtitle: 'Train with the best machines and gear.',
        items: [
          { name: 'Commercial Treadmills', description: 'Life Fitness treadmills with heart-rate monitoring.', image_url: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=600&q=80', show_on_homepage: true },
          { name: 'Olympic Squat Racks', description: 'Heavy-duty power racks for serious lifters.', image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80', show_on_homepage: true },
          { name: 'Hammer Strength Machines', description: 'Plate-loaded machines for targeted muscle work.', image_url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&q=80', show_on_homepage: true },
          { name: 'Cable Crossover Station', description: 'Multi-functional cable system for full-body workouts.', image_url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80', show_on_homepage: true },
          { name: 'Bench Press Stations', description: 'Flat, incline, and decline benches for chest day.', image_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80', show_on_homepage: true },
          { name: 'Dumbbells (5–50kg)', description: 'Full range of rubber-coated hex dumbbells.', image_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80', show_on_homepage: true },
          { name: 'Smith Machine', description: 'Guided barbell system for safe heavy lifting.', image_url: 'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?w=600&q=80' },
          { name: 'Leg Press Machine', description: 'Heavy-duty 45° plate-loaded leg press.', image_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&q=80' },
          { name: 'Lat Pulldown', description: 'Selectorized lat pulldown for back development.', image_url: 'https://images.unsplash.com/photo-1581122584612-713f89daa8eb?w=600&q=80' },
          { name: 'Kettlebells Set', description: 'Cast-iron kettlebells from 4kg to 32kg.', image_url: 'https://images.unsplash.com/photo-1517438476312-10d79c5f72bd?w=600&q=80' },
          { name: 'Rowing Machines', description: 'Concept2 rowers for total-body cardio.', image_url: 'https://images.unsplash.com/photo-1591741535018-d042766c62eb?w=600&q=80' },
          { name: 'Elliptical Trainers', description: 'Low-impact ellipticals for joint-friendly cardio.', image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80' },
        ],
      },
      created_at: nowIso, updated_at: nowIso,
    },
    {
      id: genId(), user_id: DEMO_USER_ID, section_key: 'reviews', is_enabled: true,
      content: {
        title: 'Google Reviews',
        subtitle: 'See what our members say about us.',
        items: [
          { name: 'Amit Sharma', rating: 5, text: 'Absolutely the best gym in town! Clean, well-maintained, and amazing trainers.' },
          { name: 'Neeta Patel', rating: 5, text: "I've tried many gyms but this one stands out. The atmosphere is motivating!" },
          { name: 'Sanjay Kumar', rating: 4, text: 'Great equipment and friendly staff. Slightly crowded during peak hours.' },
          { name: 'Renu Aggarwal', rating: 5, text: 'The personal training sessions are worth every penny. Highly recommend!' },
          { name: 'Vikash Jain', rating: 4, text: 'Good gym with modern equipment. The yoga classes are excellent.' },
          { name: 'Pooja Singh', rating: 5, text: 'Lost 10kg in 4 months. Trainers are super supportive and knowledgeable.' },
          { name: 'Rohit Khanna', rating: 5, text: 'State-of-the-art facility. CrossFit classes are intense and fun!' },
          { name: 'Shalini Rao', rating: 5, text: 'Women-only batches and female trainers — exactly what I was looking for.' },
          { name: 'Manoj Bhatia', rating: 4, text: 'Great value for money. Clean changing rooms and good cardio section.' },
          { name: 'Divya Krishnan', rating: 5, text: 'Joined 6 months ago, never looked back. Best decision for my health!' },
          { name: 'Arvind Pillai', rating: 5, text: 'Trainers actually care about your goals. Got a personalised diet plan too.' },
          { name: 'Sunita Roy', rating: 4, text: 'Excellent yoga instructor. Peaceful environment and well-equipped studio.' },
        ],
      },
      created_at: nowIso, updated_at: nowIso,
    },
    {
  id: genId(), user_id: DEMO_USER_ID, section_key: 'branches', is_enabled: true,
  content: {
    title: 'Our Branches',
    subtitle: 'Find a location near you.',
    items: [
      { name: 'Elite Fitness - Koramangala', location: '4th Block, Koramangala, Bangalore - 560034', contact: '+91 80 4567 8901', image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80', show_on_homepage: true },
      { name: 'Elite Fitness - HSR Layout', location: 'Sector 2, HSR Layout, Bangalore - 560102', contact: '+91 80 4567 8902', image_url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80', show_on_homepage: true },
      { name: 'Elite Fitness - Indiranagar', location: '100 Feet Road, Indiranagar, Bangalore - 560038', contact: '+91 80 4567 8903', image_url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&q=80', show_on_homepage: true },
      { name: 'Elite Fitness - Whitefield', location: 'ITPL Road, Whitefield, Bangalore - 560066', contact: '+91 80 4567 8904', image_url: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=600&q=80', show_on_homepage: true },
      { name: 'Elite Fitness - BTM Layout', location: 'BTM 2nd Stage, Bangalore - 560076', contact: '+91 80 4567 8905', image_url: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=600&q=80', show_on_homepage: true },
      { name: 'Elite Fitness - Electronic City', location: 'Phase 1, Electronic City, Bangalore - 560100', contact: '+91 80 4567 8906', image_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80', show_on_homepage: true },
      { name: 'Elite Fitness - Yelahanka', location: 'Yelahanka New Town, Bangalore - 560064', contact: '+91 80 4567 8907', image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&q=80' },
      { name: 'Elite Fitness - Jayanagar', location: '9th Block, Jayanagar, Bangalore - 560041', contact: '+91 80 4567 8908', image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80' },
      { name: 'Elite Fitness - Hebbal', location: 'Hebbal Ring Road, Bangalore - 560024', contact: '+91 80 4567 8909', image_url: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=600&q=80' },
      { name: 'Elite Fitness - Marathahalli', location: 'Outer Ring Road, Marathahalli, Bangalore - 560037', contact: '+91 80 4567 8910', image_url: 'https://images.unsplash.com/photo-1570829460005-c840387bb1ca?w=600&q=80' },
      { name: 'Elite Fitness - JP Nagar', location: '6th Phase, JP Nagar, Bangalore - 560078', contact: '+91 80 4567 8911', image_url: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&q=80' },
      { name: 'Elite Fitness - MG Road', location: 'MG Road, Near Trinity Circle, Bangalore - 560001', contact: '+91 80 4567 8912', image_url: 'https://images.unsplash.com/photo-1507398941214-572c25f4b1dc?w=600&q=80' },
    ],
  },
  created_at: nowIso,
  updated_at: nowIso,
},
    {
      id: genId(), user_id: DEMO_USER_ID, section_key: 'stats', is_enabled: true,
      content: {
        items: [
          { icon_url: '', value: '500+', label: 'Happy Members' },
          { icon_url: '', value: '200+', label: 'Transformations' },
          { icon_url: '', value: '5+', label: 'Years Experience' },
          { icon_url: '', value: '4.8', label: 'Google Rating' },
        ],
      },
      created_at: nowIso, updated_at: nowIso,
    },
    {
  id: genId(), user_id: DEMO_USER_ID, section_key: 'achievements', is_enabled: true,
  content: {
    title: 'Achievements & Certifications',
    subtitle: 'Our credentials speak for themselves.',
    items: [
      { title: 'Certified Trainer Hub', image_url: 'https://i.pinimg.com/1200x/00/9e/87/009e87ee137f6b5d4c3cc604d689652d.jpg', description: 'All trainers hold internationally recognized certifications.' },
      { title: 'Best Gym Award 2023', image_url: 'https://i.pinimg.com/1200x/00/9e/87/009e87ee137f6b5d4c3cc604d689652d.jpg', description: 'Awarded best fitness center in the city.' },
      { title: '1000+ Transformations', image_url: 'https://i.pinimg.com/1200x/00/9e/87/009e87ee137f6b5d4c3cc604d689652d.jpg', description: 'Over a thousand successful member transformations.' },
      { title: 'ISO Certified Facility', image_url: 'https://i.pinimg.com/1200x/00/9e/87/009e87ee137f6b5d4c3cc604d689652d.jpg', description: 'Maintaining international quality standards.' },
      { title: 'Top Fitness Startup', image_url: 'https://i.pinimg.com/1200x/00/9e/87/009e87ee137f6b5d4c3cc604d689652d.jpg', description: 'Recognized among top emerging fitness brands.' },
      { title: 'CrossFit Affiliated', image_url: 'https://i.pinimg.com/1200x/00/9e/87/009e87ee137f6b5d4c3cc604d689652d.jpg', description: 'Official CrossFit training partner.' },
      { title: 'Nutrition Excellence Award', image_url: 'https://i.pinimg.com/1200x/00/9e/87/009e87ee137f6b5d4c3cc604d689652d.jpg', description: 'Awarded for best diet planning services.' },
      { title: 'Women Fitness Champion Center', image_url: 'https://i.pinimg.com/1200x/00/9e/87/009e87ee137f6b5d4c3cc604d689652d.jpg', description: 'Top-rated gym for women fitness programs.' },
      { title: 'Corporate Wellness Partner', image_url: 'https://i.pinimg.com/1200x/00/9e/87/009e87ee137f6b5d4c3cc604d689652d.jpg', description: 'Trusted by leading companies for employee fitness.' },
      { title: '5-Star Google Rated Gym', image_url: 'https://i.pinimg.com/1200x/00/9e/87/009e87ee137f6b5d4c3cc604d689652d.jpg', description: 'Consistently rated highly by members.' },
    ],
  },
  created_at: nowIso,
  updated_at: nowIso,
},
    {
  id: genId(), user_id: DEMO_USER_ID, section_key: 'supplements', is_enabled: true,
  content: {
    title: 'Recommended Supplements',
    subtitle: 'Fuel your gains with our top picks.',
    items: [
      { title: 'Whey Protein', description: 'High-quality whey for muscle recovery.', image_url: 'https://i.pinimg.com/1200x/45/b1/4a/45b14a58c1aa48c2746085c978d489f4.jpg', external_link: '#' },
      { title: 'Mass Gainer', description: 'Calorie-dense formula for lean mass.', image_url: 'https://i.pinimg.com/1200x/45/b1/4a/45b14a58c1aa48c2746085c978d489f4.jpg', external_link: '#' },
      { title: 'Creatine Monohydrate', description: 'Boost strength and power output.', image_url: 'https://i.pinimg.com/1200x/45/b1/4a/45b14a58c1aa48c2746085c978d489f4.jpg', external_link: '#' },
      { title: 'BCAA Powder', description: 'Supports muscle recovery and endurance.', image_url: 'https://i.pinimg.com/1200x/45/b1/4a/45b14a58c1aa48c2746085c978d489f4.jpg', external_link: '#' },
      { title: 'Pre-Workout Booster', description: 'Increase energy and workout performance.', image_url: 'https://i.pinimg.com/1200x/45/b1/4a/45b14a58c1aa48c2746085c978d489f4.jpg', external_link: '#' },
      { title: 'Multivitamin Tablets', description: 'Daily essential nutrients for overall health.', image_url: 'https://i.pinimg.com/1200x/45/b1/4a/45b14a58c1aa48c2746085c978d489f4.jpg', external_link: '#' },
      { title: 'Fish Oil Capsules', description: 'Supports heart and joint health.', image_url: 'https://i.pinimg.com/1200x/45/b1/4a/45b14a58c1aa48c2746085c978d489f4.jpg', external_link: '#' },
      { title: 'Protein Bars', description: 'Healthy snack with high protein content.', image_url: 'https://i.pinimg.com/1200x/45/b1/4a/45b14a58c1aa48c2746085c978d489f4.jpg', external_link: '#' },
      { title: 'Glutamine Powder', description: 'Enhances recovery and muscle repair.', image_url: 'https://i.pinimg.com/1200x/45/b1/4a/45b14a58c1aa48c2746085c978d489f4.jpg', external_link: '#' },
      { title: 'Fat Burner Capsules', description: 'Helps accelerate fat loss naturally.', image_url: 'https://i.pinimg.com/1200x/45/b1/4a/45b14a58c1aa48c2746085c978d489f4.jpg', external_link: '#' },
    ],
  },
  created_at: nowIso,
  updated_at: nowIso,
},
    {
      id: genId(), user_id: DEMO_USER_ID, section_key: 'products', is_enabled: true,
      content: {
        title: 'Shop Fitness Essentials',
        subtitle: 'Premium supplements & gear, hand-picked by our coaches.',
        cta_text: 'Explore Products',
        coupon_highlight: 'Use code GYM10 for 10% off',
        banner_images: [
          'https://images.unsplash.com/photo-1583500178690-f7fd39c8a4f5?w=1600&q=80',
          'https://images.unsplash.com/photo-1579722821273-0f6c1b5d0b2a?w=1600&q=80',
          'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=1600&q=80',
        ],
        items: [
          { title: 'Whey Protein Isolate', description: '24g protein per scoop · 2.5kg pack', image_url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600&q=80', buy_link: 'https://example.com/whey', coupon_code: 'GYM10' },
          { title: 'Mass Gainer Pro', description: 'Lean bulk formula · 5kg pack', image_url: 'https://images.unsplash.com/photo-1579722820308-d74e571900a9?w=600&q=80', buy_link: 'https://example.com/mass', coupon_code: 'GYM10' },
          { title: 'Creatine Monohydrate', description: 'Micronised · 300g pack', image_url: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=600&q=80', buy_link: 'https://example.com/creatine', coupon_code: 'GYM10' },
          { title: 'Pre-Workout Energy', description: 'Citrulline + Beta-Alanine · 30 servings', image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80', buy_link: 'https://example.com/pre', coupon_code: 'GYM10' },
          { title: 'BCAA Recovery Powder', description: '2:1:1 ratio · 400g pack', image_url: 'https://images.unsplash.com/photo-1612531385446-f7e6d131e1d0?w=600&q=80', buy_link: 'https://example.com/bcaa', coupon_code: 'GYM10' },
          { title: 'High-Protein Bars', description: '20g protein · Box of 12', image_url: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=600&q=80', buy_link: 'https://example.com/bars', coupon_code: 'GYM10' },
          { title: 'Daily Multivitamin', description: 'Essential micronutrients · 60 tablets', image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80', buy_link: 'https://example.com/multi', coupon_code: 'GYM10' },
          { title: 'Omega-3 Fish Oil', description: 'High-EPA · 90 softgels', image_url: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80', buy_link: 'https://example.com/omega', coupon_code: 'GYM10' },
          { title: 'Thermogenic Fat Burner', description: 'Caffeine + L-Carnitine · 60 caps', image_url: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80', buy_link: 'https://example.com/burner', coupon_code: 'GYM10' },
          { title: 'Resistance Bands Set', description: '5 bands + door anchor + handles', image_url: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600&q=80', buy_link: 'https://example.com/bands', coupon_code: 'GYM10' },
          { title: 'Lifting Belt (Leather)', description: '4-inch genuine leather · sizes S–XL', image_url: 'https://images.unsplash.com/photo-1517438476312-10d79c5f72bd?w=600&q=80', buy_link: 'https://example.com/belt', coupon_code: 'GYM10' },
          { title: 'Shaker Bottle 700ml', description: 'BPA-free · leak-proof · stainless mixer', image_url: 'https://images.unsplash.com/photo-1610725664285-7c57e6eeac3f?w=600&q=80', buy_link: 'https://example.com/shaker', coupon_code: 'GYM10' },
        ],
      },
      created_at: nowIso, updated_at: nowIso,
    },
    {
      id: genId(), user_id: DEMO_USER_ID, section_key: 'footer_social', is_enabled: true,
      content: {
        instagram_url: 'https://instagram.com/elitefitness',
        whatsapp_url: 'https://wa.me/919876543210',
        facebook_url: 'https://facebook.com/elitefitness',
        youtube_url: 'www.youtube.com/@thebhavyabhajan',
        instagram_enabled: true,
        whatsapp_enabled: true,
        facebook_enabled: true,
        youtube_enabled: true,
      },
      created_at: nowIso, updated_at: nowIso,
    },
    {
      id: genId(), user_id: DEMO_USER_ID, section_key: 'navbar', is_enabled: true,
      content: {
        logo_url: '',
        brand_name: '',
        cta_text: 'Join Now',
        cta_link: 'lead-form',
        show_dashboard_link: true,
      },
      created_at: nowIso, updated_at: nowIso,
    },
    {
      id: genId(), user_id: DEMO_USER_ID, section_key: 'loader', is_enabled: true,
      content: {
        enabled: true,
        text: '',
        icon_url: '',
        duration: 3,
      },
      created_at: nowIso, updated_at: nowIso,
    },
    {
      id: genId(), user_id: DEMO_USER_ID, section_key: 'orbit', is_enabled: true,
      content: {
        person_url: '',
        icons: [
          { url: '', label: 'Strength Training' },
          { url: '', label: 'Meditation' },
          { url: '', label: 'Dance Fitness' },
          { url: '', label: 'Nutrition' },
          { url: '', label: 'Cardio Health' },
        ],
      },
      created_at: nowIso, updated_at: nowIso,
    },
  ];

  // Gym settings
  const gym_settings: GymSettingsRow[] = [{
    id: genId(), user_id: DEMO_USER_ID, gym_name: 'Elite Fitness Club',
    logo_url: null, primary_color: '222 47% 11%', secondary_color: '220 26% 14%',
    accent_color: '142 71% 45%', highlight_color: '142 80% 55%',
    created_at: nowIso, updated_at: nowIso,
  }];

  // Contact settings
  const contact_settings: ContactSettingsRow[] = [{
    id: genId(), user_id: DEMO_USER_ID, gym_id: null,
    whatsapp_number: '919876543210',
    whatsapp_message: 'Hi! I\'m interested in joining Elite Fitness Club. Please share more details.',
    instagram_url: 'https://instagram.com/elitefitness',
    created_at: nowIso, updated_at: nowIso,
  }];

  // ─────────────────────────────────────────────────────────────
  // RICH CURRENT-MONTH + PREVIOUS-MONTH DATASET
  // Hand-tuned data (NOT randomized) for reliable monthly comparison.
  // ─────────────────────────────────────────────────────────────
  const todayDay = now.getDate();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth(); // 0-indexed
  const prevMonthDate = new Date(curYear, curMonth - 1, 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonth = prevMonthDate.getMonth();
  const daysInPrevMonth = new Date(curYear, curMonth, 0).getDate();

  const ymd = (y: number, m: number, d: number) => format(new Date(y, m, d), 'yyyy-MM-dd');
  const iso = (y: number, m: number, d: number, h = 10) => new Date(y, m, d, h, 0, 0).toISOString();
  const clampCurDay = (d: number) => Math.min(Math.max(1, d), todayDay);

  // Pick plan ids by category for realistic linkage
  const planByName = (n: string) => plans.find(p => p.name === n) ?? plans[0];
  const pBasicM = planByName('Basic Monthly');
  const pStdM = planByName('Standard Monthly');
  const pPremM = planByName('Premium Monthly');
  const pQtrStd = planByName('Quarterly Standard');
  const pQtrPrem = planByName('Quarterly Premium');
  const pHalfPrem = planByName('Half-Year Premium');
  const pYearSaver = planByName('Yearly Saver');
  const pWomen = planByName('Women Special Plan');
  const pStudent = planByName('Student Plan');
  const pCouple = planByName('Couple Plan Monthly');

  // ─── Previous-month members (joined last month) ───
  const prevMonthMembersSeed: Array<{ name: string; phone: string; plan: PlanRow; day: number }> = [
    { name: 'Aakash Bhardwaj',   phone: '+91 9810000101', plan: pBasicM,   day: 2 },
    { name: 'Sanya Khurana',     phone: '+91 9810000102', plan: pStdM,     day: 4 },
    { name: 'Devansh Bose',      phone: '+91 9810000103', plan: pPremM,    day: 6 },
    { name: 'Mitali Kapoor',     phone: '+91 9810000104', plan: pQtrStd,   day: 8 },
    { name: 'Yuvraj Salunkhe',   phone: '+91 9810000105', plan: pBasicM,   day: 10 },
    { name: 'Trisha Menon',      phone: '+91 9810000106', plan: pWomen,    day: 12 },
    { name: 'Parth Goyal',       phone: '+91 9810000107', plan: pStdM,     day: 14 },
    { name: 'Ira Chatterjee',    phone: '+91 9810000108', plan: pPremM,    day: 16 },
    { name: 'Hemant Solanki',    phone: '+91 9810000109', plan: pQtrPrem,  day: 18 },
    { name: 'Ridhima Sethi',     phone: '+91 9810000110', plan: pBasicM,   day: 20 },
    { name: 'Vivaan Trivedi',    phone: '+91 9810000111', plan: pStudent,  day: 22 },
    { name: 'Nandini Pillai',    phone: '+91 9810000112', plan: pStdM,     day: 24 },
    { name: 'Omkar Bhandari',    phone: '+91 9810000113', plan: pHalfPrem, day: 26 },
    { name: 'Saanvi Aggarwal',   phone: '+91 9810000114', plan: pCouple,   day: 28 },
  ];

  const prevMonthMembers: MemberRow[] = prevMonthMembersSeed.map(s => {
    const day = Math.min(s.day, daysInPrevMonth);
    const startDate = new Date(prevYear, prevMonth, day);
    const expiry = addDays(startDate, s.plan.duration_days);
    return {
      id: genId(),
      user_id: DEMO_USER_ID,
      name: s.name,
      phone: s.phone,
      plan_id: s.plan.id,
      start_date: format(startDate, 'yyyy-MM-dd'),
      expiry_date: format(expiry, 'yyyy-MM-dd'),
      status: expiry < now ? 'expired' : 'active',
      created_at: startDate.toISOString(),
    };
  });

  // ─── Current-month members (joined this month, up to today) ───
  const curMonthMembersSeed: Array<{ name: string; phone: string; plan: PlanRow; day: number }> = [
    { name: 'Atharv Bansal',     phone: '+91 9820000201', plan: pBasicM,   day: 1 },
    { name: 'Avni Lakhani',      phone: '+91 9820000202', plan: pStdM,     day: 2 },
    { name: 'Krish Madan',       phone: '+91 9820000203', plan: pPremM,    day: 3 },
    { name: 'Zara Sheikh',       phone: '+91 9820000204', plan: pWomen,    day: 4 },
    { name: 'Rudra Ahuja',       phone: '+91 9820000205', plan: pQtrStd,   day: 5 },
    { name: 'Mahira Sood',       phone: '+91 9820000206', plan: pStdM,     day: 6 },
    { name: 'Veer Chhabra',      phone: '+91 9820000207', plan: pPremM,    day: 7 },
    { name: 'Anvi Talwar',       phone: '+91 9820000208', plan: pBasicM,   day: 8 },
    { name: 'Reyansh Kohli',     phone: '+91 9820000209', plan: pYearSaver,day: 10 },
    { name: 'Myra Hegde',        phone: '+91 9820000210', plan: pStdM,     day: 12 },
    { name: 'Aryan Lamba',       phone: '+91 9820000211', plan: pStudent,  day: 14 },
    { name: 'Saisha Borkar',     phone: '+91 9820000212', plan: pPremM,    day: 16 },
    { name: 'Ishaan Patil',      phone: '+91 9820000213', plan: pCouple,   day: 18 },
    { name: 'Aadhya Kashyap',    phone: '+91 9820000214', plan: pStdM,     day: 20 },
    { name: 'Kabir Rastogi',     phone: '+91 9820000215', plan: pQtrPrem,  day: 22 },
    { name: 'Pari Walia',        phone: '+91 9820000216', plan: pBasicM,   day: 24 },
  ];

  const curMonthMembers: MemberRow[] = curMonthMembersSeed
    .filter(s => s.day <= todayDay)
    .map(s => {
      const day = clampCurDay(s.day);
      const startDate = new Date(curYear, curMonth, day);
      const expiry = addDays(startDate, s.plan.duration_days);
      return {
        id: genId(),
        user_id: DEMO_USER_ID,
        name: s.name,
        phone: s.phone,
        plan_id: s.plan.id,
        start_date: format(startDate, 'yyyy-MM-dd'),
        expiry_date: format(expiry, 'yyyy-MM-dd'),
        status: expiry < now ? 'expired' : 'active',
        created_at: startDate.toISOString(),
      };
    });

  // Append to main members
  members.push(...prevMonthMembers, ...curMonthMembers);

  // ─── Previous-month payments ───
  // Most paid, a few overdue (kept unpaid into current month)
  const prevPaymentMethods = ['cash', 'upi', 'card', 'bank_transfer'];
  const prevMonthPayments: PaymentRow[] = prevMonthMembers.map((m, i) => {
    const plan = plans.find(p => p.id === m.plan_id)!;
    const day = Math.min(parseInt(m.start_date.slice(8, 10), 10), daysInPrevMonth);
    // Mark last 3 prev-month members as overdue (unpaid carry-over)
    const isOverdue = i >= prevMonthMembers.length - 3;
    return {
      id: genId(),
      user_id: DEMO_USER_ID,
      member_id: m.id,
      amount: plan.price,
      payment_date: ymd(prevYear, prevMonth, day),
      method: prevPaymentMethods[i % prevPaymentMethods.length],
      status: isOverdue ? 'overdue' : 'paid',
      note: isOverdue ? 'Unpaid from last month' : 'Joining payment',
      created_at: iso(prevYear, prevMonth, day, 11),
    };
  });

  // A few extra prev-month one-off paid renewals to boost revenue
  const prevExtraRenewals = [
    { plan: pStdM,    day: 5 },
    { plan: pPremM,   day: 9 },
    { plan: pQtrStd,  day: 13 },
    { plan: pBasicM,  day: 17 },
    { plan: pStdM,    day: 21 },
    { plan: pPremM,   day: 25 },
    { plan: pHalfPrem,day: 27 },
  ];
  prevExtraRenewals.forEach((e, idx) => {
    const target = members[(idx * 5) % Math.max(members.length, 1)];
    if (!target) return;
    const day = Math.min(e.day, daysInPrevMonth);
    prevMonthPayments.push({
      id: genId(), user_id: DEMO_USER_ID, member_id: target.id, amount: e.plan.price,
      payment_date: ymd(prevYear, prevMonth, day),
      method: prevPaymentMethods[idx % prevPaymentMethods.length],
      status: 'paid', note: 'Renewal',
      created_at: iso(prevYear, prevMonth, day, 12),
    });
  });

  // ─── Current-month payments ───
  // Mix paid + pending for new joiners, plus 2-3 walk-in renewals
  const curMonthPayments: PaymentRow[] = curMonthMembers.map((m, i) => {
    const plan = plans.find(p => p.id === m.plan_id)!;
    const day = clampCurDay(parseInt(m.start_date.slice(8, 10), 10));
    // Make every 5th payment "pending"
    const isPending = i % 5 === 4;
    return {
      id: genId(),
      user_id: DEMO_USER_ID,
      member_id: m.id,
      amount: plan.price,
      payment_date: ymd(curYear, curMonth, day),
      method: prevPaymentMethods[i % prevPaymentMethods.length],
      status: isPending ? 'pending' : 'paid',
      note: isPending ? 'Awaiting confirmation' : 'Joining payment',
      created_at: iso(curYear, curMonth, day, 11),
    };
  });

  // Current-month walk-in renewals from existing members
  const curRenewalDays = [clampCurDay(2), clampCurDay(7), clampCurDay(13), clampCurDay(19)];
  curRenewalDays.forEach((day, idx) => {
    const target = members[(idx * 7) % Math.max(members.length, 1)];
    if (!target) return;
    const plan = plans.find(p => p.id === target.plan_id) ?? pStdM;
    curMonthPayments.push({
      id: genId(), user_id: DEMO_USER_ID, member_id: target.id, amount: plan.price,
      payment_date: ymd(curYear, curMonth, day),
      method: prevPaymentMethods[idx % prevPaymentMethods.length],
      status: 'paid', note: 'Renewal',
      created_at: iso(curYear, curMonth, day, 13),
    });
  });

  payments.push(...prevMonthPayments, ...curMonthPayments);

  // ─── Previous-month expenses (full month) ───
  const prevMonthExpensesSeed = [
    { title: 'Monthly Rent',               amount: 45000, category: 'Rent',        day: 1 },
    { title: 'Electricity Bill',           amount: 13500, category: 'Utilities',   day: 5 },
    { title: 'Water Supply',               amount: 3200,  category: 'Utilities',   day: 5 },
    { title: 'Internet & Wifi',            amount: 2200,  category: 'Utilities',   day: 6 },
    { title: 'Staff Salary - Trainer 1',   amount: 25000, category: 'Salary',      day: 7 },
    { title: 'Staff Salary - Trainer 2',   amount: 22000, category: 'Salary',      day: 7 },
    { title: 'Staff Salary - Trainer 3',   amount: 20000, category: 'Salary',      day: 7 },
    { title: 'Staff Salary - Reception',   amount: 15000, category: 'Salary',      day: 7 },
    { title: 'Staff Salary - Housekeeping',amount: 9000,  category: 'Salary',      day: 7 },
    { title: 'Treadmill Belt Replacement', amount: 6500,  category: 'Maintenance', day: 9 },
    { title: 'AC Servicing',               amount: 4200,  category: 'Maintenance', day: 11 },
    { title: 'Cleaning Supplies',          amount: 2800,  category: 'Maintenance', day: 12 },
    { title: 'New Barbell Plates Set',     amount: 14500, category: 'Equipment',   day: 14 },
    { title: 'Resistance Bands Bulk',      amount: 4800,  category: 'Equipment',   day: 16 },
    { title: 'Instagram Ads',              amount: 6000,  category: 'Marketing',   day: 18 },
    { title: 'Google Ads',                 amount: 5500,  category: 'Marketing',   day: 19 },
    { title: 'Flyer Printing',             amount: 1800,  category: 'Marketing',   day: 20 },
    { title: 'Whey Protein Stock',         amount: 18000, category: 'Inventory',   day: 22 },
    { title: 'Pre-Workout Stock',          amount: 9500,  category: 'Inventory',   day: 23 },
    { title: 'Office Stationery',          amount: 1500,  category: 'Other',       day: 25 },
    { title: 'Trainer Certification Fees', amount: 8000,  category: 'Other',       day: 27 },
  ];
  const prevMonthExpenses: ExpenseRow[] = prevMonthExpensesSeed.map(e => {
    const day = Math.min(e.day, daysInPrevMonth);
    return {
      id: genId(), user_id: DEMO_USER_ID,
      title: e.title, amount: e.amount, category: e.category,
      expense_date: ymd(prevYear, prevMonth, day),
      created_at: iso(prevYear, prevMonth, day, 9),
    };
  });

  // ─── Current-month expenses (1st → today) ───
  const curMonthExpensesSeed = [
    { title: 'Monthly Rent',               amount: 45000, category: 'Rent',        day: 1 },
    { title: 'Electricity Bill',           amount: 14200, category: 'Utilities',   day: 5 },
    { title: 'Water Supply',               amount: 3000,  category: 'Utilities',   day: 5 },
    { title: 'Internet & Wifi',            amount: 2200,  category: 'Utilities',   day: 6 },
    { title: 'Staff Salary - Trainer 1',   amount: 26000, category: 'Salary',      day: 7 },
    { title: 'Staff Salary - Trainer 2',   amount: 23000, category: 'Salary',      day: 7 },
    { title: 'Staff Salary - Trainer 3',   amount: 21000, category: 'Salary',      day: 7 },
    { title: 'Staff Salary - Reception',   amount: 16000, category: 'Salary',      day: 7 },
    { title: 'Staff Salary - Housekeeping',amount: 9500,  category: 'Salary',      day: 7 },
    { title: 'Equipment Maintenance',      amount: 7800,  category: 'Maintenance', day: 9 },
    { title: 'Mirror Repair',              amount: 3200,  category: 'Maintenance', day: 11 },
    { title: 'Cleaning Supplies',          amount: 3000,  category: 'Maintenance', day: 12 },
    { title: 'New Dumbbells Set',          amount: 22000, category: 'Equipment',   day: 13 },
    { title: 'Yoga Mats (20 pcs)',         amount: 6500,  category: 'Equipment',   day: 15 },
    { title: 'Instagram Ads',              amount: 7500,  category: 'Marketing',   day: 16 },
    { title: 'Influencer Collab',          amount: 12000, category: 'Marketing',   day: 18 },
    { title: 'Whey Protein Stock',         amount: 19500, category: 'Inventory',   day: 20 },
    { title: 'BCAA Stock',                 amount: 7500,  category: 'Inventory',   day: 22 },
  ];
  const curMonthExpenses: ExpenseRow[] = curMonthExpensesSeed
    .filter(e => e.day <= todayDay)
    .map(e => ({
      id: genId(), user_id: DEMO_USER_ID,
      title: e.title, amount: e.amount, category: e.category,
      expense_date: ymd(curYear, curMonth, clampCurDay(e.day)),
      created_at: iso(curYear, curMonth, clampCurDay(e.day), 9),
    }));

  expenses.push(...prevMonthExpenses, ...curMonthExpenses);

  // ─── Previous-month leads (lower conversion ~25%) ───
  const prevLeadsSeed: Array<{ name: string; phone: string; goal: string; status: string; day: number }> = [
    { name: 'Lakshay Wadhwa',   phone: '+91 9700000301', goal: 'Weight Loss',       status: 'lost',            day: 2 },
    { name: 'Bhumi Sahni',      phone: '+91 9700000302', goal: 'Yoga',              status: 'joined',          day: 3 },
    { name: 'Rohan Khatri',     phone: '+91 9700000303', goal: 'Muscle Gain',       status: 'contacted',       day: 4 },
    { name: 'Tanisha Kohli',    phone: '+91 9700000304', goal: 'General Fitness',   status: 'lost',            day: 5 },
    { name: 'Aniket Phadke',    phone: '+91 9700000305', goal: 'Strength Training', status: 'joined',          day: 7 },
    { name: 'Sara Bhatia',      phone: '+91 9700000306', goal: 'Weight Loss',       status: 'visit_scheduled', day: 8 },
    { name: 'Dhruv Bajwa',      phone: '+91 9700000307', goal: 'Muscle Gain',       status: 'lost',            day: 10 },
    { name: 'Vanya Roy',        phone: '+91 9700000308', goal: 'Yoga',              status: 'contacted',       day: 11 },
    { name: 'Mihir Shroff',     phone: '+91 9700000309', goal: 'Cardio',            status: 'joined',          day: 13 },
    { name: 'Tara Iyengar',     phone: '+91 9700000310', goal: 'Weight Loss',       status: 'lost',            day: 15 },
    { name: 'Pranay Wagh',      phone: '+91 9700000311', goal: 'Muscle Gain',       status: 'contacted',       day: 17 },
    { name: 'Diya Sengupta',    phone: '+91 9700000312', goal: 'General Fitness',   status: 'lost',            day: 19 },
    { name: 'Aryaman Khanna',   phone: '+91 9700000313', goal: 'Strength Training', status: 'visit_scheduled', day: 21 },
    { name: 'Inaya Marwah',     phone: '+91 9700000314', goal: 'Weight Loss',       status: 'lost',            day: 23 },
    { name: 'Kavin Subramanian',phone: '+91 9700000315', goal: 'Cardio',            status: 'contacted',       day: 25 },
    { name: 'Naina Bedi',       phone: '+91 9700000316', goal: 'Yoga',              status: 'lost',            day: 27 },
  ];
  const prevMonthLeads: LeadRow[] = prevLeadsSeed.map(s => {
    const day = Math.min(s.day, daysInPrevMonth);
    const created = iso(prevYear, prevMonth, day, 14);
    return {
      id: genId(), user_id: DEMO_USER_ID,
      name: s.name, phone: s.phone, fitness_goal: s.goal, status: s.status,
      created_at: created, updated_at: created,
    };
  });

  // ─── Current-month leads (higher conversion ~45%) ───
  const curLeadsSeed: Array<{ name: string; phone: string; goal: string; status: string; day: number }> = [
    { name: 'Aarush Mathur',    phone: '+91 9710000401', goal: 'Weight Loss',       status: 'joined',          day: 1 },
    { name: 'Kiara Bhalla',     phone: '+91 9710000402', goal: 'Muscle Gain',       status: 'joined',          day: 2 },
    { name: 'Shaurya Vohra',    phone: '+91 9710000403', goal: 'Strength Training', status: 'contacted',       day: 3 },
    { name: 'Anaya Bakshi',     phone: '+91 9710000404', goal: 'Yoga',              status: 'joined',          day: 4 },
    { name: 'Yash Vengsarkar',  phone: '+91 9710000405', goal: 'Weight Loss',       status: 'visit_scheduled', day: 5 },
    { name: 'Riya Mahajan',     phone: '+91 9710000406', goal: 'Cardio',            status: 'joined',          day: 6 },
    { name: 'Ayaan Bhasin',     phone: '+91 9710000407', goal: 'Muscle Gain',       status: 'new',             day: 7 },
    { name: 'Misha Sandhu',     phone: '+91 9710000408', goal: 'General Fitness',   status: 'contacted',       day: 8 },
    { name: 'Veer Mathew',      phone: '+91 9710000409', goal: 'Strength Training', status: 'joined',          day: 10 },
    { name: 'Tanya Sehgal',     phone: '+91 9710000410', goal: 'Weight Loss',       status: 'lost',            day: 12 },
    { name: 'Arnav Bose',       phone: '+91 9710000411', goal: 'Cardio',            status: 'joined',          day: 14 },
    { name: 'Ahaana Mirchandani',phone:'+91 9710000412', goal: 'Yoga',              status: 'visit_scheduled', day: 16 },
    { name: 'Kian Bhardwaj',    phone: '+91 9710000413', goal: 'Muscle Gain',       status: 'new',             day: 18 },
    { name: 'Jiya Khurana',     phone: '+91 9710000414', goal: 'Weight Loss',       status: 'contacted',       day: 20 },
    { name: 'Vihaan Kotak',     phone: '+91 9710000415', goal: 'General Fitness',   status: 'joined',          day: 22 },
    { name: 'Suhana Verma',     phone: '+91 9710000416', goal: 'Strength Training', status: 'new',             day: 24 },
  ];
  const curMonthLeads: LeadRow[] = curLeadsSeed
    .filter(s => s.day <= todayDay)
    .map(s => {
      const day = clampCurDay(s.day);
      const created = iso(curYear, curMonth, day, 14);
      return {
        id: genId(), user_id: DEMO_USER_ID,
        name: s.name, phone: s.phone, fitness_goal: s.goal, status: s.status,
        created_at: created, updated_at: created,
      };
    });

  leads.push(...prevMonthLeads, ...curMonthLeads);

  return {
    gym_settings,
    plans,
    members,
    payments,
    expenses,
    leads,
    website_content,
    contact_settings,
  };
}

// ─── In-memory singleton ───
let _db: MockDb = loadDb();

export function getDb(): MockDb {
  return _db;
}

export function setDb(newDb: MockDb) {
  // FULL REPLACEMENT — new object reference, no mutation
  _db = JSON.parse(JSON.stringify(newDb));
  saveDb(_db);
}

export function seedDemoData(): MockDb {
  console.log('[mockDb] === SEED DEMO DATA START ===');
  console.log('[mockDb] Old Data:', {
    plans: _db.plans?.length ?? 0,
    members: _db.members?.length ?? 0,
    payments: _db.payments?.length ?? 0,
    website_content: _db.website_content?.length ?? 0,
  });

  // Step 1: Generate fresh seed data
  const seedData = createSeedData();

  // Step 2: Deep clone to ensure no shared references
  const newData: MockDb = JSON.parse(JSON.stringify(seedData));

  console.log('[mockDb] New Seed Data:', {
    plans: newData.plans?.length ?? 0,
    members: newData.members?.length ?? 0,
    payments: newData.payments?.length ?? 0,
    website_content: newData.website_content?.length ?? 0,
  });

  // Step 3: FULL REPLACEMENT of in-memory db
  _db = newData;

  // Step 4: Save to localStorage
  saveDb(_db);

  // Step 5: Validate
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    const valid = parsed.members?.length > 0 && parsed.plans?.length > 0 && parsed.website_content?.length > 0;
    console.log('[mockDb] Validation:', valid ? '✅ PASS' : '❌ FAIL', {
      plans: parsed.plans?.length ?? 0,
      members: parsed.members?.length ?? 0,
      website_content: parsed.website_content?.length ?? 0,
    });
    if (!valid) {
      console.error('[mockDb] Demo data load FAILED — data missing after save');
    }
  }

  console.log('[mockDb] === SEED DEMO DATA END ===');
  return _db;
}

export function resetDemoData(): MockDb {
  console.log('[mockDb] === RESET DATA ===');
  const empty = emptyDb();
  _db = JSON.parse(JSON.stringify(empty));
  saveDb(_db);
  console.log('[mockDb] Data cleared');
  return _db;
}

export function clearLocalData() {
  localStorage.removeItem(STORAGE_KEY);
  _db = emptyDb();
  window.location.reload();
}
