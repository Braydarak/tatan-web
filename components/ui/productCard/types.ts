export interface ProductCardProps {
  id?: string | number;
  imageSrc?: string;
  title?: string;
  originalPrice?: number;
  discountedPrice?: number;
  discountPercentage?: number;
  installments?: number;
  installmentPrice?: number;
  taxFreePrice?: number;
  showPointsBadge?: boolean;
  colorHex?: string;
  productUrl?: string;
}