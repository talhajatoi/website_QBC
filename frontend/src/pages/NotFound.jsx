import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <main className="container-page py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="section-title">This road ends here.</h1>
      <Link className="btn-primary mt-6" to="/">
        Back home
      </Link>
    </main>
  );
}
