import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles }) {
  const token = sessionStorage.getItem("throne8Token");
  const storedUser = sessionStorage.getItem("throne8User");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  let user;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  if (!user?.role) {
    sessionStorage.removeItem("throne8Token");
    sessionStorage.removeItem("throne8User");
    return <Navigate to="/login" replace />;
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(user.role.toUpperCase())
  ) {
    const role = user.role.toUpperCase();

    if (role === "ADMIN") {
      return <Navigate to="/admin" replace />;
    }
    if (role === "MENTOR") {
  return <Navigate to="/mentor/dashboard" replace />;
}

    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
