import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import "./Login.css";

export default function Login() {
const navigate = useNavigate();

const [form, setForm] = useState({
email: "",
password: "",
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
setLoading(true);


try {
  const response = await api.post("/auth/login", form);
  const { token, user } = response.data;

if (!token) {
  throw new Error("Login response did not contain a token.");
}

sessionStorage.setItem("throne8Token", token);
sessionStorage.setItem("throne8User", JSON.stringify(user));

console.log("Token saved:", Boolean(sessionStorage.getItem("throne8Token")));
console.log("Logged-in role:", user?.role);


if (user?.role?.toUpperCase() === "ADMIN") {
  navigate("/admin");

} else if (user?.role?.toUpperCase() === "MENTOR") {
  // navigate("/dashboard");
  navigate("/mentor/dashboard");
} else {
  navigate("/dashboard");
}

} catch (error) {
  setMessage(
    error.response?.data?.message || "Login failed. Please try again."
  );
} finally {
  setLoading(false);
}

};

return ( <main className="auth-page"> <form className="auth-card" onSubmit={handleSubmit}> <p className="brand">THRONE8</p> <h1>Welcome back</h1> <p>Sign in to your mentorship account.</p>

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

    <label htmlFor="password">Password</label>
    <div className="password-field">
      <input
        id="password"
        name="password"
        type={showPassword ? "text" : "password"}
        value={form.password}
        onChange={handleChange}
        placeholder="Enter your password"
        autoComplete="current-password"
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
      {loading ? "Signing in..." : "Sign In"}
    </button>

    <p className="auth-footer">
      Don't have an account? <Link to="/register">Create one</Link>
    </p>
  </form>
</main>

);
}
