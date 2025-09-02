// See https://svelte.dev/docs/kit/types#app.d.ts

import type { User, Session, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./lib/database.types.js";
import type {
  CalendarRangeProps,
  CalendarMonthProps,
  CalendarDateProps,
} from "cally";

type MapEvents<T> = {
  [K in keyof T as K extends `on${infer E}` ? `on:${Lowercase<E>}` : K]: T[K];
};

// for information about these interfaces
declare global {
  namespace App {
    interface Error {
      sentryErrorId?: string;
      status?: number;
    }
    interface Locals {
      supabase: SupabaseClient<Database>
      safeGetSession: () => Promise<{ session: Session | null; user: User | null }>
      session: Session | null
      user: User | null
    }
    interface PageData {
      session: Session | null;
      user: User | null;
    }
    // interface PageState {}
    // interface Platform {}
    interface SvelteHTMLElements {
      "calendar-range": MapEvents<CalendarRangeProps>;
      "calendar-month": MapEvents<CalendarMonthProps>;
      "calendar-date": MapEvents<CalendarDateProps>;
    }
  }
}

export { };
