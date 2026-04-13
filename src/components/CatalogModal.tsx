import React from "react";
import { FaInfoCircle } from "react-icons/fa";
import { Tooltip } from "react-tooltip";

const kbdStyle: React.CSSProperties = {
  backgroundColor: "var(--colour-neutral-800)",
  color: "var(--colour-neutral-200)",
  border: "1px solid var(--colour-neutral-700)",
  borderBottomWidth: "2px",
  borderRadius: "6px",
  padding: "2px 8px",
  fontSize: "12px",
  fontWeight: 600,
  fontFamily: "monospace",
  minWidth: "24px",
  textAlign: "center",
};

const KeyboardShortcutsTip = () => (
  <div
    style={{
      padding: "4px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      minWidth: "220px",
    }}
  >
    <span
      style={{
        fontSize: "12px",
        fontWeight: 700,
        color: "var(--colour-neutral-500)",
        letterSpacing: "0.5px",
      }}
    >
      KEYBOARD SHORTCUTS
    </span>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        fontSize: "14px",
        color: "var(--colour-neutral-300)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>Navigate courses</span>
        <div style={{ display: "flex", gap: "4px", paddingLeft: "24px" }}>
          <kbd style={kbdStyle}>↑</kbd>
          <kbd style={kbdStyle}>↓</kbd>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>Add course</span>
        <kbd style={kbdStyle}>Enter</kbd>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>Reopen dialog</span>
        <kbd style={kbdStyle}>A</kbd>
      </div>
    </div>
  </div>
);

export interface CatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSave: () => void;
  saveText?: string;
  cancelText?: string;
}

export const CatalogModal: React.FC<CatalogModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  onSave,
  saveText = "Add",
  cancelText = "Cancel",
}) => {
  if (!isOpen) return null;

  return (
    <div className="catalog-dialog-overlay" onClick={onClose}>
      <div
        className="catalog-dialog"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (
            e.key === "Enter" &&
            (e.target as HTMLElement).tagName !== "TEXTAREA"
          ) {
            e.preventDefault();
            onSave();
          }
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <h3 style={{ margin: 0 }}>{title}</h3>
          <FaInfoCircle
            size={16}
            color="var(--colour-neutral-500)"
            data-tooltip-id={`modal-tip-${title}`}
            style={{ cursor: "pointer", outline: "none", marginTop: "2px" }}
          />
          <Tooltip
            id={`modal-tip-${title}`}
            place="right"
            style={{
              backgroundColor: "var(--colour-neutral-900)",
              border: "1px solid var(--colour-neutral-700)",
              zIndex: 9999,
              opacity: 1,
              borderRadius: "8px",
              padding: "0.75rem",
            }}
          >
            <KeyboardShortcutsTip />
          </Tooltip>
        </div>
        {children}
        <div className="btn-group">
          <button className="cancel" onClick={onClose}>
            {cancelText}
          </button>
          <button className="save" onClick={onSave}>
            {saveText}
          </button>
        </div>
      </div>
    </div>
  );
};
