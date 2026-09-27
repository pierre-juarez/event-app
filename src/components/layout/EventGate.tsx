"use client";

import { useEvent } from "@/contexts/EventContext";
import { Spinner } from "@/components/ui/Spinner";
import { CreateEventForm } from "./CreateEventForm";
import { AppShell } from "./AppShell";

export function EventGate({ children }: { children: React.ReactNode }) {
  const { event, isLoading } = useEvent();

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!event) {
    return <CreateEventForm />;
  }

  return <AppShell>{children}</AppShell>;
}
