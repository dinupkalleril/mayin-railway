"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import { BrandInfo } from "../types";

interface BrandContextType {
  brands: BrandInfo[];
  selectedBrand: BrandInfo | null;
  loading: boolean;
  error: string | null;
  selectBrand: (brandId: string) => void;
  fetchBrands: () => Promise<void>;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

interface BrandProviderProps {
  children: ReactNode;
}

export const BrandProvider = ({ children }: BrandProviderProps) => {
  const [brands, setBrands] = useState<BrandInfo[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<BrandInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrands = async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        // This case should ideally not be hit if layout correctly gates the page
        console.warn("No user ID found, can't fetch brands.");
        setLoading(false);
        return;
      }
      const response = await fetch(`/api/brand/user/${userId}`);
      // Treat 404 from older backends as "no brands yet" (not an error)
      if (response.status === 404) {
        setBrands([]);
        setSelectedBrand(null);
        return;
      }
      if (!response.ok) {
        // Capture error from backend without duplicating prefixes
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        const msg = errorData.error || errorData.message || response.statusText;
        throw new Error(msg);
      }
      const data = await response.json();
      const fetchedBrands: BrandInfo[] = data.brands.map((b: any) => ({
        id: b.id,
        brandName: b.brand_name,
        tagline: b.tagline,
        productDetails: b.product_details,
        websiteUrl: b.website_url,
        location: b.location,
      }));
      setBrands(fetchedBrands || []);

      if (
        !selectedBrand ||
        !fetchedBrands.some((brand: BrandInfo) => brand.id === selectedBrand.id)
      ) {
        setSelectedBrand(
          fetchedBrands && fetchedBrands.length > 0 ? fetchedBrands[0] : null
        );
      }
    } catch (err: any) {
      setError(err.message);
      console.error("Failed to fetch brands:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const selectBrand = (brandId: string) => {
    const brand = brands.find((b) => b.id === brandId);
    setSelectedBrand(brand || null);
  };

  return (
    <BrandContext.Provider
      value={{ brands, selectedBrand, loading, error, selectBrand, fetchBrands }}
    >
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error("useBrand must be used within a BrandProvider");
  }
  return context;
};
