import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Property Detail Page - Owner WhatsApp Contact Feature (Issue #348)", () => {
  const filePath = path.resolve(__dirname, "../src/app/kos/[id]/page.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("mengimpor helper formatWhatsAppNumber dari @/lib/whatsapp", () => {
    expect(content).toContain('import { formatWhatsAppNumber } from "@/lib/whatsapp"');
  });

  it("menyediakan tautan ke https://wa.me dengan nomor terformat dan pesan otomatis", () => {
    expect(content).toContain("https://wa.me/${formatWhatsAppNumber(property.owner.whatsapp_number)}");
    expect(content).toContain("Apakah masih ada kamar yang tersedia?");
  });

  it("menerapkan standar keamanan tautan eksternal target _blank dan rel noopener noreferrer", () => {
    expect(content).toContain('target="_blank"');
    expect(content).toContain('rel="noopener noreferrer"');
  });

  it("memiliki label aksesibilitas aria-label deskriptif untuk pembaca layar", () => {
    expect(content).toContain("aria-label={`Hubungi pemilik kos ${property.owner.name || \"\"} via WhatsApp`}");
  });

  it("menampilkan catatan edukasi transaksi aman untuk menggunakan tombol Amankan Kamar", () => {
    expect(content).toContain("Amankan Kamar");
    expect(content).toContain("jaminan garansi 100% uang kembali");
  });
});
