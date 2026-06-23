/**
 * RubCalculator - Calculates rub quantities and ingredient breakdown
 * Responsabilidad única: Cálculo de especias y rub para BBQ
 */

class RubCalculator {
  /**
   * Rub formula base: standard proportions for BBQ rub
   * Formula: ~10-15% of meat weight depending on meat type
   */
  static RUB_FORMULAS = {
    brisket: {
      rubPercentage: 0.12, // 12% of weight
      ingredients: {
        salt: 0.30,
        sugar: 0.25,
        paprika: 0.15,
        blackPepper: 0.15,
        cayenne: 0.05,
        garlic: 0.05,
        onion: 0.05
      }
    },
    pork_butt: {
      rubPercentage: 0.14, // 14% of weight
      ingredients: {
        salt: 0.28,
        sugar: 0.28,
        paprika: 0.15,
        blackPepper: 0.12,
        cayenne: 0.08,
        garlic: 0.05,
        onion: 0.04
      }
    },
    ribs: {
      rubPercentage: 0.15, // 15% of weight (more surface area)
      ingredients: {
        salt: 0.25,
        sugar: 0.30,
        paprika: 0.15,
        blackPepper: 0.15,
        cayenne: 0.07,
        garlic: 0.05,
        onion: 0.03
      }
    },
    chicken: {
      rubPercentage: 0.10, // 10% of weight
      ingredients: {
        salt: 0.32,
        sugar: 0.22,
        paprika: 0.18,
        blackPepper: 0.12,
        cayenne: 0.04,
        garlic: 0.06,
        onion: 0.06
      }
    },
    turkey: {
      rubPercentage: 0.11, // 11% of weight
      ingredients: {
        salt: 0.31,
        sugar: 0.23,
        paprika: 0.16,
        blackPepper: 0.13,
        cayenne: 0.05,
        garlic: 0.06,
        onion: 0.06
      }
    }
  };

  /**
   * Calculates rub amount and ingredient breakdown for a meat
   * @param {string} meatType - Type of meat (brisket, pork_butt, ribs, chicken, turkey)
   * @param {number} weightKg - Weight of meat in kilograms
   * @returns {Object} { rubGrams, rubbedPercentage, ingredients, instructions }
   */
  static calculate(meatType, weightKg) {
    if (!meatType || !weightKg) {
      throw new Error('Missing required parameters: meatType, weightKg');
    }

    const formula = this.RUB_FORMULAS[meatType];
    if (!formula) {
      throw new Error(`Unknown meat type: ${meatType}`);
    }

    if (weightKg <= 0) {
      throw new Error('Weight must be positive');
    }

    // Convert kg to grams
    const weightGrams = weightKg * 1000;

    // Calculate total rub in grams
    const rubGrams = Math.round(weightGrams * formula.rubPercentage * 10) / 10;

    // Calculate individual ingredients
    const ingredients = {};
    for (const [ingredient, proportion] of Object.entries(formula.ingredients)) {
      ingredients[ingredient] = Math.round(rubGrams * proportion * 10) / 10;
    }

    return {
      meatType,
      weightKg,
      rubGrams,
      rubbedPercentage: formula.rubPercentage * 100,
      ingredients,
      instructions: this.generateInstructions(meatType, rubGrams, ingredients)
    };
  }

  /**
   * Generates application instructions
   * @private
   */
  static generateInstructions(meatType, rubGrams, ingredients) {
    return [
      `Mix ${rubGrams}g of rub ingredients in a bowl`,
      `Apply evenly across all surfaces of ${meatType}`,
      `Massage rub into meat, focusing on crevices`,
      `Let sit 30 minutes to 2 hours before smoking`,
      'Reserve any leftover rub for during cooking'
    ];
  }

  /**
   * Gets available meat types
   * @returns {string[]}
   */
  static getAvailableMeatTypes() {
    return Object.keys(this.RUB_FORMULAS);
  }

  /**
   * Validates a meat type
   * @param {string} meatType
   * @returns {boolean}
   */
  static isValidMeatType(meatType) {
    return meatType in this.RUB_FORMULAS;
  }
}

export default RubCalculator;
