
import { useState } from "react";
import "./SessionCompletion.css";

const API_URL = "http://localhost:5000/api/v1";
// const API_URL = "https://throne8-mentorship-api.onrender.com/api/v1";

function getStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem("throne8User") || "null");
  } catch {
    return null;
  }
}

function SessionCompletion() {
  const [token] = useState(
    () => sessionStorage.getItem("throne8Token") || ""
  );

  const [role] = useState(() => {
  try {
    const storedUser = JSON.parse(
      sessionStorage.getItem("throne8User") || "null"
    );

    return String(storedUser?.role || "").toUpperCase();
  } catch {
    return "";
  }
});

  const [bookingId, setBookingId] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleAction = async (action) => {
    if (!token) {
      setMessage("Please log in again to continue.");
      return;
    }

    if (!["MENTOR", "STUDENT"].includes(role)) {
      setMessage("Your login role could not be detected. Please log in again.");
      return;
    }

    if (!bookingId.trim()) {
      setMessage("Please enter the booking ID.");
      return;
    }

    if (action === "request-completion" && role !== "MENTOR") {
      setMessage("Only the mentor can request session completion.");
      return;
    }

    if (
      ["confirm-completion", "dispute-completion"].includes(action) &&
      role !== "STUDENT"
    ) {
      setMessage("Only the student can confirm or dispute completion.");
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
        `${API_URL}/bookings/${encodeURIComponent(
          bookingId.trim()
        )}/${action}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
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

  return (
    <main className="session-page">
      <section className="session-card">
        <p>THRONE8 · MENTOR PORTAL</p>

        <h1>Session Completion</h1>

        <p>
          The mentor requests completion after the scheduled session.
          The student can then confirm completion or raise a dispute.
        </p>

        <label htmlFor="session-role">Logged-in role</label>
        <input
          id="session-role"
          value={role || "Not detected"}
          readOnly
        />

        {!token && (
          <p role="alert">
            Your login session was not found. Please log in again.
          </p>
        )}

        <label htmlFor="session-booking">Booking ID</label>
        <input
          id="session-booking"
          value={bookingId}
          onChange={(event) => setBookingId(event.target.value)}
          placeholder="Enter the booking ID"
          autoComplete="off"
        />

        {role === "MENTOR" && (
          <button
            disabled={loading || !token}
            onClick={() => handleAction("request-completion")}
          >
            {loading ? "Please wait..." : "Request Session Completion"}
          </button>
        )}

        {role === "STUDENT" && (
          <>
            <button
              disabled={loading || !token}
              onClick={() => handleAction("confirm-completion")}
            >
              {loading ? "Please wait..." : "Confirm Session Completion"}
            </button>

            <label htmlFor="dispute-reason">
              Dispute reason
            </label>

            <textarea
              id="dispute-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explain why you dispute the completion"
            />

            <button
              disabled={loading || !token}
              onClick={() => handleAction("dispute-completion")}
            >
              {loading ? "Please wait..." : "Raise Dispute"}
            </button>
          </>
        )}

        {role !== "MENTOR" &&
          role !== "STUDENT" &&
          token && (
            <p role="alert">
              Role not recognized. Please log in again.
            </p>
          )}

        {message && <p role="status">{message}</p>}

        {result?.booking && (
          <section>
            <h2>Booking Status: {result.booking.status}</h2>

            <p>
              Completion requested:{" "}
              {result.booking.completionRequestedAt
                ? new Date(
                    result.booking.completionRequestedAt
                  ).toLocaleString()
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
                ? new Date(
                    result.booking.payoutEligibleAt
                  ).toLocaleDateString()
                : "Not eligible yet"}
            </p>
          </section>
        )}

        <p>
          Your access token stays hidden. Only the authorized mentor or
          student can perform their respective action. The backend must
          validate the booking and session end time.
        </p>
      </section>
    </main>
  );
}

export default SessionCompletion;
