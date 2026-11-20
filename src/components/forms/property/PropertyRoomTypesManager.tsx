"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { Plus, Trash2, BedDouble, Upload, X } from "lucide-react";
import { RoomTypeFormItem } from "@/types/property-form";

export interface PropertyRoomTypesManagerProps {
  roomTypes: RoomTypeFormItem[];
  setRoomTypes: React.Dispatch<React.SetStateAction<RoomTypeFormItem[]>>;
  isEdit?: boolean;
}

export function PropertyRoomTypesManager({
  roomTypes,
  setRoomTypes,
  isEdit = false,
}: PropertyRoomTypesManagerProps) {
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const handleAddRoomType = () => {
    setRoomTypes((prev) => [
      ...prev,
      {
        name: "",
        price_per_month: "",
        security_deposit: "",
        available_rooms: "",
        facilities: "",
        specifications: "",
        image_url: "",
      },
    ]);
  };

  const handleRemoveRoomType = (index: number) => {
    setRoomTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateRoomType = (
    index: number,
    field: keyof RoomTypeFormItem,
    value: string
  ) => {
    setRoomTypes((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleRoomTypeFileChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      setRoomTypes((prev) =>
        prev.map((item, i) =>
          i === index
            ? { ...item, image_file: file, image_preview: preview }
            : item
        )
      );
    }
  };

  const handleRemoveRoomTypeImage = (index: number) => {
    setRoomTypes((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, image_file: null, image_preview: null, image_url: "" }
          : item
      )
    );
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]!.value = "";
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <BedDouble className="w-4 h-4 text-emerald-600" />
            <span>Varian Tipe Kamar (Opsional)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tambahkan tipe kamar berbeda jika kos ini memiliki variasi fasilitas atau harga.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddRoomType}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Tipe Kamar</span>
        </button>
      </div>

      {roomTypes.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40">
          <p className="text-xs text-slate-400">
            Belum ada tipe kamar tambahan. Kos akan menggunakan data kamar utama di atas.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {roomTypes.map((rt, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 space-y-3 relative group"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tipe Kamar #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveRoomType(idx)}
                  className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                  title="Hapus Tipe Kamar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Tipe Kamar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={rt.name}
                    onChange={(e) => handleUpdateRoomType(idx, "name", e.target.value)}
                    placeholder="cth: Kamar Deluxe AC"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Harga Sewa/Bulan (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={rt.price_per_month}
                    onChange={(e) => handleUpdateRoomType(idx, "price_per_month", e.target.value)}
                    placeholder="cth: 1500000"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Security Deposit (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={rt.security_deposit || ""}
                    onChange={(e) => handleUpdateRoomType(idx, "security_deposit", e.target.value)}
                    placeholder="cth: 500000"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sisa Kamar Tersedia <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={rt.available_rooms}
                    onChange={(e) => handleUpdateRoomType(idx, "available_rooms", e.target.value)}
                    placeholder="cth: 3"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fasilitas Tipe Kamar
                </label>
                <input
                  type="text"
                  value={rt.facilities || ""}
                  onChange={(e) => handleUpdateRoomType(idx, "facilities", e.target.value)}
                  placeholder="cth: Kasur King, Meja Belajar, Lemari, AC, Kamar Mandi Dalam"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Spesifikasi Kamar (Opsional)
                </label>
                <input
                  type="text"
                  value={rt.specifications || ""}
                  onChange={(e) => handleUpdateRoomType(idx, "specifications", e.target.value)}
                  placeholder="cth: Ukuran 3x4 meter, Listrik Pascabayar, Jendela Hadap Luar"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                />
              </div>

              {/* Upload Foto Tipe Kamar */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Foto Khusus Tipe Kamar
                </label>
                <div className="flex items-center gap-3">
                  {(rt.image_preview || rt.image_url) ? (
                    <div className="relative w-20 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 shrink-0">
                      <Image
                        src={rt.image_preview || rt.image_url || ""}
                        alt={rt.name || "Foto Tipe Kamar"}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveRoomTypeImage(idx)}
                        className="absolute top-1 right-1 p-0.5 bg-black/70 hover:bg-black text-white rounded-full transition-colors cursor-pointer"
                        title="Hapus Foto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : null}

                  <input
                    ref={(el) => {
                      fileInputRefs.current[idx] = el;
                    }}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleRoomTypeFileChange(idx, e)}
                    className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 dark:file:bg-emerald-950/50 file:text-emerald-700 dark:file:text-emerald-400 hover:file:bg-emerald-100 dark:hover:file:bg-emerald-900 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
