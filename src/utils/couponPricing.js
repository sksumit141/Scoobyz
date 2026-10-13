export const REGULAR_PRICE_CATEGORY = 'regular_price';
export const DISCOUNTED_PRICE_CATEGORY = 'discounted_price';

const number = value => Number(value) || 0;

export function hasCatalogueDiscount(item) {
  if (!item) return false;
  const currentPrice = number(item.basePrice || item.price);
  const originalPrice = number(item.originalPrice);
  return item.pricing?.discountEnabled === true
    || (originalPrice > 0 && currentPrice > 0 && originalPrice > currentPrice);
}

export function getCouponPriceCategory({ serviceDiscountPercent, item }) {
  return number(serviceDiscountPercent) > 0 || hasCatalogueDiscount(item)
    ? DISCOUNTED_PRICE_CATEGORY
    : REGULAR_PRICE_CATEGORY;
}
