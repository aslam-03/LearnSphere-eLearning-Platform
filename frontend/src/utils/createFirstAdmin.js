/**
 * ============================================
 * FIRST ADMIN USER SETUP SCRIPT
 * ============================================
 * 
 * PURPOSE:
 * Create the initial admin user for LearnSphere platform.
 * This should be run ONCE during initial setup.
 * 
 * USAGE:
 * 1. Import this function in main.jsx or any component
 * 2. Call createFirstAdmin() once
 * 3. Comment out the call after successful creation
 * 4. Change the default password immediately after first login
 * 
 * SECURITY NOTES:
 * - Change the default password in this file before running
 * - Delete or secure this file after setup is complete
 * - Never commit real credentials to version control
 */

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

/**
 * Create the first admin user for LearnSphere
 * 
 * @returns {Promise<User>} Firebase user object
 */
export async function createFirstAdmin() {
  // ⚠️ CHANGE THESE BEFORE RUNNING ⚠️
  const adminEmail = 'admin@learnsphere.com';
  const adminPassword = 'Admin123!ChangeThis'; // ← Change this to a secure password
  const adminName = 'System Administrator';

  try {
    console.log('🚀 Creating first admin user...');
    console.log('📧 Email:', adminEmail);

    // Step 1: Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      adminEmail,
      adminPassword
    );

    const user = userCredential.user;
    console.log('✅ Firebase Auth user created');
    console.log('🆔 UID:', user.uid);

    // Step 2: Create Firestore user document with admin role
    const userRef = doc(db, 'users', user.uid);
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: adminName,
      role: 'admin', // ← CRITICAL: Admin role
      totalPoints: 0,
      badge: 'Administrator',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(userRef, userData);
    console.log('✅ Firestore user document created');

    console.log('\n🎉 SUCCESS! First admin user created!\n');
    console.log('═══════════════════════════════════════');
    console.log('  LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════════');
    console.log(`  Email:    ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
    console.log(`  Role:     admin`);
    console.log('═══════════════════════════════════════\n');
    console.log('⚠️  IMPORTANT NEXT STEPS:');
    console.log('  1. Log in with these credentials');
    console.log('  2. Change your password immediately');
    console.log('  3. Comment out the createFirstAdmin() call');
    console.log('  4. Delete or secure this file\n');

    return user;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    
    // Provide helpful error messages
    if (error.code === 'auth/email-already-in-use') {
      console.log('\n⚠️  Admin user already exists!');
      console.log('   If you need to reset, delete the user from Firebase Console first.');
    } else if (error.code === 'auth/weak-password') {
      console.log('\n⚠️  Password is too weak!');
      console.log('   Use at least 6 characters.');
    } else if (error.code === 'auth/invalid-email') {
      console.log('\n⚠️  Invalid email format!');
      console.log('   Check the email address.');
    }
    
    throw error;
  }
}

/**
 * Alternative: Create instructor user
 * Use this to create instructor accounts via admin dashboard
 * 
 * @param {string} email - Instructor email
 * @param {string} password - Instructor password
 * @param {string} displayName - Instructor full name
 * @param {string} bio - Optional bio
 * @param {string} specialization - Optional specialization
 */
export async function createInstructor(email, password, displayName, bio = '', specialization = '') {
  try {
    console.log('🚀 Creating instructor user...');

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    // Create Firestore user document with instructor role
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName,
      role: 'instructor', // ← Instructor role
      totalPoints: 0,
      badge: 'Instructor',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add optional fields
    if (bio) userData.bio = bio;
    if (specialization) userData.specialization = specialization;

    await setDoc(doc(db, 'users', user.uid), userData);

    console.log('✅ Instructor user created successfully!');
    return user;
  } catch (error) {
    console.error('❌ Error creating instructor:', error);
    throw error;
  }
}

/**
 * Test function to verify admin user exists and has correct role
 * 
 * @param {string} uid - User ID to check
 */
export async function verifyAdminUser(uid) {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('../config/firebase');

    console.log('🔍 Verifying admin user...');
    
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.error('❌ User document not found in Firestore!');
      return false;
    }

    const userData = userSnap.data();
    console.log('User data:', userData);

    if (userData.role !== 'admin') {
      console.error('❌ User role is not admin!');
      console.error('   Current role:', userData.role);
      return false;
    }

    console.log('✅ Admin user verified successfully!');
    console.log('   Email:', userData.email);
    console.log('   Role:', userData.role);
    return true;
  } catch (error) {
    console.error('❌ Error verifying admin user:', error);
    return false;
  }
}

// Export all functions
export default {
  createFirstAdmin,
  createInstructor,
  verifyAdminUser,
};
