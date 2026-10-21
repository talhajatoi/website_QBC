import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Boxes, FolderTree, LayoutDashboard, LogOut, MessageSquare, ReceiptText, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useBusiness } from '../hooks/useBusiness';

const links = [
  [LayoutDashboard, 'Dashboard', '/admin/dashboard'],
  [Boxes, 'Products', '/admin/products'],
  [FolderTree, 'Categories', '/admin/categories'],
  [ReceiptText, 'Orders', '/admin/orders'],
  [MessageSquare, 'Reviews', '/admin/reviews'],
  [Settings, 'Settings', '/admin/settings'],
];

export default function AdminLayout() {
  const { admin, signOut } = useAuth();
  const { business } = useBusiness();
  const nav = useNavigate();
  const exit = async () => {
    await signOut();
    nav('/admin/login');
  };

  return (
    <div className="min-h-screen bg-zinc-100 md:grid md:grid-cols-[250px_1fr]">
      <aside className="bg-zinc-950 px-5 py-6 text-white">
        <NavLink to="/" className="font-display text-xl font-black">
          {business.storeName || 'Store'}
        </NavLink>
        <p className="mt-2 text-xs text-zinc-400">Administrator workspace</p>
        <nav className="mt-8 flex gap-1 overflow-x-auto md:block">
          {links.map(([Icon, label, to]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold ${
                  isActive
                    ? 'bg-brand text-zinc-950'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 p-5 sm:p-8">
        <header className="mb-8 flex flex-wrap items-center justify-end gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm">
          <div className="min-w-0 text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Store Administrator
            </p>
            <p className="truncate text-sm font-bold text-zinc-900">{admin?.name}</p>
          </div>
          <button
            onClick={exit}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-bold text-zinc-700 hover:bg-zinc-100"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
