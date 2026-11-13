"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
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
import MercadoPagoSvg from "@/assets/svg/mercadoPago";
import { checkDni, checkEmail, checkPhoneAR } from "@/lib/contact-validation";
import { lookupPostalCode, type PostalInfo } from "@/lib/postal-codes";
import OrderSummary, { useOrderTotals } from "@/components/checkout/OrderSummary";
import { formatArs, useCart } from "@/lib/cart";
import { selectedQuote, useShipping } from "@/lib/checkout-state";
import { SHIPPING_DEMO } from "@/lib/shipping";
import {
  PAYMENT_METHODS,
  PAYMENTS_DEMO,
  PROVINCES,
  CheckoutError,
  createOrder,
  payOrder,
  resultUrl,
  type Buyer,
  type CheckoutOrder,
  type CreatedOrder,
  type ShippingAddress,
} from "@/lib/payments";

// El formulario de Mercado Pago solo existe en el navegador
const PaymentBrick = dynamic(() => import("@/components/checkout/PaymentBrick"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-40 items-center justify-center gap-2 text-sm font-semibold text-zinc-500">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      Cargando medios de pago…
    </div>
  ),
});

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
  /** Pedido ya guardado en el servidor (para pagar) y con qué datos se armó */
  const [prepared, setPrepared] = useState<{ key: string; order: CreatedOrder } | null>(null);
  /** Cambia para volver a montar el formulario de pago (después de un rechazo) */
  const [brickKey, setBrickKey] = useState(0);

  // Recupera lo que ya había escrito en esta pestaña
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(FORM_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- se lee sessionStorage una sola vez al montar
      if (raw) setForm({ ...EMPTY_FORM, ...(JSON.parse(raw) as Partial<Form>) });
    } catch {}
  }, []);

  // Provincia y localidad según el código postal del envío. `auto` guarda lo
  // que se completó solo: si el comprador lo cambió a mano, no se pisa.
  const [postal, setPostal] = useState<{ cp: string; info: PostalInfo | null } | null>(null);
  const [auto, setAuto] = useState<{ province?: string; city?: string }>({});
  useEffect(() => {
    const cp = ship.postalCode;
    if (!cp) return;
    let alive = true;
    void lookupPostalCode(cp).then((info) => {
      if (!alive) return;
      setPostal({ cp, info });
      if (!info) return;
      const province = info.provinces[0];
      const city = info.localities[0];
      setForm((prev) => {
        const next = { ...prev };
        if (!prev.province || prev.province === auto.province) next.province = province;
        if (city && (!prev.city.trim() || prev.city === auto.city)) next.city = city;
        try {
          sessionStorage.setItem(FORM_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
      setAuto({ province, city });
      setErrors((er) => ({ ...er, province: undefined, city: undefined }));
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo cuando cambia el código postal
  }, [ship.postalCode]);
  const postalInfo = postal?.cp === ship.postalCode ? postal.info : null;

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const next = { ...form, [k]: e.target.value };
    setForm(next);
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
    try {
      sessionStorage.setItem(FORM_KEY, JSON.stringify(next));
    } catch {}
  };

  /** Error de un campo de datos personales (o undefined si está bien) */
  const fieldError = (k: keyof Form, f: Form = form): string | undefined => {
    if (k === "email") return checkEmail(f.email).error;
    if (k === "phone") return checkPhoneAR(f.phone).error;
    if (k === "dni") return checkDni(f.dni);
    if (k === "firstName") return f.firstName.trim() ? undefined : "Ingresá tu nombre";
    if (k === "lastName") return f.lastName.trim() ? undefined : "Ingresá tu apellido";
    return undefined;
  };
  // "¿Quisiste decir …@gmail.com?" (no bloquea: puede ser un dominio real)
  const emailSuggestion = form.email.includes("@") ? checkEmail(form.email).suggestion : undefined;
  /** Al salir de un campo se valida (si tiene algo escrito) */
  const blur = (k: keyof Form) => () => {
    if (!String(form[k] ?? "").trim()) return;
    setErrors((er) => ({ ...er, [k]: fieldError(k) }));
  };

  const validate = (): Errors => {
    const e: Errors = {};
    for (const k of ["email", "firstName", "lastName", "phone", "dni"] as const) {
      const err = fieldError(k);
      if (err) e[k] = err;
    }
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

  /** Datos del pedido tal como están ahora en la pantalla */
  const buildOrder = (): CheckoutOrder | null => {
    if (!quote) return null;
    return {
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
        postalCode: ship.postalCode,
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
    };
  };
  // Si cambia algo (datos, carrito o envío) después de preparar el pedido,
  // hay que volver a prepararlo: el pedido guardado ya no coincide.
  const current = buildOrder();
  const orderKey = current
    ? JSON.stringify([current.buyer, current.shipping.address, current.shipping.quote.id, current.shipping.postalCode, current.shipping.branch?.id, items.map((i) => [i.key, i.quantity])])
    : "";
  const ready = prepared && prepared.key === orderKey ? prepared.order : null;

  /** Con qué total se muestra el formulario de pago (el del servidor si ya se guardó el pedido) */
  const brickAmount = ready ? ready.total : totals.total;

  /** Valida los datos y la entrega; si falta algo, lo marca y lleva hasta ahí */
  const checkForm = (): boolean => {
    const e = validate();
    setErrors(e);
    const first = Object.keys(e)[0];
    if (!first) return true;
    setPayError("Antes de pagar, completá los datos que faltan (están marcados en rojo).");
    document
      .querySelector(`[data-field="${first}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
    return false;
  };

  /** Pedido guardado en el servidor para los datos actuales (lo crea si hace falta) */
  const ensureOrder = async (): Promise<CreatedOrder | null> => {
    if (!current) return null;
    if (ready) return ready;
    const order = await createOrder(current);
    setPrepared({ key: orderKey, order });
    return order;
  };

  /** Solo en modo demo (sin formulario de Mercado Pago): simula el pago */
  const payDemo = async () => {
    setPayError(null);
    if (!checkForm()) return;
    setPaying(true);
    try {
      const order = await ensureOrder();
      if (!order) return setPaying(false);
      router.push(resultUrl(await payOrder(order.orderNumber, null), true));
    } catch (err) {
      setPayError(err instanceof CheckoutError ? err.message : "No pudimos procesar el pago. Probá de nuevo.");
      setPaying(false);
    }
  };

  /**
   * El comprador tocó "Pagar" en el formulario de Mercado Pago (el botón
   * aparece recién cuando eligió el medio de pago y lo valida el Brick).
   * Si la promesa se rechaza, el Brick vuelve a habilitar el formulario
   * sin borrar lo que cargó.
   */
  const submitPayment = async (formData: unknown) => {
    setPayError(null);
    if (!checkForm()) throw new Error("FORM_INVALID");
    let order: CreatedOrder | null;
    try {
      order = await ensureOrder();
    } catch (err) {
      setPayError(err instanceof CheckoutError ? err.message : "No pudimos preparar tu pedido. Probá de nuevo en un momento.");
      throw err;
    }
    if (!order) throw new Error("NO_ORDER");
    // El servidor recalculó el total y no coincide con el que se mostró: no se cobra
    if (Math.round(order.total) !== Math.round(brickAmount)) {
      setPayError(`El total se actualizó a ${formatArs(order.total)} (cambió un precio o la tarifa del envío). Revisalo y volvé a tocar Pagar.`);
      setBrickKey((k) => k + 1);
      throw new Error("AMOUNT_CHANGED");
    }
    try {
      const r = await payOrder(order.orderNumber, formData);
      if (r.status === "rejected") {
        setPayError(r.message ?? "El pago fue rechazado. Probá con otro medio de pago.");
        // El token de la tarjeta ya se usó: el formulario se vuelve a cargar
        setBrickKey((k) => k + 1);
        return;
      }
      router.push(resultUrl(r));
    } catch (err) {
      setPayError(err instanceof CheckoutError ? err.message : "No pudimos procesar el pago. Probá de nuevo en un momento.");
      setBrickKey((k) => k + 1);
    }
  };

  const scrollToPayment = () =>
    document.getElementById("step-3")?.scrollIntoView({ behavior: "smooth", block: "start" });

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
    <>
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
          Modo demostración:{" "}
          {SHIPPING_DEMO && PAYMENTS_DEMO
            ? "las tarifas de envío son de ejemplo y el pago se simula, no se cobra nada."
            : SHIPPING_DEMO
              ? "las tarifas de envío son de ejemplo."
              : "el pago se simula, no se cobra nada."}
        </p>
      )}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-5">
          {/* 1. Contacto */}
          <Step n={1} title="Tus datos" icon={User}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Email" error={errors.email} name="email" className="sm:col-span-2"
                hint={emailSuggestion ? undefined : "Te mandamos ahí la confirmación y el seguimiento"}
                extra={
                  emailSuggestion && !errors.email ? (
                    <button
                      type="button"
                      onClick={() => {
                        const next = { ...form, email: emailSuggestion };
                        setForm(next);
                        try {
                          sessionStorage.setItem(FORM_KEY, JSON.stringify(next));
                        } catch {}
                      }}
                      className="w-fit rounded-lg bg-tatan-acento-amarillo/60 px-2.5 py-1 text-left text-xs font-semibold text-zinc-800 hover:bg-tatan-acento-amarillo"
                    >
                      ¿Quisiste decir <span className="font-extrabold">{emailSuggestion}</span>? Tocá para corregirlo
                    </button>
                  ) : null
                }>
                <input type="email" inputMode="email" autoComplete="email" autoCapitalize="off" spellCheck={false}
                  value={form.email} onChange={set("email")} onBlur={blur("email")}
                  placeholder="tu@email.com" className={inputCls(errors.email)} />
              </Field>
              <Field label="Nombre" error={errors.firstName} name="firstName">
                <input autoComplete="given-name" value={form.firstName} onChange={set("firstName")} onBlur={blur("firstName")} className={inputCls(errors.firstName)} />
              </Field>
              <Field label="Apellido" error={errors.lastName} name="lastName">
                <input autoComplete="family-name" value={form.lastName} onChange={set("lastName")} onBlur={blur("lastName")} className={inputCls(errors.lastName)} />
              </Field>
              <Field label="Teléfono" error={errors.phone} name="phone" hint="Con código de área, sin 0 ni 15">
                <input type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} onBlur={blur("phone")}
                  placeholder="11 2345 6789" className={inputCls(errors.phone)} />
              </Field>
              <Field label="DNI" error={errors.dni} name="dni" hint="Lo pide el correo para entregar">
                <input inputMode="numeric" value={form.dni} onChange={set("dni")} onBlur={blur("dni")}
                  placeholder="30111222" className={inputCls(errors.dni)} />
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
                  {/* El código postal ya se eligió arriba (para el envío): provincia y
                      localidad se completan solas a partir de él */}
                  <Field label="Provincia" error={errors.province} name="province" className="sm:col-span-3"
                    hint={
                      postalInfo && form.province === auto.province
                        ? postalInfo.provinces.length > 1
                          ? `Según tu código postal (${ship.postalCode}). Puede ser otra: revisala`
                          : `Según tu código postal (${ship.postalCode})`
                        : undefined
                    }>
                    <select autoComplete="address-level1" value={form.province} onChange={set("province")} className={inputCls(errors.province)}>
                      <option value="">Elegí la provincia</option>
                      {PROVINCES.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Localidad" error={errors.city} name="city" className="sm:col-span-3"
                    hint={
                      postalInfo && form.city === auto.city
                        ? postalInfo.localities.length > 1
                          ? "Si no es la tuya, elegí otra de la lista o escribila"
                          : "Según tu código postal"
                        : undefined
                    }>
                    <input autoComplete="address-level2" list="cp-localities" value={form.city} onChange={set("city")} onBlur={blur("city")}
                      className={inputCls(errors.city)} />
                  </Field>
                  {postalInfo && postalInfo.localities.length > 1 && (
                    <datalist id="cp-localities">
                      {postalInfo.localities.map((l) => (
                        <option key={l} value={l} />
                      ))}
                    </datalist>
                  )}
                  <Field label="Calle" error={errors.street} name="street" className="sm:col-span-4">
                    <input autoComplete="address-line1" value={form.street} onChange={set("street")} className={inputCls(errors.street)} />
                  </Field>
                  <Field label="Altura" error={errors.number} name="number" className="sm:col-span-2">
                    <input inputMode="numeric" value={form.number} onChange={set("number")} className={inputCls(errors.number)} />
                  </Field>
                  <Field label="Piso / Depto (opcional)" name="floor" className="sm:col-span-2">
                    <input autoComplete="address-line2" value={form.floor} onChange={set("floor")} className={inputCls()} />
                  </Field>
                  <Field label="Indicaciones para la entrega (opcional)" name="notes" className="sm:col-span-4">
                    <textarea rows={2} value={form.notes} onChange={set("notes")}
                      placeholder="Ej: timbre 3B, entre calles…" className={cx(inputCls(), "resize-none")} />
                  </Field>
                </div>
              )}
            </div>
          </Step>

          {/* 3. Pago */}
          <Step n={3} title="Pago" icon={CreditCard}>
            {PAYMENTS_DEMO ? (
              <PaymentInfo />
            ) : !quote ? (
              <div className="grid gap-3">
                <PaymentInfo />
                <p className="text-center text-sm font-semibold text-zinc-500">
                  Elegí el envío para ver los medios de pago
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {payError && (
                  <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700" role="alert">
                    {payError}
                  </p>
                )}
                <PaymentBrick
                  // Se vuelve a cargar si cambia el total o después de un intento rechazado
                  key={`${brickKey}-${Math.round(brickAmount)}`}
                  amount={brickAmount}
                  payer={{
                    email: form.email.trim(),
                    firstName: form.firstName.trim(),
                    lastName: form.lastName.trim(),
                    dni: form.dni.replace(/\D/g, ""),
                  }}
                  onSubmit={submitPayment}
                  onError={setPayError}
                />
                <p className="flex items-center justify-center gap-1.5 text-xs text-zinc-500">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Los datos de tu tarjeta los procesa Mercado Pago: no pasan por Tatan
                </p>
              </div>
            )}
          </Step>
        </div>

        {/* Resumen */}
        <aside className="paper-card h-fit rounded-3xl p-5 sm:p-6 lg:sticky lg:top-28">
          <h2 className="mb-4 text-lg font-bold text-zinc-800">Tu pedido</h2>
          <OrderSummary items={items} quote={quote} showItems shippingHint="Elegí el envío">
            <div className="hidden lg:grid lg:gap-2">
              {PAYMENTS_DEMO ? (
                <>
                  <PayButton onClick={payDemo} paying={paying} label={payLabel} />
                  {payError && <FieldError>{payError}</FieldError>}
                </>
              ) : (
                <button
                  type="button"
                  onClick={scrollToPayment}
                  className="rounded-2xl bg-sky-50 px-4 py-3 text-center text-sm font-semibold text-sky-900 ring-1 ring-sky-200 hover:bg-sky-100"
                >
                  {quote ? "Elegí cómo pagar en el paso 3" : "Elegí el envío y después cómo pagar"}
                </button>
              )}
              <SecureNote />
            </div>
          </OrderSummary>
        </aside>
      </div>

    </main>
      {/* Celular: total y pagar siempre a mano. Va FUERA del <main>: el main
        tiene z-10 (contexto propio) y el footer, también z-10, la tapaba. */}
    <div className="fixed inset-x-0 bottom-0 z-[55] border-t border-tatan-secundario1/60 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
{PAYMENTS_DEMO && payError && <FieldError>{payError}</FieldError>}
      {!quote && (
        <p className="mb-1.5 text-center text-[11px] font-semibold text-zinc-500">
          Falta elegir el envío
        </p>
      )}
      {PAYMENTS_DEMO ? (
        <PayButton onClick={payDemo} paying={paying} label={payLabel} />
      ) : (
        <button
          type="button"
          onClick={scrollToPayment}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#009ee3] px-5 py-3.5 text-sm font-extrabold text-white shadow-md"
        >
          <CreditCard className="h-4 w-4" aria-hidden="true" />
          Ir al pago · {formatArs(brickAmount)}
        </button>
      )}
    </div>
    </>
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
  extra,
  className,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  /** Algo más debajo del campo (p. ej. la sugerencia del email) */
  extra?: React.ReactNode;
  className?: string;
  children: React.ReactElement;
}) {
  return (
    <div data-field={name} className={cx("grid content-start gap-1.5", className)}>
      <label className="grid content-start gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">{label}</span>
        {children}
      </label>
      {error ? <FieldError>{error}</FieldError> : hint ? <span className="text-xs text-zinc-400">{hint}</span> : null}
      {extra}
    </div>
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
          Procesando…
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

/** Qué medios de pago hay (antes de que aparezca el formulario de Mercado Pago) */
function PaymentInfo() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border-2 border-sky-200 bg-sky-50/70 p-4">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-sky-200">
        <MercadoPagoSvg iconOnly className="h-auto w-9" color="brand" title="Mercado Pago" />
      </span>
      <div className="min-w-0 text-sm">
        <p className="font-bold text-zinc-800">Pagá acá mismo con Mercado Pago</p>
        <p className="mt-0.5 text-zinc-600">
          Sin salir de la tienda. Los datos de tu tarjeta los procesa Mercado Pago de forma segura.
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
