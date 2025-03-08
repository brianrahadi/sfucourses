// import React, { useEffect, useState } from "react";
// import { CourseWithSectionDetails } from "@types";
// import { WeeklySchedule } from "./WeeklySchedule"; // Use your enhanced version

// // Function to convert a timeblock to a course format for conflict checking
// const timeBlockToCourseFormat = (block: any): CourseWithSectionDetails => {
//   // Calculate hours and minutes
//   const hours = Math.floor(block.startTime / 60);
//   const minutes = block.startTime % 60;
//   const startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

//   const endMinutes = block.startTime + block.duration;
//   const endHours = Math.floor(endMinutes / 60);
//   const endMinutesRemainder = endMinutes % 60;
//   const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutesRemainder.toString().padStart(2, '0')}`;

//   // Day code mapping
//   const dayCodeMap: Record<string, string> = {
//     'Mon': 'Mo',
//     'Tue': 'Tu',
//     'Wed': 'We',
//     'Thu': 'Th',
//     'Fri': 'Fr'
//   };

//   return {
//     dept: 'BLOCK',
//     number: block.id.substring(0, 4),
//     title: 'Time Block',
//     units: '0',
//     term: '', // Not relevant for blocks
//     sections: [{
//       section: 'BLOCKED',
//       classNumber: block.id,
//       deliveryMethod: 'In Person',
//       instructors: [],
//       schedules: [{
//         startDate: new Date().toISOString().split('T')[0], // Today
//         endDate: new Date(new Date().setDate(new Date().getDate() + 120)).toISOString().split('T')[0], // 4 months ahead
//         campus: 'Blocked Time',
//         days: dayCodeMap[block.day] || block.day,
//         startTime,
//         endTime,
//         sectionCode: 'BLOCK'
//       }]
//     }]
//   };
// };

// interface ConflictAwareSchedulerProps {
//   availableCourses: CourseWithSectionDetails[];
//   setAvailableCourses: React.Dispatch<React.SetStateAction<CourseWithSectionDetails[]>>;
//   selectedCourses: CourseWithSectionDetails[];
//   setSelectedCourses: React.Dispatch<React.SetStateAction<CourseWithSectionDetails[]>>;
//   filterConflicts: boolean;
// }

// const ConflictAwareScheduler: React.FC<ConflictAwareSchedulerProps> = ({
//   availableCourses,
//   setAvailableCourses,
//   selectedCourses,
//   setSelectedCourses,
//   filterConflicts
// }) => {
//   // Get time blocks from URL and store locally
//   const [timeBlocks, setTimeBlocks] = useState<any[]>([]);

//   // When timeBlocks change, update conflict filtering
//   useEffect(() => {
//     if (!filterConflicts) return;

//     // Convert time blocks to course format for filtering
//     const timeBlocksAsCourses = timeBlocks.map(timeBlockToCourseFormat);

//     // Filter available courses against time blocks
//     // Note: This would need actual implementation of your conflict filter logic
//     // const filteredCourses = filterCoursesAgainstTimeBlocks(availableCourses, timeBlocksAsCourses);
//     // setAvailableCourses(filteredCourses);

//     // Alternative: you could expose timeBlocks through context or props
//     // to make them available to your conflict filter component
//   }, [timeBlocks, filterConflicts]);

//   return (
//     <div className="enhanced-scheduler">
//       <WeeklySchedule
//         coursesWithSections={selectedCourses}
//         setCoursesWithSections={setSelectedCourses}
//         // We'd need to pass these in your actual implementation:
//         // timeBlocks={timeBlocks}
//         // setTimeBlocks={setTimeBlocks}
//       />
//     </div>
//   );
// };

// export default ConflictAwareScheduler;
