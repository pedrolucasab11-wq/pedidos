// Formas de pagamento disponíveis no pedido. Mantidas como lista fixa porque
// são poucas e bem definidas — diferente do prazo de pagamento (dias), que é
// sempre digitado livremente pois varia caso a caso (30/60/90, 25/50/75 etc.).
export const PAYMENT_METHODS = ["PIX", "Boleto", "Cartão", "Dinheiro"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// Indica se a forma de pagamento selecionada costuma ter prazo/parcelamento em
// dias (boleto). Usado para exibir o campo de prazo apenas quando relevante.
export function isInstallmentPayment(paymentMethod: string): boolean {
  const normalized = paymentMethod.trim().toLowerCase();
  return normalized.includes("boleto") || normalized.includes("prazo");
}
