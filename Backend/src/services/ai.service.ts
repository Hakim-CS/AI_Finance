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

// ── MULTI-LANGUAGE KEYWORD MAP (shared by voice + receipt parsing) ───────────
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  food: [
    // English
    "food", "eat", "lunch", "dinner", "breakfast", "restaurant", "cafe", "coffee",
    "grocery", "snack", "pizza", "burger", "sushi", "bakery", "diner",
    "walmart", "costco", "trader joe", "whole foods", "starbucks", "mcdonald", "subway",
    // Turkish
    "yemek", "restoran", "lokanta", "kahve", "simit", "corba", "kebap", "mutfak",
    "migros", "bim", "sok", "carrefour", "a101", "firin", "pastane",
    // German
    "essen", "fruhstuck", "mittagessen", "abendessen", "kaffee", "backerei",
    "supermarkt", "edeka", "aldi", "lidl", "rewe", "netto", "penny",
  ],
  transport: [
    "transport", "taxi", "uber", "lyft", "bus", "train", "gas", "fuel", "parking", "toll",
    "benzin", "otobus", "taksi", "metro", "akbil", "yakit", "otopark", "kopru",
    "shell", "opet", "bp", "petrol", "marmaray",
    "zug", "bahn", "fahrt", "tanken", "fahrkarte", "tankstelle",
  ],
  shopping: [
    "shopping", "clothes", "shoes", "amazon", "online", "store", "mall",
    "market", "alisveris", "kiyafet", "ayakkabi", "fatura", "avm",
    "h&m", "zara", "boyner", "gratis", "watsons", "rossmann", "lcw", "koton", "flo", "decathlon", "ikea",
    "einkaufen", "kleidung", "schuhe", "kaufhaus",
  ],
  entertainment: [
    "movie", "cinema", "game", "netflix", "spotify", "concert", "theater", "ticket", "stream",
    "sinema", "tiyatro", "konser", "oyun", "eglence", "pub", "bar",
    "kino", "spiel", "konzert", "unterhaltung", "veranstaltung",
  ],
  utilities: [
    "electricity", "water", "gas", "internet", "phone", "rent", "bill", "insurance", "subscription",
    "su", "elektrik", "dogalgaz", "kira", "aidat", "turkcell", "vodafone", "telekom",
    "strom", "wasser", "miete", "rechnung", "versicherung", "telefon",
  ],
  health: [
    "doctor", "pharmacy", "medicine", "hospital", "dental", "clinic", "health",
    "eczane", "doktor", "ilac", "hastane", "saglik", "disci", "optik",
    "arzt", "apotheke", "medizin", "krankenhaus", "zahnarzt", "gesundheit",
  ],
  travel: [
    "flight", "hotel", "vacation", "booking", "airbnb", "trip", "airport", "luggage",
    "ucak", "otel", "tatil", "bilet", "pasaport", "konaklama", "thy", "pegasus",
    "flug", "reise", "urlaub", "flugreise", "gepack",
  ],
};

/**
 * Parse a voice transcript to extract amount, category, description, and date.
 */
export function parseVoiceTranscript(transcript: string) {
  let amount: number | null = null;
  let categoryId = "other";
  const description = transcript;
  const date = new Date().toISOString().split('T')[0];

  // Extract amount: handle decimals like "25.50", "100,99", and plain integers "50"
  const amountMatch = transcript.match(/(\d+([.,]\d{1,2})?)/);
  if (amountMatch) {
    amount = parseFloat(amountMatch[0].replace(',', '.'));
  }

  // Match category using multi-language keywords
  const lowerTranscript = transcript.toLowerCase();
  for (const [catId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lowerTranscript.includes(kw))) {
      categoryId = catId;
      break;
    }
  }

  return { amount, categoryId, description, date };
}

/**
 * Parse receipt text to extract amount, category, description, and date.
 */
export function parseReceiptText(text: string) {
  let amount: number | null = null;
  let categoryId = "other";
  const description = "Receipt Expense";
  const date = new Date().toISOString().split('T')[0];

  // Normalize: lowercase + strip Turkish special characters + asterisks
  const normalizedText = text.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/ä/g, 'a').replace(/ß/g, 'ss')  // German chars
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

  // Category matching using multi-language keywords
  for (const [id, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => normalizedText.includes(keyword))) {
      categoryId = id;
      break;
    }
  }

  return { amount, categoryId, description, date };
}
