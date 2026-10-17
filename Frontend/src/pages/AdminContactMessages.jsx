
import { useCallback, useEffect, useState } from "react";
import api from "../api";
import "../App.css";

const formatDate = (date) =>
  date ? new Date(date).toLocaleString("en-IN") : "—";

const statusStyles = {
  NEW: { color: "#f59e0b", background: "rgba(245,158,11,0.12)" },
  READ: { color: "#60a5fa", background: "rgba(96,165,250,0.12)" },
  RESOLVED: { color: "#34d399", background: "rgba(52,211,153,0.12)" },
};

export default function AdminContactMessages() {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const token = sessionStorage.getItem("throne8Token");

      const response = await api.get("/admin/contact-messages", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setMessages(response.data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load contact messages. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const updateStatus = async (id, nextStatus) => {
    setError("");
    setNotice("");
    setUpdatingId(id);

    try {
      const token = sessionStorage.getItem("throne8Token");

      const response = await api.patch(
        `/admin/contact-messages/${id}/status`,
        { status: nextStatus },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      const updatedMessage = response.data.data;

      setMessages((current) =>
        current.map((message) =>
          message._id === id ? updatedMessage : message
        )
      );

      setNotice("Message status updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not update message status."
      );
    } finally {
      setUpdatingId("");
    }
  };

  const filteredMessages =
    status === "ALL"
      ? messages
      : messages.filter((message) => message.status === status);

  const newCount = messages.filter((message) => message.status === "NEW").length;
  const readCount = messages.filter((message) => message.status === "READ").length;
  const resolvedCount = messages.filter(
    (message) => message.status === "RESOLVED"
  ).length;

  return (
    <main className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ color: "#8b5cf6", fontWeight: 700, marginBottom: 8 }}>
          ADMIN / SUPPORT
        </p>
        <h1>Contact Messages</h1>
        <p style={{ color: "var(--text-secondary, #9ca3af)" }}>
          Review questions from users and track their resolution status.
        </p>
      </div>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          { label: "Total messages", value: messages.length },
          { label: "New", value: newCount },
          { label: "Read", value: readCount },
          { label: "Resolved", value: resolvedCount },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              border: "1px solid var(--border-color, #374151)",
              borderRadius: 12,
              padding: 18,
            }}
          >
            <p style={{ margin: "0 0 10px", color: "var(--text-secondary, #9ca3af)" }}>
              {item.label}
            </p>
            <strong style={{ fontSize: 28 }}>{item.value}</strong>
          </div>
        ))}
      </section>

      <section
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <label>
          <span style={{ marginRight: 10 }}>Filter:</span>
          <select
            aria-label="Filter contact messages by status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            style={{ padding: "10px 12px", borderRadius: 8 }}
          >
            {["ALL", "NEW", "READ", "RESOLVED"].map((item) => (
              <option key={item} value={item}>
                {item === "ALL" ? "All statuses" : item}
              </option>
            ))}
          </select>
        </label>

        <button type="button" onClick={loadMessages} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh messages"}
        </button>
      </section>

      {error && (
        <p role="alert" style={{ color: "#ef4444", marginBottom: 16 }}>
          {error}
        </p>
      )}

      {notice && (
        <p role="status" style={{ color: "#10b981", marginBottom: 16 }}>
          {notice}
        </p>
      )}

      {loading ? (
        <p>Loading contact messages...</p>
      ) : filteredMessages.length === 0 ? (
        <section
          style={{
            padding: 24,
            border: "1px solid var(--border-color, #374151)",
            borderRadius: 12,
          }}
        >
          <h3>No contact messages found</h3>
          <p>There are no messages matching this filter.</p>
        </section>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 16,
          }}
        >
          {filteredMessages.map((message) => (
            <article
              key={message._id}
              style={{
                padding: 20,
                border: "1px solid var(--border-color, #374151)",
                borderRadius: 14,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <div>
                  <h3 style={{ margin: "0 0 6px" }}>{message.subject}</h3>
                  <span style={{ color: "var(--text-secondary, #9ca3af)", fontSize: 13 }}>
                    Received: {formatDate(message.createdAt)}
                  </span>
                </div>

                <span
                  style={{
                    ...statusStyles[message.status],
                    padding: "6px 10px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {message.status}
                </span>
              </div>

              <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
                <p style={{ margin: 0 }}>
                  <strong>From: </strong>{message.name}
                </p>
                <p style={{ margin: 0, overflowWrap: "anywhere" }}>
                  <strong>Email: </strong>
                  <a href={`mailto:${message.email}`}>{message.email}</a>
                </p>
              </div>

              <p
                style={{
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                  lineHeight: 1.7,
                  margin: "0 0 18px",
                }}
              >
                {message.message}
              </p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <label>
                  <span style={{ marginRight: 8 }}>Update status:</span>
                  <select
                    aria-label={`Update status for ${message.name}`}
                    value={message.status}
                    disabled={updatingId === message._id}
                    onChange={(event) =>
                      updateStatus(message._id, event.target.value)
                    }
                    style={{ padding: "9px 10px", borderRadius: 8 }}
                  >
                    {["NEW", "READ", "RESOLVED"].map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                {updatingId === message._id && <span>Saving...</span>}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
