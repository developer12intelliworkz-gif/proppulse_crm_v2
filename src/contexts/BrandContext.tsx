import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchMyBrands,
  setActiveBrand,
  type UserBrand,
} from "@/utils/onboarding";

const ACTIVE_BRAND_STORAGE_KEY = "active_brand_id";

interface BrandContextValue {
  brands: UserBrand[];
  activeBrand: UserBrand | null;
  loading: boolean;
  refreshBrands: () => Promise<void>;
  switchBrand: (brandId: string) => Promise<void>;
}

const BrandContext = createContext<BrandContextValue | undefined>(undefined);

export const BrandProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const [brands, setBrands] = useState<UserBrand[]>([]);
  const [activeBrandId, setActiveBrandId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickActiveBrand = useCallback((list: UserBrand[]) => {
    if (list.length === 0) return null;
    const stored = localStorage.getItem(ACTIVE_BRAND_STORAGE_KEY);
    const fromStorage = stored ? list.find((b) => b.id === stored) : null;
    if (fromStorage) return fromStorage;
    return list.find((b) => b.is_primary) || list[0];
  }, []);

  const refreshBrands = useCallback(async () => {
    if (!isAuthenticated) {
      setBrands([]);
      setActiveBrandId(null);
      return;
    }

    setLoading(true);
    try {
      const list = await fetchMyBrands();
      setBrands(list);
      const active = pickActiveBrand(list);
      setActiveBrandId(active?.id ?? null);
      if (active?.id) {
        localStorage.setItem(ACTIVE_BRAND_STORAGE_KEY, active.id);
      }
    } catch (error) {
      console.error("Failed to load user brands:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, pickActiveBrand]);

  useEffect(() => {
    void refreshBrands();
  }, [refreshBrands, user?.id]);

  const switchBrand = useCallback(
    async (brandId: string) => {
      const updated = await setActiveBrand(brandId);
      setBrands(updated);
      setActiveBrandId(brandId);
      localStorage.setItem(ACTIVE_BRAND_STORAGE_KEY, brandId);
    },
    [],
  );

  const activeBrand = useMemo(
    () => brands.find((b) => b.id === activeBrandId) ?? pickActiveBrand(brands),
    [brands, activeBrandId, pickActiveBrand],
  );

  const value = useMemo(
    () => ({
      brands,
      activeBrand,
      loading,
      refreshBrands,
      switchBrand,
    }),
    [brands, activeBrand, loading, refreshBrands, switchBrand],
  );

  return (
    <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
  );
};

export const useBrand = () => {
  const ctx = useContext(BrandContext);
  if (!ctx) {
    throw new Error("useBrand must be used within BrandProvider");
  }
  return ctx;
};
