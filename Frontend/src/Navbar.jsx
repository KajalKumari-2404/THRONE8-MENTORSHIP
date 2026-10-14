import { useNavigate } from "react-router-dom";
import "./App.css";

export default function Navbar() {
const navigate = useNavigate();

const handleLogout = () => {
sessionStorage.removeItem("throne8Token");
sessionStorage.removeItem("throne8User");
navigate("/login", { replace: true });
};

return ( <nav className="throne-navbar">
<div
className="throne-navbar-brand"
onClick={() => navigate("/")}
role="button"
tabIndex={0}
onKeyDown={(e) => {
if (e.key === "Enter") navigate("/");
}}
> <span className="throne-navbar-logo">T8</span> <span className="throne-navbar-name">
THRONE<span>8</span> <small>MENTORSHIP PLATFORM</small> </span> </div>

  <div className="throne-navbar-actions">
    <span className="throne-navbar-status">
      <span className="throne-status-dot" />
      Platform Active
    </span>

    <button
      type="button"
      className="throne-logout-button"
      onClick={handleLogout}
    >
      <span aria-hidden="true">↗</span>
      Logout
    </button>
  </div>
</nav>

);
}































// import { useNavigate } from "react-router-dom";

// export default function Navbar() {
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     sessionStorage.removeItem("throne8Token");
//     sessionStorage.removeItem("throne8User");
//     navigate("/login", { replace: true });
//   };

//   return (
//     <nav
//       style={{
//         display: "flex",
//         justifyContent: "space-between",
//         alignItems: "center",
//         padding: "15px 25px",
//         background: "#25213b",
//         color: "white",
//       }}
//     >
//       <h2 style={{ margin: 0 }}>THRONE8</h2>

//       <button
//         onClick={handleLogout}
//         style={{
//           padding: "9px 18px",
//           border: "none",
//           borderRadius: "8px",
//           background: "#ef4444",
//           color: "white",
//           cursor: "pointer",
//           fontWeight: "bold",
//         }}
//       >
//         Logout
//       </button>
//     </nav>
//   );
// }