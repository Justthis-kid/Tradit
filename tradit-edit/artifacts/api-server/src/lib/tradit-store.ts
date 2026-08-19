import { createHash, randomUUID } from "node:crypto";

export type Product = {
  id: string;
  brand: string;
  name: string;
  category: string;
  sizeRange: string;
  color: string;
  price: number;
  originalPrice: number;
  imageUrl: string;
  badge: string | null;
  description: string;
  availableSizes: string[];
};

export type Activity = {
  id: string;
  type: "trade_in" | "purchase" | "impact";
  title: string;
  detail: string;
  createdAt: string;
};

type Analysis = {
  id: string;
  hash: string;
  brand: string;
  model: string;
  condition: string;
  estimatedValue: number;
  creditOffer: number;
  status: "ready";
  decided: boolean;
};

type Order = {
  id: string;
  status: "confirmed";
  total: number;
  creditUsed: number;
  cashDue: number;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  createdAt: string;
};

const now = () => new Date().toISOString();

function shoeArt(background: string, upper: string, detail: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 520">
    <rect width="640" height="520" fill="${background}"/>
    <circle cx="516" cy="88" r="78" fill="${detail}" opacity=".18"/>
    <path d="M122 332c56-12 95-39 129-84l43-57c11-15 35-11 40 7l25 87c6 21 23 36 45 40l115 22c20 4 36 21 36 42v14H95v-24c0-22 8-39 27-47Z" fill="${upper}"/>
    <path d="M96 401h459c0 22-18 40-40 40H114c-10 0-18-8-18-18v-22Z" fill="${detail}"/>
    <path d="M265 194c30 17 55 28 83 34M245 224c37 17 68 27 103 32M229 255c37 14 69 23 105 27" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".82"/>
    <path d="M145 340c35-2 72-18 105-48" stroke="#fff" stroke-width="6" opacity=".45"/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const products: Product[] = [
  {
    id: "p1",
    brand: "Nike",
    name: "Air Force 1 '07",
    category: "Sneakers",
    sizeRange: "6–13",
    color: "Summit White / Gum",
    price: 78,
    originalPrice: 115,
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=85",
    badge: "Most loved",
    description: "A crisp everyday pair with a warm gum sole and a little more character.",
    availableSizes: ["7", "8", "9", "10", "11", "12"],
  },
  {
    id: "p2",
    brand: "New Balance",
    name: "550 Heritage",
    category: "Sneakers",
    sizeRange: "5–12",
    color: "Sea Salt / Red",
    price: 92,
    originalPrice: 130,
    imageUrl: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=85",
    badge: "Fresh drop",
    description: "A classic court shape in an easy, off-duty color story.",
    availableSizes: ["6", "7", "8", "9", "10", "11"],
  },
  {
    id: "p3",
    brand: "Salomon",
    name: "XT-6 Expanse",
    category: "Outdoor",
    sizeRange: "7–13",
    color: "Black / Desert Sage",
    price: 110,
    originalPrice: 160,
    imageUrl: "https://images.unsplash.com/photo-1554130849-1f6a06f2d8f3?auto=format&fit=crop&w=1000&q=85",
    badge: "Trail ready",
    description: "Technical comfort for city miles, weekend trails, and every detour between.",
    availableSizes: ["7", "8", "9", "10", "11", "12", "13"],
  },
  {
    id: "p4",
    brand: "ASICS",
    name: "Gel-Kayano 14",
    category: "Running",
    sizeRange: "6–12",
    color: "Cream / Clay",
    price: 98,
    originalPrice: 145,
    imageUrl: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=1000&q=85",
    badge: null,
    description: "Responsive cushioning with a throwback runner feel built for long days.",
    availableSizes: ["6", "7", "8", "9", "10", "11"],
  },
];

let creditBalance = 0;
let lifetimeEarned = 0;
let lifetimeSpent = 0;
let pairsCirculated = 0;
const activities: Activity[] = [];
const analyses = new Map<string, Analysis>();
const seenImageHashes = new Set<string>();
const scanTimestamps: number[] = [];
const orders: Order[] = [];

export function listProducts(): Product[] {
  return products;
}

export function getCreditBalance() {
  const pending = Array.from(analyses.values())
    .filter((analysis) => !analysis.decided)
    .reduce((total, analysis) => total + analysis.creditOffer, 0);
  return {
    balance: creditBalance,
    pending,
    lifetimeEarned,
    lifetimeSpent,
  };
}

export function getDashboard() {
  const hourAgo = Date.now() - 60 * 60 * 1000;
  while (scanTimestamps[0] && scanTimestamps[0] < hourAgo) scanTimestamps.shift();

  return {
    creditBalance,
    scansThisHour: scanTimestamps.length,
    scansLimit: 3,
    memberSince: "June 2024",
    pairsCirculated,
    recentActivity: activities.slice(0, 6),
  };
}

export function analyzeTradeIn(imageData: string): Analysis {
  const hash = createHash("sha256").update(imageData).digest("hex");
  if (seenImageHashes.has(hash)) {
    const error = new Error("That photo has already been scanned. Try a different pair or angle.");
    error.name = "DuplicateUploadError";
    throw error;
  }
  if (scanTimestamps.length >= 3) {
    const error = new Error("You’ve reached the three-scan hourly limit. Try again a little later.");
    error.name = "RateLimitError";
    throw error;
  }

  scanTimestamps.push(Date.now());
  seenImageHashes.add(hash);
  const analysis: Analysis = {
    id: randomUUID(),
    hash,
    brand: "Nike",
    model: "Air Force 1",
    condition: "Lightly worn",
    estimatedValue: 45,
    creditOffer: 30,
    status: "ready",
    decided: false,
  };
  analyses.set(analysis.id, analysis);
  return analysis;
}

export function decideTradeIn(id: string, decision: "accept" | "decline") {
  const analysis = analyses.get(id);
  if (!analysis) return null;
  if (analysis.decided) {
    const error = new Error("This offer has already been decided.");
    error.name = "OfferAlreadyDecidedError";
    throw error;
  }
  analysis.decided = true;
  if (decision === "decline") {
    analyses.delete(id);
    return {
      id,
      decision: "declined" as const,
      creditAdded: 0,
      newBalance: creditBalance,
      message: "No worries. The offer was declined and the photo was discarded.",
    };
  }

  creditBalance += analysis.creditOffer;
  lifetimeEarned += analysis.creditOffer;
  pairsCirculated += 1;
  activities.unshift({
    id: randomUUID(),
    type: "trade_in",
    title: `${analysis.model} accepted`,
    detail: `$${analysis.creditOffer} Tradit credit added`,
    createdAt: "Just now",
  });
  return {
    id,
    decision: "accepted" as const,
    creditAdded: analysis.creditOffer,
    newBalance: creditBalance,
    message: `$${analysis.creditOffer} Tradit credit is ready to use.`,
  };
}

export function createOrder(items: Array<{ productId: string; quantity: number }>) {
  const lineItems = items.map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    if (!product || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 5) {
      throw new Error("One of the pairs in your bag is no longer available.");
    }
    return {
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      unitPrice: product.price,
    };
  });
  const total = lineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const creditUsed = Math.min(creditBalance, total);
  const cashDue = total - creditUsed;
  creditBalance -= creditUsed;
  lifetimeSpent += creditUsed;
  const order: Order = {
    id: `TRD-${Math.floor(1000 + Math.random() * 9000)}`,
    status: "confirmed",
    total,
    creditUsed,
    cashDue,
    items: lineItems,
    createdAt: now(),
  };
  orders.unshift(order);
  activities.unshift({
    id: randomUUID(),
    type: "purchase",
    title: "New rotation secured",
    detail: `${lineItems[0].name}${lineItems.length > 1 ? ` + ${lineItems.length - 1} more` : ""}`,
    createdAt: "Just now",
  });
  return order;
}