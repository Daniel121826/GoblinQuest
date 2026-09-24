const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const Groq = require('groq-sdk');
const { default: e } = require('express');

const groq = new Groq({ apiKey: process.env.AI_KEY }); 

const app = express();
const allowedOrigins = [
  'https://goblinquest.netlify.app', // Tu web en producción
  'http://localhost:4173',           // Tu modo preview de Vite
  'http://localhost:5173'            // Tu modo dev de Vite
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir peticiones sin origen (como aplicaciones móviles o Postman) 
    // o si el origen está en la lista blanca
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por CORS: Este origen no está permitido'));
    }
  },
  credentials: true
}));
// Aumentamos el límite para permitir las imágenes en Base64
app.use(express.json({ limit: '10mb' }));

// 1. CONEXIÓN A MONGODB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Conectado a la base de datos de Goblin Quest"))
    .catch(err => console.error("❌ Error de conexión:", err));

// 2. MODELOS DE DATOS
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

const characterSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    charClass: String,
    race: String,
    level: { type: Number, default: 1 },
    attributes: {
        Fuerza: Number,
        Destreza: Number,
        Constitución: Number,
        Inteligencia: Number,
        Sabiduría: Number,
        Carisma: Number
    },
    image: String,
    backstory: {
        type: String,
        default: "Un aventurero con un pasado por escribir."
    },
});
const Character = mongoose.model('Character', characterSchema);

// 3. MIDDLEWARE DE AUTENTICACIÓN
const authenticate = (req, res, next) => {
    const token = req.header('Authorization').replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: "Acceso denegado" });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (e) { 
        res.status(400).json({ error: "Token inválido" }); 
    }
};
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        
        const completion = await groq.chat.completions.create({
            messages,
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        res.json(JSON.parse(completion.choices[0]?.message?.content || "{}"));
    } catch (error) {
        console.error("Error en Groq:", error);
        res.status(500).json({ error: "Error al conectar con la IA" });
    }
});

// 4. RUTAS DE AUTENTICACIÓN
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, username } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "Usuario creado" });
    } catch (error) {
        res.status(400).json({ error: "Error al registrar: " + error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
            res.json({ token, username: user.username });
        } else {
            res.status(401).json({ error: "Credenciales inválidas" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error en el login" });
    }
});

// (RUTAS DE PERSONAJES)
app.get('/api/characters', authenticate, async (req, res) => {
    try {
        // Buscamos solo los personajes que pertenecen al ID del usuario del token
        const chars = await Character.find({ userId: req.userId });
        res.json(chars);
    } catch (error) {
        console.error("Error al obtener personajes:", error);
        res.status(500).json({ error: "Error al obtener la lista de personajes" });
    }
});

// OBTENER UN SOLO PERSONAJE (Para el modo edición)
app.get('/api/characters/:id', authenticate, async (req, res) => {
    try {
        const char = await Character.findOne({ _id: req.params.id, userId: req.userId });
        if (!char) return res.status(404).json({ error: "No encontrado" });
        res.json(char);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener el personaje" });
    }
});

// ACTUALIZAR PERSONAJE (PUT)
app.put('/api/characters/:id', authenticate, async (req, res) => {
    try {
        const updated = await Character.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            req.body,
            { returnDocument: 'after' }
        );
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar" });
    }
});

// CREAR PERSONAJE (POST) - Simplificado
app.post('/api/characters', authenticate, async (req, res) => {
    try {
        // IMPORTANTE: Forzamos que el userId sea el que viene del token (req.userId)
        const newChar = new Character({ 
            ...req.body, 
            userId: req.userId 
        });
        await newChar.save();
        res.status(201).json(newChar);
    } catch (error) {
        console.error("Error al crear:", error);
        res.status(500).json({ error: "Error al guardar" });
    }
});

// ELIMINAR PERSONAJE (DELETE)
app.delete('/api/characters/:id', authenticate, async (req, res) => {
    try {
        const deleted = await Character.findOneAndDelete({ 
            _id: req.params.id, 
            userId: req.userId 
        });

        if (!deleted) {
            return res.status(404).json({ error: "Personaje no encontrado o no tienes permiso" });
        }

        res.json({ message: "Leyenda eliminada correctamente" });
    } catch (error) {
        console.error("Error al eliminar personaje:", error);
        res.status(500).json({ error: "Error interno al eliminar el personaje" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en el puerto ${PORT}`));
// Nuevo Modelo de Partida
const gameSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    charId: { type: mongoose.Schema.Types.ObjectId, ref: 'Character', required: true },
    charName: String,
    charImage: String,
    health: { type: Number, default: 100 },
    energy: { type: Number, default: 30 },
    lastRegenTime: { type: Date, default: Date.now },
    messages: [{ role: String, content: String }],
    missions: [String],
    inventory: [String],
    date: { type: Date, default: Date.now }
});
const Game = mongoose.model('Game', gameSchema);

// RUTAS DE PARTIDAS

// Obtener todas las partidas del usuario
app.get('/api/games', authenticate, async (req, res) => {
    try {
        const games = await Game.find({ userId: req.userId }).sort({ date: -1 });
        res.json(games);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener partidas" });
    }
});

// Crear una nueva partida
app.post('/api/games', authenticate, async (req, res) => {
    try {
        const newGame = new Game({ ...req.body, userId: req.userId });
        await newGame.save();
        res.status(201).json(newGame);
    } catch (error) {
        res.status(500).json({ error: "Error al crear partida" });
    }
});

// Actualizar partida (Autoguardado)
app.put('/api/games/:id', authenticate, async (req, res) => {
    try {
        const updated = await Game.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            req.body,
            { returnDocument: 'after' }
        );
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: "Error al guardar progreso" });
    }
});

// Eliminar partida
app.delete('/api/games/:id', authenticate, async (req, res) => {
    try {
        await Game.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        res.json({ message: "Partida eliminada" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar" });
    }
});
// Obtener una partida específica
app.get('/api/games/:id', authenticate, async (req, res) => {
    try {
        const game = await Game.findOne({ _id: req.params.id, userId: req.userId });
        if (!game) return res.status(404).json({ error: "Partida no encontrada" });
        res.json(game);
    } catch (error) {
        res.status(400).json({ error: "ID de partida inválido" });
    }
});