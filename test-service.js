const { initializeApp } = require('firebase/app');
const { getDatabase } = require('firebase/database');

const firebaseConfig = {
  apiKey: "AIzaSyAXWk6glK6hpXQkiunvydjFNtM56yxwN_w",
  authDomain: "reminderwater-84694.firebaseapp.com",
  databaseURL: "https://reminderwater-84694-default-rtdb.firebaseio.com",
  projectId: "reminderwater-84694",
  storageBucket: "reminderwater-84694.appspot.com",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Copy HealthTipsService logic for testing
const { ref, get } = require('firebase/database');

class HealthTipsService {
  constructor() {
    this.basePath = 'health_tips';
  }

  async getById(id) {
    try {
      const tipRef = ref(database, `${this.basePath}/${id}`);
      const snapshot = await get(tipRef);
      
      if (!snapshot.exists()) return null;
      
      return {
        id,
        ...snapshot.val()
      };
    } catch (error) {
      console.error('Error fetching health tip:', error);
      throw error;
    }
  }

  async getAll() {
    try {
      const tipsRef = ref(database, this.basePath);
      const snapshot = await get(tipsRef);
      
      if (!snapshot.exists()) return [];
      
      const tips = [];
      snapshot.forEach((child) => {
        const tip = child.val();
        tips.push({
          id: child.key,
          ...tip
        });
      });

      return tips;
    } catch (error) {
      console.error('Error fetching health tips:', error);
      throw error;
    }
  }
}

async function testService() {
  try {
    const service = new HealthTipsService();
    
    console.log('Testing HealthTipsService...');
    
    // Test getAll
    const allTips = await service.getAll();
    console.log('Total tips found:', allTips.length);
    
    if (allTips.length > 0) {
      const firstTip = allTips[0];
      console.log('First tip ID:', firstTip.id);
      console.log('First tip title:', firstTip.title);
      
      // Test getById
      const singleTip = await service.getById(firstTip.id);
      console.log('Retrieved by ID:', singleTip ? singleTip.title : 'NOT FOUND');
      
      // Test with a few more IDs
      console.log('\nTesting with first 3 tip IDs:');
      for (let i = 0; i < Math.min(3, allTips.length); i++) {
        const tip = await service.getById(allTips[i].id);
        console.log(`- ${allTips[i].id}: ${tip ? tip.title : 'NOT FOUND'}`);
      }
    }
    
  } catch (error) {
    console.error('Service test error:', error);
  }
  
  process.exit(0);
}

testService();
