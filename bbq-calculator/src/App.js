/**
 * App.js - Domain orchestrator (M13)
 * Responsabilidad única: Conectar todos los dominios (Smoking, Timer, Curing, Gadgets, Shared)
 */

import EventEmitter from './domains/shared/EventEmitter.js';
import BBQEngine from './domains/smoking/core/BBQEngine.js';
import RenderingLevelSelector from './domains/smoking/core/RenderingLevelSelector.js';
import RecipeFactory from './domains/smoking/core/RecipeFactory.js';
import CookingCurveCalculator from './domains/smoking/calculation/CookingCurveCalculator.js';
import CookingSession from './domains/timer/core/CookingSession.js';
import CureCalculator from './domains/curing/core/CureCalculator.js';
import CureStore from './domains/curing/state/CureStore.js';
import RubCalculator from './domains/gadgets/RubCalculator.js';
import TempConverter from './domains/gadgets/TempConverter.js';
import WeightConverter from './domains/gadgets/WeightConverter.js';
import AltitudeDetector from './domains/gadgets/AltitudeDetector.js';
import TabController, { tabController } from './domains/shared/TabController.js';
import Notifications, { notifications } from './domains/shared/Notifications.js';
import Validator from './domains/shared/Validator.js';
import { RecipeStore, SessionStore } from './domains/shared/DataPersistence.js';

class App extends EventEmitter {
  constructor() {
    super();

    // Initialize domain instances (singletons)
    this.bbqEngine = new BBQEngine();
    this.renderingLevelSelector = new RenderingLevelSelector();
    this.recipeFactory = RecipeFactory;
    this.cookingCurveCalculator = CookingCurveCalculator;

    this.cookingSession = null; // Created per session

    this.cureCalculator = CureCalculator;
    this.cureStore = new CureStore();

    this.rubCalculator = RubCalculator;
    this.tempConverter = TempConverter;
    this.weightConverter = WeightConverter;
    this.altitudeDetector = AltitudeDetector;

    this.tabController = tabController;
    this.notifications = notifications;
    this.validator = Validator;

    // Initialize persistence stores (graceful fallback for non-browser environments)
    try {
      this.recipeStore = new RecipeStore();
      this.sessionStore = new SessionStore();
    } catch (error) {
      console.warn('localStorage not available, using in-memory persistence');
      this.recipeStore = null;
      this.sessionStore = null;
    }

    // App state
    this.appState = {
      version: '2.0',
      recipes: [],
      activeCures: [],
      userPreferences: {
        defaultTempUnit: 'C',
        defaultWeightUnit: 'kg'
      }
    };

    // Load persisted state
    this.loadState();

    // Setup event wiring between domains
    this.setupEventWiring();
  }

  // Smoking domain operations
  calculateSmokingTime(params) {
    const validation = this.validator.validateBBQParams(params);
    if (!validation.isValid) {
      this.notifications.error(`Validation error: ${validation.errors.join(', ')}`);
      throw new Error(`Invalid BBQ parameters: ${validation.errors.join(', ')}`);
    }

    const result = this.bbqEngine.calculate({
      meatType: params.meatType,
      weightKg: params.weight,
      smokingTempC: params.temp,
      desiredRedTempC: params.desiredRedTempC,
      wrapped: params.wrapped || false,
      altitudeM: params.altitude || 0
    });

    const resultValidation = this.validator.validateBBQResult(result);
    if (!resultValidation.isValid) {
      this.notifications.error(`Result validation error: ${resultValidation.errors.join(', ')}`);
    }

    if (resultValidation.warnings.length > 0) {
      this.notifications.warning(`Note: ${resultValidation.warnings[0]}`);
    }

    // Save recipe to state
    const recipe = RecipeFactory.createFromResult(result);
    this.appState.recipes.push(recipe);
    if (this.recipeStore) {
      this.recipeStore.saveRecipe(recipe);
    }

    this.emit('smoking-calculated', result);
    this.notifications.success('Cooking time calculated!');
    return result;
  }

  // Timer domain operations
  startCookingSession(recipe) {
    this.cookingSession = new CookingSession(recipe);
    this.emit('session-started', this.cookingSession);
    this.notifications.success('Cooking session started!');
    return this.cookingSession;
  }

  addMeasurement(temperature, timestamp = Date.now()) {
    if (!this.cookingSession) {
      this.notifications.error('No active cooking session');
      throw new Error('No active cooking session');
    }

    this.cookingSession.addMeasurement(temperature, timestamp);
    this.emit('measurement-added', { temperature, timestamp });
  }

  stopCookingSession() {
    if (!this.cookingSession) {
      this.notifications.error('No active cooking session');
      return null;
    }

    this.cookingSession.stop();
    const sessionData = this.cookingSession.getSummary();
    if (this.sessionStore) {
      this.sessionStore.createSession(sessionData);
    }
    this.emit('session-stopped', sessionData);
    this.notifications.success('Cooking session saved!');

    const session = this.cookingSession;
    this.cookingSession = null;
    return session;
  }

  // Curing domain operations
  calculateCure(params) {
    const validation = this.validator.validateCureParams(params);
    if (!validation.isValid) {
      this.notifications.error(`Validation error: ${validation.errors.join(', ')}`);
      throw new Error(`Invalid cure parameters: ${validation.errors.join(', ')}`);
    }

    const result = CureCalculator.calculate({
      cureType: params.cureType,
      weightKg: params.weightKg,
      thickness: params.thickness
    });

    if (validation.warnings.length > 0) {
      this.notifications.warning(`Note: ${validation.warnings[0]}`);
    }

    this.emit('cure-calculated', result);
    return result;
  }

