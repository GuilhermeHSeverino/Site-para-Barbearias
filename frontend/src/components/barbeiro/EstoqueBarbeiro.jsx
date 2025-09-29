import { useState, useEffect } from "react";
import api from "../../api";
import { ACCESS_TOKEN } from "../../constants";

function EstoqueBarbeiro() {
    const [produtos, setProdutos] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduto, setEditingProduto] = useState(null);
    const [form, setForm] = useState({
        name: "",
        description: "",
        price: "",
        quantity: "",
    });

    const token = localStorage.getItem(ACCESS_TOKEN);

    useEffect(() => {
        fetchProdutos();
    }, []);

    const fetchProdutos = async () => {
        try {
            const res = await api.get("/api/v1/stock/", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setProdutos(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const openModal = (produto = null) => {
        setEditingProduto(produto);
        if (produto) {
            setForm({
                name: produto.product?.name || "",
                description: produto.product?.description || "",
                price: produto.product?.price || "",
                quantity: produto.quantity || "",
            });
        } else {
            setForm({ name: "", description: "", price: "", quantity: "" });
        }
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingProduto(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProduto) {
                // Editar produto
                await api.put(`/api/v1/products/${editingProduto.product.id}/`, {
                    name: form.name,
                    description: form.description,
                    price: parseFloat(form.price),
                }, { headers: { Authorization: `Bearer ${token}` } });

                await api.put(`/api/v1/stock/${editingProduto.id}/`, {
                    quantity: parseInt(form.quantity),
                }, { headers: { Authorization: `Bearer ${token}` } });
            } else {
                // Adicionar produto
                const resProd = await api.post("/api/v1/products/", {
                    name: form.name,
                    description: form.description,
                    price: parseFloat(form.price),
                }, { headers: { Authorization: `Bearer ${token}` } });

                await api.post("/api/v1/stock/", {
                    product: resProd.data.id,
                    quantity: parseInt(form.quantity),
                }, { headers: { Authorization: `Bearer ${token}` } });
            }

            fetchProdutos();
            closeModal();
        } catch (err) {
            console.error(err);
            alert("Erro ao salvar o produto");
        }
    };

    const handleDelete = async (produto) => {
        if (!window.confirm("Tem certeza que deseja deletar este produto?")) return;
        try {
            await api.delete(`/api/v1/stock/${produto.id}/`, { headers: { Authorization: `Bearer ${token}` } });
            // Opcional: deletar produto também se quiser
            // await api.delete(`/api/v1/products/${produto.product.id}/`, { headers: { Authorization: `Bearer ${token}` } });
            fetchProdutos();
        } catch (err) {
            console.error(err);
            alert("Erro ao deletar o produto");
        }
    };

    return (
        <div className="container py-5 text-white" style={{ backgroundColor: "#121212", minHeight: "100vh" }}>
            <h2 className="text-center mb-4 fw-bold">Estoque</h2>

            <div className="text-center mb-4">
                <button
                    className="btn btn-success"
                    onClick={() => openModal()}
                >
                    Adicionar Produto
                </button>
            </div>

            {produtos.length === 0 ? (
                <p className="text-center fs-5 text-muted">Nenhum produto cadastrado.</p>
            ) : (
                <div className="row g-4">
                    {produtos.map((stock) => (
                        <div key={stock.id} className="col-12 col-md-6 col-lg-4">
                            <div className="p-3 rounded-4 shadow" style={{ backgroundColor: "#2A2A3D" }}>
                                <p className="mb-1"><strong>Produto:</strong> {stock.product?.name || "Produto não encontrado"}</p>
                                <p className="mb-1"><strong>Descrição:</strong> {stock.product?.description || "-"}</p>
                                <p className="mb-1"><strong>Quantidade:</strong> {stock.quantity ?? 0}</p>
                                <p className="mb-1"><strong>Preço:</strong> R$ {stock.product?.price?.toFixed(2) ?? "0.00"}</p>
                                <div className="mt-2 d-flex justify-content-between">
                                    <button className="btn btn-warning btn-sm" onClick={() => openModal(stock)}>Editar</button>
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(stock)}>Deletar</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {modalOpen && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                    style={{ backgroundColor: "rgba(0,0,0,0.8)", zIndex: 9999 }}
                >
                    <div className="bg-dark p-5 rounded-4 shadow" style={{ width: "90%", maxWidth: "500px" }}>
                        <h3 className="text-white mb-4">{editingProduto ? "Editar Produto" : "Adicionar Produto"}</h3>
                        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                            <input
                                type="text"
                                placeholder="Nome"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="form-control"
                                required
                            />
                            <textarea
                                placeholder="Descrição"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="form-control"
                                rows={3}
                                required
                            />
                            <input
                                type="number"
                                placeholder="Preço"
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: e.target.value })}
                                className="form-control"
                                step="0.01"
                                required
                            />
                            <input
                                type="number"
                                placeholder="Quantidade"
                                value={form.quantity}
                                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                                className="form-control"
                                required
                            />
                            <div className="d-flex justify-content-end gap-2 mt-3">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">{editingProduto ? "Salvar" : "Adicionar"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EstoqueBarbeiro;
