import React from "react";

function Card({ card, refresh }) {

  // ✅ ARCHIVE FUNCTION
  const handleArchive = async () => {
    try {
      await fetch(`http://localhost:5000/api/cards/${card.id}/archive`, {
        method: "PUT"
      });
      refresh(); // reload cards after archive
    } catch (err) {
      console.error("Archive failed:", err);
    }
  };

  return (
    <div
      style={{
        background: "#fff",
        padding: "10px",
        marginBottom: "10px",
        borderRadius: "8px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
      }}
    >
      {/* ✅ TITLE */}
      <h4>{card.title}</h4>

      {/* ✅ LABELS */}
      <div>
        {card.labels?.map((label, index) => (
          <span
            key={index}
            style={{
              background: label.color,
              color: "#fff",
              padding: "2px 6px",
              marginRight: "5px",
              borderRadius: "4px",
              fontSize: "12px"
            }}
          >
            {label.text}
          </span>
        ))}
      </div>

      {/* ✅ MEMBERS */}
      <div style={{ marginTop: "5px" }}>
        {card.members?.map((member, index) => (
          <span key={index} style={{ marginRight: "5px", fontSize: "12px" }}>
            👤 {member.name}
          </span>
        ))}
      </div>

      {/* ✅ DUE DATE */}
      {card.dueDate && (
        <p style={{ fontSize: "12px", marginTop: "5px" }}>
          📅 {card.dueDate}
        </p>
      )}

      {/* ✅ ARCHIVE BUTTON */}
      <button
        onClick={handleArchive}
        style={{
          marginTop: "8px",
          background: "#ff4d4d",
          color: "#fff",
          border: "none",
          padding: "5px 10px",
          borderRadius: "5px",
          cursor: "pointer"
        }}
      >
        Archive
      </button>
    </div>
  );
}

export default Card;