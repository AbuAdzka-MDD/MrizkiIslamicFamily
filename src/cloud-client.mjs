export async function requestAppsScript(endpoint, payload, { timeoutMs = 25000, fetchImpl = fetch } = {}) {
  if (!endpoint) throw new Error("Alamat server keluarga belum diatur.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      redirect: "follow",
      cache: "no-store",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Server keluarga belum tersedia (HTTP ${response.status}). Silakan coba lagi.`);
    const text = await response.text();
    let result;
    try { result = JSON.parse(text); }
    catch { throw new Error("Server belum mengembalikan data aplikasi. Periksa akses deployment Apps Script."); }
    if (!result || typeof result !== "object" || Array.isArray(result) || typeof result.ok !== "boolean") {
      throw new Error("Respons server tidak valid. Silakan coba lagi.");
    }
    return result;
  } catch (error) {
    if (controller.signal.aborted) throw new Error("Server belum merespons. Silakan coba lagi.");
    if (error instanceof TypeError) throw new Error("Koneksi ke server keluarga belum berhasil. Silakan coba lagi.");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
