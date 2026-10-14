"use client";

import { use, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Marck_Script, Playfair_Display } from "next/font/google";
import {
  fetchInvitation,
  respondToInvitation,
} from "@/services/invitationService";
import type { PublicInvitationRow } from "@/lib/types";
import { stripInlinePlusOnes } from "@/lib/format";
import { Spinner } from "@/components/ui/Spinner";

const script = Marck_Script({ weight: "400", subsets: ["latin"] });
const serif = Playfair_Display({ subsets: ["latin"] });

// Paleta tomada de src/assets/invite.png (acuarela rosa + salvia sobre papel).
const SAGE = "#9a9f84";
const ROSE = "#e8aea3";
const ROSE_DARK = "#c98578";
const INK = "#7a6a6a";
const PAPER = "#faf8f4";

const EVENT_TIME_ZONE = "America/Lima";
const EVENT_START_TIME = "21:00:00-05:00"; // 9:00 pm hora de Lima

/**
 * Inicio del evento. En la base `event_date` es solo el día (la app guarda
 * medianoche UTC), así que se toma ese día y se le pone la hora de la
 * invitación en hora de Lima, sin depender de la zona horaria de quien abre el link.
 */
function eventStart(isoTimestamp: string): Date {
  return new Date(`${isoTimestamp.slice(0, 10)}T${EVENT_START_TIME}`);
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toCalendarStamp(date: Date) {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(
    date.getUTCHours(),
  )}${pad(date.getUTCMinutes())}00Z`;
}

export default function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [invitation, setInvitation] = useState<PublicInvitationRow | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const found = await fetchInvitation(token);
        if (!found) {
          // Links viejos: /invite/[share_token] era la lista de WhatsApp (ahora en /whatsapp).
          router.replace(`/whatsapp/${token}`);
          return;
        }
        setInvitation(found);
      } catch (e) {
        setError(`No se pudo cargar la invitación: ${(e as Error).message}`);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [token, router]);

  if (isLoading) {
    return (
      <div
        className="flex flex-1 items-center justify-center"
        style={{ background: PAPER }}
      >
        <Spinner />
      </div>
    );
  }

  if (!invitation) {
    return (
      <div
        className={`${serif.className} flex flex-1 items-center justify-center px-6 text-center text-lg`}
        style={{ background: PAPER, color: INK }}
      >
        {error ??
          "No encontramos esta invitación. Revisa que el link esté completo."}
      </div>
    );
  }

  return (
    <Invitation
      token={token}
      invitation={invitation}
      onChange={setInvitation}
    />
  );
}

function Invitation({
  token,
  invitation,
  onChange,
}: {
  token: string;
  invitation: PublicInvitationRow;
  onChange: (next: PublicInvitationRow) => void;
}) {
  const start = eventStart(invitation.event_date);
  const guestName = stripInlinePlusOnes(invitation.full_name);
  const venueName = "Recepciones “Anghely”";
  const venueAddress =
    invitation.venue_address ?? "Calle Héctor Aurich Soto 548";

  const dateLabel = start.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: EVENT_TIME_ZONE,
  });
  const weekday = start.toLocaleDateString("es-PE", {
    weekday: "long",
    timeZone: EVENT_TIME_ZONE,
  });
  const timeLabel = start
    .toLocaleTimeString("es-PE", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: EVENT_TIME_ZONE,
    })
    .replace(/\s/g, " ")
    .toLowerCase();

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${venueName} ${venueAddress}`,
  )}`;
  const end = new Date(start.getTime() + 5 * 60 * 60 * 1000);

  function downloadIcs() {
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Mama50//Invitacion//ES",
      "BEGIN:VEVENT",
      `UID:${token}@mama50`,
      `DTSTAMP:${toCalendarStamp(new Date())}`,
      `DTSTART:${toCalendarStamp(start)}`,
      `DTEND:${toCalendarStamp(end)}`,
      "SUMMARY:Mis 50 años – Yeni Urpeque",
      `LOCATION:${venueName}, ${venueAddress}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "mis-50-anos.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className={`${serif.className} flex-1 overflow-x-hidden`}
      style={{ background: PAPER, color: INK }}
    >
      <Banner src="/invitation/flowers-top.jpg" position="top" />

      <main className="mx-auto flex w-full max-w-md flex-col items-center px-6 pb-4 text-center sm:max-w-xl sm:px-10 lg:max-w-2xl">
        <p className="mt-2 text-lg sm:text-xl" style={{ color: INK }}>
          Querido(a)
        </p>
        <p
          className={`${script.className} text-4xl sm:text-5xl`}
          style={{ color: ROSE_DARK }}
        >
          {guestName}
        </p>

        <p
          className="mt-8 pb-4 text-3xl uppercase tracking-[0.35em] sm:mt-10 sm:text-3xl lg:text-4xl"
          style={{ color: SAGE }}
        >
          Mis 50 años
        </p>
        <h1
          className={`${script.className} mt-3 text-6xl leading-[1.05] sm:text-7xl lg:text-8xl`}
          style={{ color: ROSE }}
        >
          Yeni
          <br />
          Urpeque
        </h1>

        <p className="mt-6 text-xl capitalize sm:text-2xl lg:text-3xl">
          {weekday} {dateLabel}
        </p>

        <div className="mt-6 flex w-full items-stretch justify-center gap-5 text-lg sm:gap-8 sm:text-xl lg:text-2xl">
          <p className="flex items-center text-2xl sm:text-3xl">{timeLabel}</p>
          <div className="w-px" style={{ background: "#4a4f5c" }} />
          <div className="max-w-[12rem] text-left leading-snug sm:max-w-xs">
            <p>{venueName}</p>
            <p className="text-base sm:text-lg">{venueAddress}</p>
          </div>
        </div>

        <Countdown target={start} />

        <div className="mt-8 flex w-full max-w-xs flex-col gap-3 text-base sm:text-lg">
          <PillLink href={mapsUrl}>📍 Cómo llegar</PillLink>
          <button
            onClick={downloadIcs}
            className="rounded-full border px-5 py-3 transition-colors hover:bg-white"
            style={{ borderColor: ROSE, color: ROSE_DARK }}
          >
            📅 Agendar en mi calendario
          </button>
        </div>

        <RsvpForm token={token} invitation={invitation} onSaved={onChange} />

        <p
          className={`${script.className} mt-12 text-5xl sm:mt-16 sm:text-6xl`}
          style={{ color: ROSE }}
        >
          Te esperamos
        </p>
      </main>

      <Banner src="/invitation/flowers-bottom.jpg" position="bottom" />
    </div>
  );
}

