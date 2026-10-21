import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Bike, MessageCircle, ShieldCheck } from "lucide-react";
import { getCategories } from "../services/category.service";
import { getFeaturedProducts } from "../services/product.service";
import ProductCard from "../Components/ProductCard";
import AnimatedBikeHero from "../Components/AnimatedBikeHero";
import CategoryShowcase from "../Components/CategoryShowcase";
import LoadingSpinner from "../Components/LoadingSpinner";
import EmptyState from "../Components/EmptyState";
import { useBusiness } from "../hooks/useBusiness";
export default function Home() {
  const { business } = useBusiness();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([getCategories(), getFeaturedProducts()])
      .then(([c, p]) => {
        setCategories(c.data.categories);
        setProducts(p.data.products);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return (
    <>
      <section className="home-hero relative isolate overflow-hidden bg-zinc-950 text-white">
        <AnimatedBikeHero />
        <div className="container-page relative z-10 flex min-h-[min(620px,75svh)] items-center py-16 sm:py-20">
          <motion.div
            className="max-w-3xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <p className="mb-4 text-sm font-black tracking-[.2em] text-brand">
              {business.address || "BUILT FOR EVERY JOURNEY"}
            </p>
            <h1 className="font-display text-[clamp(2.5rem,9vw,4.5rem)] font-black leading-none sm:text-7xl">
              RIDE YOUR WAY.
              <br />
              <span className="text-brand">OWN THE ROAD.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">
              Find your next ride with {business.storeName}. Quality bicycles built
              for everyday journeys and weekend adventures.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="btn-primary" to="/products">
                Shop bicycles <ArrowRight className="h-4 w-4" />
              </Link>
              <Link className="btn-secondary-dark" to="/categories">
                Explore categories
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      <section className="container-page py-18">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Find your style</p>
            <h2 className="section-title">Explore categories</h2>
          </div>
          <Link className="link-arrow" to="/categories">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {loading ? (
          <LoadingSpinner />
        ) : categories.length ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.slice(0, 6).map((category) => (
              <CategoryShowcase key={category._id} category={category} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Categories are coming soon"
            text="The store has not published categories yet."
          />
        )}
      </section>
      <section className="bg-[#f7f7f5]">
        <div className="container-page py-18">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Curated rides</p>
              <h2 className="section-title">Featured bicycles</h2>
            </div>
            <Link className="link-arrow" to="/products">
              Shop all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {loading ? (
            <LoadingSpinner />
          ) : products.length ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No featured bicycles yet"
              text="Browse the full catalogue when products are available."
              action={
                <Link className="btn-primary" to="/products">
                  Browse shop
                </Link>
              }
            />
          )}
        </div>
      </section>
      <section className="container-page grid gap-5 py-18 md:grid-cols-3">
        {[
          [
            Bike,
            "Quality rides",
            "Browse current stock and product specifications before choosing your next bicycle.",
          ],
          [
            MessageCircle,
            "WhatsApp ordering",
            "Create an order online, then manually confirm it with the store on WhatsApp.",
          ],
          [
            ShieldCheck,
            "Clear order status",
            "Your order stays pending until an administrator confirms it.",
          ],
        ].map(([Icon, title, text]) => (
          <article
            key={title}
            className="feature-card rounded-3xl border p-7"
          >
            <span className="feature-card-icon"><Icon className="h-6 w-6" /></span>
            <h3 className="mt-5 text-xl font-black">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-300">{text}</p>
          </article>
        ))}
      </section>
    </>
  );
}
