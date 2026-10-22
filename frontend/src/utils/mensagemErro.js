// Transforma o erro de uma requisição à API em uma mensagem clara para o usuário.

const SEM_CONEXAO =
    "Não foi possível falar com o servidor. Confira sua internet; se o sistema ficou um tempo sem uso, " +
    "ele pode levar alguns segundos para acordar. Tente de novo em instantes.";

// mensagem vinda da API: "detail", lista de erros ou o primeiro erro de algum campo
function mensagemDaApi(dados) {
    if (!dados) return "";
    if (typeof dados === "string") return dados.length < 200 && !dados.includes("<") ? dados : "";
    if (Array.isArray(dados)) return dados.length ? String(dados[0]) : "";
    if (typeof dados.detail === "string") return dados.detail;
    if (Array.isArray(dados.detail) && dados.detail.length) return String(dados.detail[0]);
    for (const valor of Object.values(dados)) {
        if (Array.isArray(valor) && valor.length) return String(valor[0]);
        if (typeof valor === "string") return valor;
    }
    return "";
}

export function mensagemDeErro(erro, padrao = "Algo deu errado. Tente novamente.") {
    const resposta = erro?.response;
    if (!resposta) return SEM_CONEXAO;

    const { status, data } = resposta;
    if (status >= 500) return "O servidor encontrou um problema. Tente novamente em alguns instantes.";
    if (status === 401) return "Sua sessão expirou. Saia e entre novamente na sua conta.";

    const daApi = mensagemDaApi(data);
    if (status === 403) return daApi || "Você não tem permissão para fazer isso.";
    if (status === 404) return daApi || "Não encontramos esse registro. Ele pode ter sido removido.";
    return daApi || padrao;
}
