"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SearchFilter, FilterValues } from "@/components/shared/SearchFilter";
import { KosPropertyCard } from "@/components/shared/KosPropertyCard";
import { Loader2, AlertCircle, SearchX } from "lucide-react";

interface PropertyItem {
  id: string;
  name: string;
  price_per_month: number;
  available_rooms: number;
  gender_type: string;
  facilities: string;
  image_url?: string | null;
  last_updated: string;
  updated_at?: string;
  owner?: {
    name: string;
  };
}

export default function Home() {
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = useCallback(async (filters?: FilterValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.name && filters.name.trim()) {
        params.append("name", filters.name.trim());
      }
      if (filters?.maxPrice && filters.maxPrice.trim()) {
        params.append("maxPrice", filters.maxPrice.trim());
      }
      if (filters?.genderType && filters.genderType.trim()) {
        params.append("genderType", filters.genderType.trim());
      }

      const queryString = params.toString();
      const url = queryString
        ? `/api/properties?${queryString}`
        : "/api/properties";
      const res = await fetch(url);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setProperties(json.data);
      } else {
        setError(json.error || "Gagal mengambil data properti");
      }
    } catch (err) {
      console.error("Fetch properties error:", err);
      setError("Terjadi kesalahan saat memuat data kos");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialProperties() {
      try {
        const res = await fetch("/api/properties");
        const json = await res.json();

        if (isMounted) {
          if (json.success && Array.isArray(json.data)) {
            setProperties(json.data);
          } else {
            setError(json.error || "Gagal mengambil data properti");
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("Fetch properties error:", err);
          setError("Terjadi kesalahan saat memuat data kos");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialProperties();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Search & Filter Component */}
      <SearchFilter onSearch={fetchProperties} />

      {/* Property List Section */}
      <div className="flex flex-col gap-4">
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium">Memuat daftar kos...</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 flex items-center gap-2 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!isLoading && !error && properties.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-slate-200 border-dashed mt-4">
            <SearchX className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-base font-semibold text-slate-800 mb-1">
              Kos Tidak Ditemukan
            </h3>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              Maaf, tidak ada kos yang sesuai dengan kriteria pencarian atau filter Anda. Silakan coba atur ulang filter pencarian.
            </p>
          </div>
        )}

        {!isLoading && !error && properties.length > 0 && (
          <div className="flex flex-col gap-4">
            {properties.map((property) => (
              <KosPropertyCard
                key={property.id}
                name={property.name}
                price={property.price_per_month}
                availableRooms={property.available_rooms}
                genderType={property.gender_type}
                facilities={property.facilities}
                imageUrl={property.image_url}
                ownerName={property.owner?.name || "Pemilik Kos"}
                lastUpdated={
                  property.last_updated ||
                  property.updated_at ||
                  new Date().toISOString()
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
