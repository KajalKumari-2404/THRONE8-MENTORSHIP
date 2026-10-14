
import { useEffect, useState } from "react";
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

export default function MentorEarnings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchEarnings = async () => {
  const token = sessionStorage.getItem("throne8Token");

  if (!token) {
    setError("Please log in to view earnings.");
    setLoading(false);
    setRefreshing(false);
    return;
  }

  try {
    setError("");

    const response = await api.get("/mentor/earnings", {
      headers: { Authorization: `Bearer ${token}` },
    });

    setData(response.data);
  } catch (err) {
    setError(
      err.response?.data?.message || "Unable to load mentor earnings."
    );
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  useEffect(() => {
    fetchEarnings();
  }, []);

  const summary = data?.summary;

  const cards = [
    ["Total Earned", summary?.totalEarnedPaise],
    ["Session Pending", summary?.pendingSessionPaise],
    ["15-Day Hold", summary?.holdingPaise],
    ["Eligible", summary?.eligiblePaise],
    ["Processing", summary?.processingPaise],
    ["Paid", summary?.paidPaise],
    ["On Hold", summary?.onHoldPaise],
    ["Reversed", summary?.reversedPaise],
  ];

  // if (loading) return <main className="earnings-page">
  //   <h1>EARNINGS COMPONENT LOADED</h1>
  //   <p>Loading earnings...</p></main>;

  if (loading) {
  return (
    <main className="earnings-page">
      <p>Loading earnings...</p>
    </main>
  );
}

  return (
    <main className="earnings-page">
        {/* <h1>EARNINGS COMPONENT LOADED</h1> */}
      <header className="earnings-header">
        <div>
          <span className="earnings-eyebrow">THRONE8 MENTOR PORTAL</span>
          <h1>My Earnings</h1>
          <p>Track your mentorship earnings and payout status.</p>
        </div>
        {/* <button onClick={fetchEarnings}>Refresh</button> */}
        <button
  onClick={() => {
    setRefreshing(true);
    fetchEarnings();
  }}
  disabled={refreshing}
>
  {refreshing ? "Refreshing..." : "Refresh"}
</button>
      </header>

      {error && (
        <div className="earnings-error">
          {error}
          <button onClick={fetchEarnings}>Retry</button>
        </div>
      )}

      {data && (
        <>
          <section className="earnings-grid">
            {cards.map(([title, amount]) => (
              <article className="earnings-card" key={title}>
                <span>{title}</span>
                <strong>{money(amount)}</strong>
              </article>
            ))}
          </section>

          <section className="earnings-panel">
            <h2>Earning History</h2>
            <p className="earnings-note">
              Earnings remain on hold for 15 days after student-confirmed
              session completion. Eligible earnings are not necessarily paid.
            </p>

            {data.earnings?.length ? (
              <div className="earnings-list">
                {data.earnings.map((earning) => (
                  <article className="earning-row" key={earning._id}>
                    <div className="earning-main">
                      <strong>{money(earning.payablePaise)}</strong>
                      <span>
                        {labels[earning.state] || earning.state}
                      </span>
                      <small>
                        Booking: {earning.bookingId}
                      </small>
                    </div>

                    <div className="earning-details">
                      <span>
                        Session amount: {money(earning.grossPaise)}
                      </span>
                      <span>
                        Platform commission: {money(earning.commissionPaise)}
                      </span>
                      <span>
                        {earning.eligibleAt
                          ? `Eligible date: ${new Date(
                              earning.eligibleAt
                            ).toLocaleDateString("en-IN")}`
                          : "Eligibility pending session confirmation"}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p>No earnings available yet.</p>
            )}
          </section>

          <section className="earnings-panel">
            <h2>Payout History</h2>
            {data.payouts?.length ? (
              data.payouts.map((payout) => (
                <article className="earning-row" key={payout._id}>
                  <strong>
                    {money(payout.amountPaise ?? payout.amount ?? 0)}
                  </strong>
                  <span>{payout.status || payout.state || "Status unavailable"}</span>
                </article>
              ))
            ) : (
              <p>No payouts recorded yet.</p>
            )}
          </section>
        </>
      )}
    </main>
  );
}