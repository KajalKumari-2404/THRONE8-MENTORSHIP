
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api/v1";

function formatINR(paise) {
  if (paise == null) return "Price shown during booking";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(paise) / 100);
}

export default function MentorDiscovery() {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadMentors() {
      const token = sessionStorage.getItem("throne8Token");

      if (!token) {
        setError("Please log in with your student account first.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/mentors/available`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Could not load available mentors."
          );
        }

        const list = Array.isArray(data.mentors)
          ? data.mentors
          : Array.isArray(data.data)
            ? data.data
            : [];

        setMentors(list);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unable to load mentors.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadMentors();

    return () => controller.abort();
  }, []);

  return (
    <main className="mentor-discovery">
      <header className="mentor-discovery-header">
        <p className="mentor-eyebrow">THRONE8 MENTORSHIP</p>
        <h1>Find Your Mentor</h1>
        <p>
          Discover available mentors and take the next step in your
          learning journey.
        </p>
      </header>

      {loading && (
        <p className="mentor-state" role="status">
          Loading available mentors...
        </p>
      )}

      {!loading && error && (
        <section className="mentor-state mentor-error" role="alert">
          <h2>Unable to load mentors</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Try Again
          </button>
        </section>
      )}

      {!loading && !error && mentors.length === 0 && (
        <section className="mentor-state">
          <h2>No mentors available right now</h2>
          <p>Please check again later.</p>
        </section>
      )}

      {!loading && !error && mentors.length > 0 && (
        <section className="mentor-grid">
          {mentors.map((mentor) => {
            const id = mentor._id || mentor.id;

            return (
              <article className="mentor-card" key={id}>
                <div className="mentor-avatar" aria-hidden="true">
                  {(mentor.name || mentor.fullName || "M")
                    .trim()
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <h2>{mentor.name || mentor.fullName || "Mentor"}</h2>

                <p className="mentor-role">
                  {mentor.headline || mentor.title || "Verified mentor"}
                </p>

                {(mentor.skills || mentor.expertise) && (
                  <p className="mentor-skills">
                    {Array.isArray(mentor.skills || mentor.expertise)
                      ? (mentor.skills || mentor.expertise).join(" · ")
                      : mentor.skills || mentor.expertise}
                  </p>
                )}

                {mentor.experienceYears != null && (
                  <p>
                    Experience: {mentor.experienceYears} years
                  </p>
                )}

                <div className="mentor-card-footer">
                  <span>
                    {formatINR(
                      mentor.pricePaise ?? mentor.sessionPricePaise
                    )}
                  </span>

                  <button
                    disabled={!id}
                    onClick={() =>
                      navigate("/book-session", {
                        state: { mentorId: id },
                      })
                    }
                  >
                    Book Session
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
