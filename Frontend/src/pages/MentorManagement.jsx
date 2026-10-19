
import { useCallback, useEffect, useState } from "react";
import api from "../api";
import "../App.css";

const getToken = () => sessionStorage.getItem("throne8Token");

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const getStatus = (account) =>
  account?.status ||
  account?.verificationStatus ||
  (account?.verified ? "VERIFIED" : "PENDING");

export default function MentorManagement() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [commissionInputs, setCommissionInputs] = useState({});
  const [savingId, setSavingId] = useState("");

  const loadMentors = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/admin/mentors", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      const list = response.data?.accounts || [];
      console.log("Mentor account API data:", list);
      setAccounts(list);

      
setCommissionInputs((previous) => {
  const next = { ...previous };

  list.forEach((account) => {
    const id = account.mentorId?._id || account.mentorId;
    if (!id) return;

    if (next[id] === undefined || next[id] === "") {
      next[id] = String(
        Number(account.commissionRateBps ?? 2000) / 100
      );
    }
  });

  return next;
});

   
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Mentor accounts load nahi ho paaye. Please retry."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMentors();
  }, [loadMentors]);

  const updateCommission = async (account) => {
    const mentorId = account.mentorId?._id || account.mentorId;
    const percentage = Number(commissionInputs[mentorId]);

    if (!mentorId || !Number.isFinite(percentage) ||
        percentage < 0 || percentage > 100) {
      setMessage("Commission 0 se 100 ke beech honi chahiye.");
      return;
    }

    if (!window.confirm(
      `Is mentor ki commission ${percentage}% set karni hai? Ye future bookings par apply hogi.`
    )) {
      return;
    }

    setSavingId(mentorId);
    setMessage("");
    setError("");

    try {
      const rateBps = Math.round(percentage * 100);

      const response = await api.post(
        `/admin/mentors/${mentorId}/commission`,
        { rateBps },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      setMessage(response.data?.message || "Commission updated successfully.");
      await loadMentors();
    } catch (err) {
      setError(
        err.response?.data?.message || "Commission update failed."
      );
    } finally {
      setSavingId("");
    }
  };

  const filteredAccounts = accounts.filter((account) => {
    const mentor = account.mentorId;
    const searchText =
      `${mentor?.name || ""} ${mentor?.email || ""} ${getStatus(account)}`.toLowerCase();

    return searchText.includes(search.toLowerCase().trim());
  });

  return (
    <main className="admin-home mentor-management-page">
      <header className="admin-home-header">
        <div>
          <p className="admin-home-eyebrow">THRONE8 / ADMIN CONSOLE</p>
          <h1>Mentor Management</h1>
          <p>View mentor accounts and manage commission rates.</p>
        </div>

        <button
          type="button"
          className="mentor-refresh-button"
          onClick={loadMentors}
          disabled={loading}
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </header>

      <section className="mentor-summary-grid">
        <article className="mentor-summary-card">
          <span>Total mentor accounts</span>
          <strong>{accounts.length}</strong>
        </article>
        <article className="mentor-summary-card">
          <span>Verified accounts</span>
          <strong>
            {accounts.filter(
              (account) => getStatus(account).toUpperCase() === "VERIFIED"
            ).length}
          </strong>
        </article>
        <article className="mentor-summary-card">
          <span>Payout enabled</span>
          <strong>
            {accounts.filter((account) => account.payoutEnabled === true).length}
          </strong>
        </article>
      </section>

      <section className="mentor-list-panel">
        <div className="mentor-list-heading">
          <div>
            <h2>Mentor accounts</h2>
            <p>Commission changes apply to future bookings only.</p>
          </div>

          <input
            className="mentor-search"
            type="search"
            placeholder="Search name, email or status..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {message && (
          <p className="mentor-notice mentor-success" role="status">
            {message}
          </p>
        )}

        {error && (
          <div className="mentor-notice mentor-error" role="alert">
            {error}
            <button type="button" onClick={loadMentors}>Retry</button>
          </div>
        )}

        {loading ? (
          <p className="mentor-empty">Loading mentor accounts...</p>
        ) : filteredAccounts.length === 0 ? (
          <p className="mentor-empty">
            {accounts.length === 0
              ? "No mentor accounts returned by the API."
              : "No mentors match your search."}
          </p>
        ) : (
          <div className="mentor-table-wrapper">
            <table className="mentor-table">
              <thead>
                <tr>
                  <th>Mentor</th>
                  <th>Verification</th>
                  <th>Payouts</th>
                  <th>Commission</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account) => {
                  const mentor = account.mentorId;
                  const mentorId = mentor?._id || account.mentorId;
                  const status = getStatus(account).toUpperCase();

                  return (
                    <tr key={account._id || mentorId}>
                      <td>
                        <strong>{mentor?.name || "Unknown mentor"}</strong>
                        <span className="mentor-email">
                          {mentor?.email || "No email available"}
                        </span>
                      </td>
                      <td>
                        <span className={`mentor-status status-${status.toLowerCase()}`}>
                          {status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td>
                        <span className={`mentor-status ${account.payoutEnabled ? "status-verified" : "status-pending"}`}>
                          {account.payoutEnabled ? "Enabled" : "Disabled"}
                        </span>
                      </td>
                      <td>
                        <div className="mentor-commission-input">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            aria-label={`Commission percentage for ${mentor?.name || "mentor"}`}
                            value={commissionInputs[mentorId] ?? ""}
                            onChange={(event) =>
                              setCommissionInputs((previous) => ({
                                ...previous,
                                [mentorId]: event.target.value,
                              }))
                            }
                          />
                          <span>%</span>
                        </div>
                      </td>
                      {/* <td>{formatDate(account.createdAt)}</td> */}
                      {/* <td>{account.createdAt ? new Date(account.createdAt).toLocaleDateString("en-IN") : "Date unavailable"}</td> */}
                      {/* <td>{formatDate(account.createdAt)}</td> */}
                      <td>{formatDate(account.createdAt || account.updatedAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="mentor-save-button"
                          disabled={savingId === mentorId || !mentorId}
                          onClick={() => updateCommission(account)}
                        >
                          {savingId === mentorId ? "Saving..." : "Save rate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="admin-home-footer">
        Commission changes are audited by the backend and affect future bookings only.
      </p>
    </main>
  );
}
