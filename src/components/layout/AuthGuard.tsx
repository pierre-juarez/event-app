"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/Spinner";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isCheckingSession } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isCheckingSession && !session) router.replace("/login");
  }, [isCheckingSession, session, router]);

  if (isCheckingSession || !session) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}
