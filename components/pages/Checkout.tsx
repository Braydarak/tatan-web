"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  User,
} from "lucide-react";
import ShippingOptions from "@/components/checkout/ShippingOptions";
import OrderSummary, { useOrderTotals } from "@/components/checkout/OrderSummary";
import { formatArs, useCart } from "@/lib/cart";
import { selectedQuote, useShipping } from "@/lib/checkout-state";
import { SHIPPING_DEMO } from "@/lib/shipping";
import {
  PAYMENT_METHODS,
  PAYMENTS_DEMO,
  PROVINCES,
  startCheckout,
  type Buyer,
  type ShippingAddress,
} from "@/lib/payments";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

const inputBase =
  "block w-full min-w-0 rounded-xl border-2 bg-white px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 shadow-[0_1px_2px_rgba(15,23,42,0.03)] outline-none transition focus:border-tatan-primario4 focus:ring-4 focus:ring-tatan-primario3/40";

type Form = Buyer & Omit<ShippingAddress, "postalCode">;
type Errors = Partial<Record<keyof Form | "shipping" | "branch", string>>;

const EMPTY_FORM: Form = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  dni: "",
  street: "",
  number: "",
  floor: "",
  city: "",
  province: "",
  notes: "",
};

/** Datos del comprador guardados en la pestaña (por si vuelve de Mercado Pago) */
const FORM_KEY = "tatan:checkout-form";

