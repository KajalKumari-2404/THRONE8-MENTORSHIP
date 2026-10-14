
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";

export default function BookSession() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mentors, setMentors] = useState([]);
  const [mentorId, setMentorId] = useState(
    location.state?.mentorId || ""
  );
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchMentors() {
      try {
        const token = sessionStorage.getItem("throne8Token");

        if (!token) {
          throw new Error("Please log in with your student account.");
        }

        const response = await api.get("/mentors/available", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (active) {
          setMentors(response.data.mentors || []);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load available mentors."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchMentors();

    return () => {
      active = false;
    };
  }, []);

  const handleBooking = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!mentorId || !slotStart || !slotEnd) {
      setError("Please select a mentor and both session times.");
      return;
    }

    if (new Date(slotStart) <= new Date()) {
      setError("Session start time must be in the future.");
      return;
    }

    if (new Date(slotEnd) <= new Date(slotStart)) {
      setError("End time must be after start time.");
      return;
    }

    try {
      setSubmitting(true);
      const token = sessionStorage.getItem("throne8Token");

      const response = await api.post(
        "/bookings",
        {
          mentorId,
          slotStart: new Date(slotStart).toISOString(),
          slotEnd: new Date(slotEnd).toISOString(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage(
        response.data?.message ||
          "Booking created successfully! Your session is awaiting payment."
      );
      setSlotStart("");
      setSlotEnd("");

      setTimeout(() => navigate("/dashboard"), 2500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Booking failed. Please check your selected time and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="booking-page">
        <section className="booking-panel booking-loading" role="status">
          <div className="booking-spinner" />
          <h2>Finding your mentor...</h2>
          <p>Checking currently available mentors.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="booking-page">
      <section className="booking-heading">
        <span className="booking-eyebrow">THRONE8 MENTORSHIP</span>
        <h1>Book your <span>mentorship session</span></h1>
        <p>
          Choose your mentor, select a convenient time, and take the
          next step in your learning journey.
        </p>
      </section>

      <div className="booking-layout">
        <section className="booking-panel">
          <div className="booking-panel-heading">
            <div className="booking-icon">✦</div>
            <div>
              <h2>Session details</h2>
              <p>Fill in the details below to request a session.</p>
            </div>
          </div>

          {error && (
            <div className="booking-alert booking-alert-error" role="alert">
              <strong>Something needs your attention</strong>
              <p>{error}</p>
            </div>
          )}

          {message && (
            <div className="booking-alert booking-alert-success" role="status">
              <strong>Booking request created</strong>
              <p>{message}</p>
              <p>Taking you to your dashboard shortly...</p>
            </div>
          )}

          {mentors.length === 0 ? (
            <div className="booking-empty">
              <div className="booking-empty-icon">⌕</div>
              <h3>No eligible mentors available</h3>
              <p>
                There are no verified, bookable mentors available right now.
                Please try again later.
              </p>
              <button
                type="button"
                className="booking-secondary-button"
                onClick={() => navigate("/mentors")}
              >
                Back to mentor discovery
              </button>
            </div>
          ) : (
            <form className="booking-form" onSubmit={handleBooking}>
              <label htmlFor="mentor">Choose your mentor</label>
              <select
                id="mentor"
                value={mentorId}
                onChange={(e) => setMentorId(e.target.value)}
                required
                disabled={submitting}
              >
                <option value="">Select an available mentor</option>
                {mentors.map((mentor) => (
                  <option key={mentor._id} value={mentor._id}>
                    {mentor.name || mentor.fullName || "Mentor"}
                    {mentor.headline ? ` — ${mentor.headline}` : ""}
                  </option>
                ))}
              </select>

              <div className="booking-field-note">
                Only mentors returned by the availability API are listed.
              </div>

              <div className="booking-time-grid">
                <div>
                  <label htmlFor="slotStart">Session start</label>
                  <input
                    id="slotStart"
                    type="datetime-local"
                    value={slotStart}
                    min={getLocalDateTime()}
                    onChange={(e) => {
                      setSlotStart(e.target.value);
                      if (
                        slotEnd &&
                        new Date(slotEnd) <= new Date(e.target.value)
                      ) {
                        setSlotEnd("");
                      }
                    }}
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label htmlFor="slotEnd">Session end</label>
                  <input
                    id="slotEnd"
                    type="datetime-local"
                    value={slotEnd}
                    min={slotStart || getLocalDateTime()}
                    onChange={(e) => setSlotEnd(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="booking-price-row">
                <div>
                  <span className="booking-price-label">Session price</span>
                  <strong>₹1,000</strong>
                </div>
                <span className="booking-price-badge">Per session</span>
              </div>

              <button
                type="submit"
                className="booking-submit-button"
                disabled={submitting || Boolean(message)}
              >
                {submitting ? (
                  <>
                    <span className="booking-button-spinner" />
                    Creating booking...
                  </>
                ) : (
                  "Confirm booking request →"
                )}
              </button>

              <p className="booking-disclaimer">
                Your booking request is subject to server-side availability
                and validation. Payment status will be handled by the
                existing booking/payment flow.
              </p>
            </form>
          )}
        </section>

        <aside className="booking-summary">
          <span className="booking-summary-label">YOUR SESSION</span>
          <h2>A little guidance can change everything.</h2>
          <p>
            Make time for focused learning, clear questions, and
            actionable next steps with your mentor.
          </p>

          <div className="booking-summary-divider" />

          <div className="booking-benefit">
            <span>✓</span>
            <div>
              <strong>Personalized guidance</strong>
              <p>Discuss your goals with your selected mentor.</p>
            </div>
          </div>

          <div className="booking-benefit">
            <span>✓</span>
            <div>
              <strong>Choose your time</strong>
              <p>Select a future start time and a valid end time.</p>
            </div>
          </div>

          <div className="booking-benefit">
            <span>✓</span>
            <div>
              <strong>Track your booking</strong>
              <p>Visit your dashboard to check your session status.</p>
            </div>
          </div>

          <button
            type="button"
            className="booking-back-button"
            onClick={() => navigate("/mentors")}
          >
            ← Explore mentors
          </button>
        </aside>
      </div>
    </main>
  );
}

function getLocalDateTime() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}
