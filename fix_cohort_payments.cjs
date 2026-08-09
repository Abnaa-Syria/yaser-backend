const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'prisma', 'schema.prisma');
let data = fs.readFileSync(file, 'utf8');

data = data.replace(/cohortReviews CohortReview\[\]\r?\n/, `cohortReviews CohortReview[]\n  payments      Payment[]\n`);

fs.writeFileSync(file, data, 'utf8');
console.log('Added payments relation to Cohort!');
