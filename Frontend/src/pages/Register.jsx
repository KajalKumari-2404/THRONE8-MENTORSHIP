import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function Register() {
const navigate = useNavigate();

const [form, setForm] = useState({
name: "",
email: "",
password: "",
role: "STUDENT",
});
const [showPassword, setShowPassword] = useState(false);
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState("");

const handleChange = (event) => {
setForm({ ...form, [event.target.name]: event.target.value });
};

const handleSubmit = async (event) => {
event.preventDefault();
setMessage("");

if (form.password.length < 8) {
  setMessage("Password must be at least 8 characters.");
  return;
}

setLoading(true);

try {
  const response = await api.post("/auth/register", form);
  const { token, user } = response.data;

  sessionStorage.setItem("throne8Token", token);
  sessionStorage.setItem("throne8User", JSON.stringify(user));

  navigate("/dashboard");
} catch (error) {
  setMessage(
    error.response?.data?.message ||
      "Registration failed. Please try again."
  );
} finally {
  setLoading(false);
}

};

return ( <main className="auth-page"> <form className="auth-card" onSubmit={handleSubmit}> <p className="brand">THRONE8</p> <h1>Create your account</h1> <p>Start your mentorship journey.</p>

    <label htmlFor="name">Full name</label>
    <input
      id="name"
      name="name"
      value={form.name}
      onChange={handleChange}
      placeholder="Enter your name"
      autoComplete="name"
      required
    />

    <label htmlFor="email">Email address</label>
    <input
      id="email"
      name="email"
      type="email"
      value={form.email}
      onChange={handleChange}
      placeholder="you@example.com"
      autoComplete="email"
      required
    />

    <label htmlFor="role">I want to join as</label>
    <select
      id="role"
      name="role"
      value={form.role}
      onChange={handleChange}
    >
      <option value="STUDENT">Student</option>
      <option value="MENTOR">Mentor</option>
    </select>

    <label htmlFor="password">Password</label>
    <div className="password-field">
      <input
        id="password"
        name="password"
        type={showPassword ? "text" : "password"}
        value={form.password}
        onChange={handleChange}
        placeholder="At least 8 characters"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? "Hide" : "Show"}
      </button>
    </div>

    {message && <p className="auth-error" role="alert">{message}</p>}

    <button className="auth-submit" type="submit" disabled={loading}>
      {loading ? "Creating account..." : "Create Account"}
    </button>

    <p className="auth-footer">
      Already registered? <Link to="/login">Sign in</Link>
    </p>
  </form>
</main>


);
}
