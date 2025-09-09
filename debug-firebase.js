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

async function checkDatabase() {
  try {
    console.log('Checking Firebase database...');
    
    // Check both possible paths
    const healthTipsRef = ref(database, 'health_tips');
    const healthTipsOldRef = ref(database, 'healthTips');
    
    const [snapshot1, snapshot2] = await Promise.all([
      get(healthTipsRef),
      get(healthTipsOldRef)
    ]);
    
    console.log('health_tips exists:', snapshot1.exists());
    console.log('healthTips exists:', snapshot2.exists());
    
    if (snapshot1.exists()) {
      const data = snapshot1.val();
      console.log('health_tips data keys:', Object.keys(data));
      console.log('First item:', Object.values(data)[0]);
    }
    
    if (snapshot2.exists()) {
      const data = snapshot2.val();
      console.log('healthTips data keys:', Object.keys(data));
      console.log('First item:', Object.values(data)[0]);
    }
    
    // Check categories
    const categoriesRef = ref(database, 'categories');
    const categoriesSnapshot = await get(categoriesRef);
    console.log('categories exists:', categoriesSnapshot.exists());
    
    // Check videos
    const videosRef = ref(database, 'videos');
    const videosSnapshot = await get(videosRef);
    console.log('videos exists:', videosSnapshot.exists());
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDatabase();
