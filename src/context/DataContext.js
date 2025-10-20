import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { read, write, nowId } from "../utils/helpers";
import { LS } from "../utils/constants";

const DataCtx = createContext(null);

export const useData = () => useContext(DataCtx);

function seedIfEmpty() {
  let cur = read(LS.listings, null);
  if (cur && cur.length) return cur;
  const demo = [
    {
      id: nowId() + 1,
      category: "Vehículo",
      name: "Toyota Corolla 2020",
      brand: "Toyota",
      model: "Corolla",
      location: "Caracas",
      price: 9500,
      images: [
        "/images/demo/car1.jpg",
        "/images/demo/car2.jpg",
        "/images/demo/car3.jpg",
      ],
      description:
        "Único dueño, mantenimientos al día. Tapicería impecable, cauchos nuevos.",
      ownerEmail: "ana@demo.com",
      createdAt: new Date().toISOString(),
      status: "active",
      plan: "premium",
    },
    {
      id: nowId() + 2,
      category: "Celular",
      name: "iPhone 13 128GB",
      brand: "Apple",
      model: "iPhone 13",
      location: "Maracaibo",
      price: 650,
      images: ["/images/demo/iphone13pro.jpg", "/images/demo/phone2.jpg"],
      description: "Batería 90% — excelente estado. Incluye caja y cargador.",
      ownerEmail: "luis@demo.com",
      createdAt: new Date().toISOString(),
      status: "active",
      plan: "plus",
    },
  ];
  write(LS.listings, demo);
  return demo;
}

export function DataProvider({ children }) {
  const [items, setItems] = useState(() => seedIfEmpty());
  const [favs, setFavs] = useState(() => new Set(read(LS.favs, [])));
  const [searches, setSearches] = useState(() => read(LS.searches, []));

  useEffect(() => {
    write(LS.listings, items);
  }, [items]);

  useEffect(() => {
    write(LS.favs, Array.from(favs));
  }, [favs]);

  useEffect(() => {
    write(LS.searches, searches);
  }, [searches]);

  const create = useCallback(
    (rec) =>
      setItems((p) => [
        {
          ...rec,
          id: nowId(),
          createdAt: new Date().toISOString(),
          status: rec?.status || "active",
          plan: rec?.plan || "gratis",
        },
        ...p,
      ]),
    [],
  );

  const updateStatus = useCallback((id, status) => {
    setItems((prev) =>
      prev.map((item) =>
        String(item.id) === String(id) ? { ...item, status } : item,
      ),
    );
  }, []);

  const byCategory = useCallback(
    (cat) => items.filter((x) => x.category === cat),
    [items],
  );

  const byId = useCallback(
    (id) => items.find((x) => String(x.id) === String(id)),
    [items],
  );

  const byOwner = useCallback(
    (email) => items.filter((x) => x.ownerEmail === email),
    [items],
  );

  const isFav = useCallback((id) => favs.has(String(id)), [favs]);

  const toggleFav = useCallback(
    (id) =>
      setFavs((prev) => {
        const n = new Set(prev);
        const s = String(id);
        n.has(s) ? n.delete(s) : n.add(s);
        return n;
      }),
    [],
  );

  const favItems = useMemo(
    () => items.filter((x) => favs.has(String(x.id))),
    [items, favs],
  );

  const trackSearch = useCallback((term) => {
    setSearches((p) => {
      const t = term.trim().toLowerCase();
      const updated = [t, ...p.filter((s) => s !== t)].slice(0, 10);
      return updated;
    });
  }, []);

  const value = useMemo(
    () => ({
      items,
      setItems,
      create,
      byCategory,
      byId,
      byOwner,
      favs,
      isFav,
      toggleFav,
      favItems,
      searches,
      trackSearch,
      updateStatus,
    }),
    [
      items,
      create,
      byCategory,
      byId,
      byOwner,
      favs,
      isFav,
      toggleFav,
      favItems,
      searches,
      trackSearch,
      updateStatus,
    ],
  );

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}
