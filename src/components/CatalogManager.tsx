import React, { useState, useEffect } from "react";
import { Button } from "./Button";
import { FaSave, FaFolderOpen } from "react-icons/fa";
import { IoMdStar, IoMdStarOutline } from "react-icons/io";
import toast from "react-hot-toast";
import {
  useCatalogStore,
  CompletedCourse,
  WishlistCourse,
} from "src/store/useCatalogStore";

interface SavedCatalog {
  id: number;
  name: string;
  completedCourses: CompletedCourse[];
  wishlistCourses: WishlistCourse[];
  isDefault: boolean;
  timestamp: number;
}

export const CatalogManager: React.FC = () => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [catalogName, setCatalogName] = useState("");
  const [savedCatalogs, setSavedCatalogs] = useState<SavedCatalog[]>([]);

  const completedCourses = useCatalogStore((state) => state.completedCourses);
  const wishlistCourses = useCatalogStore((state) => state.wishlistCourses);
  const setCatalogState = (
    completed: CompletedCourse[],
    wishlist: WishlistCourse[]
  ) => {
    useCatalogStore.setState({
      completedCourses: completed,
      wishlistCourses: wishlist,
    });
  };

  useEffect(() => {
    const loadedCatalogs = localStorage.getItem("savedCatalogs");
    if (loadedCatalogs) {
      try {
        const parsedCatalogs = JSON.parse(loadedCatalogs);
        setSavedCatalogs(parsedCatalogs);
      } catch (error) {
        console.error("Error parsing saved catalogs:", error);
        setSavedCatalogs([]);
      }
    }
  }, []);

  useEffect(() => {
    if (savedCatalogs.length > 0) {
      localStorage.setItem("savedCatalogs", JSON.stringify(savedCatalogs));
    }
  }, [savedCatalogs]);

  const handleSaveCatalog = () => {
    if (completedCourses.length === 0 && wishlistCourses.length === 0) {
      toast.error("No courses to save");
      return;
    }

    if (!catalogName.trim()) {
      toast.error("Please enter a progress name");
      return;
    }

    const newCatalog: SavedCatalog = {
      id: Date.now(),
      name: catalogName,
      completedCourses,
      wishlistCourses,
      isDefault: savedCatalogs.length === 0,
      timestamp: Date.now(),
    };

    const existingIndex = savedCatalogs.findIndex(
      (s) => s.name === catalogName
    );

    if (existingIndex !== -1) {
      const updatedCatalogs = [...savedCatalogs];
      updatedCatalogs[existingIndex] = {
        ...newCatalog,
        isDefault: updatedCatalogs[existingIndex].isDefault,
      };
      setSavedCatalogs(updatedCatalogs);
      toast.success(`Progress "${catalogName}" updated`);
    } else {
      setSavedCatalogs([...savedCatalogs, newCatalog]);
      toast.success(`Progress "${catalogName}" saved`);
    }

    setShowSaveDialog(false);
    setCatalogName("");
  };

  const handleLoadCatalog = (catalog: SavedCatalog) => {
    setCatalogState(
      catalog.completedCourses || [],
      catalog.wishlistCourses || []
    );
    setShowLoadDialog(false);
    toast.success(`Progress "${catalog.name}" loaded`);
  };

  const handleDeleteCatalog = (id: number) => {
    const updatedCatalogs = savedCatalogs.filter((s) => s.id !== id);

    if (
      savedCatalogs.find((s) => s.id === id)?.isDefault &&
      updatedCatalogs.length > 0
    ) {
      const mostRecent = updatedCatalogs.reduce((prev, current) =>
        prev.timestamp > current.timestamp ? prev : current
      );
      const mostRecentIndex = updatedCatalogs.findIndex(
        (s) => s.id === mostRecent.id
      );
      updatedCatalogs[mostRecentIndex].isDefault = true;
    }

    setSavedCatalogs(updatedCatalogs);
    if (updatedCatalogs.length === 0) {
      localStorage.removeItem("savedCatalogs");
    }
    toast.success("Progress deleted");
  };

  const handleSetDefault = (id: number) => {
    const updatedCatalogs = savedCatalogs.map((catalog) => ({
      ...catalog,
      isDefault: catalog.id === id,
    }));

    setSavedCatalogs(updatedCatalogs);
    toast.success("Default progress set");
  };

  const getCatalogSummary = (catalog: SavedCatalog) => {
    const completedCount = catalog.completedCourses?.length || 0;
    const wishlistCount = catalog.wishlistCourses?.length || 0;

    let summary = "";
    if (completedCount > 0) {
      summary += `${completedCount} completed`;
    }

    if (wishlistCount > 0) {
      if (summary) summary += ", ";
      summary += `${wishlistCount} planned`;
    }

    return summary || "Empty progress";
  };

  return (
    <div className="schedule-manager">
      <div className="schedule-manager-buttons">
        <button
          onClick={() => setShowSaveDialog(true)}
          className="utility-button"
          disabled={
            completedCourses.length === 0 && wishlistCourses.length === 0
          }
        >
          <FaSave />
          <span className="hide-on-mobile">&nbsp; Save</span>
        </button>
        <button
          onClick={() => setShowLoadDialog(true)}
          className="utility-button"
          disabled={savedCatalogs.length === 0}
        >
          <FaFolderOpen />
          <span className="hide-on-mobile">&nbsp; Load</span>
        </button>
      </div>

      {showSaveDialog && (
        <div className="schedule-dialog">
          <div className="schedule-dialog-content">
            <h3>Save Progress</h3>
            <input
              type="text"
              placeholder="Progress name"
              value={catalogName}
              onChange={(e) => setCatalogName(e.target.value)}
              maxLength={20}
            />
            <div className="schedule-summary">
              Saving:{" "}
              {completedCourses.length > 0 && (
                <span>{completedCourses.length} completed</span>
              )}
              {wishlistCourses.length > 0 && (
                <span>
                  {completedCourses.length > 0 ? ", " : ""}
                  {wishlistCourses.length} planned
                </span>
              )}
            </div>
            <div className="schedule-dialog-buttons">
              <Button
                label="Cancel"
                onClick={() => {
                  setShowSaveDialog(false);
                  setCatalogName("");
                }}
                type="secondary"
              />
              <Button label="Save" onClick={handleSaveCatalog} type="primary" />
            </div>
          </div>
        </div>
      )}

      {showLoadDialog && (
        <div className="schedule-dialog">
          <div className="schedule-dialog-content">
            <h3>Load Progress</h3>
            {savedCatalogs.length > 0 ? (
              <div className="saved-schedules-list">
                {savedCatalogs.map((catalog) => (
                  <div key={catalog.id} className="saved-schedule-item">
                    <div className="saved-schedule-info">
                      <button
                        className="star-button"
                        onClick={() => handleSetDefault(catalog.id)}
                        title={
                          catalog.isDefault
                            ? "Default progress"
                            : "Set as default"
                        }
                      >
                        {catalog.isDefault ? (
                          <IoMdStar className="star-icon filled" />
                        ) : (
                          <IoMdStarOutline className="star-icon" />
                        )}
                      </button>
                      <span className="schedule-name">{catalog.name}</span>
                      <span className="schedule-contents">
                        {getCatalogSummary(catalog)}
                      </span>
                    </div>
                    <div className="saved-schedule-actions">
                      <Button
                        label="Load"
                        onClick={() => handleLoadCatalog(catalog)}
                        type="primary"
                        className="small-btn"
                      />
                      <Button
                        label="Delete"
                        onClick={() => handleDeleteCatalog(catalog.id)}
                        type="secondary"
                        className="small-btn"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-schedules">No saved progress profiles</p>
            )}
            <div className="schedule-dialog-buttons">
              <Button
                label="Close"
                onClick={() => setShowLoadDialog(false)}
                type="secondary"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
