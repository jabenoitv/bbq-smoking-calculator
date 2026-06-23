/**
 * WeightConverter - Weight unit conversion (kg ↔ lbs, kg ↔ grams)
 * Responsabilidad única: Conversión de unidades de peso
 */

class WeightConverter {
  // Conversion constants
  static KG_TO_LBS = 2.20462;
  static LBS_TO_KG = 0.453592;
  static KG_TO_GRAMS = 1000;
  static GRAMS_TO_KG = 0.001;
  static LBS_TO_GRAMS = 453.592;
  static GRAMS_TO_LBS = 0.00220462;

  /**
   * Converts kilograms to pounds
   * Formula: lbs = kg × 2.20462
   * @param {number} kg - Weight in kilograms
   * @returns {Object} { value, unit, formatted }
   */
  static kgToLbs(kg) {
    if (typeof kg !== 'number') {
      throw new Error('Weight must be a number');
    }

    if (kg < 0) {
      throw new Error('Weight cannot be negative');
    }

    const lbs = Math.round(kg * this.KG_TO_LBS * 100) / 100;

    return {
      value: lbs,
      unit: 'lbs',
      formatted: `${lbs} lbs`
    };
  }

  /**
   * Converts pounds to kilograms
   * Formula: kg = lbs × 0.453592
   * @param {number} lbs - Weight in pounds
   * @returns {Object} { value, unit, formatted }
   */
  static lbsToKg(lbs) {
    if (typeof lbs !== 'number') {
      throw new Error('Weight must be a number');
    }

    if (lbs < 0) {
      throw new Error('Weight cannot be negative');
    }

    const kg = Math.round(lbs * this.LBS_TO_KG * 100) / 100;

    return {
      value: kg,
      unit: 'kg',
      formatted: `${kg} kg`
    };
  }

  /**
   * Converts kilograms to grams
   * Formula: grams = kg × 1000
   * @param {number} kg - Weight in kilograms
   * @returns {Object} { value, unit, formatted }
   */
  static kgToGrams(kg) {
    if (typeof kg !== 'number') {
      throw new Error('Weight must be a number');
    }

    if (kg < 0) {
      throw new Error('Weight cannot be negative');
    }

    const grams = Math.round(kg * this.KG_TO_GRAMS * 10) / 10;

    return {
      value: grams,
      unit: 'g',
      formatted: `${grams}g`
    };
  }

  /**
   * Converts grams to kilograms
   * Formula: kg = grams × 0.001
   * @param {number} grams - Weight in grams
   * @returns {Object} { value, unit, formatted }
   */
  static gramsToKg(grams) {
    if (typeof grams !== 'number') {
      throw new Error('Weight must be a number');
    }

    if (grams < 0) {
      throw new Error('Weight cannot be negative');
    }

    const kg = Math.round(grams * this.GRAMS_TO_KG * 100) / 100;

    return {
      value: kg,
      unit: 'kg',
      formatted: `${kg} kg`
    };
  }

  /**
   * Converts pounds to grams
   * Formula: grams = lbs × 453.592
   * @param {number} lbs - Weight in pounds
   * @returns {Object} { value, unit, formatted }
   */
  static lbsToGrams(lbs) {
    if (typeof lbs !== 'number') {
      throw new Error('Weight must be a number');
    }

    if (lbs < 0) {
      throw new Error('Weight cannot be negative');
    }

    const grams = Math.round(lbs * this.LBS_TO_GRAMS * 10) / 10;

    return {
      value: grams,
      unit: 'g',
      formatted: `${grams}g`
    };
  }

  /**
   * Converts grams to pounds
   * Formula: lbs = grams × 0.00220462
   * @param {number} grams - Weight in grams
   * @returns {Object} { value, unit, formatted }
   */
  static gramsToLbs(grams) {
    if (typeof grams !== 'number') {
      throw new Error('Weight must be a number');
    }

    if (grams < 0) {
      throw new Error('Weight cannot be negative');
    }

    const lbs = Math.round(grams * this.GRAMS_TO_LBS * 100) / 100;

    return {
      value: lbs,
      unit: 'lbs',
      formatted: `${lbs} lbs`
    };
  }

  /**
   * Converts and compares weight in different units
   * @param {number} value
   * @param {string} unit - 'kg', 'lbs', or 'g'
   * @returns {Object} All conversions
   */
  static convertAndCompare(value, unit) {
    if (!['kg', 'lbs', 'g'].includes(unit)) {
      throw new Error('Unit must be kg, lbs, or g');
    }

    if (unit === 'kg') {
      return {
        kg: { value, unit: 'kg', formatted: `${value} kg` },
        lbs: this.kgToLbs(value),
        grams: this.kgToGrams(value)
      };
    } else if (unit === 'lbs') {
      return {
        kg: this.lbsToKg(value),
        lbs: { value, unit: 'lbs', formatted: `${value} lbs` },
        grams: this.lbsToGrams(value)
      };
    } else {
      return {
        kg: this.gramsToKg(value),
        lbs: this.gramsToLbs(value),
        grams: { value, unit: 'g', formatted: `${value}g` }
      };
    }
  }

  /**
   * Batch convert array of weights
   * @param {number[]} values
   * @param {string} fromUnit
   * @param {string} toUnit
   * @returns {Object[]} Array of converted weights
   */
  static batchConvert(values, fromUnit, toUnit) {
    if (!Array.isArray(values)) {
      throw new Error('Values must be an array');
    }

    const converterMap = {
      'kg->lbs': (v) => this.kgToLbs(v),
      'lbs->kg': (v) => this.lbsToKg(v),
      'kg->g': (v) => this.kgToGrams(v),
      'g->kg': (v) => this.gramsToKg(v),
      'lbs->g': (v) => this.lbsToGrams(v),
      'g->lbs': (v) => this.gramsToLbs(v)
    };

    const key = `${fromUnit}->${toUnit}`;
    const converter = converterMap[key];

    if (!converter) {
      throw new Error(`Unsupported conversion: ${key}`);
    }

    return values.map(v => converter(v));
  }
}

export default WeightConverter;
