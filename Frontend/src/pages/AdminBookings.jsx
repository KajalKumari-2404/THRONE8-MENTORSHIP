
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

const money = (paise) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format((Number(paise) || 0) / 100);

const date = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

const statuses = [
  "ALL",
  "PENDING_PAYMENT",
  "CONFIRMED",
  "COMPLETED",
  "DISPUTED",
  "CANCELLED",
  "EXPIRED",
];

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = sessionStorage.getItem("throne8Token");
      const params = { page, limit: 20 };

      if (status !== "ALL") params.status = status;

      const response = await api.get("/admin/bookings", {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      setBookings(response.data.bookings || []);
      setPages(response.data.pagination?.pages || 1);
      setTotal(response.data.pagination?.total || 0);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Bookings load nahi hui. Please refresh karke try karo."
      );
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const visibleBookings = bookings.filter((booking) => {
    const query = search.trim().toLowerCase();

    return [
      booking._id,
      booking.studentId?.name,
      booking.studentId?.email,
      booking.mentorId?.name,
      booking.mentorId?.email,
      booking.status,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const changeStatus = (value) => {
    setStatus(value);
    setPage(1);
  };

  return (
    <main className="admin-bookings-page">
      <header className="admin-bookings-header">
        <div>
          <p className="admin-bookings-eyebrow">THRONE8 • ADMIN CONTROL</p>
          <h1>All Bookings</h1>
          <p>Student sessions, mentor details aur booking status ek jagah.</p>
        </div>
        <Link to="/admin" className="admin-bookings-back">
          ← Admin Dashboard
        </Link>
      </header>

      <section className="admin-bookings-summary">
        <div>
          <span>Total matching bookings</span>
          <strong>{total}</strong>
        </div>
        <div>
          <span>Current page</span>
          <strong>{page} / {pages}</strong>
        </div>
      </section>

      <section className="admin-bookings-panel">
        <div className="admin-bookings-filters">
          <input
            aria-label="Search bookings"
            placeholder="Search student, mentor, email or booking ID..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            aria-label="Filter by booking status"
            value={status}
            onChange={(event) => changeStatus(event.target.value)}
          >
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item === "ALL" ? "All statuses" : item.replaceAll("_", " ")}
              </option>
            ))}
          </select>

          <button type="button" onClick={loadBookings}>
            Refresh
          </button>
        </div>

        {error && <p className="admin-bookings-error">{error}</p>}

        {loading ? (
          <p className="admin-bookings-message">Loading bookings...</p>
        ) : visibleBookings.length === 0 ? (
          <p className="admin-bookings-message">No matching bookings found.</p>
        ) : (
          <div className="admin-bookings-table-wrap">
            <table className="admin-bookings-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Mentor</th>
                  <th>Session</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Completion / Payout eligibility</th>
                </tr>
              </thead>
              <tbody>
                {visibleBookings.map((booking) => (
                  <tr key={booking._id}>
                    <td>
                      <strong>{booking.studentId?.name || "Unknown"}</strong>
                      <small>{booking.studentId?.email || "—"}</small>
                      <small>ID: {booking._id}</small>
                    </td>
                    <td>
                      <strong>{booking.mentorId?.name || "Unknown"}</strong>
                      <small>{booking.mentorId?.email || "—"}</small>
                    </td>
                    <td>
                      <strong>{date(booking.slotStart)}</strong>
                      <small>Ends: {date(booking.slotEnd)}</small>
                    </td>
                    <td>
                      <strong>{money(booking.pricePaise)}</strong>
                      <small>
                        Mentor: {money(booking.mentorGrossPaise)}
                      </small>
                      <small>
                        Commission: {money(booking.commissionPaise)}
                      </small>
                    </td>
                    <td>
                      <span className={`admin-booking-status status-${booking.status?.toLowerCase()}`}>
                        {booking.status?.replaceAll("_", " ") || "UNKNOWN"}
                      </span>
                    </td>
                    <td>
                      <small>
                        Requested: {date(booking.completionRequestedAt)}
                      </small>
                      <small>
                        Completed: {date(booking.completedAt)}
                      </small>
                      <small>
                        Eligible: {date(booking.payoutEligibleAt)}
                      </small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <footer className="admin-bookings-pagination">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((value) => value - 1)}
          >
            ← Previous
          </button>
          <span>Page {page} of {pages}</span>
          <button
            type="button"
            disabled={page >= pages || loading}
            onClick={() => setPage((value) => value + 1)}
          >
            Next →
          </button>
        </footer>
      </section>
    </main>
  );
}
