
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MentorDiscovery.css";

const API_URL = "http://localhost:5000/api/v1";

function formatINR(paise) {
  if (paise == null) return "Price shown during booking";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(paise) / 100);
}

function getMentorSkills(mentor) {
  const skills = mentor.skills ?? mentor.expertise ?? [];

  if (Array.isArray(skills)) return skills.filter(Boolean);
  if (typeof skills === "string") {
    return skills.split(/[,|]/).map((skill) => skill.trim()).filter(Boolean);
  }

  return [];
}

export default function MentorDiscovery() {
  const navigate = useNavigate();

  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("ALL");

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
        const response = await fetch(`${API_URL}/mentors/available`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Could not load available mentors.");
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
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadMentors();
    return () => controller.abort();
  }, []);

  const availableSkills = useMemo(() => {
    const skills = mentors.flatMap(getMentorSkills);
    return [...new Set(skills)].sort((a, b) => a.localeCompare(b));
  }, [mentors]);

  const filteredMentors = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return mentors.filter((mentor) => {
      const skills = getMentorSkills(mentor);
      const name = mentor.name || mentor.fullName || "Mentor";
      const headline = mentor.headline || mentor.title || "Verified mentor";
      const experience = mentor.experienceYears ?? "";

      const searchableText = [
        name,
        headline,
        mentor.email || "",
        ...skills,
        experience,
      ].join(" ").toLowerCase();

      const matchesSearch = searchableText.includes(query);
      const matchesSkill =
        selectedSkill === "ALL" || skills.includes(selectedSkill);

      return matchesSearch && matchesSkill;
    });
  }, [mentors, searchTerm, selectedSkill]);

  function clearFilters() {
    setSearchTerm("");
    setSelectedSkill("ALL");
  }

  return (
    <main className="mentor-discovery">
      <header className="mentor-discovery-header">
        <p className="mentor-eyebrow">THRONE8 MENTORSHIP</p>
        <h1>Find Your Mentor</h1>
        <p>
          Learn from experienced professionals. Find the right guidance
          for your goals and take your next career step.
        </p>
        <div className="mentor-header-stats">
          <span><strong>{mentors.length}</strong> available mentors</span>
          <span><strong>1:1</strong> mentorship sessions</span>
          <span><strong>Career</strong> focused learning</span>
        </div>
      </header>

      {!loading && !error && mentors.length > 0 && (
        <section className="mentor-tools" aria-label="Find a mentor">
          <div className="mentor-search-wrap">
            <label htmlFor="mentor-search">Search mentors</label>
            <input
              id="mentor-search"
              type="search"
              placeholder="Search by name, expertise or experience..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="mentor-filter-wrap">
            <label htmlFor="mentor-skill-filter">Expertise</label>
            <select
              id="mentor-skill-filter"
              value={selectedSkill}
              onChange={(event) => setSelectedSkill(event.target.value)}
            >
              <option value="ALL">All expertise</option>
              {availableSkills.map((skill) => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
          </div>

          <div className="mentor-results-info">
            <span>
              Showing <strong>{filteredMentors.length}</strong> of{" "}
              <strong>{mentors.length}</strong> mentors
            </span>
            {(searchTerm || selectedSkill !== "ALL") && (
              <button type="button" className="mentor-clear-button" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        </section>
      )}

      {loading && (
        <section className="mentor-state" role="status">
          <div className="mentor-loader" />
          <h2>Finding your mentors...</h2>
          <p>Loading available mentorship profiles.</p>
        </section>
      )}

      {!loading && error && (
        <section className="mentor-state mentor-error" role="alert">
          <h2>Unable to load mentors</h2>
          <p>{error}</p>
          <button type="button" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </section>
      )}

      {!loading && !error && mentors.length === 0 && (
        <section className="mentor-state">
          <div className="mentor-empty-icon">✦</div>
          <h2>No mentors available right now</h2>
          <p>Please check again later. New mentorship profiles may become available.</p>
        </section>
      )}

      {!loading && !error && mentors.length > 0 && filteredMentors.length === 0 && (
        <section className="mentor-state">
          <div className="mentor-empty-icon">⌕</div>
          <h2>No matching mentors</h2>
          <p>Try a different name, expertise or search term.</p>
          <button type="button" onClick={clearFilters}>Clear filters</button>
        </section>
      )}

      {!loading && !error && filteredMentors.length > 0 && (
        <section className="mentor-grid" aria-label="Available mentors">
          {filteredMentors.map((mentor, index) => {
            const id = mentor._id || mentor.id;
            const name = mentor.name || mentor.fullName || "Mentor";
            const skills = getMentorSkills(mentor);

            return (
              <article className="mentor-card" key={id || `${name}-${index}`}>
                <div className="mentor-card-top">
                  <div className="mentor-avatar" aria-hidden="true">
                    {name.trim().charAt(0).toUpperCase() || "M"}
                  </div>
                  <span className="mentor-verified">
                    <span className="mentor-verified-dot" />
                    Verified mentor
                  </span>
                </div>

                <h2>{name}</h2>
                <p className="mentor-role">
                  {mentor.headline || mentor.title || "Mentorship & career guidance"}
                </p>

                {skills.length > 0 ? (
                  <div className="mentor-skill-list" aria-label="Expertise">
                    {skills.map((skill) => (
                      <span className="mentor-skill-tag" key={skill}>{skill}</span>
                    ))}
                  </div>
                ) : (
                  <p className="mentor-profile-note">
                    Connect for personalised learning and career guidance.
                  </p>
                )}

                <div className="mentor-card-details">
                  <div>
                    <span className="mentor-detail-icon">◷</span>
                    <span>
                      {mentor.experienceYears != null
                        ? `${mentor.experienceYears} years experience`
                        : "Professional guidance"}
                    </span>
                  </div>
                </div>

                <div className="mentor-card-footer">
                  <div className="mentor-price-block">
                    <span className="mentor-price-label">SESSION PRICE</span>
                    <strong>
                      {formatINR(mentor.pricePaise ?? mentor.sessionPricePaise)}
                    </strong>
                  </div>
                  <button
                    type="button"
                    className="mentor-book-button"
                    disabled={!id}
                    onClick={() =>
                      navigate("/book-session", { state: { mentorId: id } })
                    }
                  >
                    Book Session <span aria-hidden="true">→</span>
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <footer className="mentor-discovery-footer">
        <span className="mentor-footer-mark">T</span>
        <p>THRONE8 Mentorship</p>
        <span>Learn. Connect. Grow.</span>
      </footer>
    </main>
  );
}
