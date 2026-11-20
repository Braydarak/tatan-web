"use client";

/**
 * CRM → Ventas: cada pedido como un ticket con quién compró, qué compró
 * (talle, color, cantidad), cuándo, cuánto pagó, la entrega y el pago.
 * Los datos salen de php-api/orders.php (solo con sesión del CRM).
 */

import * as React from "react";
import Image from "next/image";
import {
  CalendarClock,
  ChevronDown,
  CreditCard,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Search,
  Truck,
  User,
} from "lucide-react";
import { apiOrders, apiProducts, type Order, type OrderStatus } from "@/lib/tatan-api";
import { formatMoneyArs } from "./format";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

const STATUS: Record<OrderStatus, { label: string; tone: string }> = {
  paid: { label: "Pagado", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending: { label: "Pendiente de pago", tone: "bg-amber-50 text-amber-700 border-amber-200" },
  shipped: { label: "Enviado", tone: "bg-sky-50 text-sky-700 border-sky-200" },
  delivered: { label: "Entregado", tone: "bg-violet-50 text-violet-700 border-violet-200" },
  cancelled: { label: "Cancelado / rechazado", tone: "bg-zinc-100 text-zinc-500 border-zinc-200" },
  refunded: { label: "Devuelto", tone: "bg-rose-50 text-rose-700 border-rose-200" },
  draft: { label: "Borrador", tone: "bg-zinc-100 text-zinc-500 border-zinc-200" },
};

const FILTERS: { key: "todas" | OrderStatus; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "paid", label: "Pagadas" },
  { key: "pending", label: "Pendientes" },
  { key: "shipped", label: "Enviadas" },
  { key: "delivered", label: "Entregadas" },
  { key: "cancelled", label: "Canceladas" },
  { key: "refunded", label: "Devueltas" },
];

/** Pedidos que ya cobramos (cuentan como venta) */
const SOLD: OrderStatus[] = ["paid", "shipped", "delivered"];

const PAYMENT_NAMES: Record<string, string> = {
  visa: "Visa",
  master: "Mastercard",
  amex: "American Express",
  naranja: "Naranja",
  cabal: "Cabal",
  debvisa: "Visa Débito",
  debmaster: "Mastercard Débito",
  debcabal: "Cabal Débito",
  maestro: "Maestro",
  argencard: "Argencard",
  diners: "Diners",
  rapipago: "Rapipago (efectivo)",
  pagofacil: "Pago Fácil (efectivo)",
};

