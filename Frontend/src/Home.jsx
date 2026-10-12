import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
return ( <div className="home-page"> <nav className="home-navbar"> <Link to="/" className="home-logo">
THRONE<span>8</span> </Link>

    <div className="home-nav-links">
      <a href="#features">Features</a>
      <a href="#about">About</a>
      <Link to="/login">Login</Link>
      <Link to="/register" className="home-register-btn">
        Get Started
      </Link>
    </div>
  </nav>

  <main className="home-hero">
    <div className="home-badge">
      Your Growth. Your Mentorship.
    </div>

    <h1>
      Learn from Experts.
      <br />
      <span>Grow Beyond Limits.</span>
    </h1>

    <p>
      Connect with experienced mentors, book personalized
      sessions, and take the next step toward your career goals
      with THRONE8.
    </p>

    <div className="home-actions">
      <Link to="/register" className="home-primary-btn">
        Find Your Mentor →
      </Link>

      <Link to="/login" className="home-secondary-btn">
        Login to Account
      </Link>
    </div>

    <div className="home-stats">
      <div>
        <h3>1:1</h3>
        <p>Personal Mentorship</p>
      </div>

      <div>
        <h3>Flexible</h3>
        <p>Session Scheduling</p>
      </div>

      <div>
        <h3>Secure</h3>
        <p>Online Payments</p>
      </div>
    </div>
  </main>

  <section className="home-features" id="features">
    <h2>Everything You Need to Grow</h2>
    <p className="home-section-subtitle">
      A simple platform to learn, connect, and move forward.
    </p>

    <div className="home-feature-grid">
      <article className="home-feature-card">
        <div className="home-feature-icon">🎯</div>
        <h3>Find the Right Mentor</h3>
        <p>
          Connect with mentors who can guide your learning and
          career journey.
        </p>
      </article>

      <article className="home-feature-card">
        <div className="home-feature-icon">📅</div>
        <h3>Book Sessions</h3>
        <p>
          Manage mentorship bookings and keep track of your
          upcoming sessions.
        </p>
      </article>

      <article className="home-feature-card">
        <div className="home-feature-icon">💳</div>
        <h3>Simple Payments</h3>
        <p>
          Complete your session payments through the platform's
          payment workflow.
        </p>
      </article>
    </div>
  </section>

  <section className="home-about" id="about">
    <h2>Your Next Step Starts Here</h2>
    <p>
      Whether you are learning new skills or sharing your
      experience, THRONE8 helps make mentorship more accessible.
    </p>
    <Link to="/register" className="home-primary-btn">
      Join THRONE8 →
    </Link>
  </section>

  <footer className="home-footer">
    © {new Date().getFullYear()} THRONE8 Mentorship Platform
  </footer>
</div>

);
}

export default Home;
