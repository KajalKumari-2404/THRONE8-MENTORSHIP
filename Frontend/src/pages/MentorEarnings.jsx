
import { useCallback, useEffect, useState } from "react";
import api from "../api";
import "./MentorEarnings.css";

const money = (paise = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((Number(paise) || 0) / 100);

const labels = {
  PENDING_SESSION: "Session Pending",
  HOLDING: "15-Day Hold",
  ELIGIBLE: "Eligible for Payout",
  PROCESSING: "Payout Processing",
  PAID: "Paid",
  ON_HOLD: "On Hold",
  REVERSED: "Reversed",
};

const statusClass = (state = "") => {
  const value = state.toUpperCase();

  if (["PAID", "ELIGIBLE"].includes(value)) return "success";
  if (["HOLDING", "PENDING_SESSION", "PROCESSING"].includes(value))
    return "warning";
  if (["ON_HOLD", "REVERSED", "FAILED"].includes(value))
    return "danger";

  return "neutral";
};

const formatDate = (date) => {
  if (!date) return null;

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function EmptyState({ icon, title, description }) {
  return (
    <div className="earnings-empty">
      <div className="earnings-empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export default function MentorEarnings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchEarnings = useCallback(async () => {
    const token = sessionStorage.getItem("throne8Token");

    if (!token) {
      setError("Please log in to view your earnings.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError("");

      const response = await api.get("/mentor/earnings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setData(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load mentor earnings. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const summary = data?.summary;

  const cards = [
    {
      title: "Total Earned",
      amount: summary?.totalEarnedPaise,
      icon: "₹",
      description: "Your total recorded earnings",
      className: "finance-metric-purple",
    },
    {
      title: "Session Pending",
      amount: summary?.pendingSessionPaise,
      icon: "◷",
      description: "Awaiting session completion",
      className: "finance-metric-blue",
    },
    {
      title: "15-Day Hold",
      amount: summary?.holdingPaise,
      icon: "⌛",
      description: "In the mandatory holding period",
      className: "finance-metric-orange",
    },
    {
      title: "Eligible",
      amount: summary?.eligiblePaise,
      icon: "✓",
      description: "Eligible for payout processing",
      className: "finance-metric-green",
    },
    {
      title: "Processing",
      amount: summary?.processingPaise,
      icon: "↻",
      description: "Payout being processed",
      className: "finance-metric-blue",
    },
    {
      title: "Paid",
      amount: summary?.paidPaise,
      icon: "✓",
      description: "Recorded as paid",
      className: "finance-metric-green",
    },
    {
      title: "On Hold",
      amount: summary?.onHoldPaise,
      icon: "!",
      description: "Temporarily on hold",
      className: "finance-metric-orange",
    },
    {
      title: "Reversed",
      amount: summary?.reversedPaise,
      icon: "↩",
      description: "Reversed earning records",
      className: "finance-metric-red",
    },
  ];

  if (loading) {
    return (
      <main className="earnings-page">
        <section className="earnings-panel">
          <div className="earnings-loading">
            <div className="earnings-spinner" />
            <h2>Loading your earnings</h2>
            <p>Getting your latest earnings and payout information...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="earnings-page">
      <header className="earnings-header">
        <div>
          <span className="earnings-eyebrow">
            THRONE8 MENTOR PORTAL
          </span>

          <h1>My Earnings</h1>

          <p>
            Track your mentorship earnings, holding period and payout status.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchEarnings}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "↻ Refresh"}
        </button>
      </header>

      {error && (
        <div className="earnings-error" role="alert">
          <div>
            <strong>We couldn't load your earnings</strong>
            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              fetchEarnings();
            }}
            disabled={refreshing}
          >
            {refreshing ? "Retrying..." : "Try again"}
          </button>
        </div>
      )}

      {data && (
        <>
          <section className="earnings-overview">
            <div className="earnings-section-heading">
              <div>
                <span className="earnings-eyebrow">FINANCIAL OVERVIEW</span>
                <h2>Your earnings at a glance</h2>
                <p>See how your mentorship earnings are distributed.</p>
              </div>
            </div>

            <div className="earnings-grid">
              {cards.map((card) => (
                <article
                  className={`earnings-card ${card.className}`}
                  key={card.title}
                >
                  <div className="earnings-card-top">
                    <span>{card.title}</span>
                    <span className="earnings-card-icon" aria-hidden="true">
                      {card.icon}
                    </span>
                  </div>

                  <strong>{money(card.amount)}</strong>
                  <small>{card.description}</small>
                </article>
              ))}
            </div>
          </section>

          <section className="earnings-panel">
            <div className="earnings-panel-heading">
              <div>
                <span className="earnings-eyebrow">TRANSACTION RECORDS</span>
                <h2>Earning History</h2>
                <p>
                  Review the amount, commission and status of each earning.
                </p>
              </div>

              <span className="earnings-count">
                {data.earnings?.length || 0} records
              </span>
            </div>

            <div className="earnings-note">
              <span aria-hidden="true">ⓘ</span>
              <p>
                After student-confirmed session completion, earnings remain
                on hold for 15 days. Eligibility does not mean that a payout
                has been completed.
              </p>
            </div>

            {data.earnings?.length ? (
              <div className="earnings-list">
                {data.earnings.map((earning) => {
                  const eligibleDate = formatDate(earning.eligibleAt);

                  return (
                    <article className="earning-row" key={earning._id}>
                      <div className="earning-main">
                        <div className="earning-amount-line">
                          <strong>
                            {money(earning.payablePaise)}
                          </strong>

                          <span
                            className={`earnings-status ${statusClass(
                              earning.state
                            )}`}
                          >
                            {labels[earning.state] ||
                              earning.state ||
                              "Status unavailable"}
                          </span>
                        </div>

                        <div className="earning-booking">
                          <span>BOOKING REFERENCE</span>
                          <code>{earning.bookingId || "Not available"}</code>
                        </div>
                      </div>

                      <div className="earning-details">
                        <div>
                          <span>Session amount</span>
                          <strong>{money(earning.grossPaise)}</strong>
                        </div>

                        <div>
                          <span>Platform commission</span>
                          <strong>
                            {money(earning.commissionPaise)}
                          </strong>
                        </div>

                        <div>
                          <span>Eligibility date</span>
                          <strong>
                            {eligibleDate ||
                              "Pending session confirmation"}
                          </strong>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon="₹"
                title="No earnings yet"
                description="Your earning records will appear here when they become available."
              />
            )}
          </section>

          <section className="earnings-panel">
            <div className="earnings-panel-heading">
              <div>
                <span className="earnings-eyebrow">PAYOUT RECORDS</span>
                <h2>Payout History</h2>
                <p>
                  Review payouts recorded by the platform.
                </p>
              </div>

              <span className="earnings-count">
                {data.payouts?.length || 0} records
              </span>
            </div>

            {data.payouts?.length ? (
              <div className="earnings-list">
                {data.payouts.map((payout) => {
                  const payoutStatus =
                    payout.status || payout.state || "Status unavailable";

                  return (
                    <article className="earning-row" key={payout._id}>
                      <div className="earning-main">
                        <div className="earning-amount-line">
                          <strong>
                            {money(
                              payout.amountPaise ?? payout.amount ?? 0
                            )}
                          </strong>

                          <span
                            className={`earnings-status ${statusClass(
                              payoutStatus
                            )}`}
                          >
                            {labels[payoutStatus] || payoutStatus}
                          </span>
                        </div>

                        <small>
                          Payout reference: {payout._id}
                        </small>
                      </div>

                      <div className="earning-details">
                        <div>
                          <span>Status</span>
                          <strong>{payoutStatus}</strong>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon="↗"
                title="No payouts recorded yet"
                description="When payouts are recorded, their amounts and statuses will appear here. Earnings shown above are not necessarily money transferred."
              />
            )}
          </section>

          <footer className="earnings-footer">
            <span aria-hidden="true">🔒</span>
            <p>
              Earnings and payout statuses are based on the records currently
              available from THRONE8. A displayed balance does not by itself
              confirm a completed bank transfer.
            </p>
          </footer>
        </>
      )}
    </main>
  );
}