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

    const login = useAuthStore((state) => state.login);

    useEffect(() => {
        setIsLogin(initialMode === 'login');
    }, [initialMode, isOpen]);

    if (!isOpen) return null;

    // --- CAMBIO AQUÍ: Función asíncrona conectada al Backend ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isLogin && password !== confirmPassword) {
            alert("Las contraseñas no coinciden");
            return;
        }

        const url = isLogin
            ? `${API_URL}/api/auth/login`
            : `${API_URL}/api/auth/register`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, username }) // username se ignora en login por el server
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Error en la conexión arcana");
                return;
            }

            if (isLogin) {
                // data.username es el que acabamos de configurar en el server
                login({ name: data.username }, data.token);
                onClose();
            } else {
                // Si es registro, lo movemos a login para que entre
                alert("Registro exitoso. ¡Inicia sesión, aventurero!");
                setIsLogin(true);
            }
        } catch (error) {
            alert("No se pudo contactar con el servidor. Revisa si está encendido.");
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

                    <button type="submit" className="w-full bg-[#1e5a31] hover:bg-green-700 text-white font-bold py-4 rounded-xl mt-4 transition-all uppercase tracking-widest text-xs shadow-lg active:scale-95">
                        {isLogin ? 'Entrar al Reino' : 'Crear Cuenta'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-green-200/50 hover:text-green-400 text-[10px] uppercase tracking-widest transition-colors underline decoration-green-900 underline-offset-4"
                    >
                        {isLogin ? '¿Eres nuevo aquí? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;