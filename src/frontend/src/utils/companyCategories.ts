/**
 * Master data for company categories and their default products/GST rates.
 * This data is used for:
 * 1. CompanyCategoriesPage.tsx - master management
 * 2. ProductsPage.tsx - GST rate auto-suggestion
 * 3. SettingsPage.tsx - business category selector
 */

export interface CategoryProduct {
  name: string;
  hsnCode: string;
  gstRate: number;
  unit: string;
}

export interface CompanyCategory {
  id: string;
  name: string;
  defaultGstSlab: number;
  products: CategoryProduct[];
}

export const COMPANY_CATEGORIES: CompanyCategory[] = [
  {
    id: "manufacturing",
    name: "Manufacturing",
    defaultGstSlab: 18,
    products: [
      { name: "Raw Materials", hsnCode: "72011000", gstRate: 18, unit: "Kg" },
      { name: "Finished Goods", hsnCode: "84713000", gstRate: 18, unit: "Nos" },
      {
        name: "Packaging Material",
        hsnCode: "48191000",
        gstRate: 12,
        unit: "Nos",
      },
      {
        name: "Industrial Machinery",
        hsnCode: "84559000",
        gstRate: 18,
        unit: "Nos",
      },
      { name: "Spare Parts", hsnCode: "84839000", gstRate: 18, unit: "Nos" },
    ],
  },
  {
    id: "trading",
    name: "Trading/Wholesale",
    defaultGstSlab: 18,
    products: [
      {
        name: "General Merchandise",
        hsnCode: "99990000",
        gstRate: 18,
        unit: "Nos",
      },
      { name: "Electronics", hsnCode: "85171200", gstRate: 18, unit: "Nos" },
      { name: "FMCG Products", hsnCode: "33051000", gstRate: 18, unit: "Nos" },
      { name: "Hardware Items", hsnCode: "73181500", gstRate: 18, unit: "Nos" },
      { name: "Stationery", hsnCode: "48201000", gstRate: 12, unit: "Nos" },
    ],
  },
  {
    id: "services",
    name: "Services",
    defaultGstSlab: 18,
    products: [
      { name: "Consulting", hsnCode: "998311", gstRate: 18, unit: "Hr" },
      { name: "Maintenance", hsnCode: "998719", gstRate: 18, unit: "Job" },
      {
        name: "Event Management",
        hsnCode: "998554",
        gstRate: 18,
        unit: "Event",
      },
      {
        name: "Security Service",
        hsnCode: "998521",
        gstRate: 18,
        unit: "Month",
      },
      { name: "Cleaning", hsnCode: "998531", gstRate: 18, unit: "Job" },
    ],
  },
  {
    id: "ecommerce",
    name: "E-Commerce",
    defaultGstSlab: 18,
    products: [
      {
        name: "Product Listing Fee",
        hsnCode: "998314",
        gstRate: 18,
        unit: "Nos",
      },
      {
        name: "Shipping Charges",
        hsnCode: "996812",
        gstRate: 18,
        unit: "Shipment",
      },
      {
        name: "Platform Commission",
        hsnCode: "998314",
        gstRate: 18,
        unit: "Pct",
      },
      { name: "Return Handling", hsnCode: "998719", gstRate: 18, unit: "Nos" },
      {
        name: "Digital Product",
        hsnCode: "998431",
        gstRate: 18,
        unit: "License",
      },
    ],
  },
  {
    id: "healthcare",
    name: "Healthcare",
    defaultGstSlab: 5,
    products: [
      {
        name: "OPD Consultation",
        hsnCode: "999311",
        gstRate: 0,
        unit: "Visit",
      },
      { name: "Lab Test", hsnCode: "999315", gstRate: 5, unit: "Test" },
      {
        name: "Medicine Exempt",
        hsnCode: "30049099",
        gstRate: 0,
        unit: "Strip",
      },
      { name: "Medical Device", hsnCode: "90189099", gstRate: 12, unit: "Nos" },
      { name: "Ambulance", hsnCode: "996911", gstRate: 0, unit: "Trip" },
    ],
  },
  {
    id: "education",
    name: "Education",
    defaultGstSlab: 0,
    products: [
      { name: "Tuition Fee", hsnCode: "999291", gstRate: 0, unit: "Month" },
      { name: "Course Material", hsnCode: "49011000", gstRate: 0, unit: "Set" },
      {
        name: "Online Course",
        hsnCode: "999291",
        gstRate: 18,
        unit: "License",
      },
      { name: "Exam Fee", hsnCode: "999293", gstRate: 0, unit: "Exam" },
      { name: "Hostel Fee", hsnCode: "996311", gstRate: 12, unit: "Month" },
    ],
  },
  {
    id: "pharma",
    name: "Pharma",
    defaultGstSlab: 12,
    products: [
      { name: "API Ingredient", hsnCode: "29420090", gstRate: 12, unit: "Kg" },
      {
        name: "Tablet Formulation",
        hsnCode: "30049099",
        gstRate: 12,
        unit: "Strip",
      },
      { name: "Syrup", hsnCode: "30049099", gstRate: 12, unit: "Bottle" },
      { name: "OTC Medicine", hsnCode: "30049099", gstRate: 0, unit: "Pack" },
      {
        name: "Surgical Supply",
        hsnCode: "90189099",
        gstRate: 12,
        unit: "Box",
      },
    ],
  },
  {
    id: "construction",
    name: "Construction",
    defaultGstSlab: 18,
    products: [
      { name: "Cement", hsnCode: "25232900", gstRate: 28, unit: "Bag" },
      { name: "Steel TMT Bar", hsnCode: "72142000", gstRate: 18, unit: "MT" },
      { name: "Bricks", hsnCode: "69041000", gstRate: 5, unit: "Nos" },
      { name: "Sand", hsnCode: "26209090", gstRate: 5, unit: "Tons" },
      {
        name: "Construction Service",
        hsnCode: "995411",
        gstRate: 18,
        unit: "Job",
      },
    ],
  },
  {
    id: "textile",
    name: "Textile",
    defaultGstSlab: 5,
    products: [
      { name: "Cotton Yarn", hsnCode: "52051100", gstRate: 5, unit: "Kg" },
      { name: "Woven Fabric", hsnCode: "52081100", gstRate: 5, unit: "Mtr" },
      {
        name: "Readymade Garment",
        hsnCode: "62034200",
        gstRate: 12,
        unit: "Nos",
      },
      { name: "Synthetic Fibre", hsnCode: "55031100", gstRate: 18, unit: "Kg" },
      { name: "Embroidery Work", hsnCode: "996120", gstRate: 5, unit: "Mtr" },
    ],
  },
  {
    id: "retail",
    name: "Retail",
    defaultGstSlab: 12,
    products: [
      { name: "Grocery", hsnCode: "09041100", gstRate: 0, unit: "Kg" },
      { name: "Packaged Food", hsnCode: "19049090", gstRate: 5, unit: "Pack" },
      { name: "Personal Care", hsnCode: "33051000", gstRate: 18, unit: "Nos" },
      {
        name: "Household Items",
        hsnCode: "73239300",
        gstRate: 12,
        unit: "Nos",
      },
      { name: "Clothing", hsnCode: "62034200", gstRate: 12, unit: "Nos" },
    ],
  },
  {
    id: "restaurant",
    name: "Restaurant/Food",
    defaultGstSlab: 5,
    products: [
      {
        name: "Food AC Restaurant",
        hsnCode: "996331",
        gstRate: 5,
        unit: "Plate",
      },
      { name: "Food Non-AC", hsnCode: "996331", gstRate: 5, unit: "Plate" },
      { name: "Beverages", hsnCode: "996331", gstRate: 5, unit: "Glass" },
      { name: "Takeaway Food", hsnCode: "996332", gstRate: 5, unit: "Pack" },
      {
        name: "Catering Service",
        hsnCode: "996334",
        gstRate: 18,
        unit: "Event",
      },
    ],
  },
  {
    id: "it_software",
    name: "IT/Software",
    defaultGstSlab: 18,
    products: [
      {
        name: "Software Development",
        hsnCode: "998314",
        gstRate: 18,
        unit: "Hr",
      },
      {
        name: "SaaS Subscription",
        hsnCode: "998314",
        gstRate: 18,
        unit: "Month",
      },
      { name: "IT Support", hsnCode: "998315", gstRate: 18, unit: "Hr" },
      { name: "Cloud Hosting", hsnCode: "998316", gstRate: 18, unit: "Month" },
      {
        name: "Data Analytics",
        hsnCode: "998312",
        gstRate: 18,
        unit: "Project",
      },
    ],
  },
  {
    id: "transport",
    name: "Transport/Logistics",
    defaultGstSlab: 5,
    products: [
      { name: "Road Freight", hsnCode: "996511", gstRate: 5, unit: "Trip" },
      { name: "Air Freight", hsnCode: "996531", gstRate: 18, unit: "Kg" },
      { name: "Warehousing", hsnCode: "996721", gstRate: 18, unit: "Month" },
      {
        name: "Courier Service",
        hsnCode: "996812",
        gstRate: 18,
        unit: "Shipment",
      },
      {
        name: "Customs Clearance",
        hsnCode: "998621",
        gstRate: 18,
        unit: "Consignment",
      },
    ],
  },
  {
    id: "agriculture",
    name: "Agriculture",
    defaultGstSlab: 0,
    products: [
      { name: "Raw Vegetables", hsnCode: "07019000", gstRate: 0, unit: "Kg" },
      { name: "Seeds", hsnCode: "12099900", gstRate: 0, unit: "Kg" },
      { name: "Fertiliser", hsnCode: "31021000", gstRate: 5, unit: "Bag" },
      { name: "Pesticide", hsnCode: "38089199", gstRate: 18, unit: "Litre" },
      {
        name: "Agricultural Equipment",
        hsnCode: "84329090",
        gstRate: 12,
        unit: "Nos",
      },
    ],
  },
  {
    id: "real_estate",
    name: "Real Estate",
    defaultGstSlab: 5,
    products: [
      { name: "Residential Sale", hsnCode: "997211", gstRate: 5, unit: "Unit" },
      { name: "Commercial Sale", hsnCode: "997212", gstRate: 12, unit: "Unit" },
      { name: "Rental Income", hsnCode: "997212", gstRate: 18, unit: "Month" },
      { name: "Brokerage", hsnCode: "997221", gstRate: 18, unit: "Deal" },
      {
        name: "Maintenance Charges",
        hsnCode: "997219",
        gstRate: 18,
        unit: "Month",
      },
    ],
  },
  {
    id: "finance",
    name: "Finance/NBFC",
    defaultGstSlab: 18,
    products: [
      {
        name: "Loan Processing Fee",
        hsnCode: "997112",
        gstRate: 18,
        unit: "Nos",
      },
      {
        name: "Insurance Premium",
        hsnCode: "997132",
        gstRate: 18,
        unit: "Policy",
      },
      {
        name: "Investment Advisory",
        hsnCode: "997152",
        gstRate: 18,
        unit: "Hr",
      },
      {
        name: "Mutual Fund Commission",
        hsnCode: "997153",
        gstRate: 18,
        unit: "Pct",
      },
      {
        name: "Forex Service",
        hsnCode: "997161",
        gstRate: 18,
        unit: "Transaction",
      },
    ],
  },
  {
    id: "export_import",
    name: "Export/Import",
    defaultGstSlab: 0,
    products: [
      { name: "Export Goods", hsnCode: "99990000", gstRate: 0, unit: "Nos" },
      { name: "Import Goods", hsnCode: "99990000", gstRate: 18, unit: "Nos" },
      { name: "Customs Duty", hsnCode: "99990000", gstRate: 0, unit: "Nos" },
      {
        name: "Freight Forwarding",
        hsnCode: "996531",
        gstRate: 18,
        unit: "Shipment",
      },
      { name: "Letter of Credit", hsnCode: "997162", gstRate: 18, unit: "LC" },
    ],
  },
  {
    id: "ngo",
    name: "NGO/Trust",
    defaultGstSlab: 0,
    products: [
      { name: "Donation Receipt", hsnCode: "999000", gstRate: 0, unit: "Nos" },
      { name: "Grant Utilisation", hsnCode: "999000", gstRate: 0, unit: "Nos" },
      {
        name: "Training Programme",
        hsnCode: "999291",
        gstRate: 0,
        unit: "Session",
      },
      { name: "Publication", hsnCode: "998432", gstRate: 0, unit: "Copy" },
      {
        name: "Event Sponsorship",
        hsnCode: "998554",
        gstRate: 18,
        unit: "Event",
      },
    ],
  },
  {
    id: "professional",
    name: "Professional Services",
    defaultGstSlab: 18,
    products: [
      { name: "Audit Fee", hsnCode: "998221", gstRate: 18, unit: "Job" },
      { name: "Legal Advisory", hsnCode: "998211", gstRate: 18, unit: "Hr" },
      {
        name: "Architecture Design",
        hsnCode: "998311",
        gstRate: 18,
        unit: "Project",
      },
      {
        name: "CA Certification",
        hsnCode: "998221",
        gstRate: 18,
        unit: "Certificate",
      },
      {
        name: "Company Secretary",
        hsnCode: "998212",
        gstRate: 18,
        unit: "Retainer",
      },
    ],
  },
  {
    id: "hospitality",
    name: "Hospitality",
    defaultGstSlab: 12,
    products: [
      {
        name: "Room Tariff Under7500",
        hsnCode: "996311",
        gstRate: 12,
        unit: "Night",
      },
      {
        name: "Room Tariff Over7500",
        hsnCode: "996311",
        gstRate: 18,
        unit: "Night",
      },
      {
        name: "Restaurant Hotel",
        hsnCode: "996331",
        gstRate: 5,
        unit: "Cover",
      },
      {
        name: "Travel Package",
        hsnCode: "998551",
        gstRate: 5,
        unit: "Package",
      },
      { name: "Banquet Hall", hsnCode: "996334", gstRate: 18, unit: "Event" },
    ],
  },
];

