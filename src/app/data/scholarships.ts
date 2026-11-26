/**
 * Scholarship scheme catalogue for the Scholarship Schemes pages.
 * Scheme names follow Gujarat / central schemes; amounts, income limits and dates are INDICATIVE demo values —
 * replace this file with the live scheme master (or an API) before going live.
 */
export type SchCategory = 'SC' | 'ST' | 'SEBC' | 'EWS' | 'NT-DNT' | 'Minority' | 'All';
export type SchLevel = 'pre' | 'post' | 'higher';

export interface Scholarship {
  id: string;
  name: string;
  department: string;
  short: string;
  overview: string;
  category: SchCategory;
  level: SchLevel;
  icon: string;
  amount: string;
  benefits: string[];
  eligibilitySummary: string;
  eligibility: string[];
  documents: { key: string; label: string; optional?: boolean }[];
  start: string; // ISO date
  end: string;   // ISO date
  incomeLimit?: number;
  gender?: 'Female';
  minPercent?: number;
  stream?: 'Science';
  standards?: string[];
  disability?: boolean;
  hostel?: boolean;
  bank: boolean;
}

const D = {
  aadhaar: { key: 'aadhaar', label: 'Aadhaar Card' },
  photo: { key: 'photo', label: 'Passport-size Photograph' },
  caste: { key: 'caste', label: 'Caste Certificate' },
  income: { key: 'income', label: 'Income Certificate' },
  marksheet: { key: 'marksheet', label: 'Last Exam Marksheet' },
  fee: { key: 'fee', label: 'Fee Receipt (current year)' },
  bonafide: { key: 'bonafide', label: 'Bonafide / Admission Certificate' },
  bank: { key: 'bank', label: 'Bank Passbook (first page) / Cancelled Cheque' },
  lc: { key: 'lc', label: 'School Leaving Certificate', optional: true },
  hostel: { key: 'hostel', label: 'Hostel Admission / Mess Certificate' },
  disability: { key: 'disability', label: 'Disability Certificate / UDID Card' },
  minority: { key: 'minority', label: 'Minority Community Self-Declaration' },
  ews: { key: 'ews', label: 'EWS Eligibility Certificate' },
};

const SJED = 'Social Justice & Empowerment Department';
const TDD = 'Tribal Development Department';
const EDU = 'Education Department';

