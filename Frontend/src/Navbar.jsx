
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem("throne8Token");
    sessionStorage.removeItem("throne8User");
    navigate("/login", { replace: true });
  };

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "15px 25px",
        background: "#25213b",
        color: "white",
      }}
    >
      <h2 style={{ margin: 0 }}>THRONE8</h2>

      <button
        onClick={handleLogout}
        style={{
          padding: "9px 18px",
          border: "none",
          borderRadius: "8px",
          background: "#ef4444",
          color: "white",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Logout
      </button>
    </nav>
  );
}