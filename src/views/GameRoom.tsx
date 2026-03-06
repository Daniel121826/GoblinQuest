import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useGameStore, type Message } from '../store/gameStore';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';


const RACE_BONUSES: any = {
    'Humano': { Fuerza: 1, Destreza: 1, Constitución: 1, Inteligencia: 1, Sabiduría: 1, Carisma: 1 },
    'Elfo': { Destreza: 2, Inteligencia: 1 },
    'Enano': { Constitución: 2, Fuerza: 1 },
    'Mediano': { Destreza: 2, Carisma: 1 },
    'Orco': { Fuerza: 2, Constitución: 1 },
    'Gnomo': { Inteligencia: 2, Destreza: 1 },
    'Tiefling': { Carisma: 2, Inteligencia: 1 },
};

const SKILLS = [
    { name: 'Acrobacias', attr: 'Destreza' },
    { name: 'Atletismo', attr: 'Fuerza' },
    { name: 'Engaño', attr: 'Carisma' },
    { name: 'Historia', attr: 'Inteligencia' },
    { name: 'Intimidación', attr: 'Carisma' },
    { name: 'Investigación', attr: 'Inteligencia' },
    { name: 'Percepción', attr: 'Sabiduría' },
    { name: 'Persuasión', attr: 'Carisma' },
    { name: 'Sigilo', attr: 'Destreza' },
    { name: 'Supervivencia', attr: 'Sabiduría' },
    { name: 'Medicina', attr: 'Sabiduría' },
];

