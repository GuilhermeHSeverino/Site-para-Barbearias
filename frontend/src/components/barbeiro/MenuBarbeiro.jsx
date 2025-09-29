import { Link } from "react-router-dom";
import "./MenuCliente.css"; // mesmo CSS do cliente, mantém o padrão

function MenuBarbeiro() {
    const opcoes = [
        { nome: "Dashboard", imagem: "https://img.icons8.com/ios-filled/100/ffffff/speed.png", rota: "/barbeiro/dashboard" },
        { nome: "Agenda", imagem: "https://img.icons8.com/ios-filled/100/ffffff/calendar.png", rota: "/barbeiro/agenda" },
        { nome: "Feedbacks", imagem: "https://img.icons8.com/ios-filled/100/ffffff/feedback.png", rota: "/barbeiro/feedbacks" },
        { nome: "Finanças", imagem: "https://img.icons8.com/ios-filled/100/ffffff/money.png", rota: "/barbeiro/financas" },
        { nome: "Estoque", imagem: "https://img.icons8.com/?size=100&id=ZMPdx6W4ncKR&format=png&color=000000", rota: "/barbeiro/estoque" },
    ];

    return (
        <div
            className="min-vh-100 position-relative"
            style={{
                background: "linear-gradient(to bottom right, #0d0d0d, #1a1a1a)",
                overflowX: "hidden",
            }}
        >
            <div className="d-flex flex-column align-items-center justify-content-start py-5 position-relative" style={{ zIndex: 2 }}>
                <h1 className="fw-bold text-white mt-5 mb-3 display-5 text-shadow-lg">
                    Bem-vindo, Barbeiro!
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

export default MenuBarbeiro;