export const CATEGORY_NAMES = COMPANY_CATEGORIES.map((c) => c.name);

export function getCategoryById(id: string): CompanyCategory | undefined {
  return COMPANY_CATEGORIES.find((c) => c.id === id);
}

export function getCategoryByName(name: string): CompanyCategory | undefined {
  return COMPANY_CATEGORIES.find((c) => c.name === name);
}

/**
 * Get overridden products for a category (from localStorage).
 */
export function getCategoryProductOverrides(
  categoryId: string,
): CategoryProduct[] | null {
  try {
    const key = "lekhya_category_products_overrides";
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const overrides = JSON.parse(raw) as Record<string, CategoryProduct[]>;
    return overrides[categoryId] ?? null;
  } catch {
    return null;
  }
}

export function saveCategoryProductOverride(
  categoryId: string,
  products: CategoryProduct[],
) {
  const key = "lekhya_category_products_overrides";
  const raw = localStorage.getItem(key);
  let overrides: Record<string, CategoryProduct[]> = {};
  try {
    overrides = JSON.parse(raw ?? "{}") as Record<string, CategoryProduct[]>;
  } catch {
    overrides = {};
  }
  overrides[categoryId] = products;
  localStorage.setItem(key, JSON.stringify(overrides));
}

/**
 * Get effective products for a category (override if exists, else defaults).
 */
