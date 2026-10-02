import { Link, useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";

function Header() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        navigate("/login");
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="container px-4 px-lg-5 d-flex justify-content-between">

                {/* Botão de Login */}
                <Link to="/login" className="btn btn-outline-dark">
                    Login
                </Link>

                {/* Botão de Logout */}
                <button onClick={handleLogout} className="btn btn-danger">
                    Logout
                </button>

            </div>
        </nav>
    );
}

export default Header;