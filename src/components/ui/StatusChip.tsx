import clsx from "clsx";
import type { RsvpStatus, VendorOptionStatus } from "@/lib/types";
import { RSVP_LABELS, VENDOR_STATUS_LABELS } from "@/lib/format";

const rsvpColor: Record<RsvpStatus, string> = {
  pending: "bg-pending/20 text-pending",
  confirmed: "bg-confirmed/20 text-sage-dark",
  declined: "bg-declined/20 text-declined",
};

const vendorColor: Record<VendorOptionStatus, string> = {
  candidate: "bg-pending/20 text-pending",
  selected: "bg-warm/20 text-warm",
  discarded: "bg-muted/20 text-muted",
};

function Chip({ className, label }: { className: string; label: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        className
      )}
    >
      {label}
    </span>
  );
}

export function RsvpStatusChip({ status }: { status: RsvpStatus }) {
  return <Chip className={rsvpColor[status]} label={RSVP_LABELS[status]} />;
}

export function VendorStatusChip({ status }: { status: VendorOptionStatus }) {
  return <Chip className={vendorColor[status]} label={VENDOR_STATUS_LABELS[status]} />;
}

/** Respuesta de mamá al link público de "¿se puede invitar por WhatsApp?". */
export function WhatsappInviteChip({ value }: { value: boolean | null }) {
  if (value === true) return <Chip className="bg-confirmed/20 text-sage-dark" label="WhatsApp: Sí" />;
  if (value === false) return <Chip className="bg-declined/20 text-declined" label="WhatsApp: No" />;
  return null;
}
