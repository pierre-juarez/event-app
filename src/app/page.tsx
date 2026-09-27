"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/Spinner";

export default function Home() {
  const { session, isCheckingSession } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isCheckingSession) return;
    router.replace(session ? "/dashboard" : "/login");
  }, [isCheckingSession, session, router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <Spinner />
    </div>
  );
}
