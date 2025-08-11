import { Link } from "react-router-dom";
import "./MenuCliente.css";

import agendarImg from "./../../assets/images/agendar.png";
import historicoImg from "./../../assets/images/historico.png";
import avaliarImg from "./../../assets/images/avaliar.png";

function MenuCliente() {
  const opcoes = [
    { nome: "Agendar Corte", imagem: agendarImg, rota: "/cliente/agendar" },
    { nome: "Meus Agendamentos", imagem: historicoImg, rota: "/cliente/historico" },
    { nome: "Avaliar Barbearia", imagem: avaliarImg, rota: "/cliente/feedback" },
  ];

  return (
    <div
      className="min-vh-100 position-relative"
      style={{
        background: "linear-gradient(to bottom right, #0d0d0d, #1a1a1a)",
        overflowX: "hidden",
      }}
    >

      {/* Conteúdo principal */}
      <div className="d-flex flex-column align-items-center justify-content-start py-5 position-relative" style={{ zIndex: 2 }}>
        <h1 className="fw-bold text-white mt-5 mb-3 display-5 text-shadow-lg">
          Bem-vindo, Cliente!
        </h1>
        <p className="mb-5 fs-5 text-light text-center" style={{ maxWidth: "600px" }}>
          Escolha uma das opções abaixo para continuar:
        </p>
        <div className="row justify-content-center g-5 px-4 w-100" style={{ maxWidth: "1200px" }}>
          {opcoes.map((opcao, index) => (
            <div className="col-10 col-sm-6 col-md-4 col-lg-3" key={index}>
              <Link to={opcao.rota} className="text-decoration-none text-white">
                <div className="menu-card text-center p-4 rounded-4 shadow card-hover h-100 d-flex flex-column align-items-center justify-content-center">
                  <div className="image-wrapper mb-3">
                    <img
                      src={opcao.imagem}
                      alt={opcao.nome}
                      className="img-fluid rounded-circle"
                    />
                  </div>
                  <h5 className="fw-semibold text-white">{opcao.nome}</h5>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MenuCliente;
