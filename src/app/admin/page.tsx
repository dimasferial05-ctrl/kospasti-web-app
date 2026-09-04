import { LayoutDashboard } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-900 text-white rounded-lg">
          <LayoutDashboard className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Admin</h1>
          <p className="text-sm text-slate-500">
            Selamat datang di panel kelola KosPasti.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Properti
          </p>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">-</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Transaksi
          </p>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">-</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Status Sistem
          </p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">Aktif</p>
        </div>
      </div>
    </div>
  );
}
