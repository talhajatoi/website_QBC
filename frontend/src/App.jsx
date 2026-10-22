import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { lazy, Suspense, useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { BusinessProvider } from "./context/BusinessContext";
import { useBusiness } from "./hooks/useBusiness";
import AnnouncementBar from "./Components/AnnouncementBar";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import ProtectedRoute from "./Components/ProtectedRoute";
import AdminLayout from "./Components/AdminLayout";
import ErrorBoundary from "./Components/ErrorBoundary";
import ApiStatusNotice from "./Components/ApiStatusNotice";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Categories from "./pages/Categories";
import CategoryProducts from "./pages/CategoryProducts";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import OrderTracking from "./pages/OrderTracking";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Reviews from "./pages/Reviews";
import NotFound from "./pages/NotFound";
const Home = lazy(() => import("./pages/Home"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const ProductsManagement = lazy(
  () => import("./pages/admin/ProductsManagement"),
);
const ProductForm = lazy(() => import("./pages/admin/ProductForm"));
const CategoriesManagement = lazy(
  () => import("./pages/admin/CategoriesManagement"),
);
const Orders = lazy(() => import("./pages/admin/Orders"));
const OrderDetails = lazy(() => import("./pages/admin/OrderDetails"));
const ReviewsManagement = lazy(() => import("./pages/admin/ReviewsManagement"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

function PublicLayout() {
  return (
    <>
      <AnnouncementBar />
      <ApiStatusNotice />
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}
function PageTitle() {
  const location = useLocation();
  const { business } = useBusiness();
  const storeName = business.storeName || "Store";
  useEffect(() => {
    document.title = location.pathname.startsWith("/admin")
      ? `Admin · ${storeName}`
      : storeName;
  }, [location.pathname, storeName]);
  return null;
}
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <BusinessProvider>
            <PageTitle />
            <ScrollToTop />
            <ErrorBoundary>
              <Suspense
                fallback={
                  <div className="grid min-h-screen place-items-center text-sm font-bold">
                    Loading workspace…
                  </div>
                }
              >
                <Routes>
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:slug" element={<ProductDetails />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route
                    path="/categories/:slug"
                    element={<CategoryProducts />}
                  />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route
                    path="/order-success/:orderNumber"
                    element={<OrderSuccess />}
                  />
                  <Route
                    path="/order-tracking/:orderNumber"
                    element={<OrderTracking />}
                  />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/reviews" element={<Reviews />} />
                </Route>
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="products" element={<ProductsManagement />} />
                  <Route path="products/new" element={<ProductForm />} />
                  <Route path="products/edit/:id" element={<ProductForm />} />
                  <Route path="categories" element={<CategoriesManagement />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="orders/:id" element={<OrderDetails />} />
                  <Route path="reviews" element={<ReviewsManagement />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
                <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
            <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
          </BusinessProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
export default App;
