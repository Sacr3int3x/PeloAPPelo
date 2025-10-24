import React from "react";
import "./InboxNav.css";

function InboxNav({ activeTab, onTabChange }) {
  return (
    <div className="inbox-nav">
      <button
        className={`inbox-nav-tab ${activeTab === "messages" ? "active" : ""}`}
        onClick={() => onTabChange("messages")}
      >
        Mensajes
      </button>
      <button
        className={`inbox-nav-tab ${activeTab === "swaps" ? "active" : ""}`}
        onClick={() => onTabChange("swaps")}
      >
        Solicitudes de intercambio
      </button>
    </div>
  );
}

export default InboxNav;
