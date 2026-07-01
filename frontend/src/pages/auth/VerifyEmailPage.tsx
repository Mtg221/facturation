import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { api } from '../../services/api.service';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Lien de vérification invalide.');
      return;
    }

    api.get(`/auth/verify-email?token=${token}`)
      .then((res) => {
        setStatus('success');
        setMessage(res.data.data?.message ?? 'Email vérifié avec succès.');
      })
      .catch(() => {
        setStatus('error');
        setMessage('Lien invalide ou expiré. Contactez votre administrateur.');
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] to-[#2d5f8a] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader size={48} className="mx-auto text-blue-500 animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-gray-800">Vérification en cours...</h2>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Email vérifié !</h2>
            <p className="text-gray-500 mb-6">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              Se connecter
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Lien invalide</h2>
            <p className="text-gray-500 mb-6">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              Retour au login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
