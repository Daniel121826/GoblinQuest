import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Partidas: React.FC = () => {
    const navigate = useNavigate();
    const { games, addGame, deleteGame, fetchGames } = useGameStore() as any;
    const [selectedCharId, setSelectedCharId] = useState('');
    const [characters, setCharacters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const token = useAuthStore((state) => state.token);



    useEffect(() => {
        const loadData = async () => {
            // 1. Extraer el token del objeto complejo de Zustand
            const authData = localStorage.getItem('auth-storage');
            let currentToken = null;

            if (authData) {
                try {
                    const parsed = JSON.parse(authData);
                    currentToken = parsed.state?.token; // Aquí es donde vive según tu AuthState
                } catch (e) {
                    console.error("Error al leer el storage de auth", e);
                }
            }

            if (!currentToken) {
                console.error("No hay sesión activa. Redirigiendo...");
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const response = await fetch(`${API_URL}/api/characters`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${currentToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log("✅ Personajes recibidos:", data);
                    setCharacters(data);

                    await fetchGames(currentToken);

                    // Si hay personajes, seleccionamos el primero por defecto
                    if (data.length > 0) {
                        setSelectedCharId(data[0]._id);
                    }
                } else {
                    console.error("Error del servidor:", response.status);
                }
            } catch (error) {
                console.error("Error de conexión:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [token]);
    const handleStartGame = async () => {
        // 1. Extraer el token correctamente del store persistido
        const authData = localStorage.getItem('auth-storage');
        let currentToken = null;

        if (authData) {
            try {
                const parsed = JSON.parse(authData);
                currentToken = parsed.state?.token;
            } catch (e) {
                console.error("Error al obtener token para iniciar partida", e);
            }
        }

        const char = characters.find((c: any) => c._id === selectedCharId);

        if (!char || !currentToken) {
            alert("Por favor, selecciona un personaje para continuar.");
            return;
        }

        // 2. Preparar los datos de la partida
        const gameData = {
            charId: char._id,
            charName: char.name,
            charImage: char.image,
            health: 100,
            messages: [],
            inventory: [],
            missions: [],
            date: new Date().toISOString()
        };

        try {
            setLoading(true); // Reutilizamos el estado de carga para el feedback del botón
            const response = await fetch(`${API_URL}/api/games`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify(gameData)
            });

            if (response.ok) {
                const newGame = await response.json();

                // 3. Actualizar el store local de juegos y navegar
                if (addGame) addGame(newGame);

                console.log("✅ Partida creada con éxito:", newGame._id);
                navigate(`/partida/${newGame._id}`);
            } else {
                const errorData = await response.json();
                alert(`Error al crear partida: ${errorData.message || 'Error del servidor'}`);
            }
        } catch (error) {
            console.error("Error de red al crear partida:", error);
            alert("No se pudo conectar con el servidor.");
        } finally {
            setLoading(false);
        }
    };
    const handleDelete = async (gameId: string) => {
        // 1. Confirmación del usuario
        if (!window.confirm("¿Estás seguro de que quieres borrar esta partida para siempre?")) return;

        // 2. Obtener el token (mismo método que usas en loadData)
        const authData = localStorage.getItem('auth-storage');
        let currentToken = null;
        if (authData) {
            currentToken = JSON.parse(authData).state?.token;
        }

        if (!currentToken) return;

        try {
            // 3. Llamada al Backend
            const response = await fetch(`${API_URL}/api/games/${gameId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            });

            if (response.ok) {
                // 4. Si el servidor responde OK, borramos del Store local (Zustand)
                deleteGame(gameId);
                console.log("✅ Partida borrada de la DB");
            } else {
                alert("No se pudo borrar la partida del servidor.");
            }
        } catch (error) {
            console.error("Error al borrar:", error);
            alert("Error de conexión al intentar borrar.");
        }
    };

    return (
        <div className="min-h-screen bg-[#f3f4f6]">
            <Navbar />
            <main className="max-w-6xl mx-auto px-6 py-12">
                <section className="bg-white rounded-[2.5rem] p-8 shadow-xl mb-12 border border-green-100">
                    <h2 className="text-2xl font-black uppercase mb-6 flex items-center gap-3">
                        <span className="w-3 h-3 bg-green-600 rounded-full"></span>
                        Nueva Aventura
                    </h2>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2">Selecciona tu Héroe</label>
                            <select
                                value={selectedCharId}
                                onChange={(e) => setSelectedCharId(e.target.value)}
                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 font-bold outline-none focus:border-green-600 transition-all text-slate-800"
                            >
                                <option value="">--- Escoge un personaje ---</option>
                                {characters.map((c: any) => (
                                    <option key={c._id} value={c._id}>
                                        {c.name} ({c.charClass})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handleStartGame}
                            disabled={!selectedCharId || loading}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 h-[60px]"
                        >
                            {loading ? "Cargando..." : "Comenzar Partida"}
                        </button>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-black uppercase mb-6 ml-2 text-slate-800">Tus Crónicas Pasadas</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {games.length > 0 ? games.map((game: any) => (
                            <div key={game._id} className="bg-white rounded-[2rem] p-6 shadow-md border border-gray-100 flex items-center justify-between hover:shadow-xl transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border-2 border-green-600">
                                        <img src={game.charImage || ''} className="w-full h-full object-cover" alt="Char" />
                                    </div>
                                    <div>
                                        <h3 className="font-black uppercase text-slate-900">{game.charName}</h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">❤️ {game.health}%</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => navigate(`/partida/${game._id}`)} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-black transition-colors">Continuar</button>
                                    <button onClick={() => handleDelete(game._id)} className="bg-red-50 text-red-500 p-3 rounded-xl hover:bg-red-500 hover:text-white transition-all">Borrar</button>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full text-center py-20 opacity-30 font-bold uppercase tracking-widest">No hay crónicas escritas aún</div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Partidas;