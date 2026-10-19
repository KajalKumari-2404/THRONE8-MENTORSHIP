
import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <div className="home-page">
      {/* <nav className="home-navbar">
        <Link to="/" className="home-logo">
          THRONE<span>8</span>
        </Link> */}

        {/* <div className="home-nav-links">
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <Link to="/login" className="home-login-link">
            Login
          </Link> */}
          {/* <Link to="/register" className="home-register-btn">
            Get Started <span>→</span>
          </Link>
        </div>
      </nav> */}

      
<nav className="home-navbar">
  <Link to="/" className="home-logo">
    THRONE<span>8</span>
  </Link>

  <div className="home-nav-links">
    <a href="#features">Features</a>
    <a href="#about">About</a>

    <Link to="/about">About Us</Link>
    <Link to="/contact">Contact</Link>
    <Link to="/faq">FAQ</Link>

    <Link to="/login" className="home-login-link">
      Login
    </Link>

    <Link to="/register" className="home-register-btn">
      Get Started <span>→</span>
    </Link>
  </div>
</nav>


      <main className="home-hero">
        <div className="home-hero-content">
          <div className="home-badge">
            <span className="home-badge-dot"></span>
            YOUR GROWTH. YOUR MENTORSHIP.
          </div>

          <h1>
            Your Ambition.
            <br />
            Your Mentor.
            <br />
            <span>Your Future.</span>
          </h1>

          <p className="home-hero-description">
            Great careers start with the right guidance. Connect
            with experienced mentors, book personalized sessions,
            and turn your goals into real achievements with THRONE8.
          </p>

          <div className="home-actions">
            <Link to="/register" className="home-primary-btn">
              Find Your Mentor <span>↗</span>
            </Link>

            <Link to="/login" className="home-secondary-btn">
              Explore Your Journey <span>→</span>
            </Link>
          </div>

          <div className="home-trust">
            <div className="home-trust-icon">✓</div>
            <p>
              Personalized guidance <span>·</span> Secure bookings
              <span> ·</span> Career-focused learning
            </p>
          </div>
        </div>

        <div className="home-hero-visual">
          <div className="home-visual-glow"></div>

          <div className="home-orbit home-orbit-one"></div>
          <div className="home-orbit home-orbit-two"></div>

          <div className="home-center-card">
            <div className="home-center-icon">T8</div>
            <p className="home-card-eyebrow">YOUR NEXT CHAPTER</p>
            <h2>Grow with<br />the right guidance.</h2>
            <div className="home-card-line"></div>
            <p className="home-card-caption">
              Small steps. Big possibilities.
            </p>
          </div>

          <div className="home-float-card home-float-top">
            <div className="home-float-icon purple">✦</div>
            <div>
              <strong>Expert Guidance</strong>
              <span>Learn from experience</span>
            </div>
          </div>

          <div className="home-float-card home-float-bottom">
            <div className="home-float-icon green">✓</div>
            <div>
              <strong>Your goals matter</strong>
              <span>Make progress every day</span>
            </div>
          </div>

          <div className="home-decoration home-decoration-one">✳</div>
          <div className="home-decoration home-decoration-two">✦</div>
        </div>
      </main>

      <section className="home-stats">
        <div className="home-stat">
          <span className="home-stat-icon">◎</span>
          <div>
            <h3>1:1</h3>
            <p>Personal mentorship</p>
          </div>
        </div>

        <div className="home-stat">
          <span className="home-stat-icon">◷</span>
          <div>
            <h3>Flexible</h3>
            <p>Session scheduling</p>
          </div>
        </div>

        <div className="home-stat">
          <span className="home-stat-icon">⌑</span>
          <div>
            <h3>Secure</h3>
            <p>Online payments</p>
          </div>
        </div>

        <div className="home-stat">
          <span className="home-stat-icon">↗</span>
          <div>
            <h3>Career-focused</h3>
            <p>Growth and guidance</p>
          </div>
        </div>
      </section>

      <section className="home-features" id="features">
        <div className="home-section-heading">
          <span className="home-section-label">WHY THRONE8</span>
          <h2>
            Everything you need to
            <br />
            <span>move forward.</span>
          </h2>
          <p>
            The right support can change the way you learn, work,
            and build your future.
          </p>
        </div>

        <div className="home-feature-grid">
          <article className="home-feature-card">
            <div className="home-feature-icon feature-purple">✳</div>
            <span className="home-feature-number">01 / CONNECT</span>
            <h3>Find your mentor</h3>
            <p>
              Get guidance from experienced mentors who understand
              your learning and career goals.
            </p>
            <Link to="/register" className="home-feature-link">
              Start connecting <span>↗</span>
            </Link>
          </article>

          <article className="home-feature-card">
            <div className="home-feature-icon feature-blue">◷</div>
            <span className="home-feature-number">02 / SCHEDULE</span>
            <h3>Learn on your terms</h3>
            <p>
              Book mentorship sessions and keep your learning
              journey organized in one place.
            </p>
            <Link to="/register" className="home-feature-link">
              Plan a session <span>↗</span>
            </Link>
          </article>

          <article className="home-feature-card">
            <div className="home-feature-icon feature-green">↗</div>
            <span className="home-feature-number">03 / GROW</span>
            <h3>Build your future</h3>
            <p>
              Turn expert advice into actionable steps and work
              toward your professional goals.
            </p>
            <Link to="/register" className="home-feature-link">
              Begin your journey <span>↗</span>
            </Link>
          </article>
        </div>
      </section>

      <section className="home-about" id="about">
        <div className="home-about-content">
          <span className="home-section-label">YOUR NEXT CHAPTER</span>
          <h2>
            You have the ambition.
            <br />
            <span>Let's build the future.</span>
          </h2>
          <p>
            Whether you're learning new skills or sharing your
            expertise, THRONE8 brings people together to make
            mentorship more accessible.
          </p>

          <Link to="/register" className="home-primary-btn">
            Join THRONE8 <span>↗</span>
          </Link>
        </div>

        <div className="home-about-mark">
          <span>T</span>
          <span>8</span>
        </div>
      </section>

      <footer className="home-footer">
        <Link to="/" className="home-logo">
          THRONE<span>8</span>
        </Link>

        <p>Guidance that moves you forward.</p>

        {/* <div className="home-footer-links">
          <Link to="/login">Login</Link>
          <Link to="/register">Create account</Link>
        </div> */}

<div className="home-footer-links">
  <Link to="/about">About Us</Link>
  <Link to="/contact">Contact</Link>
  <Link to="/faq">FAQ</Link>
  <Link to="/login">Login</Link>
  <Link to="/register">Create account</Link>
</div>

        <div className="home-footer-bottom">
          © {new Date().getFullYear()} THRONE8 Mentorship Platform.
          All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default Home;