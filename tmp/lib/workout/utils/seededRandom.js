"use strict";
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeededRandom = void 0;
exports.createSeededRandom = createSeededRandom;
exports.seedFromString = seedFromString;
exports.generateDailySeed = generateDailySeed;
exports.generateWeeklySeed = generateWeeklySeed;
exports.generateRandomSeed = generateRandomSeed;
/**
 * Create a seeded random number generator using mulberry32 algorithm.
 * Returns a function that generates random floats in [0, 1).
 */
function createSeededRandom(seed) {
    var state = seed;
    return function mulberry32() {
        state |= 0;
        state = (state + 0x6d2b79f5) | 0;
        var t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
/**
 * A seeded random class with utility methods.
 */
var SeededRandom = /** @class */ (function () {
    function SeededRandom(seed) {
        this._seed = seed !== null && seed !== void 0 ? seed : Date.now();
        this._next = createSeededRandom(this._seed);
    }
    Object.defineProperty(SeededRandom.prototype, "seed", {
        /**
         * Get the current seed value.
         */
        get: function () {
            return this._seed;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Generate a random float in [0, 1).
     */
    SeededRandom.prototype.random = function () {
        return this._next();
    };
    /**
     * Generate a random integer in [min, max] inclusive.
     */
    SeededRandom.prototype.int = function (min, max) {
        return Math.floor(this._next() * (max - min + 1)) + min;
    };
    /**
     * Generate a random float in [min, max).
     */
    SeededRandom.prototype.float = function (min, max) {
        return this._next() * (max - min) + min;
    };
    /**
     * Generate a random boolean with given probability of true.
     */
    SeededRandom.prototype.bool = function (probability) {
        if (probability === void 0) { probability = 0.5; }
        return this._next() < probability;
    };
    /**
     * Pick a random element from an array.
     */
    SeededRandom.prototype.pick = function (array) {
        if (array.length === 0) {
            throw new Error('Cannot pick from empty array');
        }
        return array[Math.floor(this._next() * array.length)];
    };
    /**
     * Pick a random element from an array, or undefined if empty.
     */
    SeededRandom.prototype.pickOrUndefined = function (array) {
        if (array.length === 0)
            return undefined;
        return array[Math.floor(this._next() * array.length)];
    };
    /**
     * Pick n random elements from an array without replacement.
     * If n >= array.length, returns a shuffled copy of the entire array.
     */
    SeededRandom.prototype.sample = function (array, n) {
        var copy = __spreadArray([], array, true);
        var result = [];
        var count = Math.min(n, copy.length);
        for (var i = 0; i < count; i++) {
            var index = Math.floor(this._next() * copy.length);
            result.push(copy[index]);
            copy.splice(index, 1);
        }
        return result;
    };
    /**
     * Shuffle an array in place using Fisher-Yates algorithm.
     */
    SeededRandom.prototype.shuffle = function (array) {
        var _a;
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(this._next() * (i + 1));
            _a = [array[j], array[i]], array[i] = _a[0], array[j] = _a[1];
        }
        return array;
    };
    /**
     * Return a shuffled copy of an array.
     */
    SeededRandom.prototype.shuffled = function (array) {
        return this.shuffle(__spreadArray([], array, true));
    };
    /**
     * Weighted random selection from an array.
     * Each item needs a weight - higher weight = more likely to be picked.
     */
    SeededRandom.prototype.weightedPick = function (items, weights) {
        if (items.length !== weights.length) {
            throw new Error('Items and weights must have same length');
        }
        if (items.length === 0) {
            throw new Error('Cannot pick from empty array');
        }
        var totalWeight = weights.reduce(function (sum, w) { return sum + w; }, 0);
        var random = this._next() * totalWeight;
        for (var i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }
        // Fallback to last item (shouldn't happen with valid weights)
        return items[items.length - 1];
    };
    /**
     * Generate a normally distributed random number using Box-Muller transform.
     * Useful for generating weight/rep variations.
     */
    SeededRandom.prototype.gaussian = function (mean, stdDev) {
        if (mean === void 0) { mean = 0; }
        if (stdDev === void 0) { stdDev = 1; }
        var u1 = this._next();
        var u2 = this._next();
        var z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return z0 * stdDev + mean;
    };
    /**
     * Reset the generator to its initial state (same seed).
     */
    SeededRandom.prototype.reset = function () {
        this._next = createSeededRandom(this._seed);
    };
    /**
     * Create a new generator with a different seed.
     */
    SeededRandom.prototype.reseed = function (newSeed) {
        return new SeededRandom(newSeed);
    };
    return SeededRandom;
}());
exports.SeededRandom = SeededRandom;
/**
 * Generate a seed from a string (e.g., user ID + date).
 * Uses a simple hash function.
 */
function seedFromString(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
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
function generateDailySeed(userId, date) {
    if (date === void 0) { date = new Date(); }
    var dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return seedFromString("".concat(userId, "-").concat(dateString));
}
/**
 * Generate a seed for a specific week of a mesocycle.
 */
function generateWeeklySeed(userId, programStartDate, weekNumber) {
    var startString = programStartDate.toISOString().split('T')[0];
    return seedFromString("".concat(userId, "-").concat(startString, "-week").concat(weekNumber));
}
/**
 * Generate a completely random seed.
 */
function generateRandomSeed() {
    return Math.floor(Math.random() * 2147483647);
}
