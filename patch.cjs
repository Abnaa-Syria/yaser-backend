const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// 1. Replace HomeworkStatus enum
content = content.replace(/enum HomeworkStatus \{[\s\S]*?\}/, `enum HomeworkStatus {
  PENDING
  GRADED
}

enum HomeworkType {
  TEXT
  FILE
  LINK
}`);

// 2. Remove homeworks Homework[] from Lesson
content = content.replace(/homeworks\s+Homework\[\]/, '');

// 2.5 Add homeworks Homework[] to Cohort
content = content.replace(/liveSessions\s+LiveSession\[\]/, `liveSessions  LiveSession[]\n  homeworks     Homework[]`);


// 3. Update Homework model
content = content.replace(/model Homework \{[\s\S]*?@@map\("homeworks"\)\r?\n\}/, `model Homework {
  id          String   @id @default(uuid())
  title       String
  description String?  @db.Text
  type        HomeworkType @default(TEXT)
  attachments String[]
  
  dueDate     DateTime
  totalPoints Int      @default(100)

  cohortId    String
  cohort      Cohort   @relation(fields: [cohortId], references: [id], onDelete: Cascade)

  // Relations
  submissions HomeworkSubmission[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([cohortId])
  @@map("homeworks")
}`);

// 4. Update HomeworkSubmission model
content = content.replace(/model HomeworkSubmission \{[\s\S]*?@@map\("homework_submissions"\)\r?\n\}/, `model HomeworkSubmission {
  id        String @id @default(uuid())
  studentId String
  student   User   @relation(fields: [studentId], references: [id], onDelete: Cascade)

  homeworkId String
  homework   Homework @relation(fields: [homeworkId], references: [id], onDelete: Cascade)

  status      HomeworkStatus @default(PENDING)
  content     String?        @db.Text
  fileUrl     String?        @db.Text
  submittedAt DateTime?

  grade       Float?
  feedback    String?        @db.Text
  gradedAt    DateTime?

  @@unique([studentId, homeworkId])
  @@index([homeworkId])
  @@map("homework_submissions")
}`);

fs.writeFileSync('prisma/schema.prisma', content);
console.log('Schema updated successfully');
