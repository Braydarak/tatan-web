"use client";

import CustomButton from "@/components/ui/CustomButton";
import CustomInput from "@/components/ui/CustomInput";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as React from "react";

const INVALID_USER_MESSAGE = "Usuario incorrecto.";
const INVALID_PASSWORD_MESSAGE = "Contraseña incorrecta.";

export default function Login() {
  const router = useRouter();
  const [user, setUser] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<{
    user?: string;
    password?: string;
  }>({});

  const canSubmit = !submitting;

  function validate(nextUser: string, nextPassword: string) {
    const nextErrors: { user?: string; password?: string } = {};
    if (!nextUser.trim()) nextErrors.user = "Ingresá tu usuario.";

    if (!nextPassword.trim()) nextErrors.password = "Ingresá tu contraseña.";

    return nextErrors;
  }

  async function onSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const nextErrors = validate(user, password);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/crm-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ user, password }),
      });

      const data = (await res.json().catch(() => null)) as
        | { ok: true }
        | { ok: false; userOk: boolean; passwordOk: boolean }
        | null;

      if (!data || !("ok" in data)) {
        setErrors({ password: "Error al iniciar sesión. Probá de nuevo." });
        return;
      }

      if (!data.ok) {
        setErrors({
          user: data.userOk ? undefined : INVALID_USER_MESSAGE,
          password: data.passwordOk ? undefined : INVALID_PASSWORD_MESSAGE,
        });
        return;
      }

      setErrors({});
      router.push("/crm");
      setTimeout(() => {
        if (window.location.pathname !== "/crm") window.location.assign("/crm");
      }, 0);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-linear-to-b from-[#FFF7F0] via-white to-[#F7FBFF] px-4 py-10">
      <main className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <Image
            className="mx-auto"
            src="/tatanLogo.png"
            alt="Tatan"
            width={200}
            height={40}
            priority
          />
          <span className="mt-5 inline-flex items-center rounded-full border border-[#FCD1B1] bg-[#FCD1B1]/20 px-3 py-1 text-xs font-semibold text-zinc-800">
            Acceso CRM
          </span>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">
            Ingresá a tu cuenta
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Usá tus credenciales para acceder al CRM.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="mt-6 rounded-2xl border border-black/5 bg-[#FEFDF8]/80 p-5 shadow-sm backdrop-blur"
        >
          <div className="flex flex-col gap-4">
            <CustomInput
              label="Usuario"
              placeholder="Ingresá tu usuario"
              autoComplete="username"
              inputMode="text"
              name="user"
              value={user}
              onChange={(e) => {
                const next = e.currentTarget.value;
                setUser(next);
                if (!errors.user) return;
                setErrors((prev) => ({ ...prev, user: undefined }));
              }}
              error={errors.user}
            />

            <CustomInput
              label="Contraseña"
              placeholder="Ingresá tu contraseña"
              type="password"
              autoComplete="current-password"
              name="password"
              value={password}
              onChange={(e) => {
                const next = e.currentTarget.value;
                setPassword(next);
                if (!errors.password) return;
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              error={errors.password}
            />

            <CustomButton
              className="w-full"
              type="filled"
              htmlType="submit"
              disabled={!canSubmit}
            >
              {submitting ? "Ingresando..." : "Ingresar"}
            </CustomButton>

            <div className="flex items-center justify-center gap-3">
              <CustomButton
                type="text"
                htmlType="button"
                onClick={() => router.push("/")}
              >
                Volver al sitio
              </CustomButton>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
