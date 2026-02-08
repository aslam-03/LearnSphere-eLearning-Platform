// Quick script to check course data in Firestore
// Run with: node check-course.js ByWunQDVPjsTXXqYEfrn

const admin = require('firebase-admin');

// Make sure you have GOOGLE_APPLICATION_CREDENTIALS set or run in an authenticated environment
const db = admin.firestore();

async function checkCourse(courseId) {
  try {
    // Get course document
    const courseDoc = await db.collection('COURSES').doc(courseId).get();
    
    if (!courseDoc.exists) {
      console.log(`❌ Course ${courseId} not found in database`);
      return;
    }
    
    console.log(`✅ Course found:`);
    console.log(JSON.stringify(courseDoc.data(), null, 2));
    
    // Get lessons
    const lessonsSnap = await db.collection('LESSONS').where('courseId', '==', courseId).get();
    console.log(`\n📚 Lessons (${lessonsSnap.size}):`);
    lessonsSnap.docs.forEach(doc => {
      console.log(`  - ${doc.data().title} (order: ${doc.data().order})`);
    });
    
    // Get quizzes
    const quizzesSnap = await db.collection('QUIZZES').where('courseId', '==', courseId).get();
    console.log(`\n📋 Quizzes (${quizzesSnap.size}):`);
    quizzesSnap.docs.forEach(doc => {
      console.log(`  - ${doc.data().title}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

const courseId = process.argv[2] || 'ByWunQDVPjsTXXqYEfrn';
checkCourse(courseId);
