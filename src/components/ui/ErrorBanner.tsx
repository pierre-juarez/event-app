export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-xl bg-declined/15 px-4 py-3 text-sm text-declined">
      {message}
    </div>
  );
}
