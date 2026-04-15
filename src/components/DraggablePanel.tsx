import React, { useState, useRef, useCallback, useEffect } from "react";

interface DraggablePanelProps {
  children: React.ReactNode;
  /** Initial CSS position values */
  defaultPosition?: {
    top?: number;
    left?: number;
    right?: number;
    bottom?: number;
  };
  /** Which corner/side the panel anchors from. Determines which position props are used. */
  anchor?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
  /** Optional z-index override */
  zIndex?: number;
  /** Enable resize handle on the right edge */
  resizable?: boolean;
  /** Min/max width constraints when resizable */
  minWidth?: number;
  maxWidth?: number;
}

export const DraggablePanel: React.FC<DraggablePanelProps> = ({
  children,
  defaultPosition = {},
  anchor = "top-left",
  className = "",
  zIndex = 100,
  resizable = false,
  minWidth = 280,
  maxWidth = 700,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panelStart = useRef({ x: 0, y: 0 });
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);

  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null
  );
  const [width, setWidth] = useState<number | null>(null);
  const hasInitialized = useRef(false);

  // Initialize position on mount based on anchor + defaults
  useEffect(() => {
    if (hasInitialized.current || !panelRef.current) return;
    hasInitialized.current = true;

    const parent = panelRef.current.parentElement;
    if (!parent) return;

    const parentRect = parent.getBoundingClientRect();
    const panelRect = panelRef.current.getBoundingClientRect();

    let x = 0;
    let y = 0;

    if (anchor === "top-left") {
      x = defaultPosition.left ?? 20;
      y = defaultPosition.top ?? 20;
    } else if (anchor === "top-right") {
      x = parentRect.width - panelRect.width - (defaultPosition.right ?? 20);
      y = defaultPosition.top ?? 20;
    } else if (anchor === "bottom-left") {
      x = defaultPosition.left ?? 20;
      y = parentRect.height - panelRect.height - (defaultPosition.bottom ?? 20);
    } else if (anchor === "bottom-right") {
      x = parentRect.width - panelRect.width - (defaultPosition.right ?? 20);
      y = parentRect.height - panelRect.height - (defaultPosition.bottom ?? 20);
    }

    setPosition({ x, y });
  }, [anchor, defaultPosition]);

  // --- Drag handlers ---
  const handleDragPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!panelRef.current || !position) return;
      isDragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      panelStart.current = { x: position.x, y: position.y };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      e.preventDefault();
      e.stopPropagation();
    },
    [position]
  );

  const handleDragPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !panelRef.current) return;

    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    let newX = panelStart.current.x + dx;
    let newY = panelStart.current.y + dy;

    const parent = panelRef.current.parentElement;
    if (parent) {
      const parentRect = parent.getBoundingClientRect();
      const panelRect = panelRef.current.getBoundingClientRect();

      const maxX = parentRect.width - panelRect.width;
      const maxY = parentRect.height - panelRect.height;

      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
    }

    setPosition({ x: newX, y: newY });
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragPointerUp = useCallback((e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  // --- Resize handlers ---
  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!panelRef.current) return;
      isResizing.current = true;
      resizeStartX.current = e.clientX;
      resizeStartWidth.current =
        width ?? panelRef.current.getBoundingClientRect().width;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      e.preventDefault();
      e.stopPropagation();
    },
    [width]
  );

  const handleResizePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isResizing.current || !panelRef.current) return;

      const dx = e.clientX - resizeStartX.current;
      let newWidth = resizeStartWidth.current + dx;

      // Constrain width
      newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));

      // Also constrain so panel doesn't overflow parent
      const parent = panelRef.current.parentElement;
      if (parent && position) {
        const parentRect = parent.getBoundingClientRect();
        const maxAllowed = parentRect.width - position.x;
        newWidth = Math.min(newWidth, maxAllowed);
      }

      setWidth(newWidth);
      e.preventDefault();
      e.stopPropagation();
    },
    [minWidth, maxWidth, position]
  );

  const handleResizePointerUp = useCallback((e: React.PointerEvent) => {
    isResizing.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  return (
    <div
      ref={panelRef}
      className={`draggable-panel ${
        resizable ? "draggable-panel--resizable" : ""
      } ${className}`}
      style={{
        position: "absolute",
        left: position ? `${position.x}px` : undefined,
        top: position ? `${position.y}px` : undefined,
        width: width ? `${width}px` : undefined,
        zIndex,
        visibility: position ? "visible" : "hidden",
      }}
    >
      <div
        className="draggable-panel__handle"
        onPointerDown={handleDragPointerDown}
        onPointerMove={handleDragPointerMove}
        onPointerUp={handleDragPointerUp}
      >
        <div className="draggable-panel__handle-dots">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="draggable-panel__content">{children}</div>
      {resizable && (
        <div
          className="draggable-panel__resize-handle"
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
        />
      )}
    </div>
  );
};

export default DraggablePanel;
