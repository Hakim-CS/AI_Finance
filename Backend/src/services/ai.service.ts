import * as tf from '@tensorflow/tfjs';

// ── LSTM MODEL CACHE ────────────────────────────────────────────────────────
// Stores one trained model per user. Invalidated whenever a new expense is saved.
interface CachedModel {
  model: tf.LayersModel;
  trainedAt: Date;
}
export const forecastModelCache = new Map<number, CachedModel>();

/**
 * Train (or use cached) LSTM/SimpleRNN model to predict next month's spending.
 * Uses SimpleRNN for < 5 data points, LSTM for >= 5.
 */
export async function predictWithLSTM(data: number[], userId?: number): Promise<number> {
  const n = data.length;
  if (n < 2) return data[0] || 0;

  // normalization with padding
  const max = Math.max(...data) * 1.5;
  const min = Math.min(...data) * 0.5;
  const range = max - min || 1;
  const normalizedData = data.map(val => (val - min) / range);

  // prepare Tensors
  const xs: number[][][] = [];
  const ys: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    xs.push([[normalizedData[i]]]);
    ys.push(normalizedData[i + 1]);
  }

  const tensorXs = tf.tensor(xs, [xs.length, 1, 1]) as tf.Tensor3D;
  const tensorYs = tf.tensor(ys, [ys.length, 1]) as tf.Tensor2D;

  // --- CHECK CACHE ---
  // If we have a valid cached model for this user, skip training entirely.
  if (userId !== undefined && forecastModelCache.has(userId)) {
    const cached = forecastModelCache.get(userId)!;
    console.log(`[Forecast] Using cached model for user ${userId} (trained at ${cached.trainedAt.toLocaleTimeString()})`);
    const lastVal = normalizedData[n - 1];
    const input = tf.tensor3d([[[lastVal]]]);
    const prediction = cached.model.predict(input) as tf.Tensor;
    const predictedValue = (await prediction.data())[0];
    tf.dispose([tensorXs, tensorYs, input, prediction]);
    return (predictedValue * range) + min;
  }

  // Dynamic Model Selection
  // LSTM needs more data to be stable. For < 5 months, SimpleRNN is safer.
  const model = tf.sequential();
  if (n < 5) {
    model.add(tf.layers.simpleRNN({ units: 16, inputShape: [1, 1] }));
  } else {
    model.add(tf.layers.lstm({ units: 32, inputShape: [1, 1] }));
  }
  model.add(tf.layers.dense({ units: 1 }));

  model.compile({ optimizer: tf.train.adam(0.02), loss: 'meanSquaredError' });

  // Training
  await model.fit(tensorXs, tensorYs, { epochs: 250, verbose: 0 });

  // Save to cache before predicting
  if (userId !== undefined) {
    forecastModelCache.set(userId, { model, trainedAt: new Date() });
    console.log(`[Forecast] Model trained and cached for user ${userId}`);
  }

  // Predict
  const lastVal = normalizedData[n - 1];
  const input = tf.tensor3d([[[lastVal]]]);
  const prediction = model.predict(input) as tf.Tensor;
  const predictedValue = (await prediction.data())[0];

  tf.dispose([tensorXs, tensorYs, input, prediction]); // Clean up memory

  return (predictedValue * range) + min;
}

// ── CATEGORY CLASSIFICATION ENGINE ──────────────────────────────────────────
//
// Scoring-based multi-language classifier for voice and receipt text.
//
// How it works:
//   1. Multi-word phrases are checked first (higher weight = more specific)
//   2. Single keywords are checked with word-boundary matching (not substring)
//   3. Each category accumulates a score from all matching keywords
//   4. The highest-scoring category wins (not first-match)
//   5. Falls back to "other" only if no category scores above 0
//

interface KeywordEntry {
  /** The keyword or phrase to match */
  term: string;
  /** Higher weight = stronger signal. Phrases get 3, single words get 1. */
  weight: number;
}

/** Build keyword entries: multi-word phrases get weight 3, single words get weight 1 */
function buildEntries(terms: string[]): KeywordEntry[] {
  return terms.map(term => ({
    term: term.toLowerCase(),
    weight: term.includes(' ') ? 3 : 1,
  }));
}

