import { useNavigate } from "react-router-dom";
import "../App.css";
// import { useNavigate } from "react-router-dom";

const adminModules = [
  {
    title: "Finance Overview",
    description: "Track captured payments, revenue and financial activity.",
    icon: "₹",
    path: "/admin/finance",
    tag: "FINANCE",
    number: "01",
  },
  {
    title: "Mentor Management",
    description: "Review mentor accounts and manage commission settings.",
    icon: "♙",
    path: "/admin/mentors",
    tag: "OPERATIONS",
    number: "02",
  },
  {
    title: "Payout Management",
    description: "Review mentor payouts, approvals and payout retries.",
    icon: "↗",
    path: "/admin/payouts",
    tag: "PAYMENTS",
    number: "03",
  },
  {
    title: "Refunds & Disputes",
    description: "Manage refund records and review session disputes.",
    icon: "↺",
    path: "/admin/refunds",
    tag: "RESOLUTION",
    number: "04",
  },
  {
    title: "Contact Messages",
    description: "Review user questions and manage support requests.",
    icon: "✉",
    path: "/admin/contact-messages",
    tag: "SUPPORT",
    number: "05",
  },
    {
    title: "All Bookings",
    description:
      "View student sessions, mentor details, booking status and payment breakdowns.",
    icon: "▤",
    path: "/admin/bookings",
    tag: "SESSIONS",
    number: "06",
  },
];

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <main className="admin-home">
      <header className="admin-home-header">
        <div className="admin-home-brand">
          <div className="admin-home-brand-icon">T8</div>
          <div>
            <p className="admin-home-eyebrow">THRONE8 / ADMIN CONSOLE</p>
            <span className="admin-home-brand-name">Control Center</span>
          </div>
        </div>

        <span className="admin-home-status">
          <span className="admin-home-status-dot" />
          Administrator access
        </span>
      </header>

      <section className="admin-home-hero">
        <div className="admin-home-hero-content">
          <p className="admin-home-eyebrow">PLATFORM MANAGEMENT</p>
          <h1>
            Your platform.
            <br />
            <span>Your control.</span>
          </h1>
          <p className="admin-home-hero-description">
            Manage finances, mentor operations, payouts and refunds
            from one central workspace.
          </p>
        </div>

        <div className="admin-home-hero-art" aria-hidden="true">
          <div className="admin-home-orbit admin-home-orbit-one" />
          <div className="admin-home-orbit admin-home-orbit-two" />
          <div className="admin-home-monogram">T8</div>
          <span className="admin-home-art-label">MENTORSHIP PLATFORM</span>
        </div>
      </section>

      <section className="admin-home-section">
        <div className="admin-home-section-heading">
          <div>
            <p className="admin-home-eyebrow">YOUR WORKSPACE</p>
            <h2>Management modules</h2>
            <p>Choose a module to manage the platform.</p>
          </div>
          {/* <span className="admin-home-module-count">04 MODULES</span> */}
          {/* <span className="admin-home-module-count">05 MODULES</span> */}
          <span className="admin-home-module-count">06 MODULES</span>
        </div>

        <div className="admin-module-grid">
          {adminModules.map((module) => (
            <button
              type="button"
              className="admin-module-card"
              key={module.title}
              onClick={() => navigate(module.path)}
            >
              <div className="admin-module-card-top">
                <span className="admin-module-icon">{module.icon}</span>
                <span className="admin-module-number">{module.number}</span>
              </div>

              <span className="admin-module-tag">{module.tag}</span>
              <span className="admin-module-title">{module.title}</span>
              <span className="admin-module-description">
                {module.description}
              </span>

              <span className="admin-module-link">
                Open workspace <span aria-hidden="true">↗</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <footer className="admin-home-footer">
        <span className="admin-home-footer-mark">T8</span>
        <span>THRONE8 Mentorship</span>
        <span className="admin-home-footer-divider">·</span>
        <span>Authorized administration only</span>
      </footer>
    </main>
  );
}
