import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseAdminService {
  constructor(private readonly config: ConfigService) {}

  getClient(): SupabaseClient {
    const url = this.config.getOrThrow<string>("SUPABASE_URL");
    const serviceRoleKey = this.config.getOrThrow<string>(
      "SUPABASE_SERVICE_ROLE_KEY",
    );
    return createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /** Anon client for server-triggered magic links (does not persist sessions). */
  getAnonAuthClient(): SupabaseClient {
    const url = this.config.getOrThrow<string>("SUPABASE_URL");
    const anonKey = this.config.getOrThrow<string>("SUPABASE_ANON_KEY");
    return createClient(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
}
