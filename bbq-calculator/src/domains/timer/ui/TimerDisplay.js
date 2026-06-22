/**
 * TimerDisplay - Cronómetro en vivo y tabla de mediciones
 * Responsabilidad única: Mostrar tiempo transcurrido + tabla de mediciones con color de desviación
 */
class TimerDisplay {
  constructor(displayId, logTableId) {
    this.displayId = displayId;
    this.logTableId = logTableId;
    this.displayElement = document.getElementById(displayId);
    this.logElement = document.getElementById(logTableId);

    if (!this.displayElement) {
      throw new Error(`Elemento de display con ID "${displayId}" no encontrado`);
    }

    if (!this.logElement) {
      throw new Error(`Elemento de tabla con ID "${logTableId}" no encontrado`);
    }

    this.currentTime = 0;
    this.measurements = [];
    this.initializeTable();
  }

  /**
   * Inicializa la estructura de la tabla si no existe
   * @private
   */
  initializeTable() {
    if (this.logElement.children.length === 0) {
      const header = document.createElement('tr');
      header.className = 'timer-log-header';
      header.innerHTML = `
        <th>Tiempo</th>
        <th>Temp (°C)</th>
        <th>Esperada (°C)</th>
        <th>Desviación</th>
        <th>Notas</th>
      `;
      this.logElement.appendChild(header);
    }
  }

  /**
   * Formatea segundos a HH:MM:SS
   * @private
   */
  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  /**
   * Actualiza la visualización del tiempo
   * @param {number} totalSeconds - Tiempo total en segundos
   */
  setTime(totalSeconds) {
    this.currentTime = totalSeconds;
    this.displayElement.textContent = this.formatTime(totalSeconds);
  }

  /**
   * Calcula el color basado en la desviación
   * Verde: ±1°C, Naranja: ±2-3°C, Rojo: >±3°C
   * @private
   */
  getDeviationColor(temp, expectedTemp) {
    const deviation = Math.abs(temp - expectedTemp);

    if (deviation <= 1) {
      return 'green';
    } else if (deviation <= 3) {
      return 'orange';
    } else {
      return 'red';
    }
  }

  /**
   * Calcula el valor de desviación en texto
   * @private
   */
  formatDeviation(temp, expectedTemp) {
    const deviation = temp - expectedTemp;
    const sign = deviation >= 0 ? '+' : '';
    return `${sign}${deviation.toFixed(1)}°C`;
  }

  /**
   * Añade una medición a la tabla de log
   * @param {number} temp - Temperatura medida en °C
   * @param {number} expectedTemp - Temperatura esperada en °C
   * @param {string} note - Nota opcional
   */
  addMeasurement(temp, expectedTemp, note = '') {
    const row = document.createElement('tr');
    const deviationValue = this.formatDeviation(temp, expectedTemp);
    const deviationColor = this.getDeviationColor(temp, expectedTemp);

    row.className = `timer-log-row deviation-${deviationColor}`;
    row.innerHTML = `
      <td>${this.formatTime(this.currentTime)}</td>
      <td>${temp.toFixed(1)}</td>
      <td>${expectedTemp.toFixed(1)}</td>
      <td style="color: ${deviationColor}; font-weight: bold;">${deviationValue}</td>
      <td>${note}</td>
    `;

    this.logElement.appendChild(row);

    this.measurements.push({
      time: this.currentTime,
      temp,
      expectedTemp,
      deviation: temp - expectedTemp,
      note
    });
  }

  /**
   * Obtiene todas las mediciones registradas
   * @returns {Array}
   */
  getMeasurements() {
    return [...this.measurements];
  }

  /**
   * Obtiene la última medición
   * @returns {Object|null}
   */
  getLastMeasurement() {
    return this.measurements.length > 0
      ? this.measurements[this.measurements.length - 1]
      : null;
  }

  /**
   * Limpia todas las mediciones y reinicia el display
   */
  clear() {
    this.currentTime = 0;
    this.measurements = [];
    this.displayElement.textContent = '00:00:00';

    // Eliminar todas las filas excepto el header
    const rows = this.logElement.querySelectorAll('tr.timer-log-row');
    rows.forEach(row => row.remove());
  }

  /**
   * Obtiene estadísticas de las mediciones
   * @returns {Object}
   */
  getStats() {
    if (this.measurements.length === 0) {
      return {
        count: 0,
        averageDeviation: 0,
        maxDeviation: 0,
        minDeviation: 0,
        standardDeviation: 0
      };
    }

    const deviations = this.measurements.map(m => m.deviation);
    const avgDeviation = deviations.reduce((a, b) => a + b) / deviations.length;
    const maxDeviation = Math.max(...deviations.map(d => Math.abs(d)));
    const minDeviation = Math.min(...deviations.map(d => Math.abs(d)));

    // Desviación estándar
    const variance = deviations.reduce((sum, d) => sum + Math.pow(d - avgDeviation, 2), 0) / deviations.length;
    const stdDeviation = Math.sqrt(variance);

    return {
      count: this.measurements.length,
      averageDeviation: avgDeviation,
      maxDeviation: maxDeviation,
      minDeviation: minDeviation,
      standardDeviation: stdDeviation
    };
  }

  /**
   * Exporta mediciones como CSV
   * @returns {string}
   */
  exportCSV() {
    const headers = ['Tiempo', 'Temp (°C)', 'Esperada (°C)', 'Desviación (°C)', 'Notas'];
    const rows = this.measurements.map(m => [
      this.formatTime(m.time),
      m.temp.toFixed(1),
      m.expectedTemp.toFixed(1),
      m.deviation.toFixed(1),
      m.note
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    return csv;
  }

  /**
   * Descarga mediciones como archivo CSV
   * @param {string} filename - Nombre del archivo (sin extensión)
   */
  downloadCSV(filename = 'mediciones') {
    const csv = this.exportCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  }
}

export default TimerDisplay;
