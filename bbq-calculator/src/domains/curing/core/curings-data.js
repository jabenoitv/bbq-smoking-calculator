/**
 * Cure profiles and formulas
 * Standard curing recipes for different meat preparations
 */

export const CURE_PROFILES = {
  bacon: {
    name: 'Bacon',
    method: 'dry_cure',
    description: 'Pork belly cured for breakfast bacon',
    saltPct: 4.5,      // 4.5% of weight
    pinkSaltPct: 0.25, // 0.25% (USDA Cure #1: 156 ppm nitrite)
    sugarPct: 2.0,     // 2% brown sugar
    cureMinDays: 7,
    postCureDays: 3,   // Drying/aging time
    postCureTemp: { min: 10, max: 15 }, // °C
    woodSuggestion: 'Apple, Cherry, or Maple',
    notes: 'Rinse after curing, pat dry for bark formation'
  },

  pastrami: {
    name: 'Pastrami',
    method: 'wet_brine',
    description: 'Beef brisket cured for pastrami',
    saltPct: 5.0,      // 5% of weight
    pinkSaltPct: 0.25,
    sugarPct: 1.5,
    cureMinDays: 5,
    postCureDays: 2,
    postCureTemp: { min: 15, max: 20 },
    woodSuggestion: 'Oak, Hickory, or Cherry',
    notes: 'Steam after smoking for traditional texture'
  },

  corned_beef: {
    name: 'Corned Beef',
    method: 'wet_brine',
    description: 'Beef brisket cured for corned beef',
    saltPct: 6.0,      // Higher salt for wet cure
    pinkSaltPct: 0.25,
    sugarPct: 1.0,
    cureMinDays: 7,
    postCureDays: 1,
    postCureTemp: { min: 10, max: 15 },
    woodSuggestion: 'Oak or Hickory',
    notes: 'Traditionally boiled or steamed, not smoked'
  },

  jerky: {
    name: 'Beef Jerky',
    method: 'dry_cure',
    description: 'Thin-sliced beef dried and seasoned',
    saltPct: 2.5,      // Lower salt for jerky
    pinkSaltPct: 0,    // No curing salt needed
    sugarPct: 1.5,
    cureMinDays: 2,
    postCureDays: 8,   // Extended drying time
    postCureTemp: { min: 50, max: 70 }, // Low temperature drying
    woodSuggestion: 'Apple, Cherry, or Oak (light smoke)',
    notes: 'Slice against the grain for tenderness, dry at low temp'
  }
};

export const CURE_STANDARDS = {
  usda_cure_1: {
    name: 'USDA Cure #1 (Pink Salt)',
    nitritePpm: 156,
    concentration: 0.25, // 0.25% = 156 ppm in final product
    maxUsage: 'Safe up to 0.25% weight'
  }
};

export const CURE_METHODS = {
  dry_cure: 'Dry cure (salt rubbed on meat)',
  wet_brine: 'Wet brine (meat submerged in salt solution)',
  marinade: 'Marinade (flavored salt mixture)'
};
