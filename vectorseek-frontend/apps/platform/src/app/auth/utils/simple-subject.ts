export type Observer<T> = (value: T) => void;

export class SimpleSubject<T> {
  private readonly listeners = new Set<Observer<T>>();
  private currentValue: T;

  constructor(initialValue: T) {
    this.currentValue = initialValue;
  }

  next(value: T): void {
    this.currentValue = value;
    for (const listener of this.listeners) {
      listener(value);
    }
  }

  subscribe(listener: Observer<T>): { unsubscribe(): void } {
    listener(this.currentValue);
    this.listeners.add(listener);
    return {
      unsubscribe: () => {
        this.listeners.delete(listener);
      }
    };
  }

  getValue(): T {
    return this.currentValue;
  }

  asObservable(): SimpleSubject<T> {
    return this;
  }
}
