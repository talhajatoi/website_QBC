export default function LoadingSpinner({ label = "Loading" }) {
  return (
    <div className="flex min-h-48 items-center justify-center gap-3 text-sm font-semibold text-zinc-600">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-900 border-t-brand" />
      {label}…
    </div>
  );
}
