import React, { useState } from "react";

interface CourseTabContainerProps {
  tabs: {
    id: string;
    label: string;
    content: React.ReactNode;
  }[];
}

export const CourseTabContainer: React.FC<CourseTabContainerProps> = ({
  tabs,
}) => {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div className="course-tab-container">
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-content">
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  );
};

export default CourseTabContainer;
