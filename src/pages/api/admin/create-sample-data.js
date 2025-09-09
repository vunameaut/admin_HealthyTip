const { createSampleData } = require('../../../utils/sampleData');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    const result = await createSampleData();
    
    if (result) {
      res.status(200).json({ 
        success: true, 
        message: 'Sample data created successfully' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create sample data' 
      });
    }
  } catch (error) {
    console.error('Error in create-sample-data API:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
}

module.exports = handler;
