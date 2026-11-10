import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <p className="mb-4 text-6xl font-black text-primary">404</p>
        <h1 className="mb-2 text-xl font-bold text-foreground">Page introuvable</h1>
        <Link to="/" className="inline-flex min-h-11 items-center text-primary hover:underline focus-visible:outline focus-visible:outline-2">← Retour à l’accueil</Link>
      </div>
    </main>
  );
}
