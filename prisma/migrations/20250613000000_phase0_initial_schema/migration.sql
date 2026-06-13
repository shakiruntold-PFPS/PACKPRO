-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES', 'ACCOUNTS', 'WAREHOUSE', 'PURCHASE', 'HR', 'CUSTOMER', 'VENDOR');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PartyType" AS ENUM ('CUSTOMER', 'VENDOR', 'SUPPLIER', 'DEALER', 'DISTRIBUTOR', 'TRANSPORTER');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WEBSITE', 'WHATSAPP', 'REFERRAL', 'GOOGLE', 'INSTAGRAM', 'FACEBOOK', 'COLD_CALL', 'EXHIBITION', 'OTHER');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('NOTE', 'CALL', 'EMAIL', 'MEETING', 'WHATSAPP', 'FOLLOW_UP', 'STATUS_CHANGE');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "SalesOrderStatus" AS ENUM ('CONFIRMED', 'PROCESSING', 'READY', 'DISPATCHED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('PROFORMA', 'TAX_INVOICE', 'CREDIT_NOTE', 'DEBIT_NOTE');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'NEFT', 'RTGS', 'IMPS', 'CARD');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'SENT', 'CONFIRMED', 'PARTIAL', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PurchaseBillStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StockTxType" AS ENUM ('OPENING', 'PURCHASE_IN', 'SALE_OUT', 'RETURN_IN', 'RETURN_OUT', 'ADJUSTMENT', 'TRANSFER', 'DAMAGE');

-- CreateEnum
CREATE TYPE "DispatchStatus" AS ENUM ('READY', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'HOLIDAY');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('CASUAL', 'SICK', 'EARNED', 'MATERNITY', 'UNPAID');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'PROCESSED', 'PAID');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'SALES',
    "avatar" TEXT,
    "phone" TEXT,
    "department" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL DEFAULT 'PACKPRO Food Packaging Solutions',
    "tagline" TEXT,
    "address" TEXT NOT NULL DEFAULT 'Dholidub, Narnaul-Behror Road, Alwar, Rajasthan',
    "city" TEXT NOT NULL DEFAULT 'Alwar',
    "state" TEXT NOT NULL DEFAULT 'Rajasthan',
    "pincode" TEXT NOT NULL DEFAULT '301001',
    "country" TEXT NOT NULL DEFAULT 'India',
    "phone" TEXT NOT NULL DEFAULT '+91 9057627625',
    "email" TEXT NOT NULL DEFAULT 'sales@packpro.site',
    "supportEmail" TEXT NOT NULL DEFAULT 'support@packpro.site',
    "website" TEXT NOT NULL DEFAULT 'www.packpro.site',
    "gstin" TEXT,
    "pan" TEXT,
    "cin" TEXT,
    "logoUrl" TEXT,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "bankIfsc" TEXT,
    "bankBranch" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "currencySymbol" TEXT NOT NULL DEFAULT '₹',
    "invoicePrefix" TEXT NOT NULL DEFAULT 'PPQ',
    "invoiceCounter" INTEGER NOT NULL DEFAULT 1,
    "financialYear" TEXT NOT NULL DEFAULT '2025-26',
    "gstRate" DOUBLE PRECISION NOT NULL DEFAULT 18,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "image" TEXT,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "sku" TEXT,
    "hsnCode" TEXT,
    "gstRate" DOUBLE PRECISION NOT NULL DEFAULT 18,
    "categoryId" TEXT NOT NULL,
    "subcategory" TEXT,
    "brand" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "moq" INTEGER NOT NULL DEFAULT 500,
    "weight" DOUBLE PRECISION,
    "dimensions" TEXT,
    "material" TEXT,
    "colors" TEXT[],
    "sizes" TEXT[],
    "description" TEXT,
    "shortDesc" TEXT,
    "features" TEXT[],
    "specifications" JSONB,
    "purchasePrice" DOUBLE PRECISION,
    "sellingPrice" DOUBLE PRECISION,
    "mrp" DOUBLE PRECISION,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "isCatalogVisible" BOOLEAN NOT NULL DEFAULT true,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "tags" TEXT[],
    "views" INTEGER NOT NULL DEFAULT 0,
    "inquiries" INTEGER NOT NULL DEFAULT 0,
    "stockQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reservedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reorderLevel" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parties" (
    "id" TEXT NOT NULL,
    "type" "PartyType" NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "contactPerson" TEXT,
    "phone" TEXT,
    "altPhone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "gstin" TEXT,
    "pan" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "creditLimit" DOUBLE PRECISION,
    "creditDays" INTEGER,
    "segment" TEXT,
    "industry" TEXT,
    "source" TEXT,
    "tags" TEXT[],
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_contacts" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "party_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "partyId" TEXT,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "company" TEXT,
    "industry" TEXT,
    "source" "LeadSource" NOT NULL DEFAULT 'WEBSITE',
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "value" DOUBLE PRECISION,
    "notes" TEXT,
    "assignedToId" TEXT,
    "followUpDate" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "lostReason" TEXT,
    "tags" TEXT[],
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "subject" TEXT NOT NULL,
    "notes" TEXT,
    "userId" TEXT NOT NULL,
    "leadId" TEXT,
    "partyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "assignedToId" TEXT NOT NULL,
    "leadId" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "leadId" TEXT,
    "createdById" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "validTill" TIMESTAMP(3) NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountType" TEXT NOT NULL DEFAULT 'flat',
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "terms" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionNote" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_items" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "description" TEXT,
    "qty" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gstRate" DOUBLE PRECISION NOT NULL DEFAULT 18,
    "gstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "quote_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_orders" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "quoteId" TEXT,
    "createdById" TEXT NOT NULL,
    "status" "SalesOrderStatus" NOT NULL DEFAULT 'CONFIRMED',
    "deliveryDate" TIMESTAMP(3),
    "deliveryAddr" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "taxAmount" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "gstRate" DOUBLE PRECISION NOT NULL DEFAULT 18,
    "gstAmount" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "dispatched" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "invoiced" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "salesOrderId" TEXT,
    "type" "InvoiceType" NOT NULL DEFAULT 'TAX_INVOICE',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceDue" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "terms" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "productId" TEXT,
    "description" TEXT NOT NULL,
    "hsn" TEXT,
    "qty" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gstRate" DOUBLE PRECISION NOT NULL DEFAULT 18,
    "cgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "igst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "reference" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDate" TIMESTAMP(3),
    "subtotal" DOUBLE PRECISION NOT NULL,
    "taxAmount" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_items" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "gstRate" DOUBLE PRECISION NOT NULL DEFAULT 18,
    "gstAmount" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "received" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "purchase_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grns" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grn_items" (
    "id" TEXT NOT NULL,
    "grnId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qtyReceived" DOUBLE PRECISION NOT NULL,
    "qtyRejected" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "grn_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_bills" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "purchaseOrderId" TEXT,
    "vendorBillNo" TEXT,
    "billDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "taxAmount" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "PurchaseBillStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "id" TEXT NOT NULL,
    "type" "StockTxType" NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "warehouseId" TEXT,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispatches" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "status" "DispatchStatus" NOT NULL DEFAULT 'READY',
    "dispatchDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transporter" TEXT,
    "vehicleNo" TEXT,
    "lrNumber" TEXT,
    "deliveryAddr" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dispatches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispatch_items" (
    "id" TEXT NOT NULL,
    "dispatchId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'pcs',

    CONSTRAINT "dispatch_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "empCode" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "designation" TEXT,
    "departmentId" TEXT,
    "joiningDate" TIMESTAMP(3),
    "salary" DOUBLE PRECISION,
    "bankAccount" TEXT,
    "bankIfsc" TEXT,
    "panNumber" TEXT,
    "pfNumber" TEXT,
    "esiNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "notes" TEXT,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaves" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "LeaveType" NOT NULL DEFAULT 'CASUAL',
    "from" TIMESTAMP(3) NOT NULL,
    "to" TIMESTAMP(3) NOT NULL,
    "days" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leaves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payrolls" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "basic" DOUBLE PRECISION NOT NULL,
    "hra" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "allowances" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pf" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "esi" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tds" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherDeductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gross" DOUBLE PRECISION NOT NULL,
    "net" DOUBLE PRECISION NOT NULL,
    "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payrolls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER,
    "mimeType" TEXT,
    "partyId" TEXT,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "tags" TEXT[],
    "version" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "recordId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schema_versions" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "version" INTEGER NOT NULL DEFAULT 1,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,

    CONSTRAINT "schema_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");

