"use client";

import React from "react";
import {
  Camera,
  Play,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Tv,
  Home,
  X,
} from "lucide-react";
import { PropertyMediaItem } from "@/types/property-form";

export interface PropertyGalleryViewerProps {
  propertyName: string;
  photoList: PropertyMediaItem[];
  activeIndex: number;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
  mediaMode: "PHOTO" | "VIDEO";
  setMediaMode: React.Dispatch<React.SetStateAction<"PHOTO" | "VIDEO">>;
  youtubeEmbedUrl?: string | null;
  nativeVideoUrl?: string | null;
  hasVideo?: boolean;
  isLightboxOpen: boolean;
  lightboxIndex: number;
  setLightboxIndex?: React.Dispatch<React.SetStateAction<number>>;
  openLightbox: (index: number) => void;
  closeLightbox: () => void;
  prevLightbox: () => void;
  nextLightbox: () => void;
  prevSlide: () => void;
  nextSlide: () => void;
}

export function PropertyGalleryViewer({
  propertyName,
  photoList,
  activeIndex,
  setActiveIndex,
  mediaMode,
  setMediaMode,
  youtubeEmbedUrl,
  nativeVideoUrl,
  hasVideo = false,
  isLightboxOpen,
  lightboxIndex,
  setLightboxIndex,
  openLightbox,
  closeLightbox,
  prevLightbox,
  nextLightbox,
  prevSlide,
  nextSlide,
}: PropertyGalleryViewerProps) {
  const currentPhoto = photoList[activeIndex] || null;

  return (
    <div id="section-media" className="w-full lg:mt-6">
      <div className="w-full bg-slate-950 lg:rounded-3xl overflow-hidden shadow-md flex flex-col">
        {/* Header Switcher Tab: Foto vs Video */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setMediaMode("PHOTO")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mediaMode === "PHOTO"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Foto ({photoList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setMediaMode("VIDEO")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mediaMode === "VIDEO"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Video {hasVideo ? "Tour" : ""}</span>
            </button>
          </div>

          {mediaMode === "PHOTO" && photoList.length > 0 && (
            <button
              type="button"
              onClick={() => openLightbox(activeIndex)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/80 transition-colors cursor-pointer"
              title="Buka gambar fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Buka Fullscreen</span>
            </button>
          )}
        </div>

        {/* Media Player / Viewer */}
        <div className="w-full h-80 sm:h-96 lg:h-[460px] relative bg-black flex items-center justify-center overflow-hidden">
          {mediaMode === "VIDEO" ? (
            <div className="w-full h-full flex items-center justify-center bg-black">
              {youtubeEmbedUrl ? (
                <iframe
                  src={youtubeEmbedUrl}
                  title={`Video Tour - ${propertyName}`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : nativeVideoUrl ? (
                <video
                  src={nativeVideoUrl}
                  controls
                  playsInline
                  className="w-full h-full object-contain bg-black"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-3 p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 border border-slate-800">
                    <Tv className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-200">
                      Belum Ada Video Tour
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm mt-0.5">
                      Pemilik kos belum menambahkan link video YouTube untuk kos ini. Silakan lihat galeri foto di tab Foto.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMediaMode("PHOTO")}
                    className="mt-1 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Beralih ke Foto
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div
              className="w-full h-full relative cursor-pointer group flex items-center justify-center"
              onClick={() => openLightbox(activeIndex)}
            >
              {currentPhoto ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={currentPhoto.url}
                  alt={`${propertyName} - Foto ${activeIndex + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500 gap-2">
                  <Home className="w-12 h-12 stroke-[1.5]" />
                  <span className="text-xs">Foto tidak tersedia</span>
                </div>
              )}

              {/* Overlay Hint Klik Fullscreen */}
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 backdrop-blur-xs text-white text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                  <Maximize2 className="w-4 h-4" />
                  <span>Klik untuk melihat Fullscreen &amp; Geser</span>
                </div>
              </div>

              {/* Tombol Navigasi Kiri / Kanan */}
              {photoList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      prevSlide();
                    }}
                    aria-label="Foto sebelumnya"
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white flex items-center justify-center backdrop-blur-xs transition-all shadow-md cursor-pointer z-10"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      nextSlide();
                    }}
                    aria-label="Foto berikutnya"
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white flex items-center justify-center backdrop-blur-xs transition-all shadow-md cursor-pointer z-10"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>

                  <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/75 backdrop-blur-xs text-white text-xs font-bold rounded-full flex items-center gap-1.5 z-10 shadow-md">
                    <Camera className="w-3.5 h-3.5" />
                    <span>
                      {activeIndex + 1} / {photoList.length}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Thumbnails Bar (Hanya di mode PHOTO) */}
        {mediaMode === "PHOTO" && photoList.length > 1 && (
          <div className="bg-slate-950 border-t border-slate-900 p-3 flex items-center gap-2.5 overflow-x-auto scrollbar-none">
            {photoList.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-label={`Pilih foto ${idx + 1}`}
                className={`relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                  activeIndex === idx
                    ? "border-emerald-500 ring-2 ring-emerald-500/50 opacity-100 scale-102"
                    : "border-slate-800 opacity-60 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal Fullscreen */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col justify-between animate-in fade-in duration-200 backdrop-blur-sm select-none">
          {/* Lightbox Header */}
          <div className="px-4 py-3 flex items-center justify-between text-white z-10 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span className="text-xs sm:text-sm font-semibold">
                Foto {lightboxIndex + 1} dari {photoList.length}
              </span>
            </div>
            <button
              type="button"
              onClick={closeLightbox}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Tutup Fullscreen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lightbox Main Image Viewer */}
          <div className="relative flex-1 flex items-center justify-center p-4">
            {photoList[lightboxIndex] && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={photoList[lightboxIndex].url}
                alt={`${propertyName} - Foto ${lightboxIndex + 1}`}
                className="max-h-[75vh] sm:max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl transition-all duration-200"
              />
            )}

            {/* Prev / Next Arrows */}
            {photoList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevLightbox}
                  aria-label="Foto sebelumnya"
                  className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-lg cursor-pointer"
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>
                <button
                  type="button"
                  onClick={nextLightbox}
                  aria-label="Foto berikutnya"
                  className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-lg cursor-pointer"
                >
                  <ChevronRight className="w-7 h-7" />
                </button>
              </>
            )}
          </div>

          {/* Lightbox Bottom Thumbnails Slider */}
          {photoList.length > 1 && (
            <div className="bg-black/80 border-t border-white/10 p-3 flex items-center justify-center gap-2 overflow-x-auto scrollbar-none z-10">
              {photoList.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    setLightboxIndex ? setLightboxIndex(idx) : openLightbox(idx)
                  }
                  className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                    lightboxIndex === idx
                      ? "border-emerald-500 scale-105 opacity-100 ring-2 ring-emerald-500/50"
                      : "border-white/20 opacity-40 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={`Thumb ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
