export default function ErrorMessage({ message }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
    >
      {message}
    </div>
  );
}
