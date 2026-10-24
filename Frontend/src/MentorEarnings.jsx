
import { useState } from "react";

const API_URL = "http://localhost:5000/api/v1";
// const API_URL = "https://throne8-mentorship-api.onrender.com/api/v1";

const formatINR = (paise = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);

const formatDate = (date) => {
  if (!date) return "Not scheduled";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const statusLabel = (state) =>
  ({
    PENDING_SESSION: "Session pending",
    HOLDING: "15-day hold",
    ELIGIBLE: "Eligible",
    PROCESSING: "Processing",
    PAID: "Paid",
    ON_HOLD: "On hold",
    REVERSED: "Reversed",
  })[state] || state;

function MentorEarnings() {
  const [token, setToken] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchEarnings = async (event) => {
    event.preventDefault();
    if (!token.trim()) {
      setError("Please enter your mentor access token.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/mentor/earnings`, {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not load earnings.");
      }

      setData(result);
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const summary = data?.summary;

  const cards = [
    ["Total recorded earnings", summary?.totalEarnedPaise],
    ["Pending session", summary?.pendingSessionPaise],
    ["15-day hold", summary?.holdingPaise],
    ["Eligible for payout", summary?.eligiblePaise],
    ["Processing", summary?.processingPaise],
    ["Paid", summary?.paidPaise],
    ["On hold", summary?.onHoldPaise],
    ["Reversed", summary?.reversedPaise],
  ];

  return (
    <main className="earnings-page">
      <header className="earnings-header">
        <div>
          <p className="earnings-eyebrow">THRONE8 · MENTOR PORTAL</p>
          <h1>My Earnings</h1>
          <p className="earnings-subtitle">
            Track your session earnings, payout eligibility and payout history.
          </p>
        </div>
        <span className="earnings-badge">Mentor Finance</span>
      </header>

      <form className="earnings-token-form" onSubmit={fetchEarnings}>
        <label htmlFor="mentor-token">Mentor access token</label>
        <div className="earnings-token-row">
          <input
            id="mentor-token"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Paste your mentor login token"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Loading..." : "Load earnings"}
          </button>
        </div>
        <p className="earnings-help">
          Your token is sent to your local backend and is not displayed on screen.
        </p>
      </form>

      {error && <p className="earnings-error" role="alert">{error}</p>}

      {data && (
        <>
          <section className="earnings-summary">
            {cards.map(([label, amount]) => (
              <article className="earnings-card" key={label}>
                <p>{label}</p>
                <h2>{formatINR(amount)}</h2>
              </article>
            ))}
          </section>

          <section className="earnings-section">
            <div className="earnings-section-heading">
              <div>
                <h2>Earning history</h2>
                <p>Amounts below reflect recorded earning entries.</p>
              </div>
              <span>{data.earnings.length} entries</span>
            </div>

            {data.earnings.length === 0 ? (
              <p className="earnings-empty">No earning entries found.</p>
            ) : (
              <div className="earnings-table-wrap">
                <table className="earnings-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Gross</th>
                      <th>Commission</th>
                      <th>Mentor amount</th>
                      <th>Status</th>
                      <th>Eligible date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.earnings.map((earning) => (
                      <tr key={earning._id}>
                        <td className="earning-id">
                          {earning.bookingId}
                        </td>
                        <td>{formatINR(earning.grossPaise)}</td>
                        <td>{formatINR(earning.commissionPaise)}</td>
                        <td>{formatINR(earning.payablePaise)}</td>
                        <td>
                          <span
                            className={`earning-status status-${earning.state.toLowerCase()}`}
                          >
                            {statusLabel(earning.state)}
                          </span>
                          {earning.holdReason && (
                            <small className="earning-reason">
                              {earning.holdReason}
                            </small>
                          )}
                        </td>
                        <td>{formatDate(earning.eligibleAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="earnings-section">
            <div className="earnings-section-heading">
              <div>
                <h2>Payout history</h2>
                <p>A payout is marked successful only after backend confirmation.</p>
              </div>
              <span>{data.payouts.length} payouts</span>
            </div>

            {data.payouts.length === 0 ? (
              <p className="earnings-empty">
                No payouts recorded yet. Eligible earnings are not the same as
                money already transferred to your bank.
              </p>
            ) : (
              <div className="earnings-table-wrap">
                <table className="earnings-table">
                  <thead>
                    <tr>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Attempt</th>
                      <th>Created</th>
                      <th>Confirmed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payouts.map((payout) => (
                      <tr key={payout._id}>
                        <td>{formatINR(payout.amountPaise)}</td>
                        <td>
                          <span className="earning-status">
                            {payout.state}
                          </span>
                        </td>
                        <td>{payout.attempt}</td>
                        <td>{formatDate(payout.createdAt)}</td>
                        <td>{formatDate(payout.confirmedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <p className="earnings-disclaimer">
            The 15-day hold begins after verified session completion. It does
            not automatically trigger a bank transfer. Refunds, disputes and
            payout processing may affect the final payable amount.
          </p>
        </>
      )}
    </main>
  );
}

export default MentorEarnings;