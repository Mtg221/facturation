import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-8xl font-black text-gray-200 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Page introuvable</h1>
        <p className="text-gray-500 mb-6">Cette page n'existe pas ou a été déplacée.</p>
        <Link
          to="/"
          className="px-6 py-3 bg-[#1e3a5f] text-white font-medium rounded-xl hover:bg-[#2d5f8a] transition-colors"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
