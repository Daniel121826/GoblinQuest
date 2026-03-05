import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom' // Importamos el router
import './App.css'
import Home from './views/Home'
import Characters from './views/Characters' // Asegúrate de crear este archivo
import CreateCharacter from './views/CreateCharacter'
import Partidas from './views/Partidas'
import GameRoom from './views/GameRoom'
import Contacto from './views/Contacto'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/personajes" element={<Characters />} />
        <Route path="/crear-personaje" element={<CreateCharacter />} />
        <Route path="/characters" element={<Characters />} />
        <Route path="/partidas" element={<Partidas />} />
        <Route path="/partida/:gameId" element={<GameRoom />} />
        <Route path="/contacto/" element={<Contacto />} />
        <Route path="/editar-personaje/:id" element={<CreateCharacter />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
