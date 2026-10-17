import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCategoryProducts } from "../services/product.service";
import ProductCard from "../Components/ProductCard";
import LoadingSpinner from "../Components/LoadingSpinner";
import EmptyState from "../Components/EmptyState";
export default function CategoryProducts() {
  const { slug } = useParams();
  const [data, setData] = useState();
  useEffect(() => {
    getCategoryProducts(slug)
      .then((r) => setData(r.data))
      .catch(() => setData({ products: [] }));
  }, [slug]);
  if (!data) return <LoadingSpinner />;
  return (
    <main className="container-page py-12">
      <p className="eyebrow">Category</p>
      <h1 className="section-title capitalize">{slug.replaceAll("-", " ")}</h1>
      {data.products.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {data.products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState title="No products in this category" />
        </div>
      )}
    </main>
  );
}
