export default function AgentCard({ agent, onClick }) {
  return (
    <button
      onClick={() => onClick?.(agent)}
      className="agent-card"
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: 14,
        background: "white",
        width: "100%",
        textAlign: "left",
        boxShadow: "0 1px 2px rgba(0,0,0,.04)",
      }}
    >
      <img
        src={agent.avatar}
        alt={agent.name}
        width={44}
        height={44}
        style={{ borderRadius: 12, background: "#0f172a10" }}
        onError={(e) => {
          e.currentTarget.src = "/avatars/serginho.svg";
        }}
      />
      <div style={{ display: "grid" }}>
        <strong style={{ lineHeight: 1.2 }}>{agent.name}</strong>
        <span style={{ color: "#64748b", fontSize: 12 }}>{agent.role}</span>
        <span style={{ color: "#334155", fontSize: 12 }}>{agent.blurb}</span>
      </div>
    </button>
  );
}