-- CreateIndex
CREATE INDEX "products_deletedAt_idx" ON "products"("deletedAt");

-- CreateIndex
CREATE INDEX "products_status_categoryId_idx" ON "products"("status", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "parties_code_key" ON "parties"("code");

-- CreateIndex
CREATE INDEX "parties_deletedAt_idx" ON "parties"("deletedAt");

-- CreateIndex
CREATE INDEX "parties_type_isActive_idx" ON "parties"("type", "isActive");

-- CreateIndex
CREATE INDEX "leads_deletedAt_idx" ON "leads"("deletedAt");

-- CreateIndex
CREATE INDEX "leads_status_assignedToId_idx" ON "leads"("status", "assignedToId");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_number_key" ON "quotes"("number");

-- CreateIndex
CREATE INDEX "quotes_deletedAt_idx" ON "quotes"("deletedAt");

-- CreateIndex
CREATE INDEX "quotes_status_partyId_idx" ON "quotes"("status", "partyId");

-- CreateIndex
CREATE UNIQUE INDEX "sales_orders_number_key" ON "sales_orders"("number");

-- CreateIndex
CREATE INDEX "sales_orders_deletedAt_idx" ON "sales_orders"("deletedAt");

-- CreateIndex
CREATE INDEX "sales_orders_status_partyId_idx" ON "sales_orders"("status", "partyId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_number_key" ON "invoices"("number");

-- CreateIndex
CREATE INDEX "invoices_deletedAt_idx" ON "invoices"("deletedAt");

-- CreateIndex
CREATE INDEX "invoices_status_partyId_idx" ON "invoices"("status", "partyId");

-- CreateIndex
CREATE INDEX "invoices_dueDate_status_idx" ON "invoices"("dueDate", "status");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_number_key" ON "purchase_orders"("number");

-- CreateIndex
CREATE INDEX "purchase_orders_deletedAt_idx" ON "purchase_orders"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "grns_number_key" ON "grns"("number");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_bills_number_key" ON "purchase_bills"("number");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_code_key" ON "warehouses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "dispatches_number_key" ON "dispatches"("number");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "employees_empCode_key" ON "employees"("empCode");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_employeeId_date_key" ON "attendances"("employeeId", "date");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_module_createdAt_idx" ON "audit_logs"("module", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_recordId_idx" ON "audit_logs"("recordId");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_contacts" ADD CONSTRAINT "party_contacts_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "parties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grns" ADD CONSTRAINT "grns_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grn_items" ADD CONSTRAINT "grn_items_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "grns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_bills" ADD CONSTRAINT "purchase_bills_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_items" ADD CONSTRAINT "dispatch_items_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "dispatches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