const CATEGORY_RULES: Record<string, KeywordEntry[]> = {
  food: buildEntries([
    // ── Phrases (matched first, weight 3) ──
    "trader joe", "whole foods", "fast food", "ice cream", "fried chicken",
    "grocery store", "coffee shop", "food delivery", "meal prep", "dining out",
    "uber eats", "door dash", "grub hub",
    // ── English ──
    "food", "eat", "ate", "eaten", "lunch", "dinner", "breakfast", "brunch",
    "restaurant", "cafe", "coffee", "grocery", "groceries", "snack", "snacks",
    "pizza", "burger", "sushi", "bakery", "diner", "takeout", "takeaway",
    "chicken", "rice", "bread", "meat", "fish", "salad", "soup", "noodle",
    "taco", "sandwich", "donut", "pastry", "dessert", "chocolate", "fruit",
    "vegetable", "milk", "cheese", "egg", "cereal", "yogurt",
    "walmart", "costco", "starbucks", "mcdonald", "mcdonalds", "subway",
    "chipotle", "wendys", "dominos", "kfc", "dunkin", "panera",
    // ── Turkish ──
    "yemek", "restoran", "lokanta", "kahve", "simit", "corba", "kebap", "kebab",
    "mutfak", "kahvalti", "ogle yemegi", "aksam yemegi", "pilav", "ekmek",
    "migros", "bim", "sok", "carrefour", "a101", "firin", "pastane", "manav",
    // ── German ──
    "essen", "fruhstuck", "mittagessen", "abendessen", "kaffee", "backerei",
    "supermarkt", "lebensmittel", "brot", "fleisch", "obst", "gemuse",
    "edeka", "aldi", "lidl", "rewe", "netto", "penny", "rossmann",
  ]),

  transport: buildEntries([
    // ── Phrases ──
    "gas station", "train ticket", "bus ticket", "bus pass", "car wash",
    "car repair", "car service", "auto repair", "oil change", "tire change",
    "public transport", "ride share",
    // ── English ──
    "transport", "transportation", "taxi", "uber", "lyft", "parking", "toll",
    "fuel", "gasoline", "diesel", "commute", "commuting", "carpool",
    "subway", "tram", "ferry", "highway",
    "benzin", "otobus", "taksi", "metro", "akbil", "yakit", "otopark", "kopru",
    "shell", "opet", "petrol", "marmaray",
    // ── German ──
    "zug", "bahn", "fahrt", "tanken", "fahrkarte", "tankstelle",
    "parkplatz", "strassenbahn", "fahrrad",
  ]),

  shopping: buildEntries([
    // ── Phrases ──
    "online shopping", "shopping mall", "gift card", "black friday",
    // ── English ──
    "shopping", "clothes", "clothing", "shoes", "sneakers", "boots",
    "jacket", "dress", "shirt", "pants", "jeans", "hat", "bag", "purse",
    "handbag", "backpack", "jewelry", "watch", "sunglasses", "accessories",
    "furniture", "electronics", "gadget", "laptop", "headphones", "speaker",
    "amazon", "ebay", "etsy", "store", "mall", "outlet", "boutique",
    "h&m", "zara", "nike", "adidas", "uniqlo", "target",
    // ── Turkish ──
    "alisveris", "kiyafet", "ayakkabi", "avm", "magaza",
    "boyner", "gratis", "watsons", "lcw", "koton", "flo", "decathlon", "ikea",
    // ── German ──
    "einkaufen", "kleidung", "schuhe", "kaufhaus", "geschenk",
  ]),

  entertainment: buildEntries([
    // ── Phrases ──
    "video game", "board game", "theme park", "amusement park",
    "escape room", "bowling alley", "movie theater", "live music",
    // ── English ──
    "movie", "cinema", "film", "netflix", "spotify", "disney", "hulu",
    "youtube", "twitch", "concert", "theater", "theatre", "ticket",
    "streaming", "gaming", "playstation", "xbox", "nintendo", "steam",
    "nightclub", "club", "karaoke", "comedy", "show", "festival",
    "museum", "zoo", "aquarium", "arcade", "bowling", "pool",
    "pub", "bar", "beer", "wine", "cocktail", "drinks",
    // ── Turkish ──
    "sinema", "tiyatro", "konser", "oyun", "eglence", "bilet",
    // ── German ──
    "kino", "spiel", "konzert", "unterhaltung", "veranstaltung", "bier",
  ]),

  utilities: buildEntries([
    // ── Phrases ──
    "electric bill", "electricity bill", "water bill", "gas bill",
    "phone bill", "internet bill", "cable bill", "heating bill",
    "cell phone", "mobile phone", "home insurance", "car insurance",
    "monthly subscription", "streaming subscription",
    "natural gas", "utility bill",
    // ── English ──
    "electricity", "electric", "water", "internet", "wifi",
    "phone", "rent", "mortgage", "bill", "insurance", "subscription",
    "utility", "utilities", "heating", "sewage", "trash", "garbage",
    "cable", "broadband", "mobile", "cellular",
    // ── Turkish ──
    "elektrik", "dogalgaz", "kira", "aidat", "fatura",
    "turkcell", "vodafone", "telekom", "su",
    // ── German ──
    "strom", "wasser", "miete", "rechnung", "versicherung", "telefon",
    "heizung", "nebenkosten", "rundfunk",
  ]),

  health: buildEntries([
    // ── Phrases ──
    "doctor visit", "eye doctor", "dental checkup", "blood test",
    "physical therapy", "mental health", "gym membership",
    "health insurance", "medical bill",
    // ── English ──
    "doctor", "pharmacy", "medicine", "medication", "hospital", "dental",
    "dentist", "clinic", "health", "medical", "prescription", "therapy",
    "therapist", "surgeon", "surgery", "emergency", "ambulance",
    "vitamin", "supplement", "gym", "fitness", "workout", "exercise",
    "optician", "glasses", "contacts", "vaccine", "checkup",
    // ── Turkish ──
    "eczane", "doktor", "ilac", "hastane", "saglik", "disci", "optik",
    "spor salonu", "muayene", "ameliyat",
    // ── German ──
    "arzt", "apotheke", "medizin", "krankenhaus", "zahnarzt", "gesundheit",
    "fitnessstudio", "rezept", "behandlung",
  ]),

  travel: buildEntries([
    // ── Phrases ──
    "plane ticket", "flight ticket", "train ticket", "hotel room",
    "car rental", "rental car", "travel insurance", "road trip",
    "cruise ship", "travel agency",
    // ── English ──
    "flight", "hotel", "motel", "hostel", "vacation", "holiday",
    "booking", "airbnb", "trip", "airport", "luggage", "suitcase",
    "passport", "visa", "resort", "cruise", "excursion", "tour",
    "souvenir", "camping", "backpacking",
    // ── Turkish ──
    "ucak", "otel", "tatil", "pasaport", "konaklama", "gezi",
    "thy", "pegasus", "havaalani", "bavul",
    // ── German ──
    "flug", "reise", "urlaub", "flugreise", "gepack", "koffer",
    "ferienwohnung", "reisepass",
  ]),
};

