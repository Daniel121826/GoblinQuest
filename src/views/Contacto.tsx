import React, { useState } from 'react';
import Navbar from '../components/Navbar';

const Contact: React.FC = () => {
    const [status, setStatus] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        asunto: 'Soporte Técnico',
        mensaje: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Función para codificar los datos para Netlify
        const encode = (data: any) => {
            return Object.keys(data)
                .map(key => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
                .join("&");
        };

        fetch("/", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: encode({ "form-name": "contacto-gremio", ...formData })
        })
            .then(() => {
                setStatus("¡Mensaje enviado con éxito, viajero!");
                setFormData({ nombre: '', email: '', asunto: 'Soporte Técnico', mensaje: '' });
                setTimeout(() => setStatus(null), 5000);
            })
            .catch(error => {
                console.error(error);
                setStatus("Hubo un error al enviar el pergamino.");
            });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="min-h-screen bg-[#f3f4f6]">
            <Navbar />

            <main className="max-w-4xl mx-auto px-6 py-20">
                <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-200">
                    {/* Encabezado Estilo D&D */}
                    <div className="bg-[#0a1a0f] p-10 text-white text-center">
                        <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">
                            Contactar con el Gremio
                        </h1>
                        <p className="text-green-500/60 italic">
                            "¿Tienes dudas sobre tu destino o has encontrado un error en la matriz?"
                        </p>
                    </div>

                    <div className="p-10 md:p-16">
                        {status && (
                            <div className="mb-8 bg-green-100 text-green-700 p-4 rounded-2xl font-bold text-center border border-green-200 animate-bounce">
                                ✉️ {status}
                            </div>
                        )}

                        <form
                            onSubmit={handleSubmit}
                            name="contacto-gremio"
                            method="POST"
                            data-netlify="true"
                            className="space-y-8"
                        >
                            {/* Input oculto para Netlify */}
                            <input type="hidden" name="form-name" value="contacto-gremio" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Nombre de Aventurero</label>
                                    <input
                                        required
                                        type="text"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 focus:border-green-600 outline-none font-bold transition-all"
                                        placeholder="Ej: Valerius"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Correo de Enlace</label>
                                    <input
                                        required
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 focus:border-green-600 outline-none font-bold transition-all"
                                        placeholder="heroe@reino.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Asunto del Pergamino</label>
                                <select
                                    name="asunto"
                                    value={formData.asunto}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 focus:border-green-600 outline-none font-bold transition-all appearance-none"
                                >
                                    <option value="Soporte Técnico">Soporte Técnico</option>
                                    <option value="Sugerencia de Nueva Raza">Sugerencia de Nueva Raza</option>
                                    <option value="Reportar un Bug Arcano">Reportar un Bug Arcano</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Tu Mensaje</label>
                                <textarea
                                    required
                                    name="mensaje"
                                    value={formData.mensaje}
                                    onChange={handleChange}
                                    rows={5}
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 focus:border-green-600 outline-none font-bold transition-all resize-none"
                                    placeholder="Escribe aquí tus palabras..."
                                ></textarea>
                            </div>

                            <div className="flex justify-center pt-4">
                                <button
                                    type="submit"
                                    className="bg-slate-900 text-white px-16 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-black transition-all shadow-xl active:scale-95 flex items-center gap-3"
                                >
                                    Enviar Pergamino 🕊️
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Footer de la tarjeta */}
                    <div className="bg-gray-50 p-8 border-t border-gray-100 text-center">
                        <div className="flex justify-center gap-8 text-gray-400">
                            <div className="flex flex-col items-center">
                                <span className="text-xl">📍</span>
                                <span className="text-[9px] font-bold uppercase mt-1">Ciudadela Central</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-xl">📜</span>
                                <span className="text-[9px] font-bold uppercase mt-1">v1.0 Stable</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Contact;