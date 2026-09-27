import type { RsvpStatus, VendorOptionStatus } from "./types";

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

export function formatDate(isoDate: string | null): string {
  if (!isoDate) return "Sin fecha";
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1);
  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatTime(sqlTime: string): string {
  const [h, m] = sqlTime.split(":");
  const date = new Date(2000, 0, 1, Number(h), Number(m));
  return date.toLocaleTimeString("es-MX", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function todaySqlDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Busca un "+N" dentro del nombre (ej. "Familia López +3", "Tía Lupe +1") y
 * regresa cuántos acompañantes extra representa. `null` si el nombre no
 * trae ese patrón.
 */
export function extractInlinePlusOnes(fullName: string): number | null {
  const match = fullName.match(/\+\s*(\d+)/);
  return match ? Number(match[1]) : null;
}

/**
 * Cuántas personas representa un invitado: él/ella + acompañantes. Toma el
 * mayor entre la columna `plus_ones` y lo que diga el "+N" en el nombre,
 * para que el total cuadre sin importar dónde se haya capturado el dato.
 */
export function attendeeCount(fullName: string, plusOnes: number): number {
  const inline = extractInlinePlusOnes(fullName) ?? 0;
  return 1 + Math.max(inline, plusOnes);
}

/** El nombre limpio, sin el "+N" (que sigue contando para los totales, solo no se muestra). */
export function stripInlinePlusOnes(fullName: string): string {
  return fullName.replace(/\+\s*\d+/, "").replace(/\s+/g, " ").trim();
}

export const RSVP_LABELS: Record<RsvpStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  declined: "No asiste",
};

export const VENDOR_STATUS_LABELS: Record<VendorOptionStatus, string> = {
  candidate: "En evaluación",
  selected: "Elegido",
  discarded: "Descartado",
};
