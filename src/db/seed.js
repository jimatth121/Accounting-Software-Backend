import { now } from "../utils/helpers.js";
import { defaultPermissions } from "../services/access.js";

export function seedForUser({ profile = {}, ownerUserId } = {}) {
  const timestamp = now();
  const company = {
    id: "company_1",
    name: profile.name || "My Company",
    email: profile.email || "",
    phone: profile.phone || "",
    address: profile.address || "",
    country: profile.country || "Nigeria",
    defaultCurrency: profile.defaultCurrency || "NGN",
    taxId: profile.taxId || "",
    fiscalYearStartMonth: "January",
    createdAt: timestamp,
    updatedAt: timestamp
  };

  return {
    company,
    customers: [
      { id: "cus_1", name: "Apex Studio", companyName: "Apex Studio Ltd", email: "accounts@apex.example", phone: "+234 801 111 1111", address: "Victoria Island, Lagos", taxId: "APX-1020", openingBalance: 0, notes: "Design retainer client", createdAt: timestamp, updatedAt: timestamp },
      { id: "cus_2", name: "Northstar Retail", companyName: "Northstar Retail", email: "finance@northstar.example", phone: "+234 802 222 2222", address: "Abuja, Nigeria", taxId: "NSR-2944", openingBalance: 0, notes: "Quarterly implementation project", createdAt: timestamp, updatedAt: timestamp },
      { id: "cus_3", name: "Greenfield Agritech", companyName: "Greenfield Agritech Plc", email: "ap@greenfield.example", phone: "+234 803 333 3333", address: "Ibadan, Oyo State", taxId: "GFA-7781", openingBalance: 0, notes: "Pays via bank transfer, net-45 terms", createdAt: timestamp, updatedAt: timestamp },
      { id: "cus_4", name: "Lagoon Logistics", companyName: "Lagoon Logistics Ltd", email: "billing@lagoonlog.example", phone: "+234 804 444 4444", address: "Apapa, Lagos", taxId: "LGL-3320", openingBalance: 0, notes: "Monthly fleet reconciliation", createdAt: timestamp, updatedAt: timestamp },
      { id: "cus_5", name: "Brightline Academy", companyName: "Brightline Academy", email: "bursar@brightline.example", phone: "+234 805 555 5555", address: "Enugu, Nigeria", taxId: "BLA-5512", openingBalance: 0, notes: "School term billing", createdAt: timestamp, updatedAt: timestamp },
      { id: "cus_6", name: "Harborline Foods", companyName: "Harborline Foods Ltd", email: "accounts@harborline.example", phone: "+234 806 666 6666", address: "Port Harcourt, Rivers", taxId: "HBF-9001", openingBalance: 0, notes: "FMCG distributor — bulk invoices", createdAt: timestamp, updatedAt: timestamp },
      { id: "cus_7", name: "Kano Textiles Co-op", companyName: "Kano Textiles Cooperative", email: "treasurer@kanotextiles.example", phone: "+234 807 777 7777", address: "Kano, Nigeria", taxId: "KTC-4410", openingBalance: 0, notes: "Seasonal large orders", createdAt: timestamp, updatedAt: timestamp }
    ],
    vendors: [
      { id: "ven_1", name: "AWS", companyName: "Amazon Web Services", email: "billing@aws.example", phone: "", address: "", taxId: "", openingBalance: 0, notes: "Cloud hosting", createdAt: timestamp, updatedAt: timestamp },
      { id: "ven_2", name: "Uber", companyName: "Uber", email: "", phone: "", address: "", taxId: "", openingBalance: 0, notes: "Transport", createdAt: timestamp, updatedAt: timestamp },
      { id: "ven_3", name: "MTN", companyName: "MTN Nigeria", email: "enterprise@mtn.example", phone: "+234 803 000 0000", address: "Ikoyi, Lagos", taxId: "MTN-0001", openingBalance: 0, notes: "Mobile + data plans", createdAt: timestamp, updatedAt: timestamp },
      { id: "ven_4", name: "Konga Office", companyName: "Konga Online Shopping", email: "b2b@konga.example", phone: "", address: "Gbagada, Lagos", taxId: "KNG-2245", openingBalance: 0, notes: "Office supplies + furniture", createdAt: timestamp, updatedAt: timestamp },
      { id: "ven_5", name: "Eko Electricity", companyName: "Eko Electricity Distribution", email: "bills@ekedp.example", phone: "", address: "Marina, Lagos", taxId: "EKEDP-77", openingBalance: 0, notes: "Office power bill", createdAt: timestamp, updatedAt: timestamp },
      { id: "ven_6", name: "Andela Talent", companyName: "Andela Inc.", email: "ap@andela.example", phone: "", address: "Yaba, Lagos", taxId: "AND-1188", openingBalance: 0, notes: "Contract engineering hours", createdAt: timestamp, updatedAt: timestamp },
      { id: "ven_7", name: "Google Workspace", companyName: "Google LLC", email: "billing@workspace.example", phone: "", address: "", taxId: "", openingBalance: 0, notes: "Email + collaboration suite", createdAt: timestamp, updatedAt: timestamp }
    ],
    invoices: [
      { id: "inv_1", invoiceNumber: "INV-000001", customerId: "cus_1", issueDate: "2026-05-01", dueDate: "2026-05-31", currency: "NGN", items: [{ description: "Monthly accounting setup", quantity: 1, unitPrice: 250000, taxRate: 7.5, discountAmount: 0 }], subtotal: 250000, taxAmount: 18750, discountAmount: 0, totalAmount: 268750, amountPaid: 150000, balanceDue: 118750, status: "Partially paid", notes: "Thanks for your business.", terms: "Payment due within 30 days.", createdAt: timestamp, updatedAt: timestamp },
      { id: "inv_2", invoiceNumber: "INV-000002", customerId: "cus_2", issueDate: "2026-04-10", dueDate: "2026-05-10", currency: "NGN", items: [{ description: "Finance workflow implementation", quantity: 1, unitPrice: 420000, taxRate: 7.5, discountAmount: 20000 }], subtotal: 420000, taxAmount: 31500, discountAmount: 20000, totalAmount: 431500, amountPaid: 0, balanceDue: 431500, status: "Overdue", notes: "", terms: "Payment due within 30 days.", createdAt: timestamp, updatedAt: timestamp },
      { id: "inv_3", invoiceNumber: "INV-000003", customerId: "cus_3", issueDate: "2026-03-22", dueDate: "2026-05-06", currency: "NGN", items: [{ description: "Greenhouse sensor integration", quantity: 4, unitPrice: 95000, taxRate: 7.5, discountAmount: 0 }, { description: "Onsite training (2 days)", quantity: 2, unitPrice: 60000, taxRate: 7.5, discountAmount: 0 }], subtotal: 500000, taxAmount: 37500, discountAmount: 0, totalAmount: 537500, amountPaid: 0, balanceDue: 537500, status: "Sent", notes: "Confirm receipt with project lead.", terms: "Net 45.", createdAt: timestamp, updatedAt: timestamp },
      { id: "inv_4", invoiceNumber: "INV-000004", customerId: "cus_4", issueDate: "2026-05-12", dueDate: "2026-06-11", currency: "NGN", items: [{ description: "Fleet ledger reconciliation — April", quantity: 1, unitPrice: 180000, taxRate: 7.5, discountAmount: 0 }], subtotal: 180000, taxAmount: 13500, discountAmount: 0, totalAmount: 193500, amountPaid: 193500, balanceDue: 0, status: "Paid", notes: "Paid via bank transfer on receipt.", terms: "Payment due within 30 days.", createdAt: timestamp, updatedAt: timestamp },
      { id: "inv_5", invoiceNumber: "INV-000005", customerId: "cus_5", issueDate: "2026-05-18", dueDate: "2026-06-17", currency: "NGN", items: [{ description: "Termly bursary software access", quantity: 1, unitPrice: 320000, taxRate: 0, discountAmount: 0 }, { description: "Parent portal customizations", quantity: 1, unitPrice: 75000, taxRate: 0, discountAmount: 0 }], subtotal: 395000, taxAmount: 0, discountAmount: 0, totalAmount: 395000, amountPaid: 0, balanceDue: 395000, status: "Sent", notes: "Education sector — VAT exempt.", terms: "Net 30.", createdAt: timestamp, updatedAt: timestamp },
      { id: "inv_6", invoiceNumber: "INV-000006", customerId: "cus_6", issueDate: "2026-05-05", dueDate: "2026-05-20", currency: "NGN", items: [{ description: "Bulk distribution report bundle", quantity: 1, unitPrice: 540000, taxRate: 7.5, discountAmount: 40000 }], subtotal: 540000, taxAmount: 40500, discountAmount: 40000, totalAmount: 540500, amountPaid: 300000, balanceDue: 240500, status: "Partially paid", notes: "Balance promised by end of month.", terms: "Net 15.", createdAt: timestamp, updatedAt: timestamp },
      { id: "inv_7", invoiceNumber: "INV-000007", customerId: "cus_7", issueDate: "2026-05-22", dueDate: "2026-06-21", currency: "NGN", items: [{ description: "Seasonal inventory audit", quantity: 1, unitPrice: 260000, taxRate: 7.5, discountAmount: 0 }], subtotal: 260000, taxAmount: 19500, discountAmount: 0, totalAmount: 279500, amountPaid: 0, balanceDue: 279500, status: "Draft", notes: "Awaiting final scope sign-off.", terms: "Payment due within 30 days.", createdAt: timestamp, updatedAt: timestamp },
      { id: "inv_8", invoiceNumber: "INV-000008", customerId: "cus_1", issueDate: "2026-04-02", dueDate: "2026-05-02", currency: "NGN", items: [{ description: "Brand-asset audit add-on", quantity: 1, unitPrice: 120000, taxRate: 7.5, discountAmount: 0 }], subtotal: 120000, taxAmount: 9000, discountAmount: 0, totalAmount: 129000, amountPaid: 129000, balanceDue: 0, status: "Paid", notes: "", terms: "Net 30.", createdAt: timestamp, updatedAt: timestamp },
      { id: "inv_9", invoiceNumber: "INV-000009", customerId: "cus_4", issueDate: "2026-02-28", dueDate: "2026-03-30", currency: "NGN", items: [{ description: "Onboarding consultancy", quantity: 1, unitPrice: 90000, taxRate: 0, discountAmount: 0 }], subtotal: 90000, taxAmount: 0, discountAmount: 0, totalAmount: 90000, amountPaid: 0, balanceDue: 0, status: "Cancelled", notes: "Client cancelled — no charge.", terms: "Net 30.", createdAt: timestamp, updatedAt: timestamp }
    ],
    expenses: [
      { id: "exp_1", vendorId: "ven_1", expenseDate: "2026-05-06", amount: 86000, taxAmount: 0, currency: "NGN", category: "Software/Hosting", paymentMethod: "Card", description: "AWS monthly bill", status: "Paid", receiptName: "aws-may.pdf", billable: false, createdAt: timestamp, updatedAt: timestamp },
      { id: "exp_2", vendorId: "ven_2", expenseDate: "2026-05-13", amount: 18500, taxAmount: 0, currency: "NGN", category: "Transport", paymentMethod: "Card", description: "Client meeting rides", status: "Recorded", receiptName: "uber-trip.png", billable: true, createdAt: timestamp, updatedAt: timestamp },
      { id: "exp_3", vendorId: "ven_3", expenseDate: "2026-05-02", amount: 42000, taxAmount: 3150, currency: "NGN", category: "Utilities", paymentMethod: "Bank transfer", description: "MTN enterprise data plan — May", status: "Paid", receiptName: "mtn-may.pdf", billable: false, createdAt: timestamp, updatedAt: timestamp },
      { id: "exp_4", vendorId: "ven_5", expenseDate: "2026-05-09", amount: 67500, taxAmount: 0, currency: "NGN", category: "Utilities", paymentMethod: "Bank transfer", description: "Office electricity bill", status: "Paid", receiptName: "ekedp-may.pdf", billable: false, createdAt: timestamp, updatedAt: timestamp },
      { id: "exp_5", vendorId: "ven_4", expenseDate: "2026-04-29", amount: 134500, taxAmount: 10087, currency: "NGN", category: "Office Supplies", paymentMethod: "Card", description: "Office chairs and stationery restock", status: "Paid", receiptName: "konga-order-2294.pdf", billable: false, createdAt: timestamp, updatedAt: timestamp },
      { id: "exp_6", vendorId: "ven_6", expenseDate: "2026-05-15", amount: 580000, taxAmount: 0, currency: "NGN", category: "Contract Labor", paymentMethod: "Bank transfer", description: "Andela contract engineering — 2 weeks", status: "Paid", receiptName: "andela-w20.pdf", billable: true, createdAt: timestamp, updatedAt: timestamp },
      { id: "exp_7", vendorId: "ven_7", expenseDate: "2026-05-04", amount: 24000, taxAmount: 0, currency: "NGN", category: "Software/Hosting", paymentMethod: "Card", description: "Google Workspace seats", status: "Paid", receiptName: "gw-may.pdf", billable: false, createdAt: timestamp, updatedAt: timestamp },
      { id: "exp_8", vendorId: "ven_2", expenseDate: "2026-05-20", amount: 9800, taxAmount: 0, currency: "NGN", category: "Transport", paymentMethod: "Card", description: "Airport pickup for visiting investor", status: "Recorded", receiptName: "uber-airport.png", billable: false, createdAt: timestamp, updatedAt: timestamp },
      { id: "exp_9", vendorId: "ven_4", expenseDate: "2026-05-19", amount: 38500, taxAmount: 2887, currency: "NGN", category: "Office Supplies", paymentMethod: "Card", description: "Printer toner + paper", status: "Paid", receiptName: "konga-order-2410.pdf", billable: false, createdAt: timestamp, updatedAt: timestamp },
      { id: "exp_10", vendorId: "ven_1", expenseDate: "2026-04-06", amount: 79500, taxAmount: 0, currency: "NGN", category: "Software/Hosting", paymentMethod: "Card", description: "AWS monthly bill — April", status: "Paid", receiptName: "aws-apr.pdf", billable: false, createdAt: timestamp, updatedAt: timestamp },
      { id: "exp_11", vendorId: "ven_3", expenseDate: "2026-04-02", amount: 41200, taxAmount: 3090, currency: "NGN", category: "Utilities", paymentMethod: "Bank transfer", description: "MTN enterprise data plan — April", status: "Paid", receiptName: "mtn-apr.pdf", billable: false, createdAt: timestamp, updatedAt: timestamp },
      { id: "exp_12", vendorId: "ven_6", expenseDate: "2026-05-22", amount: 95000, taxAmount: 0, currency: "NGN", category: "Marketing", paymentMethod: "Bank transfer", description: "Launch event sponsorship", status: "Pending", receiptName: "launch-sponsorship.pdf", billable: false, createdAt: timestamp, updatedAt: timestamp }
    ],
    payments: [
      { id: "pay_1", paymentType: "incoming", customerId: "cus_1", vendorId: null, invoiceId: "inv_1", expenseId: null, paymentDate: "2026-05-15", amount: 150000, currency: "NGN", paymentMethod: "Bank transfer", reference: "TRF-APEX-001", notes: "Partial invoice payment", createdAt: timestamp, updatedAt: timestamp },
      { id: "pay_2", paymentType: "incoming", customerId: "cus_4", vendorId: null, invoiceId: "inv_4", expenseId: null, paymentDate: "2026-05-13", amount: 193500, currency: "NGN", paymentMethod: "Bank transfer", reference: "TRF-LAGOON-2026", notes: "Full payment for INV-000004", createdAt: timestamp, updatedAt: timestamp },
      { id: "pay_3", paymentType: "incoming", customerId: "cus_6", vendorId: null, invoiceId: "inv_6", expenseId: null, paymentDate: "2026-05-18", amount: 300000, currency: "NGN", paymentMethod: "Bank transfer", reference: "TRF-HRB-883", notes: "Partial — INV-000006", createdAt: timestamp, updatedAt: timestamp },
      { id: "pay_4", paymentType: "incoming", customerId: "cus_1", vendorId: null, invoiceId: "inv_8", expenseId: null, paymentDate: "2026-04-15", amount: 129000, currency: "NGN", paymentMethod: "Card", reference: "STRIPE-APX-44", notes: "Full payment for INV-000008", createdAt: timestamp, updatedAt: timestamp },
      { id: "pay_5", paymentType: "outgoing", customerId: null, vendorId: "ven_6", invoiceId: null, expenseId: "exp_6", paymentDate: "2026-05-15", amount: 580000, currency: "NGN", paymentMethod: "Bank transfer", reference: "TRF-ANDELA-W20", notes: "Andela bi-weekly settlement", createdAt: timestamp, updatedAt: timestamp },
      { id: "pay_6", paymentType: "outgoing", customerId: null, vendorId: "ven_5", invoiceId: null, expenseId: "exp_4", paymentDate: "2026-05-09", amount: 67500, currency: "NGN", paymentMethod: "Bank transfer", reference: "EKEDP-MAY-2026", notes: "Electricity bill payment", createdAt: timestamp, updatedAt: timestamp },
      { id: "pay_7", paymentType: "outgoing", customerId: null, vendorId: "ven_1", invoiceId: null, expenseId: "exp_1", paymentDate: "2026-05-06", amount: 86000, currency: "NGN", paymentMethod: "Card", reference: "AWS-AUTO-MAY", notes: "AWS auto-debit", createdAt: timestamp, updatedAt: timestamp }
    ],
    accounts: [
      { id: "acc_1", code: "1000", name: "Bank Account", type: "Asset", subtype: "Cash", isSystemAccount: true, isActive: true },
      { id: "acc_2", code: "1100", name: "Accounts Receivable", type: "Asset", subtype: "Receivables", isSystemAccount: true, isActive: true },
      { id: "acc_3", code: "1200", name: "Inventory", type: "Asset", subtype: "Inventory", isSystemAccount: false, isActive: true },
      { id: "acc_4", code: "2000", name: "Accounts Payable", type: "Liability", subtype: "Payables", isSystemAccount: true, isActive: true },
      { id: "acc_5", code: "2100", name: "Sales Tax Payable", type: "Liability", subtype: "Tax", isSystemAccount: false, isActive: true },
      { id: "acc_6", code: "3000", name: "Owner's Equity", type: "Equity", subtype: "Capital", isSystemAccount: false, isActive: true },
      { id: "acc_7", code: "4000", name: "Sales Revenue", type: "Income", subtype: "Sales", isSystemAccount: true, isActive: true },
      { id: "acc_8", code: "4100", name: "Service Revenue", type: "Income", subtype: "Services", isSystemAccount: false, isActive: true },
      { id: "acc_9", code: "5000", name: "Operating Expenses", type: "Expense", subtype: "General", isSystemAccount: true, isActive: true },
      { id: "acc_10", code: "5100", name: "Software & Hosting", type: "Expense", subtype: "Software", isSystemAccount: false, isActive: true },
      { id: "acc_11", code: "5200", name: "Transport", type: "Expense", subtype: "Travel", isSystemAccount: false, isActive: true },
      { id: "acc_12", code: "5300", name: "Utilities", type: "Expense", subtype: "Utilities", isSystemAccount: false, isActive: true },
      { id: "acc_13", code: "5400", name: "Office Supplies", type: "Expense", subtype: "Office", isSystemAccount: false, isActive: true },
      { id: "acc_14", code: "5500", name: "Contract Labor", type: "Expense", subtype: "Payroll", isSystemAccount: false, isActive: true },
      { id: "acc_15", code: "5600", name: "Marketing", type: "Expense", subtype: "Marketing", isSystemAccount: false, isActive: true }
    ],
    inventory: [
      { id: "itm_1", sku: "SKU-1001", name: "Branded notebook", category: "Office", quantity: 120, reorderLevel: 30, unitCost: 1200, unitPrice: 2500, createdAt: timestamp, updatedAt: timestamp },
      { id: "itm_2", sku: "SKU-1002", name: "USB-C hub", category: "Electronics", quantity: 18, reorderLevel: 10, unitCost: 9500, unitPrice: 15000, createdAt: timestamp, updatedAt: timestamp },
      { id: "itm_3", sku: "SKU-1003", name: "Ergonomic mouse", category: "Electronics", quantity: 6, reorderLevel: 8, unitCost: 7800, unitPrice: 13500, createdAt: timestamp, updatedAt: timestamp },
      { id: "itm_4", sku: "SKU-1004", name: "Standing desk mat", category: "Office", quantity: 22, reorderLevel: 5, unitCost: 18000, unitPrice: 32000, createdAt: timestamp, updatedAt: timestamp }
    ],
    members: [
      {
        id: "mem_owner",
        name: profile.name || "Account Owner",
        email: profile.email || "",
        role: "Administrator",
        status: "active",
        clerkUserId: ownerUserId || "",
        isOwner: true,
        invitedAt: timestamp,
        joinedAt: timestamp
      }
    ],
    permissions: defaultPermissions(),
    preferences: {
      notifications: {
        invoiceReminders: true,
        paymentReceived: true,
        overdueAlerts: true,
        weeklyDigest: false,
        productUpdates: false,
        emailMarketing: false
      },
      theme: "light",
      language: "English",
      dateFormat: "DD MMM YYYY",
      autoBackup: true,
      updatedAt: timestamp
    }
  };
}
