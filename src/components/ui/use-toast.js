import { useState, useEffect } from 'react';

// Maximum number of toasts to display at once
const TOAST_LIMIT = 1;
const DEFAULT_TOAST_DURATION = 5000;

// Simple counter for generating unique IDs
let idCounter = 0;

function generateToastId() {
  idCounter = (idCounter + 1) % Number.MAX_SAFE_INTEGER;
  return idCounter.toString();
}

// Custom toast state manager (lightweight alternative to external state management)
const toastStateManager = {
  state: {
    toasts: [],
  },
  listeners: new Set(),

  getState() {
    return this.state;
  },

  setState(updater) {
    // Support both function and object updates
    this.state = typeof updater === 'function' 
      ? updater(this.state) 
      : { ...this.state, ...updater };

    // Notify all subscribers
    this.listeners.forEach(listener => listener(this.state));
  },

  subscribe(listener) {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  },
};

// Main toast function to trigger notifications
export const toast = ({ ...props }) => {
  const id = generateToastId();

  // Update specific toast
  const update = (updates) => {
    toastStateManager.setState(state => ({
      ...state,
      toasts: state.toasts.map(t => 
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  };

  // Dismiss specific toast
  const dismiss = () => {
    toastStateManager.setState(state => ({
      ...state,
      toasts: state.toasts.filter(t => t.id !== id),
    }));
  };

  // Add new toast to state
  toastStateManager.setState(state => ({
    ...state,
    toasts: [
      { ...props, id, dismiss },
      ...state.toasts,
    ].slice(0, TOAST_LIMIT),
  }));

  return { id, dismiss, update };
};

// Custom hook for managing toasts in components
export function useToast() {
  const [state, setState] = useState(toastStateManager.getState());

  // Subscribe to toast state changes
  useEffect(() => {
    const unsubscribe = toastStateManager.subscribe(setState);
    return unsubscribe;
  }, []);

  // Auto-dismiss toasts after duration
  useEffect(() => {
    const timeoutIds = [];

    state.toasts.forEach(toast => {
      // Skip auto-dismiss for infinite duration
      if (toast.duration === Infinity) return;

      const timeoutId = setTimeout(() => {
        toast.dismiss();
      }, toast.duration || DEFAULT_TOAST_DURATION);

      timeoutIds.push(timeoutId);
    });

    // Cleanup timeouts on unmount or state change
    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, [state.toasts]);

  return {
    toast,
    toasts: state.toasts,
  };
}