/** "2026-11-20 16:45:02" (hora del servidor) → "20/11/2026 16:45" */
function formatDate(s: string | null): string {
  if (!s) return "";
  const d = new Date(s.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function deliveryLines(o: Order): string[] {
  const s = o.shipping;
  if (s.mode === "sucursal" && s.branch) {
    return [`Retira en sucursal: ${s.branch.name ?? ""}`, [s.branch.address, s.branch.city].filter(Boolean).join(", ")];
  }
  const street = [`${s.street} ${s.number}`.trim(), s.floor].filter(Boolean).join(", ");
  return [street, [s.city, s.province, s.postalCode && `CP ${s.postalCode}`].filter(Boolean).join(", ")].filter(Boolean);
}

/** Link de WhatsApp (los teléfonos se guardan sin espacios; se asume Argentina) */
function whatsappHref(phone: string): string | null {
  let d = phone.replace(/\D/g, "");
  if (d.length < 8) return null;
  if (!d.startsWith("54")) d = `54${d.replace(/^0/, "")}`;
  return `https://wa.me/${d}`;
}

export default function Ventas() {
  const [orders, setOrders] = React.useState<Order[] | null>(null);
  const [images, setImages] = React.useState<Record<string, string>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]["key"]>("todas");
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    let alive = true;
    apiOrders()
      .then((list) => alive && setOrders(list))
      .catch((e) => alive && setError(e instanceof Error ? e.message : "No se pudieron cargar las ventas"));
    // Fotos de los productos (para los tickets); si falla, van sin foto
    apiProducts()
      .then((list) => alive && setImages(Object.fromEntries(list.map((p) => [p.id, p.imageSrc]))))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const totals = React.useMemo(() => {
    const list = orders ?? [];
    const sold = list.filter((o) => SOLD.includes(o.status));
    return {
      count: sold.length,
      revenue: sold.reduce((a, o) => a + o.amounts.total, 0),
      toShip: list.filter((o) => o.status === "paid").length,
      pending: list.filter((o) => o.status === "pending").length,
    };
  }, [orders]);

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return (orders ?? []).filter((o) => {
      if (filter !== "todas" && o.status !== filter) return false;
      if (!q) return true;
      const hay = [o.orderNumber, o.buyer.name, o.buyer.email, o.buyer.phone, o.buyer.dni, ...o.items.map((i) => i.name)]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [orders, filter, query]);

  if (error) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900">{error}</div>;
  }
  if (orders === null) {
    return <div className="h-72 animate-pulse rounded-2xl border border-black/5 bg-white" />;
  }

  return (
    <div className="space-y-5">
      {/* Totales */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Ventas cobradas", value: String(totals.count) },
          { label: "Ingresos", value: formatMoneyArs(totals.revenue) },
          { label: "Para despachar", value: String(totals.toShip) },
          { label: "Pendientes de pago", value: String(totals.pending) },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-black/5 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">{k.label}</p>
            <p className="mt-2 text-2xl font-extrabold tabular-nums text-zinc-900">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          {FILTERS.map((f) => {
            const n = f.key === "todas" ? orders.length : orders.filter((o) => o.status === f.key).length;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cx(
                  "shrink-0 rounded-xl border px-3 py-1.5 text-sm font-semibold transition",
                  filter === f.key
                    ? "border-tatan-primario4 bg-tatan-primario1/60 text-zinc-900"
                    : "border-black/10 bg-white text-zinc-600 hover:bg-zinc-50",
                )}
              >
                {f.label} <span className="ml-1 text-xs text-zinc-400">{n}</span>
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, mail, pedido o producto"
            className="w-full rounded-xl border border-black/10 bg-white py-2 pl-9 pr-3 text-sm text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/40"
          />
        </div>
      </div>

      {/* Tickets */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-white px-4 py-14 text-center text-sm text-zinc-400">
          {orders.length === 0 ? "Todavía no hay ventas." : "No hay ventas con ese filtro."}
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((o) => (
            <Ticket key={o.id} order={o} images={images} />
          ))}
        </div>
      )}
    </div>
  );
}

function Ticket({ order: o, images }: { order: Order; images: Record<string, string> }) {
  const st = STATUS[o.status] ?? STATUS.draft;
  const units = o.items.reduce((a, i) => a + i.quantity, 0);
  const wa = whatsappHref(o.buyer.phone);
  const payType = o.payment.type ? (PAYMENT_NAMES[o.payment.type] ?? o.payment.type) : null;

  return (
    <article className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      {/* Cabecera del ticket */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-black/10 bg-[#FFFBF5] px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="font-mono text-sm font-bold tracking-tight text-zinc-900">{o.orderNumber}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
            <CalendarClock className="h-3.5 w-3.5" />
            {formatDate(o.createdAt)}
            <span className="text-zinc-300">·</span>
            {units} {units === 1 ? "unidad" : "unidades"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={cx("rounded-full border px-2.5 py-1 text-xs font-bold", st.tone)}>{st.label}</span>
          <span className="text-xl font-extrabold tabular-nums text-zinc-900">{formatMoneyArs(o.amounts.total)}</span>
        </div>
      </header>

      <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Qué compró (min-w-0: los nombres largos se cortan en vez de empujar los importes) */}
        <section className="min-w-0">
          <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            <Package className="h-3.5 w-3.5" /> Qué compró
          </h3>
          <ul className="divide-y divide-black/5">
            {o.items.map((i, k) => (
              <li key={`${i.productId}-${k}`} className="flex items-center gap-3 py-2">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-zinc-50">
                  {images[i.productId] ? (
                    <Image src={images[i.productId]} alt="" fill sizes="44px" className="object-contain p-0.5" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-900">{i.name}</p>
                  <p className="text-xs text-zinc-500">
                    {[i.color && `Color: ${i.color}`, i.size != null && `Talle: ${i.size}`, `${i.quantity} × ${formatMoneyArs(i.unitPrice)}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-zinc-900">{formatMoneyArs(i.subtotal)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-2 space-y-1 border-t border-black/5 pt-2 text-sm">
            <div className="flex justify-between text-zinc-500">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatMoneyArs(o.amounts.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-zinc-500">
              <dt>Envío</dt>
              <dd className="tabular-nums">{formatMoneyArs(o.amounts.shipping)}</dd>
            </div>
            {o.amounts.discount > 0 && (
              <div className="flex justify-between text-zinc-500">
                <dt>Descuento</dt>
                <dd className="tabular-nums">−{formatMoneyArs(o.amounts.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between font-bold text-zinc-900">
              <dt>{SOLD.includes(o.status) ? "Total pagado" : "Total"}</dt>
              <dd className="tabular-nums">{formatMoneyArs(o.amounts.total)}</dd>
            </div>
          </dl>
        </section>

        <div className="min-w-0 space-y-4">
          {/* Quién compró */}
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              <User className="h-3.5 w-3.5" /> Quién compró
            </h3>
            <p className="text-sm font-semibold text-zinc-900">{o.buyer.name}</p>
            <div className="mt-1 space-y-1 text-sm text-zinc-600">
              <a href={`mailto:${o.buyer.email}`} className="flex items-center gap-1.5 hover:text-zinc-900">
                <Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{o.buyer.email}</span>
              </a>
              {o.buyer.phone && (
                <p className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <a href={`tel:${o.buyer.phone}`} className="hover:text-zinc-900">{o.buyer.phone}</a>
                  {wa && (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      <MessageCircle className="h-3 w-3" /> WhatsApp
                    </a>
                  )}
                </p>
              )}
              {o.buyer.dni && <p className="text-xs text-zinc-500">DNI {o.buyer.dni}</p>}
            </div>
          </section>

          {/* Entrega */}
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              <Truck className="h-3.5 w-3.5" /> Entrega
            </h3>
            <p className="text-sm font-semibold text-zinc-900">{o.shipping.method || "—"}</p>
            <div className="mt-1 flex gap-1.5 text-sm text-zinc-600">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div>
                {deliveryLines(o).map((l) => (
                  <p key={l}>{l}</p>
                ))}
              </div>
            </div>
            {o.shipping.notes && <p className="mt-1 text-xs text-zinc-500">Notas: {o.shipping.notes}</p>}
            {o.shipping.tracking && <p className="mt-1 text-xs text-zinc-500">Seguimiento: {o.shipping.tracking}</p>}
          </section>

          {/* Pago */}
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              <CreditCard className="h-3.5 w-3.5" /> Pago
            </h3>
            <p className="text-sm text-zinc-700">
              Mercado Pago{payType ? ` · ${payType}` : ""}
            </p>
            {o.paidAt && <p className="text-xs text-zinc-500">Acreditado el {formatDate(o.paidAt)}</p>}
            {o.payment.id && <p className="text-xs text-zinc-400">ID {o.payment.id}</p>}
          </section>
        </div>
      </div>

      {/* Historial */}
      {o.events.length > 0 && (
        <details className="group border-t border-black/5">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 sm:px-5">
            <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
            Historial ({o.events.length})
          </summary>
          <ol className="space-y-1.5 px-4 pb-4 sm:px-5">
            {o.events.map((e, k) => (
              <li key={k} className="text-xs text-zinc-500">
                <span className="tabular-nums text-zinc-400">{formatDate(e.at)}</span> ·{" "}
                <span className="font-semibold text-zinc-700">{STATUS[e.status as OrderStatus]?.label ?? e.status}</span>
                {e.note ? ` — ${e.note}` : ""}
              </li>
            ))}
          </ol>
        </details>
      )}
    </article>
  );
}
