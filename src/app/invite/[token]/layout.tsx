import type { Metadata } from "next";

// Vista previa que muestra WhatsApp al pegar el link: la imagen de la invitación.
// WhatsApp necesita una URL pública, así que en producción define NEXT_PUBLIC_SITE_URL.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Mis 50 años – Yeni Urpeque",
  description: "Estás invitado(a) a mi cumpleaños. Confirma tu asistencia aquí 💖",
  openGraph: {
    title: "Mis 50 años – Yeni Urpeque 🎉",
    description: "Estás invitado(a). Confirma tu asistencia aquí 💖",
    images: [{ url: "/invitation/invite.jpg", width: 900, height: 1269 }],
    type: "website",
    locale: "es_PE",
  },
};

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
