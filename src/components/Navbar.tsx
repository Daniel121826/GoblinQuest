import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import AuthModal from '../auth/AuthModal';
import logoImg from '../assets/logo.png';
import { Link, useNavigate } from 'react-router-dom';
interface NavbarProps {
    forceOpenLogin?: boolean;
    onLoginModalClose?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ forceOpenLogin, onLoginModalClose }) => {
    const navigate = useNavigate();
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    // Estado para controlar si el modal abre en login o register
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

    const { isLoggedIn, logout, user } = useAuthStore();

    // Función unificada para abrir el modal con el modo correcto
    const handleOpenAuth = (mode: 'login' | 'register') => {
        setAuthMode(mode);
        setIsAuthOpen(true);
    };
    const handleLogout = () => {
        logout();
        navigate('/'); // Redirige al inicio tras cerrar sesión
    };
    // Añade este efecto para escuchar al botón del Hero
    useEffect(() => {
        if (forceOpenLogin) {
            setAuthMode('login');
            setIsAuthOpen(true);
        }
    }, [forceOpenLogin]);

    return (
        <>
            <nav className="flex items-center justify-between px-8 py-4 bg-[#0a1a0f]/90 backdrop-blur-md text-white border-b border-green-900/30 sticky top-0 z-50 shadow-lg">
                {/* Lado Izquierdo: Logo y Nombre */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center">
                        {logoImg ? (
                            <img src={logoImg} alt="Goblin Quest Logo" className="w-full h-full object-contain" />
                        ) : (
                            <span className="text-2xl">👺</span>
                        )}
                    </div>
                    <span className="font-serif font-bold tracking-tighter text-xl hidden sm:block">
                        GOBLIN QUEST
                    </span>
                </div>

                {/* Centro: Navegación */}
                <div className="hidden md:flex gap-8 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300">
                    <Link to="/" className="hover:text-green-400 transition-colors">Inicio</Link>
                    {isLoggedIn && (
                        <>
                            <Link to="/characters" className="hover:text-green-400 transition-colors">Mis Personajes</Link>
                            <Link to="/partidas" className="hover:text-green-400 transition-colors">Mis Partidas</Link>
                        </>
                    )}
                    <Link to="/contacto" className="hover:text-green-400 transition-colors">Contacto</Link>
                </div>

                {/* Lado Derecho: Auth */}
                <div className="flex gap-5 items-center">
                    {isLoggedIn ? (
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-green-500 font-mono leading-none uppercase tracking-widest text-right">
                                    Aventurero
                                </span>
                                <span className="text-sm font-bold text-white leading-none mt-1">
                                    {user?.name}
                                </span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="bg-red-900/20 hover:bg-red-900/40 text-red-500 px-3 py-1 rounded border border-red-900/50 text-[10px] font-bold uppercase transition-all"
                            >
                                Salir
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => handleOpenAuth('login')}
                                className="text-[10px] uppercase font-bold hover:text-green-400 transition tracking-widest"
                            >
                                Iniciar Sesión
                            </button>
                            <button
                                onClick={() => handleOpenAuth('register')}
                                className="border border-green-600 px-5 py-2 rounded-full text-[10px] uppercase font-bold hover:bg-green-600 hover:text-black transition-all duration-300 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                            >
                                Registrarse
                            </button>
                        </>
                    )}
                </div>
            </nav>

            {/* Modal de Autenticación con prop de modo inicial */}
            <AuthModal
                isOpen={isAuthOpen}
                onClose={() => {
                    setIsAuthOpen(false);
                    if (onLoginModalClose) {
                        onLoginModalClose();
                    }
                }}
                initialMode={authMode}
            />
        </>
    );
};

export default Navbar;