const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'prisma', 'schema.prisma');
let data = fs.readFileSync(file, 'utf8');

data = data.replace(/model ClassReview \{[\s\S]*?@@map\("class_reviews"\)\r?\n\}/, `model CohortReview {
  id        String @id @default(uuid())
  cohortId  String
  cohort    Cohort @relation(fields: [cohortId], references: [id], onDelete: Cascade)

  studentId String
  student   User   @relation(fields: [studentId], references: [id], onDelete: Cascade)

  rating  Int     @default(5)
  comment String? @db.Text

  isVisible        Boolean @default(true)
  isFeaturedOnHome Boolean @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([cohortId, studentId])
  @@map("cohort_reviews")
}`);

data = data.replace(/classId String\?\r?\n\s*class\s+Class\?\s+@relation\(fields: \[classId\], references: \[id\], onDelete: SetNull\)/, `cohortId String?
  cohort   Cohort?  @relation(fields: [cohortId], references: [id], onDelete: SetNull)`);

fs.writeFileSync(file, data, 'utf8');
console.log('Fixed relations!');
