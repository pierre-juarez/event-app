import type { RsvpStatus, VendorOptionStatus } from "./types";

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
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
  return fullName
    .replace(/\+\s*\d+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Deja solo los dígitos para wa.me. Un número de 9 dígitos se asume de Perú
 * (+51); si ya trae código de país (+ o 00) se respeta. `null` si no parece
 * un número válido.
 */
export function whatsappDigits(rawPhone: string | null): string | null {
  if (!rawPhone) return null;
  let digits = rawPhone.replace(/\D/g, "");
  if (rawPhone.trim().startsWith("00")) digits = digits.slice(2);
  if (digits.length === 9) digits = `51${digits}`;
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

/** Plantilla por defecto del mensaje; `{nombre}` y `{link}` se reemplazan al enviar. */
export const DEFAULT_INVITE_MESSAGE = [
  "¡Hola {nombre}! 🌸✨",
  "",
  "Mi cumpleaños se acerca, y con mucho cariño y aprecio te invito a celebrar *mis 50 años* 🎉🥳💐",
  "",
  "Aquí está tu invitación 💌 y todos los detalles (fecha, hora y lugar) 📅📍:",
  "",
  "Por favor confirma tu asistencia en el enlace de abajo 👇",
  "{link}",
  "",
  "¡Será un honor compartir este día contigo! 💖🥂",
  "",
  "Espero verte! 🎶🎊",
].join("\n");

export interface InviteMessageSettings {
  template: string | null;
  includeLink: boolean;
}

/**
 * Rellena la plantilla. Con el link activado, si la plantilla no trae `{link}`
 * se agrega al final; desactivado, `{link}` se quita junto con su línea vacía.
 */
export function buildInviteMessage(
  settings: InviteMessageSettings,
  guestName: string,
  inviteLink: string,
): string {
  const template = settings.template?.trim() ? settings.template : DEFAULT_INVITE_MESSAGE;
  let text = template.replaceAll("{nombre}", guestName);
  if (settings.includeLink) {
    text = text.includes("{link}")
      ? text.replaceAll("{link}", inviteLink)
      : `${text}\n\n${inviteLink}`;
  } else {
    text = text
      .split("\n")
      .filter((line) => line.trim() !== "{link}")
      .join("\n")
      .replaceAll("{link}", "")
      .replace(/\n{3,}/g, "\n\n");
  }
  return text;
}

/** Link wa.me con el mensaje de invitación; null si no hay un número válido. */
export function whatsappInviteUrl(
  rawPhone: string | null,
  guestName: string,
  inviteLink: string,
  settings: InviteMessageSettings = { template: null, includeLink: true },
): string | null {
  const digits = whatsappDigits(rawPhone);
  if (!digits) return null;
  const message = buildInviteMessage(settings, guestName, inviteLink);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
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
