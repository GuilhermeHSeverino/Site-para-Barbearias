import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { ACCESS_TOKEN } from "../../constants";
import "./../../assets/financeiro.css";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";

const LABELS_PAGAMENTO = {
    dinheiro: "Dinheiro",
    cartao_credito: "Cartão de Crédito",
    cartao_debito: "Cartão de Débito",
    pix: "Pix",
};

const FILTROS = [
    { value: "diario", label: "Diário" },
    { value: "semanal", label: "Semanal" },
    { value: "mensal", label: "Mensal" },
    { value: "anual", label: "Anual" },
];

const CORES_PIZZA = ["#22c55e", "#3b82f6", "#facc15", "#ef4444", "#a855f7", "#14b8a6", "#f97316"];

export default function FinancasBarbeiro() {
    const [financas, setFinancas] = useState([]);
    const [faturamento, setFaturamento] = useState(0);
    const [saidas, setSaidas] = useState(0);
    const [saldo, setSaldo] = useState(0);
    const [linha, setLinha] = useState([]);
    const [barras, setBarras] = useState([]);
    const [filtro, setFiltro] = useState("mensal");
    const [porPagamento, setPorPagamento] = useState([]);
    const [porServico, setPorServico] = useState([]);

    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        carregarTudo();
    }, [filtro]);

    const carregarTudo = async () => {
        setCarregando(true);
        setErro("");
        try {
            const res = await api.get(`/api/v1/finance/?periodo=${filtro}`);
            const saldoRes = await api.get(`/api/v1/finance-saldo/?periodo=${filtro}`);

            const dados = res.data;
            setFinancas(dados);

            let entradas = 0;
            let saidasTotal = 0;

            const mapaDias = {};
            const mapaPagamento = {};
            const mapaServico = {};

            dados.forEach((f) => {
                const valor = parseFloat(f.valor);

                if (f.tipo === "entrada") {
                    entradas += valor;

                    const dia = new Date(f.date).toLocaleDateString("pt-BR");
                    mapaDias[dia] = (mapaDias[dia] || 0) + valor;

                    const metodo = f.payment_method || "nao_informado";
                    mapaPagamento[metodo] = (mapaPagamento[metodo] || 0) + valor;

                    if (f.service_name) {
                        mapaServico[f.service_name] = (mapaServico[f.service_name] || 0) + 1;
                    }
                } else {
                    saidasTotal += valor;
                }
            });

            setFaturamento(entradas);
            setSaidas(saidasTotal);
            setSaldo(entradas - saidasTotal);

            setLinha(
                saldoRes.data.map((i) => ({
                    date: new Date(i.date).toLocaleDateString("pt-BR"),
                    saldo: i.saldo_acumulado,
                }))
            );

            setBarras(
                Object.keys(mapaDias).map((dia) => ({
                    dia,
                    valor: mapaDias[dia],
                }))
            );

            setPorPagamento(
                Object.keys(mapaPagamento)
                    .map((metodo) => ({
                        metodo,
                        label: LABELS_PAGAMENTO[metodo] || "Não informado",
                        valor: mapaPagamento[metodo],
                    }))
                    .sort((a, b) => b.valor - a.valor)
            );

            setPorServico(
                Object.keys(mapaServico)
                    .map((nome) => ({ name: nome, value: mapaServico[nome] }))
                    .sort((a, b) => b.value - a.value)
            );
        } catch (err) {
            console.error(err);
            setErro("Não foi possível carregar os dados financeiros.");
        } finally {
            setCarregando(false);
        }
    };

    const formatar = (v) =>
        v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    const totalCortes = porServico.reduce((acc, s) => acc + s.value, 0);

    return (
        <div className="financeiro-container">

            {/* HEADER */}
            <div className="financeiro-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button className="btn-voltar" onClick={() => navigate("/barbeiro/")}>
                        ← Voltar
                    </button>
                    <div>
                        <h1 style={{ margin: 0 }}>💰 Financeiro</h1>
                        <p className="financeiro-subtitle">Acompanhe seu faturamento e saldo</p>
                    </div>
                </div>

                <div className="filtros">
                    {FILTROS.map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setFiltro(f.value)}
                            className={`filtro-pill ${filtro === f.value ? "ativo" : ""}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {erro && <div className="erro-msg">{erro}</div>}

            {/* CARDS */}
            <div className="cards">
                <div className="card">
                    <p>Faturamento</p>
                    <h2 className="green">{carregando ? "—" : formatar(faturamento)}</h2>
                </div>

                <div className="card">
                    <p>Saídas</p>
                    <h2 className="red">{carregando ? "—" : formatar(saidas)}</h2>
                </div>

                <div className="card">
                    <p>Saldo</p>
                    <h2 className={saldo < 0 ? "red" : "green"}>{carregando ? "—" : formatar(saldo)}</h2>
                </div>
            </div>

            {/* GRÁFICOS */}
            <div className="graficos">

                <div className="grafico">
                    <p>Evolução</p>
                    {carregando ? (
                        <p className="estado-msg">Carregando...</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={linha}>
                                <CartesianGrid stroke="#2a2a2a" />
                                <XAxis dataKey="date" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip
                                    contentStyle={{ background: "#17181a", border: "1px solid #303030" }}
                                />
                                <Line dataKey="saldo" stroke="#22c55e" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="grafico">
                    <p>Faturamento por dia</p>
                    {carregando ? (
                        <p className="estado-msg">Carregando...</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={barras}>
                                <CartesianGrid stroke="#2a2a2a" />
                                <XAxis dataKey="dia" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip
                                    contentStyle={{ background: "#17181a", border: "1px solid #303030" }}
                                />
                                <Bar dataKey="valor" fill="#22c55e" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

            </div>

            {/* SERVIÇOS MAIS REALIZADOS (PIZZA) + FORMAS DE PAGAMENTO */}
            <div className="graficos">

                <div className="grafico">
                    <p>Tipos de corte no período ({totalCortes} no total)</p>
                    {carregando ? (
                        <p className="estado-msg">Carregando...</p>
                    ) : porServico.length === 0 ? (
                        <p className="estado-msg">Nenhum corte concluído no período.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie
                                    data={porServico}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={85}
                                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {porServico.map((_, index) => (
                                        <Cell key={index} fill={CORES_PIZZA[index % CORES_PIZZA.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: "#17181a", border: "1px solid #303030" }}
                                    formatter={(value, name) => [`${value} corte(s)`, name]}
                                />
                                <Legend
                                    wrapperStyle={{ fontSize: 13, color: "#9ca3af" }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="grafico">
                    <p>Formas de pagamento</p>

                    {carregando ? (
                        <p className="estado-msg">Carregando...</p>
                    ) : porPagamento.length === 0 ? (
                        <p className="estado-msg">Nenhuma entrada no período.</p>
                    ) : (
                        <div className="pagamento-lista">
                            {porPagamento.map((p) => {
                                const percentual = faturamento > 0 ? (p.valor / faturamento) * 100 : 0;
                                return (
                                    <div key={p.metodo} className="pagamento-item">
                                        <div className="pagamento-topo">
                                            <span>{p.label}</span>
                                            <strong>{formatar(p.valor)}</strong>
                                        </div>
                                        <div className="pagamento-barra-fundo">
                                            <div
                                                className="pagamento-barra-preenchida"
                                                style={{ width: `${percentual}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>

            {/* HISTÓRICO */}
            <div className="historico">
                <h2>Histórico</h2>

                {carregando ? (
                    <p className="estado-msg">Carregando histórico...</p>
                ) : financas.length === 0 ? (
                    <p className="estado-msg">Nenhuma movimentação encontrada.</p>
                ) : (
                    financas.map((f) => (
                        <div key={f.id} className="item">
                            <div>
                                <p>{new Date(f.date).toLocaleDateString()}</p>
                                <small>{f.descricao}</small>
                            </div>

                            <span className="item-pagamento">
                                {f.payment_method ? LABELS_PAGAMENTO[f.payment_method] : "—"}
                            </span>

                            <p className={f.tipo === "entrada" ? "green" : "red"}>
                                {formatar(parseFloat(f.valor))}
                            </p>
                        </div>
                    ))
                )}
            </div>

        </div>
    );
}