export function getEffectiveCategoryProducts(
  category: CompanyCategory,
): CategoryProduct[] {
  const overrides = getCategoryProductOverrides(category.id);
  return overrides ?? category.products;
}

/**
 * Fuzzy match a product name against all categories.
 * Returns the best match with HSN code and GST rate.
 */
export function fuzzyMatchProduct(
  productName: string,
  categoryId?: string,
): CategoryProduct | null {
  if (!productName.trim()) return null;
  const lowerName = productName.toLowerCase();

  let searchIn: CategoryProduct[] = [];
  if (categoryId) {
    const cat = getCategoryById(categoryId);
    if (cat) {
      searchIn = getEffectiveCategoryProducts(cat);
    }
  } else {
    searchIn = COMPANY_CATEGORIES.flatMap((c) =>
      getEffectiveCategoryProducts(c),
    );
  }

  // Exact match first
  const exact = searchIn.find((p) => p.name.toLowerCase() === lowerName);
  if (exact) return exact;

  // Contains match
  const contains = searchIn.find(
    (p) =>
      p.name.toLowerCase().includes(lowerName) ||
      lowerName.includes(p.name.toLowerCase()),
  );
  return contains ?? null;
}

/**
 * Get business category from localStorage.
 */
export function getBusinessCategory(businessId: string): string {
  return localStorage.getItem(`lekhya_biz_category_${businessId}`) ?? "";
}

export function saveBusinessCategory(businessId: string, category: string) {
  localStorage.setItem(`lekhya_biz_category_${businessId}`, category);
}
