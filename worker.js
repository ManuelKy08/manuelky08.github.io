/**
 * Cloudflare Worker - Backend proxy untuk Chat AI "Red Team & Bug Bounty Assistant"
 *
 * FUNGSI:
 * - Menerima request chat dari frontend (web statis kamu)
 * - Menjalankan model via Cloudflare Workers AI (FREE TIER, 10.000 neuron/hari)
 * - Tidak butuh API key eksternal — pakai AI binding langsung dari akun Cloudflare
 *
 * SETUP:
 * 1. File ini di-deploy bersama wrangler.toml (yang berisi [ai] binding = "AI")
 * 2. Pastikan akun Cloudflare kamu punya Workers AI aktif (free plan sudah termasuk)
 * 3. Deploy: `wrangler deploy`
 * 4. Ganti ALLOWED_ORIGIN di bawah dengan domain web statis kamu (biar gak sembarang situs bisa pakai worker ini)
 *
 * CATATAN MODEL:
 * - Default: @cf/meta/llama-4-scout-17b-16e-instruct (LLaMA 4, masih aktif per 2026)
 * - Model lama @cf/meta/llama-3.1-8b-instruct sudah deprecated (30 Mei 2026)
 * - Ganti MODEL di bawah untuk kualitas/kepadatan berbeda.
 * - Daftar model aktif: https://developers.cloudflare.com/workers-ai/models/
 */

// Ganti dengan domain web kamu, misalnya "https://webmu.com". Pakai "*" hanya untuk testing.
const ALLOWED_ORIGIN = "*";

// Model Workers AI yang dipakai.
const MODEL = "@cf/meta/llama-4-scout-17b-16e-instruct";

const SYSTEM_PROMPT = `Kamu adalah asisten AI khusus untuk komunitas red team dan bug bounty hunter.
Fokus topik kamu:
- Diskusi teknik red teaming, penetration testing, dan security research secara edukatif dan etis
- Membahas CVE (Common Vulnerabilities and Exposures) yang sudah publik: apa itu, dampaknya, komponen yang terdampak, dan rekomendasi mitigasi/patch
- Membantu memahami konsep bug bounty: metodologi recon, penulisan laporan (report writing), triase, dan best practice program bug bounty
- Menjelaskan konsep keamanan siber secara umum (OWASP Top 10, web security, network security, dsb)

Batasan penting:
- Jangan pernah menuliskan kode exploit, payload siap pakai, atau langkah teknis rinci yang bisa langsung dipakai untuk menyerang sistem nyata tanpa izin
- Untuk pertanyaan CVE, jelaskan secara konseptual (root cause, dampak, cara deteksi/mitigasi) tanpa memberikan proof-of-concept exploit yang bisa langsung dieksekusi
- Selalu ingatkan pentingnya izin resmi (scope program bug bounty / kontrak pentest) sebelum melakukan pengujian keamanan terhadap sistem apapun
- Jika ditanya tentang aktivitas ilegal (hacking tanpa izin, membobol sistem orang lain), tolak dengan sopan dan arahkan ke jalur legal seperti bug bounty program resmi

Gaya bahasa: santai tapi tetap profesional, boleh pakai Bahasa Indonesia atau Inggris tergantung bahasa yang dipakai user.`;

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders(),
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }

    try {
      const body = await request.json();
      const userMessages = body.messages; // array [{role: "user"|"assistant", content: "..."}]

      if (!Array.isArray(userMessages) || userMessages.length === 0) {
        return new Response(JSON.stringify({ error: "messages harus berupa array dan tidak boleh kosong" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      const ai = env.AI;
      if (!ai) {
        return new Response(JSON.stringify({ error: "AI binding tidak tersedia. Deploy ulang worker bersama wrangler.toml." }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...userMessages.map((m) => ({ role: m.role, content: m.content })),
      ];

      const result = await ai.run(MODEL, {
        messages,
        max_tokens: 1024,
      });

      const reply = (result && (result.response || result.result?.response)) || "No output from model.";

      return new Response(JSON.stringify({ reply }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    } catch (err) {
      console.error("Worker error:", err.message);
      return new Response(JSON.stringify({ error: "Terjadi kesalahan di server." }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  },
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}