import { useCallback, useEffect, useState } from "react";
import api from "../api";
import "../App.css";

const STATES = [
  "ELIGIBLE",
  "PENDING_SESSION",
  "HOLDING",
  "PROCESSING",
  "PAID",
  "ON_HOLD",
  "REVERSED",
];

const formatINR = (paise = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format((Number(paise) || 0) / 100);

export default function PayoutManagement() {
  const [state, setState] = useState("ELIGIBLE");
  const [earnings, setEarnings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadPayouts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = sessionStorage.getItem("throne8Token");

const response = await api.get("/admin/payouts", {
  params: { state, page: 1, limit: 50 },
  headers: token ? { Authorization: `Bearer ${token}` } : {},
});

      const data = response.data;

      if (!data?.success) {
        throw new Error(data?.message || "Could not load payout records.");
      }

      setEarnings(Array.isArray(data.earnings) ? data.earnings : []);
      setTotal(Number(data.total) || 0);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load payout records."
      );
    } finally {
      setLoading(false);
    }
  }, [state]);

  useEffect(() => {
    loadPayouts();
  }, [loadPayouts]);

  return (
    <main className="admin-page">
      <section className="admin-header">
        <div>
          <p className="eyebrow">THRONE8 / ADMIN CONSOLE</p>
          <h1>Payout Management</h1>
          <p>
            Review mentor earnings and their current payout status.
          </p>
        </div>

        <button
          type="button"
          onClick={loadPayouts}
          disabled={loading}
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </section>

      <section className="admin-stats-grid">
        <article className="admin-stat-card">
          <p>Selected status</p>
          <h2>{state.replaceAll("_", " ")}</h2>
          <span>Backend payout filter</span>
        </article>

        <article className="admin-stat-card">
          <p>Matching earnings</p>
          <h2>{total}</h2>
          <span>Total records for this status</span>
        </article>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h2>Mentor earnings</h2>
            <p>
              Select a status to inspect matching earnings records.
            </p>
          </div>

          <select
            value={state}
            onChange={(event) => setState(event.target.value)}
            aria-label="Filter earnings by status"
          >
            {STATES.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>

        {lastUpdated && (
          <p className="admin-muted">
            Last updated: {lastUpdated.toLocaleTimeString("en-IN")}
          </p>
        )}

        {error && (
          <div className="admin-error" role="alert">
            <strong>Could not load payout data</strong>
            <p>{error}</p>
            <button type="button" onClick={loadPayouts}>
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <p className="admin-muted">Loading payout records...</p>
        ) : !error && earnings.length === 0 ? (
          <div className="admin-empty">
            <h3>No earnings found</h3>
            <p>
              There are no records matching the selected status.
              This does not necessarily mean the payout system is broken.
            </p>
          </div>
        ) : !error ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mentor</th>
                  <th>Booking ID</th>
                  <th>Mentor earning</th>
                  <th>Commission</th>
                  <th>Status</th>
                  <th>Eligible date</th>
                  <th>Latest payout</th>
                </tr>
              </thead>

              <tbody>
                {earnings.map((earning) => (
                  <tr key={earning._id}>
                    <td>
                      <strong>
                        {earning.mentorId?.name || "Unknown mentor"}
                      </strong>
                      <br />
                      <span className="admin-muted">
                        {earning.mentorId?.email || "No email"}
                      </span>
                    </td>

                    <td>{earning.bookingId || "—"}</td>

                    {/* <td>{formatINR(earning.mentorGrossPaise)}</td> */}
                    <td>{formatINR(earning.payablePaise)}</td>

                    <td>{formatINR(earning.commissionPaise)}</td>

                    <td>
                      <span className="admin-status">
                        {earning.state || "UNKNOWN"}
                      </span>
                    </td>

                    <td>
                      {earning.eligibleAt
                        ? new Date(earning.eligibleAt).toLocaleDateString(
                            "en-IN"
                          )
                        : "Not eligible yet"}
                    </td>

                    <td>
                      {earning.latestPayout
                        ? earning.latestPayout.state || "Record available"
                        : "No payout record"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <p className="admin-muted">
        This page is currently for reviewing records only. It does not
        approve, retry, or initiate payouts.
      </p>
    </main>
  );
}
