export default function Pagination({ pagination, onChange }) {
  if (!pagination || pagination.pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-10 flex justify-center gap-2">
      {Array.from({ length: pagination.pages }, (_, index) => index + 1).map(
        (page) => (
          <button
            key={page}
            onClick={() => onChange(page)}
            className={`h-10 w-10 rounded-xl text-sm font-bold ${page === pagination.page ? "bg-zinc-950 text-white" : "border border-zinc-200 bg-white hover:border-zinc-950"}`}
          >
            {page}
          </button>
        ),
      )}
    </nav>
  );
}
