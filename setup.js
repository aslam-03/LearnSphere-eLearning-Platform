// Quick Setup Script for Development
// Run this after installing dependencies to set up the project

const fs = require('fs');
const path = require('path');

console.log('🚀 LearnSphere Setup Script\n');

// Check if .env exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env file not found!');
  console.log('📝 Creating .env from .env.example...\n');
  
  const envExample = fs.readFileSync(path.join(__dirname, '.env.example'), 'utf8');
  fs.writeFileSync(envPath, envExample);
  
  console.log('✅ .env file created!');
  console.log('⚠️  Please update .env with your actual credentials\n');
} else {
  console.log('✅ .env file exists\n');
}

// Check Firebase configuration
console.log('📋 Next Steps:');
console.log('1. Update .env with Firebase and Cloudflare R2 credentials');
console.log('2. Run: npm install');
console.log('3. Run: cd functions && npm install && cd ..');
console.log('4. Run: firebase login (if not already logged in)');
console.log('5. Run: firebase init (select Firestore, Functions)');
console.log('6. Run: firebase deploy --only firestore:rules,firestore:indexes');
console.log('7. Run: firebase deploy --only functions');
console.log('8. Run: npm run dev\n');

console.log('📚 For detailed setup instructions, see README.md\n');
console.log('🎉 Happy coding!\n');
