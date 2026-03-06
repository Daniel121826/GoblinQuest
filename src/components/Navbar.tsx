import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import AuthModal from '../auth/AuthModal';
import logoImg from '../assets/logo.png';
import { Link, useNavigate } from 'react-router-dom';
// Importamos iconos de hamburguesa y cerrar (puedes usar lucide-react o poner SVGs manuales)
import { Menu, X } from 'lucide-react';

interface NavbarProps {
    forceOpenLogin?: boolean;
    onLoginModalClose?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ forceOpenLogin, onLoginModalClose }) => {
    const navigate = useNavigate();
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false); // Estado para el menú móvil
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const { isLoggedIn, logout, user } = useAuthStore();

    const handleOpenAuth = (mode: 'login' | 'register') => {
        setAuthMode(mode);
        setIsAuthOpen(true);
        setIsMenuOpen(false); // Cerramos el menú móvil si se abre el auth
    };

    const handleLogout = () => {
        logout();
        setIsMenuOpen(false);
        navigate('/');
    };

    useEffect(() => {
        if (forceOpenLogin) {
            setAuthMode('login');
            setIsAuthOpen(true);
        }
    }, [forceOpenLogin]);

    return (
        <>
            <nav className="flex items-center justify-between px-6 md:px-8 py-4 bg-[#0a1a0f]/95 backdrop-blur-md text-white border-b border-green-900/30 sticky top-0 z-50 shadow-lg">

                {/* Lado Izquierdo: Logo */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center">
                        {logoImg ? (
                            <img src={logoImg} alt="Goblin Quest Logo" className="w-full h-full object-contain" />
                        ) : (
                            <span className="text-2xl">👺</span>
                        )}
                    </div>
                    <span className="font-serif font-bold tracking-tighter text-xl">
                        GOBLIN QUEST
                    </span>
                </div>

                {/* Centro: Navegación Escritorio (Hidden en móviles) */}
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

                {/* Lado Derecho: Auth Escritorio + Botón Hamburguesa */}
                <div className="flex items-center gap-4">
                    {/* Auth Escritorio */}
                    <div className="hidden md:flex items-center gap-5">
                        {isLoggedIn ? (
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] text-green-500 font-mono leading-none uppercase tracking-widest">Aventurero</span>
                                    <span className="text-sm font-bold text-white mt-1">{user?.name}</span>
                                </div>
                                <button onClick={handleLogout} className="bg-red-900/20 hover:bg-red-900/40 text-red-500 px-3 py-1 rounded border border-red-900/50 text-[10px] font-bold uppercase transition-all">
                                    Salir
                                </button>
                            </div>
                        ) : (
                            <>
                                <button onClick={() => handleOpenAuth('login')} className="text-[10px] uppercase font-bold hover:text-green-400 transition tracking-widest">
                                    Iniciar Sesión
                                </button>
                                <button onClick={() => handleOpenAuth('register')} className="border border-green-600 px-5 py-2 rounded-full text-[10px] uppercase font-bold hover:bg-green-600 hover:text-black transition-all shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                                    Registrarse
                                </button>
                            </>
                        )}
                    </div>

                    {/* Botón Hamburguesa (Solo visible en móviles) */}
                    <button
                        className="md:hidden text-green-500 p-1"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>

                {/* Menú Móvil Desplegable */}
                {isMenuOpen && (
                    <div className="absolute top-full left-0 w-full bg-[#0a1a0f] border-b border-green-900/50 flex flex-col p-6 gap-6 md:hidden animate-in fade-in slide-in-from-top-4">
                        <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-sm font-bold uppercase tracking-widest text-gray-300">Inicio</Link>
                        {isLoggedIn ? (
                            <>
                                <Link to="/characters" onClick={() => setIsMenuOpen(false)} className="text-sm font-bold uppercase tracking-widest text-gray-300">Mis Personajes</Link>
                                <Link to="/partidas" onClick={() => setIsMenuOpen(false)} className="text-sm font-bold uppercase tracking-widest text-gray-300">Mis Partidas</Link>
                                <div className="h-px bg-green-900/30 w-full" />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-green-500">{user?.name}</span>
                                    <button onClick={handleLogout} className="text-red-500 text-[10px] font-bold uppercase">Cerrar Sesión</button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <button onClick={() => handleOpenAuth('login')} className="text-left text-sm font-bold uppercase tracking-widest text-gray-300">Iniciar Sesión</button>
                                <button onClick={() => handleOpenAuth('register')} className="bg-green-600 text-black text-center py-3 rounded-lg font-bold uppercase text-xs">Registrarse</button>
                            </div>
                        )}
                    </div>
                )}
            </nav>

            <AuthModal
                isOpen={isAuthOpen}
                onClose={() => {
                    setIsAuthOpen(false);
                    if (onLoginModalClose) onLoginModalClose();
                }}
                initialMode={authMode}
            />
        </>
    );
};

export default Navbar;