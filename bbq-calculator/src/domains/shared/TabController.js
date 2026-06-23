/**
 * TabController - Manages tab navigation and state
 * Responsabilidad única: Control de tabs y navegación entre dominios
 */

import EventEmitter from './EventEmitter.js';

class TabController extends EventEmitter {
  // Tabs disponibles en la app
  static TABS = {
    AHUMADO: 'ahumado',
    CRONOMETRO: 'cronometro',
    CURADOS: 'curados',
    MIS_CURADOS: 'mis-curados',
    GADGETS: 'gadgets'
  };

  static TAB_LABELS = {
    'ahumado': 'Ahumado (Smoking)',
    'cronometro': 'Cronómetro (Timer)',
    'curados': 'Curados (Curing)',
    'mis-curados': 'Mis Curados (Active)',
    'gadgets': 'Gadgets'
  };

  static TAB_DESCRIPTIONS = {
    'ahumado': 'Calcular tiempos de ahumado',
    'cronometro': 'Cronómetro en vivo para sesión',
    'curados': 'Calculadora de curaciones',
    'mis-curados': 'Tracking de curados activos',
    'gadgets': 'Herramientas de conversión y utilidades'
  };

  constructor() {
    super();
    this.currentTab = TabController.TABS.AHUMADO;
    this.tabHistory = [TabController.TABS.AHUMADO];
    this.maxHistory = 10;
  }

  /**
   * Cambia a un tab específico
   * @param {string} tabName - Nombre del tab (ahumado, cronometro, etc.)
   * @returns {boolean} true si el cambio fue exitoso
   */
  switchTab(tabName) {
    if (!Object.values(TabController.TABS).includes(tabName)) {
      this.emit('error', `Unknown tab: ${tabName}`);
      return false;
    }

    if (this.currentTab === tabName) {
      return true; // Already on this tab
    }

    const previousTab = this.currentTab;
    this.currentTab = tabName;

    // Agregar al historial
    this.tabHistory.push(tabName);
    if (this.tabHistory.length > this.maxHistory) {
      this.tabHistory.shift();
    }

    // Emitir eventos
    this.emit('tab-changed', { from: previousTab, to: tabName });
    this.emit(`tab-${tabName}`, { from: previousTab });

    return true;
  }

  /**
   * Obtiene el tab actual
   * @returns {string}
   */
  getCurrentTab() {
    return this.currentTab;
  }

  /**
   * Obtiene el label del tab actual
   * @returns {string}
   */
  getCurrentTabLabel() {
    return TabController.TAB_LABELS[this.currentTab];
  }

  /**
   * Obtiene la descripción del tab actual
   * @returns {string}
   */
  getCurrentTabDescription() {
    return TabController.TAB_DESCRIPTIONS[this.currentTab];
  }

  /**
   * Vuelve al tab anterior (si existe historial)
   * @returns {boolean}
   */
  goBack() {
    if (this.tabHistory.length < 2) {
      return false;
    }

    this.tabHistory.pop(); // Remove current
    const previousTab = this.tabHistory[this.tabHistory.length - 1];
    return this.switchTab(previousTab);
  }

  /**
   * Obtiene todos los tabs disponibles
   * @returns {string[]}
   */
  getAvailableTabs() {
    return Object.values(TabController.TABS);
  }

  /**
   * Obtiene información de todos los tabs
   * @returns {Object[]} Array de { name, label, description }
   */
  getTabsInfo() {
    return this.getAvailableTabs().map(tab => ({
      name: tab,
      label: TabController.TAB_LABELS[tab],
      description: TabController.TAB_DESCRIPTIONS[tab]
    }));
  }

  /**
   * Obtiene el historial de navegación
   * @returns {string[]}
   */
  getHistory() {
    return [...this.tabHistory];
  }

  /**
   * Limpia el historial
   */
  clearHistory() {
    this.tabHistory = [this.currentTab];
  }

  /**
   * Valida que un nombre de tab sea válido
   * @param {string} tabName
   * @returns {boolean}
   */
  isValidTab(tabName) {
    return Object.values(TabController.TABS).includes(tabName);
  }
}

// Singleton instance
const tabController = new TabController();

export default TabController;
export { tabController };
