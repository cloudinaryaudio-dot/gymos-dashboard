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
  primary_color: string; secondary_color: string; created_at: string; updated_at: string;
}
export interface PlanRow {
  id: string; user_id: string; name: string; price: number; duration_days: number; created_at: string;
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
    if (raw) return JSON.parse(raw);
  } catch {}
  return emptyDb();
}

export function saveDb(db: MockDb) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

// ─── Seed Data ───
export function createSeedData(): MockDb {
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const nowIso = now.toISOString();

  // Plans
  const plans: PlanRow[] = [
    { id: genId(), user_id: DEMO_USER_ID, name: 'Basic Plan', price: 999, duration_days: 30, created_at: nowIso },
    { id: genId(), user_id: DEMO_USER_ID, name: 'Standard Plan', price: 1999, duration_days: 90, created_at: nowIso },
    { id: genId(), user_id: DEMO_USER_ID, name: 'Premium Plan', price: 4999, duration_days: 365, created_at: nowIso },
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
      // Active
      startDate = subDays(now, Math.floor(Math.random() * 60) + 5);
      expiryDate = addDays(now, Math.floor(Math.random() * 120) + 10);
    } else if (i < 20) {
      // Expiring soon (within 7 days)
      startDate = subDays(now, plan.duration_days - 3);
      expiryDate = addDays(now, Math.floor(Math.random() * 6) + 1);
    } else {
      // Expired
      startDate = subDays(now, plan.duration_days + Math.floor(Math.random() * 30) + 10);
      expiryDate = subDays(now, Math.floor(Math.random() * 20) + 1);
    }

    return {
      id: genId(), user_id: DEMO_USER_ID, name, phone: `+91 ${9000000000 + i * 1111}`,
      plan_id: plan.id, start_date: format(startDate, 'yyyy-MM-dd'), expiry_date: format(expiryDate, 'yyyy-MM-dd'),
      status: expiryDate < now ? 'expired' : 'active', created_at: startDate.toISOString(),
    };
  });

  // Payments
  const statuses = ['paid', 'paid', 'paid', 'pending', 'overdue'];
  const methods = ['cash', 'upi', 'card', 'bank_transfer'];
  const payments: PaymentRow[] = members.flatMap((m, i) => {
    const plan = plans.find(p => p.id === m.plan_id)!;
    const entries: PaymentRow[] = [{
      id: genId(), user_id: DEMO_USER_ID, member_id: m.id, amount: plan.price,
      payment_date: m.start_date, method: methods[i % methods.length],
      status: statuses[i % statuses.length], note: null, created_at: m.created_at,
    }];
    // Add renewal payment for some
    if (i < 8) {
      entries.push({
        id: genId(), user_id: DEMO_USER_ID, member_id: m.id, amount: plan.price,
        payment_date: format(subDays(now, 15), 'yyyy-MM-dd'), method: 'upi',
        status: 'paid', note: 'Membership renewal', created_at: subDays(now, 15).toISOString(),
      });
    }
    return entries;
  });

  // Expenses
  const expenseData = [
    { title: 'Monthly Rent', amount: 45000, category: 'Rent' },
    { title: 'Electricity Bill', amount: 12000, category: 'Utilities' },
    { title: 'Staff Salary - Trainer 1', amount: 25000, category: 'Salary' },
    { title: 'Staff Salary - Trainer 2', amount: 22000, category: 'Salary' },
    { title: 'Staff Salary - Reception', amount: 15000, category: 'Salary' },
    { title: 'Equipment Maintenance', amount: 8000, category: 'Equipment' },
    { title: 'Protein Supplements Stock', amount: 15000, category: 'Inventory' },
    { title: 'Marketing - Social Media', amount: 5000, category: 'Marketing' },
    { title: 'Water Supply', amount: 3000, category: 'Utilities' },
    { title: 'New Dumbbells Set', amount: 18000, category: 'Equipment' },
  ];
  const expenses: ExpenseRow[] = expenseData.map((e, i) => ({
    id: genId(), user_id: DEMO_USER_ID, title: e.title, amount: e.amount,
    expense_date: format(subDays(now, i * 3), 'yyyy-MM-dd'), category: e.category, created_at: nowIso,
  }));

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
          { name: 'Raj Fitness', specialization: 'Strength & Conditioning', image_url: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=600&q=80' },
          { name: 'Priya Wellness', specialization: 'Yoga & Flexibility', image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80' },
          { name: 'Vikram Power', specialization: 'CrossFit & HIIT', image_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80' },
          { name: 'Meera Cardio', specialization: 'Zumba & Dance Fitness', image_url: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=600&q=80' },
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
          { name: 'Deepak Nair', content: 'I\'ve been a member for 2 years. The consistency and dedication of the trainers is unmatched.' },
          { name: 'Sunita Joshi', content: 'The yoga sessions transformed my health completely. Highly recommend to everyone!' },
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
          { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80', type: 'image', caption: 'Group Classes' },
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
          { title: 'Yoga', description: 'Find inner peace and flexibility with our expert yoga instructors.', icon: '🧘' },
          { title: 'Zumba', description: 'Dance your way to fitness with high-energy Zumba classes.', icon: '💃' },
          { title: 'Meditation', description: 'Calm your mind and boost mental clarity with guided meditation.', icon: '🧠' },
          { title: 'Personal Training', description: 'One-on-one sessions tailored to your specific fitness goals.', icon: '💪' },
          { title: 'CrossFit', description: 'High-intensity functional training for maximum results.', icon: '🏋️' },
          { title: 'Nutrition Coaching', description: 'Personalized diet plans to complement your workout routine.', icon: '🥗' },
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
          { name: 'Commercial Treadmills', description: 'Life Fitness treadmills with heart-rate monitoring.', image_url: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=600&q=80' },
          { name: 'Olympic Squat Racks', description: 'Heavy-duty power racks for serious lifters.', image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80' },
          { name: 'Hammer Strength Machines', description: 'Plate-loaded machines for targeted muscle work.', image_url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&q=80' },
          { name: 'Cable Crossover Station', description: 'Multi-functional cable system for full-body workouts.', image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80' },
          { name: 'Rowing Machines', description: 'Concept2 rowers for total-body cardio.', image_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80' },
          { name: 'Dumbbells (5-50kg)', description: 'Full range of rubber-coated hex dumbbells.', image_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80' },
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
          { name: 'Neeta Patel', rating: 5, text: 'I\'ve tried many gyms but this one stands out. The atmosphere is motivating!' },
          { name: 'Sanjay Kumar', rating: 4, text: 'Great equipment and friendly staff. Slightly crowded during peak hours.' },
          { name: 'Renu Aggarwal', rating: 5, text: 'The personal training sessions are worth every penny. Highly recommend!' },
          { name: 'Vikash Jain', rating: 4, text: 'Good gym with modern equipment. The yoga classes are excellent.' },
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
          { name: 'Elite Fitness - Koramangala', location: '4th Block, Koramangala, Bangalore - 560034', contact: '+91 80 4567 8901' },
          { name: 'Elite Fitness - HSR Layout', location: 'Sector 2, HSR Layout, Bangalore - 560102', contact: '+91 80 4567 8902' },
          { name: 'Elite Fitness - Indiranagar', location: '100 Feet Road, Indiranagar, Bangalore - 560038', contact: '+91 80 4567 8903' },
        ],
      },
      created_at: nowIso, updated_at: nowIso,
    },
  ];

  // Gym settings
  const gym_settings: GymSettingsRow[] = [{
    id: genId(), user_id: DEMO_USER_ID, gym_name: 'Elite Fitness Club',
    logo_url: null, primary_color: '142 71% 45%', secondary_color: '220 25% 8%',
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

export function setDb(db: MockDb) {
  _db = db;
  saveDb(db);
}

export function seedDemoData() {
  const seed = createSeedData();
  setDb(seed);
  return seed;
}

export function resetDemoData() {
  const empty = emptyDb();
  setDb(empty);
  return empty;
}

export function clearLocalData() {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}

// Initialize from localStorage on import
if (_db.plans.length === 0 && _db.members.length === 0) {
  // Auto-seed on first load if empty
  _db = createSeedData();
  saveDb(_db);
}
