import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "react-feather";

export const ThemeToggle = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ width: 40, height: 40 }} />; // Placeholder to avoid layout shift
  }

  const isDark =
    theme === "dark" ||
    (!theme &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="theme-toggle-btn"
      aria-label="Toggle Theme"
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8px",
        color: "var(--colour-neutral-000)",
        borderRadius: "50%",
        transition: "background-color 0.2s",
      }}
      onMouseOver={(e) =>
        (e.currentTarget.style.backgroundColor =
          "rgba(var(--colour-neutral-000-rgb), 0.1)")
      }
      onMouseOut={(e) =>
        (e.currentTarget.style.backgroundColor = "transparent")
      }
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};
