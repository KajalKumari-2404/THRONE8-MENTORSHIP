
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const API_URL = "http://localhost:5000/api/v1/contact";

const faqs = [
  {
    q: "How do I book a mentorship session?",
    a: "Log in as a student, explore mentors, choose an available slot, and complete payment through the secure checkout.",
  },
  {
    q: "When is my booking confirmed?",
    a: "Your booking is confirmed after the backend successfully verifies your payment.",
  },
  {
    q: "When can mentors receive their earnings?",
    a: "Earnings remain on hold until the session is verified as completed and the required 15-day holding period has passed. Disputes and refunds can delay or block payouts.",
  },
  {
    q: "What should I do if a payment fails?",
    a: "Check your booking and payment status before trying again. Do not assume a payment failed only because the checkout page did not show confirmation.",
  },
  {
    q: "How can I get help with a booking?",
    a: "Use the Contact page to describe the issue. Include your booking reference when contacting the platform support team.",
  },
];

const pageStyle = {
  minHeight: "calc(100vh - 70px)",
  padding: "48px 20px",
  background: "#0b1020",
  color: "#f8fafc",
};

const cardStyle = {
  maxWidth: "820px",
  margin: "0 auto",
  padding: "clamp(22px, 5vw, 42px)",
  background: "#121a2d",
  border: "1px solid #28334b",
  borderRadius: "20px",
  boxSizing: "border-box",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  marginTop: "8px",
  borderRadius: "10px",
  border: "1px solid #34415c",
  background: "#0b1020",
  color: "#f8fafc",
  boxSizing: "border-box",
  font: "inherit",
};

export default function InfoPages() {
  const { pathname } = useLocation();
  const [openFaq, setOpenFaq] = useState(0);
  const [formStatus, setFormStatus] = useState({
    type: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const page = pathname.replace("/", "").toLowerCase();

  const titles = {
    about: "Mentorship that moves you forward",
    contact: "How can we help?",
    faq: "Frequently asked questions",
  };

  const descriptions = {
    about:
      "THRONE8 connects students with mentors to support learning, career growth, and practical guidance.",
    contact:
      "Send us your question or concern. Our support team can review your message.",
    faq:
      "Find answers about bookings, payments, session completion, and mentor earnings.",
  };

  const handleContactSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFormStatus({ type: "", message: "" });

    const form = event.currentTarget;
    const formData = new FormData(form);

    const issueLabels = {
      booking: "Booking or session",
      payment: "Payment or refund",
      earnings: "Mentor earnings or payout",
      account: "Account access",
      other: "Other",
    };

    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      subject: issueLabels[formData.get("issue")] || "Other",
      message: String(formData.get("message") || "").trim(),
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to send your message. Please try again."
        );
      }

      setFormStatus({
        type: "success",
        message: "Your message has been sent successfully!",
      });

      form.reset();
    } catch (error) {
      setFormStatus({
        type: "error",
        message:
          error.message === "Failed to fetch"
            ? "Cannot connect to the server. Please check that the backend is running."
            : error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <Link to="/" style={{ color: "#a78bfa", textDecoration: "none" }}>
          ← THRONE8 Home
        </Link>

        <p
          style={{
            color: "#a78bfa",
            letterSpacing: "2px",
            fontSize: "12px",
            fontWeight: 700,
            marginTop: "30px",
          }}
        >
          THRONE8 MENTORSHIP
        </p>

        <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", lineHeight: 1.2 }}>
          {titles[page] || "THRONE8"}
        </h1>

        <p style={{ color: "#aab6cc", lineHeight: 1.8 }}>
          {descriptions[page]}
        </p>

        {page === "about" && (
          <div style={{ display: "grid", gap: "14px", marginTop: "28px" }}>
            {[
              ["Learn with direction", "Get guidance tailored to your learning and career goals."],
              ["Book with confidence", "Track your booking and payment verification status."],
              ["Transparent earnings", "Mentors can review earning states and applicable holding periods."],
            ].map(([title, description]) => (
              <article
                key={title}
                style={{
                  padding: "18px",
                  borderRadius: "12px",
                  background: "#19243a",
                  border: "1px solid #2b3853",
                }}
              >
                <h2 style={{ fontSize: "18px", marginTop: 0 }}>{title}</h2>
                <p style={{ color: "#aab6cc", lineHeight: 1.7, marginBottom: 0 }}>
                  {description}
                </p>
              </article>
            ))}
          </div>
        )}

        {page === "faq" && (
          <div style={{ display: "grid", gap: "12px", marginTop: "28px" }}>
            {faqs.map((faq, index) => (
              <article
                key={faq.q}
                style={{
                  border: "1px solid #2b3853",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                  aria-expanded={openFaq === index}
                  style={{
                    width: "100%",
                    padding: "17px",
                    textAlign: "left",
                    border: 0,
                    background: "#19243a",
                    color: "#f8fafc",
                    cursor: "pointer",
                    font: "inherit",
                    fontWeight: 600,
                  }}
                >
                  {openFaq === index ? "− " : "+ "}
                  {faq.q}
                </button>

                {openFaq === index && (
                  <p style={{ padding: "0 17px 17px", color: "#aab6cc", lineHeight: 1.8 }}>
                    {faq.a}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}

        {page === "contact" && (
          <form
            onSubmit={handleContactSubmit}
            style={{ display: "grid", gap: "18px", marginTop: "28px" }}
          >
            <label>
              Your name
              <input
                style={inputStyle}
                name="name"
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
              />
            </label>

            <label>
              Email address
              <input
                style={inputStyle}
                name="email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
              />
            </label>

            <label>
              Issue type
              <select style={inputStyle} name="issue" defaultValue="booking">
                <option value="booking">Booking or session</option>
                <option value="payment">Payment or refund</option>
                <option value="earnings">Mentor earnings or payout</option>
                <option value="account">Account access</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label>
              How can we help?
              <textarea
                style={{ ...inputStyle, minHeight: "130px", resize: "vertical" }}
                name="message"
                required
                minLength={10}
                maxLength={3000}
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "13px",
                border: 0,
                borderRadius: "10px",
                background: submitting ? "#6d5a9e" : "#8b5cf6",
                color: "white",
                fontWeight: 700,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "Sending..." : "Send message"}
            </button>

            {formStatus.message && (
              <p
                role="status"
                aria-live="polite"
                style={{
                  color: formStatus.type === "success" ? "#86efac" : "#fca5a5",
                  lineHeight: 1.7,
                }}
              >
                {formStatus.message}
              </p>
            )}
          </form>
        )}

        <nav
          aria-label="Information pages"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "18px",
            marginTop: "32px",
            paddingTop: "22px",
            borderTop: "1px solid #28334b",
          }}
        >
          <Link to="/about" style={{ color: "#c4b5fd" }}>About</Link>
          <Link to="/contact" style={{ color: "#c4b5fd" }}>Contact</Link>
          <Link to="/faq" style={{ color: "#c4b5fd" }}>FAQ</Link>
        </nav>
      </section>
    </main>
  );
}
