import { useEffect, useState } from "react";
import { getCategories } from "../services/category.service";
import CategoryShowcase from "../Components/CategoryShowcase";
import LoadingSpinner from "../Components/LoadingSpinner";
import EmptyState from "../Components/EmptyState";
export default function Categories() {
  const [categories, setCategories] = useState(null);
  useEffect(() => {
    getCategories()
      .then((r) => setCategories(r.data.categories))
      .catch(() => setCategories([]));
  }, []);
  if (!categories) return <LoadingSpinner />;
  return (
    <main className="container-page py-12">
      <p className="eyebrow">Shop by purpose</p>
      <h1 className="section-title">Bicycle categories</h1>
      {categories.length ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryShowcase key={category._id} category={category} />
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState title="No categories published" />
        </div>
      )}
    </main>
  );
}
