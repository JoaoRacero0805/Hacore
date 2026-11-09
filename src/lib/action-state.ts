export type ActionState = { ok?: boolean; error?: string; message?: string; at?: number };

/** Executa a ação e transforma erro em mensagem para o formulário (sem tela de erro). */
export async function run(fn: () => Promise<string | void>): Promise<ActionState> {
  try {
    const message = await fn();
    return { ok: true, message: message ?? undefined, at: Date.now() };
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) throw e;
    console.error(e);
    return { ok: false, error: e instanceof Error ? e.message : "Algo deu errado.", at: Date.now() };
  }
}
