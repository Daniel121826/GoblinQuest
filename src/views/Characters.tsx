import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Character {
    id: string;
    name: string;
    charClass: string;
    race: string;
    level: number;
    backstory?: string;
    image: string | null;
    attributes: any;
}

const Characters: React.FC = () => {
    const navigate = useNavigate();
    const [characters, setCharacters] = useState<Character[]>([]);
    const token = useAuthStore((state) => state.token); // Añadir esto

    useEffect(() => {
        const fetchCharacters = async () => {
            if (!token) return;
            const response = await fetch(`${API_URL}/api/characters`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                // Ajuste para mapear _id de MongoDB a id de la interfaz
                setCharacters(data.map((c: any) => ({ ...c, id: c._id })));
            }
        };
        fetchCharacters();
    }, [token]);

    const deleteCharacter = async (id: string) => {
        if (!window.confirm("¿Seguro que quieres borrar esta leyenda?")) return;

        const response = await fetch(`${API_URL}/api/characters/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            setCharacters(characters.filter(c => c.id !== id));
        }
    };

    return (
        <div className="min-h-screen bg-[#f3f4f6]">
            <Navbar />
            <main className="max-w-7xl mx-auto px-6 py-16">

                {/* Cabecera */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b-2 border-slate-900 pb-8">
                    <div>
                        <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase">Mis Personajes</h1>
                        <p className="text-gray-500 italic font-serif mt-2">"El panteón de tus leyendas y héroes caídos."</p>
                    </div>
                    <button
                        onClick={() => navigate('/crear-personaje')}
                        className="bg-[#1e5a31] hover:bg-green-800 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95"
                    >
                        + Crear Nuevo Personaje
                    </button>
                </div>

                {/* Lista de Cards */}
                {characters.length === 0 ? (
                    <div className="col-span-full py-24 text-center border-4 border-dashed border-gray-200 rounded-[3rem] bg-white/50">
                        <p className="text-slate-400 font-bold uppercase tracking-widest mb-4">No hay leyendas aún</p>
                        <button onClick={() => navigate('/crear-personaje')} className="text-green-600 font-black uppercase text-sm hover:underline">
                            Forjar mi primer héroe
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {characters.map((char) => (
                            <div key={char.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100 group transition-all hover:-translate-y-1">
                                <div className="h-64 bg-slate-200 relative overflow-hidden">
                                    {char.image ? (
                                        <img src={char.image} alt={char.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-4xl text-slate-400 font-black">👤</div>
                                    )}
                                    <div className="absolute bottom-4 left-4 flex gap-2">
                                        <span className="bg-[#0a1a0f] text-green-500 text-[10px] font-black uppercase px-3 py-1 rounded-full">{char.charClass}</span>
                                        <span className="bg-white text-slate-900 text-[10px] font-black uppercase px-3 py-1 rounded-full">{char.race}</span>
                                    </div>
                                </div>

                                <div className="p-8">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter truncate pr-2">{char.name}</h3>
                                        <span className="text-xs font-bold text-slate-400 uppercase">Nivel {char.level || 1}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => navigate(`/editar-personaje/${char.id}`)}
                                            className="bg-slate-100 hover:bg-slate-200 text-slate-900 py-3 rounded-xl font-black uppercase text-[10px] transition-colors"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => deleteCharacter(char.id)}
                                            className="bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-xl font-black uppercase text-[10px] transition-colors"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Characters;