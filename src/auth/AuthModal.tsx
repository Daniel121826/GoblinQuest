import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
    const [isLogin, setIsLogin] = useState(initialMode === 'login');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false); // Estado para el feedback de carga

    const login = useAuthStore((state) => state.login);

    useEffect(() => {
        setIsLogin(initialMode === 'login');
    }, [initialMode, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isLogin && password !== confirmPassword) {
            alert("Las contraseñas no coinciden");
            return;
        }

        const url = isLogin
            ? `${API_URL}/api/auth/login`
            : `${API_URL}/api/auth/register`;

        setLoading(true); // Iniciamos la carga

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, username })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Error en la conexión arcana");
                setLoading(false);
                return;
            }

            if (isLogin) {
                // LOGIN NORMAL
                login({ name: data.username }, data.token);
                onClose();
            } else {
                // REGISTRO CON LOGIN AUTOMÁTICO
                // Al registrarse, el server devuelve el token y el usuario
                login({ name: data.username }, data.token);
                console.log("✅ Registro y Login automático exitoso");
                onClose();
            }
        } catch (error) {
            alert("No se pudo contactar con el servidor. El Reino está despertando (puede tardar 30s).");
        } finally {
            setLoading(false); // Finalizamos la carga
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0a1a0f] border border-green-900 w-full max-w-md rounded-2xl p-8 relative shadow-[0_0_50px_rgba(20,83,45,0.3)]">

                <button onClick={onClose} className="absolute top-4 right-4 text-green-900 hover:text-green-500 transition-colors">✕</button>

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-serif text-white uppercase tracking-tighter">
                        {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
                    </h2>
                    <p className="text-green-500/60 text-sm italic mt-2">
                        {isLogin ? 'El portal te espera' : 'Únete a la hermandad'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="block text-[10px] font-bold text-green-700 uppercase mb-1 ml-1">Nombre de Usuario</label>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-black/40 border border-green-900/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-all text-sm"
                                placeholder="Gimli_66"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-bold text-green-700 uppercase mb-1 ml-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/40 border border-green-900/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-all text-sm"
                            placeholder="aventurero@goblin.com"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-green-700 uppercase mb-1 ml-1">Contraseña</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/40 border border-green-900/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-all text-sm"
                            placeholder="••••••••"
                        />
                    </div>

                    {!isLogin && (
                        <div>
                            <label className="block text-[10px] font-bold text-green-700 uppercase mb-1 ml-1">Confirmar Contraseña</label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-black/40 border border-green-900/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-all text-sm"
                                placeholder="••••••••"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#1e5a31] hover:bg-green-700 disabled:bg-green-900/40 disabled:text-green-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl mt-4 transition-all uppercase tracking-widest text-xs shadow-lg active:scale-95 flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Procesando...
                            </>
                        ) : (
                            isLogin ? 'Entrar al Reino' : 'Crear Cuenta'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-green-200/50 hover:text-green-400 text-[10px] uppercase tracking-widest transition-colors underline decoration-green-900 underline-offset-4 disabled:opacity-30"
                    >
                        {isLogin ? '¿Eres nuevo aquí? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;