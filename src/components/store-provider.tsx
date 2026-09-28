"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { readCart } from "@/lib/cart";
import type { CartItem, Catalog } from "@/lib/types";

const CART_KEY = "rancing-mau:cart:v1";
const BRANCH_KEY = "rancing-mau:branch";
const EVENT = "rancing-mau:storage";
function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(EVENT, listener);
  };
}
const memory = new Map<string, string>();
function read(key: string) {
  try {
    return localStorage.getItem(key) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}
function write(key: string, value: string) {
  memory.set(key, value);
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Cart remains usable in memory if storage is blocked. */
  }
  window.dispatchEvent(new Event(EVENT));
}
type Store = Catalog & {
  cart: CartItem[];
  count: number;
  branchId: string;
  setBranchId: (id: string) => void;
  add: (id: string, quantity?: number) => void;
  update: (id: string, quantity: number) => void;
  clear: () => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  notice: string;
};
const StoreContext = createContext<Store | null>(null);

export function StoreProvider({
  catalog,
  children,
}: {
  catalog: Catalog;
  children: ReactNode;
}) {
  const rawCart = useSyncExternalStore(
    subscribe,
    () => read(CART_KEY),
    () => null,
  );
  const rawBranch = useSyncExternalStore(
    subscribe,
    () => read(BRANCH_KEY),
    () => null,
  );
  const cart = useMemo(() => readCart(rawCart), [rawCart]);
  const branchId = catalog.branches.some((branch) => branch.id === rawBranch)
    ? rawBranch!
    : "";
  const [cartOpen, setCartOpen] = useState(false);
  const [notice, setNotice] = useState("");
  function persist(items: CartItem[]) {
    write(CART_KEY, JSON.stringify({ version: 1, items }));
  }
  function add(id: string, quantity = 1) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return;
    const product = catalog.products.find((product) => product.id === id);
    if (!product || product.general_status === "out_of_stock") return;
    const current = readCart(read(CART_KEY));
    const found = current.find((item) => item.product_id === id);
    if (!found && current.length >= 100) {
      setNotice("El carrito admite hasta 100 productos diferentes.");
      return;
    }
    persist(
      found
        ? current.map((item) =>
            item.product_id === id
              ? { ...item, quantity: Math.min(99, item.quantity + quantity) }
              : item,
          )
        : [...current, { product_id: id, quantity }],
    );
    setNotice(`${product.name} agregado al carrito.`);
  }
  function update(id: string, quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99) return;
    persist(
      readCart(read(CART_KEY))
        .map((item) => (item.product_id === id ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0),
    );
  }
  return (
    <StoreContext.Provider
      value={{
        ...catalog,
        cart,
        count: cart.reduce((sum, item) => sum + item.quantity, 0),
        branchId,
        setBranchId: (id) => write(BRANCH_KEY, id),
        add,
        update,
        clear: () => persist([]),
        cartOpen,
        setCartOpen,
        notice,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("Falta StoreProvider.");
  return context;
}
