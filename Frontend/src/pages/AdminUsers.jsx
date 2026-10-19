
import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api";
import "./AdminUsers.css";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const getValidRole = (value) =>
  ["STUDENT", "MENTOR"].includes(value) ? value : "ALL";

export default function AdminUsers() {
  const [searchParams] = useSearchParams();

  const [users, setUsers] = useState([]);
  const [role, setRole] = useState(() =>
    getValidRole(searchParams.get("role"))
  );
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Navbar URL ke role query ko selected filter ke saath sync rakho.
  useEffect(() => {
    const nextRole = getValidRole(searchParams.get("role"));

    setRole((currentRole) =>
      currentRole === nextRole ? currentRole : nextRole
    );
    setPage(1);
    setSearch("");
  }, [searchParams]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = sessionStorage.getItem("throne8Token");

      if (!token) {
        setError(
          "Login session nahi mila. Please Admin account se login karo."
        );
        setUsers([]);
        setPages(1);
        setTotal(0);
        return;
      }

      const params = { page, limit: 20 };

      if (role !== "ALL") {
        params.role = role;
      }

      if (status !== "ALL") {
        params.status = status;
      }

      if (search.trim()) {
        params.search = search.trim();
      }

      const response = await api.get("/admin/users", {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseUsers = response.data.users || [];
      const pagination = response.data.pagination || {};

      setUsers(responseUsers);
      setPages(Math.max(1, pagination.pages || 1));
      setTotal(pagination.total || 0);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Users load nahi hue. Please refresh karke try karo."
      );
      setUsers([]);
      setPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, role, status, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const changeRole = (value) => {
    setRole(value);
    setPage(1);
  };

  const changeStatus = (value) => {
    setStatus(value);
    setPage(1);
  };

  // Backend already search aur pagination apply karta hai.
  const visibleUsers = users;

  return (
    <main className="admin-users-page">
      <header className="admin-users-header">
        <div>
          <p className="admin-users-eyebrow">THRONE8 / ADMIN CONTROL</p>
          <h1>Users Management</h1>
          <p>
            Student aur mentor accounts, roles aur account status ek jagah
            manage karo.
          </p>
        </div>

        <Link className="admin-users-back" to="/admin">
          ← Admin Dashboard
        </Link>
      </header>

      <section className="admin-users-stats">
        <article className="admin-users-stat">
          <span>Total matching users</span>
          <strong>{total}</strong>
        </article>

        <article className="admin-users-stat">
          <span>Current page</span>
          <strong>
            {page} / {pages}
          </strong>
        </article>

        <article className="admin-users-stat">
          <span>Showing</span>
          <strong>{visibleUsers.length}</strong>
        </article>
      </section>

      <section className="admin-users-panel">
        <div className="admin-users-panel-heading">
          <div>
            <h2>Student &amp; Mentor Accounts</h2>
            <p>Search aur filters se accounts quickly find karo.</p>
          </div>

          <button
            type="button"
            className="admin-users-refresh"
            onClick={loadUsers}
            disabled={loading}
          >
            {loading ? "Loading..." : "↻ Refresh"}
          </button>
        </div>

        <div className="admin-users-filters">
          <label className="admin-users-search">
            <span>Search users</span>
            <input
              type="search"
              placeholder="Name, email ya role..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </label>

          <label>
            <span>Role</span>
            <select
              value={role}
              onChange={(event) => changeRole(event.target.value)}
            >
              <option value="ALL">All roles</option>
              <option value="STUDENT">Students</option>
              <option value="MENTOR">Mentors</option>
            </select>
          </label>

          <label>
            <span>Account status</span>
            <select
              value={status}
              onChange={(event) => changeStatus(event.target.value)}
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </label>
        </div>

        {error && (
          <div className="admin-users-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={loadUsers}>
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="admin-users-message" role="status">
            Loading users...
          </div>
        ) : !error && visibleUsers.length === 0 ? (
          <div className="admin-users-message">
            <h3>No users found</h3>
            <p>Search ya filters change karke try karo.</p>
          </div>
        ) : (
          !error && (
            <div className="admin-users-table-wrap">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Account Status</th>
                    <th>Joined</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleUsers.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <div className="admin-users-identity">
                          <span className="admin-users-avatar">
                            {(user.name || "U").charAt(0).toUpperCase()}
                          </span>

                          <div>
                            <strong>{user.name}</strong>
                            <span>{user.email}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`admin-users-role admin-users-role-${user.role?.toLowerCase()}`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`admin-users-status ${
                            user.isActive ? "is-active" : "is-inactive"
                          }`}
                        >
                          <span className="admin-users-status-dot" />
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td>{formatDate(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        <footer className="admin-users-pagination">
          <span>
            Page {page} of {pages} · {total} matching users
          </span>

          <div>
            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.max(1, current - 1))
              }
              disabled={loading || page <= 1}
            >
              ← Previous
            </button>

            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(pages, current + 1))
              }
              disabled={loading || page >= pages}
            >
              Next →
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}
