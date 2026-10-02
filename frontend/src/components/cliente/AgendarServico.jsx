import { useEffect, useState } from "react";
import api from "../../api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ACCESS_TOKEN } from "../../constants";
import "./clienteFlow.css";

export default function AgendarServico() {
  const [etapa, setEtapa] = useState(1);
  const [barbeiros, setBarbeiros] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [barbeiro, setBarbeiro] = useState("");
  const [servico, setServico] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [horarios, setHorarios] = useState([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [atualizacaoHorarios, setAtualizacaoHorarios] = useState(0);
  const [entrandoEspera, setEntrandoEspera] = useState(false);
  const [mensagemEspera, setMensagemEspera] = useState("");
  const [deslocamentoDatas, setDeslocamentoDatas] = useState(0);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const agendamentoOriginal = searchParams.get("reagendar");
  const barbeiroInicial = searchParams.get("barber");
  const servicoInicial = searchParams.get("service");

  const formatarDataISO = (date) => {
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const dia = String(date.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  };

  const datasDisponiveis = Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + deslocamentoDatas + index);
    return {
      valor: formatarDataISO(date),
      dia: date.toLocaleDateString("pt-BR", { day: "2-digit" }),
      mes: date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      semana: index === 0 ? "Hoje" : date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
    };
  });

  useEffect(() => {
    api.get("/api/v1/barber/").then((res) => {
      setBarbeiros(res.data);
      if (barbeiroInicial) setBarbeiro(Number(barbeiroInicial));
    });
  }, [barbeiroInicial]);

  useEffect(() => {
    if (barbeiro) {
      setLoadingServices(true);
      api.get(`/api/v1/services/?barber_id=${barbeiro}`)
        .then((res) => {
          setServicos(res.data);
          setServico(servicoInicial ? Number(servicoInicial) : "");
        })
        .catch(() => alert("Erro ao carregar serviços deste barbeiro."))
        .finally(() => setLoadingServices(false));
    }
  }, [barbeiro, servicoInicial]);

  useEffect(() => {
    if (!barbeiro || !servico || !data) {
      setHorarios([]);
      return;
    }

    setLoadingHorarios(true);
    setHora("");
    api.get("/api/v1/schedule/availability/", {
      params: { barber_id: barbeiro, service_id: servico, date: data },
    })
      .then((res) => setHorarios(res.data.slots || []))
      .catch(() => setHorarios([]))
      .finally(() => setLoadingHorarios(false));
  }, [barbeiro, servico, data, atualizacaoHorarios]);

  const handleAgendamento = () => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) {
      alert("Você precisa estar logado para agendar.");
      return;
    }

    const body = {
      barber: barbeiro,
      service: servico,
      date: data,
      start_time: hora,
    };
    if (!barbeiro || !servico || !data || !hora) {
      alert("Por favor, preencha todos os campos.");
      return;
    }
    api
      .post("/api/v1/schedule/", body)
      .then(async () => {
        if (agendamentoOriginal) await api.patch(`/api/v1/schedule/${agendamentoOriginal}/cancel/`);
      })
      .then(() => navigate("/cliente/"))
      .catch((err) => {
        const dados = err.response?.data;
        const mensagem = dados?.detail || dados?.date?.[0] || dados?.non_field_errors?.[0] || dados?.client_name?.[0] || err.message;
        alert("Não foi possível confirmar: " + mensagem);
        if (err.response?.status === 400 && data) {
          setHora("");
          setAtualizacaoHorarios((atual) => atual + 1);
        }
      });
  };

  const entrarNaListaDeEspera = async () => {
    setEntrandoEspera(true);
    try {
      await api.post("/api/v1/schedule/waitlist/", { barber: barbeiro, service: servico, date: data });
      setMensagemEspera("Você entrou na lista de espera. Avisaremos quando surgir uma possibilidade.");
    } catch (error) {
      setMensagemEspera(error.response?.data?.detail || "Não foi possível entrar na lista de espera.");
    } finally {
      setEntrandoEspera(false);
    }
  };

  const barbeiroSelecionado = barbeiros.find((item) => item.id === barbeiro);
  const servicoSelecionado = servicos.find((item) => item.id === servico);

  const urlDaFoto = (photo) => {
    if (!photo) return "";
    if (photo.startsWith("http")) return photo;
    return `${import.meta.env.VITE_API_URL}${photo}`;
  };

  return (
    <div className="cliente-fluxo">
      <div className="cliente-fluxo-card">
        <div className="cliente-fluxo-cabecalho">
          <div>
            <h2>Agende seu próximo horário</h2>
            <p>Escolha com calma. Você poderá revisar tudo antes de confirmar.</p>
          </div>
          <span className="cliente-nota">Etapa {etapa} de 4</span>
        </div>

        <div className="cliente-fluxo-etapas">
          {[1, 2, 3, 4].map((item) => <span key={item} className={`cliente-fluxo-etapa ${item <= etapa ? "ativa" : ""}`} />)}
        </div>

        {etapa === 1 && (
          <div>
            <label className="cliente-fluxo-label">Escolha o barbeiro</label>
            <div className="cliente-fluxo-opcoes">
              {barbeiros.length === 0 ? <div className="cliente-fluxo-vazio">Nenhum barbeiro disponível no momento.</div> : barbeiros.map((item) => (
                <button key={item.id} type="button" onClick={() => setBarbeiro(item.id)} className={`cliente-fluxo-opcao ${barbeiro === item.id ? "ativa" : ""}`}>
                  <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ width: "42px", height: "42px", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "#2a2a2a", color: "#4ade80", fontSize: "18px", fontWeight: "700" }}>
                      {item.photo ? <img src={urlDaFoto(item.photo)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : item.name?.[0]?.toUpperCase()}
                    </span>
                    <span><strong>{item.name}</strong><small>Ver serviços disponíveis</small></span>
                  </span>
                </button>
              ))}
            </div>
            <div className="cliente-fluxo-acoes"><span /><button className="cliente-fluxo-botao principal" disabled={!barbeiro} onClick={() => setEtapa(2)}>Continuar →</button></div>
          </div>
        )}

        {etapa === 2 && (
          <div>
            <label className="cliente-fluxo-label">Escolha o serviço de {barbeiroSelecionado?.name}</label>
            <div className="cliente-fluxo-opcoes">
              {loadingServices ? <div className="cliente-fluxo-vazio">Carregando serviços...</div> : servicos.length === 0 ? <div className="cliente-fluxo-vazio">Nenhum serviço disponível para este barbeiro.</div> : servicos.map((item) => (
                <button key={item.id} type="button" onClick={() => setServico(item.id)} className={`cliente-fluxo-opcao ${servico === item.id ? "ativa" : ""}`}>
                  <strong>{item.name}</strong><small>R$ {item.price} · Escolha este serviço</small>
                </button>
              ))}
            </div>
            <div className="cliente-fluxo-acoes"><button className="cliente-fluxo-botao" onClick={() => setEtapa(1)}>← Voltar</button><button className="cliente-fluxo-botao principal" disabled={!servico || loadingServices} onClick={() => setEtapa(3)}>Continuar →</button></div>
          </div>
        )}

        {etapa === 3 && (
          <div>
            <label className="cliente-fluxo-label">Escolha uma data</label>
            <div className="cliente-datas-navegacao">
              <button className="cliente-data-seta" type="button" disabled={deslocamentoDatas === 0} onClick={() => setDeslocamentoDatas((atual) => atual >= 7 ? atual - 7 : 0)} aria-label="Datas anteriores">‹</button>
              <div className="cliente-datas">{datasDisponiveis.map((item) => <button key={item.valor} type="button" className={`cliente-data ${data === item.valor ? "ativa" : ""}`} onClick={() => setData(item.valor)}><strong>{item.dia}</strong><span>{item.mes}</span><small>{item.semana}</small></button>)}</div>
              <button className="cliente-data-seta" type="button" onClick={() => setDeslocamentoDatas((atual) => atual + 7)} aria-label="Próximas datas">›</button>
            </div>
            {data && <div className="cliente-horarios-bloco">
              <label className="cliente-fluxo-label">Horários disponíveis</label>
              {loadingHorarios ? <div className="cliente-fluxo-vazio">Buscando horários para esta data...</div> : horarios.length === 0 ? <div className="cliente-fluxo-vazio">Não encontramos horários livres.<button className="cliente-avaliar" onClick={entrarNaListaDeEspera} disabled={entrandoEspera}>{entrandoEspera ? "Entrando..." : "Entrar na lista de espera"}</button>{mensagemEspera && <small style={{ display: "block", marginTop: "10px" }}>{mensagemEspera}</small>}</div> : <div className="cliente-horarios">{horarios.map((slot) => <button key={slot.time} type="button" className={`cliente-horario ${hora === slot.time ? "ativo" : ""}`} onClick={() => setHora(slot.time)}>{slot.time}</button>)}</div>}
            </div>}
            <div className="cliente-fluxo-acoes"><button className="cliente-fluxo-botao" onClick={() => setEtapa(2)}>← Voltar</button><button className="cliente-fluxo-botao principal" disabled={!data || !hora || loadingHorarios} onClick={() => setEtapa(4)}>Continuar →</button></div>
          </div>
        )}

        {etapa === 4 && (
          <div>
            <label className="cliente-fluxo-label">Revise seu agendamento</label>
            <div style={{ marginTop: "20px", padding: "14px", borderRadius: "10px", background: "#121212", color: "#9ca3af", fontSize: "13px" }}>
              {barbeiroSelecionado?.name} · {servicoSelecionado?.name} · {data.split("-").reverse().join("/")}
            </div>
            <div className="cliente-fluxo-acoes"><button className="cliente-fluxo-botao" onClick={() => setEtapa(3)}>← Voltar</button><button className="cliente-fluxo-botao principal" disabled={!hora} onClick={handleAgendamento}>Confirmar agendamento</button></div>
          </div>
        )}
      </div>
    </div>
  );
}