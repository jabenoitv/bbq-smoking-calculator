/**
 * TempConverter - Temperature unit conversion (Celsius ↔ Fahrenheit)
 * Responsabilidad única: Conversión de unidades de temperatura
 */

class TempConverter {
  /**
   * Converts Celsius to Fahrenheit
   * Formula: °F = (°C × 9/5) + 32
   * @param {number} celsius - Temperature in Celsius
   * @returns {Object} { value, unit, formatted }
   */
  static celsiusToFahrenheit(celsius) {
    if (typeof celsius !== 'number') {
      throw new Error('Temperature must be a number');
    }

    const fahrenheit = Math.round((celsius * 9 / 5 + 32) * 10) / 10;

    return {
      value: fahrenheit,
      unit: '°F',
      formatted: `${fahrenheit}°F`
    };
  }

  /**
   * Converts Fahrenheit to Celsius
   * Formula: °C = (°F - 32) × 5/9
   * @param {number} fahrenheit - Temperature in Fahrenheit
   * @returns {Object} { value, unit, formatted }
   */
  static fahrenheitToCelsius(fahrenheit) {
    if (typeof fahrenheit !== 'number') {
      throw new Error('Temperature must be a number');
    }

    const celsius = Math.round((fahrenheit - 32) * 5 / 9 * 10) / 10;

    return {
      value: celsius,
      unit: '°C',
      formatted: `${celsius}°C`
    };
  }

  /**
   * Batch convert array of temps from C to F
   * @param {number[]} celsiusArray
   * @returns {Object[]} Array of converted temps
   */
  static celsiusToFahrenheitArray(celsiusArray) {
    if (!Array.isArray(celsiusArray)) {
      throw new Error('Input must be an array');
    }
    return celsiusArray.map(c => this.celsiusToFahrenheit(c));
  }

  /**
   * Batch convert array of temps from F to C
   * @param {number[]} fahrenheitArray
   * @returns {Object[]} Array of converted temps
   */
  static fahrenheitToCelsiusArray(fahrenheitArray) {
    if (!Array.isArray(fahrenheitArray)) {
      throw new Error('Input must be an array');
    }
    return fahrenheitArray.map(f => this.fahrenheitToCelsius(f));
  }

  /**
   * Converts and compares two temps (returns both C and F)
   * @param {number} value
   * @param {string} unit - 'C' or 'F'
   * @returns {Object} { celsius, fahrenheit }
   */
  static convertAndCompare(value, unit) {
    if (!['C', 'F'].includes(unit)) {
      throw new Error('Unit must be C or F');
    }

    if (unit === 'C') {
      const f = this.celsiusToFahrenheit(value);
      return {
        celsius: { value, unit: '°C', formatted: `${value}°C` },
        fahrenheit: f
      };
    } else {
      const c = this.fahrenheitToCelsius(value);
      return {
        celsius: c,
        fahrenheit: { value, unit: '°F', formatted: `${value}°F` }
      };
    }
  }

  /**
   * Gets temperature in a range as an array (for plotting/display)
   * @param {number} startTemp - Start temperature
   * @param {number} endTemp - End temperature
   * @param {string} unit - 'C' or 'F'
   * @param {number} step - Increment step (default: 10)
   * @returns {Object} { celsius: [], fahrenheit: [] }
   */
  static getTemperatureRange(startTemp, endTemp, unit, step = 10) {
    const range = [];
    if (unit === 'C') {
      for (let temp = startTemp; temp <= endTemp; temp += step) {
        range.push(temp);
      }
      const celsius = range;
      const fahrenheit = this.celsiusToFahrenheitArray(range).map(r => r.value);
      return { celsius, fahrenheit };
    } else {
      for (let temp = startTemp; temp <= endTemp; temp += step) {
        range.push(temp);
      }
      const fahrenheit = range;
      const celsius = this.fahrenheitToCelsiusArray(range).map(r => r.value);
      return { celsius, fahrenheit };
    }
  }
}

export default TempConverter;