const GameRoom: React.FC = () => {
    const { gameId } = useParams();
    const { games, updateGame } = useGameStore();
    const [character, setCharacter] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showSkills, setShowSkills] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const hasStarted = useRef(false);
    const [quotaError, setQuotaError] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);

    const game = games.find(g => g._id === gameId);

    // --- FUNCIONES AUXILIARES ---
    const calculateModifier = (value: number) => Math.floor((value - 10) / 2);
    const getFormattedMod = (value: number) => {
        const mod = calculateModifier(value);
        return mod >= 0 ? `+${mod}` : `${mod}`;
    };

    const getToken = () => {
        const authData = localStorage.getItem('auth-storage');
        if (authData) {
            try {
                const parsed = JSON.parse(authData);
                return parsed.state?.token;
            } catch (e) {
                return null;
            }
        }
        return null;
    };

    // --- LOGICA DE IA (Definida antes de los efectos para poder usarla) ---
    const callAI = async (messagesForAI: Message[], isInitial = false) => {
        if (!character || !game) return;
        setIsTyping(true);

        const modsFinales = Object.keys(character.attributes).reduce((acc: any, attr: string) => {
            const totalPuntuacion = character.attributes[attr] + (RACE_BONUSES[character.race]?.[attr] || 0);
            acc[attr] = Math.floor((totalPuntuacion - 10) / 2);
            return acc;
        }, {});

        const periciasFinales = SKILLS.reduce((acc: any, skill) => {
            const total = character.attributes[skill.attr] + (RACE_BONUSES[character.race]?.[skill.attr] || 0);
            acc[skill.name] = calculateModifier(total);
            return acc;
        }, {});


        try {
            const chatMessages = [
                {
                    role: "system",
                    content: `Eres un Master de D&D que conoce todas las reglas y mecánicas del juego. 
                    Jugador: ${character.name} (${character.race} ${character.charClass}).
                    
                    HOJA DE PERSONAJE (Modificadores ya calculados):
                    - Atributos: ${JSON.stringify(modsFinales)}
                    - Pericias/Skills: ${JSON.stringify(periciasFinales)}
                    - Trasfondo/Lore: ${character.backstory || "Un aventurero misterioso sin pasado conocido."}
                    
                    INSTRUCCIONES:
                    1. Narra la historia de forma descriptiva y envolvente, sumergiendo al jugador en el mundo de fantasía.
                    2. Siempre que el jugador realice una acción, debes interpretar qué atributo o pericia se aplicaría y pedir la tirada correspondiente.
                    3. Utiliza el trasfondo para personalizar el inicio. Si es un huérfano, empieza en un orfanato; si es un noble, en un banquete, etc.
                    4.Rolea como un NPC cuando el jugador interactúe con personajes del mundo
                    5.Siempre que el jugador lance algo de su inventario o consiga un nuevo objeto, actualiza el inventario y narra la situación.
                    ESTADO:
                    - Salud: ${game.health}%
                    - Inventario: ${JSON.stringify(game.inventory)}
                    - Misiones: ${JSON.stringify(game.missions)}

                    REGLAS DE TIRADAS:
                    1. Cuando el jugador mande un "Lanzamiento d20: X", debes identificar qué Atributo o Pericia aplica a la acción.
                    2. Debes pedir al jugador que realice una tirada de habilidad o atributo específico en funcion de la accion que quiera realizar, por ejemplo: "Tira una tirada de Destreza para esquivar el ataque".
                    3. Suma el modificador correspondiente al valor X y narra el resultado según la dificultad (DC).
                    4 . Responde SIEMPRE en JSON:
                    {
                      "narracion": "Tu relato",
                      "misiones": [],
                      "inventario": [],
                      "nueva_salud": ${game.health},
                      "tirada_pedida": false
                    }`
                },
                ...messagesForAI.map(m => ({
                    role: m.role === 'ai' ? 'assistant' : (m.role === 'system' ? 'system' : 'user'),
                    content: m.content
                }))
            ];

            const response = await fetch(`${API_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ messages: chatMessages })
            });

            if (response.status === 429) {
                setQuotaError(true);
                setIsTyping(false);
                return; // Salimos de la función para no intentar procesar el JSON
            }
            const data = await response.json();
            setQuotaError(false);

            const updatedHistory: Message[] = isInitial
                ? [{ role: 'ai', content: data.narracion }]
                : [...game.messages, messagesForAI[messagesForAI.length - 1], { role: 'ai', content: data.narracion }];

            const updatedGameData = {
                ...game,
                health: data.nueva_salud ?? game.health,
                missions: data.misiones ?? game.missions,
                inventory: data.inventario ?? game.inventory,
                messages: updatedHistory
            };

            updateGame(updatedGameData);

            const token = getToken();
            if (token) {
                await fetch(`${API_URL}/api/games/${gameId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(updatedGameData)
                });
            }

        } catch (error) {
            console.error("Error al conectar con el servidor:", error);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSend = async (customText?: string) => {
        const text = customText || input;
        if (!text.trim() || isTyping || !game) return;

        const userMessage: Message = { role: 'user', content: text };
        if (!customText) setInput('');

        await callAI([...game.messages, userMessage]);
    };

    // --- EFECTOS ---
    useEffect(() => {
        const fetchChar = async () => {
            if (!game?.charId) return;
            const currentToken = getToken();

            if (!currentToken) {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`${API_URL}/api/characters/${game.charId}`, {
                    headers: {
                        'Authorization': `Bearer ${currentToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    setCharacter(data);
                }
            } catch (err) {
                console.error("Error de red:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchChar();
    }, [game?.charId]);

    useEffect(() => {
        if (game && character && !hasStarted.current) {
            const isWelcomeMsg = game.messages.length === 1 &&
                (game.messages[0].content.includes("destino") || game.messages[0].content.includes("Bienvenido"));

            if (game.messages.length === 0 || isWelcomeMsg) {
                hasStarted.current = true;
                const introPrompt: Message = {
                    role: 'user',
                    content: "Inicia la partida: narra dónde estoy y qué veo. Empieza la aventura directamente."
                };
                callAI([introPrompt], true);
            }
        }
    }, [gameId, game?.messages.length, !!character]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [game?.messages, isTyping]);

    // --- RETORNOS CONDICIONALES (SIEMPRE AL FINAL DE LOS HOOKS) ---
    if (!game || loading || !character) {
        return (
            <div className="h-screen bg-[#0a1a0f] flex items-center justify-center text-green-500 font-bold">
                <div className="text-center">
                    <p className="animate-pulse uppercase tracking-widest">Sincronizando con el destino...</p>
                    <p className="text-[10px] text-gray-500 mt-2">Cargando partida...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-[#0a1a0f] overflow-hidden">
            <Navbar />

            {/* Botón flotante - Movido a la IZQUIERDA (left-6) */}
            <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="md:hidden fixed bottom-24 right-6 z-[60] bg-green-600 text-white p-4 rounded-full shadow-2xl border-2 border-green-400 active:scale-95 transition-all"
            >
                {showSidebar ? '✕' : '👤'}
            </button>

            <div className="flex-1 flex overflow-hidden relative">

                {/* SIDEBAR - Ajustado para que no se meta bajo el Navbar */}
                <aside className={`
                ${showSidebar ? 'translate-x-0' : '-translate-x-full'} 
                md:translate-x-0 md:static absolute inset-0 z-50 w-full md:w-1/3 
                bg-[#0d2114] border-r border-green-900/30 overflow-y-auto p-8 text-white 
                custom-scrollbar transition-transform duration-300 ease-in-out
            `}>
                    <div className="relative w-36 h-36 mx-auto mb-6">
                        <img src={character.image} className="w-full h-full object-cover rounded-[2rem] border-2 border-green-600 shadow-2xl" alt="Hero" />
                    </div>

                    <h2 className="text-2xl font-black uppercase text-center leading-none mb-1">{character.name}</h2>
                    <p className="text-center text-green-500 font-bold uppercase text-[8px] tracking-[0.3em] mb-6">{character.race} {character.charClass}</p>

                    {/* Barra de Vida */}
                    <div className="mb-8">
                        <div className="flex justify-between text-[9px] font-black uppercase mb-2">
                            <span>Vitalidad</span>
                            <span className={game.health < 25 ? "text-red-500 animate-pulse" : "text-red-400"}>{game.health}%</span>
                        </div>
                        <div className="h-2.5 bg-gray-900 rounded-full overflow-hidden border border-red-900/40">
                            <div className="h-full bg-red-600 transition-all duration-700 shadow-[0_0_10px_rgba(220,38,38,0.5)]" style={{ width: `${game.health}%` }}></div>
                        </div>
                    </div>

                    {/* Atributos */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        {Object.entries(character.attributes).map(([attr, val]: any) => {
                            const total = val + (RACE_BONUSES[character.race]?.[attr] || 0);
                            return (
                                <div key={attr} className="bg-black/40 p-2 rounded-lg border border-green-900/20 text-center">
                                    <span className="block text-[7px] font-black uppercase text-gray-500">{attr.substring(0, 3)}</span>
                                    <span className="text-base font-black text-green-400">{getFormattedMod(total)}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pericias */}
                    <div className="mb-6">
                        <button onClick={() => setShowSkills(!showSkills)} className="w-full bg-green-950/30 border border-green-900/40 p-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-900/40 transition-all flex justify-between items-center">
                            <span>⚔️ Pericias</span>
                            <span>{showSkills ? '▲' : '▼'}</span>
                        </button>
                        {showSkills && (
                            <div className="mt-2 bg-black/40 rounded-xl p-3 space-y-1.5 border border-green-900/20">
                                {SKILLS.map(skill => {
                                    const baseVal = character.attributes[skill.attr] + (RACE_BONUSES[character.race]?.[skill.attr] || 0);
                                    return (
                                        <div key={skill.name} className="flex justify-between items-center text-[10px] border-b border-white/5 pb-1">
                                            <span className="text-gray-400">{skill.name}</span>
                                            <span className="font-bold text-green-500">{getFormattedMod(baseVal)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="bg-black/30 rounded-2xl p-4 border border-green-900/20">
                            <h3 className="text-[9px] font-black uppercase tracking-widest text-green-500 mb-3">📜 Misiones</h3>
                            <ul className="space-y-2 text-[11px] text-gray-300">
                                {(game.missions || []).map((m: any, i: number) => (
                                    <li key={i} className="flex gap-2">
                                        <span className="text-green-600">»</span>
                                        {typeof m === 'object' ? (m.nombre || m.descripcion) : m}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-black/30 rounded-2xl p-4 border border-green-900/20">
                            <h3 className="text-[9px] font-black uppercase tracking-widest text-orange-500 mb-3">🎒 Inventario</h3>
                            <div className="flex flex-wrap gap-2">
                                {(game.inventory || []).map((item: any, i: number) => (
                                    <span key={i} className="bg-orange-950/30 border border-orange-900/30 px-2 py-1 rounded-md text-[10px] text-orange-200">
                                        {typeof item === 'object' ? (item.nombre || item.item) : item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* CHAT SECTION */}
                <section className="flex-1 flex flex-col bg-gray-50 z-10 w-full">
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 md:p-10 space-y-6">
                        {game.messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] md:max-w-[75%] p-4 md:p-5 rounded-[1.5rem] text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-green-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {isTyping && <div className="text-[10px] font-black text-green-600 animate-pulse ml-2">NARRANDO...</div>}
                    </div>

                    {/* Input y Dado */}
                    <div className="p-4 md:p-6 bg-white border-t border-gray-100">
                        <div className="flex gap-3 md:gap-4 items-center max-w-6xl mx-auto">
                            <button
                                onClick={() => handleSend(`Lanzamiento d20: ${Math.floor(Math.random() * 20) + 1}`)}
                                className="group relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center active:scale-90 transition-all duration-500 ease-out"
                            >
                                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-lg transition-all duration-500 group-hover:rotate-[360deg] group-hover:drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]">
                                    <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="#0f172a" stroke="#22c55e" strokeWidth="3" className="group-hover:fill-[#1a2e4b] transition-colors" />
                                </svg>
                                <span className="relative z-10 text-green-500 font-black italic text-lg md:text-xl group-hover:scale-110 transition-transform">20</span>
                            </button>

                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="¿Qué quieres hacer?"
                                className="flex-1 bg-gray-100 rounded-xl px-4 md:px-5 h-12 text-sm outline-none focus:ring-2 ring-green-500/20 transition-all"
                            />
                            <button onClick={() => handleSend()} className="bg-green-600 text-white px-4 md:px-8 h-12 rounded-xl text-xs font-black uppercase hover:bg-green-700 transition-all shadow-lg shadow-green-600/20">
                                <span className="hidden md:inline">Enviar</span>
                                <span className="md:hidden">➤</span>
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default GameRoom;