/**
 * Customer data mapping - used by seed script and services
 * This provides realistic customer information for the loyalty platform
 */

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  joinDate: string; // ISO date string
  preferredLocation?: string;
  notes?: string;
}

export const CUSTOMER_DATA: CustomerInfo[] = [
  {
    name: 'Sara Al-Mansouri',
    email: 'sara.almansouri@example.com',
    phone: '+974 3312 4567',
    joinDate: '2025-12-15',
    preferredLocation: 'The Pearl Branch',
    notes: 'Regular customer, visits 3-4 times per week',
  },
  {
    name: 'Omar Al-Kuwari',
    email: 'omar.alkuwari@example.com',
    phone: '+974 3345 6789',
    joinDate: '2025-12-10',
    preferredLocation: 'City Center Branch',
    notes: 'Prefers espresso drinks, redeemed 2 rewards',
  },
  {
    name: 'Layla Al-Thani',
    email: 'layla.althani@example.com',
    phone: '+974 3378 9012',
    joinDate: '2025-12-20',
    preferredLocation: 'Villaggio Branch',
    notes: 'New member, first visit was last week',
  },
  {
    name: 'Khalid Al-Suwaidi',
    email: 'khalid.alsuwaidi@example.com',
    phone: '+974 3321 5432',
    joinDate: '2025-11-28',
    preferredLocation: 'The Pearl Branch',
    notes: 'VIP customer, top spender this month',
  },
  {
    name: 'Noor Al-Ansari',
    email: 'noor.alansari@example.com',
    phone: '+974 3354 8765',
    joinDate: '2025-12-05',
    preferredLocation: 'City Center Branch',
    notes: 'Loves pastries, always redeems pastry rewards',
  },
  {
    name: 'Faisal Al-Mazroei',
    email: 'faisal.almazroei@example.com',
    phone: '+974 3365 4321',
    joinDate: '2025-12-12',
    preferredLocation: 'Villaggio Branch',
    notes: 'Corporate customer, orders for office frequently',
  },
  {
    name: 'Amina Al-Kaabi',
    email: 'amina.alkaabi@example.com',
    phone: '+974 3387 6543',
    joinDate: '2025-12-18',
    preferredLocation: 'The Pearl Branch',
    notes: 'Student, visits during study breaks',
  },
  {
    name: 'Youssef Al-Hashimi',
    email: 'youssef.alhashimi@example.com',
    phone: '+974 3398 7654',
    joinDate: '2025-11-30',
    preferredLocation: 'City Center Branch',
    notes: 'Coffee enthusiast, tries new drinks regularly',
  },
  {
    name: 'Maya Al-Dosari',
    email: 'maya.aldosari@example.com',
    phone: '+974 3310 9876',
    joinDate: '2025-12-22',
    preferredLocation: 'Villaggio Branch',
    notes: 'Morning regular, always orders cappuccino',
  },
  {
    name: 'Tariq Al-Shamari',
    email: 'tariq.alshamari@example.com',
    phone: '+974 3342 3456',
    joinDate: '2025-12-08',
    preferredLocation: 'The Pearl Branch',
    notes: 'Weekend customer, brings family often',
  },
  {
    name: 'Hala Al-Mutawa',
    email: 'hala.almutawa@example.com',
    phone: '+974 3353 7890',
    joinDate: '2025-12-25',
    preferredLocation: 'City Center Branch',
    notes: 'Newest member, joined last week',
  },
  {
    name: 'Zaid Al-Otaiba',
    email: 'zaid.alotaiba@example.com',
    phone: '+974 3364 2109',
    joinDate: '2025-11-25',
    preferredLocation: 'Villaggio Branch',
    notes: 'Loyal member for 2 months, active redeemer',
  },
  {
    name: 'Rania Al-Mansoori',
    email: 'rania.almansoori@example.com',
    phone: '+974 3375 6789',
    joinDate: '2025-12-01',
    preferredLocation: 'The Pearl Branch',
    notes: 'Inactive for 2 weeks',
  },
  {
    name: 'Hamad Al-Suwaidi',
    email: 'hamad.alsuwaidi@example.com',
    phone: '+974 3386 5432',
    joinDate: '2025-12-03',
    preferredLocation: 'City Center Branch',
    notes: 'Inactive account, one-time visitor',
  },
  {
    name: 'Leila Al-Kuwari',
    email: 'leila.alkuwari@example.com',
    phone: '+974 3397 8901',
    joinDate: '2025-12-14',
    preferredLocation: 'Villaggio Branch',
    notes: 'Inactive, joined but never returned',
  },
  {
    name: 'Mohammed Al-Emadi',
    email: 'mohammed.alemadi@example.com',
    phone: '+974 3301 2345',
    joinDate: '2025-12-16',
    preferredLocation: 'The Pearl Branch',
    notes: 'Regular morning customer, orders Americano',
  },
  {
    name: 'Fatima Al-Mahmoud',
    email: 'fatima.almahmoud@example.com',
    phone: '+974 3312 5678',
    joinDate: '2025-12-07',
    preferredLocation: 'City Center Branch',
    notes: 'Evening customer, loves specialty drinks',
  },
  {
    name: 'Ahmed Al-Rashid',
    email: 'ahmed.alrashid@example.com',
    phone: '+974 3323 9012',
    joinDate: '2025-12-19',
    preferredLocation: 'Villaggio Branch',
    notes: 'Weekday customer, works nearby',
  },
  {
    name: 'Salma Al-Hajri',
    email: 'salma.alhajri@example.com',
    phone: '+974 3334 3456',
    joinDate: '2025-12-11',
    preferredLocation: 'The Pearl Branch',
    notes: 'Social media influencer, posts about drinks',
  },
  {
    name: 'Abdullah Al-Marri',
    email: 'abdullah.almarri@example.com',
    phone: '+974 3345 7890',
    joinDate: '2025-12-04',
    preferredLocation: 'City Center Branch',
    notes: 'Business customer, orders large quantities',
  },
  {
    name: 'Aisha Al-Hitmi',
    email: 'aisha.alhitmi@example.com',
    phone: '+974 3356 1234',
    joinDate: '2025-12-21',
    preferredLocation: 'Villaggio Branch',
    notes: 'New member, very engaged with rewards',
  },
  {
    name: 'Ibrahim Al-Nuaimi',
    email: 'ibrahim.alnuaimi@example.com',
    phone: '+974 3367 5678',
    joinDate: '2025-12-06',
    preferredLocation: 'The Pearl Branch',
    notes: 'Coffee connoisseur, tries premium blends',
  },
  {
    name: 'Mariam Al-Khater',
    email: 'mariam.alkhater@example.com',
    phone: '+974 3378 9012',
    joinDate: '2025-12-13',
    preferredLocation: 'City Center Branch',
    notes: 'Frequent redeemer, loves free items',
  },
  {
    name: 'Yusuf Al-Sada',
    email: 'yusuf.alsada@example.com',
    phone: '+974 3389 3456',
    joinDate: '2025-12-17',
    preferredLocation: 'Villaggio Branch',
    notes: 'Young professional, visits after work',
  },
];

// Helper to get customer info by index (order in seed script)
export function getCustomerInfo(index: number): CustomerInfo {
  return CUSTOMER_DATA[index % CUSTOMER_DATA.length] || CUSTOMER_DATA[0];
}

// Helper to get customer info by customer ID hash
export function getCustomerInfoById(customerId: string): CustomerInfo {
  const hash = parseInt(customerId.replace(/-/g, '').slice(0, 8), 16);
  return CUSTOMER_DATA[hash % CUSTOMER_DATA.length] || CUSTOMER_DATA[0];
}
