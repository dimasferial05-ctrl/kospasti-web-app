export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-12 text-center">
      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm">
        🏠
      </div>
      <h1 className="text-xl font-bold text-slate-900 mb-2">
        Halo, Layout KosPasti Berhasil Diterapkan!
      </h1>
      <p className="text-sm text-slate-600 max-w-xs mb-6 leading-relaxed">
        Kerangka tata letak mobile-first dengan sticky header dan main container sudah aktif dan siap digunakan.
      </p>
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        Mobile-first View (max-w-md)
      </div>
    </div>
  );
}
