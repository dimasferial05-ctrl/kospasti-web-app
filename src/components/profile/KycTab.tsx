"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  ShieldCheck,
  AlertTriangle,
  Upload,
  Camera,
  Loader2,
  CheckCircle2,
  FileText,
  Building,
  RefreshCw,
  Info,
  Lock,
} from "lucide-react";

interface KYCVerificationData {
  id: string;
  document_type: string;
  document_photo_url: string;
  extracted_name?: string | null;
  extracted_id_number?: string | null;
  masked_id_number?: string | null;
  extracted_institution?: string | null;
  match_confidence: number;
  verification_status: "VERIFIED" | "REJECTED" | "PENDING";
  rejection_reason?: string | null;
  verified_at?: string | null;
  created_at: string;
}

export function KycTab({
  userName,
  onVerificationSuccess,
}: {
  userName: string;
  onVerificationSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [verification, setVerification] = useState<KYCVerificationData | null>(null);

  // Form State
  const [documentType, setDocumentType] = useState<"KTP" | "KTM">("KTP");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchKycStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/kyc");
      const data = await res.json();
      if (data.success) {
        setIsVerified(Boolean(data.is_identity_verified));
        setVerification(data.verification);
      }
    } catch (err) {
      console.error("Gagal memuat status KYC:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycStatus();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg("Silakan pilih file foto kartu identitas Anda.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append("document_type", documentType);
      formData.append("document_file", file);

      const res = await fetch("/api/user/kyc", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Verifikasi identitas gagal. Silakan coba kembali.");
        if (data.verification) {
          setVerification(data.verification);
        }
        return;
      }

      setSuccessMsg(data.message || "Identitas Anda berhasil diverifikasi!");
      setIsVerified(true);
      setVerification(data.verification);
      if (onVerificationSuccess) onVerificationSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        <p className="text-xs font-semibold text-slate-500">Memeriksa status verifikasi identitas...</p>
      </div>
    );
  }

  // 1. Tampilan jika sudah terverifikasi
  if (isVerified && verification?.verification_status === "VERIFIED") {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Identitas Penyewa Terverifikasi
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Resmi
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Profil Anda telah tervalidasi dengan data kartu identitas resmi ({verification.document_type}).
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
            <span className="text-slate-500">Tipe Dokumen:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {verification.document_type === "KTP" ? "KTP (Kartu Tanda Penduduk)" : "KTM (Kartu Tanda Mahasiswa)"}
            </span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
            <span className="text-slate-500">Nama Terverifikasi:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {verification.extracted_name || userName}
            </span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
            <span className="text-slate-500">
              {verification.document_type === "KTP" ? "Nomor NIK (Disamarkan):" : "Nomor NIM (Disamarkan):"}
            </span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-600" />
              <span>{verification.masked_id_number}</span>
            </span>
          </div>

          {verification.extracted_institution && (
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-500">Institusi Kampus:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {verification.extracted_institution}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center pt-1">
            <span className="text-slate-500">Tanggal Verifikasi:</span>
            <span className="text-slate-700 dark:text-slate-300">
              {verification.verified_at
                ? new Date(verification.verified_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "-"}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            Lencana <strong>Penyewa Terverifikasi</strong> kini aktif pada profil akun, ruang chat dengan pemilik kos, dan formulir booking Anda. Pemilik kos lebih memprioritaskan penyewa yang terverifikasi.
          </p>
        </div>
      </div>
    );
  }

  // 2. Tampilan Form Verifikasi Identitas
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            Verifikasi Identitas Cerdas (KYC)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dapatkan lencana centang hijau untuk mempermudah persetujuan sewa dari pemilik kos.
          </p>
        </div>
      </div>

      {/* Info Privasi */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px]">
          Foto kartu identitas Anda diproses secara privat dan aman menggunakan AI Gemini Multimodal. Nomor NIK/NIM akan disamarkan (*masked*) dan tidak akan pernah dibagikan kepada publik tanpa izin.
        </p>
      </div>

      {/* Pesan Error / Sukses */}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form Unggah */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Pilihan Tipe Dokumen */}
        <div>
          <label className="text-xs font-bold text-slate-900 dark:text-white block mb-2">
            Pilih Jenis Dokumen:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDocumentType("KTP")}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                documentType === "KTP"
                  ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <FileText className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="text-xs font-extrabold block">KTP</span>
                <span className="text-[10px] text-slate-500 font-normal">Kartu Tanda Penduduk</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDocumentType("KTM")}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                documentType === "KTM"
                  ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Building className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="text-xs font-extrabold block">KTM</span>
                <span className="text-[10px] text-slate-500 font-normal">Kartu Mahasiswa</span>
              </div>
            </button>
          </div>
        </div>

        {/* Upload Box */}
        <div>
          <label className="text-xs font-bold text-slate-900 dark:text-white block mb-2">
            Unggah Foto {documentType}:
          </label>

          <label className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer transition-colors relative overflow-hidden group">
            {previewUrl ? (
              <div className="relative w-full h-48 rounded-xl overflow-hidden">
                <Image
                  src={previewUrl}
                  alt="Preview Dokumen"
                  fill
                  className="object-contain"
                  unoptimized
                />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                  <Camera className="w-4 h-4" />
                  <span>Ganti Foto</span>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Klik untuk Ambil Foto / Pilih File
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Format JPG, PNG, atau WEBP (Maksimal 10MB)
                  </span>
                </div>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
              disabled={isSubmitting}
            />
          </label>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={!file || isSubmitting}
          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>AI sedang memverifikasi identitas dokumen Anda...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Mulai Verifikasi Cerdas Sekarang</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
