/**
 * Format string tanggal ISO ke format Indonesia yang rapi
 */
export function formatDateId(
  dateInput?: string | Date | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return "-";
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("id-ID", options || {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

/**
 * Format volume limbah beserta satuannya
 */
export function formatVolume(volume?: number | null, satuan?: string | null): string {
  if (volume === undefined || volume === null) return "-";
  return `${volume.toLocaleString("id-ID")} ${satuan || "Kg"}`;
}

/**
 * Ambil inisial nama lengkap pengguna
 */
export function getInitials(name?: string | null, fallback = "U"): string {
  if (!name?.trim()) return fallback;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
