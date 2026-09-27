"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

export default function SignUpPage() {
  const { session, isCheckingSession, signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signedUp, setSignedUp] = useState(false);

  useEffect(() => {
    if (!isCheckingSession && session) router.replace("/dashboard");
  }, [isCheckingSession, session, router]);

  const passwordsMatch = password.length > 0 && password === confirmPassword;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const { error } = await signUp(email, password);
    setIsSubmitting(false);
    if (error) {
      setError(error);
    } else {
      setSignedUp(true);
    }
  }

  if (signedUp) {
    return (
      <Card className="text-center">
        <p className="text-2xl">📬</p>
        <h1 className="mt-2 text-lg font-semibold text-charcoal">Revisa tu correo</h1>
        <p className="mt-1 text-sm text-muted">
          Te enviamos un enlace de confirmación a {email}. Confírmalo y luego inicia sesión.
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm font-medium text-sage-dark">
          Ir a iniciar sesión
        </Link>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-lg font-semibold text-charcoal">Crear cuenta</h1>
        <p className="mt-1 text-sm text-muted">
          Usa el correo que quieras usar para planear la fiesta
        </p>
      </div>

      <Card>
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
            <Label htmlFor="password">Contraseña (mín. 6 caracteres)</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <ErrorBanner message={error} />
          <Button
            type="submit"
            className="w-full"
            disabled={!email || !passwordsMatch}
            isLoading={isSubmitting}
          >
            Crear cuenta
          </Button>
        </form>
      </Card>

      <Link href="/login" className="text-center text-sm font-medium text-sage-dark">
        Ya tengo cuenta — iniciar sesión
      </Link>
    </div>
  );
}
