import { db as supabase } from '@/integrations/supabase/db';

/** Delete all user-owned demo data before reseeding */
async function clearUserData(userId: string) {
  const tables = [
    'payments',
    'members',
    'plans',
    'expenses',
    'leads',
    'trainers',
    'testimonials',
    'gallery',
    'website_sections',
    'website_content',
    'contact_settings',
    'gym_settings',
    'reviews',
    'branches',
  ];
  for (const table of tables) {
    await (supabase.from(table as any) as any).delete().eq('user_id', userId);
  }
}

export async function seedDemoData(userId: string, { reset = true }: { reset?: boolean } = {}) {
  if (reset) {
    await clearUserData(userId);
  }

  // 1. Plans
  const plans = [
    { name: 'Basic Monthly', price: 999, duration_days: 30, category: 'Monthly', benefits: ['Full gym access', 'Locker facility', 'Basic fitness assessment'], is_highlighted: false, show_on_homepage: true, user_id: userId },
    { name: 'Standard Quarterly', price: 2499, duration_days: 90, category: 'Quarterly', benefits: ['Full gym access', 'Personal trainer (2x/week)', 'Diet consultation', 'Steam & sauna'], is_highlighted: true, show_on_homepage: true, user_id: userId },
    { name: 'Premium Yearly', price: 7999, duration_days: 365, category: 'Yearly', benefits: ['Unlimited gym access', 'Dedicated personal trainer', 'Monthly body analysis', 'Nutrition plan', 'Group classes', 'Guest passes'], is_highlighted: false, show_on_homepage: true, user_id: userId },
    { name: 'Couple Monthly', price: 1799, duration_days: 30, category: 'Couple', benefits: ['2 member access', 'Full gym access', 'Locker facility'], is_highlighted: false, user_id: userId },
    { name: 'Female Special', price: 1299, duration_days: 30, category: 'Female', benefits: ['Full gym access', 'Women-only hours', 'Zumba & yoga classes', 'Diet plan'], is_highlighted: false, user_id: userId },
    { name: 'Half-Yearly', price: 4499, duration_days: 180, category: 'Half-Yearly', benefits: ['Full gym access', 'Personal trainer (3x/week)', 'Diet consultation', 'Steam & sauna', 'Supplement discount'], is_highlighted: false, user_id: userId },
  ];
  const { data: insertedPlans, error: plansErr } = await supabase.from('plans').insert(plans).select();
  if (plansErr) throw new Error(`Plans: ${plansErr.message}`);
  if (!insertedPlans?.length) throw new Error('Plans insert returned no data');

  const planMap = { basic: insertedPlans[0].id, standard: insertedPlans[1].id, premium: insertedPlans[2].id, couple: insertedPlans[3]?.id, female: insertedPlans[4]?.id, half: insertedPlans[5]?.id };
  const durationMap: Record<string, number> = { basic: 30, standard: 90, premium: 365 };

  // 2. Members (25 — mix of active, expiring, expired)
  const today = new Date();
  const d = (offset: number) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + offset);
    return dt.toISOString().split('T')[0];
  };

  const memberDefs = [
    { name: 'Aarav Patel', phone: '9876543210', plan: 'premium', startOffset: -60 },
    { name: 'Priya Sharma', phone: '9876543211', plan: 'standard', startOffset: -45 },
    { name: 'Rohan Gupta', phone: '9876543212', plan: 'basic', startOffset: -25 },
    { name: 'Sneha Reddy', phone: '9876543213', plan: 'standard', startOffset: -88 },
    { name: 'Vikram Singh', phone: '9876543214', plan: 'premium', startOffset: -30 },
    { name: 'Ananya Joshi', phone: '9876543215', plan: 'basic', startOffset: -28 },
    { name: 'Arjun Nair', phone: '9876543216', plan: 'standard', startOffset: -70 },
    { name: 'Kavya Iyer', phone: '9876543217', plan: 'basic', startOffset: -35 },
    { name: 'Raj Malhotra', phone: '9876543218', plan: 'premium', startOffset: -20 },
    { name: 'Meera Desai', phone: '9876543219', plan: 'standard', startOffset: -85 },
    { name: 'Aditya Verma', phone: '9876543220', plan: 'basic', startOffset: -32 },
    { name: 'Ishita Kapoor', phone: '9876543221', plan: 'standard', startOffset: -10 },
    { name: 'Karan Mehta', phone: '9876543222', plan: 'basic', startOffset: -5 },
    { name: 'Divya Choudhury', phone: '9876543223', plan: 'premium', startOffset: -90 },
    { name: 'Nikhil Rao', phone: '9876543224', plan: 'standard', startOffset: -50 },
    { name: 'Pooja Thakur', phone: '9876543225', plan: 'basic', startOffset: -40 },
    { name: 'Siddharth Jain', phone: '9876543226', plan: 'standard', startOffset: -15 },
    { name: 'Riya Bose', phone: '9876543227', plan: 'premium', startOffset: -100 },
    { name: 'Amit Kumar', phone: '9876543228', plan: 'basic', startOffset: -3 },
    { name: 'Neha Agarwal', phone: '9876543229', plan: 'standard', startOffset: -55 },
    { name: 'Harsh Pandey', phone: '9876543230', plan: 'basic', startOffset: -29 },
    { name: 'Tanvi Kulkarni', phone: '9876543231', plan: 'premium', startOffset: -15 },
    { name: 'Suresh Yadav', phone: '9876543232', plan: 'standard', startOffset: -2 },
    { name: 'Lakshmi Nair', phone: '9876543233', plan: 'basic', startOffset: -27 },
    { name: 'Deepak Chauhan', phone: '9876543234', plan: 'standard', startOffset: -75 },
  ];

  const members = memberDefs.map(m => {
    const startDate = d(m.startOffset);
    const dur = durationMap[m.plan];
    const expiryDate = d(m.startOffset + dur);
    const expiry = new Date(expiryDate);
    const status = expiry < today ? 'expired' : 'active';
    return {
      name: m.name, phone: m.phone,
      plan_id: planMap[m.plan as keyof typeof planMap],
      start_date: startDate, expiry_date: expiryDate, status, user_id: userId,
    };
  });

  const { data: insertedMembers, error: membersErr } = await supabase.from('members').insert(members).select();
  if (membersErr) throw new Error(`Members: ${membersErr.message}`);
  if (!insertedMembers?.length) throw new Error('Members insert returned no data');

  // 3. Payments — varied statuses
  const paymentMethods = ['cash', 'upi', 'card'];
  const payments = insertedMembers.map((m: any, i: number) => {
    const def = memberDefs[i];
    const price = plans.find(p => p.name.toLowerCase().includes(def.plan))?.price ?? 999;
    let status = 'paid';
    if (i >= 22) status = 'pending';
    else if (i >= 19) status = 'overdue';
    return {
      member_id: m.id, amount: price, payment_date: m.start_date,
      method: paymentMethods[i % 3], status, user_id: userId,
    };
  });

  const { error: paymentsErr } = await supabase.from('payments').insert(payments);
  if (paymentsErr) throw new Error(`Payments: ${paymentsErr.message}`);

  // 4. Expenses (12)
  const expenses = [
    { title: 'Monthly Rent', amount: 35000, expense_date: d(-2), category: 'Rent' },
    { title: 'Head Trainer Salary', amount: 25000, expense_date: d(-1), category: 'Salary' },
    { title: 'Assistant Trainer Salary', amount: 15000, expense_date: d(-1), category: 'Salary' },
    { title: 'Treadmill Maintenance', amount: 4500, expense_date: d(-10), category: 'Equipment' },
    { title: 'Electricity Bill', amount: 8200, expense_date: d(-5), category: 'Utilities' },
    { title: 'Water Bill', amount: 1500, expense_date: d(-5), category: 'Utilities' },
    { title: 'New Dumbbells Set', amount: 12000, expense_date: d(-15), category: 'Equipment' },
    { title: 'Cleaning Supplies', amount: 2000, expense_date: d(-8), category: 'Supplies' },
    { title: 'Protein Supplements Stock', amount: 8000, expense_date: d(-12), category: 'Inventory' },
    { title: 'Internet & WiFi', amount: 1200, expense_date: d(-3), category: 'Utilities' },
    { title: 'AC Servicing', amount: 3500, expense_date: d(-18), category: 'Maintenance' },
    { title: 'Marketing Flyers', amount: 2500, expense_date: d(-20), category: 'Marketing' },
  ].map(e => ({ ...e, user_id: userId }));

  const { error: expensesErr } = await supabase.from('expenses').insert(expenses);
  if (expensesErr) throw new Error(`Expenses: ${expensesErr.message}`);

  // 5. Leads (18 — spread across pipeline stages)
  const leads = [
    { name: 'Rahul Verma', phone: '9988776601', fitness_goal: 'Weight Loss', status: 'new' },
    { name: 'Simran Kaur', phone: '9988776602', fitness_goal: 'General Fitness', status: 'new' },
    { name: 'Deepak Yadav', phone: '9988776603', fitness_goal: 'Muscle Gain', status: 'contacted' },
    { name: 'Ankita Sinha', phone: '9988776604', fitness_goal: 'Weight Loss', status: 'contacted' },
    { name: 'Varun Tiwari', phone: '9988776605', fitness_goal: 'Muscle Gain', status: 'joined' },
    { name: 'Pallavi Menon', phone: '9988776606', fitness_goal: 'General Fitness', status: 'new' },
    { name: 'Manish Dubey', phone: '9988776607', fitness_goal: 'Weight Loss', status: 'visit_scheduled' },
    { name: 'Swati Pillai', phone: '9988776608', fitness_goal: 'Muscle Gain', status: 'new' },
    { name: 'Gaurav Saxena', phone: '9988776609', fitness_goal: 'General Fitness', status: 'joined' },
    { name: 'Nisha Pandey', phone: '9988776610', fitness_goal: 'Weight Loss', status: 'new' },
    { name: 'Tarun Bhatt', phone: '9988776611', fitness_goal: 'Muscle Gain', status: 'contacted' },
    { name: 'Jaya Krishnan', phone: '9988776612', fitness_goal: 'General Fitness', status: 'joined' },
    { name: 'Rohit Mehra', phone: '9988776613', fitness_goal: 'Weight Loss', status: 'lost' },
    { name: 'Preeti Bhat', phone: '9988776614', fitness_goal: 'Muscle Gain', status: 'visit_scheduled' },
    { name: 'Ajay Mishra', phone: '9988776615', fitness_goal: 'General Fitness', status: 'new' },
    { name: 'Megha Soni', phone: '9988776616', fitness_goal: 'Weight Loss', status: 'lost' },
    { name: 'Vivek Rathore', phone: '9988776617', fitness_goal: 'Muscle Gain', status: 'contacted' },
    { name: 'Sakshi Jha', phone: '9988776618', fitness_goal: 'General Fitness', status: 'visit_scheduled' },
  ].map(l => ({ ...l, user_id: userId }));

  const { error: leadsErr } = await supabase.from('leads').insert(leads);
  if (leadsErr) throw new Error(`Leads: ${leadsErr.message}`);

  // 6. Trainers
  const trainers = [
    { name: 'Rajesh Kumar', specialization: 'Strength & Conditioning', image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop&crop=face', sort_order: 1 },
    { name: 'Anita Sharma', specialization: 'Yoga & Flexibility', image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop&crop=face', sort_order: 2 },
    { name: 'Vikash Rawat', specialization: 'CrossFit & HIIT', image_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=400&fit=crop&crop=face', sort_order: 3 },
    { name: 'Priyanka Negi', specialization: 'Nutrition & Weight Loss', image_url: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400&h=400&fit=crop&crop=face', sort_order: 4 },
  ].map(t => ({ ...t, user_id: userId }));

  const { error: trainersErr } = await supabase.from('trainers').insert(trainers);
  if (trainersErr) throw new Error(`Trainers: ${trainersErr.message}`);

  // 7. Testimonials
  const testimonials = [
    { name: 'Aarav Patel', content: 'Lost 15 kgs in 3 months! The trainers here are phenomenal and the environment keeps you motivated every single day.', sort_order: 1, is_visible: true },
    { name: 'Priya Sharma', content: 'Best gym in the city! The equipment is top-notch and the personal training program completely transformed my fitness journey.', sort_order: 2, is_visible: true },
    { name: 'Vikram Singh', content: 'I have been training here for a year now. The results speak for themselves — gained 8 kgs of lean muscle.', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', sort_order: 3, is_visible: true },
    { name: 'Sneha Reddy', content: 'The yoga classes are incredible. My flexibility and mental peace have improved drastically since I joined.', sort_order: 4, is_visible: true },
    { name: 'Arjun Nair', content: 'From a couch potato to running half marathons — this gym made it possible!', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', sort_order: 5, is_visible: true },
    { name: 'Kavya Iyer', content: 'Amazing community and support system. The group classes are fun and challenging at the same time.', sort_order: 6, is_visible: true },
  ].map(t => ({ ...t, user_id: userId }));

  const { error: testimonialsErr } = await supabase.from('testimonials').insert(testimonials);
  if (testimonialsErr) throw new Error(`Testimonials: ${testimonialsErr.message}`);

  // 8. Gallery (12 images)
  const gallery = [
    { image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', caption: 'State-of-the-art equipment', sort_order: 1 },
    { image_url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800', caption: 'Spacious training floor', sort_order: 2 },
    { image_url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800', caption: 'Free weights section', sort_order: 3 },
    { image_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800', caption: 'Personal training sessions', sort_order: 4 },
    { image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800', caption: 'Yoga & flexibility classes', sort_order: 5 },
    { image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800', caption: 'Cardio zone', sort_order: 6 },
    { image_url: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=800', caption: 'Group fitness classes', sort_order: 7 },
    { image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800', caption: 'CrossFit area', sort_order: 8 },
    { image_url: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800', caption: 'Transformation results', sort_order: 9 },
    { image_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800', caption: 'Functional training', sort_order: 10 },
    { image_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800', caption: 'Boxing ring', sort_order: 11 },
    { image_url: 'https://images.unsplash.com/photo-1572432332292-6ec39ab4704a?w=800', caption: 'Stretching area', sort_order: 12 },
  ].map(g => ({ ...g, user_id: userId }));

  const { error: galleryErr } = await supabase.from('gallery').insert(gallery);
  if (galleryErr) throw new Error(`Gallery: ${galleryErr.message}`);

  // 9. Website Sections
  const sections = [
    { section_type: 'hero', title: 'Transform Your Body. Build Your Discipline.', subtitle: 'Join Elite Fitness Club — Where Champions Are Made', content: 'Premium training facility with world-class equipment, expert trainers, and a community that pushes you beyond limits.', image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920', sort_order: 1, is_visible: true },
    { section_type: 'about', title: 'Why Elite Fitness Club?', subtitle: '5+ Years of Transforming Lives', content: 'We are not just a gym — we are a movement. With over 500 successful transformations, state-of-the-art equipment, and certified trainers, Elite Fitness Club is where your fitness journey truly begins.', image_url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800', sort_order: 2, is_visible: true },
    { section_type: 'cta', title: 'Start Your Fitness Journey Today', subtitle: 'Limited slots available — Join now and get your first week FREE!', content: "Don't wait for Monday. Don't wait for January. The best time to start is NOW.", sort_order: 10, is_visible: true },
  ].map(s => ({ ...s, user_id: userId }));

  const { error: sectionsErr } = await supabase.from('website_sections').insert(sections);
  if (sectionsErr) throw new Error(`Website Sections: ${sectionsErr.message}`);

  // 10. Website Content (all section keys — fully populated)
  const websiteContent = [
    {
      section_key: 'hero', is_enabled: true,
      content: {
        title: 'Transform Your Body. Build Your Discipline.',
        subtitle: 'Join Elite Fitness Club — Where Champions Are Made',
        image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80',
        video_url: 'https://www.youtube.com/watch?v=qSOVBiEotaw',
        mobile_image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
        mobile_video_url: '',
        cta_text: 'Start Free Trial',
      },
    },
    {
      section_key: 'pricing', is_enabled: true,
      content: {
        title: 'Membership Plans',
        subtitle: 'Flexible plans designed for every fitness level and budget.',
        cta_note: '⚡ Limited slots — Join now & get 10% off!',
      },
    },
    {
      section_key: 'trainers', is_enabled: true,
      content: {
        title: 'Meet Our Expert Trainers',
        subtitle: 'Certified professionals dedicated to your transformation.',
        items: [
          { name: 'Rajesh Kumar', specialization: 'Strength & Conditioning', image_url: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=400&h=400&fit=crop&crop=face' },
          { name: 'Anita Sharma', specialization: 'Yoga & Flexibility', image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop&crop=face' },
          { name: 'Vikash Rawat', specialization: 'CrossFit & HIIT', image_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=400&fit=crop&crop=face' },
          { name: 'Priyanka Negi', specialization: 'Nutrition & Weight Management', image_url: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400&h=400&fit=crop&crop=face' },
        ],
      },
    },
    {
      section_key: 'testimonials', is_enabled: true,
      content: {
        title: 'Real Results, Real Stories',
        subtitle: 'Hear from our members who transformed their lives.',
        items: [
          { name: 'Aarav Patel', content: 'Lost 15 kgs in 3 months! The trainers here are phenomenal and the environment keeps you motivated every day.' },
          { name: 'Priya Sharma', content: 'Best gym in the city! Equipment is top-notch and the personal training program completely changed my life.' },
          { name: 'Vikram Singh', content: 'Gained 8 kgs of lean muscle in one year. The coaches know exactly how to push you.', video_url: 'https://www.youtube.com/watch?v=qSOVBiEotaw' },
          { name: 'Sneha Reddy', content: 'The yoga classes are incredible. My flexibility and mental peace have improved drastically.' },
          { name: 'Arjun Nair', content: 'From couch potato to half-marathon runner — this gym made it possible!', video_url: 'https://www.youtube.com/watch?v=qSOVBiEotaw' },
        ],
      },
    },
    {
      section_key: 'gallery', is_enabled: true,
      content: {
        title: 'Take a Virtual Tour',
        items: [
          { url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80', type: 'image', caption: 'Main training floor' },
          { url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80', type: 'image', caption: 'Spacious workout area' },
          { url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&q=80', type: 'image', caption: 'Free weights section' },
          { url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80', type: 'image', caption: 'Personal training zone' },
          { url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80', type: 'image', caption: 'Yoga studio' },
          { url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80', type: 'image', caption: 'Cardio machines' },
          { url: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=800&q=80', type: 'image', caption: 'Group fitness studio' },
          { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80', type: 'image', caption: 'CrossFit box' },
          { url: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800&q=80', type: 'image', caption: 'Transformation wall' },
          { url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80', type: 'image', caption: 'Functional training area' },
          { url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80', type: 'image', caption: 'Boxing ring' },
          { url: 'https://www.youtube.com/watch?v=qSOVBiEotaw', type: 'video', caption: 'Gym walkthrough tour' },
          { url: 'https://www.youtube.com/watch?v=tt7gR_Fzm8E', type: 'video', caption: 'Member transformation stories' },
        ],
      },
    },
    {
      section_key: 'services', is_enabled: true,
      content: {
        title: 'Our Services',
        subtitle: 'Everything you need for a complete fitness lifestyle.',
        items: [
          { title: 'Personal Training', description: 'One-on-one sessions with certified trainers tailored to your specific goals and fitness level.', icon: '💪', image_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80' },
          { title: 'Yoga & Meditation', description: 'Daily classes to improve flexibility, balance, strength, and mental clarity.', icon: '🧘', image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80' },
          { title: 'Zumba Dance Fitness', description: 'High-energy dance workouts that burn 600+ calories per session while having fun.', icon: '💃', image_url: 'https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?w=600&q=80' },
          { title: 'CrossFit & HIIT', description: 'Intense functional training programs for maximum results in minimum time.', icon: '🔥', image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80' },
          { title: 'Nutrition Coaching', description: 'Personalized diet plans and supplement guidance from certified nutritionists.', icon: '🥗', image_url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80' },
          { title: 'Boxing & MMA', description: 'Learn self-defense while getting the best full-body workout of your life.', icon: '🥊', image_url: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600&q=80' },
        ],
      },
    },
    {
      section_key: 'equipment', is_enabled: true,
      content: {
        title: 'World-Class Equipment',
        subtitle: 'Train with premium machines trusted by professional athletes.',
        items: [
          { name: 'Commercial Treadmills', description: 'Life Fitness Platinum Club Series with 10" touchscreen and heart rate monitoring.', image_url: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=600&q=80' },
          { name: 'Power Racks & Squat Stations', description: 'Hammer Strength HD Elite racks with safety catches and band pegs.', image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80' },
          { name: 'Cable Crossover Machines', description: 'Technogym Selection Line dual adjustable pulleys for isolation exercises.', image_url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80' },
          { name: 'Spin Bikes', description: 'Keiser M3i indoor cycles with magnetic resistance and Bluetooth connectivity.', image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&q=80' },
          { name: 'Rowing Machines', description: 'Concept2 Model D with PM5 performance monitor — the gold standard.', image_url: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=600&q=80' },
          { name: 'Functional Trainers', description: 'Matrix Fitness G7 with dual 90.5 kg weight stacks for versatile training.', image_url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&q=80' },
        ],
      },
    },
    {
      section_key: 'reviews', is_enabled: true,
      content: {
        title: 'Google Reviews',
        subtitle: 'Rated 4.8★ on Google with 500+ reviews.',
        items: [
          { name: 'Amit Sharma', rating: 5, text: 'Best gym experience I have ever had. Spotlessly clean, well-equipped, and trainers who genuinely care about your progress.' },
          { name: 'Priya Menon', rating: 5, text: 'Love the yoga and meditation classes. Very peaceful, professional, and the studio is beautiful.' },
          { name: 'Rahul Kapoor', rating: 4, text: 'Great equipment and friendly staff. The CrossFit area is fantastic. Wish they had more parking space.' },
          { name: 'Sneha Deshmukh', rating: 5, text: 'Completely transformed my body in 6 months. Down 20 kgs and feeling stronger than ever. Highly recommend!' },
          { name: 'Vijay Raman', rating: 4, text: 'Good variety of group classes. Would love if they added evening Zumba slots on weekends.' },
          { name: 'Kavita Joshi', rating: 5, text: 'The personal trainers here are on another level. My trainer created a custom plan that actually works.' },
        ],
      },
    },
    {
      section_key: 'branches', is_enabled: true,
      content: {
        title: 'Our Locations',
        subtitle: 'Three premium locations across the city.',
        items: [
          { name: 'Elite Fitness — Koramangala', location: '4th Block, 80 Feet Road, Koramangala, Bangalore — 560034', contact: '+91 98765 00001' },
          { name: 'Elite Fitness — Indiranagar', location: '12th Main Road, HAL 2nd Stage, Indiranagar, Bangalore — 560038', contact: '+91 98765 00002' },
          { name: 'Elite Fitness — HSR Layout', location: 'Sector 2, 27th Main Road, HSR Layout, Bangalore — 560102', contact: '+91 98765 00003' },
          { name: 'Elite Fitness — Koramangala', location: '4th Block, 80 Feet Road, Koramangala, Bangalore — 560034', contact: '+91 98765 00004' },
          { name: 'Elite Fitness — Indiranagar', location: '12th Main Road, HAL 2nd Stage, Indiranagar, Bangalore — 560038', contact: '+91 98765 00005' },
          { name: 'Elite Fitness — HSR Layout', location: 'Sector 2, 27th Main Road, HSR Layout, Bangalore — 560102', contact: '+91 98765 00006' },
        ],
      },
    },
    {
      section_key: 'footer_social', is_enabled: true,
      content: {
        instagram_url: 'https://instagram.com/elitefitness',
        whatsapp_url: 'https://wa.me/919876543210',
        facebook_url: 'https://facebook.com/elitefitness',
        youtube_url: 'https://youtube.com/@elitefitness',
        instagram_enabled: true, whatsapp_enabled: true, facebook_enabled: true, youtube_enabled: true,
      },
    },
    {
      section_key: 'supplements', is_enabled: true,
      content: {
        title: 'Recommended Supplements',
        subtitle: 'Fuel your gains with our top picks.',
        items: [
          { title: 'Whey Protein Isolate', description: 'High-quality 25g protein per scoop with zero sugar. Perfect for post-workout recovery.', image_url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600&q=80', external_link: 'https://www.amazon.in' },
          { title: 'Creatine Monohydrate', description: 'Boost strength and power output by 10-15%. The most researched supplement.', image_url: 'https://images.unsplash.com/photo-1579722820903-1ccc12e1b836?w=600&q=80', external_link: 'https://www.amazon.in' },
          { title: 'Pre-Workout Energy', description: 'Clean energy blend with caffeine, beta-alanine, and citrulline for explosive workouts.', image_url: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=600&q=80', external_link: 'https://www.amazon.in' },
          { title: 'Whey Protein Isolate', description: 'High-quality 25g protein per scoop with zero sugar. Perfect for post-workout recovery.', image_url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600&q=80', external_link: 'https://www.amazon.in' },
          { title: 'Creatine Monohydrate', description: 'Boost strength and power output by 10-15%. The most researched supplement.', image_url: 'https://images.unsplash.com/photo-1579722820903-1ccc12e1b836?w=600&q=80', external_link: 'https://www.amazon.in' },
          { title: 'Pre-Workout Energy', description: 'Clean energy blend with caffeine, beta-alanine, and citrulline for explosive workouts.', image_url: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=600&q=80', external_link: 'https://www.amazon.in' },
          
        ],
      },
    },
    {
      section_key: 'achievements', is_enabled: true,
      content: {
        title: 'Achievements & Certifications',
        subtitle: 'Our credentials speak for themselves.',
        items: [
          { title: 'ACE Certified Facility', description: 'Accredited by the American Council on Exercise for meeting global safety and training standards.', image_url: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=200&q=80' },
          { title: 'ISO 9001:2015', description: 'Quality management certification ensuring consistent service delivery and member satisfaction.', image_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&q=80' },
          { title: 'Best Gym Award 2025', description: 'Awarded "Best Fitness Center" by the City Health & Wellness Council for three consecutive years.', image_url: 'https://images.unsplash.com/photo-1533228876829-65c94e7b5025?w=200&q=80' },
          { title: 'ACE Certified Facility', description: 'Accredited by the American Council on Exercise for meeting global safety and training standards.', image_url: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=200&q=80' },
          { title: 'ISO 9001:2015', description: 'Quality management certification ensuring consistent service delivery and member satisfaction.', image_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&q=80' },
          { title: 'Best Gym Award 2025', description: 'Awarded "Best Fitness Center" by the City Health & Wellness Council for three consecutive years.', image_url: 'https://images.unsplash.com/photo-1533228876829-65c94e7b5025?w=200&q=80' },
        ],
      },
    },
  ].map(wc => ({ ...wc, content: wc.content as any, user_id: userId }));

  const { error: wcErr } = await supabase.from('website_content').insert(websiteContent);
  if (wcErr) throw new Error(`Website Content: ${wcErr.message}`);

  // 11. Contact Settings
  const { error: contactErr } = await (supabase.from('contact_settings' as any) as any).upsert({
    user_id: userId,
    whatsapp_number: '919876543210',
    whatsapp_message: 'Hi! I am interested in joining Elite Fitness Club. Can you share more details?',
    instagram_url: 'https://instagram.com/elitefitness',
  }, { onConflict: 'user_id' });
  if (contactErr) throw new Error(`Contact Settings: ${contactErr.message}`);

  // 12. Gym Settings (branding)
  const { error: settingsErr } = await supabase.from('gym_settings').upsert({
    user_id: userId,
    gym_name: 'Elite Fitness Club',
    primary_color: '142 76% 36%',
    secondary_color: '215 28% 17%',
  }, { onConflict: 'user_id' });
  if (settingsErr) throw new Error(`Gym Settings: ${settingsErr.message}`);

  // 13. Reviews
  const reviews = [
    { name: 'Amit Sharma', rating: 5, text: 'Best gym experience I have ever had. Spotlessly clean, well-equipped, and trainers who genuinely care about your progress.', sort_order: 1 },
    { name: 'Priya Menon', rating: 5, text: 'Love the yoga and meditation classes. Very peaceful, professional, and the studio is beautiful.', sort_order: 2 },
    { name: 'Rahul Kapoor', rating: 4, text: 'Great equipment and friendly staff. The CrossFit area is fantastic. Wish they had more parking space.', sort_order: 3 },
    { name: 'Sneha Deshmukh', rating: 5, text: 'Completely transformed my body in 6 months. Down 20 kgs and feeling stronger than ever!', sort_order: 4 },
    { name: 'Vijay Raman', rating: 4, text: 'Good variety of group classes. Would love if they added evening Zumba slots on weekends.', sort_order: 5 },
    { name: 'Kavita Joshi', rating: 5, text: 'The personal trainers here are on another level. My trainer created a custom plan that actually works.', sort_order: 6 },
  ].map(r => ({ ...r, user_id: userId }));

  const { error: reviewsErr } = await (supabase.from('reviews' as any) as any).insert(reviews);
  if (reviewsErr) throw new Error(`Reviews: ${reviewsErr.message}`);

  // 14. Branches
  const branchesData = [
    { name: 'Elite Fitness — Koramangala', location: '4th Block, 80 Feet Road, Koramangala, Bangalore — 560034', contact: '+91 98765 00001', image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80', sort_order: 1 },
    { name: 'Elite Fitness — Indiranagar', location: '12th Main Road, HAL 2nd Stage, Indiranagar, Bangalore — 560038', contact: '+91 98765 00002', image_url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80', sort_order: 2 },
    { name: 'Elite Fitness — HSR Layout', location: 'Sector 2, 27th Main Road, HSR Layout, Bangalore — 560102', contact: '+91 98765 00003', image_url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&q=80', sort_order: 3 },
    { name: 'Elite Fitness — Koramangala', location: '4th Block, 80 Feet Road, Koramangala, Bangalore — 560034', contact: '+91 98765 00001', image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80', sort_order: 1 },
    { name: 'Elite Fitness — Indiranagar', location: '12th Main Road, HAL 2nd Stage, Indiranagar, Bangalore — 560038', contact: '+91 98765 00002', image_url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80', sort_order: 2 },
    { name: 'Elite Fitness — HSR Layout', location: 'Sector 2, 27th Main Road, HSR Layout, Bangalore — 560102', contact: '+91 98765 00003', image_url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&q=80', sort_order: 3 },
  ].map(b => ({ ...b, user_id: userId }));

  const { error: branchesErr } = await (supabase.from('branches' as any) as any).insert(branchesData);
  if (branchesErr) throw new Error(`Branches: ${branchesErr.message}`);

  return {
    members: insertedMembers.length,
    plans: insertedPlans.length,
    payments: payments.length,
    expenses: expenses.length,
    leads: leads.length,
  };
}

/** Reset only — delete user data without reseeding */
export async function resetDemoData(userId: string) {
  await clearUserData(userId);
}
