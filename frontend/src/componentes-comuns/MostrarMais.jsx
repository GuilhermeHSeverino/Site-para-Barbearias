import "./mostrarMais.css";

// Botão para listas longas: mostra mais itens a cada clique.
export default function MostrarMais({ total, visiveis, passo = 10, onMostrar }) {
    if (total <= visiveis) return null;
    const restantes = total - visiveis;
    return (
        <button className="botao-mostrar-mais" onClick={() => onMostrar(visiveis + passo)}>
            Mostrar mais ({restantes} restante{restantes > 1 ? "s" : ""})
        </button>
    );
}
