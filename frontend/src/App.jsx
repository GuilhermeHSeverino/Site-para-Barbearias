import NotificacoesBarbeiro from './components/barbeiro/NotificacoesBarbeiro';
import PerfilPublicoBarbeiro from './components/barbeiro/PerfilPublicoBarbeiro';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login'
import Register from './pages/Register'
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
import FeedbacksBarbeiro from './components/barbeiro/FeedbacksBarbeiro';
import FinancasBarbeiro from './components/barbeiro/FinancasBarbeiro';
import ServicosBarbeiro from './components/barbeiro/ServicosBarbeiro';
import ClientesBarbeiro from './components/barbeiro/ClientesBarbeiro';
import PerfilClienteBarbeiro from './components/barbeiro/PerfilClienteBarbeiro';
import ConfiguracoesBarbeiro from './components/barbeiro/ConfiguracoesBarbeiro';
import ClienteLayout from './components/cliente/ClienteLayout';
import LojaCliente from './components/cliente/LojaCliente';
import PedidosLojaCliente from './components/cliente/PedidosLojaCliente';
import BarberLayout from './components/barbeiro/BarberLayout';


function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/cliente" element={<Cliente />} />
          <Route path="/cliente/agendar" element={<ClienteLayout><AgendarServico /></ClienteLayout>} />
          <Route path="/cliente/feedback" element={<ClienteLayout><EnviarFeedback /></ClienteLayout>} />
          <Route path="/cliente/historico" element={<ClienteLayout><MeusAgendamentos /></ClienteLayout>} />
          <Route path="/cliente/loja" element={<ClienteLayout><LojaCliente /></ClienteLayout>} />
          <Route path="/cliente/pedidos" element={<ClienteLayout><PedidosLojaCliente /></ClienteLayout>} />

          <Route path="/barbeiro/" element={<BarberLayout><MenuBarbeiro /></BarberLayout>} />
          <Route path="/barbeiro/agenda" element={<BarberLayout><AgendaBarbeiro /></BarberLayout>} />
          <Route path="/barbeiro/clientes" element={<BarberLayout><ClientesBarbeiro /></BarberLayout>} />
          <Route path="/barbeiro/clientes/:id" element={<BarberLayout><PerfilClienteBarbeiro /></BarberLayout>} />
          <Route path="/barbeiro/estoque" element={<BarberLayout><EstoqueBarbeiro /></BarberLayout>} />
          <Route path="/barbeiro/feedbacks" element={<BarberLayout><FeedbacksBarbeiro /></BarberLayout>} />
          <Route path="/barbeiro/financas" element={<BarberLayout><FinancasBarbeiro /></BarberLayout>} />
          <Route path="/barbeiro/servicos" element={<BarberLayout><ServicosBarbeiro /></BarberLayout>} />
          <Route path="/barbeiro/configuracoes" element={<BarberLayout><ConfiguracoesBarbeiro /></BarberLayout>} />
            <Route path="/barbeiro/notificacoes" element={<BarberLayout><NotificacoesBarbeiro /></BarberLayout>} />
            <Route path="/barbeiro/perfil-publico" element={<BarberLayout><PerfilPublicoBarbeiro /></BarberLayout>} />

        </Routes>
      </BrowserRouter>

    </>
  )
}

export default App