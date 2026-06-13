// prisma/seed.ts
// Run: npx ts-node prisma/seed.ts
// Or:  npx prisma db seed

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

async function main() {
  console.log("🌱 Seeding PACKPRO ERP database…");

  // ─── Company Settings ──────────────────────────────────────────────────────
  await db.companySettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "PACKPRO Food Packaging Solutions",
      tagline: "Premium Food Packaging for Modern Businesses",
      address: "Dholidub, Narnaul-Behror Road",
      city: "Alwar",
      state: "Rajasthan",
      pincode: "301001",
      phone: "+91 9057627625",
      email: "sales@packpro.site",
      supportEmail: "support@packpro.site",
      website: "www.packpro.site",
      gstin: "08PACKP1234A1Z5",
      invoicePrefix: "PPQ",
      invoiceCounter: 1,
      financialYear: "2025-26",
      gstRate: 18,
      currency: "INR",
      currencySymbol: "₹",
    },
  });
  console.log("✅ Company settings");

  // ─── Users ─────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash("packpro@2025", 12);
  const admin = await db.user.upsert({
    where: { email: "admin@packpro.site" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@packpro.site",
      passwordHash: adminHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  const salesHash = await bcrypt.hash("sales@2025", 12);
  await db.user.upsert({
    where: { email: "rahul@packpro.site" },
    update: {},
    create: {
      name: "Rahul Sharma",
      email: "rahul@packpro.site",
      passwordHash: salesHash,
      role: "SALES",
      isActive: true,
    },
  });

  const accHash = await bcrypt.hash("accounts@2025", 12);
  await db.user.upsert({
    where: { email: "priya@packpro.site" },
    update: {},
    create: {
      name: "Priya Verma",
      email: "priya@packpro.site",
      passwordHash: accHash,
      role: "ACCOUNTS",
      isActive: true,
    },
  });
  console.log("✅ Users");

  // ─── Categories ────────────────────────────────────────────────────────────
  const cats = [
    { name: "Paper Cups",       slug: "paper-cups",       icon: "☕" },
    { name: "Food Containers",  slug: "food-containers",  icon: "🥡" },
    { name: "PET Containers",   slug: "pet-containers",   icon: "🧃" },
    { name: "Paper Bags",       slug: "paper-bags",       icon: "🛍️" },
    { name: "Bakery Packaging", slug: "bakery-packaging", icon: "🎂" },
    { name: "Cutlery",          slug: "cutlery",          icon: "🍴" },
    { name: "Tissues",          slug: "tissues",          icon: "📄" },
    { name: "Custom Packaging", slug: "custom-packaging", icon: "✨" },
  ];
  const catMap: Record<string, string> = {};
  for (const cat of cats) {
    const c = await db.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, isActive: true },
    });
    catMap[cat.name] = c.id;
  }
  console.log("✅ Categories");

  // ─── Products ──────────────────────────────────────────────────────────────
  const products = [
    { name: "Paper Cup 8oz Ripple",   code: "CUP-R8OZ",  categoryId: catMap["Paper Cups"],       unit: "pcs",   moq: 500,  gstRate: 18, sellingPrice: 65,  purchasePrice: 48,  stockQty: 12500, status: "PUBLISHED" as const, featured: true  },
    { name: "Paper Cup 12oz Ripple",  code: "CUP-R12OZ", categoryId: catMap["Paper Cups"],       unit: "pcs",   moq: 500,  gstRate: 18, sellingPrice: 82,  purchasePrice: 60,  stockQty: 8200,  status: "PUBLISHED" as const, featured: false },
    { name: "Paper Cup 6oz Plain",    code: "CUP-P6OZ",  categoryId: catMap["Paper Cups"],       unit: "pcs",   moq: 1000, gstRate: 18, sellingPrice: 48,  purchasePrice: 35,  stockQty: 5000,  status: "PUBLISHED" as const, featured: false },
    { name: "Kraft Bowl 500ml",       code: "KBWL-500",  categoryId: catMap["Food Containers"],  unit: "pcs",   moq: 500,  gstRate: 12, sellingPrice: 28,  purchasePrice: 20,  stockQty: 850,   status: "PUBLISHED" as const, featured: false, reorderLevel: 1000 },
    { name: "Kraft Bowl 750ml",       code: "KBWL-750",  categoryId: catMap["Food Containers"],  unit: "pcs",   moq: 500,  gstRate: 12, sellingPrice: 35,  purchasePrice: 26,  stockQty: 3200,  status: "PUBLISHED" as const, featured: false },
    { name: "Meal Box Large Kraft",   code: "MBOX-LK",   categoryId: catMap["Food Containers"],  unit: "pcs",   moq: 500,  gstRate: 12, sellingPrice: 45,  purchasePrice: 32,  stockQty: 320,   status: "PUBLISHED" as const, featured: false, reorderLevel: 500 },
    { name: "Clear PET Cup 350ml",    code: "PET-350",   categoryId: catMap["PET Containers"],   unit: "pcs",   moq: 1000, gstRate: 18, sellingPrice: 15,  purchasePrice: 11,  stockQty: 7500,  status: "PUBLISHED" as const, featured: false },
    { name: "Clear PET Cup 450ml",    code: "PET-450",   categoryId: catMap["PET Containers"],   unit: "pcs",   moq: 1000, gstRate: 18, sellingPrice: 18,  purchasePrice: 13,  stockQty: 4300,  status: "PUBLISHED" as const, featured: true  },
    { name: "Paper Bag Medium SOS",   code: "PBAG-MSOS", categoryId: catMap["Paper Bags"],       unit: "pcs",   moq: 500,  gstRate: 12, sellingPrice: 12,  purchasePrice: 8.5, stockQty: 2100,  status: "PUBLISHED" as const, featured: false },
    { name: "Sweet Box Medium White", code: "SWBX-M",    categoryId: catMap["Bakery Packaging"], unit: "pcs",   moq: 500,  gstRate: 18, sellingPrice: 22,  purchasePrice: 16,  stockQty: 1800,  status: "PUBLISHED" as const, featured: false },
    { name: "Wooden Fork Set 100pc",  code: "CUTF-W100", categoryId: catMap["Cutlery"],          unit: "sets",  moq: 1000, gstRate: 5,  sellingPrice: 8.5, purchasePrice: 6,   stockQty: 5000,  status: "PUBLISHED" as const, featured: false },
    { name: "Napkin 1-Ply 100pcs",    code: "TISN-1P",   categoryId: catMap["Tissues"],          unit: "packs", moq: 2000, gstRate: 5,  sellingPrice: 35,  purchasePrice: 25,  stockQty: 900,   status: "PUBLISHED" as const, featured: false },
  ];

  const productMap: Record<string, string> = {};
  for (const p of products) {
    const prod = await db.product.upsert({
      where: { code: p.code },
      update: {},
      create: {
        ...p,
        reorderLevel: (p as any).reorderLevel ?? 200,
        featured: p.featured,
        isCatalogVisible: true,
      },
    });
    productMap[p.code] = prod.id;
  }
  console.log("✅ Products");

  // ─── Warehouse ─────────────────────────────────────────────────────────────
  await db.warehouse.upsert({
    where: { code: "WH-ALW-01" },
    update: {},
    create: { name: "Alwar Main Warehouse", code: "WH-ALW-01", city: "Alwar", isActive: true },
  });
  console.log("✅ Warehouse");

  // ─── Departments ───────────────────────────────────────────────────────────
  const deptNames = ["Sales", "Accounts", "Operations", "Purchase", "HR", "Management", "Logistics"];
  const deptMap: Record<string, string> = {};
  for (const name of deptNames) {
    const d = await db.department.upsert({ where: { name }, update: {}, create: { name } });
    deptMap[name] = d.id;
  }
  console.log("✅ Departments");

  // ─── Employees ─────────────────────────────────────────────────────────────
  const employeeDefs = [
    { empCode: "EMP-001", name: "Amit Kumar",    email: "amit@packpro.site",   phone: "+91 9812340001", designation: "Sales Manager",       dept: "Sales",       salary: 65000, joinDate: new Date("2023-04-01") },
    { empCode: "EMP-002", name: "Neha Singh",    email: "neha@packpro.site",   phone: "+91 9812340002", designation: "Sales Executive",      dept: "Sales",       salary: 35000, joinDate: new Date("2023-07-15") },
    { empCode: "EMP-003", name: "Vikram Patel",  email: "vikram@packpro.site", phone: "+91 9812340003", designation: "Accounts Manager",     dept: "Accounts",    salary: 55000, joinDate: new Date("2023-05-01") },
    { empCode: "EMP-004", name: "Sunita Devi",   email: "sunita@packpro.site", phone: "+91 9812340004", designation: "Purchase Executive",   dept: "Purchase",    salary: 32000, joinDate: new Date("2023-08-01") },
    { empCode: "EMP-005", name: "Rajesh Gupta",  email: "rajesh@packpro.site", phone: "+91 9812340005", designation: "Warehouse Manager",    dept: "Operations",  salary: 45000, joinDate: new Date("2023-06-01") },
    { empCode: "EMP-006", name: "Anita Sharma",  email: "anita@packpro.site",  phone: "+91 9812340006", designation: "HR Executive",         dept: "HR",          salary: 30000, joinDate: new Date("2024-01-10") },
    { empCode: "EMP-007", name: "Mohan Lal",     email: "mohan@packpro.site",  phone: "+91 9812340007", designation: "Operations Executive", dept: "Operations",  salary: 28000, joinDate: new Date("2024-02-01") },
    { empCode: "EMP-008", name: "Deepak Yadav",  email: "deepak@packpro.site", phone: "+91 9812340008", designation: "Driver/Logistics",     dept: "Logistics",   salary: 25000, joinDate: new Date("2024-03-15") },
  ];

  const empIds: string[] = [];
  for (const e of employeeDefs) {
    const emp = await db.employee.upsert({
      where: { empCode: e.empCode },
      update: {},
      create: {
        empCode:      e.empCode,
        name:         e.name,
        email:        e.email,
        phone:        e.phone,
        designation:  e.designation,
        departmentId: deptMap[e.dept],
        salary:       e.salary,
        joiningDate:  e.joinDate,
        isActive:     true,
      },
    });
    empIds.push(emp.id);
  }
  console.log("✅ Employees");

  // ─── Parties ───────────────────────────────────────────────────────────────
  const partyDefs = [
    { code: "CUS-001", type: "CUSTOMER" as const, name: "Spice Route Restaurant",  contactPerson: "Rajan Mehta",   phone: "+91 9887654321", email: "orders@spiceroute.in",    gstin: "08SPICE1234A1Z5", address: "12, MI Road",        city: "Jaipur",      state: "Rajasthan",   pincode: "302001", creditDays: 30 },
    { code: "CUS-002", type: "CUSTOMER" as const, name: "Cloud Bites Kitchen",     contactPerson: "Arjun Kapoor",  phone: "+91 9776543210", email: "purchase@cloudbites.com", gstin: "07CLOUD1234A1Z5", address: "B-45, Sector 18",    city: "Delhi",       state: "Delhi",       pincode: "110001", creditDays: 45 },
    { code: "CUS-003", type: "CUSTOMER" as const, name: "The Coffee Lab",          contactPerson: "Priya Nair",    phone: "+91 9665432109", email: "ops@thecoffeelab.in",     gstin: "06COFFE1234A1Z5", address: "Plot 7, Udyog Vihar", city: "Gurugram",    state: "Haryana",     pincode: "122001", creditDays: 30 },
    { code: "CUS-004", type: "CUSTOMER" as const, name: "Mumbai Chai Co.",         contactPerson: "Sanjay Thakur", phone: "+91 9554321098", email: "hello@mumbaichain.com",   gstin: "27MCHAI1234A1Z5", address: "22, Andheri East",   city: "Mumbai",      state: "Maharashtra", pincode: "400069", creditDays: 30 },
    { code: "CUS-005", type: "CUSTOMER" as const, name: "Bengaluru Bakes",         contactPerson: "Kavitha Rao",   phone: "+91 9443210987", email: "orders@bengalurubakes.in",gstin: "29BBAKE1234A1Z5", address: "14, Koramangala",    city: "Bengaluru",   state: "Karnataka",   pincode: "560034", creditDays: 45 },
    { code: "CUS-006", type: "CUSTOMER" as const, name: "Delhi Dhabha Chain",      contactPerson: "Harish Yadav",  phone: "+91 9332109876", email: "supply@delhidhabha.com",  gstin: "07DDELH1234A1Z5", address: "A-101, Lajpat Nagar", city: "Delhi",      state: "Delhi",       pincode: "110024", creditDays: 30 },
    { code: "CUS-007", type: "CUSTOMER" as const, name: "Pinkcity Caterers",       contactPerson: "Suresh Agarwal",phone: "+91 9221098765", email: "info@pinkcitycaters.com", gstin: "08PINKC1234A1Z5", address: "68, Tonk Road",      city: "Jaipur",      state: "Rajasthan",   pincode: "302015", creditDays: 15 },
    { code: "CUS-008", type: "CUSTOMER" as const, name: "QSR Express",             contactPerson: "Rohit Sinha",   phone: "+91 9110987654", email: "procurement@qsrexpress.in",gstin:"09QSREX1234A1Z5", address: "Sector 62, NOIDA",  city: "Noida",       state: "Uttar Pradesh",pincode:"201309", creditDays: 45 },
    { code: "VEN-001", type: "VENDOR"   as const, name: "Raj Paper Mills",         contactPerson: "Dinesh Kumar",  phone: "+91 9099876543", email: "sales@rajpaper.com",      gstin: "06RAJPM1234A1Z5", address: "HSIIDC Industrial Area",city: "Faridabad",  state: "Haryana",     pincode: "121001", creditDays: 60 },
    { code: "VEN-002", type: "VENDOR"   as const, name: "PET Solutions Pvt Ltd",   contactPerson: "Manish Shah",   phone: "+91 9988765432", email: "orders@petsolutions.in",  gstin: "27PETSO1234A1Z5", address: "MIDC, Andheri",      city: "Mumbai",      state: "Maharashtra", pincode: "400093", creditDays: 45 },
    { code: "VEN-003", type: "VENDOR"   as const, name: "PrintPack Industries",    contactPerson: "Alok Verma",    phone: "+91 9877654321", email: "info@printpack.co.in",    gstin: "07PRIPA1234A1Z5", address: "G-12, Mayapuri Indl", city: "Delhi",       state: "Delhi",       pincode: "110064", creditDays: 30 },
  ];

  const partyMap: Record<string, string> = {};
  for (const p of partyDefs) {
    const party = await db.party.upsert({
      where: { code: p.code },
      update: {},
      create: { ...p, country: "India", isActive: true, source: p.type === "CUSTOMER" ? "WEBSITE" : undefined },
    });
    partyMap[p.code] = party.id;
  }
  console.log("✅ Parties");

  // ─── Leads ─────────────────────────────────────────────────────────────────
  const leadDefs = [
    { title: "Paper cups bulk order - FastBite Outlets",    company: "FastBite Outlets",      phone: "+91 9711223344", email: "ops@fastbite.in",      source: "WEBSITE"   as const, status: "NEW"         as const, priority: "HIGH"   as const, value: 250000 },
    { title: "Kraft containers - HotPot Cloud Kitchen",     company: "HotPot Cloud Kitchen",  phone: "+91 9622334455", email: "buy@hotpot.in",        source: "WHATSAPP"  as const, status: "CONTACTED"   as const, priority: "MEDIUM" as const, value: 180000 },
    { title: "Custom print cups - BeanThere Cafe",          company: "BeanThere Cafe",        phone: "+91 9533445566", email: "info@beanthere.com",   source: "REFERRAL"  as const, status: "QUALIFIED"   as const, priority: "HIGH"   as const, value: 420000 },
    { title: "PET cups inquiry - Smoothie Station",         company: "Smoothie Station",      phone: "+91 9444556677", email: "orders@smoothiest.in", source: "INSTAGRAM" as const, status: "PROPOSAL"    as const, priority: "MEDIUM" as const, value: 95000  },
    { title: "Meal boxes - Tiffin Express",                 company: "Tiffin Express",        phone: "+91 9355667788", email: "purchase@tiffinex.com",source: "GOOGLE"    as const, status: "NEGOTIATION" as const, priority: "URGENT" as const, value: 650000 },
    { title: "Paper bags - Sweets & More",                  company: "Sweets & More",         phone: "+91 9266778899", email: "admin@sweetsmore.in",  source: "REFERRAL"  as const, status: "WON"         as const, priority: "HIGH"   as const, value: 320000 },
    { title: "Eco packaging - GreenBowl Restaurant",        company: "GreenBowl Restaurant",  phone: "+91 9177889900", email: "eco@greenbowl.in",     source: "WEBSITE"   as const, status: "LOST"        as const, priority: "LOW"    as const, value: 75000  },
    { title: "Disposable cutlery - EventMasters",           company: "EventMasters",          phone: "+91 9088990011", email: "buy@eventmasters.in",  source: "COLD_CALL" as const, status: "CONTACTED"   as const, priority: "MEDIUM" as const, value: 120000 },
    { title: "Bulk cups - ChaiFi Franchise",               company: "ChaiFi Franchise",      phone: "+91 8999001122", email: "franchise@chaifi.com", source: "EXHIBITION"as const, status: "QUALIFIED"   as const, priority: "URGENT" as const, value: 800000 },
    { title: "Paper containers - TastyBite QSR",           company: "TastyBite QSR",         phone: "+91 8810112233", email: "ops@tastybite.in",     source: "WHATSAPP"  as const, status: "NEW"         as const, priority: "MEDIUM" as const, value: 200000 },
    { title: "Sweet boxes - Royal Mithai",                  company: "Royal Mithai",          phone: "+91 8721223344", email: "orders@royalmithai.in",source: "REFERRAL"  as const, status: "PROPOSAL"    as const, priority: "HIGH"   as const, value: 380000 },
    { title: "Custom branded cups - FreshJuice Bar",        company: "FreshJuice Bar",        phone: "+91 8632334455", email: "hi@freshjuicebar.in",  source: "INSTAGRAM" as const, status: "NEGOTIATION" as const, priority: "HIGH"   as const, value: 550000 },
    { title: "PET containers - IceCream Palace",            company: "IceCream Palace",       phone: "+91 8543445566", email: "buy@icecreampalace.in",source: "WEBSITE"   as const, status: "WON"         as const, priority: "HIGH"   as const, value: 290000 },
    { title: "Tissue packs - HospitalityCo",               company: "HospitalityCo",         phone: "+91 8454556677", email: "purchase@hospco.in",   source: "COLD_CALL" as const, status: "NEW"         as const, priority: "LOW"    as const, value: 50000  },
    { title: "Bakery boxes - The Cake Studio",              company: "The Cake Studio",       phone: "+91 8365667788", email: "info@cakestudio.in",   source: "GOOGLE"    as const, status: "CONTACTED"   as const, priority: "MEDIUM" as const, value: 140000 },
  ];

  for (const lead of leadDefs) {
    const existing = await db.lead.findFirst({ where: { title: lead.title } });
    if (!existing) {
      await db.lead.create({
        data: {
          ...lead,
          assignedToId: admin.id,
          followUpDate: addDays(new Date(), 3),
          lostReason: lead.status === "LOST" ? "Price too high compared to competitor" : undefined,
          closedAt: (lead.status === "WON" || lead.status === "LOST") ? daysAgo(5) : undefined,
        },
      });
    }
  }
  console.log("✅ Leads (15)");

  // ─── Quotes ────────────────────────────────────────────────────────────────
  const quoteDefs = [
    {
      number: "PPQ/25-26/001", code: "CUS-001", status: "CONVERTED" as const,
      validTill: addDays(new Date(), -10),
      items: [
        { code: "CUP-R8OZ",  qty: 2000, unitPrice: 63, gstRate: 18 },
        { code: "PBAG-MSOS", qty: 1000, unitPrice: 11, gstRate: 12 },
      ],
    },
    {
      number: "PPQ/25-26/002", code: "CUS-002", status: "APPROVED" as const,
      validTill: addDays(new Date(), 20),
      items: [
        { code: "KBWL-500",  qty: 1500, unitPrice: 27, gstRate: 12 },
        { code: "KBWL-750",  qty: 1000, unitPrice: 34, gstRate: 12 },
        { code: "CUTF-W100", qty: 500,  unitPrice: 8,  gstRate: 5  },
      ],
    },
    {
      number: "PPQ/25-26/003", code: "CUS-003", status: "SENT" as const,
      validTill: addDays(new Date(), 15),
      items: [
        { code: "CUP-R12OZ", qty: 3000, unitPrice: 80, gstRate: 18 },
        { code: "TISN-1P",   qty: 200,  unitPrice: 34, gstRate: 5  },
      ],
    },
    {
      number: "PPQ/25-26/004", code: "CUS-004", status: "DRAFT" as const,
      validTill: addDays(new Date(), 30),
      items: [
        { code: "PET-350",   qty: 5000, unitPrice: 14, gstRate: 18 },
        { code: "PET-450",   qty: 3000, unitPrice: 17, gstRate: 18 },
      ],
    },
    {
      number: "PPQ/25-26/005", code: "CUS-005", status: "CONVERTED" as const,
      validTill: addDays(new Date(), -5),
      items: [
        { code: "SWBX-M",   qty: 2000, unitPrice: 21, gstRate: 18 },
        { code: "PBAG-MSOS",qty: 500,  unitPrice: 11, gstRate: 12 },
      ],
    },
    {
      number: "PPQ/25-26/006", code: "CUS-006", status: "SENT" as const,
      validTill: addDays(new Date(), 25),
      items: [
        { code: "MBOX-LK",  qty: 2000, unitPrice: 44, gstRate: 12 },
        { code: "CUP-P6OZ", qty: 3000, unitPrice: 46, gstRate: 18 },
      ],
    },
    {
      number: "PPQ/25-26/007", code: "CUS-007", status: "APPROVED" as const,
      validTill: addDays(new Date(), 10),
      items: [
        { code: "SWBX-M",    qty: 3000, unitPrice: 21, gstRate: 18 },
        { code: "CUTF-W100", qty: 1000, unitPrice: 8,  gstRate: 5  },
        { code: "TISN-1P",   qty: 300,  unitPrice: 34, gstRate: 5  },
      ],
    },
    {
      number: "PPQ/25-26/008", code: "CUS-008", status: "CONVERTED" as const,
      validTill: addDays(new Date(), -2),
      items: [
        { code: "CUP-R8OZ",  qty: 5000, unitPrice: 62, gstRate: 18 },
        { code: "PET-450",   qty: 2000, unitPrice: 17, gstRate: 18 },
      ],
    },
  ];

  const quoteMap: Record<string, string> = {};
  for (const q of quoteDefs) {
    const existing = await db.quote.findFirst({ where: { number: q.number } });
    if (existing) { quoteMap[q.number] = existing.id; continue; }

    let subtotal = 0;
    let taxAmount = 0;
    for (const item of q.items) {
      const lineBase = item.qty * item.unitPrice;
      subtotal += lineBase;
      taxAmount += lineBase * (item.gstRate / 100);
    }
    const total = subtotal + taxAmount;

    const quote = await db.quote.create({
      data: {
        number:      q.number,
        partyId:     partyMap[q.code],
        createdById: admin.id,
        status:      q.status,
        validTill:   q.validTill,
        subtotal,
        taxAmount:   Math.round(taxAmount),
        total:       Math.round(total),
        items: {
          create: q.items.map(item => {
            const lineBase = item.qty * item.unitPrice;
            const gstAmt = lineBase * (item.gstRate / 100);
            return {
              productId: productMap[item.code],
              qty:       item.qty,
              unitPrice: item.unitPrice,
              gstRate:   item.gstRate,
              gstAmount: Math.round(gstAmt),
              total:     Math.round(lineBase + gstAmt),
            };
          }),
        },
      },
    });
    quoteMap[q.number] = quote.id;
  }
  console.log("✅ Quotes (8)");

  // ─── Sales Orders ──────────────────────────────────────────────────────────
  const soDefs = [
    {
      number: "SO/25-26/001", partyCode: "CUS-001", quoteNumber: "PPQ/25-26/001", status: "DELIVERED" as const,
      items: [{ code: "CUP-R8OZ", qty: 2000, unitPrice: 63, gstRate: 18 }, { code: "PBAG-MSOS", qty: 1000, unitPrice: 11, gstRate: 12 }],
    },
    {
      number: "SO/25-26/002", partyCode: "CUS-005", quoteNumber: "PPQ/25-26/005", status: "PROCESSING" as const,
      items: [{ code: "SWBX-M", qty: 2000, unitPrice: 21, gstRate: 18 }, { code: "PBAG-MSOS", qty: 500, unitPrice: 11, gstRate: 12 }],
    },
    {
      number: "SO/25-26/003", partyCode: "CUS-008", quoteNumber: "PPQ/25-26/008", status: "CONFIRMED" as const,
      items: [{ code: "CUP-R8OZ", qty: 5000, unitPrice: 62, gstRate: 18 }, { code: "PET-450", qty: 2000, unitPrice: 17, gstRate: 18 }],
    },
    {
      number: "SO/25-26/004", partyCode: "CUS-003", quoteNumber: undefined, status: "READY" as const,
      items: [{ code: "CUP-R12OZ", qty: 2000, unitPrice: 80, gstRate: 18 }, { code: "TISN-1P", qty: 100, unitPrice: 34, gstRate: 5 }],
    },
    {
      number: "SO/25-26/005", partyCode: "CUS-002", quoteNumber: undefined, status: "CONFIRMED" as const,
      items: [{ code: "KBWL-500", qty: 1500, unitPrice: 27, gstRate: 12 }, { code: "KBWL-750", qty: 500, unitPrice: 34, gstRate: 12 }],
    },
  ];

  const soMap: Record<string, string> = {};
  for (const so of soDefs) {
    const existing = await db.salesOrder.findFirst({ where: { number: so.number } });
    if (existing) { soMap[so.number] = existing.id; continue; }

    let subtotal = 0, taxAmount = 0;
    for (const item of so.items) {
      const base = item.qty * item.unitPrice;
      subtotal += base;
      taxAmount += base * (item.gstRate / 100);
    }
    const total = subtotal + taxAmount;

    const order = await db.salesOrder.create({
      data: {
        number:      so.number,
        partyId:     partyMap[so.partyCode],
        quoteId:     so.quoteNumber ? quoteMap[so.quoteNumber] : undefined,
        createdById: admin.id,
        status:      so.status,
        subtotal,
        taxAmount:   Math.round(taxAmount),
        total:       Math.round(total),
        deliveryDate: addDays(new Date(), 7),
        items: {
          create: so.items.map(item => {
            const base = item.qty * item.unitPrice;
            const gstAmt = base * (item.gstRate / 100);
            return {
              productId: productMap[item.code],
              qty:       item.qty,
              unitPrice: item.unitPrice,
              gstRate:   item.gstRate,
              gstAmount: Math.round(gstAmt),
              total:     Math.round(base + gstAmt),
            };
          }),
        },
      },
    });
    soMap[so.number] = order.id;
  }
  console.log("✅ Sales Orders (5)");

  // ─── Invoices ──────────────────────────────────────────────────────────────
  const invoiceDefs = [
    { number: "INV/25-26/001", partyCode: "CUS-001", status: "PAID"           as const, daysOffset: -45, dueOffset: 15, subtotal: 152000, taxRate: 18, amtPaid: 0 },
    { number: "INV/25-26/002", partyCode: "CUS-002", status: "PAID"           as const, daysOffset: -38, dueOffset: 30, subtotal: 89500,  taxRate: 12, amtPaid: 0 },
    { number: "INV/25-26/003", partyCode: "CUS-003", status: "SENT"           as const, daysOffset: -20, dueOffset: 30, subtotal: 245000, taxRate: 18, amtPaid: 0 },
    { number: "INV/25-26/004", partyCode: "CUS-004", status: "OVERDUE"        as const, daysOffset: -60, dueOffset: 30, subtotal: 67000,  taxRate: 18, amtPaid: 0 },
    { number: "INV/25-26/005", partyCode: "CUS-005", status: "PARTIALLY_PAID" as const, daysOffset: -30, dueOffset: 15, subtotal: 185000, taxRate: 18, amtPaid: 100000 },
    { number: "INV/25-26/006", partyCode: "CUS-006", status: "PAID"           as const, daysOffset: -55, dueOffset: 30, subtotal: 310000, taxRate: 12, amtPaid: 0 },
    { number: "INV/25-26/007", partyCode: "CUS-007", status: "SENT"           as const, daysOffset: -10, dueOffset: 15, subtotal: 54500,  taxRate: 18, amtPaid: 0 },
    { number: "INV/25-26/008", partyCode: "CUS-008", status: "OVERDUE"        as const, daysOffset: -50, dueOffset: 20, subtotal: 128000, taxRate: 18, amtPaid: 0 },
    { number: "INV/25-26/009", partyCode: "CUS-001", status: "PAID"           as const, daysOffset: -15, dueOffset: 30, subtotal: 95000,  taxRate: 18, amtPaid: 0 },
    { number: "INV/25-26/010", partyCode: "CUS-003", status: "PARTIALLY_PAID" as const, daysOffset: -25, dueOffset: 30, subtotal: 350000, taxRate: 18, amtPaid: 200000 },
    { number: "INV/25-26/011", partyCode: "CUS-004", status: "SENT"           as const, daysOffset: -5,  dueOffset: 45, subtotal: 42000,  taxRate: 5,  amtPaid: 0 },
    { number: "INV/25-26/012", partyCode: "CUS-002", status: "PAID"           as const, daysOffset: -70, dueOffset: 30, subtotal: 175000, taxRate: 18, amtPaid: 0 },
  ];

  for (const inv of invoiceDefs) {
    const existing = await db.invoice.findFirst({ where: { number: inv.number } });
    if (existing) continue;

    const taxAmount = Math.round(inv.subtotal * (inv.taxRate / 100));
    const total     = inv.subtotal + taxAmount;
    const amtPaid   = inv.status === "PAID" ? total : inv.amtPaid;
    const balanceDue = total - amtPaid;
    const invoiceDate = daysAgo(-inv.daysOffset); // negative offset = days ago
    const dueDate = addDays(invoiceDate, inv.dueOffset);

    await db.invoice.create({
      data: {
        number:    inv.number,
        partyId:   partyMap[inv.partyCode],
        type:      "TAX_INVOICE",
        status:    inv.status,
        date:      invoiceDate,
        dueDate,
        subtotal:  inv.subtotal,
        taxAmount,
        total,
        amountPaid: amtPaid,
        balanceDue,
        items: {
          create: [{
            description: "Food Packaging Supplies",
            qty:         1,
            unitPrice:   inv.subtotal,
            gstRate:     inv.taxRate,
            cgst:        Math.round(taxAmount / 2),
            sgst:        Math.round(taxAmount / 2),
            total,
          }],
        },
      },
    });
  }
  console.log("✅ Invoices (12)");

  // ─── Purchase Orders ───────────────────────────────────────────────────────
  const poDefs = [
    {
      number: "PO/25-26/001", vendorCode: "VEN-001", status: "RECEIVED" as const,
      items: [{ code: "CUP-R8OZ", qty: 10000, unitPrice: 46, gstRate: 18 }, { code: "CUP-R12OZ", qty: 5000, unitPrice: 58, gstRate: 18 }],
    },
    {
      number: "PO/25-26/002", vendorCode: "VEN-002", status: "CONFIRMED" as const,
      items: [{ code: "PET-350", qty: 20000, unitPrice: 10, gstRate: 18 }, { code: "PET-450", qty: 15000, unitPrice: 12, gstRate: 18 }],
    },
    {
      number: "PO/25-26/003", vendorCode: "VEN-001", status: "RECEIVED" as const,
      items: [{ code: "KBWL-500", qty: 8000, unitPrice: 19, gstRate: 12 }, { code: "MBOX-LK", qty: 5000, unitPrice: 30, gstRate: 12 }],
    },
    {
      number: "PO/25-26/004", vendorCode: "VEN-003", status: "CONFIRMED" as const,
      items: [{ code: "PBAG-MSOS", qty: 10000, unitPrice: 8, gstRate: 12 }, { code: "SWBX-M", qty: 5000, unitPrice: 15, gstRate: 18 }],
    },
  ];

  for (const po of poDefs) {
    const existing = await db.purchaseOrder.findFirst({ where: { number: po.number } });
    if (existing) continue;

    let subtotal = 0, taxAmount = 0;
    for (const item of po.items) {
      const base = item.qty * item.unitPrice;
      subtotal += base;
      taxAmount += base * (item.gstRate / 100);
    }
    const total = subtotal + taxAmount;

    await db.purchaseOrder.create({
      data: {
        number:       po.number,
        vendorId:     partyMap[po.vendorCode],
        status:       po.status,
        subtotal,
        taxAmount:    Math.round(taxAmount),
        total:        Math.round(total),
        expectedDate: addDays(new Date(), 14),
        items: {
          create: po.items.map(item => {
            const base = item.qty * item.unitPrice;
            const gstAmt = base * (item.gstRate / 100);
            return {
              productId: productMap[item.code],
              qty:       item.qty,
              unitPrice: item.unitPrice,
              gstRate:   item.gstRate,
              gstAmount: Math.round(gstAmt),
              total:     Math.round(base + gstAmt),
              received:  po.status === "RECEIVED" ? item.qty : 0,
            };
          }),
        },
      },
    });
  }
  console.log("✅ Purchase Orders (4)");

  // ─── Attendance (last 30 days for all 8 employees) ─────────────────────────
  // Statuses by probability: PRESENT 80%, ABSENT 10%, HALF_DAY 5%, LEAVE 5%
  const statusPool: ("PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE")[] = [
    "PRESENT","PRESENT","PRESENT","PRESENT","PRESENT","PRESENT","PRESENT","PRESENT",
    "ABSENT","ABSENT",
    "HALF_DAY",
    "LEAVE",
  ];

  let attCount = 0;
  for (let dayOffset = 30; dayOffset >= 1; dayOffset--) {
    const date = daysAgo(dayOffset);
    if (isWeekend(date)) continue;

    for (let eIdx = 0; eIdx < empIds.length; eIdx++) {
      const statusIdx = (dayOffset * 7 + eIdx * 3) % statusPool.length;
      const status    = statusPool[statusIdx];
      const checkIn   = status === "PRESENT" || status === "HALF_DAY"
        ? new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 15, 0)
        : undefined;
      const checkOut  = status === "PRESENT"
        ? new Date(date.getFullYear(), date.getMonth(), date.getDate(), 18, 30, 0)
        : status === "HALF_DAY"
        ? new Date(date.getFullYear(), date.getMonth(), date.getDate(), 13, 30, 0)
        : undefined;

      const existing = await db.attendance.findFirst({
        where: { employeeId: empIds[eIdx], date },
      });
      if (!existing) {
        await db.attendance.create({
          data: { employeeId: empIds[eIdx], date, status, checkIn, checkOut },
        });
        attCount++;
      }
    }
  }
  console.log(`✅ Attendance records (${attCount} created)`);

  // ─── Payroll (current month for all 8 employees) ───────────────────────────
  const now       = new Date();
  const curMonth  = now.getMonth() + 1; // 1-based
  const curYear   = now.getFullYear();
  // Last month (mark as PAID)
  const lastMonth = curMonth === 1 ? 12 : curMonth - 1;
  const lastYear  = curMonth === 1 ? curYear - 1 : curYear;

  for (let i = 0; i < employeeDefs.length; i++) {
    const emp     = employeeDefs[i];
    const empId   = empIds[i];
    const basic   = emp.salary;
    const hra     = Math.round(basic * 0.2);
    const allowance = Math.round(basic * 0.1);
    const pf      = Math.round(basic * 0.12);
    const esi     = basic <= 21000 ? Math.round(basic * 0.0075) : 0;
    const gross   = basic + hra + allowance;
    const net     = gross - pf - esi;

    // Last month — PAID
    await db.payroll.upsert({
      where: { employeeId_month_year: { employeeId: empId, month: lastMonth, year: lastYear } } as any,
      update: {},
      create: {
        employeeId: empId, month: lastMonth, year: lastYear,
        basic, hra, allowances: allowance, pf, esi, tds: 0, otherDeductions: 0,
        gross, net, status: "PAID", paidAt: daysAgo(5),
      },
    }).catch(async () => {
      const ex = await db.payroll.findFirst({ where: { employeeId: empId, month: lastMonth, year: lastYear } });
      if (!ex) {
        await db.payroll.create({
          data: {
            employeeId: empId, month: lastMonth, year: lastYear,
            basic, hra, allowances: allowance, pf, esi, tds: 0, otherDeductions: 0,
            gross, net, status: "PAID", paidAt: daysAgo(5),
          },
        });
      }
    });

    // Current month — PROCESSED
    const ex2 = await db.payroll.findFirst({ where: { employeeId: empId, month: curMonth, year: curYear } });
    if (!ex2) {
      await db.payroll.create({
        data: {
          employeeId: empId, month: curMonth, year: curYear,
          basic, hra, allowances: allowance, pf, esi, tds: 0, otherDeductions: 0,
          gross, net, status: "PROCESSED",
        },
      });
    }
  }
  console.log("✅ Payroll (last month PAID + current month PROCESSED)");

  // ─── Done ──────────────────────────────────────────────────────────────────
  console.log("\n🎉 Seed complete!");
  console.log("────────────────────────────────────────────────");
  console.log("Login credentials:");
  console.log("  Admin:    admin@packpro.site  /  packpro@2025");
  console.log("  Sales:    rahul@packpro.site  /  sales@2025");
  console.log("  Accounts: priya@packpro.site  /  accounts@2025");
  console.log("────────────────────────────────────────────────");
  console.log("Seeded:");
  console.log("  • 3 users            • 8 categories      • 12 products");
  console.log("  • 1 warehouse        • 7 departments      • 8 employees");
  console.log("  • 11 parties         • 15 leads           • 8 quotes");
  console.log("  • 5 sales orders     • 12 invoices        • 4 purchase orders");
  console.log("  • Attendance (30d)   • Payroll (2 months)");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
