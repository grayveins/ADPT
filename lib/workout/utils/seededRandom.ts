/**
 * Seeded Random - Deterministic random number generation
 * 
 * Using a seeded PRNG allows us to:
 * 1. Generate the same workout given the same inputs (reproducibility)
 * 2. Allow users to "regenerate" with a new seed
 * 3. Debug/test workout generation consistently
 * 
 * Uses a simple mulberry32 algorithm for fast, decent quality randomness.
 */

/**
 * Create a seeded random number generator using mulberry32 algorithm.
 * Returns a function that generates random floats in [0, 1).
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed;
  
  return function mulberry32(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A seeded random class with utility methods.
 */
export class SeededRandom {
  private _seed: number;
  private _next: () => number;
  
  constructor(seed?: number) {
    this._seed = seed ?? Date.now();
    this._next = createSeededRandom(this._seed);
  }
  
  /**
   * Get the current seed value.
   */
  get seed(): number {
    return this._seed;
  }
  
  /**
   * Generate a random float in [0, 1).
   */
  random(): number {
    return this._next();
  }
  
  /**
   * Generate a random integer in [min, max] inclusive.
   */
  int(min: number, max: number): number {
    return Math.floor(this._next() * (max - min + 1)) + min;
  }
  
  /**
   * Generate a random float in [min, max).
   */
  float(min: number, max: number): number {
    return this._next() * (max - min) + min;
  }
  
  /**
   * Generate a random boolean with given probability of true.
   */
  bool(probability = 0.5): boolean {
    return this._next() < probability;
  }
  
  /**
   * Pick a random element from an array.
   */
  pick<T>(array: readonly T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    return array[Math.floor(this._next() * array.length)];
  }
  
  /**
   * Pick a random element from an array, or undefined if empty.
   */
  pickOrUndefined<T>(array: readonly T[]): T | undefined {
    if (array.length === 0) return undefined;
    return array[Math.floor(this._next() * array.length)];
  }
  
  /**
   * Pick n random elements from an array without replacement.
   * If n >= array.length, returns a shuffled copy of the entire array.
   */
  sample<T>(array: readonly T[], n: number): T[] {
    const copy = [...array];
    const result: T[] = [];
    const count = Math.min(n, copy.length);
    
    for (let i = 0; i < count; i++) {
      const index = Math.floor(this._next() * copy.length);
      result.push(copy[index]);
      copy.splice(index, 1);
    }
    
    return result;
  }
  
  /**
   * Shuffle an array in place using Fisher-Yates algorithm.
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this._next() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  /**
   * Return a shuffled copy of an array.
   */
  shuffled<T>(array: readonly T[]): T[] {
    return this.shuffle([...array]);
  }
  
  /**
   * Weighted random selection from an array.
   * Each item needs a weight - higher weight = more likely to be picked.
   */
  weightedPick<T>(items: readonly T[], weights: readonly number[]): T {
    if (items.length !== weights.length) {
      throw new Error('Items and weights must have same length');
    }
    if (items.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = this._next() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }
    
    // Fallback to last item (shouldn't happen with valid weights)
    return items[items.length - 1];
  }
  
  /**
   * Generate a normally distributed random number using Box-Muller transform.
   * Useful for generating weight/rep variations.
   */
  gaussian(mean = 0, stdDev = 1): number {
    const u1 = this._next();
    const u2 = this._next();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }
  
  /**
   * Reset the generator to its initial state (same seed).
   */
  reset(): void {
    this._next = createSeededRandom(this._seed);
  }
  
  /**
   * Create a new generator with a different seed.
   */
  reseed(newSeed: number): SeededRandom {
    return new SeededRandom(newSeed);
  }
}

/**
 * Generate a seed from a string (e.g., user ID + date).
 * Uses a simple hash function.
 */
export function seedFromString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate a seed from user ID and date.
 * This ensures the same user gets the same workout on the same day,
 * but different workouts on different days.
 */
export function generateDailySeed(userId: string, date: Date = new Date()): number {
  const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return seedFromString(`${userId}-${dateString}`);
}

/**
 * Generate a seed for a specific week of a mesocycle.
 */
export function generateWeeklySeed(
  userId: string,
  programStartDate: Date,
  weekNumber: number
): number {
  const startString = programStartDate.toISOString().split('T')[0];
  return seedFromString(`${userId}-${startString}-week${weekNumber}`);
}

/**
 * Generate a completely random seed.
 */
export function generateRandomSeed(): number {
  return Math.floor(Math.random() * 2147483647);
}
