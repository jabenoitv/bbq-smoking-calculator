/**
 * AltitudeDetector - Detects user altitude and calculates cooking adjustments
 * Responsabilidad única: Detección de altitud y ajuste de tiempos de cocción
 */

class AltitudeDetector {
  // Elevation adjustment formula: +8% cooking time per 1000m
  static COOKING_TIME_ADJUSTMENT_PER_1000M = 1.08;
  static CACHE_KEY = 'userAltitude';
  static CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Detects user's altitude via Geolocation API + OpenElevation API fallback
   * @returns {Promise<Object>} { altitude, unit, estimatedAltitudeAdjustmentPercent, isCached, timestamp }
   */
  static async detect() {
    // Check cache first
    const cached = this.getCachedAltitude();
    if (cached) {
      return {
        ...cached,
        isCached: true
      };
    }

    try {
      // Step 1: Get coordinates via Geolocation API
      const coordinates = await this.getGeolocation();

      // Step 2: Get elevation via OpenElevation API
      const altitude = await this.getElevationFromCoordinates(coordinates.latitude, coordinates.longitude);

      const result = {
        altitude,
        unit: 'm',
        estimatedAltitudeAdjustmentPercent: this.calculateCookingTimeAdjustment(altitude),
        timestamp: new Date().toISOString()
      };

      // Cache the result
      this.cacheAltitude(result);

      return result;
    } catch (error) {
      // Fallback: Return sea level estimation
      return {
        altitude: 0,
        unit: 'm',
        estimatedAltitudeAdjustmentPercent: 0,
        isCached: false,
        timestamp: new Date().toISOString(),
        error: error.message || 'Could not detect altitude'
      };
    }
  }

  /**
   * Gets user's coordinates via Geolocation API
   * @private
   * @returns {Promise<Object>} { latitude, longitude }
   */
  static getGeolocation() {
    return new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        reject(new Error('Geolocation API not available'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        { timeout: 10000 }
      );
    });
  }

  /**
   * Gets elevation from OpenElevation API
   * @private
   * @param {number} latitude
   * @param {number} longitude
   * @returns {Promise<number>} Elevation in meters
   */
  static async getElevationFromCoordinates(latitude, longitude) {
    try {
      const response = await fetch(
        `https://api.open-elevation.com/api/v1/lookup?locations=${latitude},${longitude}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        return Math.round(data.results[0].elevation);
      }

      throw new Error('No elevation data in response');
    } catch (error) {
      throw new Error(`Could not fetch elevation: ${error.message}`);
    }
  }

  /**
   * Calculates cooking time adjustment percentage
   * Formula: +8% per 1000m altitude
   * @param {number} altitudeMeters
   * @returns {number} Adjustment percentage (0 = no adjustment, 8 = +8%, etc)
   */
  static calculateCookingTimeAdjustment(altitudeMeters) {
    if (altitudeMeters <= 0) return 0;

    // Every 1000m = 8% increase in cooking time
    const adjustmentFactor = Math.pow(this.COOKING_TIME_ADJUSTMENT_PER_1000M, altitudeMeters / 1000);
    const adjustmentPercent = (adjustmentFactor - 1) * 100;

    return Math.round(adjustmentPercent * 10) / 10;
  }

  /**
   * Manual altitude estimation from coordinates
   * Uses simplified elevation database (hardcoded common locations)
   * @param {number} latitude
   * @param {number} longitude
   * @returns {number} Estimated altitude in meters
   */
  static estimateAltitudeFromCoordinates(latitude, longitude) {
    // Simplified elevation database for common BBQ locations
    const elevationDatabase = {
      // Major US cities
      '40.7128,-74.0060': 10, // New York
      '34.0522,-118.2437': 94, // Los Angeles
      '41.8781,-87.6298': 181, // Chicago
      '29.7604,-95.3698': 15, // Houston
      '32.7767,-96.7970': 136, // Dallas
      '39.7392,-104.9903': 1609, // Denver
      '47.6062,-122.3321': 175, // Seattle
      '37.7749,-122.4194': 47, // San Francisco

      // World capitals
      '40.4168,-3.7038': 646, // Madrid
      '48.8566,2.3522': 35, // Paris
      '52.5200,13.4050': 34, // Berlin
      '41.9028,12.4964': 21, // Rome
      '51.5074,-0.1278': 11 // London
    };

    // Create key from coordinates (rounded to 4 decimals for matching)
    const key = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;

    // Check exact match first
    if (key in elevationDatabase) {
      return elevationDatabase[key];
    }

    // Otherwise, use a simple formula based on latitude bands
    // Northern hemisphere: higher latitude = higher elevation on average
    const latitudeFactor = Math.abs(latitude) * 20; // Rough estimate
    return Math.round(latitudeFactor);
  }

  /**
   * Caches altitude result to localStorage
   * @private
   */
  static cacheAltitude(altitudeData) {
    if (typeof localStorage === 'undefined') return;

    const cacheEntry = {
      ...altitudeData,
      cachedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn('Failed to cache altitude:', error);
    }
  }

  /**
   * Gets cached altitude if available and not expired
   * @private
   * @returns {Object|null}
   */
  static getCachedAltitude() {
    if (typeof localStorage === 'undefined') return null;

    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const cacheEntry = JSON.parse(cached);
      const cacheAge = new Date().getTime() - new Date(cacheEntry.cachedAt).getTime();

      if (cacheAge < this.CACHE_DURATION_MS) {
        const { cachedAt, ...data } = cacheEntry;
        return data;
      }

      // Cache expired
      localStorage.removeItem(this.CACHE_KEY);
      return null;
    } catch (error) {
      console.warn('Failed to read cached altitude:', error);
      return null;
    }
  }

  /**
   * Clears cached altitude
   */
  static clearCache() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.CACHE_KEY);
    }
  }

  /**
   * Gets cooking time adjustment for a given altitude in seconds
   * @param {number} totalCookingSeconds
   * @param {number} altitudeMeters
   * @returns {number} Adjusted cooking time in seconds
   */
  static getAdjustedCookingTime(totalCookingSeconds, altitudeMeters) {
    if (altitudeMeters <= 0) return totalCookingSeconds;

    const adjustmentPercent = this.calculateCookingTimeAdjustment(altitudeMeters);
    const adjustedSeconds = totalCookingSeconds * (1 + adjustmentPercent / 100);

    return Math.round(adjustedSeconds);
  }

  /**
   * Gets estimated altitude adjustment warning level
   * @param {number} altitudeMeters
   * @returns {string} 'low' | 'medium' | 'high'
   */
  static getAdjustmentWarningLevel(altitudeMeters) {
    if (altitudeMeters < 1000) return 'low';
    if (altitudeMeters < 2000) return 'medium';
    return 'high';
  }
}

export default AltitudeDetector;
