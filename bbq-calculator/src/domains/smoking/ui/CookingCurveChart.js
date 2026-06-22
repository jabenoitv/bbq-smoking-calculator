import CookingCurveCalculator from '../calculation/CookingCurveCalculator.js';

/**
 * CookingCurveChart - Visualizador de curva de cocción
 * Responsabilidad única: Renderizar gráfica de 3 fases usando Chart.js
 *
 * Dependencias:
 * - Chart.js (debe estar disponible globalmente como window.Chart)
 * - CookingCurveCalculator (para generar datos)
 */
class CookingCurveChart {
  constructor(canvasId, options = {}) {
    this.canvasId = canvasId;
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas con ID "${canvasId}" no encontrado`);
    }

    this.options = {
      theme: 'dark',
      animationDuration: 300,
      responsive: true,
      maintainAspectRatio: true,
      ...options
    };

    this.calculator = new CookingCurveCalculator();
    this.chart = null;
    this.currentResult = null;
    this.themes = {
      dark: {
        background: '#1a1a1a',
        text: '#e0e0e0',
        grid: '#333333',
        rampUp: '#FF9F1C',
        stall: '#FFBE0B',
        rendering: '#6BCB77'
      },
      light: {
        background: '#ffffff',
        text: '#333333',
        grid: '#e0e0e0',
        rampUp: '#FF9F1C',
        stall: '#FFBE0B',
        rendering: '#6BCB77'
      }
    };
  }

  /**
   * Actualiza la gráfica con un nuevo resultado de cálculo
   * @param {Object} result - Resultado de BBQEngine.calculate()
   */
  update(result) {
    if (!result) {
      throw new Error('Se requiere un resultado de cálculo');
    }

    this.currentResult = result;

    // Generar datos Chart.js
    const chartData = this.calculator.generateFromResult(result);

    // Destruir gráfica anterior si existe
    if (this.chart) {
      this.chart.destroy();
    }

    // Crear nueva gráfica
    this.chart = new window.Chart(this.canvas, {
      type: 'line',
      data: this.transformDataForChart(chartData),
      options: this.getChartOptions(),
      plugins: [this.buildHoverPlugin()]
    });

    return this;
  }

  /**
   * Transforma datos de CookingCurveCalculator al formato de Chart.js
   * @private
   */
  transformDataForChart(chartData) {
    const theme = this.themes[this.options.theme];

    return {
      labels: chartData.labels,
      datasets: chartData.datasets.map(dataset => ({
        ...dataset,
        borderColor: dataset.borderColor,
        backgroundColor: dataset.backgroundColor,
        pointBackgroundColor: dataset.pointBackgroundColor,
        pointBorderColor: theme.text,
        fill: true,
        tension: 0.4,
        segment: {
          borderDash: (ctx) => {
            // Línea punteada en transiciones de fase
            return ctx.p0DataIndex === chartData.labels.length - 1 ? [5, 5] : undefined;
          }
        }
      }))
    };
  }

  /**
   * Obtiene las opciones configuradas para Chart.js
   * @private
   */
  getChartOptions() {
    const theme = this.themes[this.options.theme];

    return {
      responsive: this.options.responsive,
      maintainAspectRatio: this.options.maintainAspectRatio,
      animation: {
        duration: this.options.animationDuration
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
          displayColors: true,
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              return `${label}: ${value}°C`;
            },
            afterLabel: (context) => {
              if (context.dataIndex === 0) {
                const result = this.currentResult;
                const phases = result.phases;
                let phaseIndex = 0;
              let currentTime = 0;

                for (let i = 0; i < phases.length; i++) {
                  currentTime += phases[i].duration;
                  const timeIndex = Math.floor(currentTime / 30);
                  if (context.dataIndex <= timeIndex) {
                    phaseIndex = i;
                    break;
                  }
                }

                const phase = phases[phaseIndex];
                return `${phase.name} (${phase.percent.toFixed(1)}%)`;
              }
              return '';
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: theme.grid,
            drawBorder: false,
            display: true,
            lineWidth: 0.5
          },
          ticks: {
            color: theme.text,
            font: { size: 11 }
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
    };
  }

  /**
   * Plugin personalizado para mostrar información de fases al pasar el mouse
   * @private
   */
  buildHoverPlugin() {
    const self = this;

    return {
      id: 'phaseHover',
      afterDatasetsDraw(chart) {
        const ctx = chart.ctx;
        const theme = self.themes[self.options.theme];

        chart.data.datasets.forEach((dataset, datasetIndex) => {
          const meta = chart.getDatasetMeta(datasetIndex);
          meta.data.forEach((element, index) => {
            if (element.x !== undefined && element.y !== undefined) {
              // Dibujar pequeños círculos en los puntos de datos
              ctx.beginPath();
              ctx.arc(element.x, element.y, 3, 0, 2 * Math.PI);
              ctx.fillStyle = dataset.pointBackgroundColor || theme.text;
              ctx.fill();
            }
          });
        });
      }
    };
  }

  /**
   * Cambia el tema de la gráfica (dark/light)
   * @param {string} theme - 'dark' o 'light'
   */
  setTheme(theme) {
    if (!this.themes[theme]) {
      throw new Error(`Tema no válido: ${theme}. Opciones: dark, light`);
    }

    this.options.theme = theme;

    // Aplicar fondo al canvas
    const themeColors = this.themes[theme];
    this.canvas.style.backgroundColor = themeColors.background;

    // Actualizar gráfica si existe
    if (this.chart && this.currentResult) {
      this.update(this.currentResult);
    }

    return this;
  }

  /**
   * Obtiene el tema actual
   * @returns {string}
   */
  getTheme() {
    return this.options.theme;
  }

  /**
   * Exporta la gráfica como PNG
   * @returns {string} Data URL de la imagen
   */
  exportImage() {
    if (!this.chart) {
      throw new Error('No hay gráfica para exportar');
    }

    return this.canvas.toDataURL('image/png');
  }

  /**
   * Descargar la gráfica como archivo PNG
   * @param {string} filename - Nombre del archivo (sin extensión)
   */
  downloadImage(filename = 'cooking-curve') {
    const imageUrl = this.exportImage();
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${filename}.png`;
    link.click();
  }

