export interface Observable<T> {
  subscribe(next: (value: T) => void): { unsubscribe(): void };
  pipe(): Observable<T>;
}
export declare function of<T>(...values: T[]): Observable<T>;
