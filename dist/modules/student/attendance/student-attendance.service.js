import { getStudentAttendanceReport } from '../../shared/attendance-read.service.js';
export const getMyAttendance = async (studentId) => {
    return getStudentAttendanceReport(studentId);
};
//# sourceMappingURL=student-attendance.service.js.map