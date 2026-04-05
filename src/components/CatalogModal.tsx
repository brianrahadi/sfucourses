import React from "react";

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
      <div className="catalog-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
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