// ── Disambiguation rules: multi-word context overrides ──────────────────────
// These resolve ambiguous single words (like "gas", "bar", "bus") when
// surrounding context makes the intent clear.
const DISAMBIGUATION_RULES: { pattern: RegExp; category: string; weight: number }[] = [
  // "gas bill" / "gas payment" → utilities, NOT transport
  { pattern: /\bgas\s+(bill|payment|charge|company|service|heating)\b/i, category: "utilities", weight: 5 },
  // "natural gas" → utilities
  { pattern: /\bnatural\s+gas\b/i, category: "utilities", weight: 5 },
  // "gas station" / "gas pump" → transport
  { pattern: /\bgas\s+(station|pump|tank)\b/i, category: "transport", weight: 5 },
  // "bar tab" / "at the bar" → entertainment
  { pattern: /\b(at\s+the\s+bar|bar\s+tab|sports\s+bar)\b/i, category: "entertainment", weight: 5 },
  // "bus ticket" → transport (not "business")
  { pattern: /\bbus\s+(ticket|pass|fare|stop|station|ride)\b/i, category: "transport", weight: 5 },
  // "online doctor" / "online pharmacy" → health, NOT shopping
  { pattern: /\bonline\s+(doctor|pharmacy|clinic|prescription|therapy)\b/i, category: "health", weight: 5 },
  // "online shopping" / "online store" → shopping
  { pattern: /\bonline\s+(shopping|store|order|purchase)\b/i, category: "shopping", weight: 5 },
  // "train ticket" → travel if context suggests long-distance
  { pattern: /\b(flight|plane)\s+(ticket|booking)\b/i, category: "travel", weight: 5 },
];

