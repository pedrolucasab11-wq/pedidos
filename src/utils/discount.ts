/**
 * Aplica um ou mais descontos percentuais em cascata sobre um preço base.
 * O formato aceito é uma string com percentuais separados por "/", ex: "10 / 5".
 * Cada desconto é aplicado sequencialmente sobre o valor já descontado anteriormente
 * (desconto em cascata, não somado): 100 com "10/5" -> 100*0.9*0.95 = 85.5.
 */
export const applyCascadeDiscount = (basePrice: number, discountString?: string): number => {
  if (!discountString || discountString.trim() === "") return basePrice;
  const discounts = discountString
    .split("/")
    .map((d) => parseFloat(d.trim().replace(",", ".")))
    .filter((d) => !isNaN(d));

  let currentPrice = basePrice;
  for (const d of discounts) {
    currentPrice = currentPrice * (1 - d / 100);
  }
  return currentPrice;
};
