import { Navigate, Outlet } from "react-router-dom"
import { jwtDecode } from "jwt-decode"
import api from "../api"
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../constants"
import { useState, useEffect } from "react"

// perfil: "barbeiro" ou "cliente"; sem perfil, basta estar autenticado
function ProtectedRoute({ children, perfil }) {
    const [status, setStatus] = useState(null);

    useEffect(() => {
        auth().catch(() => setStatus({ autorizado: false }))
    }, [])

    const perfilDoToken = (token) => (jwtDecode(token).is_barber ? "barbeiro" : "cliente")

    const refreshToken = async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN)
        if (!refreshToken) {
            setStatus({ autorizado: false })
            return
        }
        try {
            const res = await api.post("api/v1/authentication/token/refresh/", {
                refresh: refreshToken,
            });
            if (res.status === 200) {
                localStorage.setItem(ACCESS_TOKEN, res.data.access)
                setStatus({ autorizado: true, perfil: perfilDoToken(res.data.access) })
            } else {
                setStatus({ autorizado: false })
            }
        } catch (error) {
            console.log(error)
            setStatus({ autorizado: false })
        }
    }

    const auth = async () => {
        const token = localStorage.getItem(ACCESS_TOKEN)
        if (!token) {
            setStatus({ autorizado: false })
            return
        }
        const decoded = jwtDecode(token)
        const now = Date.now() / 1000
        if (decoded.exp < now) {
            await refreshToken()
        } else {
            setStatus({ autorizado: true, perfil: perfilDoToken(token) })
        }
    }

    if (status === null) {
        return <div>Carregando...</div>
    }
    if (!status.autorizado) {
        return <Navigate to="/login" replace />
    }
    if (perfil && status.perfil !== perfil) {
        return <Navigate to={status.perfil === "barbeiro" ? "/barbeiro" : "/cliente"} replace />
    }
    return children ?? <Outlet />
}
export default ProtectedRoute
