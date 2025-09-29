import react from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login'
import Home from './pages/Home'
import 'bootstrap/dist/css/bootstrap.min.css';
import ProtectedRoute from "./components/ProtectedRoute"
import Cliente from './pages/Cliente';
import AgendarServico from './components/cliente/AgendarServico';
import EnviarFeedback from './components/cliente/EnviarFeedback';
import MeusAgendamentos from './components/cliente/MeusAgendamentos';
import MenuBarbeiro from './components/barbeiro/MenuBarbeiro';
import AgendaBarbeiro from './components/barbeiro/AgendaBarbeiro';
import EstoqueBarbeiro from './components/barbeiro/EstoqueBarbeiro';
import Feedbacks from './components/barbeiro/Feedbacks';



// function Logout() {
//   localStorage.clear()
//   return <Navigate to="/login" />
// }
// function RegisterAndLogout() {
//   localStorage.clear()
//   return <Register />
// }
function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />

          <Route path="/login" element={<Login />} />

          <Route path="/cliente" element={<Cliente />} />
          <Route path="/cliente/agendar" element={<AgendarServico />} />
          <Route path="/cliente/feedback" element={<EnviarFeedback />} />
          <Route path="/cliente/historico" element={<MeusAgendamentos />} />
          <Route path="/barbeiro/" element={<MenuBarbeiro />} />
          <Route path="/barbeiro/agenda" element={<AgendaBarbeiro />} />
          <Route path="/barbeiro/estoque" element={<EstoqueBarbeiro />} />
          <Route path="/barbeiro/feedbacks" element={<Feedbacks />} />

        </Routes>
      </BrowserRouter>

    </>
  )
}

export default App
