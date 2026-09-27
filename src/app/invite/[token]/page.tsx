"use client";

import { use, useEffect, useMemo, useState } from "react";
import {
  fetchPublicGuestWhatsappList,
  setGuestWhatsappInvite,
} from "@/services/publicInviteService";
import type { PublicGuestWhatsappRow } from "@/lib/types";
import { attendeeCount, stripInlinePlusOnes } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Spinner } from "@/components/ui/Spinner";

export default function PublicInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [guests, setGuests] = useState<PublicGuestWhatsappRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<PublicGuestWhatsappRow | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(["Sin responder", "Sí", "No"])
  );

  function toggleGroup(title: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  }

  const counts = useMemo(() => {
    let totalPeople = 0;
    let yes = 0;
    let no = 0;
    let pending = 0;
    for (const guest of guests) {
      const people = attendeeCount(guest.full_name, guest.plus_ones);
      totalPeople += people;
      if (guest.whatsapp_invite_ok === true) yes += people;
      else if (guest.whatsapp_invite_ok === false) no += people;
      else pending += people;
    }
    return { totalRows: guests.length, totalPeople, yes, no, pending };
  }, [guests]);

  const pendingGuests = useMemo(() => guests.filter((g) => g.whatsapp_invite_ok === null), [guests]);
  const yesGuests = useMemo(() => guests.filter((g) => g.whatsapp_invite_ok === true), [guests]);
  const noGuests = useMemo(() => guests.filter((g) => g.whatsapp_invite_ok === false), [guests]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        setGuests(await fetchPublicGuestWhatsappList(token));
      } catch (e) {
        setError(`No se pudo cargar la lista: ${(e as Error).message}`);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [token]);

  async function handleAnswer(canSend: boolean) {
    if (!selectedGuest) return;
    await setGuestWhatsappInvite(token, selectedGuest.id, canSend);
    setGuests((prev) =>
      prev.map((g) => (g.id === selectedGuest.id ? { ...g, whatsapp_invite_ok: canSend } : g))
    );
    setSelectedGuest(null);
  }

  return (
    <div className="flex flex-1 justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-4xl">💬</p>
          <h1 className="mt-2 text-xl font-semibold text-charcoal">
            ¿A quién le podemos escribir por WhatsApp?
          </h1>
          <p className="mt-1 text-sm text-muted">
            Toca cada nombre y responde si se le puede mandar la invitación por WhatsApp.
          </p>
        </div>

        <ErrorBanner message={error} />

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : guests.length === 0 && !error ? (
          <EmptyState icon="👥" title="No encontramos invitados para este link" />
        ) : (
          <>
            <Card className="mb-4">
              <div className="text-center">
                <p className="text-3xl font-semibold text-charcoal">{counts.totalPeople}</p>
                <p className="text-xs text-muted">
                  personas en total · {counts.totalRows} invitados en la lista
                </p>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-semibold text-confirmed">{counts.yes}</p>
                  <p className="text-xs text-muted">Sí</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-declined">{counts.no}</p>
                  <p className="text-xs text-muted">No</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-pending">{counts.pending}</p>
                  <p className="text-xs text-muted">Sin responder</p>
                </div>
              </div>
            </Card>

            <div className="flex flex-col gap-4">
              {pendingGuests.length > 0 && (
                <GuestGroup
                  title="Sin responder"
                  guests={pendingGuests}
                  isCollapsed={collapsedGroups.has("Sin responder")}
                  onToggle={() => toggleGroup("Sin responder")}
                  onSelect={setSelectedGuest}
                />
              )}
              {yesGuests.length > 0 && (
                <GuestGroup
                  title="Sí"
                  guests={yesGuests}
                  isCollapsed={collapsedGroups.has("Sí")}
                  onToggle={() => toggleGroup("Sí")}
                  onSelect={setSelectedGuest}
                />
              )}
              {noGuests.length > 0 && (
                <GuestGroup
                  title="No"
                  guests={noGuests}
                  isCollapsed={collapsedGroups.has("No")}
                  onToggle={() => toggleGroup("No")}
                  onSelect={setSelectedGuest}
                />
              )}
            </div>
          </>
        )}
      </div>

      {selectedGuest && (
        <Modal title="Confirmar" onClose={() => setSelectedGuest(null)}>
          <p className="text-center text-base text-charcoal">
            ¿Se puede enviar la invitación a{" "}
            <span className="font-semibold">{stripInlinePlusOnes(selectedGuest.full_name)}</span> por
            WhatsApp?
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              className="justify-center py-4 text-base"
              onClick={() => handleAnswer(false)}
            >
              No
            </Button>
            <Button className="justify-center py-4 text-base" onClick={() => handleAnswer(true)}>
              Sí
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function GuestGroup({
  title,
  guests,
  isCollapsed,
  onToggle,
  onSelect,
}: {
  title: string;
  guests: PublicGuestWhatsappRow[];
  isCollapsed: boolean;
  onToggle: () => void;
  onSelect: (guest: PublicGuestWhatsappRow) => void;
}) {
  return (
    <Card>
      <button className="flex w-full items-center justify-between" onClick={onToggle}>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-muted">{title}</h2>
          <span className="text-xs text-muted">({guests.length})</span>
        </div>
        <span className="text-muted">{isCollapsed ? "▸" : "▾"}</span>
      </button>

      {!isCollapsed && (
        <ul className="mt-2 flex flex-col divide-y divide-hairline">
          {guests.map((guest) => (
            <li key={guest.id}>
              <button
                onClick={() => onSelect(guest)}
                className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
              >
                <span className="text-base font-medium text-charcoal">
                  {stripInlinePlusOnes(guest.full_name)}
                </span>
                <span className="text-muted">›</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
