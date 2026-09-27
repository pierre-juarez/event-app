"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import {
  createEvent as createEventRequest,
  fetchCurrentEvent,
  updateEvent as updateEventRequest,
  type EventInput,
  type EventUpdate,
} from "@/services/eventService";
import type { EventRow } from "@/lib/types";

interface EventContextValue {
  event: EventRow | null;
  isLoading: boolean;
  errorMessage: string | null;
  createEvent: (input: Omit<EventInput, "owner_id">) => Promise<void>;
  updateEvent: (patch: EventUpdate) => Promise<void>;
}

const EventContext = createContext<EventContextValue | null>(null);

export function EventProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      setEvent(await fetchCurrentEvent());
    } catch (error) {
      setErrorMessage(`No se pudo cargar tu evento: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- load() fetches remote data on mount, not derived state
      load();
    } else {
      setEvent(null);
      setIsLoading(true);
    }
  }, [userId, load]);

  async function createEvent(input: Omit<EventInput, "owner_id">) {
    if (!userId) return;
    setErrorMessage(null);
    try {
      setEvent(await createEventRequest({ ...input, owner_id: userId }));
    } catch (error) {
      setErrorMessage(`No se pudo crear el evento: ${(error as Error).message}`);
    }
  }

  async function updateEvent(patch: EventUpdate) {
    if (!event) return;
    setErrorMessage(null);
    try {
      setEvent(await updateEventRequest(event.id, patch));
    } catch (error) {
      setErrorMessage(`No se pudo actualizar el evento: ${(error as Error).message}`);
    }
  }

  return (
    <EventContext.Provider value={{ event, isLoading, errorMessage, createEvent, updateEvent }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvent(): EventContextValue {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEvent debe usarse dentro de <EventProvider>");
  return ctx;
}
