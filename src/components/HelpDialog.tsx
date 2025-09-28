import React, { useState, useEffect } from "react";
import { MdHelp, MdClose } from "react-icons/md";

interface Shortcut {
  key: string;
  description: string;
}

export const HelpDialog: React.FC = () => {
  const globalShortcuts = [
    { key: "cmd/ctrl + k", description: "Global search bar" },
    { key: "g + 0", description: "Go to homepage" },
    { key: "g + 1", description: "Go to explore" },
    { key: "g + 2", description: "Go to schedule" },
    { key: "g + 3", description: "Go to FAQ" },
    { key: "h", description: "Show this help" },
    { key: "esc", description: "Close any dialog" },
  ];

  const exploreShortcuts = [
    { key: "s", description: "Focus search bar" },
    { key: "r", description: "Reset all filters" },
    { key: "c", description: "Switch to courses mode" },
    { key: "i", description: "Switch to instructors mode" },
  ];

  const scheduleShortcuts = [
    { key: "s", description: "Focus search bar" },
    { key: "r", description: "Reset all filters" },
    { key: "f", description: "Open filters dialog" },
  ];

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key.toLowerCase() === "h") {
        e.preventDefault();
        setIsOpen(!isOpen);
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      {/* Help Button */}
      <button
        className="help-dialog-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="Show keyboard shortcuts (H)"
      >
        <MdHelp />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="help-dialog-overlay" onClick={() => setIsOpen(false)} />
      )}

      {/* Help Dialog */}
      <div className={`help-dialog ${isOpen ? "open" : ""}`}>
        <div className="help-dialog-header">
          <h3>Keyboard Shortcuts</h3>
          <button
            className="help-dialog-close"
            onClick={() => setIsOpen(false)}
            title="Close (Esc)"
          >
            <MdClose />
          </button>
        </div>

        <div className="help-dialog-content">
          {/* Global shortcuts */}
          <div className="shortcut-section">
            <h4>Global Shortcuts</h4>
            {globalShortcuts.map((shortcut, index) => (
              <div key={index} className="shortcut-item">
                <kbd className="shortcut-key">{shortcut.key}</kbd>
                <span className="shortcut-description">
                  {shortcut.description}
                </span>
              </div>
            ))}
          </div>
          {/* Explore page shortcuts */}
          <div className="shortcut-section">
            <h4>Explore Page</h4>
            {exploreShortcuts.map((shortcut, index) => (
              <div key={index} className="shortcut-item">
                <kbd className="shortcut-key">{shortcut.key}</kbd>
                <span className="shortcut-description">
                  {shortcut.description}
                </span>
              </div>
            ))}
          </div>

          {/* Schedule page shortcuts */}
          <div className="shortcut-section">
            <h4>Schedule Page</h4>
            {scheduleShortcuts.map((shortcut, index) => (
              <div key={index} className="shortcut-item">
                <kbd className="shortcut-key">{shortcut.key}</kbd>
                <span className="shortcut-description">
                  {shortcut.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