export default function Checkout() {
  const router = useRouter();
  const { items } = useCart();
  const ship = useShipping();
  const quote = selectedQuote(ship);
  const totals = useOrderTotals(items, quote);

  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // Recupera lo que ya había escrito en esta pestaña
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(FORM_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- se lee sessionStorage una sola vez al montar
      if (raw) setForm({ ...EMPTY_FORM, ...(JSON.parse(raw) as Partial<Form>) });
    } catch {}
  }, []);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const next = { ...form, [k]: e.target.value };
    setForm(next);
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
    try {
      sessionStorage.setItem(FORM_KEY, JSON.stringify(next));
    } catch {}
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Ingresá un email válido";
    if (!form.firstName.trim()) e.firstName = "Ingresá tu nombre";
    if (!form.lastName.trim()) e.lastName = "Ingresá tu apellido";
    if (form.phone.replace(/\D/g, "").length < 8) e.phone = "Ingresá un teléfono con código de área";
    if (!/^\d{7,8}$/.test(form.dni.replace(/\D/g, ""))) e.dni = "Ingresá tu DNI (7 u 8 números)";
    if (!quote) e.shipping = "Elegí cómo querés recibir tu compra";
    if (quote?.mode === "domicilio") {
      if (!form.street.trim()) e.street = "Ingresá la calle";
      if (!form.number.trim()) e.number = "Ingresá la altura";
      if (!form.city.trim()) e.city = "Ingresá la localidad";
      if (!form.province) e.province = "Elegí la provincia";
    }
    if (quote?.mode === "sucursal" && !ship.branch) e.branch = "Elegí la sucursal donde vas a retirar";
    return e;
  };

  const pay = async () => {
    const e = validate();
    setErrors(e);
    setPayError(null);
    const first = Object.keys(e)[0];
    if (first) {
      document
        .querySelector(`[data-field="${first}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!quote) return;
    setPaying(true);
    try {
      const { redirectUrl } = await startCheckout({
        buyer: {
          email: form.email.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim(),
          dni: form.dni.replace(/\D/g, ""),
        },
        items,
        shipping: {
          quote,
          address:
            quote.mode === "domicilio"
              ? {
                  street: form.street.trim(),
                  number: form.number.trim(),
                  floor: form.floor?.trim() || undefined,
                  city: form.city.trim(),
                  province: form.province,
                  postalCode: ship.postalCode,
                  notes: form.notes?.trim() || undefined,
                }
              : undefined,
          branch: quote.mode === "sucursal" ? (ship.branch ?? undefined) : undefined,
        },
        totals: { subtotal: totals.subtotal, shipping: totals.shipping ?? 0, total: totals.total },
      });
      if (redirectUrl.startsWith("/")) router.push(redirectUrl);
      else window.location.href = redirectUrl;
    } catch {
      setPayError("No pudimos iniciar el pago. Probá de nuevo en un momento.");
      setPaying(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-4 py-14 text-center">
        <div className="paper-card flex flex-col items-center gap-4 rounded-3xl px-6 py-14">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-tatan-primario1/70">
            <ShoppingBag className="h-9 w-9 text-tatan-secundario2" strokeWidth={1.8} />
          </div>
          <p className="text-lg font-extrabold text-zinc-800">Tu carrito está vacío</p>
          <Link href="/productos" className="btn-primary rounded-2xl px-6 py-3 text-sm font-bold">
            Ver productos
          </Link>
        </div>
      </main>
    );
  }

  const payLabel = `Pagar ${formatArs(totals.total)}`;

  return (
    <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 pb-32 pt-6 sm:px-6 lg:px-8 lg:pb-12">
      <Link
        href="/cart"
        className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-500 hover:text-zinc-800"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Volver al carrito
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-zinc-800 sm:text-3xl">Finalizar compra</h1>

      {(SHIPPING_DEMO || PAYMENTS_DEMO) && (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          Modo demostración: las tarifas de envío son de ejemplo y el pago se
          simula, no se cobra nada.
        </p>
      )}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-5">
          {/* 1. Contacto */}
          <Step n={1} title="Tus datos" icon={User}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Email" error={errors.email} name="email" className="sm:col-span-2"
                hint="Te mandamos ahí la confirmación y el seguimiento">
                <input type="email" autoComplete="email" value={form.email} onChange={set("email")}
                  placeholder="tu@email.com" className={inputCls(errors.email)} />
              </Field>
              <Field label="Nombre" error={errors.firstName} name="firstName">
                <input autoComplete="given-name" value={form.firstName} onChange={set("firstName")} className={inputCls(errors.firstName)} />
              </Field>
              <Field label="Apellido" error={errors.lastName} name="lastName">
                <input autoComplete="family-name" value={form.lastName} onChange={set("lastName")} className={inputCls(errors.lastName)} />
              </Field>
              <Field label="Teléfono" error={errors.phone} name="phone">
                <input type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")}
                  placeholder="11 2345 6789" className={inputCls(errors.phone)} />
              </Field>
              <Field label="DNI" error={errors.dni} name="dni" hint="Lo pide el correo para entregar">
                <input inputMode="numeric" value={form.dni} onChange={set("dni")} className={inputCls(errors.dni)} />
              </Field>
            </div>
          </Step>

          {/* 2. Entrega */}
          <Step n={2} title="Entrega" icon={quote?.mode === "sucursal" ? MapPin : quote?.mode === "retiro" ? Store : Truck}>
            <div data-field="shipping" className="grid gap-4">
              <ShippingOptions items={items} />
              {errors.shipping && !quote && <FieldError>{errors.shipping}</FieldError>}
              {errors.branch && quote?.mode === "sucursal" && !ship.branch && (
                <div data-field="branch"><FieldError>{errors.branch}</FieldError></div>
              )}

              {quote?.mode === "domicilio" && (
                <div className="grid gap-3 border-t border-tatan-secundario1/50 pt-4 sm:grid-cols-6">
                  <p className="text-sm font-bold text-zinc-800 sm:col-span-6">¿A dónde lo enviamos?</p>
                  <Field label="Calle" error={errors.street} name="street" className="sm:col-span-4">
                    <input autoComplete="address-line1" value={form.street} onChange={set("street")} className={inputCls(errors.street)} />
                  </Field>
                  <Field label="Altura" error={errors.number} name="number" className="sm:col-span-2">
                    <input inputMode="numeric" value={form.number} onChange={set("number")} className={inputCls(errors.number)} />
                  </Field>
                  <Field label="Piso / Depto (opcional)" name="floor" className="sm:col-span-2">
                    <input autoComplete="address-line2" value={form.floor} onChange={set("floor")} className={inputCls()} />
                  </Field>
                  <Field label="Localidad" error={errors.city} name="city" className="sm:col-span-4">
                    <input autoComplete="address-level2" value={form.city} onChange={set("city")} className={inputCls(errors.city)} />
                  </Field>
                  <Field label="Provincia" error={errors.province} name="province" className="sm:col-span-4">
                    <select autoComplete="address-level1" value={form.province} onChange={set("province")} className={inputCls(errors.province)}>
                      <option value="">Elegí la provincia</option>
                      {PROVINCES.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Código postal" name="postalCode" className="sm:col-span-2">
                    <input value={ship.postalCode} readOnly className={cx(inputCls(), "bg-zinc-50 text-zinc-500")} />
                  </Field>
                  <Field label="Indicaciones para la entrega (opcional)" name="notes" className="sm:col-span-6">
                    <textarea rows={2} value={form.notes} onChange={set("notes")}
                      placeholder="Ej: timbre 3B, entre calles…" className={cx(inputCls(), "resize-none")} />
                  </Field>
                </div>
              )}
            </div>
          </Step>

          {/* 3. Pago */}
          <Step n={3} title="Pago" icon={CreditCard}>
            <div className="flex items-start gap-3 rounded-2xl border-2 border-sky-200 bg-sky-50/70 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#009ee3] text-xs font-black leading-none text-white">
                MP
              </span>
              <div className="min-w-0 text-sm">
                <p className="font-bold text-zinc-800">Mercado Pago</p>
                <p className="mt-0.5 text-zinc-600">
                  Al tocar &quot;Pagar&quot; te llevamos a Mercado Pago para pagar de forma
                  segura. Cuando termines, volvés acá.
                </p>
                <ul className="mt-2 grid gap-1 text-xs text-zinc-600 sm:grid-cols-2">
                  {PAYMENT_METHODS.map((m) => (
                    <li key={m} className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#009ee3]" aria-hidden="true" />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Step>
        </div>

        {/* Resumen */}
        <aside className="paper-card h-fit rounded-3xl p-5 sm:p-6 lg:sticky lg:top-28">
          <h2 className="mb-4 text-lg font-bold text-zinc-800">Tu pedido</h2>
          <OrderSummary items={items} quote={quote} showItems shippingHint="Elegí el envío">
            <div className="hidden lg:grid lg:gap-2">
              <PayButton onClick={pay} paying={paying} label={payLabel} />
              {payError && <FieldError>{payError}</FieldError>}
              <SecureNote />
            </div>
          </OrderSummary>
        </aside>
      </div>

      {/* Celular: total y pagar siempre a mano */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-tatan-secundario1/60 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        {payError && <FieldError>{payError}</FieldError>}
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-zinc-500">
              Total{quote ? "" : " (sin envío)"}
            </p>
            <p className="text-lg font-black tabular-nums text-zinc-800">{formatArs(totals.total)}</p>
          </div>
          <div className="flex-1">
            <PayButton onClick={pay} paying={paying} label="Pagar" />
          </div>
        </div>
      </div>
    </main>
  );
}

function inputCls(error?: string) {
  return cx(inputBase, error ? "border-rose-300" : "border-tatan-secundario1/50");
}

function Step({
  n,
  title,
  icon: Icon,
  children,
}: {
  n: number;
  title: string;
  icon: typeof User;
  children: React.ReactNode;
}) {
  return (
    <section className="paper-card rounded-3xl p-5 sm:p-6" aria-labelledby={`step-${n}`}>
      <h2 id={`step-${n}`} className="mb-4 flex items-center gap-2.5 text-lg font-bold text-zinc-800">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-tatan-primario1 text-sm font-black text-zinc-800">
          {n}
        </span>
        {title}
        <Icon className="ml-auto h-5 w-5 text-tatan-secundario2" aria-hidden="true" />
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  name,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactElement;
}) {
  return (
    <label data-field={name} className={cx("grid gap-1.5", className)}>
      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">{label}</span>
      {children}
      {error ? <FieldError>{error}</FieldError> : hint ? <span className="text-xs text-zinc-400">{hint}</span> : null}
    </label>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-xs font-semibold text-rose-600" role="alert">
      {children}
    </span>
  );
}

function PayButton({ onClick, paying, label }: { onClick: () => void; paying: boolean; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={paying}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#009ee3] px-5 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-[#0089c7] disabled:cursor-wait disabled:opacity-70"
    >
      {paying ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Yendo a Mercado Pago…
        </>
      ) : (
        <>
          <Lock className="h-4 w-4" aria-hidden="true" />
          {label}
        </>
      )}
    </button>
  );
}

function SecureNote() {
  return (
    <p className="flex items-center justify-center gap-1.5 text-xs text-zinc-500">
      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
      Pago protegido por Mercado Pago
    </p>
  );
}
