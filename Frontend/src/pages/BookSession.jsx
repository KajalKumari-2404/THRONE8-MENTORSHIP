
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function BookSession() {
  const navigate = useNavigate();

  const [mentors, setMentors] = useState([]);
  const [mentorId, setMentorId] = useState("");
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const token = sessionStorage.getItem("throne8Token");

        const response = await api.get("/mentors/available", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setMentors(response.data.mentors || []);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load available mentors."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, []);

  const handleBooking = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!mentorId || !slotStart || !slotEnd) {
      setError("Please select a mentor, start time and end time.");
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

      
setMessage("Booking created successfully! Your session is now awaiting payment.");
setSlotStart("");
setSlotEnd("");

setTimeout(() => navigate("/dashboard"), 2500);
    } catch (err) {
      setError(
        err.response?.data?.message || "Booking failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading available mentors...</p>;

  return (
    <main style={{ maxWidth: 650, margin: "40px auto", padding: 24 }}>
      <h1>Book a Mentorship Session</h1>
      <p>Select a verified mentor and choose your session time.</p>

      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      {mentors.length === 0 ? (
        <p>No eligible mentors are available right now.</p>
      ) : (
        <form onSubmit={handleBooking}>
          <label htmlFor="mentor">Choose Mentor</label>
          <select
            id="mentor"
            value={mentorId}
            onChange={(e) => setMentorId(e.target.value)}
            required
            style={fieldStyle}
          >
            <option value="">Select a mentor</option>
            {mentors.map((mentor) => (
              <option key={mentor._id} value={mentor._id}>
                {mentor.name} ({mentor.email})
              </option>
            ))}
          </select>

          <label htmlFor="slotStart">Session Start</label>
          <input
            id="slotStart"
            type="datetime-local"
            value={slotStart}
            min={getLocalDateTime()}
            onChange={(e) => setSlotStart(e.target.value)}
            required
            style={fieldStyle}
          />

          <label htmlFor="slotEnd">Session End</label>
          <input
            id="slotEnd"
            type="datetime-local"
            value={slotEnd}
            min={slotStart || getLocalDateTime()}
            onChange={(e) => setSlotEnd(e.target.value)}
            required
            style={fieldStyle}
          />

          <p>Session price: ₹1,000</p>

          <button type="submit" disabled={submitting} style={buttonStyle}>
            {submitting ? "Creating Booking..." : "Book Session"}
          </button>
        </form>
      )}
    </main>
  );
}

function getLocalDateTime() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

const fieldStyle = {
  display: "block",
  width: "100%",
  padding: 12,
  margin: "8px 0 20px",
  boxSizing: "border-box",
};

const buttonStyle = {
  padding: "12px 20px",
  cursor: "pointer",
};