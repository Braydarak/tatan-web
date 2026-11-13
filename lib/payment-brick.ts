/**
 * Acceso al formulario de pago de Mercado Pago (Payment Brick) desde
 * nuestro propio botón "Pagar" (el del Brick está oculto con
 * `hidePaymentButton`).
 *
 * El SDK deja el controlador del Brick en `window.paymentBrickController`.
 */

type BrickFormResult = {
  paymentType?: string;
  selectedPaymentMethod?: string;
  formData?: unknown;
};

type PaymentBrickController = {
  getFormData: () => Promise<BrickFormResult | null | undefined>;
};

declare global {
  interface Window {
    paymentBrickController?: PaymentBrickController;
  }
}

/**
 * Valida el formulario de pago y devuelve sus datos (token de la tarjeta,
 * medio de pago, cuotas…). Si falta algo, el Brick marca los campos y esto
 * devuelve null.
 */
export async function getBrickFormData(): Promise<{ paymentType: string; formData: unknown } | null> {
  const ctrl = typeof window !== "undefined" ? window.paymentBrickController : undefined;
  if (!ctrl) return null;
  try {
    const res = await ctrl.getFormData();
    if (!res?.formData) return null;
    return {
      paymentType: String(res.paymentType || res.selectedPaymentMethod || ""),
      formData: res.formData,
    };
  } catch {
    return null;
  }
}
