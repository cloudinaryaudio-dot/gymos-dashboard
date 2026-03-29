import { db as supabase } from '@/integrations/supabase/db';

export async function seedDemoData(userId: string) {
  // 1. Plans
  const plans = [
    { name: 'Basic Plan', price: 999, duration_days: 30, user_id: userId },
    { name: 'Standard Plan', price: 1999, duration_days: 90, user_id: userId },
    { name: 'Premium Plan', price: 4999, duration_days: 365, user_id: userId },
  ];
  const { data: insertedPlans, error: plansErr } = await supabase.from('plans').insert(plans).select();
  if (plansErr) throw plansErr;

  const planMap = {
    basic: insertedPlans[0].id,
    standard: insertedPlans[1].id,
    premium: insertedPlans[2].id,
  };

  // 2. Members (20 members with realistic Indian names)
  const today = new Date();
  const d = (offset: number) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + offset);
    return dt.toISOString().split('T')[0];
  };

  const memberDefs = [
    { name: 'Aarav Patel', phone: '9876543210', plan: 'premium', startOffset: -60, status: 'active' },
    { name: 'Priya Sharma', phone: '9876543211', plan: 'standard', startOffset: -45, status: 'active' },
    { name: 'Rohan Gupta', phone: '9876543212', plan: 'basic', startOffset: -25, status: 'active' },
    { name: 'Sneha Reddy', phone: '9876543213', plan: 'standard', startOffset: -80, status: 'active' },
    { name: 'Vikram Singh', phone: '9876543214', plan: 'premium', startOffset: -30, status: 'active' },
    { name: 'Ananya Joshi', phone: '9876543215', plan: 'basic', startOffset: -28, status: 'active' },
    { name: 'Arjun Nair', phone: '9876543216', plan: 'standard', startOffset: -70, status: 'active' },
    { name: 'Kavya Iyer', phone: '9876543217', plan: 'basic', startOffset: -35, status: 'expired' },
    { name: 'Raj Malhotra', phone: '9876543218', plan: 'premium', startOffset: -20, status: 'active' },
    { name: 'Meera Desai', phone: '9876543219', plan: 'standard', startOffset: -85, status: 'active' },
    { name: 'Aditya Verma', phone: '9876543220', plan: 'basic', startOffset: -32, status: 'expired' },
    { name: 'Ishita Kapoor', phone: '9876543221', plan: 'standard', startOffset: -10, status: 'active' },
    { name: 'Karan Mehta', phone: '9876543222', plan: 'basic', startOffset: -5, status: 'active' },
    { name: 'Divya Choudhury', phone: '9876543223', plan: 'premium', startOffset: -90, status: 'active' },
    { name: 'Nikhil Rao', phone: '9876543224', plan: 'standard', startOffset: -50, status: 'active' },
    { name: 'Pooja Thakur', phone: '9876543225', plan: 'basic', startOffset: -40, status: 'expired' },
    { name: 'Siddharth Jain', phone: '9876543226', plan: 'standard', startOffset: -15, status: 'active' },
    { name: 'Riya Bose', phone: '9876543227', plan: 'premium', startOffset: -100, status: 'active' },
    { name: 'Amit Kumar', phone: '9876543228', plan: 'basic', startOffset: -3, status: 'active' },
    { name: 'Neha Agarwal', phone: '9876543229', plan: 'standard', startOffset: -55, status: 'active' },
  ];

  const durationMap: Record<string, number> = { basic: 30, standard: 90, premium: 365 };

  const members = memberDefs.map(m => {
    const startDate = d(m.startOffset);
    const dur = durationMap[m.plan];
    const expiryDate = d(m.startOffset + dur);
    const status = new Date(expiryDate) < today ? 'expired' : 'active';
    return {
      name: m.name,
      phone: m.phone,
      plan_id: planMap[m.plan as keyof typeof planMap],
      start_date: startDate,
      expiry_date: expiryDate,
      status,
      user_id: userId,
    };
  });

  const { data: insertedMembers, error: membersErr } = await supabase.from('members').insert(members).select();
  if (membersErr) throw membersErr;

  // 3. Payments
  const paymentMethods = ['cash', 'upi', 'card'];
  const payments = insertedMembers.map((m, i) => ({
    member_id: m.id,
    amount: plans.find(p => p.name.toLowerCase().includes(
      memberDefs[i].plan
    ))?.price ?? 999,
    payment_date: m.start_date,
    method: paymentMethods[i % 3],
    status: i >= 17 ? 'pending' : 'paid',
    user_id: userId,
  }));

  const { error: paymentsErr } = await supabase.from('payments').insert(payments);
  if (paymentsErr) throw paymentsErr;

  // 4. Expenses
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
  ].map(e => ({ ...e, user_id: userId }));

  const { error: expensesErr } = await supabase.from('expenses').insert(expenses);
  if (expensesErr) throw expensesErr;

  // 5. Leads
  const leads = [
    { name: 'Rahul Verma', phone: '9988776601', fitness_goal: 'Weight Loss', status: 'new' },
    { name: 'Simran Kaur', phone: '9988776602', fitness_goal: 'General Fitness', status: 'new' },
    { name: 'Deepak Yadav', phone: '9988776603', fitness_goal: 'Muscle Gain', status: 'contacted' },
    { name: 'Ankita Sinha', phone: '9988776604', fitness_goal: 'Weight Loss', status: 'contacted' },
    { name: 'Varun Tiwari', phone: '9988776605', fitness_goal: 'Muscle Gain', status: 'converted' },
    { name: 'Pallavi Menon', phone: '9988776606', fitness_goal: 'General Fitness', status: 'new' },
    { name: 'Manish Dubey', phone: '9988776607', fitness_goal: 'Weight Loss', status: 'contacted' },
    { name: 'Swati Pillai', phone: '9988776608', fitness_goal: 'Muscle Gain', status: 'new' },
    { name: 'Gaurav Saxena', phone: '9988776609', fitness_goal: 'General Fitness', status: 'converted' },
    { name: 'Nisha Pandey', phone: '9988776610', fitness_goal: 'Weight Loss', status: 'new' },
    { name: 'Tarun Bhatt', phone: '9988776611', fitness_goal: 'Muscle Gain', status: 'contacted' },
    { name: 'Jaya Krishnan', phone: '9988776612', fitness_goal: 'General Fitness', status: 'converted' },
  ].map(l => ({ ...l, user_id: userId }));

  const { error: leadsErr } = await supabase.from('leads').insert(leads);
  if (leadsErr) throw leadsErr;

  // 6. Trainers
  const trainers = [
    { name: 'Rajesh Kumar', specialization: 'Strength & Conditioning', image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop&crop=face', sort_order: 1 },
    { name: 'Anita Sharma', specialization: 'Yoga & Flexibility', image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop&crop=face', sort_order: 2 },
    { name: 'Vikash Rawat', specialization: 'CrossFit & HIIT', image_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=400&fit=crop&crop=face', sort_order: 3 },
    { name: 'Priyanka Negi', specialization: 'Nutrition & Weight Loss', image_url: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400&h=400&fit=crop&crop=face', sort_order: 4 },
  ].map(t => ({ ...t, user_id: userId }));

  const { error: trainersErr } = await supabase.from('trainers').insert(trainers);
  if (trainersErr) throw trainersErr;

  // 7. Testimonials
  const testimonials = [
    { name: 'Aarav Patel', content: 'Lost 15 kgs in 3 months! The trainers here are phenomenal and the environment keeps you motivated every single day.', sort_order: 1, is_visible: true },
    { name: 'Priya Sharma', content: 'Best gym in the city! The equipment is top-notch and the personal training program completely transformed my fitness journey.', sort_order: 2, is_visible: true },
    { name: 'Vikram Singh', content: 'I have been training here for a year now. The results speak for themselves — gained 8 kgs of lean muscle.', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', sort_order: 3, is_visible: true },
    { name: 'Sneha Reddy', content: 'The yoga classes are incredible. My flexibility and mental peace have improved drastically since I joined.', sort_order: 4, is_visible: true },
    { name: 'Arjun Nair', content: 'From a couch potato to running half marathons — Elite Fitness Club made it possible!', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', sort_order: 5, is_visible: true },
    { name: 'Kavya Iyer', content: 'Amazing community and support system. The group classes are fun and challenging at the same time.', sort_order: 6, is_visible: true },
  ].map(t => ({ ...t, user_id: userId }));

  const { error: testimonialsErr } = await supabase.from('testimonials').insert(testimonials);
  if (testimonialsErr) throw testimonialsErr;

  // 8. Gallery
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
  ].map(g => ({ ...g, user_id: userId }));

  const { error: galleryErr } = await supabase.from('gallery').insert(gallery);
  if (galleryErr) throw galleryErr;

  // 9. Website Sections
  const sections = [
    {
      section_type: 'hero',
      title: 'Transform Your Body. Build Your Discipline.',
      subtitle: 'Join Elite Fitness Club — Where Champions Are Made',
      content: 'Premium training facility with world-class equipment, expert trainers, and a community that pushes you beyond limits.',
      image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920',
      sort_order: 1,
      is_visible: true,
    },
    {
      section_type: 'about',
      title: 'Why Elite Fitness Club?',
      subtitle: '5+ Years of Transforming Lives',
      content: 'We are not just a gym — we are a movement. With over 500 successful transformations, state-of-the-art equipment, and certified trainers, Elite Fitness Club is where your fitness journey truly begins.',
      image_url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800',
      sort_order: 2,
      is_visible: true,
    },
    {
      section_type: 'cta',
      title: 'Start Your Fitness Journey Today',
      subtitle: 'Limited slots available — Join now and get your first week FREE!',
      content: 'Don\'t wait for Monday. Don\'t wait for January. The best time to start is NOW. Join 500+ members who chose to transform their lives.',
      sort_order: 10,
      is_visible: true,
    },
  ].map(s => ({ ...s, user_id: userId }));

  const { error: sectionsErr } = await supabase.from('website_sections').insert(sections);
  if (sectionsErr) throw sectionsErr;

  return { members: insertedMembers.length, plans: insertedPlans.length };
}
