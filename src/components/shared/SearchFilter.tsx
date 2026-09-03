"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";

export interface FilterValues {
  name: string;
  maxPrice: string;
  genderType: string;
}

export interface SearchFilterProps {
  onSearch: (filters: FilterValues) => void;
  initialValues?: Partial<FilterValues>;
}

export function SearchFilter({ onSearch, initialValues }: SearchFilterProps) {
  const [name, setName] = useState(initialValues?.name || "");
  const [maxPrice, setMaxPrice] = useState(initialValues?.maxPrice || "");
  const [genderType, setGenderType] = useState(initialValues?.genderType || "");

  const handleSearch = () => {
    onSearch({ name, maxPrice, genderType });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3"
    >
      {/* Search Input by Name */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Cari nama kos..."
          aria-label="Cari nama kos"
          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
        />
      </div>

      {/* 2-Column Grid: Price & Gender */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="filter-price"
            className="block text-xs font-medium text-slate-600 mb-1"
          >
            Batas Harga
          </label>
          <select
            id="filter-price"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          >
            <option value="">Semua Harga</option>
            <option value="500000">Max Rp 500.000</option>
            <option value="1000000">Max Rp 1.000.000</option>
            <option value="2000000">Max Rp 2.000.000</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="filter-gender"
            className="block text-xs font-medium text-slate-600 mb-1"
          >
            Tipe Kos
          </label>
          <select
            id="filter-gender"
            value={genderType}
            onChange={(e) => setGenderType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          >
            <option value="">Semua Tipe</option>
            <option value="PUTRA">Khusus Putra</option>
            <option value="PUTRI">Khusus Putri</option>
            <option value="CAMPUR">Campur</option>
          </select>
        </div>
      </div>

      {/* Search Button */}
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
      >
        <Search className="w-4 h-4" />
        <span>Cari Kos</span>
      </button>
    </form>
  );
}

export default SearchFilter;