  /**
   * Obtiene datos de la gráfica actual
   * @returns {Object} Datos Chart.js
   */
  getData() {
    if (!this.chart) {
      return null;
    }

    return {
      labels: this.chart.data.labels,
      datasets: this.chart.data.datasets,
      result: this.currentResult
    };
  }

  /**
   * Resalta una fase específica
   * @param {number} phaseIndex - Índice de la fase (0-2)
   */
  highlightPhase(phaseIndex) {
    if (!this.chart) return;

    const datasets = this.chart.data.datasets;

    datasets.forEach((dataset, index) => {
      // Reducir opacidad de otras fases
      if (index !== phaseIndex) {
        dataset.borderWidth = 1;
        dataset.opacity = 0.3;
      } else {
        dataset.borderWidth = 3;
        dataset.opacity = 1;
      }
    });

    this.chart.update('none');
  }

  /**
   * Restaura la visibilidad normal de todas las fases
   */
  resetHighlight() {
    if (!this.chart) return;

    const datasets = this.chart.data.datasets;
    datasets.forEach(dataset => {
      dataset.borderWidth = 2;
      dataset.opacity = 1;
    });

    this.chart.update('none');
  }

  /**
   * Destruye la gráfica y limpia recursos
   */
  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    this.currentResult = null;
  }

  /**
   * Obtiene información de las fases para mostrar en leyenda/tabla
   * @returns {Array}
   */
  getPhaseInfo() {
    if (!this.currentResult) return [];

    return this.currentResult.phases.map(phase => ({
      name: phase.name,
      duration: phase.duration,
      durationFormatted: this.formatDuration(phase.duration),
      tempRange: phase.tempRange,
      percent: phase.percent
    }));
  }

  /**
   * Formatea duración en minutos a "Xh Ym"
   * @private
   */
  formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }

  /**
   * Obtiene información de eventos para timeline
   * @returns {Array}
   */
  getEvents() {
    if (!this.currentResult) return [];

    return this.currentResult.events;
  }

  /**
   * Redimensiona la gráfica (útil para responsive)
   */
  resize() {
    if (this.chart) {
      this.chart.resize();
    }
  }
}

export default CookingCurveChart;
