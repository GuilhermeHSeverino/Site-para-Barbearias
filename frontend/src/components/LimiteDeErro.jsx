import { Component } from "react";

// Se alguma tela gerar um erro inesperado, mostra uma mensagem em vez de deixar a página em branco.
export default class LimiteDeErro extends Component {
    constructor(props) {
        super(props);
        this.state = { erro: null };
    }

    static getDerivedStateFromError(erro) {
        return { erro };
    }

    componentDidCatch(erro, info) {
        console.error("Erro na tela:", erro, info);
    }

    render() {
        if (!this.state.erro) return this.props.children;
        return (
            <div style={{
                minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: "16px", padding: "24px", background: "#0d0d0d",
                color: "white", textAlign: "center", fontFamily: "'Segoe UI', sans-serif",
            }}>
                <h1 style={{ fontSize: "22px", margin: 0 }}>Algo deu errado nesta tela</h1>
                <p style={{ color: "#9ca3af", margin: 0, maxWidth: "360px" }}>
                    Tente recarregar a página. Se o problema continuar, saia e entre novamente na sua conta.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        background: "#22c55e", color: "#0d0d0d", border: "none", borderRadius: "10px",
                        padding: "12px 20px", fontWeight: 700, cursor: "pointer",
                    }}
                >
                    Recarregar
                </button>
            </div>
        );
    }
}