export const SCHOLARSHIPS: Scholarship[] = [
  {
    id: 'post-matric-sc', name: 'Post-Matric Scholarship for SC Students', department: SJED, category: 'SC', level: 'post', icon: 'pi pi-graduation-cap',
    short: 'Tuition fee and maintenance support for SC students studying after Std 10.',
    overview: 'Supports Scheduled Caste students pursuing post-matric courses — Std 11–12, diploma, graduation and post-graduation — by reimbursing compulsory fees and paying a maintenance allowance.',
    amount: 'Compulsory fees + maintenance allowance', benefits: ['Reimbursement of compulsory non-refundable fees', 'Annual maintenance allowance (day scholar / hosteller rates)', 'Direct Benefit Transfer to the student’s bank account'],
    eligibilitySummary: 'SC students in Std 11 and above · income up to ₹2.5 lakh', incomeLimit: 250000,
    eligibility: ['Belongs to a Scheduled Caste notified in Gujarat', 'Studying in a recognised post-matric course', 'Annual family income up to ₹2,50,000', 'Not receiving any other scholarship for the same course'],
    documents: [D.aadhaar, D.photo, D.caste, D.income, D.marksheet, D.fee, D.bank], start: '2026-10-01', end: '2026-10-31', bank: true,
  },
  {
    id: 'post-matric-st', name: 'Post-Matric Scholarship for ST Students', department: TDD, category: 'ST', level: 'post', icon: 'pi pi-graduation-cap',
    short: 'Fee reimbursement and maintenance allowance for Scheduled Tribe students.',
    overview: 'Helps Scheduled Tribe students continue education after Std 10 by covering compulsory fees and providing a maintenance allowance for day scholars and hostellers.',
    amount: 'Compulsory fees + maintenance allowance', benefits: ['Compulsory fee reimbursement', 'Maintenance allowance for the academic year', 'Paid by DBT'],
    eligibilitySummary: 'ST students in Std 11 and above · income up to ₹2.5 lakh', incomeLimit: 250000,
    eligibility: ['Belongs to a Scheduled Tribe notified in Gujarat', 'Enrolled in a recognised post-matric course', 'Annual family income up to ₹2,50,000'],
    documents: [D.aadhaar, D.photo, D.caste, D.income, D.marksheet, D.fee, D.bank], start: '2026-09-01', end: '2026-11-30', bank: true,
  },
  {
    id: 'post-matric-sebc', name: 'Post-Matric Scholarship for SEBC Students', department: 'Developing Castes Welfare', category: 'SEBC', level: 'post', icon: 'pi pi-graduation-cap',
    short: 'Scholarship for Socially and Educationally Backward Class students after Std 10.',
    overview: 'Provides fee support and a scholarship amount to SEBC students in recognised post-matric courses.',
    amount: 'Fee support + scholarship as per course group', benefits: ['Course-group based scholarship amount', 'Fee support for recognised courses', 'Paid by DBT'],
    eligibilitySummary: 'SEBC students in Std 11 and above · income up to ₹2.5 lakh', incomeLimit: 250000,
    eligibility: ['Belongs to SEBC (non-creamy layer)', 'Studying in a recognised post-matric course', 'Annual family income up to ₹2,50,000'],
    documents: [D.aadhaar, D.photo, D.caste, D.income, D.marksheet, D.fee, D.bank], start: '2026-09-01', end: '2026-12-31', bank: true,
  },
  {
    id: 'post-matric-ews', name: 'Post-Matric Scholarship for EWS Students', department: 'Developing Castes Welfare', category: 'EWS', level: 'post', icon: 'pi pi-graduation-cap',
    short: 'Support for Economically Weaker Section (unreserved) students in higher studies.',
    overview: 'Helps students from economically weaker unreserved families meet the cost of post-matric education.',
    amount: 'Scholarship as per course group', benefits: ['Annual scholarship amount', 'Paid by DBT'],
    eligibilitySummary: 'EWS students in Std 11 and above · income up to ₹4 lakh', incomeLimit: 400000,
    eligibility: ['Holds a valid EWS eligibility certificate', 'Studying in a recognised post-matric course', 'Annual family income up to ₹4,00,000'],
    documents: [D.aadhaar, D.photo, D.ews, D.income, D.marksheet, D.fee, D.bank], start: '2026-09-01', end: '2026-12-31', bank: true,
  },
  {
    id: 'freeship-sc', name: 'Freeship Card for SC Students', department: SJED, category: 'SC', level: 'post', icon: 'pi pi-id-card',
    short: 'Admission without paying tuition fees in self-financed institutes.',
    overview: 'The Freeship Card lets eligible SC students take admission in self-financed institutes without paying the tuition fee up front; the fee is settled with the institute directly.',
    amount: 'Tuition fee waiver at admission', benefits: ['No tuition fee to be paid at admission', 'Fee settled directly with the institute'],
    eligibilitySummary: 'SC students joining self-financed courses · income up to ₹2.5 lakh', incomeLimit: 250000,
    eligibility: ['Belongs to a Scheduled Caste notified in Gujarat', 'Admitted to a self-financed institute', 'Annual family income up to ₹2,50,000'],
    documents: [D.aadhaar, D.photo, D.caste, D.income, D.bonafide], start: '2026-10-01', end: '2026-10-31', bank: false,
  },
  {
    id: 'food-bill-sc', name: 'Food Bill Assistance for SC Hostel Students', department: SJED, category: 'SC', level: 'post', icon: 'pi pi-shopping-bag',
    short: 'Monthly food-bill support for SC students living in hostels.',
    overview: 'Covers part of the monthly mess / food bill of SC students staying in hostels attached to colleges and professional institutes.',
    amount: 'Monthly food-bill support (as per notification)', benefits: ['Monthly mess-bill assistance for the academic months', 'Paid by DBT'],
    eligibilitySummary: 'SC hostellers in post-matric courses · income up to ₹2.5 lakh', incomeLimit: 250000, hostel: true,
    eligibility: ['Belongs to a Scheduled Caste notified in Gujarat', 'Staying in a college / institute hostel', 'Annual family income up to ₹2,50,000'],
    documents: [D.aadhaar, D.photo, D.caste, D.income, D.hostel, D.bank], start: '2026-10-01', end: '2026-10-31', bank: true,
  },
  {
    id: 'instrument-sc', name: 'Instrument Assistance for SC Students', department: SJED, category: 'SC', level: 'higher', icon: 'pi pi-wrench',
    short: 'One-time help to buy instruments for medical, engineering and diploma courses.',
    overview: 'One-time assistance for SC students in medical, engineering, diploma and similar professional courses to buy the instruments and kits their course needs.',
    amount: 'One-time instrument assistance', benefits: ['One-time assistance per course', 'Paid by DBT'],
    eligibilitySummary: 'SC students in professional courses · income up to ₹2.5 lakh', incomeLimit: 250000,
    eligibility: ['Belongs to a Scheduled Caste notified in Gujarat', 'First year of a medical / engineering / diploma course', 'Annual family income up to ₹2,50,000'],
    documents: [D.aadhaar, D.photo, D.caste, D.income, D.bonafide, D.bank], start: '2026-09-01', end: '2026-12-31', bank: true,
  },
  {
    id: 'pre-matric-sc', name: 'Pre-Matric Scholarship for SC Students', department: SJED, category: 'SC', level: 'pre', icon: 'pi pi-book',
    short: 'Annual scholarship for SC school students in Std 1 to 10.',
    overview: 'Encourages SC children to stay in school by paying an annual scholarship to students in Std 1–10.',
    amount: 'Annual scholarship by standard', benefits: ['Annual scholarship per standard', 'Paid to the parent / student account'],
    eligibilitySummary: 'SC students in Std 1–10 · income up to ₹2.5 lakh', incomeLimit: 250000, standards: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    eligibility: ['Belongs to a Scheduled Caste notified in Gujarat', 'Studying in Std 1–10 in a recognised school', 'Annual family income up to ₹2,50,000'],
    documents: [D.aadhaar, D.photo, D.caste, D.income, D.marksheet, D.bank], start: '2026-09-01', end: '2026-12-31', bank: true,
  },
  {
    id: 'pre-matric-st', name: 'Pre-Matric Scholarship for ST Students', department: TDD, category: 'ST', level: 'pre', icon: 'pi pi-book',
    short: 'Scholarship for Scheduled Tribe students in Std 9 and 10.',
    overview: 'Supports Scheduled Tribe students in Std 9 and 10 so they can complete secondary schooling.',
    amount: 'Annual scholarship', benefits: ['Annual scholarship amount', 'Paid by DBT'],
    eligibilitySummary: 'ST students in Std 9–10 · income up to ₹2.5 lakh', incomeLimit: 250000, standards: ['9', '10'],
    eligibility: ['Belongs to a Scheduled Tribe notified in Gujarat', 'Studying in Std 9 or 10', 'Annual family income up to ₹2,50,000'],
    documents: [D.aadhaar, D.photo, D.caste, D.income, D.marksheet, D.bank], start: '2026-09-01', end: '2026-11-30', bank: true,
  },
  {
    id: 'pre-matric-sebc', name: 'Pre-Matric Scholarship for SEBC Students', department: 'Developing Castes Welfare', category: 'SEBC', level: 'pre', icon: 'pi pi-book',
    short: 'Annual scholarship for SEBC school students.',
    overview: 'Annual scholarship for SEBC students studying in recognised schools.',
    amount: 'Annual scholarship by standard', benefits: ['Annual scholarship per standard', 'Paid by DBT'],
    eligibilitySummary: 'SEBC students in Std 1–10 · income up to ₹1.5 lakh', incomeLimit: 150000, standards: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    eligibility: ['Belongs to SEBC (non-creamy layer)', 'Studying in Std 1–10', 'Annual family income up to ₹1,50,000'],
    documents: [D.aadhaar, D.photo, D.caste, D.income, D.marksheet, D.bank], start: '2026-09-01', end: '2026-12-31', bank: true,
  },
  {
    id: 'mysy', name: 'Mukhyamantri Yuva Swavalamban Yojana (MYSY)', department: EDU, category: 'All', level: 'higher', icon: 'pi pi-star',
    short: 'Tuition fee assistance for meritorious students in higher education.',
    overview: 'MYSY helps meritorious students from middle- and lower-income families pursue diploma, degree and professional courses by paying part of the tuition fee.',
    amount: 'Up to 50% of tuition fees (caps by course)', benefits: ['Part of the annual tuition fee', 'Hostel and book assistance for eligible students', 'Renewable every year on good progress'],
    eligibilitySummary: '80%+ in Std 10/12 · income up to ₹6 lakh', incomeLimit: 600000, minPercent: 80,
    eligibility: ['Scored at least 80 percentile / % in Std 10 or 12 as applicable', 'Admitted to a diploma / degree course in Gujarat', 'Annual family income up to ₹6,00,000'],
    documents: [D.aadhaar, D.photo, D.income, D.marksheet, D.fee, D.bonafide, D.bank], start: '2026-09-15', end: '2026-12-31', bank: true,
  },
  {
    id: 'namo-lakshmi', name: 'Namo Lakshmi Yojana', department: EDU, category: 'All', level: 'pre', icon: 'pi pi-heart',
    short: 'Financial help for girls studying in Std 9 to 12.',
    overview: 'Namo Lakshmi Yojana encourages girls to complete secondary and higher-secondary education with assistance spread across Std 9 to 12.',
    amount: '₹50,000 over Std 9–12', benefits: ['Assistance paid in instalments across Std 9 to 12', 'Paid by DBT to the student / mother account'],
    eligibilitySummary: 'Girls in Std 9–12 · income up to ₹6 lakh', incomeLimit: 600000, gender: 'Female', standards: ['9', '10', '11', '12'],
    eligibility: ['Girl student studying in Std 9–12', 'Studying in a government, grant-in-aid or eligible private school', 'Annual family income up to ₹6,00,000'],
    documents: [D.aadhaar, D.photo, D.income, D.bonafide, D.bank], start: '2026-07-01', end: '2026-12-31', bank: true,
  },
  {
    id: 'namo-saraswati', name: 'Namo Saraswati Vigyan Sadhana Yojana', department: EDU, category: 'All', level: 'pre', icon: 'pi pi-bolt',
    short: 'Encourages students to choose the Science stream in Std 11 and 12.',
    overview: 'Supports students who take the Science stream in Std 11–12, to build a stronger pipeline into science and technology courses.',
    amount: '₹25,000 over Std 11–12', benefits: ['Assistance across Std 11 and 12', 'Paid by DBT'],
    eligibilitySummary: 'Science stream, Std 11–12 · income up to ₹6 lakh', incomeLimit: 600000, stream: 'Science', standards: ['11', '12'],
    eligibility: ['Studying in Std 11 or 12 Science stream', 'Passed Std 10 from a Gujarat board school', 'Annual family income up to ₹6,00,000'],
    documents: [D.aadhaar, D.photo, D.income, D.marksheet, D.bonafide, D.bank], start: '2027-01-05', end: '2027-02-15', bank: true,
  },
  {
    id: 'gyan-sadhana', name: 'Mukhyamantri Gyan Sadhana Merit Scholarship', department: EDU, category: 'All', level: 'pre', icon: 'pi pi-trophy',
    short: 'Merit scholarship for students selected through the Gyan Sadhana test.',
    overview: 'Merit-based scholarship for students who clear the Gyan Sadhana selection test, supporting them from Std 9 to 12.',
    amount: '₹20,000–₹25,000 per year', benefits: ['Yearly scholarship from Std 9 to 12 for selected students', 'Paid by DBT'],
    eligibilitySummary: 'Selected in the merit test · Std 9–12', standards: ['9', '10', '11', '12'], minPercent: 60,
    eligibility: ['Selected in the Gyan Sadhana merit test', 'Studying in Std 9–12', 'At least 60% in the previous standard'],
    documents: [D.aadhaar, D.photo, D.marksheet, D.bonafide, D.bank], start: '2026-05-01', end: '2026-06-30', bank: true,
  },
  {
    id: 'minority-pre', name: 'Pre-Matric Scholarship for Minority Students', department: 'Minority Affairs', category: 'Minority', level: 'pre', icon: 'pi pi-book',
    short: 'Scholarship for minority community students in Std 1 to 10.',
    overview: 'Annual scholarship for students from notified minority communities studying in Std 1–10.',
    amount: 'Admission fee + maintenance allowance', benefits: ['Admission / tuition fee support', 'Maintenance allowance', 'Paid by DBT'],
    eligibilitySummary: 'Minority students in Std 1–10 · 50%+ marks · income up to ₹1 lakh', incomeLimit: 100000, minPercent: 50, standards: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    eligibility: ['Belongs to a notified minority community', 'At least 50% marks in the previous exam', 'Annual family income up to ₹1,00,000'],
    documents: [D.aadhaar, D.photo, D.minority, D.income, D.marksheet, D.bank], start: '2026-08-01', end: '2026-12-15', bank: true,
  },
  {
    id: 'minority-post', name: 'Post-Matric Scholarship for Minority Students', department: 'Minority Affairs', category: 'Minority', level: 'post', icon: 'pi pi-graduation-cap',
    short: 'Scholarship for minority students from Std 11 to Ph.D.',
    overview: 'Supports students from notified minority communities in Std 11 to Ph.D. with fee support and a maintenance allowance.',
    amount: 'Fee support + maintenance allowance', benefits: ['Admission and tuition fee support', 'Maintenance allowance', 'Paid by DBT'],
    eligibilitySummary: 'Minority students, Std 11+ · 50%+ marks · income up to ₹2 lakh', incomeLimit: 200000, minPercent: 50,
    eligibility: ['Belongs to a notified minority community', 'At least 50% marks in the previous final exam', 'Annual family income up to ₹2,00,000'],
    documents: [D.aadhaar, D.photo, D.minority, D.income, D.marksheet, D.fee, D.bank], start: '2026-08-01', end: '2026-12-15', bank: true,
  },
  {
    id: 'disability', name: 'Scholarship for Students with Disabilities', department: SJED, category: 'All', level: 'post', icon: 'pi pi-users',
    short: 'Support for students with 40% or more disability.',
    overview: 'Helps students with benchmark disabilities (40% or more) continue their studies with an annual scholarship and fee support.',
    amount: 'Annual scholarship + fee support', benefits: ['Annual scholarship', 'Fee support for recognised courses', 'Paid by DBT'],
    eligibilitySummary: '40%+ disability · income up to ₹2.5 lakh', incomeLimit: 250000, disability: true,
    eligibility: ['Has a benchmark disability of 40% or more', 'Studying in a recognised course after Std 10', 'Annual family income up to ₹2,50,000'],
    documents: [D.aadhaar, D.photo, D.disability, D.income, D.marksheet, D.bank], start: '2026-09-01', end: '2026-12-31', bank: true,
  },
  {
    id: 'saraswati-sadhana', name: 'Saraswati Sadhana Yojana', department: SJED, category: 'All', level: 'pre', icon: 'pi pi-compass',
    short: 'Free bicycle for girls joining Std 9, to make school easier to reach.',
    overview: 'Provides a bicycle to girls from eligible families when they join Std 9, so distance does not stop their secondary education.',
    amount: 'Free bicycle', benefits: ['A bicycle handed over through the school'],
    eligibilitySummary: 'Girls joining Std 9 · income up to ₹1.2 lakh', incomeLimit: 120000, gender: 'Female', standards: ['9'],
    eligibility: ['Girl student admitted to Std 9', 'Belongs to an eligible category as per notification', 'Annual family income up to ₹1,20,000'],
    documents: [D.aadhaar, D.photo, D.income, D.bonafide], start: '2026-07-01', end: '2026-12-31', bank: false,
  },
  {
    id: 'fellowship-sc', name: 'Research Fellowship for SC Scholars', department: SJED, category: 'SC', level: 'higher', icon: 'pi pi-search',
    short: 'Monthly fellowship for SC students in M.Phil. and Ph.D. programmes.',
    overview: 'Monthly fellowship and contingency grant for SC research scholars registered for M.Phil. / Ph.D. in recognised universities.',
    amount: 'Monthly fellowship + contingency grant', benefits: ['Monthly fellowship during the research period', 'Annual contingency grant', 'Paid by DBT'],
    eligibilitySummary: 'SC scholars in M.Phil./Ph.D. · 55%+ in PG', incomeLimit: 600000, minPercent: 55,
    eligibility: ['Belongs to a Scheduled Caste notified in Gujarat', 'Registered for M.Phil. / Ph.D. in a recognised university', 'At least 55% in post-graduation'],
    documents: [D.aadhaar, D.photo, D.caste, D.income, D.marksheet, D.bonafide, D.bank], start: '2026-09-01', end: '2026-12-31', bank: true,
  },
  {
    id: 'post-matric-ntdnt', name: 'Post-Matric Scholarship for NT-DNT Students', department: 'Developing Castes Welfare', category: 'NT-DNT', level: 'post', icon: 'pi pi-graduation-cap',
    short: 'Scholarship for Nomadic and Denotified Tribe students after Std 10.',
    overview: 'Fee support and scholarship for students from Nomadic and Denotified Tribes in post-matric courses.',
    amount: 'Fee support + scholarship', benefits: ['Fee support for recognised courses', 'Annual scholarship amount', 'Paid by DBT'],
    eligibilitySummary: 'NT-DNT students in Std 11+ · income up to ₹2.5 lakh', incomeLimit: 250000,
    eligibility: ['Belongs to a notified Nomadic / Denotified Tribe', 'Studying in a recognised post-matric course', 'Annual family income up to ₹2,50,000'],
    documents: [D.aadhaar, D.photo, D.caste, D.income, D.marksheet, D.fee, D.bank], start: '2026-09-01', end: '2026-12-31', bank: true,
  },
  {
    id: 'coaching-sc', name: 'Coaching Assistance for SC Students', department: SJED, category: 'SC', level: 'higher', icon: 'pi pi-chart-line',
    short: 'Help with coaching fees for competitive exams such as UPSC, GPSC and banking.',
    overview: 'Supports SC graduates preparing for competitive examinations by paying part of the coaching fee at empanelled institutes.',
    amount: 'Coaching fee assistance', benefits: ['Part of the coaching fee at empanelled institutes', 'Paid to the student account'],
    eligibilitySummary: 'SC graduates preparing for exams · income up to ₹6 lakh', incomeLimit: 600000,
    eligibility: ['Belongs to a Scheduled Caste notified in Gujarat', 'Graduate preparing for a recognised competitive exam', 'Annual family income up to ₹6,00,000'],
    documents: [D.aadhaar, D.photo, D.caste, D.income, D.marksheet, D.bonafide, D.bank], start: '2026-11-01', end: '2027-01-31', bank: true,
  },
];

/** Application window status relative to today. */
export function schStatus(s: Scholarship, today = new Date()): 'open' | 'upcoming' | 'closed' {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const start = new Date(s.start + 'T00:00:00').getTime(), end = new Date(s.end + 'T00:00:00').getTime();
  return d < start ? 'upcoming' : d > end ? 'closed' : 'open';
}
export const fmtDate = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
export const levelLabel: Record<SchLevel, string> = { pre: 'School (Pre-Matric)', post: 'Post-Matric', higher: 'Higher Education' };
