import { EventProvider } from "@/contexts/EventContext";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { EventGate } from "@/components/layout/EventGate";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <EventProvider>
        <EventGate>{children}</EventGate>
      </EventProvider>
    </AuthGuard>
  );
}
