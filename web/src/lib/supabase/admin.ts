import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Cliente service-role. Reservado para o script único de provisionamento
 * de contas de tablet (ver supabase/README.md) — nunca usado em um
 * caminho de request normal do app, para não contornar a RLS que protege
 * o isolamento entre lojas.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
