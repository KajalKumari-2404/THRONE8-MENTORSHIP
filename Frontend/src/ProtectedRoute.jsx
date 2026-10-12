import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
const token = sessionStorage.getItem("throne8Token");

if (!token) {
return <Navigate to="/login" replace />;
}

return <Outlet />;
}
