import { useNavigate } from "react-router-dom";
import "./App.css";

export default function Navbar() {
  const navigate = useNavigate();

  let user = null;

  try {
    user = JSON.parse(
      sessionStorage.getItem("throne8User") || "null"
    );
  } catch {
    user = null;
  }

  const role = String(user?.role || "").toUpperCase();
  const isAdmin = role === "ADMIN";

  const handleLogout = () => {
    sessionStorage.removeItem("throne8Token");
    sessionStorage.removeItem("throne8User");
    navigate("/login", { replace: true });
  };

  const handleBrandKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate("/");
    }
  };

  const adminLinks = [
    { label: "Dashboard", path: "/admin" },
    { label: "Users", path: "/admin/users" },
    { label: "Students", path: "/admin/users?role=STUDENT" },
    { label: "Mentors", path: "/admin/users?role=MENTOR" },
    { label: "Bookings", path: "/admin/bookings" },
    { label: "Finance", path: "/admin/finance" },
    { label: "Payouts", path: "/admin/payouts" },
    { label: "Refunds", path: "/admin/refunds" },
    { label: "Messages", path: "/admin/contact-messages" },
  ];

  return (
    <nav className="throne-navbar" aria-label="Main navigation">
      <div
        className="throne-navbar-brand"
        onClick={() => navigate("/")}
        onKeyDown={handleBrandKeyDown}
        role="link"
        tabIndex={0}
        aria-label="THRONE8 home"
      >
        <span className="throne-navbar-logo" aria-hidden="true">
          T8
        </span>

        <span className="throne-navbar-name">
          THRONE<span>8</span>
          <small>MENTORSHIP PLATFORM</small>
        </span>
      </div>

      <div className="throne-navbar-actions">
        {isAdmin && (
          <div
            className="throne-admin-nav"
            aria-label="Admin navigation"
          >
            {adminLinks.map((link) => (
              <button
                key={link.path}
                type="button"
                onClick={() => navigate(link.path)}
              >
                {link.label}
              </button>
            ))}
          </div>
        )}

        <span className="throne-navbar-status">
          <span
            className="throne-status-dot"
            aria-hidden="true"
          />
          Platform Active
        </span>

        <button
          type="button"
          className="throne-logout-button"
          onClick={handleLogout}
        >
          <span aria-hidden="true">↪</span>
          Logout
        </button>
      </div>
    </nav>
  );
}



















// import { useNavigate } from "react-router-dom";
// import "./App.css";

// export default function Navbar() {
//   const navigate = useNavigate();

//   let user = null;

//   try {
//     user = JSON.parse(sessionStorage.getItem("throne8User") || "null");
//   } catch {
//     user = null;
//   }

//   const role = String(user?.role || "").toUpperCase();
//   const isAdmin = role === "ADMIN";

//   const handleLogout = () => {
//     sessionStorage.removeItem("throne8Token");
//     sessionStorage.removeItem("throne8User");
//     navigate("/login", { replace: true });
//   };

//   const handleBrandKeyDown = (event) => {
//     if (event.key === "Enter" || event.key === " ") {
//       event.preventDefault();
//       navigate("/");
//     }
//   };

//   return (
//     <nav className="throne-navbar" aria-label="Main navigation">
//       <div
//         className="throne-navbar-brand"
//         onClick={() => navigate("/")}
//         onKeyDown={handleBrandKeyDown}
//         role="link"
//         tabIndex={0}
//         aria-label="THRONE8 home"
//       >
//         <span className="throne-navbar-logo" aria-hidden="true">
//           T8
//         </span>

//         <span className="throne-navbar-name">
//           THRONE<span>8</span>
//           <small>MENTORSHIP PLATFORM</small>
//         </span>
//       </div>

//       <div className="throne-navbar-actions">
//         {isAdmin && (
//           <div className="throne-admin-nav" aria-label="Admin navigation">
//             <button
//               type="button"
//               onClick={() => navigate("/admin")}
//             >
//               Dashboard
//             </button>

//             <button
//               type="button"
//               onClick={() => navigate("/admin/users")}
//             >
//               Users
//             </button>

//             <button
//               type="button"
//               onClick={() => navigate("/admin/users?role=STUDENT")}
//             >
//               Students
//             </button>

//             <button
//               type="button"
//               onClick={() => navigate("/admin/users?role=MENTOR")}
//             >
//               Mentors
//             </button>
//           </div>
//         )}

//         <span className="throne-navbar-status">
//           <span className="throne-status-dot" aria-hidden="true" />
//           Platform Active
//         </span>

//         <button
//           type="button"
//           className="throne-logout-button"
//           onClick={handleLogout}
//         >
//           <span aria-hidden="true">↗</span>
//           Logout
//         </button>
//       </div>
//     </nav>
//   );
// }