  startCureTracking(cureData) {
    const cure = this.cureStore.addActiveCure(cureData);
    this.appState.activeCures = this.cureStore.getActiveCures();
    this.saveState();
    this.emit('cure-added', cure);
    this.notifications.success('Cure tracking started!');
    return cure;
  }

  completeCure(cureId) {
    const cure = this.cureStore.markComplete(cureId);
    this.appState.activeCures = this.cureStore.getActiveCures();
    this.saveState();
    this.emit('cure-completed', cure);
    this.notifications.success('Cure marked complete!');
    return cure;
  }

  deleteCure(cureId) {
    const cure = this.cureStore.getActiveCure(cureId);
    const success = this.cureStore.deleteActiveCure(cureId);
    if (success) {
      this.appState.activeCures = this.cureStore.getActiveCures();
      this.saveState();
      this.emit('cure-deleted', cure);
      this.notifications.warning('Cure deleted');
    }
    return success;
  }

  // Gadgets domain operations
  calculateRub(meatType, weightKg) {
    try {
      const result = RubCalculator.calculate(meatType, weightKg);
      this.notifications.success(`Rub calculated: ${result.rubGrams}g`);
      return result;
    } catch (error) {
      this.notifications.error(`Rub calculation error: ${error.message}`);
      throw error;
    }
  }

  convertTemperature(value, fromUnit) {
    const result = TempConverter.convertAndCompare(value, fromUnit);
    return result;
  }

  convertWeight(value, fromUnit) {
    const result = WeightConverter.convertAndCompare(value, fromUnit);
    return result;
  }

  async detectAltitude() {
    try {
      const result = await AltitudeDetector.detect();
      this.emit('altitude-detected', result);
      return result;
    } catch (error) {
      this.notifications.error(`Altitude detection failed: ${error.message}`);
      throw error;
    }
  }

  // Shared domain operations (TabController)
  switchTab(tabName) {
    const success = this.tabController.switchTab(tabName);
    if (success) {
      this.emit('tab-switched', { tab: tabName });
    }
    return success;
  }

  getCurrentTab() {
    return this.tabController.getCurrentTab();
  }

  getCurrentTabLabel() {
    return this.tabController.getCurrentTabLabel();
  }

  getTabsInfo() {
    return this.tabController.getTabsInfo();
  }

  // Notifications
  showNotification(message, type = 'info', duration = Notifications.DURATIONS.NORMAL) {
    return this.notifications.show(message, type, duration);
  }

  getNotifications() {
    return this.notifications.getActive();
  }

  // Curing tracking
  getActiveCures() {
    return this.cureStore.getActiveCures();
  }

  getCureStats() {
    const cures = this.cureStore.getActiveCures();
    return {
      total: cures.length,
      active: cures.filter(c => c.status === 'active').length,
      completed: cures.filter(c => c.status === 'completed').length
    };
  }

  // State management
  getAppState() {
    return {
      ...this.appState,
      currentTab: this.tabController.getCurrentTab(),
      activeCures: this.cureStore.getActiveCures(),
      activeSession: this.cookingSession ? this.cookingSession.getSummary() : null
    };
  }

  saveState() {
    this.appState.activeCures = this.cureStore.getActiveCures();
    // Persist to localStorage if available
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('bbq_app_state', JSON.stringify(this.appState));
      } catch (error) {
        console.warn('Could not save state to localStorage:', error.message);
      }
    }
    this.emit('state-saved');
  }

  loadState() {
    if (typeof localStorage !== 'undefined') {
      try {
        const persisted = localStorage.getItem('bbq_app_state');
        if (persisted) {
          const persistedState = JSON.parse(persisted);
          this.appState = persistedState;
          // Restore active cures
          if (persistedState.activeCures && persistedState.activeCures.length > 0) {
            persistedState.activeCures.forEach(cure => {
              this.cureStore.addActiveCure(cure);
            });
          }
        }
      } catch (error) {
        console.warn('Could not load state from localStorage:', error.message);
      }
    }
  }

  reset() {
    this.appState = {
      version: '2.0',
      recipes: [],
      activeCures: [],
      userPreferences: {
        defaultTempUnit: 'C',
        defaultWeightUnit: 'kg'
      }
    };
    this.cookingSession = null;
    this.cureStore.clear();
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem('bbq_app_state');
      } catch (error) {
        console.warn('Could not clear localStorage:', error.message);
      }
    }
    this.tabController.clearHistory();
    this.notifications.dismissAll();
    this.emit('app-reset');
    this.notifications.success('App reset to initial state');
  }

  // Event wiring between domains
  setupEventWiring() {
    // Tab controller events
    this.tabController.on('tab-changed', (data) => {
      this.emit('tab-changed', data);
    });

    // Notifications events
    this.notifications.on('notification-shown', (notification) => {
      this.emit('notification-shown', notification);
    });

    this.notifications.on('notification-dismissed', (notification) => {
      this.emit('notification-dismissed', notification);
    });

    // Cure store events
    if (this.cureStore && typeof this.cureStore.on === 'function') {
      this.cureStore.on('cure-added', (cure) => {
        this.emit('cure-added', cure);
      });

      this.cureStore.on('cure-completed', (cure) => {
        this.emit('cure-completed', cure);
      });

      this.cureStore.on('cure-deleted', (cure) => {
        this.emit('cure-deleted', cure);
      });
    }
  }
}

// Singleton instance
const app = new App();

export default App;
export { app };
