import { formatCurrency } from "../utils/formatCurrency";
export default function PriceDisplay({ product, className = "" }) {
  const current = product.salePrice ?? product.price;
  return (
    <div className={`flex items-baseline gap-2 ${className}`}>
      <span className="text-lg font-black">{formatCurrency(current)}</span>
      {product.salePrice != null && product.salePrice < product.price && (
        <span className="text-sm text-zinc-400 line-through">
          {formatCurrency(product.price)}
        </span>
      )}
    </div>
  );
}
