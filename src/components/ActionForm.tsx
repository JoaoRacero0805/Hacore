"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/action-state";

type Props = {
  action: (s: ActionState, fd: FormData) => Promise<ActionState>;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
};

/** Formulário ligado a uma Server Action, com mensagem de sucesso/erro embaixo. */
export function ActionForm({ action, children, className, resetOnSuccess }: Props) {
  const [state, formAction] = useActionState(action, {} as ActionState);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      {state.error && (
        <p role="alert" className="mt-2 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      {state.ok && state.message && (
        <p role="status" className="mt-2 text-sm font-medium text-ok">
          {state.message}
        </p>
      )}
    </form>
  );
}

export function SubmitButton({ children, className = "btn btn-primary", pendingText }: { children: ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? (pendingText ?? "Salvando…") : children}
    </button>
  );
}
