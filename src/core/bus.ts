export type EventType = 'error' | 'unhandledRejection' | 'warning';

type Listener = (error: Error, type: EventType) => void;

class Bus {
  private listeners: Listener[] = [];

  emit(error: Error, type: EventType) {
    for (const listener of this.listeners) {
      try {
        listener(error, type);
      } catch (e) {
        console.error('[whylog] Error in listener:', e);
      }
    }
  }

  on(listener: Listener) {
    this.listeners.push(listener);
  }
}

export const bus = new Bus();
