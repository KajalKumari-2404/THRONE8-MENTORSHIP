
import { useEffect, useState } from "react";
import api from "../api";
import "../App.css";

const money = (paise = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);

const dateFormat = (date) =>
  date ? new Date(date).toLocaleString("en-IN") : "—";

function StatusList({ title, items = [] }) {
  return (
    <section className="finance-panel">
      <h2>{title}</h2>
      {items.length === 0 ? (
        <p className="finance-muted">No records available</p>
      ) : (
        items.map((item) => (
          <div className="finance-status-row" key={item._id}>
            <span>{item._id.replaceAll("_", " ")}</span>
            <strong>
              {item.amountPaise !== undefined
                ? money(item.amountPaise)
                : item.count}
            </strong>
          </div>
        ))
      )}
    </section>
  );
}

export default function AdminFinance() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFinance = async () => {
      try {
        // const token = localStorage.getItem("token");
        const token = sessionStorage.getItem("throne8Token");

        const response = await api.get("/admin/finance/summary", {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        });

        setData(response.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Finance data load nahi hua. Admin login check karo."
        );
      } finally {
        setLoading(false);
      }
    };

    loadFinance();
  }, []);

  if (loading) {
    return <main className="finance-page">Loading finance dashboard...</main>;
  }

  if (error) {
    return (
      <main className="finance-page">
        <h1>Admin Finance</h1>
        <p className="finance-error">{error}</p>
      </main>
    );
  }

  const summary = data.summary;
  const captured = summary.paymentStatuses.find(
    (item) => item._id === "CAPTURED"
  )?.count || 0;

  const totalBookings = summary.bookingStatuses.reduce(
    (total, item) => total + item.count,
    0
  );

  const pendingEarnings = summary.earnings
    .filter((item) => item._id === "PENDING_SESSION")
    .reduce((total, item) => total + item.amountPaise, 0);

  return (
    <main className="finance-page">
      <header className="finance-header">
        <div>
          <p className="finance-brand">THRONE8 / ADMIN</p>
          <h1>Finance Dashboard</h1>
          <p className="finance-muted">
            Payments, bookings, mentor earnings and payouts
          </p>
        </div>
        <button
          className="finance-refresh"
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      </header>

      <section className="finance-cards">
        <article className="finance-card">
          <span>Captured Gross</span>
          <strong>{money(summary.capturedGrossPaise)}</strong>
          <small>Captured payment amount</small>
        </article>

        <article className="finance-card">
          <span>Captured Payments</span>
          <strong>{captured}</strong>
          <small>Successful captured records</small>
        </article>

        <article className="finance-card">
          <span>Total Bookings</span>
          <strong>{totalBookings}</strong>
          <small>Across all booking statuses</small>
        </article>

        <article className="finance-card">
          <span>Pending Session Earnings</span>
          <strong>{money(pendingEarnings)}</strong>
          <small>Not yet a completed payout</small>
        </article>
      </section>

      <section className="finance-grid">
        <StatusList title="Payment Status" items={summary.paymentStatuses} />
        <StatusList title="Booking Status" items={summary.bookingStatuses} />
        <StatusList title="Mentor Earnings" items={summary.earnings} />
        <StatusList title="Payout Status" items={summary.payouts} />
        <StatusList title="Refund Status" items={summary.refunds} />
      </section>

      <section className="finance-panel finance-table-panel">
        <h2>Recent Payments</h2>
        {data.recentPayments.length === 0 ? (
          <p className="finance-muted">No payments found.</p>
        ) : (
          <div className="finance-table-wrap">
            <table className="finance-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Amount</th>
                  <th>Gateway</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentPayments.map((payment) => (
                  <tr key={payment._id}>
                    <td>{payment.gatewayPaymentId || payment._id}</td>
                    <td>{money(payment.amountPaise)}</td>
                    <td>{payment.gateway}</td>
                    <td>
                      <span
                        className={`finance-badge finance-${payment.status.toLowerCase()}`}
                      >
                        {payment.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td>{dateFormat(payment.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="finance-footnote">
        Captured gross is not net revenue or profit. Finance figures are
        based on the current API summary and are not a reconciliation report.
      </p>
    </main>
  );
}