function Banner({
  src,
  position,
}: {
  src: string;
  position: "top" | "bottom";
}) {
  const objectPosition = position === "top" ? "object-top" : "object-bottom";
  const mask = `linear-gradient(to ${position === "top" ? "bottom" : "top"}, black 70%, transparent)`;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- arte estático ya optimizado en public/
    <img
      src={src}
      alt=""
      aria-hidden
      className={`pointer-events-none block w-full select-none sm:max-h-64 sm:object-cover lg:max-h-72 ${objectPosition}`}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    />
  );
}

function PillLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-full border px-5 py-3 text-center transition-colors hover:bg-white"
      style={{ borderColor: ROSE, color: ROSE_DARK }}
    >
      {children}
    </a>
  );
}

function Countdown({ target }: { target: Date }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- el reloj solo existe en el cliente (evita desajuste de hidratación)
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null) return <div className="mt-10 h-24" />;

  const diff = target.getTime() - now;
  if (diff <= 0) {
    return (
      <p
        className={`${script.className} mt-10 text-3xl`}
        style={{ color: ROSE_DARK }}
      >
        ¡Hoy celebramos!
      </p>
    );
  }

  const totalSeconds = Math.floor(diff / 1000);
  const units = [
    { label: "días", value: Math.floor(totalSeconds / 86400) },
    { label: "horas", value: Math.floor((totalSeconds % 86400) / 3600) },
    { label: "min", value: Math.floor((totalSeconds % 3600) / 60) },
    { label: "seg", value: totalSeconds % 60 },
  ];

  return (
    <div className="mt-10 w-full">
      <p
        className="mb-3 text-sm uppercase tracking-[0.3em]"
        style={{ color: SAGE }}
      >
        Faltan
      </p>
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {units.map((u) => (
          <div
            key={u.label}
            className="rounded-2xl border bg-white/70 py-3 sm:py-5"
            style={{ borderColor: "rgb(232 174 163 / 0.5)" }}
          >
            <p
              className="text-3xl tabular-nums sm:text-5xl"
              style={{ color: ROSE_DARK }}
            >
              {pad(u.value)}
            </p>
            <p
              className="text-xs uppercase tracking-wider sm:text-sm"
              style={{ color: INK }}
            >
              {u.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RsvpForm({
  token,
  invitation,
  onSaved,
}: {
  token: string;
  invitation: PublicInvitationRow;
  onSaved: (next: PublicInvitationRow) => void;
}) {
  const hasResponded = invitation.rsvp_responded_at !== null;
  const [isEditing, setIsEditing] = useState(!hasResponded);
  const [attending, setAttending] = useState<boolean | null>(
    hasResponded ? invitation.rsvp_status === "confirmed" : null,
  );
  const [withCompanion, setWithCompanion] = useState(invitation.plus_ones > 0);
  const [companions, setCompanions] = useState(
    Math.max(1, invitation.plus_ones),
  );
  const [song, setSong] = useState(invitation.song_suggestion ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (attending === null) return;
    setIsSaving(true);
    setError(null);
    const plusOnes = attending && withCompanion ? companions : 0;
    try {
      await respondToInvitation(token, { attending, plusOnes, song });
      onSaved({
        ...invitation,
        rsvp_status: attending ? "confirmed" : "declined",
        rsvp_responded_at: new Date().toISOString(),
        plus_ones: plusOnes,
        song_suggestion: song.trim() || null,
      });
      setIsEditing(false);
    } catch (err) {
      setError(`No se pudo guardar tu respuesta: ${(err as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  }

  if (!isEditing) {
    const confirmed = invitation.rsvp_status === "confirmed";
    return (
      <section
        className="mt-12 w-full rounded-3xl border bg-white/70 p-6"
        style={{ borderColor: ROSE }}
      >
        <p
          className={`${script.className} text-3xl`}
          style={{ color: ROSE_DARK }}
        >
          {confirmed ? "¡Gracias por confirmar!" : "Gracias por avisarnos"}
        </p>
        <p className="mt-2 text-base">
          {confirmed
            ? invitation.plus_ones > 0
              ? `Te esperamos con ${invitation.plus_ones} acompañante${invitation.plus_ones > 1 ? "s" : ""}.`
              : "Te esperamos."
            : "Lamentamos que no puedas acompañarnos."}
        </p>
        <button
          onClick={() => setIsEditing(true)}
          className="mt-4 text-sm underline underline-offset-4"
          style={{ color: ROSE_DARK }}
        >
          Cambiar mi respuesta
        </button>
      </section>
    );
  }

  return (
    <section className="mt-12 w-full sm:mt-16">
      <p className="text-xl sm:text-2xl" style={{ color: INK }}>
        Confirma tu asistencia
      </p>
      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3">
          <Choice
            selected={attending === true}
            onClick={() => setAttending(true)}
          >
            Sí asistiré
          </Choice>
          <Choice
            selected={attending === false}
            onClick={() => setAttending(false)}
          >
            No podré ir
          </Choice>
        </div>

        {attending && (
          <div
            className="rounded-3xl border bg-white/70 p-5 text-left"
            style={{ borderColor: "rgb(232 174 163 / 0.5)" }}
          >
            <p className="text-lg">¿Vienes con acompañante?</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Choice
                small
                selected={!withCompanion}
                onClick={() => setWithCompanion(false)}
              >
                Voy solo(a)
              </Choice>
              <Choice
                small
                selected={withCompanion}
                onClick={() => setWithCompanion(true)}
              >
                Con acompañante
              </Choice>
            </div>

            {withCompanion && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-base">¿Cuántos acompañantes?</p>
                <div className="flex items-center gap-3">
                  <StepButton
                    label="Menos"
                    disabled={companions <= 1}
                    onClick={() => setCompanions((c) => c - 1)}
                  >
                    −
                  </StepButton>
                  <span
                    className="w-6 text-center text-2xl tabular-nums"
                    style={{ color: ROSE_DARK }}
                  >
                    {companions}
                  </span>
                  <StepButton
                    label="Más"
                    disabled={companions >= 10}
                    onClick={() => setCompanions((c) => c + 1)}
                  >
                    +
                  </StepButton>
                </div>
              </div>
            )}
          </div>
        )}

        {attending !== null && (
          <div className="text-left">
            <label htmlFor="song" className="text-lg">
              🎵 Sugiere una canción para bailar
            </label>
            <input
              id="song"
              value={song}
              maxLength={200}
              onChange={(e) => setSong(e.target.value)}
              placeholder="Canción y artista (opcional)"
              className="mt-2 w-full rounded-2xl border bg-white px-4 py-3.5 text-lg outline-none focus:ring-2 focus:ring-[#e8aea3]"
              style={{ borderColor: ROSE, color: INK }}
            />
          </div>
        )}

        {error && (
          <p className="text-sm" style={{ color: "#b4574a" }} role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={attending === null || isSaving}
          className="rounded-full px-6 py-4 text-lg text-white transition-opacity disabled:opacity-40"
          style={{ background: ROSE_DARK }}
        >
          {isSaving ? "Guardando…" : "Enviar respuesta"}
        </button>
      </form>
    </section>
  );
}

function Choice({
  selected,
  small,
  onClick,
  children,
}: {
  selected: boolean;
  small?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-2xl border px-3 transition-colors ${small ? "py-3 text-base" : "py-4 text-lg"}`}
      style={{
        borderColor: ROSE,
        background: selected ? ROSE : "white",
        color: selected ? "white" : INK,
      }}
    >
      {children}
    </button>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="h-10 w-10 rounded-full border text-2xl leading-none disabled:opacity-30"
      style={{ borderColor: ROSE, color: ROSE_DARK }}
    >
      {children}
    </button>
  );
}
