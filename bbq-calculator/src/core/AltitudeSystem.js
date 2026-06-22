import EventEmitter from './EventEmitter.js';

/**
 * AltitudeSystem - Detección de altitud y ajustes de cocción
 * Responsabilidad única: Detectar altitud y proporcionar factor de ajuste
 *
 * Fórmula de ajuste: +8% de tiempo por cada 1000m de elevación
 * Nota: Esto explica el aumento en tiempo de cocción a mayor altitud
 * (menor presión atmosférica = evaporación más rápida = cocción más lenta)
 */
class AltitudeSystem extends EventEmitter {
  constructor() {
    super();
    this.altitude = 0;
    this.coordinates = null;
    this.detected = false;
  }

  /**
   * Detecta la altitud del usuario usando Geolocation API + OpenElevation API
   * @returns {Promise<number>} Altitud en metros
   */
  async detect() {
    this.emit('altitude-detection-started');

    try {
      // Paso 1: Obtener coordenadas del navegador
      const coords = await this.getCoordinates();
      this.coordinates = coords;

      // Paso 2: Obtener altitud desde OpenElevation API (gratis, sin API key)
      const altitude = await this.estimateFromCoordinates(coords.latitude, coords.longitude);
      this.altitude = altitude;
      this.detected = true;

      this.emit('altitude-detected', {
        altitude: this.altitude,
        latitude: coords.latitude,
        longitude: coords.longitude,
        timestamp: new Date()
      });

      return this.altitude;
    } catch (err) {
      this.emit('altitude-error', {
        error: err.message,
        timestamp: new Date()
      });
      throw err;
    }
  }

  /**
   * Obtiene las coordenadas del usuario usando Geolocation API
   * @returns {Promise<{latitude: number, longitude: number}>}
   */
  getCoordinates() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation no disponible en este navegador'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        error => {
          reject(new Error(`Error de geolocalización: ${error.message}`));
        },
        {
          timeout: 10000,
          enableHighAccuracy: false
        }
      );
    });
  }

  /**
   * Estima la altitud desde coordenadas usando OpenElevation API
   * @param {number} latitude - Latitud
   * @param {number} longitude - Longitud
   * @returns {Promise<number>} Altitud en metros
   */
  async estimateFromCoordinates(latitude, longitude) {
    try {
      const response = await fetch(
        `https://api.open-elevation.com/api/v1/lookup?locations=${latitude},${longitude}`,
        { timeout: 8000 }
      );

      if (!response.ok) {
        throw new Error(`OpenElevation API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        return Math.round(data.results[0].elevation);
      }

      throw new Error('No elevation data returned');
    } catch (err) {
      throw new Error(`No se pudo obtener altitud: ${err.message}`);
    }
  }

  /**
   * Calcula el factor de ajuste para una altitud dada
   * @param {number} altitudeM - Altitud en metros
   * @returns {number} Factor multiplicador (1.0 = sin ajuste)
   */
  calculateAdjustment(altitudeM) {
    const adjustment = 0.08;
    const metersPerUnit = 1000;
    return 1 + (altitudeM / metersPerUnit) * adjustment;
  }

  /**
   * Alias para calculateAdjustment (consistencia con BBQEngine)
   */
  getAdjustmentFactor(altitudeM = this.altitude) {
    return this.calculateAdjustment(altitudeM);
  }

  /**
   * Obtiene la altitud detectada
   * @returns {number} Altitud en metros
   */
  getAltitude() {
    return this.altitude;
  }

  /**
   * Verifica si la altitud ha sido detectada
   * @returns {boolean}
   */
  isDetected() {
    return this.detected;
  }

  /**
   * Obtiene información completa de la ubicación
   * @returns {Object|null}
   */
  getLocation() {
    if (!this.coordinates || !this.detected) {
      return null;
    }
    return {
      altitude: this.altitude,
      latitude: this.coordinates.latitude,
      longitude: this.coordinates.longitude,
      adjustmentFactor: this.getAdjustmentFactor()
    };
  }

  /**
   * Establece la altitud manualmente (para testing o entrada manual)
   * @param {number} altitudeM - Altitud en metros
   */
  setAltitudeManual(altitudeM) {
    this.altitude = Math.max(0, altitudeM);
    this.detected = true;
    this.emit('altitude-manual-set', {
      altitude: this.altitude,
      timestamp: new Date()
    });
  }

  /**
   * Restablece la altitud detectada
   */
  reset() {
    this.altitude = 0;
    this.coordinates = null;
    this.detected = false;
    this.emit('altitude-reset');
  }

  /**
   * Formatea la información de altitud para mostrar
   * @returns {string}
   */
  formatAltitude() {
    if (!this.detected) {
      return 'No detectada';
    }
    return `${this.altitude}m (Factor: ${this.getAdjustmentFactor().toFixed(2)}x)`;
  }
}

export default AltitudeSystem;
