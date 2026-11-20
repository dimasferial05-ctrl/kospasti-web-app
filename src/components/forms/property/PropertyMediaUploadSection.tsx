"use client";

import React from "react";
import Image from "next/image";
import { Upload, X, Play, Image as ImageIcon, Star } from "lucide-react";
import { PropertyMediaItem } from "@/types/property-form";

export interface PropertyMediaUploadSectionProps {
  selectedFiles: File[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveSelectedFile: (index: number) => void;
  existingMedia?: PropertyMediaItem[];
  thumbnailUrl?: string | null;
  onSetThumbnail?: (url: string) => void;
  onDeleteExistingMedia?: (mediaId: string, url: string) => void;
  isSettingThumbnail?: boolean;
}

export function PropertyMediaUploadSection({
  selectedFiles,
  onFileChange,
  onRemoveSelectedFile,
  existingMedia = [],
  thumbnailUrl,
  onSetThumbnail,
  onDeleteExistingMedia,
  isSettingThumbnail = false,
}: PropertyMediaUploadSectionProps) {
  return (
    <div className="space-y-4 pt-2">
      <div>
        <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
          <Upload className="w-4 h-4 text-emerald-600" />
          <span>Upload Media Foto &amp; Video Kos</span>
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
          Pilih berkas foto (.jpg, .jpeg, .png, .webp) atau video singkat (.mp4, .webm) untuk galeri properti.
        </p>

        <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-2xl p-4 text-center bg-slate-50/50 dark:bg-slate-950/40 transition-colors">
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={onFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
            <Upload className="w-6 h-6 text-slate-400 group-hover:text-emerald-500" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Klik atau Seret Berkas ke Sini untuk Mengunggah
            </span>
            <span className="text-[11px] text-slate-400">
              Maksimal 10 MB per berkas. Format didukung: Foto &amp; Video
            </span>
          </div>
        </div>
      </div>

      {/* Selected New Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Berkas Baru Dipilih ({selectedFiles.length})
          </span>
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                {file.type.startsWith("video/") ? (
                  <Play className="w-3.5 h-3.5 text-blue-500" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                )}
                <span className="max-w-[150px] truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => onRemoveSelectedFile(idx)}
                  className="p-0.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Media Gallery (during edit) */}
      {existingMedia.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Media yang Sudah Tersimpan ({existingMedia.length})
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {existingMedia.map((m) => {
              const isThumb = thumbnailUrl === m.url;
              return (
                <div
                  key={m.id || m.url}
                  className={`relative aspect-video rounded-xl overflow-hidden border ${
                    isThumb
                      ? "border-emerald-500 ring-2 ring-emerald-500/30"
                      : "border-slate-200 dark:border-slate-800"
                  } bg-slate-100 dark:bg-slate-800 group`}
                >
                  {m.type === "VIDEO" ? (
                    <video
                      src={m.url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <Image
                      src={m.url}
                      alt="Media Galeri"
                      fill
                      className="object-cover"
                    />
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                    {onSetThumbnail && !isThumb && (
                      <button
                        type="button"
                        onClick={() => onSetThumbnail(m.url)}
                        disabled={isSettingThumbnail}
                        className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                        title="Jadikan Foto Utama"
                      >
                        <Star className="w-3 h-3" />
                      </button>
                    )}
                    {onDeleteExistingMedia && m.id && (
                      <button
                        type="button"
                        onClick={() => onDeleteExistingMedia(m.id!, m.url)}
                        className="p-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold shadow-sm transition-colors cursor-pointer"
                        title="Hapus Media"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {isThumb && (
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                      <Star className="w-2.5 h-2.5 fill-white" />
                      <span>Utama</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
