import { useState } from "react";

const API_URL = "http://localhost:5000/api/v1";

function SessionCompletion() {
const [token, setToken] = useState("");
const [bookingId, setBookingId] = useState("");
const [role, setRole] = useState("MENTOR");
const [reason, setReason] = useState("");
const [message, setMessage] = useState("");
const [loading, setLoading] = useState(false);
const [result, setResult] = useState(null);

const handleAction = async (action) => {
if (!token.trim() || !bookingId.trim()) {
setMessage("Please enter your access token and booking ID.");
return;
}

if (action === "dispute-completion" && !reason.trim()) {
  setMessage("Please enter the dispute reason.");
  return;
}

setLoading(true);
setMessage("");
setResult(null);

try {
  const response = await fetch(
    `${API_URL}/bookings/${bookingId.trim()}/${action}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        "Content-Type": "application/json",
      },
      ...(action === "dispute-completion"
        ? { body: JSON.stringify({ reason: reason.trim() }) }
        : {}),
    }
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Action failed.");
  }

  setResult(data);
  setMessage(data.message || "Action completed successfully.");
} catch (error) {
  setMessage(error.message || "Could not connect to backend.");
} finally {
  setLoading(false);
}

};

return ( <main className="session-page"> <section className="session-card"> <p>THRONE8 · MENTOR PORTAL</p> <h1>Session Completion</h1> <p>
Mentor requests completion after the scheduled session.
The student confirms completion or raises a dispute. </p>

    <label htmlFor="session-role">Login role</label>
    <select
      id="session-role"
      value={role}
      onChange={(event) => setRole(event.target.value)}
    >
      <option value="MENTOR">Mentor</option>
      <option value="STUDENT">Student</option>
    </select>

    <label htmlFor="session-booking">Booking ID</label>
    <input
      id="session-booking"
      value={bookingId}
      onChange={(event) => setBookingId(event.target.value)}
      placeholder="Enter booking ID"
    />

    <label htmlFor="session-token">
      {role === "MENTOR" ? "Mentor access token" : "Student access token"}
    </label>
    <input
      id="session-token"
      type="password"
      value={token}
      onChange={(event) => setToken(event.target.value)}
      placeholder="Paste your login token"
      autoComplete="off"
    />

    {role === "MENTOR" ? (
      <button
        disabled={loading}
        onClick={() => handleAction("request-completion")}
      >
        {loading ? "Please wait..." : "Request Session Completion"}
      </button>
    ) : (
      <>
        <button
          disabled={loading}
          onClick={() => handleAction("confirm-completion")}
        >
          Confirm Session Completion
        </button>

        <label htmlFor="dispute-reason">Dispute reason (if needed)</label>
        <textarea
          id="dispute-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Explain why you dispute the completion"
        />

        <button
          disabled={loading}
          onClick={() => handleAction("dispute-completion")}
        >
          Raise Dispute
        </button>
      </>
    )}

    {message && <p role="status">{message}</p>}

    {result?.booking && (
      <section>
        <h2>Booking Status: {result.booking.status}</h2>
        <p>
          Completion requested:{" "}
          {result.booking.completionRequestedAt
            ? new Date(result.booking.completionRequestedAt).toLocaleString()
            : "No"}
        </p>
        <p>
          Completed at:{" "}
          {result.booking.completedAt
            ? new Date(result.booking.completedAt).toLocaleString()
            : "Not completed"}
        </p>
        <p>
          Payout eligible date:{" "}
          {result.booking.payoutEligibleAt
            ? new Date(result.booking.payoutEligibleAt).toLocaleDateString()
            : "Not eligible yet"}
        </p>
      </section>
    )}

    <p>
      Never share your access token. Confirmation requires a valid booking
      and the scheduled session to have ended.
    </p>
  </section>
</main>

);
}

export default SessionCompletion;
