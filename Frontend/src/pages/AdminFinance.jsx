
import { useCallback, useEffect, useState } from "react";
import api from "../api";
import "../App.css";

const money = (paise = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format((Number(paise) || 0) / 100);

const dateFormat = (date) =>
  date
    ? new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const readable = (value = "UNKNOWN") =>
  String(value).replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

function getStatusClass(status = "") {
  const value = String(status).toLowerCase();

  if (/captured|completed|confirmed|paid|eligible|success|processed/.test(value))
    return "success";
  if (/pending|hold|processing|created|initiated/.test(value))
    return "warning";
  if (/failed|reversed|disputed|rejected/.test(value))
    return "danger";
  if (/refund|cancelled|canceled/.test(value))
    return "neutral";

  return "neutral";
}

function MetricCard({ icon, label, value, detail, variant = "" }) {
  return (
    <article className={`finance-metric ${variant}`}>
      <div className="finance-metric-top">
        <span className="finance-metric-icon">{icon}</span>
        <span className="finance-metric-label">{label}</span>
      </div>
      <strong className="finance-metric-value">{value}</strong>
      <p className="finance-metric-detail">{detail}</p>
    </article>
  );
}

function StatusList({ title, icon, items = [] }) {
  return (
    <section className="finance-panel">
      <div className="finance-panel-heading">
        <span className="finance-panel-icon">{icon}</span>
        <h2>{title}</h2>
        <span className="finance-count">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <div className="finance-empty">
          <span>—</span>
          <p>No records available</p>
        </div>
      ) : (
        <div className="finance-status-list">
          {items.map((item, index) => (
            <div className="finance-status-row" key={item._id ?? index}>
              <div className="finance-status-name">
                <span
                  className={`finance-status-dot ${getStatusClass(item._id)}`}
                />
                <span>{readable(item._id)}</span>
              </div>
              <strong>
                {item.amountPaise !== undefined
                  ? money(item.amountPaise)
                  : Number(item.count ?? 0).toLocaleString("en-IN")}
              </strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function AdminFinance() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL");
  const [copiedPaymentId, setCopiedPaymentId] = useState("");

  const loadFinance = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const token = sessionStorage.getItem("throne8Token");

      const response = await api.get("/admin/finance/summary", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const result = response.data;
      if (!result?.summary) {
        throw new Error("Finance summary was not returned by the server.");
      }

      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Finance data load nahi hua. Admin login check karo."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFinance();
  }, [loadFinance]);

  if (loading) {
    return (
      <main className="finance-page">
        <div className="finance-loading">
          <span className="finance-spinner" />
          <h2>Preparing your finance overview</h2>
          <p>Loading payments, earnings and transaction summaries...</p>
        </div>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="finance-page">
        <section className="finance-error-card">
          <span className="finance-error-icon">!</span>
          <p className="finance-brand">THRONE8 / ADMIN</p>
          <h1>Finance dashboard unavailable</h1>
          <p>{error}</p>
          <button
            className="finance-refresh"
            onClick={() => loadFinance()}
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  const summary = data?.summary ?? {};
  const paymentStatuses = summary.paymentStatuses ?? [];
  const bookingStatuses = summary.bookingStatuses ?? [];
  const earnings = summary.earnings ?? [];
  const payouts = summary.payouts ?? [];
  const refunds = summary.refunds ?? [];
  const recentPayments = data?.recentPayments ?? [];

  const filteredPayments = recentPayments.filter((payment) => {
  const search = paymentSearch.trim().toLowerCase();

  const matchesSearch =
    !search ||
    String(payment.gatewayPaymentId || "").toLowerCase().includes(search) ||
    String(payment._id || "").toLowerCase().includes(search) ||
    String(payment.gateway || "").toLowerCase().includes(search);

  const matchesStatus =
    paymentStatusFilter === "ALL" ||
    String(payment.status || "").toUpperCase() === paymentStatusFilter;

  return matchesSearch && matchesStatus;
});

  const captured = paymentStatuses
    .filter((item) => item._id === "CAPTURED")
    .reduce((total, item) => total + Number(item.count ?? 0), 0);

  const totalBookings = bookingStatuses.reduce(
    (total, item) => total + Number(item.count ?? 0),
    0
  );

  const pendingEarnings = earnings
    .filter((item) => item._id === "PENDING_SESSION")
    .reduce((total, item) => total + Number(item.amountPaise ?? 0), 0);

    const copyPaymentReference = async (reference) => {
  try {
    await navigator.clipboard.writeText(String(reference));
    setCopiedPaymentId(String(reference));

    window.setTimeout(() => {
      setCopiedPaymentId("");
    }, 1800);
  } catch {
    setError("Could not copy the payment reference. Please copy it manually.");
  }
};

  return (
    <main className="finance-page">
      <header className="finance-header">
        <div className="finance-title-group">
          <div className="finance-brand-row">
            <span className="finance-brand-mark">T8</span>
            <p className="finance-brand">THRONE8 / ADMIN CONSOLE</p>
          </div>

          <h1>Finance Overview</h1>
          <p className="finance-subtitle">
            Monitor payments, mentor earnings, payouts and refunds from one
            place.
          </p>

          <div className="finance-live-line">
            <span className="finance-live-dot" />
            Finance data connected to your API
          </div>
        </div>

        <div className="finance-header-actions">
          <div className="finance-updated">
            <span>LAST UPDATED</span>
            <strong>
              {lastUpdated
                ? lastUpdated.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </strong>
          </div>

          <button
            className="finance-refresh"
            onClick={() => loadFinance(true)}
            disabled={refreshing}
          >
            <span className={refreshing ? "finance-rotate" : ""}>↻</span>
            {refreshing ? "Refreshing..." : "Refresh data"}
          </button>
        </div>
      </header>

      {error && (
        <div className="finance-inline-error">
          Latest refresh failed: {error}. Showing previously loaded data.
        </div>
      )}

      <section className="finance-section-heading">
        <div>
          <p className="finance-section-kicker">AT A GLANCE</p>
          <h2>Financial performance</h2>
        </div>
        <span className="finance-period">Current API summary</span>
      </section>

      <section className="finance-cards">
        <MetricCard
          icon="₹"
          label="Captured gross"
          value={money(summary.capturedGrossPaise)}
          detail="Total captured payment amount"
          variant="finance-metric-purple"
        />
        <MetricCard
          icon="✓"
          label="Captured payments"
          value={captured.toLocaleString("en-IN")}
          detail="Successful captured records"
          variant="finance-metric-green"
        />
        <MetricCard
          icon="▦"
          label="Total bookings"
          value={totalBookings.toLocaleString("en-IN")}
          detail="Across all booking statuses"
          variant="finance-metric-blue"
        />
        <MetricCard
          icon="◷"
          label="Pending session earnings"
          value={money(pendingEarnings)}
          detail="Awaiting session completion"
          variant="finance-metric-orange"
        />
      </section>

      <section className="finance-section-heading finance-breakdown-heading">
        <div>
          <p className="finance-section-kicker">OPERATIONS</p>
          <h2>Financial breakdown</h2>
        </div>
        <p className="finance-muted">
          Amounts and counts returned by the backend
        </p>
      </section>

      <section className="finance-grid">
        <StatusList
          title="Payment status"
          icon="₹"
          items={paymentStatuses}
        />
        <StatusList
          title="Booking status"
          icon="▦"
          items={bookingStatuses}
        />
        <StatusList
          title="Mentor earnings"
          icon="↗"
          items={earnings}
        />
        <StatusList
          title="Payout status"
          icon="⇧"
          items={payouts}
        />
        <StatusList
          title="Refund status"
          icon="↶"
          items={refunds}
        />
      </section>

      <section className="finance-panel finance-table-panel">
        <div className="finance-panel-heading finance-table-heading">
          <div>
            <p className="finance-section-kicker">TRANSACTION ACTIVITY</p>
            <h2>Recent payments</h2>
            <p className="finance-muted">
              Latest payment records returned by the API
            </p>

            <div className="finance-payment-filters">
  <input
    type="search"
    value={paymentSearch}
    onChange={(e) => setPaymentSearch(e.target.value)}
    placeholder="Search payment reference..."
    aria-label="Search payments"
  />

  <select
    value={paymentStatusFilter}
    onChange={(e) => setPaymentStatusFilter(e.target.value)}
    aria-label="Filter payments by status"
  >
    <option value="ALL">All statuses</option>
    <option value="CAPTURED">Captured</option>
    <option value="CREATED">Created</option>
    <option value="FAILED">Failed</option>
    <option value="REFUNDED">Refunded</option>
  </select>
</div>
          </div>
          <span className="finance-count">
  {filteredPayments.length} of {recentPayments.length} records
</span>
        </div>

        {recentPayments.length === 0 ? (
          <div className="finance-empty finance-table-empty">
            <span>▤</span>
            <p>No payment records found</p>
            <small>New payment activity will appear here when returned by the API.</small>
          </div>
        ) : (
          <div className="finance-table-wrap">
            <table className="finance-table">
              <thead>
                <tr>
                  <th>Payment reference</th>
                  <th>Amount</th>
                  <th>Gateway</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>


<tbody>
  {filteredPayments.length === 0 ? (
    <tr>
      <td colSpan={5} className="finance-no-results">
        No payments match your search or selected status.
      </td>
    </tr>
  ) : (
    filteredPayments.map((payment) => (
      <tr key={payment._id}>
        <td>
          <div className="finance-reference">
            <span className="finance-reference-icon">₹</span>
            <div>
              <strong>
  {payment.gatewayPaymentId || payment._id}
</strong>

<button
  type="button"
  className="finance-copy-button"
  onClick={() =>
    copyPaymentReference(payment.gatewayPaymentId || payment._id)
  }
  aria-label="Copy payment reference"
>
  {copiedPaymentId ===
  String(payment.gatewayPaymentId || payment._id)
    ? "Copied!"
    : "Copy"}
</button>
              <small>Payment transaction</small>
            </div>
          </div>
        </td>

        <td className="finance-amount">
          {money(payment.amountPaise)}
        </td>

        <td>{readable(payment.gateway)}</td>

        <td>
          <span
            className={`finance-badge ${getStatusClass(payment.status)}`}
          >
            <span />
            {readable(payment.status)}
          </span>
        </td>

        <td className="finance-date">
          {dateFormat(payment.createdAt)}
        </td>
      </tr>
    ))
  )}
</tbody>

            </table>
          </div>
        )}
      </section>

      <footer className="finance-footnote">
        <span>ⓘ</span>
        <p>
          Captured gross is not net revenue or profit. This dashboard reflects
          the current API summary; it does not independently reconcile bank
          settlements or confirm that payouts and refunds have been completed.
        </p>
      </footer>
    </main>
  );
}
