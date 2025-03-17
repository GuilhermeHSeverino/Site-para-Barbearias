import api from "../../api"
import { useState, useEffect } from "react"
function Servico() {
    const [servico, setServico] = useState([]);

    useEffect(() => {
        getServicos();
    }, []);

    const getServicos = () => {
        api.get("/api/v1/services")
            .then((res) => {
                const data = res.data;
                setServico(data)
            }).catch((err) => alert(err));
    };

    return (
        <div>
            {
                servico.map((servico) => (
                    <div className="col mb-5" key={servico.id}>
                        <div className="card h-100 bg-dark text-white">
                            <div className="position-relative p-2" style={{ backgroundColor: '#fff' }}>
                            </div>
                            <div className="card-body p-3 bg-secondary">
                                <div className="text-center">
                                    <h5 className="fw-bolder">{servico.name}</h5>
                                    <p>R$ {servico.price}</p>
                                </div>
                                <div className="text-center">
                                    <p>Duração  {servico.duration}</p>
                                </div>

                            </div>

                        </div>
                    </div>))}
        </div>
    )
}


export default Servico;