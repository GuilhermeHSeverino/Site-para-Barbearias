import NotificacoesBarbeiro from "./barbeiro/notificacoes/NotificacoesBarbeiro";
import PerfilPublicoBarbeiro from "./barbeiro/perfil-publico/PerfilPublicoBarbeiro";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import "bootstrap/dist/css/bootstrap.min.css";
import ProtectedRoute from "./componentes-comuns/ProtectedRoute";
import Cliente from "./cliente/inicio/Cliente";
import AgendarServico from "./cliente/agendamento/AgendarServico";
import EnviarFeedback from "./cliente/avaliacao/EnviarFeedback";
import MeusAgendamentos from "./cliente/historico/MeusAgendamentos";
import MenuBarbeiro from "./barbeiro/menu/MenuBarbeiro";
import AgendaBarbeiro from "./barbeiro/agenda/AgendaBarbeiro";
import EstoqueBarbeiro from "./barbeiro/estoque/EstoqueBarbeiro";
import FeedbacksBarbeiro from "./barbeiro/feedbacks/FeedbacksBarbeiro";
import FinancasBarbeiro from "./barbeiro/financas/FinancasBarbeiro";
import ServicosBarbeiro from "./barbeiro/servicos/ServicosBarbeiro";
import ClientesBarbeiro from "./barbeiro/clientes/ClientesBarbeiro";
import PerfilClienteBarbeiro from "./barbeiro/clientes/PerfilClienteBarbeiro";
import ConfiguracoesBarbeiro from "./barbeiro/configuracoes/ConfiguracoesBarbeiro";
import ClienteLayout from "./cliente/layout/ClienteLayout";
import LojaCliente from "./cliente/loja/LojaCliente";
import PedidosLojaCliente from "./cliente/pedidos/PedidosLojaCliente";
import NotificacoesCliente from "./cliente/notificacoes/NotificacoesCliente";
import BarberLayout from "./barbeiro/layout/BarberLayout";

function App() {
    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />

                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route element={<ProtectedRoute perfil="cliente" />}>
                        <Route path="/cliente" element={<Cliente />} />
                        <Route
                            path="/cliente/agendar"
                            element={
                                <ClienteLayout>
                                    <AgendarServico />
                                </ClienteLayout>
                            }
                        />
                        <Route
                            path="/cliente/feedback"
                            element={
                                <ClienteLayout>
                                    <EnviarFeedback />
                                </ClienteLayout>
                            }
                        />
                        <Route
                            path="/cliente/historico"
                            element={
                                <ClienteLayout>
                                    <MeusAgendamentos />
                                </ClienteLayout>
                            }
                        />
                        <Route
                            path="/cliente/loja"
                            element={
                                <ClienteLayout>
                                    <LojaCliente />
                                </ClienteLayout>
                            }
                        />
                        <Route
                            path="/cliente/pedidos"
                            element={
                                <ClienteLayout>
                                    <PedidosLojaCliente />
                                </ClienteLayout>
                            }
                        />
                        <Route
                            path="/cliente/notificacoes"
                            element={
                                <ClienteLayout>
                                    <NotificacoesCliente />
                                </ClienteLayout>
                            }
                        />
                    </Route>

                    <Route element={<ProtectedRoute perfil="barbeiro" />}>
                        <Route
                            path="/barbeiro/"
                            element={
                                <BarberLayout>
                                    <MenuBarbeiro />
                                </BarberLayout>
                            }
                        />
                        <Route
                            path="/barbeiro/agenda"
                            element={
                                <BarberLayout>
                                    <AgendaBarbeiro />
                                </BarberLayout>
                            }
                        />
                        <Route
                            path="/barbeiro/clientes"
                            element={
                                <BarberLayout>
                                    <ClientesBarbeiro />
                                </BarberLayout>
                            }
                        />
                        <Route
                            path="/barbeiro/clientes/:id"
                            element={
                                <BarberLayout>
                                    <PerfilClienteBarbeiro />
                                </BarberLayout>
                            }
                        />
                        <Route
                            path="/barbeiro/estoque"
                            element={
                                <BarberLayout>
                                    <EstoqueBarbeiro />
                                </BarberLayout>
                            }
                        />
                        <Route
                            path="/barbeiro/feedbacks"
                            element={
                                <BarberLayout>
                                    <FeedbacksBarbeiro />
                                </BarberLayout>
                            }
                        />
                        <Route
                            path="/barbeiro/financas"
                            element={
                                <BarberLayout>
                                    <FinancasBarbeiro />
                                </BarberLayout>
                            }
                        />
                        <Route
                            path="/barbeiro/servicos"
                            element={
                                <BarberLayout>
                                    <ServicosBarbeiro />
                                </BarberLayout>
                            }
                        />
                        <Route
                            path="/barbeiro/configuracoes"
                            element={
                                <BarberLayout>
                                    <ConfiguracoesBarbeiro />
                                </BarberLayout>
                            }
                        />
                        <Route
                            path="/barbeiro/notificacoes"
                            element={
                                <BarberLayout>
                                    <NotificacoesBarbeiro />
                                </BarberLayout>
                            }
                        />
                        <Route
                            path="/barbeiro/perfil-publico"
                            element={
                                <BarberLayout>
                                    <PerfilPublicoBarbeiro />
                                </BarberLayout>
                            }
                        />
                    </Route>
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;
