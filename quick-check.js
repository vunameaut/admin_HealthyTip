const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

const firebaseConfig = {
  apiKey: "AIzaSyAXWk6glK6hpXQkiunvydjFNtM56yxwN_w",
  authDomain: "reminderwater-84694.firebaseapp.com",
  databaseURL: "https://reminderwater-84694-default-rtdb.firebaseio.com",
  projectId: "reminderwater-84694",
  storageBucket: "reminderwater-84694.appspot.com",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function quickCheck() {
  try {
    console.log('Checking database structure...');
    
    // Check root to see all available paths
    const rootSnapshot = await get(ref(database, '/'));
    const data = rootSnapshot.val();
    
    if (data) {
      console.log('\nAvailable collections:');
      Object.keys(data).forEach(key => {
        const count = Object.keys(data[key] || {}).length;
        console.log(`- ${key}: ${count} items`);
      });
    } else {
      console.log('No data found in database');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

quickCheck();
