import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CLASSES = ['Guerrero', 'Paladín', 'Pícaro', 'Mago', 'Clérigo', 'Explorador', 'Bárbaro', 'Bardo', 'Hechicero', 'Druida'];

const RACE_BONUSES: Record<string, Record<string, number>> = {
    'Humano': { Fuerza: 1, Destreza: 1, Constitución: 1, Inteligencia: 1, Sabiduría: 1, Carisma: 1 },
    'Elfo': { Destreza: 2, Inteligencia: 1 },
    'Enano': { Constitución: 2, Fuerza: 1 },
    'Mediano': { Destreza: 2, Carisma: 1 },
    'Orco': { Fuerza: 2, Constitución: 1 },
    'Gnomo': { Inteligencia: 2, Destreza: 1 },
    'Tiefling': { Carisma: 2, Inteligencia: 1 }
};

interface Attributes {
    [key: string]: number;
    Fuerza: number;
    Destreza: number;
    Constitución: number;
    Inteligencia: number;
    Sabiduría: number;
    Carisma: number;
}

const CreateCharacter: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);
    const [backstory, setBackstory] = useState('');

    const [name, setName] = useState('');
    const [charClass, setCharClass] = useState('');
    const [race, setRace] = useState('');
    const [rolledStats, setRolledStats] = useState<number[]>([]);
    const [isRolling, setIsRolling] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [attributes, setAttributes] = useState<Attributes>({
        Fuerza: 0, Destreza: 0, Constitución: 0,
        Inteligencia: 0, Sabiduría: 0, Carisma: 0
    });

    useEffect(() => {
        const fetchCharacter = async () => {
            if (id && token) {
                try {
                    const response = await fetch(`${API_URL}/api/characters/${id}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.ok) {
                        const charToEdit = await response.json();
                        setName(charToEdit.name || '');
                        setCharClass(charToEdit.charClass || '');
                        setRace(charToEdit.race || '');
                        setBackstory(charToEdit.backstory || '');
                        setImagePreview(charToEdit.image || null);

                        if (charToEdit.attributes) {
                            setAttributes(charToEdit.attributes);
                        }
                    } else {
                        setError("No se pudo cargar el personaje del servidor.");
                    }
                } catch (err) {
                    console.error("Error al obtener personaje:", err);
                    setError("Error de conexión al cargar los datos.");
                }
            }
        };

        fetchCharacter();
    }, [id, token]);

    const handleSave = async () => {
        if (!token) {
            setError("Debes estar conectado para guardar un personaje");
            return;
        }

        if (!name || !charClass || !race) {
            setError("Faltan datos (Nombre, Clase o Raza)");
            setTimeout(() => setError(null), 3000);
            return;
        }

        const characterData = {
            name,
            charClass,
            race,
            attributes,
            backstory,
            image: imagePreview,
            level: 1
        };

        try {
            let response;
            if (id) {
                response = await fetch(`${API_URL}/api/characters/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(characterData)
                });
            } else {
                response = await fetch(`${API_URL}/api/characters`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(characterData)
                });
            }

            if (response.ok) {
                navigate('/characters');
            } else {
                const errorData = await response.json();
                setError(errorData.message || "Error al guardar en el servidor");
            }
        } catch (e) {
            console.error("Error de conexión:", e);
            setError("No se pudo conectar con el servidor.");
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.src = reader.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 400;
                    const scaleSize = MAX_WIDTH / img.width;
                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * scaleSize;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                    setImagePreview(compressedBase64);
                };
            };
            reader.readAsDataURL(file);
        }
    };

    const rollDice = () => {
        setIsRolling(true);
        setTimeout(() => {
            const rolls = Array.from({ length: 8 }, () => Math.floor(Math.random() * 11) + 8);
            const sortedRolls = rolls.sort((a, b) => b - a);
            setRolledStats(sortedRolls);
            setIsRolling(false);
        }, 600);
    };

    const handleAttributeChange = (attr: string, rawValue: string) => {
        const numericValue = rawValue.replace(/\D/g, '');
        if (numericValue === '') {
            setAttributes({ ...attributes, [attr]: 0 });
            return;
        }
        const val = parseInt(numericValue, 10);
        if (val > 20) {
            setError(`El valor de ${attr} no puede ser superior a 20`);
            setAttributes({ ...attributes, [attr]: 20 });
            setTimeout(() => setError(null), 3000);
            return;
        }
        setAttributes({ ...attributes, [attr]: val });
    };

    const calculateMod = (attrName: string, val: number) => {
        if (val === 0) return "--";
        const raceBonus = RACE_BONUSES[race]?.[attrName] || 0;
        const totalScore = val + raceBonus;
        const mod = Math.floor((totalScore - 10) / 2);
        return mod >= 0 ? `+${mod}` : mod;
    };

    return (
        <div className="min-h-screen bg-[#f3f4f6]">
            <style>{`
                @keyframes d20-roll {
                    0% { transform: rotate(0deg) scale(1); }
                    25% { transform: rotate(90deg) scale(1.1); }
                    50% { transform: rotate(180deg) scale(0.9); }
                    75% { transform: rotate(270deg) scale(1.1); }
                    100% { transform: rotate(360deg) scale(1); }
                }
                .animate-d20 {
                    animation: d20-roll 0.2s infinite linear;
                }
            `}</style>

            <Navbar />
            <main className="max-w-6xl mx-auto px-6 py-12">
                {error && (
                    <div className="fixed top-24 right-10 z-50 bg-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-2xl">
                        ⚠️ {error}
                    </div>
                )}

                <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-200">
                    <div className="bg-[#0a1a0f] p-10 text-white">
                        <h1 className="text-4xl font-black uppercase tracking-tighter">
                            {id ? 'Editar Leyenda' : 'Forjar Nueva Leyenda'}
                        </h1>
                        <p className="text-green-500/60 italic">
                            {id ? `"El destino siempre puede ser reescrito."` : `"El destino comienza con una hoja en blanco."`}
                        </p>
                    </div>

                    <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Nombre del Personaje</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 focus:border-green-600 outline-none transition-all font-bold"
                                    placeholder="Ej: Valerius el Bravo"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Clase</label>
                                    <select
                                        value={charClass}
                                        onChange={(e) => setCharClass(e.target.value)}
                                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-4 outline-none focus:border-green-600 font-bold"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Raza</label>
                                    <select
                                        value={race}
                                        onChange={(e) => setRace(e.target.value)}
                                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-4 outline-none focus:border-green-600 font-bold"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {Object.keys(RACE_BONUSES).map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                            </div>

                            {race && (
                                <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                                    <p className="text-[10px] font-black text-green-800 uppercase mb-1">Bonificadores de {race}:</p>
                                    <div className="flex gap-3">
                                        {Object.entries(RACE_BONUSES[race]).map(([attr, bonus]) => (
                                            <span key={attr} className="text-xs font-bold text-green-600">+{bonus} {attr}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Retrato del Personaje</label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-80 rounded-[2.5rem] border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-green-300 hover:bg-green-50 transition-all overflow-hidden bg-gray-50 shadow-inner"
                                >
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-6 opacity-40">
                                            <span className="text-5xl block mb-2">🖼️</span>
                                            <span className="text-[10px] uppercase font-bold text-green-900">Haz clic para subir imagen</span>
                                        </div>
                                    )}
                                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageChange} accept="image/*" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Trasfondo (Opcional)</label>
                                <textarea
                                    value={backstory} // Vincular valor
                                    onChange={(e) => setBackstory(e.target.value)} // Capturar cambios
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 focus:border-green-600 outline-none transition-all h-32 resize-none"
                                    placeholder="¿Escribe la historia de tu héroe?"
                                ></textarea>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="font-black uppercase text-sm tracking-widest text-slate-900">Atributos</h2>
                                <button
                                    onClick={rollDice}
                                    disabled={isRolling}
                                    className={`${isRolling ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-lg`}
                                >
                                    {isRolling ? 'Lanzando...' : 'Tirar Dados 🎲'}
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-3 mb-8 p-6 bg-white rounded-3xl border-2 border-dashed border-slate-200 min-h-[100px] justify-center items-center">
                                {(isRolling ? Array(8).fill('?') : rolledStats).length > 0 ? (
                                    (isRolling ? Array(8).fill('?') : rolledStats).map((s, i) => (
                                        <div
                                            key={i}
                                            className={`relative w-12 h-14 bg-slate-900 flex items-center justify-center text-white font-black text-lg shadow-xl ${isRolling ? 'animate-d20' : ''}`}
                                            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                                        >
                                            {s}
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-gray-300 text-[10px] uppercase font-bold m-auto">Lanza los dados</span>
                                )}
                            </div>

                            <div className="space-y-3">
                                {Object.entries(attributes).map(([attr, value]) => (
                                    <div key={attr} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-gray-100">
                                        <div className="flex-1">
                                            <div className="flex justify-between">
                                                <span className="text-[10px] font-black uppercase text-gray-400 block">{attr}</span>
                                                {race && RACE_BONUSES[race][attr] && (
                                                    <span className="text-[9px] font-bold text-green-500">+{RACE_BONUSES[race][attr]} Racial</span>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={value === 0 ? '' : value}
                                                className="w-full text-xl font-black text-slate-900 outline-none bg-transparent"
                                                onChange={(e) => handleAttributeChange(attr, e.target.value)}
                                                onBlur={() => {
                                                    if (value > 0 && value < 3) {
                                                        setError(`El valor mínimo para ${attr} es 3`);
                                                        setAttributes(prev => ({ ...prev, [attr]: 3 }));
                                                        setTimeout(() => setError(null), 3000);
                                                    }
                                                }}
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="bg-green-100 text-green-700 w-14 h-14 flex flex-col items-center justify-center rounded-2xl border border-green-200 shadow-inner">
                                            <span className="text-[8px] font-black uppercase opacity-50">Mod</span>
                                            <span className="text-lg font-black">{calculateMod(attr, value)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-10 bg-gray-50 border-t border-gray-100 flex justify-end">
                        <button
                            onClick={handleSave}
                            className="bg-[black/85] hover:bg-black text-white px-10 py-4 rounded-md transition-all transform hover:scale-105 shadow-[0_10px_20px_rgba(0,0,0,0.3)] font-bold uppercase tracking-widest text-sm font-sans"
                        >
                            {id ? 'Actualizar Personaje' : 'Guardar Personaje'}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CreateCharacter;