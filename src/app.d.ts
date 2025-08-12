// See https://svelte.dev/docs/kit/types#app.d.ts

import type { User, Session, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./lib/database.types.js";

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
  }
}

export { };
