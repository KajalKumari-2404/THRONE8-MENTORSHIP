
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import "./Dashboard.css";

const formatDate = (date) => {
  if (!date) return "Not available";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Not available";
  }

  return parsed.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatMoney = (paise) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format((Number(paise) || 0) / 100);

const statusLabel = (status) =>
  ({
    PENDING_PAYMENT: "Payment Pending",
    CONFIRMED: "Confirmed",
    COMPLETED: "Completed",
    EXPIRED: "Expired",
    CANCELLED: "Cancelled",
    DISPUTED: "Under Dispute",
  })[status] || status || "Unknown";

const getPerson = (booking, isMentor) =>
  isMentor ? booking.studentId : booking.mentorId;

export default function Dashboard() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const user = (() => {
    try {
      return JSON.parse(
        sessionStorage.getItem("throne8User") || "null"
      );
    } catch {
      return null;
    }
  })();

  const isMentor = user?.role === "MENTOR";

  const fetchBookings = useCallback(async () => {
    const token = sessionStorage.getItem("throne8Token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setError("");

      const endpoint = isMentor
        ? "/bookings/mentor-bookings"
        : "/bookings/my-bookings";

      const response = await api.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setBookings(response.data.bookings || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load bookings. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [isMentor, navigate]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const runBookingAction = async (
    bookingId,
    endpoint,
    successMessage,
    body = {}
  ) => {
    const token = sessionStorage.getItem("throne8Token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setActionLoading(bookingId);

      await api.patch(
        `/bookings/${bookingId}/${endpoint}`,
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      window.alert(successMessage);
      await fetchBookings();
    } catch (err) {
      window.alert(
        err.response?.data?.message ||
          "Action failed. Please try again."
      );
    } finally {
      setActionLoading("");
    }
  };

  const requestCompletion = async (bookingId) => {
    if (!window.confirm("Request session completion?")) return;

    await runBookingAction(
      bookingId,
      "request-completion",
      "Session completion request sent."
    );
  };

  const confirmSession = async (bookingId) => {
    if (
      !window.confirm(
        "Have you actually completed this mentorship session?"
      )
    ) {
      return;
    }

    await runBookingAction(
      bookingId,
      "confirm-completion",
      "Session completion confirmed."
    );
  };

  const disputeSession = async (bookingId) => {
    const reason = window.prompt(
      "Explain why you are disputing this session:"
    );

    if (!reason?.trim()) return;

    await runBookingAction(
      bookingId,
      "dispute-completion",
      "Your dispute has been submitted.",
      { reason: reason.trim() }
    );
  };

  const confirmed = bookings.filter(
    (booking) => booking.status === "CONFIRMED"
  ).length;

  const completed = bookings.filter(
    (booking) => booking.status === "COMPLETED"
  ).length;

  const pendingPayment = bookings.filter(
    (booking) => booking.status === "PENDING_PAYMENT"
  ).length;

  const disputed = bookings.filter(
    (booking) => booking.status === "DISPUTED"
  ).length;

  const filteredBookings = bookings.filter((booking) => {
  const person = getPerson(booking, isMentor);

  const searchText = [
    person?.name || "",
    person?.email || "",
    booking.status || "",
    booking._id || "",
  ]
    .join(" ")
    .toLowerCase();

  const matchesSearch = searchText.includes(
    searchTerm.trim().toLowerCase()
  );

  const matchesStatus =
    statusFilter === "ALL" || booking.status === statusFilter;

  return matchesSearch && matchesStatus;
});

  const stats = isMentor
    ? [
        {
          icon: "▦",
          label: "Student Bookings",
          value: bookings.length,
          caption: "Bookings in your account",
        },
        {
          icon: "◷",
          label: "Confirmed Sessions",
          value: confirmed,
          caption: "Ready for mentorship",
        },
        {
          icon: "✓",
          label: "Completed Sessions",
          value: completed,
          caption: "Completion recorded",
        },
        {
          icon: "!",
          label: "Disputed Sessions",
          value: disputed,
          caption: "Sessions needing attention",
        },
      ]
    : [
        {
          icon: "▦",
          label: "Total Bookings",
          value: bookings.length,
          caption: "Across your account",
        },
        {
          icon: "◷",
          label: "Confirmed Sessions",
          value: confirmed,
          caption: "Ready for mentorship",
        },
        {
          icon: "✓",
          label: "Completed Sessions",
          value: completed,
          caption: "Completion recorded",
        },
        {
          icon: "₹",
          label: "Payment Pending",
          value: pendingPayment,
          caption: `${disputed} booking${disputed === 1 ? "" : "s"} under dispute`,
        },
      ];

  return (
    <main className="student-dashboard">
      <div className="dashboard-container">
        <section className="dashboard-hero">
          <div className="dashboard-hero-content">
            <span className="hero-eyebrow">
              {isMentor ? "MENTOR WORKSPACE" : "STUDENT WORKSPACE"}
            </span>

            <h1>
              Welcome back,{" "}
              {user?.name || (isMentor ? "Mentor" : "Student")}!
            </h1>

            <p>
              {isMentor
                ? "Manage your student bookings, track session progress, and support your mentees."
                : "Your mentorship journey, sessions, and bookings — all in one place."}
            </p>

            <div className="hero-actions">
              {!isMentor && (
                <Link to="/book-session" className="primary-button">
                  + Book a Session
                </Link>
              )}

              <Link to="/payment" className="primary-button">
                {isMentor ? "View Payments" : "Explore Payments"} →
              </Link>

              {isMentor && (
                <Link
                  to="/mentor/earnings"
                  className="secondary-button"
                >
                  View Earnings
                </Link>
              )}
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hero-orbit hero-orbit-one" />
            <div className="hero-orbit hero-orbit-two" />
            <div className="hero-symbol">T8</div>
            <span className="hero-floating-card">
              ✦ Grow together
            </span>
          </div>
        </section>

        <section
          className="dashboard-stats"
          aria-label="Dashboard statistics"
        >
          {stats.map((stat, index) => (
            <article
              className={`stat-card ${index === 0 ? "stat-card-purple" : ""}`}
              key={stat.label}
            >
              <div className="stat-top">
                <span className="stat-icon">{stat.icon}</span>
                <span className="stat-caption">
                  {loading ? "Loading" : "Overview"}
                </span>
              </div>

              <span className="stat-label">{stat.label}</span>
              <strong>{loading ? "—" : stat.value}</strong>
              <span className="stat-foot">{stat.caption}</span>
            </article>
          ))}
        </section>

        <section className="bookings-section dashboard-panel">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">YOUR SESSIONS</span>
              <h2>
                {isMentor
                  ? "Student Bookings"
                  : "My Mentorship Sessions"}
              </h2>
              <p>
                {isMentor
                  ? "Review your bookings and manage session progress."
                  : "Keep track of your mentorship sessions and their status."}
              </p>
            </div>

            <Link to="/payment" className="secondary-button">
              Payments ↗
            </Link>
          </div>

          {loading && (
            <div className="dashboard-message">
              <span className="loading-spinner" />
              <p>Loading your bookings...</p>
            </div>
          )}

          {!loading && error && (
            <div className="dashboard-message error-message">
              <h3>We couldn't load your bookings</h3>
              <p>{error}</p>

              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setLoading(true);
                  fetchBookings();
                }}
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && bookings.length === 0 && (
            <div className="dashboard-message empty-state">
              <div className="empty-state-icon">✦</div>
              <h3>No bookings yet</h3>
              <p>
                {isMentor
                  ? "Student bookings will appear here when someone books a session with you."
                  : "Start your mentorship journey by booking your first session."}
              </p>

              {!isMentor && (
                <Link
                  to="/book-session"
                  className="primary-button"
                >
                  Book Your First Session
                </Link>
              )}
            </div>
          )}

          {!loading && !error && bookings.length > 0 && (
  <div className="booking-toolbar">
    <input
      type="search"
      className="booking-search"
      placeholder="Search by name, email or booking ID..."
      value={searchTerm}
      onChange={(event) => setSearchTerm(event.target.value)}
      aria-label="Search bookings"
    />

    <select
      className="booking-filter"
      value={statusFilter}
      onChange={(event) => setStatusFilter(event.target.value)}
      aria-label="Filter bookings by status"
    >
      <option value="ALL">All bookings</option>
      <option value="PENDING_PAYMENT">Payment pending</option>
      <option value="CONFIRMED">Confirmed</option>
      <option value="COMPLETED">Completed</option>
      <option value="DISPUTED">Under dispute</option>
      <option value="CANCELLED">Cancelled</option>
      <option value="EXPIRED">Expired</option>
    </select>

    <span className="booking-count">
      {filteredBookings.length} of {bookings.length} bookings
    </span>
  </div>
)}

          {!loading && !error && bookings.length > 0 && (
            <div className="booking-list">
              {filteredBookings.length === 0 && (
  <div className="dashboard-message empty-state">
    <h3>No matching bookings</h3>
    <p>Try another search term or select a different status.</p>
    <button
      type="button"
      className="secondary-button"
      onClick={() => {
        setSearchTerm("");
        setStatusFilter("ALL");
      }}
    >
      Clear filters
    </button>
  </div>
)}
{filteredBookings.map((booking) => {
  const person = getPerson(booking, isMentor);
  const personName =
  person?.name || (isMentor ? "Student" : "Mentor");

                const initials =
                  personName.trim().charAt(0).toUpperCase() || "T";

                const isActionLoading =
                  actionLoading === booking._id;

                return (
                  <article className="booking-card" key={booking._id}>
                    <div className="booking-main">
                      <div className="mentor-avatar">{initials}</div>

                      <div className="booking-person">
                        <h3>{personName}</h3>
                        <p>
                          {person?.email || "Account details unavailable"}
                        </p>
                        <span className="booking-date">
                          ◷ {formatDate(booking.slotStart)}
                        </span>
                      </div>
                    </div>

                    <div className="booking-details">
                      <span className="detail-label">Session ends</span>
                      <strong>{formatDate(booking.slotEnd)}</strong>
                    </div>

                    <div className="booking-details">
                      <span className="detail-label">Booking amount</span>
                      <strong>{formatMoney(booking.pricePaise)}</strong>
                    </div>

                    <div className="booking-status">
                      <span
                        className={`status-badge status-${(
                          booking.status || "unknown"
                        ).toLowerCase()}`}
                      >
                        {statusLabel(booking.status)}
                      </span>

                      {!isMentor &&
                        booking.status === "PENDING_PAYMENT" && (
                          <div className="completion-actions">
                            <button
                              type="button"
                              className="confirm-session-button"
                              onClick={() =>
                                navigate("/payment", {
                                  state: { bookingId: booking._id },
                                })
                              }
                            >
                              Pay Now →
                            </button>
                          </div>
                        )}

                      {booking.status === "COMPLETED" &&
                        booking.payoutEligibleAt && (
                          <small>
                            Payout eligibility:{" "}
                            {formatDate(booking.payoutEligibleAt)}
                          </small>
                        )}

                      {isMentor &&
                        booking.status === "CONFIRMED" &&
                        !booking.completionRequestedAt &&
                        !booking.studentConfirmedAt &&
                        !booking.completionDisputedAt && (
                          <div className="completion-actions">
                            <button
                              type="button"
                              className="confirm-session-button"
                              disabled={isActionLoading}
                              onClick={() =>
                                requestCompletion(booking._id)
                              }
                            >
                              {isActionLoading
                                ? "Please wait..."
                                : "Request Session Completion"}
                            </button>
                          </div>
                        )}

                      {!isMentor &&
                        booking.status === "CONFIRMED" &&
                        booking.completionRequestedAt &&
                        !booking.studentConfirmedAt &&
                        !booking.completionDisputedAt && (
                          <div className="completion-actions">
                            <small>
                              Your mentor requested completion. Confirm
                              only if the session actually took place.
                            </small>

                            <button
                              type="button"
                              className="confirm-session-button"
                              disabled={isActionLoading}
                              onClick={() => confirmSession(booking._id)}
                            >
                              {isActionLoading
                                ? "Please wait..."
                                : "Confirm Session"}
                            </button>

                            <button
                              type="button"
                              className="dispute-session-button"
                              disabled={isActionLoading}
                              onClick={() => disputeSession(booking._id)}
                            >
                              {isActionLoading
                                ? "Please wait..."
                                : "Raise Dispute"}
                            </button>
                          </div>
                        )}

                      {booking.studentConfirmedAt && (
                        <small>
                          Student confirmed session completion.
                        </small>
                      )}

                      {booking.completionDisputedAt && (
                        <small>
                          Session completion is under dispute.
                        </small>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="account-card dashboard-panel">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">ACCOUNT OVERVIEW</span>
              <h2>Your Profile</h2>
              <p>Your current THRONE8 account information.</p>
            </div>

            <div className="profile-mark">
              {(user?.name || "T").charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="account-info">
            <div>
              <span>Name</span>
              <strong>{user?.name || "Not available"}</strong>
            </div>

            <div>
              <span>Email address</span>
              <strong>{user?.email || "Not available"}</strong>
            </div>

            <div>
              <span>Account role</span>
              <strong>{user?.role || "STUDENT"}</strong>
            </div>
          </div>
        </section>

        <footer className="dashboard-footer">
          <span>THRONE8</span>
          <span>Learn. Connect. Grow.</span>
        </footer>
      </div>
    </main>
  );
}
