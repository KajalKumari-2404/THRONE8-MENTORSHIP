
import { useCallback, useEffect, useState } from "react";
import api from "../api";
import "../App.css";
console.log("ADMIN REFUNDS PAGE LOADED");

const formatAmount = (paise) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format((paise || 0) / 100);

const formatDate = (date) =>
  date ? new Date(date).toLocaleString("en-IN") : "—";

export default function AdminRefunds() {
  const [refunds, setRefunds] = useState([]);
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });

  const loadRefunds = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = sessionStorage.getItem("throne8Token");
      const response = await api.get("/admin/refunds", {
        params: { status, page, limit: 20 },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setRefunds(response.data.refunds || []);
      setPagination(response.data.pagination || { total: 0, totalPages: 0 });
    } catch (err) {
      setError(err.response?.data?.message || "Could not load refunds.");
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    loadRefunds();
  }, [loadRefunds]);

  const changeStatus = (value) => {
    setStatus(value);
    setPage(1);
  };

  return (
    <main className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ color: "#8b5cf6", fontWeight: 700, marginBottom: 8 }}>
          ADMIN FINANCE
        </p>
        <h1>Refunds &amp; Disputes</h1>
        <p style={{ color: "var(--text-secondary, #9ca3af)" }}>
          Review refund records and track their current status.
        </p>
      </div>

      <section
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div>
          <strong>{pagination.total}</strong>{" "}
          <span>refund record(s)</span>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select
            aria-label="Filter refunds by status"
            value={status}
            onChange={(event) => changeStatus(event.target.value)}
            style={{ padding: "10px 12px", borderRadius: 8 }}
          >
            {["ALL", "REQUESTED", "PENDING", "PROCESSED", "FAILED", "CANCELLED"].map(
              (item) => (
                <option key={item} value={item}>
                  {item === "ALL" ? "All statuses" : item}
                </option>
              )
            )}
          </select>

          <button type="button" onClick={loadRefunds}>
            Refresh
          </button>
        </div>
      </section>

      {error && (
        <p role="alert" style={{ color: "#ef4444", marginBottom: 16 }}>
          {error}
        </p>
      )}

      {loading ? (
        <p>Loading refund records...</p>
      ) : refunds.length === 0 ? (
        <section style={{ padding: 24, border: "1px solid #374151", borderRadius: 12 }}>
          <h3>No refunds found</h3>
          <p>There are no records matching this status filter.</p>
        </section>
      ) : (
        <div style={{ overflowX: "auto", border: "1px solid #374151", borderRadius: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 850 }}>
            <thead>
              <tr>
                {["Refund", "Amount", "Status", "Reason", "Requested by", "Created", "Payment"].map(
                  (heading) => (
                    <th key={heading} style={{ textAlign: "left", padding: 14, borderBottom: "1px solid #374151" }}>
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {refunds.map((refund) => (
                <tr key={refund._id}>
                  <td style={{ padding: 14, borderBottom: "1px solid #374151" }}>
                    <code>{refund._id.slice(-8)}</code>
                  </td>
                  <td style={{ padding: 14, borderBottom: "1px solid #374151", whiteSpace: "nowrap" }}>
                    {formatAmount(refund.amountPaise)}
                  </td>
                  <td style={{ padding: 14, borderBottom: "1px solid #374151" }}>
                    <strong>{refund.status}</strong>
                  </td>
                  <td style={{ padding: 14, borderBottom: "1px solid #374151" }}>
                    {refund.reason || "—"}
                  </td>
                  <td style={{ padding: 14, borderBottom: "1px solid #374151" }}>
                    {refund.requestedBy?.name || "Unknown"}
                  </td>
                  <td style={{ padding: 14, borderBottom: "1px solid #374151", whiteSpace: "nowrap" }}>
                    {formatDate(refund.createdAt)}
                  </td>
                  <td style={{ padding: 14, borderBottom: "1px solid #374151" }}>
                    {refund.paymentId?._id
                      ? refund.paymentId._id.slice(-8)
                      : "Payment record unavailable"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && pagination.totalPages > 1 && (
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 20 }}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </button>
          <span>
            Page {page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
}
