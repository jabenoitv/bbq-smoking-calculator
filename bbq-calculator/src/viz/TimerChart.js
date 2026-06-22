/**
 * TimerChart - Gráfica de comparación esperada vs real
 * Responsabilidad única: Superposición de curva esperada + mediciones reales
 */
class TimerChart {
  constructor(canvasId) {
    this.canvasId = canvasId;
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas con ID "${canvasId}" no encontrado`);
    }

    this.chart = null;
    this.expectedData = null;
    this.measurements = [];
    this.theme = 'dark';
    this.themes = {
      dark: {
        background: '#1a1a1a',
        text: '#e0e0e0',
        grid: '#333333',
        expectedLine: '#FFBE0B',
        realPoints: {
          green: '#6BCB77',
          orange: '#FFA500',
          red: '#FF6B6B'
        }
      },
      light: {
        background: '#ffffff',
        text: '#333333',
        grid: '#e0e0e0',
        expectedLine: '#FF9F1C',
        realPoints: {
          green: '#2D9F4D',
          orange: '#D97706',
          red: '#DC2626'
        }
      }
    };
  }

  /**
   * Establece la curva de temperatura esperada
   * @param {Array} data - Array de {time, temp} valores esperados
   */
  setExpectedCurve(data) {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('setExpectedCurve requiere un array de datos válido');
    }

    this.expectedData = data.map(point => ({
      time: point.time,
      temp: point.temp
    }));

    this.update();
  }

  /**
   * Añade una medición real
   * @param {number} time - Tiempo en segundos
   * @param {number} temp - Temperatura en °C
   * @param {string} deviationColor - 'green', 'orange', o 'red' (opcional)
   */
  addMeasurement(time, temp, deviationColor = 'green') {
    const measurement = {
      time,
      temp,
      deviationColor
    };

    this.measurements.push(measurement);
    this.update();
  }

  /**
   * Calcula el color de desviación basado en diferencia de temperatura
   * @private
   */
  calculateDeviationColor(actualTemp, expectedTemp) {
    const deviation = Math.abs(actualTemp - expectedTemp);

    if (deviation <= 1) {
      return 'green';
    } else if (deviation <= 3) {
      return 'orange';
    } else {
      return 'red';
    }
  }

  /**
   * Actualiza la gráfica con datos actuales
   */
  update() {
    if (!this.expectedData) {
      return;
    }

    const theme = this.themes[this.theme];
    const labels = this.expectedData.map((_, idx) => idx);
    const expectedTemps = this.expectedData.map(d => d.temp);

    // Preparar datasets
    const datasets = [
      {
        label: 'Temperatura Esperada',
        data: expectedTemps,
        borderColor: theme.expectedLine,
        backgroundColor: 'rgba(255, 190, 11, 0.1)',
        tension: 0.4,
        pointRadius: 2,
        pointBackgroundColor: theme.expectedLine,
        borderWidth: 2,
        fill: false
      },
      {
        label: 'Mediciones Reales',
        data: this.measurements.map(m => ({
          x: this.expectedData.findIndex(d => d.time >= m.time),
          y: m.temp,
          color: m.deviationColor
        })),
        backgroundColor: this.measurements.map(m =>
          theme.realPoints[m.deviationColor] || theme.realPoints.green
        ),
        borderColor: this.measurements.map(m =>
          theme.realPoints[m.deviationColor] || theme.realPoints.green
        ),
        pointRadius: 6,
        pointBorderWidth: 2,
        pointBorderColor: '#fff',
        showLine: false,
        type: 'scatter'
      }
    ];

    // Destruir gráfica anterior
    if (this.chart) {
      this.chart.destroy();
    }

    // Crear nueva gráfica
    this.chart = new window.Chart(this.canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [datasets[0]]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: {
          duration: 300
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: theme.text,
              font: { size: 12, family: 'system-ui' },
              padding: 15,
              boxWidth: 12,
              usePointStyle: true
            }
          },
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: theme.grid,
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                return `${label}: ${value.toFixed(1)}°C`;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            grid: {
              color: theme.grid,
              drawBorder: false,
              display: true,
              lineWidth: 0.5
            },
            ticks: {
              color: theme.text,
              font: { size: 11 }
            },
            title: {
              display: true,
              text: 'Índice de Medición',
              color: theme.text
            }
          },
          y: {
            type: 'linear',
            position: 'left',
            grid: {
              color: theme.grid,
              drawBorder: false,
              lineWidth: 0.5
            },
            ticks: {
              color: theme.text,
              font: { size: 11 },
              callback: (value) => `${value}°C`
            },
            title: {
              display: true,
              text: 'Temperatura (°C)',
              color: theme.text,
              font: { size: 12, weight: 'bold' }
            }
          }
        }
      }
    });

    // Agregar puntos de mediciones si existen
    if (this.measurements.length > 0) {
      const chartData = {
        x: [],
        y: [],
        backgroundColor: [],
        borderColor: []
      };

      this.measurements.forEach(m => {
        const xIndex = this.expectedData.findIndex(d => d.time >= m.time);
        if (xIndex !== -1) {
          chartData.x.push(xIndex);
          chartData.y.push(m.temp);
          chartData.backgroundColor.push(theme.realPoints[m.deviationColor] || theme.realPoints.green);
          chartData.borderColor.push(theme.realPoints[m.deviationColor] || theme.realPoints.green);
        }
      });

      if (chartData.x.length > 0) {
        this.chart.data.datasets.push({
          label: 'Mediciones Reales',
          data: chartData.x.map((x, idx) => ({
            x,
            y: chartData.y[idx]
          })),
          backgroundColor: chartData.backgroundColor,
          borderColor: chartData.borderColor,
          pointRadius: 6,
          pointBorderWidth: 2,
          pointBorderColor: '#fff',
          showLine: false,
          type: 'scatter'
        });

        this.chart.update('none');
      }
    }
  }

  /**
   * Cambia el tema (dark/light)
   * @param {string} theme - 'dark' o 'light'
   */
  setTheme(theme) {
    if (!this.themes[theme]) {
      throw new Error(`Tema no válido: ${theme}. Opciones: dark, light`);
    }

    this.theme = theme;
    if (this.expectedData) {
      this.update();
    }
  }

  /**
   * Obtiene el tema actual
   * @returns {string}
   */
  getTheme() {
    return this.theme;
  }

  /**
   * Obtiene todas las mediciones actuales
   * @returns {Array}
   */
  getMeasurements() {
    return [...this.measurements];
  }

  /**
   * Limpia todas las mediciones (mantiene la curva esperada)
   */
  clear() {
    this.measurements = [];
    if (this.expectedData) {
      this.update();
    }
  }

  /**
   * Destruye la gráfica y limpia recursos
   */
  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    this.expectedData = null;
    this.measurements = [];
  }

  /**
   * Obtiene estadísticas de desviación
   * @returns {Object}
   */
  getDeviationStats() {
    if (this.measurements.length === 0 || !this.expectedData) {
      return {
        count: 0,
        averageDeviation: 0,
        maxDeviation: 0,
        deviationsByColor: { green: 0, orange: 0, red: 0 }
      };
    }

    const deviations = [];
    const byColor = { green: 0, orange: 0, red: 0 };

    this.measurements.forEach(m => {
      byColor[m.deviationColor]++;
      // Buscar temperatura esperada más cercana
      const closest = this.expectedData.reduce((prev, curr) =>
        Math.abs(curr.time - m.time) < Math.abs(prev.time - m.time) ? curr : prev
      );
      deviations.push(Math.abs(m.temp - closest.temp));
    });

    return {
      count: this.measurements.length,
      averageDeviation: deviations.reduce((a, b) => a + b, 0) / deviations.length,
      maxDeviation: Math.max(...deviations),
      deviationsByColor: byColor
    };
  }

  /**
   * Redimensiona la gráfica (para responsive)
   */
  resize() {
    if (this.chart) {
      this.chart.resize();
    }
  }
}

export default TimerChart;
