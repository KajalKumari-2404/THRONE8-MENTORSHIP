
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import "./Dashboard.css";

const formatDate = (date) => {
  if (!date) return "Not available";

  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatMoney = (paise) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format((paise || 0) / 100);

const statusLabel = (status) =>
  ({
    PENDING_PAYMENT: "Payment Pending",
    CONFIRMED: "Confirmed",
    COMPLETED: "Completed",
    EXPIRED: "Expired",
    CANCELLED: "Cancelled",
    DISPUTED: "Under Dispute",
  })[status] || status;

export default function Dashboard() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const user = JSON.parse(
    sessionStorage.getItem("throne8User") || "null"
  );

  const fetchBookings = async () => {
    const token = sessionStorage.getItem("throne8Token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setError("");

      // const response = await api.get("/bookings/my-bookings", {
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //   },
      // });

      // setBookings(response.data.bookings || []);

const endpoint =
  user?.role === "MENTOR"
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
          "Could not load your bookings. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("throne8Token");
    sessionStorage.removeItem("throne8User");
    navigate("/login");
  };

  const confirmSession = async (bookingId) => {
    const accepted = window.confirm(
      "Have you completed this mentorship session?"
    );

    if (!accepted) return;

    const token = sessionStorage.getItem("throne8Token");

    try {
      setActionLoading(bookingId);

      await api.patch(
        `/bookings/${bookingId}/confirm-completion`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      window.alert(
        "Session completion confirmed successfully!"
      );

      await fetchBookings();
    } catch (err) {
      window.alert(
        err.response?.data?.message ||
          "Could not confirm session completion."
      );
    } finally {
      setActionLoading("");
    }
  };

  const disputeSession = async (bookingId) => {
    const reason = window.prompt(
      "Please explain why you are disputing this session:"
    );

    if (!reason || !reason.trim()) return;

    const token = sessionStorage.getItem("throne8Token");

    try {
      setActionLoading(bookingId);

      await api.patch(
        `/bookings/${bookingId}/dispute-completion`,
        {
          reason: reason.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      window.alert("Your dispute has been submitted.");

      await fetchBookings();
    } catch (err) {
      window.alert(
        err.response?.data?.message ||
          "Could not submit the dispute."
      );
    } finally {
      setActionLoading("");
    }
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

  return (
    <main className="student-dashboard">
      <header className="dashboard-header">
        <Link to="/dashboard" className="dashboard-brand">
          THRONE8<span>.</span>
          <small>Mentorship Platform</small>
        </Link>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>

      <div className="dashboard-container">
        <section className="dashboard-hero">
          <div>
            {/* <span className="hero-eyebrow">
              STUDENT DASHBOARD
            </span> */}

            <span className="hero-eyebrow">
  {user?.role === "MENTOR"
    ? "MENTOR DASHBOARD"
    : "STUDENT DASHBOARD"}
</span>

            <h1>
              Welcome, {user?.name || "Student"}!
            </h1>

            {/* <p>
              Manage your mentorship sessions and track your
              bookings in one place.
            </p> */}

            <p>
  {user?.role === "MENTOR"
    ? "Manage your mentorship sessions and track your students."
    : "Manage your mentorship sessions and track your bookings in one place."}
</p>

            <Link to="/payment" className="primary-button">
              Go to Mentorship Payment →
            </Link>
          </div>

          <div className="hero-symbol">T8</div>
        </section>

        <section className="dashboard-stats">
          <article className="stat-card">
            <span>Total Bookings</span>
            <strong>{loading ? "—" : bookings.length}</strong>
          </article>

          <article className="stat-card">
            <span>Confirmed Sessions</span>
            <strong>{loading ? "—" : confirmed}</strong>
          </article>

          <article className="stat-card">
            <span>Completed Sessions</span>
            <strong>{loading ? "—" : completed}</strong>
          </article>

          <article className="stat-card">
            <span>Payment Pending</span>
            <strong>{loading ? "—" : pendingPayment}</strong>
          </article>
        </section>

        <section className="bookings-section">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">
                YOUR ACTIVITY
              </span>

              {/* <h2>My Mentorship Sessions</h2> */}

              <h2>
  {user?.role === "MENTOR"
    ? "My Student Bookings"
    : "My Mentorship Sessions"}
</h2>

              {/* <p>
                Your bookings fetched from the server.
              </p> */}

              <p>
  {user?.role === "MENTOR"
    ? "View students who have booked your mentorship sessions."
    : "Your bookings fetched from the server."}
</p>
            </div>

            <Link to="/payment" className="secondary-button">
              Payments
            </Link>
          </div>

          {loading && (
            <div className="dashboard-message">
              Loading your bookings...
            </div>
          )}

          {!loading && error && (
            <div className="dashboard-message error-message">
              <p>{error}</p>

              <button
                onClick={() => {
                  setLoading(true);
                  fetchBookings();
                }}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && bookings.length === 0 && (
            <div className="dashboard-message">
              <h3>No bookings yet</h3>

              <p>
                Your mentorship bookings will appear here.
              </p>

              <Link to="/payment" className="primary-button">
                Explore Payment Page
              </Link>
            </div>
          )}

          {!loading && !error && bookings.length > 0 && (
            <div className="booking-list">
              {bookings.map((booking) => (
                <article
                  className="booking-card"
                  key={booking._id}
                >
                  {/* <div className="booking-main">
                    <div className="mentor-avatar">
                      {(booking.mentorId?.name || "M")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <h3>
                        {booking.mentorId?.name || "Mentor"}
                      </h3> */}

                      {/* <p>
                        {booking.mentorId?.email ||
                          "Mentor details"}
                      </p>

                      <span className="booking-date">
                        {formatDate(booking.slotStart)}
                      </span>
                    </div>
                  </div> */}

                  <div className="booking-main">
  <div className="mentor-avatar">
    {(user?.role === "MENTOR"
      ? booking.studentId?.name || "S"
      : booking.mentorId?.name || "M"
    )
      .charAt(0)
      .toUpperCase()}
  </div>

  <div>
    <h3>
      {user?.role === "MENTOR"
        ? booking.studentId?.name || "Student"
        : booking.mentorId?.name || "Mentor"}
    </h3>

    <p>
      {user?.role === "MENTOR"
        ? booking.studentId?.email || "Student details"
        : booking.mentorId?.email || "Mentor details"}
    </p>

    <span className="booking-date">
      {formatDate(booking.slotStart)}
    </span>
  </div>
</div>

                  <div className="booking-details">
                    <span className="detail-label">
                      Session ends
                    </span>

                    <strong>
                      {formatDate(booking.slotEnd)}
                    </strong>
                  </div>

                  <div className="booking-details">
                    <span className="detail-label">
                      Booking amount
                    </span>

                    <strong>
                      {formatMoney(booking.pricePaise)}
                    </strong>
                  </div>

                  <div className="booking-status">
                    <span
                      className={`status-badge status-${(
                        booking.status || ""
                      ).toLowerCase()}`}
                    >
                      {statusLabel(booking.status)}
                    </span>

                    {booking.status === "COMPLETED" &&
                      booking.payoutEligibleAt && (
                        <small>
                          Mentor payout eligibility:{" "}
                          {formatDate(booking.payoutEligibleAt)}
                        </small>
                      )}

                    {booking.completionRequestedAt &&
                      !booking.studentConfirmedAt &&
                      !booking.completionDisputedAt &&
                      booking.status === "CONFIRMED" && (
                        <div className="completion-actions">
                          <small>
                            Your mentor has requested session
                            completion. Please confirm only if
                            the session actually took place.
                          </small>

                          <button
                            className="confirm-session-button"
                            disabled={
                              actionLoading === booking._id
                            }
                            onClick={() =>
                              confirmSession(booking._id)
                            }
                          >
                            {actionLoading === booking._id
                              ? "Please wait..."
                              : "Confirm Session"}
                          </button>

                          <button
                            className="dispute-session-button"
                            disabled={
                              actionLoading === booking._id
                            }
                            onClick={() =>
                              disputeSession(booking._id)
                            }
                          >
                            Raise Dispute
                          </button>
                        </div>
                      )}

                    {booking.studentConfirmedAt && (
                      <small>
                        You confirmed session completion.
                      </small>
                    )}

                    {booking.completionDisputedAt && (
                      <small>
                        Session completion is under dispute.
                      </small>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="account-card">
          <div>
            <span className="section-eyebrow">
              YOUR PROFILE
            </span>

            <h2>Account Information</h2>
          </div>

          <div className="account-info">
            <p>
              <span>Name</span>
              <strong>{user?.name || "Student"}</strong>
            </p>

            <p>
              <span>Email</span>
              <strong>
                {user?.email || "Not available"}
              </strong>
            </p>

            <p>
              <span>Role</span>
              <strong>{user?.role || "STUDENT"}</strong>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}