/**
 * Score-based category classification.
 * Returns the category with the highest accumulated score, or "other" if nothing matches.
 */
function classifyCategory(text: string): string {
  const normalized = text.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/ä/g, 'a').replace(/ß/g, 'ss');

  const scores: Record<string, number> = {};

  // Step 1: Apply disambiguation rules first (highest priority)
  for (const rule of DISAMBIGUATION_RULES) {
    if (rule.pattern.test(normalized)) {
      scores[rule.category] = (scores[rule.category] || 0) + rule.weight;
    }
  }

  // Step 2: Score each category by matching keywords with word boundaries
  for (const [category, entries] of Object.entries(CATEGORY_RULES)) {
    for (const entry of entries) {
      // Multi-word phrases: use simple includes (they're specific enough)
      // Single words: use word-boundary regex to avoid "bus" matching "business"
      let matched = false;
      if (entry.term.includes(' ')) {
        matched = normalized.includes(entry.term);
      } else {
        const regex = new RegExp(`\\b${escapeRegex(entry.term)}\\b`, 'i');
        matched = regex.test(normalized);
      }

      if (matched) {
        scores[category] = (scores[category] || 0) + entry.weight;
      }
    }
  }

  // Step 3: Pick the category with the highest score
  let bestCategory = "other";
  let bestScore = 0;
  for (const [category, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

/** Escape special regex characters in a string */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Re-export for backward compatibility (receipt parsing still references this)
export const CATEGORY_KEYWORDS = Object.fromEntries(
  Object.entries(CATEGORY_RULES).map(([cat, entries]) => [
    cat,
    entries.map(e => e.term),
  ])
);

/**
 * Parse a voice transcript to extract amount, category, description, and date.
 */
export function parseVoiceTranscript(transcript: string) {
  let amount: number | null = null;
  const description = transcript;
  const date = new Date().toISOString().split('T')[0];

  // Extract amount: handle "25 dollars", "$25.50", "100,99", plain "50"
  const amountMatch = transcript.match(/\$?\s*(\d+([.,]\d{1,2})?)/);
  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(',', '.'));
  }

  const categoryId = classifyCategory(transcript);

  return { amount, categoryId, description, date };
}

/**
 * Parse receipt text to extract amount, category, description, and date.
 */
export function parseReceiptText(text: string) {
  let amount: number | null = null;
  const description = "Receipt Expense";
  const date = new Date().toISOString().split('T')[0];

  // Normalize: lowercase + strip Turkish/German special characters + asterisks
  const normalizedText = text.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/ä/g, 'a').replace(/ß/g, 'ss')
    .replace(/\*/g, '');

  // Strategy A: Look for total keywords (EN/TR/DE) followed by a price
  const totalMatch = normalizedText.match(
    /(toplam|tutar|total|subtotal|amount|due|summe|betrag|gesamt|gesamtbetrag|ara toplam|top)\s*[:=]*\s*(\d{1,6}([.,]\d{2})?)/
  );

  if (totalMatch) {
    amount = parseFloat(totalMatch[2].replace(',', '.'));
  } else {
    // Strategy B: Find all potential prices and take the highest
    const priceMatches = normalizedText.match(/\d+([.,]\d{2})/g);
    if (priceMatches) {
      const prices = priceMatches
        .map((m: string) => parseFloat(m.replace(',', '.')))
        .filter((n: number) => n > 0 && n < 50000);

      if (prices.length > 0) {
        amount = Math.max(...prices);
      }
    }
  }

  const categoryId = classifyCategory(text);

  return { amount, categoryId, description, date };
}
