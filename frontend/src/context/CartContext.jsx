import { createContext, useCallback, useEffect, useState } from 'react';
import * as cartApi from '../services/cart.service';
export const CartContext = createContext(null);
export function CartProvider({ children }) { const [cart, setCart] = useState({ items: [], subtotal: 0, total: 0 }); const [loading, setLoading] = useState(false);
  const refresh = useCallback(async () => { if (!localStorage.getItem('qb_guest_cart_token')) return; setLoading(true); try { const r = await cartApi.getCart(); setCart(r.data.cart); } catch { localStorage.removeItem('qb_guest_cart_token'); setCart({ items: [], subtotal: 0, total: 0 }); } finally { setLoading(false); } }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const mutate = async (operation) => { const r = await operation(); setCart(r.data.cart); return r; };
  return <CartContext.Provider value={{ cart, loading, refresh, addItem: (data) => mutate(() => cartApi.addCartItem(data)), updateItem: (id, data) => mutate(() => cartApi.updateCartItem(id, data)), removeItem: (id) => mutate(() => cartApi.removeCartItem(id)), clear: () => mutate(cartApi.clearCart), count: cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0 }}>{children}</CartContext.Provider>; }
