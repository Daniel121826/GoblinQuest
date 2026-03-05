import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuthStore } from '../store/authStore';

// Importación de assets locales
import heroImage from '../assets/portada.png';

interface Rule {
    title: string;
    desc: string;
}
import { useNavigate } from 'react-router-dom';



const Home: React.FC = () => {
    const { isLoggedIn } = useAuthStore();
    const navigate = useNavigate(); // Hook para navegar
    const [showLoginFromHero, setShowLoginFromHero] = useState(false);

    const rules: Rule[] = [
        { title: "COHERENCIA NARRATIVA", desc: "La historia tiene prioridad sobre las tiradas. El objetivo es crear un arco épico." },
        { title: "RESOLUCIÓN JUSTA", desc: "Las decisiones se resuelven según el riesgo, la habilidad de tu personaje y el azar." },
        { title: "AGENCIA DEL JUGADOR", desc: "Tú tienes el control. La IA sugiere consecuencias, pero tú eliges el camino." },
        { title: "MÁSTER IMPARCIAL", desc: "Nuestra IA actúa como un árbitro neutral, adaptándose a tu estilo de juego." }
    ];

    const handleStartAdventure = () => {
        if (!isLoggedIn) {
            // Si no está logueado, activamos el modal
            setShowLoginFromHero(true);
        } else {
            // Si ya está logueado, lo mandamos a la sección de personajes
            navigate('/personajes');
        }
    };

    return (
        <div className="min-h-screen bg-[#f3f4f6]">
            {/* Pasamos la prop forceOpen para que el Navbar reaccione */}
            <Navbar forceOpenLogin={showLoginFromHero} onLoginModalClose={() => setShowLoginFromHero(false)} />

            {/* Hero Section */}
            <section className="relative h-[70vh] flex flex-col items-center justify-center text-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src={heroImage}
                        alt="Goblin Quest World"
                        className="w-full h-full object-cover"
                    />
                    {/* Quitamos el brightness del img y lo manejamos con este overlay suave */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#f3f4f6] via-transparent to-black/60"></div>
                </div>

                <div className="relative z-10 px-6 max-w-4xl">
                    <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 leading-tight drop-shadow-2xl">
                        Un lugar para imaginar,<br /> crear y vivir aventuras
                    </h1>
                    <p className="text-lg md:text-xl text-gray-200 italic mb-10 font-light tracking-wide">
                        "Donde los dados dictan el destino, pero tu voluntad escribe la leyenda."
                    </p>

                    {/* Botón vinculado a la lógica de login */}
                    <button
                        onClick={handleStartAdventure}
                        className="bg-[#1e5a31] hover:bg-green-800 text-white px-10 py-4 rounded-md transition-all transform hover:scale-105 shadow-[0_10px_20px_rgba(0,0,0,0.3)] font-bold uppercase tracking-widest text-sm font-sans"
                    >
                        {isLoggedIn ? 'Ir a mis Personajes' : 'Empezar Aventura'}
                    </button>
                </div>
            </section>

            {/* Rules Section (Se mantiene igual) */}
            <section className="py-24 px-6 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-6xl font-black text-slate-900 tracking-tighter mb-2">REGLAS</h2>
                    <div className="w-24 h-1 bg-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-500 italic">Los pilares que sostienen el Proyecto Goblin Quest.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {rules.map((rule, index) => (
                        <div key={index} className="bg-[#2d7a46] p-8 rounded-2xl shadow-xl hover:bg-[#358a52] transition-colors group">
                            <h3 className="text-white font-bold text-lg mb-4 leading-none group-hover:text-green-200 transition-colors">
                                {rule.title}
                            </h3>
                            <p className="text-green-50/80 text-sm leading-relaxed font-medium">
                                {rule.desc}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="flex justify-center mt-16">
                    <button className="bg-slate-900 text-white px-12 py-3 rounded-full hover:bg-black transition-all font-bold text-xs uppercase tracking-[0.3em] shadow-lg">
                        Leer Manual Completo
                    </button>
                </div>
            </section>

            <footer className="bg-[#0a1a0f] text-white py-12 px-12 border-t border-green-900/20">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
                    <p className="text-sm opacity-60 italic font-light tracking-widest">PROYECTO GOBLIN QUEST — 2026</p>
                    <div className="flex gap-10 opacity-70">
                        <span className="cursor-pointer hover:text-green-400 transition-colors font-bold uppercase text-[10px] tracking-widest">Instagram</span>
                        <span className="cursor-pointer hover:text-green-400 transition-colors font-bold uppercase text-[10px] tracking-widest">Discord</span>
                        <span className="cursor-pointer hover:text-green-400 transition-colors font-bold uppercase text-[10px] tracking-widest">Twitter</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;