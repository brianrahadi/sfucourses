import React, { useState, useEffect } from "react";
import { MdHelp, MdClose } from "react-icons/md";

interface Shortcut {
  key: string;
  description: string;
}

export const HelpDialog: React.FC = () => {
  const globalShortcuts = [
    { key: "⌘ + k", description: "Global search" },
    { key: "g + 0", description: "Homepage" },
    { key: "g + 1", description: "Explore" },
    { key: "g + 2", description: "Schedule" },
    { key: "g + 3", description: "FAQ" },
    { key: "h", description: "Help" },
    { key: "esc", description: "Close dialogs" },
  ];

  const exploreShortcuts = [
    { key: "s", description: "Focus search" },
    { key: "r", description: "Reset filters" },
    { key: "c", description: "Courses mode" },
    { key: "i", description: "Instructors mode" },
  ];

  const scheduleShortcuts = [
    { key: "s", description: "Focus search" },
    { key: "r", description: "Reset filters" },
    { key: "f", description: "Open filters" },
    { key: "t", description: "Switch term" },
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
        <div className="help-dialog-content">
          {/* Global shortcuts in two columns */}
          <div className="page-shortcuts-container">
            <div className="shortcut-section">
              <h4>Global</h4>
              {globalShortcuts
                .slice(0, Math.ceil(globalShortcuts.length / 2))
                .map((shortcut, index) => (
                  <div key={index} className="shortcut-item">
                    <kbd className="shortcut-key">{shortcut.key}</kbd>
                    <span className="shortcut-description">
                      {shortcut.description}
                    </span>
                  </div>
                ))}
            </div>

            <div className="shortcut-section">
              <h4>&nbsp;</h4>
              {globalShortcuts
                .slice(Math.ceil(globalShortcuts.length / 2))
                .map((shortcut, index) => (
                  <div
                    key={index + Math.ceil(globalShortcuts.length / 2)}
                    className="shortcut-item"
                  >
                    <kbd className="shortcut-key">{shortcut.key}</kbd>
                    <span className="shortcut-description">
                      {shortcut.description}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Page shortcuts side by side */}
          <div className="page-shortcuts-container">
            <div className="shortcut-section">
              <h4>Explore</h4>
              {exploreShortcuts.map((shortcut, index) => (
                <div key={index} className="shortcut-item">
                  <kbd className="shortcut-key">{shortcut.key}</kbd>
                  <span className="shortcut-description">
                    {shortcut.description}
                  </span>
                </div>
              ))}
            </div>
            <div className="shortcut-section">
              <h4>Schedule</h4>
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
      </div>
    </>
  );
};
