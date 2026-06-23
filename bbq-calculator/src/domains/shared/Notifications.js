/**
 * Notifications - Toast notification system
 * Responsabilidad única: Mostrar notificaciones toast al usuario
 */

import EventEmitter from './EventEmitter.js';

class Notifications extends EventEmitter {
  static TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
  };

  static DURATIONS = {
    SHORT: 2000,     // 2 segundos
    NORMAL: 4000,    // 4 segundos
    LONG: 6000,      // 6 segundos
    PERSISTENT: null // No auto-dismiss
  };

  constructor() {
    super();
    this.notifications = [];
    this.nextId = 1;
  }

  /**
   * Muestra un toast notification
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo: success, error, warning, info
   * @param {number} duration - Duración en ms (null = persistente)
   * @returns {Object} { id, message, type, duration }
   */
  show(message, type = Notifications.TYPES.INFO, duration = Notifications.DURATIONS.NORMAL) {
    if (!message) {
      throw new Error('Message is required');
    }

    if (!Object.values(Notifications.TYPES).includes(type)) {
      throw new Error(`Invalid type: ${type}`);
    }

    const notification = {
      id: this.nextId++,
      message,
      type,
      duration,
      createdAt: new Date().toISOString()
    };

    this.notifications.push(notification);
    this.emit('notification-shown', notification);

    // Auto-dismiss si tiene duration
    if (duration !== null) {
      setTimeout(() => {
        this.dismiss(notification.id);
      }, duration);
    }

    return notification;
  }

  /**
   * Muestra un toast de éxito
   * @param {string} message
   * @param {number} duration
   * @returns {Object}
   */
  success(message, duration = Notifications.DURATIONS.NORMAL) {
    return this.show(message, Notifications.TYPES.SUCCESS, duration);
  }

  /**
   * Muestra un toast de error
   * @param {string} message
   * @param {number} duration
   * @returns {Object}
   */
  error(message, duration = Notifications.DURATIONS.LONG) {
    return this.show(message, Notifications.TYPES.ERROR, duration);
  }

  /**
   * Muestra un toast de advertencia
   * @param {string} message
   * @param {number} duration
   * @returns {Object}
   */
  warning(message, duration = Notifications.DURATIONS.NORMAL) {
    return this.show(message, Notifications.TYPES.WARNING, duration);
  }

  /**
   * Muestra un toast de información
   * @param {string} message
   * @param {number} duration
   * @returns {Object}
   */
  info(message, duration = Notifications.DURATIONS.NORMAL) {
    return this.show(message, Notifications.TYPES.INFO, duration);
  }

  /**
   * Descarta una notificación por ID
   * @param {number} id
   * @returns {boolean} true si fue descartada
   */
  dismiss(id) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index === -1) return false;

    const [notification] = this.notifications.splice(index, 1);
    this.emit('notification-dismissed', notification);
    return true;
  }

  /**
   * Descarta todas las notificaciones
   */
  dismissAll() {
    const count = this.notifications.length;
    this.notifications.forEach(n => {
      this.emit('notification-dismissed', n);
    });
    this.notifications = [];
    return count;
  }

  /**
   * Obtiene todas las notificaciones activas
   * @returns {Object[]}
   */
  getActive() {
    return [...this.notifications];
  }

  /**
   * Obtiene el número de notificaciones activas
   * @returns {number}
   */
  getCount() {
    return this.notifications.length;
  }

  /**
   * Obtiene notificaciones de un tipo específico
   * @param {string} type
   * @returns {Object[]}
   */
  getByType(type) {
    return this.notifications.filter(n => n.type === type);
  }

  /**
   * Limpia el historial de notificaciones
   */
  clear() {
    this.notifications = [];
    this.emit('notifications-cleared');
  }
}

// Singleton instance
const notifications = new Notifications();

export default Notifications;
export { notifications };
