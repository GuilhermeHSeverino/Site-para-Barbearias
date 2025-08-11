import Header from "../components/Header"
import Servicos from "../components/home/Servicos"
import MenuCliente from "../components/cliente/MenuCliente";

function Cliente() {
    return (

        <div className="bg-dark text-white" style={{ minHeight: "100vh" }}>
            <div>
                <Header />
                <MenuCliente />

            </div>
        </div >
    )
}

export default Cliente;