import Header from "../components/Header"
import Servicos from "../components/home/Servicos"

function Home() {
    return (

        <div className="bg-dark text-white" style={{ minHeight: "100vh" }}>
            <div>
                <Header />

                <Servicos />
            </div>
        </div >
    )
}

export default Home;