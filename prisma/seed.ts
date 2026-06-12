// prisma/seed.ts
// Run: npx ts-node prisma/seed.ts
// Or:  npx prisma db seed

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding PACKPRO ERP database…");

  // ─── Company Settings ──────────────────────────────────────────
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

  // ─── Admin User ────────────────────────────────────────────────
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
  console.log("✅ Admin user: admin@packpro.site / packpro@2025");

  // Sales user
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

  // Accounts user
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
  console.log("✅ Sample users");

  // ─── Categories ────────────────────────────────────────────────
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

  // ─── Products ──────────────────────────────────────────────────
  const products = [
    { name: "Paper Cup 8oz Ripple",    code: "CUP-R8OZ",  categoryId: catMap["Paper Cups"],       unit: "pcs", moq: 500,  gstRate: 18, sellingPrice: 65,  purchasePrice: 48,  stockQty: 12500, status: "PUBLISHED" as const, featured: true },
    { name: "Paper Cup 12oz Ripple",   code: "CUP-R12OZ", categoryId: catMap["Paper Cups"],       unit: "pcs", moq: 500,  gstRate: 18, sellingPrice: 82,  purchasePrice: 60,  stockQty: 8200,  status: "PUBLISHED" as const },
    { name: "Paper Cup 6oz Plain",     code: "CUP-P6OZ",  categoryId: catMap["Paper Cups"],       unit: "pcs", moq: 1000, gstRate: 18, sellingPrice: 48,  purchasePrice: 35,  stockQty: 5000,  status: "PUBLISHED" as const },
    { name: "Kraft Bowl 500ml",        code: "KBWL-500",  categoryId: catMap["Food Containers"],  unit: "pcs", moq: 500,  gstRate: 12, sellingPrice: 28,  purchasePrice: 20,  stockQty: 85,    status: "PUBLISHED" as const, reorderLevel: 1000 },
    { name: "Kraft Bowl 750ml",        code: "KBWL-750",  categoryId: catMap["Food Containers"],  unit: "pcs", moq: 500,  gstRate: 12, sellingPrice: 35,  purchasePrice: 26,  stockQty: 3200,  status: "PUBLISHED" as const },
    { name: "Meal Box Large Kraft",    code: "MBOX-LK",   categoryId: catMap["Food Containers"],  unit: "pcs", moq: 500,  gstRate: 12, sellingPrice: 45,  purchasePrice: 32,  stockQty: 320,   status: "PUBLISHED" as const, reorderLevel: 500 },
    { name: "Clear PET Cup 350ml",     code: "PET-350",   categoryId: catMap["PET Containers"],   unit: "pcs", moq: 1000, gstRate: 18, sellingPrice: 15,  purchasePrice: 11,  stockQty: 7500,  status: "PUBLISHED" as const },
    { name: "Clear PET Cup 450ml",     code: "PET-450",   categoryId: catMap["PET Containers"],   unit: "pcs", moq: 1000, gstRate: 18, sellingPrice: 18,  purchasePrice: 13,  stockQty: 4300,  status: "PUBLISHED" as const, featured: true },
    { name: "Paper Bag Medium SOS",    code: "PBAG-MSOS", categoryId: catMap["Paper Bags"],       unit: "pcs", moq: 500,  gstRate: 12, sellingPrice: 12,  purchasePrice: 8.5, stockQty: 2100,  status: "PUBLISHED" as const },
    { name: "Sweet Box Medium White",  code: "SWBX-M",    categoryId: catMap["Bakery Packaging"], unit: "pcs", moq: 500,  gstRate: 18, sellingPrice: 22,  purchasePrice: 16,  stockQty: 1800,  status: "PUBLISHED" as const },
    { name: "Wooden Fork Set 100pc",   code: "CUTF-W100", categoryId: catMap["Cutlery"],          unit: "sets", moq: 1000, gstRate: 5, sellingPrice: 8.5, purchasePrice: 6,   stockQty: 5000,  status: "PUBLISHED" as const },
    { name: "Napkin 1-Ply 100pcs",     code: "TISN-1P",   categoryId: catMap["Tissues"],          unit: "packs", moq: 2000, gstRate: 5, sellingPrice: 35, purchasePrice: 25,  stockQty: 900,   status: "PUBLISHED" as const },
  ];

  for (const p of products) {
    await db.product.upsert({
      where: { code: p.code },
      update: {},
      create: {
        ...p,
        reorderLevel: (p as any).reorderLevel ?? 200,
        featured: (p as any).featured ?? false,
        isCatalogVisible: true,
      },
    });
  }
  console.log("✅ Products");

  // ─── Departments ───────────────────────────────────────────────
  const depts = ["Sales", "Accounts", "Operations", "Purchase", "HR", "Management"];
  for (const name of depts) {
    await db.department.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log("✅ Departments");

  // ─── Sample Parties ────────────────────────────────────────────
  const parties = [
    { type: "CUSTOMER" as const, name: "Spice Route Restaurant", phone: "+91 98765 43210", email: "orders@spiceroute.in", city: "Jaipur", state: "Rajasthan", source: "WEBSITE" },
    { type: "CUSTOMER" as const, name: "Cloud Bites Kitchen",    phone: "+91 87654 32109", email: "purchase@cloudbites.com", city: "Delhi", state: "Delhi", source: "WHATSAPP" },
    { type: "CUSTOMER" as const, name: "The Coffee Lab",         phone: "+91 76543 21098", city: "Gurugram", state: "Haryana", source: "WEBSITE" },
    { type: "VENDOR"   as const, name: "Raj Paper Mills",        phone: "+91 65432 10987", city: "Faridabad", state: "Haryana" },
    { type: "VENDOR"   as const, name: "PET Solutions Pvt Ltd",  phone: "+91 54321 09876", city: "Mumbai", state: "Maharashtra" },
  ];

  for (const party of parties) {
    const code = `${party.type[0]}${Date.now()}`.slice(0, 10);
    await db.party.create({ data: { ...party, code, country: "India" } }).catch(() => {});
  }
  console.log("✅ Sample parties");

  // ─── Warehouse ─────────────────────────────────────────────────
  await db.warehouse.upsert({
    where: { code: "WH-ALW-01" },
    update: {},
    create: { name: "Alwar Main Warehouse", code: "WH-ALW-01", city: "Alwar", isActive: true },
  });
  console.log("✅ Warehouse");

  console.log("\n🎉 Seed complete!");
  console.log("────────────────────────────────");
  console.log("Login credentials:");
  console.log("  Admin:    admin@packpro.site  /  packpro@2025");
  console.log("  Sales:    rahul@packpro.site  /  sales@2025");
  console.log("  Accounts: priya@packpro.site  /  accounts@2025");
  console.log("────────────────────────────────");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
