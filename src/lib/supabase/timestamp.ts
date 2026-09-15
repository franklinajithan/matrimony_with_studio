/** Firestore-compatible Timestamp so existing UI `.toDate()` / `.toMillis()` calls keep working. */
export class Timestamp {
  readonly seconds: number;
  readonly nanoseconds: number;

  constructor(seconds?: number, nanoseconds = 0) {
    if (typeof seconds === "number") {
      this.seconds = seconds;
      this.nanoseconds = nanoseconds;
    } else {
      const now = Date.now();
      this.seconds = Math.floor(now / 1000);
      this.nanoseconds = (now % 1000) * 1e6;
    }
  }

  toDate(): Date {
    return new Date(this.seconds * 1000 + this.nanoseconds / 1e6);
  }

  toMillis(): number {
    return this.seconds * 1000 + Math.floor(this.nanoseconds / 1e6);
  }

  static now(): Timestamp {
    return Timestamp.fromDate(new Date());
  }

  static fromDate(date: Date): Timestamp {
    const ms = date.getTime();
    return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1e6);
  }

  static fromISO(value: string | Date | null | undefined): Timestamp | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return Timestamp.fromDate(date);
  }
}

export function serverTimestamp(): string {
  return new Date().toISOString();
}
