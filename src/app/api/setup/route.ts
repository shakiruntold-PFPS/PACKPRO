import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(9, 0, 0, 0);
  return d;
}
function isWeekend(d: Date) { return d.getDay() === 0 || d.getDay() === 6; }

export async function GET() {
  return POST(new Request("http://localhost/api/setup", { method: "POST" }));
}

export async function POST(_req: Request) {
  try {
    const results: string[] = [];

    // ── Company ──────────────────────────────────────────────────────────────
    await db.companySettings.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
        name: "PACKPRO Food Packaging Solutions",
        tagline: "Premium Food Packaging for Modern Businesses",
        address: "Dholidub, Narnaul-Behror Road",
        city: "Alwar", state: "Rajasthan", pincode: "301001",
        phone: "+91 9057627625", email: "sales@packpro.site",
        supportEmail: "support@packpro.site", website: "www.packpro.site",
        gstin: "08PACKP1234A1Z5", invoicePrefix: "PPQ", invoiceCounter: 100,
        financialYear: "2025-26", gstRate: 18, currency: "INR", currencySymbol: "₹",
      },
    });

    // ── Users ────────────────────────────────────────────────────────────────
    const admin = await db.user.upsert({
      where: { email: "admin@packpro.site" },
      update: {},
      create: { name: "Admin User", email: "admin@packpro.site", passwordHash: await bcrypt.hash("packpro@2025", 12), role: "SUPER_ADMIN", isActive: true },
    });
    await db.user.upsert({
      where: { email: "rahul@packpro.site" },
      update: {},
      create: { name: "Rahul Sharma", email: "rahul@packpro.site", passwordHash: await bcrypt.hash("sales@2025", 12), role: "SALES", isActive: true },
    });
    await db.user.upsert({
      where: { email: "priya@packpro.site" },
      update: {},
      create: { name: "Priya Verma", email: "priya@packpro.site", passwordHash: await bcrypt.hash("accounts@2025", 12), role: "ACCOUNTS", isActive: true },
    });
    results.push("✅ Users (admin / sales / accounts)");

    // ── Categories ───────────────────────────────────────────────────────────
    const catMap: Record<string, string> = {};
    for (const cat of [
      { name: "Paper Cups",       slug: "paper-cups",       icon: "☕" },
      { name: "Food Containers",  slug: "food-containers",  icon: "🥡" },
      { name: "PET Containers",   slug: "pet-containers",   icon: "🧃" },
      { name: "Paper Bags",       slug: "paper-bags",       icon: "🛍️" },
      { name: "Bakery Packaging", slug: "bakery-packaging", icon: "🎂" },
      { name: "Cutlery",          slug: "cutlery",          icon: "🍴" },
      { name: "Tissues",          slug: "tissues",          icon: "📄" },
      { name: "Custom Packaging", slug: "custom-packaging", icon: "✨" },
    ]) {
      const c = await db.category.upsert({ where: { slug: cat.slug }, update: {}, create: { ...cat, isActive: true } });
      catMap[cat.name] = c.id;
    }

    // ── Products ─────────────────────────────────────────────────────────────
    const productMap: Record<string, string> = {};
    for (const p of [
      { name: "Paper Cup 8oz Ripple",   code: "CUP-R8OZ",  cat: "Paper Cups",       unit: "pcs",   moq: 500,  gst: 18, sell: 65,  buy: 48,  stock: 12500, rl: 1000, feat: true  },
      { name: "Paper Cup 12oz Ripple",  code: "CUP-R12OZ", cat: "Paper Cups",       unit: "pcs",   moq: 500,  gst: 18, sell: 82,  buy: 60,  stock: 8200,  rl: 1000, feat: false },
      { name: "Paper Cup 6oz Plain",    code: "CUP-P6OZ",  cat: "Paper Cups",       unit: "pcs",   moq: 1000, gst: 18, sell: 48,  buy: 35,  stock: 5000,  rl: 500,  feat: false },
      { name: "Kraft Bowl 500ml",       code: "KBWL-500",  cat: "Food Containers",  unit: "pcs",   moq: 500,  gst: 12, sell: 28,  buy: 20,  stock: 85,    rl: 1000, feat: false },
      { name: "Kraft Bowl 750ml",       code: "KBWL-750",  cat: "Food Containers",  unit: "pcs",   moq: 500,  gst: 12, sell: 35,  buy: 26,  stock: 3200,  rl: 500,  feat: false },
      { name: "Meal Box Large Kraft",   code: "MBOX-LK",   cat: "Food Containers",  unit: "pcs",   moq: 500,  gst: 12, sell: 45,  buy: 32,  stock: 320,   rl: 500,  feat: true  },
      { name: "Clear PET Cup 350ml",    code: "PET-350",   cat: "PET Containers",   unit: "pcs",   moq: 1000, gst: 18, sell: 15,  buy: 11,  stock: 7500,  rl: 2000, feat: false },
      { name: "Clear PET Cup 450ml",    code: "PET-450",   cat: "PET Containers",   unit: "pcs",   moq: 1000, gst: 18, sell: 18,  buy: 13,  stock: 4300,  rl: 2000, feat: true  },
      { name: "Paper Bag Medium SOS",   code: "PBAG-MSOS", cat: "Paper Bags",       unit: "pcs",   moq: 500,  gst: 12, sell: 12,  buy: 8.5, stock: 2100,  rl: 500,  feat: false },
      { name: "Sweet Box Medium White", code: "SWBX-M",    cat: "Bakery Packaging", unit: "pcs",   moq: 500,  gst: 18, sell: 22,  buy: 16,  stock: 1800,  rl: 300,  feat: false },
      { name: "Wooden Fork Set 100pc",  code: "CUTF-W100", cat: "Cutlery",          unit: "sets",  moq: 1000, gst: 5,  sell: 8.5, buy: 6,   stock: 5000,  rl: 500,  feat: false },
      { name: "Napkin 1-Ply 100pcs",    code: "TISN-1P",   cat: "Tissues",          unit: "packs", moq: 2000, gst: 5,  sell: 35,  buy: 25,  stock: 900,   rl: 200,  feat: false },
    ]) {
      const prod = await db.product.upsert({
        where: { code: p.code },
        update: {},
        create: {
          name: p.name, code: p.code, categoryId: catMap[p.cat], unit: p.unit,
          moq: p.moq, gstRate: p.gst, sellingPrice: p.sell, purchasePrice: p.buy,
          stockQty: p.stock, reorderLevel: p.rl, featured: p.feat,
          status: "PUBLISHED", isCatalogVisible: true,
        },
      });
      productMap[p.code] = prod.id;
    }
    results.push("✅ 12 products");

    // ── Warehouse ─────────────────────────────────────────────────────────────
    await db.warehouse.upsert({
      where: { code: "WH-ALW-01" },
      update: {},
      create: { name: "Alwar Main Warehouse", code: "WH-ALW-01", city: "Alwar", isActive: true },
    });

    // ── Departments ───────────────────────────────────────────────────────────
    const deptMap: Record<string, string> = {};
    for (const name of ["Sales", "Accounts", "Operations", "Purchase", "HR", "Management", "Logistics"]) {
      const d = await db.department.upsert({ where: { name }, update: {}, create: { name } });
      deptMap[name] = d.id;
    }

    // ── Employees ─────────────────────────────────────────────────────────────
    const empMap: Record<string, string> = {};
    for (const e of [
      { code: "EMP-001", name: "Amit Kumar",    dept: "Sales",       desig: "Sales Manager",      phone: "+91 98765 11001", salary: 65000, joined: daysAgo(730) },
      { code: "EMP-002", name: "Neha Singh",    dept: "Sales",       desig: "Sales Executive",    phone: "+91 98765 11002", salary: 32000, joined: daysAgo(540) },
      { code: "EMP-003", name: "Vikram Patel",  dept: "Accounts",    desig: "Accounts Manager",   phone: "+91 98765 11003", salary: 55000, joined: daysAgo(620) },
      { code: "EMP-004", name: "Sunita Devi",   dept: "Purchase",    desig: "Purchase Executive", phone: "+91 98765 11004", salary: 28000, joined: daysAgo(410) },
      { code: "EMP-005", name: "Rajesh Gupta",  dept: "Operations",  desig: "Warehouse Manager",  phone: "+91 98765 11005", salary: 40000, joined: daysAgo(800) },
      { code: "EMP-006", name: "Anita Sharma",  dept: "HR",          desig: "HR Executive",       phone: "+91 98765 11006", salary: 30000, joined: daysAgo(365) },
      { code: "EMP-007", name: "Mohan Lal",     dept: "Operations",  desig: "Operations Staff",   phone: "+91 98765 11007", salary: 25000, joined: daysAgo(290) },
      { code: "EMP-008", name: "Deepak Yadav",  dept: "Logistics",   desig: "Driver",             phone: "+91 98765 11008", salary: 22000, joined: daysAgo(200) },
    ]) {
      const emp = await db.employee.upsert({
        where: { empCode: e.code },
        update: {},
        create: {
          empCode: e.code, name: e.name,
          departmentId: deptMap[e.dept] ?? undefined,
          designation: e.desig, phone: e.phone,
          salary: e.salary, joiningDate: e.joined, isActive: true,
        },
      });
      empMap[e.code] = emp.id;
    }
    results.push("✅ 8 employees");

    // ── Parties ───────────────────────────────────────────────────────────────
    const partyMap: Record<string, string> = {};
    for (const p of [
      { code: "CUS-001", type: "CUSTOMER" as const, name: "Spice Route Restaurant",   phone: "+91 98765 43210", email: "orders@spiceroute.in",    city: "Jaipur",     state: "Rajasthan",   gstin: "08SPICE1234C1Z2", credit: 30 },
      { code: "CUS-002", type: "CUSTOMER" as const, name: "Cloud Bites Kitchen",      phone: "+91 87654 32109", email: "purchase@cloudbites.com",  city: "Delhi",      state: "Delhi",       gstin: "07CLOUD5678D2Z3", credit: 15 },
      { code: "CUS-003", type: "CUSTOMER" as const, name: "The Coffee Lab",           phone: "+91 76543 21098", email: "ops@coffeelab.in",         city: "Gurugram",   state: "Haryana",     gstin: "06COFFE9012E3Z4", credit: 21 },
      { code: "CUS-004", type: "CUSTOMER" as const, name: "Mumbai Chai Co.",          phone: "+91 90123 45678", email: "chai@mumbaichai.in",       city: "Mumbai",     state: "Maharashtra", gstin: "27MUMBA3456F4Z5", credit: 30 },
      { code: "CUS-005", type: "CUSTOMER" as const, name: "Bengaluru Bakes",          phone: "+91 80234 56789", email: "ops@bengalurubakes.com",   city: "Bengaluru",  state: "Karnataka",   gstin: "29BENGA7890G5Z6", credit: 14 },
      { code: "CUS-006", type: "CUSTOMER" as const, name: "Pinkcity Caterers",        phone: "+91 94345 67890", email: "accounts@pinkcity.in",     city: "Jaipur",     state: "Rajasthan",   gstin: "08PINKC2345H6Z7", credit: 30 },
      { code: "CUS-007", type: "CUSTOMER" as const, name: "QSR Express",              phone: "+91 95456 78901", email: "purchase@qsrexpress.com",  city: "Noida",      state: "Uttar Pradesh", gstin: "09QSREX6789I7Z8", credit: 7 },
      { code: "CUS-008", type: "CUSTOMER" as const, name: "Delhi Dhabha Chain",       phone: "+91 96567 89012", email: "info@delhidhabha.com",     city: "Delhi",      state: "Delhi",       gstin: "07DELHI0123J8Z9", credit: 45 },
      { code: "VEN-001", type: "VENDOR"   as const, name: "Raj Paper Mills",          phone: "+91 65432 10987", email: "sales@rajpaper.com",       city: "Faridabad",  state: "Haryana",     gstin: "06RAJPM4567K9Z0", credit: 30 },
      { code: "VEN-002", type: "VENDOR"   as const, name: "PET Solutions Pvt Ltd",   phone: "+91 54321 09876", email: "orders@petsolutions.in",   city: "Mumbai",     state: "Maharashtra", gstin: "27PETSO8901L0Z1", credit: 45 },
      { code: "VEN-003", type: "VENDOR"   as const, name: "PrintPack Industries",    phone: "+91 43210 98765", email: "sales@printpack.in",       city: "Delhi",      state: "Delhi",       gstin: "07PRINT2345M1Z2", credit: 30 },
    ]) {
      const exists = await db.party.findUnique({ where: { code: p.code } });
      if (!exists) {
        const party = await db.party.create({
          data: {
            code: p.code, type: p.type, name: p.name, phone: p.phone,
            email: p.email ?? null, city: p.city, state: p.state,
            gstin: p.gstin, creditDays: p.credit, country: "India",
          },
        });
        partyMap[p.code] = party.id;
      } else {
        partyMap[p.code] = exists.id;
      }
    }
    results.push("✅ 11 parties (8 customers, 3 vendors)");

    // ── Leads ─────────────────────────────────────────────────────────────────
    const leadData = [
      { title: "Paper cups 8oz bulk order", company: "Spice Route Restaurant", contact: "Ravi Khanna",   phone: "+91 98765 43210", status: "WON",         source: "WEBSITE",    priority: "HIGH",   value: 450000, daysBack: 45 },
      { title: "Custom branded cups enquiry", company: "Cloud Bites Kitchen",  contact: "Priya Jain",   phone: "+91 87654 32109", status: "NEGOTIATION", source: "WHATSAPP",   priority: "URGENT", value: 780000, daysBack: 12 },
      { title: "Food containers monthly supply", company: "The Coffee Lab",    contact: "Arjun Mehta",  phone: "+91 76543 21098", status: "PROPOSAL",    source: "REFERRAL",   priority: "HIGH",   value: 320000, daysBack: 20 },
      { title: "PET cups for smoothie bar",  company: "Mumbai Chai Co.",       contact: "Sonia Shah",   phone: "+91 90123 45678", status: "QUALIFIED",   source: "INSTAGRAM",  priority: "MEDIUM", value: 185000, daysBack: 8  },
      { title: "Bakery packaging requirement", company: "Bengaluru Bakes",     contact: "Rajan Kumar",  phone: "+91 80234 56789", status: "CONTACTED",   source: "GOOGLE",     priority: "MEDIUM", value: 95000,  daysBack: 5  },
      { title: "Disposable cutlery sets",    company: "Pinkcity Caterers",     contact: "Meena Rao",    phone: "+91 94345 67890", status: "NEW",         source: "EXHIBITION", priority: "LOW",    value: 65000,  daysBack: 2  },
      { title: "Kraft bowls for cloud kitchen", company: "QSR Express",        contact: "Ajay Verma",   phone: "+91 95456 78901", status: "WON",         source: "WHATSAPP",   priority: "HIGH",   value: 560000, daysBack: 60 },
      { title: "Paper bags bulk order",      company: "Delhi Dhabha Chain",    contact: "Mukesh Singh", phone: "+91 96567 89012", status: "LOST",        source: "COLD_CALL",  priority: "LOW",    value: 45000,  daysBack: 90 },
      { title: "Tissue napkins quarterly",   company: "Spice Route Restaurant",contact: "Ravi Khanna",  phone: "+91 98765 43210", status: "NEW",         source: "WEBSITE",    priority: "MEDIUM", value: 120000, daysBack: 1  },
      { title: "Sweet boxes for festival",   company: "Bengaluru Bakes",       contact: "Rajan Kumar",  phone: "+91 80234 56789", status: "QUALIFIED",   source: "REFERRAL",   priority: "HIGH",   value: 250000, daysBack: 7  },
      { title: "OEM packaging design",       company: "PrintPack Industries",  contact: "Anand Gupta",  phone: "+91 43210 98765", status: "PROPOSAL",    source: "WEBSITE",    priority: "URGENT", value: 850000, daysBack: 15 },
      { title: "Monthly cup supply contract",company: "Mumbai Chai Co.",        contact: "Sonia Shah",   phone: "+91 90123 45678", status: "NEGOTIATION", source: "REFERRAL",   priority: "URGENT", value: 1200000,daysBack: 18 },
    ];
    let leadsCreated = 0;
    for (const l of leadData) {
      const existing = await db.lead.findFirst({ where: { title: l.title, company: l.company } });
      if (!existing) {
        await db.lead.create({
          data: {
            title: l.title, company: l.company, contactName: l.contact,
            phone: l.phone, status: l.status as any, source: l.source as any,
            priority: l.priority as any, value: l.value,
            createdAt: daysAgo(l.daysBack),
          },
        });
        leadsCreated++;
      }
    }
    results.push(`✅ ${leadsCreated} leads`);

    // ── Invoices ─────────────────────────────────────────────────────────────
    const invoiceData = [
      { num: "INV/25-26/001", pcode: "CUS-001", days: 60, due: 45, status: "PAID",           total: 156000, tax: 23898, sub: 132102, bal: 0       },
      { num: "INV/25-26/002", pcode: "CUS-002", days: 50, due: 35, status: "PAID",           total: 94500,  tax: 14466, sub: 80034,  bal: 0       },
      { num: "INV/25-26/003", pcode: "CUS-003", days: 45, due: 30, status: "PAID",           total: 78200,  tax: 11969, sub: 66231,  bal: 0       },
      { num: "INV/25-26/004", pcode: "CUS-007", days: 40, due: 10, status: "PAID",           total: 42000,  tax: 6427,  sub: 35573,  bal: 0       },
      { num: "INV/25-26/005", pcode: "CUS-004", days: 35, due: 5,  status: "PAID",           total: 231000, tax: 35364, sub: 195636, bal: 0       },
      { num: "INV/25-26/006", pcode: "CUS-001", days: 20, due: 8,  status: "SENT",           total: 187500, tax: 28678, sub: 158822, bal: 187500  },
      { num: "INV/25-26/007", pcode: "CUS-005", days: 15, due: 5,  status: "PARTIALLY_PAID", total: 95000,  tax: 14542, sub: 80458,  bal: 47500   },
      { num: "INV/25-26/008", pcode: "CUS-006", days: 10, due: 3,  status: "SENT",           total: 134000, tax: 20508, sub: 113492, bal: 134000  },
      { num: "INV/25-26/009", pcode: "CUS-008", days: 25, due: -5, status: "OVERDUE",        total: 68500,  tax: 10483, sub: 58017,  bal: 68500   },
      { num: "INV/25-26/010", pcode: "CUS-002", days: 30, due: -8, status: "OVERDUE",        total: 112000, tax: 17136, sub: 94864,  bal: 112000  },
      { num: "INV/25-26/011", pcode: "CUS-003", days: 5,  due: 20, status: "SENT",           total: 349500, tax: 53483, sub: 296017, bal: 349500  },
      { num: "INV/25-26/012", pcode: "CUS-007", days: 3,  due: 7,  status: "DRAFT",          total: 52800,  tax: 8083,  sub: 44717,  bal: 52800   },
    ];
    let invCreated = 0;
    for (const inv of invoiceData) {
      const existing = await db.invoice.findFirst({ where: { number: inv.num } });
      if (!existing) {
        const pId = partyMap[inv.pcode];
        if (pId) {
          await db.invoice.create({
            data: {
              number: inv.num, partyId: pId,
              type: "TAX_INVOICE", status: inv.status as any,
              date: daysAgo(inv.days), dueDate: daysAgo(inv.due),
              subtotal: inv.sub, taxAmount: inv.tax, total: inv.total, balanceDue: inv.bal,
            },
          });
          invCreated++;
        }
      }
    }
    results.push(`✅ ${invCreated} invoices`);

    // ── Quotes ────────────────────────────────────────────────────────────────
    const p1 = productMap["CUP-R8OZ"];
    const p2 = productMap["KBWL-500"];
    const p3 = productMap["PET-450"];
    const p4 = productMap["MBOX-LK"];

    const quoteData = [
      { num: "PPQ/25-26/001", pcode: "CUS-001", status: "CONVERTED", days: 55, items: [{ pid: p1, qty: 1000, price: 65, gst: 18 }, { pid: p2, qty: 500, price: 28, gst: 12 }] },
      { num: "PPQ/25-26/002", pcode: "CUS-002", status: "APPROVED",  days: 30, items: [{ pid: p3, qty: 2000, price: 18, gst: 18 }] },
      { num: "PPQ/25-26/003", pcode: "CUS-003", status: "SENT",      days: 15, items: [{ pid: p1, qty: 500,  price: 65, gst: 18 }, { pid: p4, qty: 200, price: 45, gst: 12 }] },
      { num: "PPQ/25-26/004", pcode: "CUS-004", status: "DRAFT",     days: 5,  items: [{ pid: p3, qty: 3000, price: 18, gst: 18 }] },
      { num: "PPQ/25-26/005", pcode: "CUS-005", status: "APPROVED",  days: 20, items: [{ pid: p2, qty: 800,  price: 28, gst: 12 }, { pid: p4, qty: 400, price: 45, gst: 12 }] },
      { num: "PPQ/25-26/006", pcode: "CUS-006", status: "SENT",      days: 10, items: [{ pid: p1, qty: 2000, price: 65, gst: 18 }] },
      { num: "PPQ/25-26/007", pcode: "CUS-007", status: "CONVERTED", days: 40, items: [{ pid: p4, qty: 1000, price: 45, gst: 12 }] },
      { num: "PPQ/25-26/008", pcode: "CUS-008", status: "REJECTED",  days: 25, items: [{ pid: p3, qty: 5000, price: 18, gst: 18 }] },
    ];

    let quotesCreated = 0;
    for (const q of quoteData) {
      const existing = await db.quote.findFirst({ where: { number: q.num } });
      if (!existing) {
        const pId = partyMap[q.pcode];
        if (!pId) continue;
        let sub = 0, tax = 0;
        const lineItems = q.items.map(i => {
          const taxable = i.qty * i.price;
          const gstAmt = (taxable * i.gst) / 100;
          sub += taxable; tax += gstAmt;
          return { productId: i.pid, qty: i.qty, unit: "pcs", unitPrice: i.price, discount: 0, gstRate: i.gst, gstAmount: gstAmt, total: taxable + gstAmt };
        });
        await db.quote.create({
          data: {
            number: q.num, partyId: pId, createdById: admin.id,
            status: q.status as any,
            validTill: daysAgo(q.days - 30),
            createdAt: daysAgo(q.days),
            subtotal: sub, taxAmount: tax, total: sub + tax,
            items: { create: lineItems },
          },
        });
        quotesCreated++;
      }
    }
    results.push(`✅ ${quotesCreated} quotes`);

    // ── Sales Orders ──────────────────────────────────────────────────────────
    const soData = [
      { num: "SO/25-26/001", pcode: "CUS-001", status: "DELIVERED",  days: 50, total: 170100 },
      { num: "SO/25-26/002", pcode: "CUS-007", status: "DELIVERED",  days: 38, total: 49500  },
      { num: "SO/25-26/003", pcode: "CUS-002", status: "PROCESSING", days: 8,  total: 42480  },
      { num: "SO/25-26/004", pcode: "CUS-005", status: "READY",      days: 4,  total: 57600  },
      { num: "SO/25-26/005", pcode: "CUS-003", status: "CONFIRMED",  days: 2,  total: 137800 },
    ];
    let soCreated = 0;
    for (const so of soData) {
      const existing = await db.salesOrder.findFirst({ where: { number: so.num } });
      if (!existing) {
        const pId = partyMap[so.pcode];
        if (pId) {
          await db.salesOrder.create({
            data: {
              number: so.num, partyId: pId, createdById: admin.id,
              status: so.status as any, createdAt: daysAgo(so.days),
              subtotal: Math.round(so.total / 1.18), taxAmount: Math.round(so.total - so.total / 1.18),
              total: so.total,
            },
          });
          soCreated++;
        }
      }
    }
    results.push(`✅ ${soCreated} sales orders`);

    // ── Attendance (last 30 days) ─────────────────────────────────────────────
    const empIds = Object.values(empMap);
    let attCreated = 0;
    if (empIds.length > 0) {
      for (let d = 30; d >= 1; d--) {
        const date = daysAgo(d);
        if (isWeekend(date)) continue;
        for (let i = 0; i < empIds.length; i++) {
          const empId = empIds[i];
          const exists = await db.attendance.findFirst({
            where: { employeeId: empId, date },
          });
          if (!exists) {
            const roll = (i + d) % 10;
            const status = roll < 8 ? "PRESENT" : roll === 8 ? "ABSENT" : "HALF_DAY";
            await db.attendance.create({ data: { employeeId: empId, date, status } });
            attCreated++;
          }
        }
      }
    }
    results.push(`✅ ${attCreated} attendance records`);

    // ── Payroll ───────────────────────────────────────────────────────────────
    const now = new Date();
    const thisMonth = now.getMonth() + 1;
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 1 ? 12 : thisMonth - 1;
    const lastYear  = thisMonth === 1 ? thisYear - 1 : thisYear;

    let payCreated = 0;
    const allEmps = await db.employee.findMany({ where: { isActive: true } });
    for (const emp of allEmps) {
      const gross = emp.salary ?? 25000;
      const hra = Math.round(gross * 0.2);
      const allow = Math.round(gross * 0.1);
      const pf = Math.round(gross * 0.12);
      const esi = gross <= 21000 ? Math.round(gross * 0.0075) : 0;
      const net = gross + hra + allow - pf - esi;

      for (const [month, year, status] of [[lastMonth, lastYear, "PAID"], [thisMonth, thisYear, "PROCESSED"]] as const) {
        const ex = await db.payroll.findFirst({ where: { employeeId: emp.id, month, year } });
        if (!ex) {
          await db.payroll.create({
            data: {
              employeeId: emp.id, month, year,
              basic: gross, hra, allowances: allow,
              pf, esi, gross: gross + hra + allow,
              net,
              status: status as any,
              paidAt: status === "PAID" ? daysAgo(lastMonth === thisMonth - 1 ? 5 : 35) : null,
            },
          });
          payCreated++;
        }
      }
    }
    results.push(`✅ ${payCreated} payroll records`);

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully!",
      credentials: {
        admin:    { email: "admin@packpro.site",  password: "packpro@2025", role: "SUPER_ADMIN" },
        sales:    { email: "rahul@packpro.site",   password: "sales@2025",   role: "SALES"       },
        accounts: { email: "priya@packpro.site",   password: "accounts@2025",role: "ACCOUNTS"    },
      },
      results,
    });
  } catch (error: any) {
    console.error("[setup] seed error:", error);
    return NextResponse.json({
      success: false,
      error: error?.message ?? "Seed failed",
      hint: "Ensure DATABASE_URL is set and the database schema has been pushed.",
    }, { status: 500 });
  }
}
