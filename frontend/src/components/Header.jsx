import { Link } from "react-router-dom"
function Header() {
    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="container px-4 px-lg-5">
                <Link to="/login" className="btn btn-outline-dark" type="button">Login</Link>
            </div>
        </nav>

    )
}
export default Header;