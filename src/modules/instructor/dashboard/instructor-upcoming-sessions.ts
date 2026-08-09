export type InstructorUpcomingSession = {
  id: string;
  source: 'recorded';
  lessonId?: string;
  title: string;
  startTime: Date;
  endTime: Date;
  meetingUrl: string | null;
  status: string;
  course: { id: string; title: string } | null;
};

export async function fetchInstructorUpcomingSessions(
  _instructorId: string,
  _limit = 5
): Promise<InstructorUpcomingSession[]> {
  return [];
}

export async function countInstructorUpcomingSessions(_instructorId: string): Promise<number> {
  return 0;
}
