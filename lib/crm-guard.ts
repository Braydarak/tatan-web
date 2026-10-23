import { NextResponse } from "next/server";
import {
  getSessionFromCookie,
  type AdminSession,
} from "@/lib/auth";

export type AuthenticatedRequestContext = {
  session: AdminSession;
};

/**
 * Helper para proteger Route Handlers del CRM.
 * Si el usuario no tiene sesión válida devuelve 401.
 * Si tiene sesión devuelve la sesión para que la use el handler.
 *
 * Uso:
 *   export async function GET(req: Request) {
 *     const auth = await requireCrmAuth();
 *     if ('error' in auth) return auth.error;
 *     // usar auth.session
 *   }
 */
export async function requireCrmAuth(): Promise<
  | { session: AdminSession }
  | { error: NextResponse; session?: undefined }
> {
  const session = await getSessionFromCookie();
  if (!session) {
    return {
      error: NextResponse.json(
        { ok: false, error: "UNAUTHENTICATED", message: "Sesión inválida o expirada" },
        { status: 401 },
      ),
    };
  }
  return { session };
}
