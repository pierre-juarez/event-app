"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

export default function LoginPage() {
  const { session, isCheckingSession, signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isCheckingSession && session) router.replace("/dashboard");
  }, [isCheckingSession, session, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const { error } = await signIn(email, password);
    setIsSubmitting(false);
    if (error) setError(error);
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div>
        <p className="text-4xl">🎉</p>
        <h1 className="mt-2 text-xl font-semibold text-charcoal">
          Fiesta de 50 años de Mamá
        </h1>
        <p className="mt-1 text-sm text-muted">Inicia sesión para seguir planeando</p>
      </div>

      <Card className="w-full text-left">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <ErrorBanner message={error} />
          <Button
            type="submit"
            className="w-full"
            disabled={!email || !password}
            isLoading={isSubmitting}
          >
            Iniciar sesión
          </Button>
        </form>
      </Card>

      <Link href="/signup" className="text-sm font-medium text-sage-dark">
        ¿No tienes cuenta? Crear una
      </Link>
    </div>
  );
}
