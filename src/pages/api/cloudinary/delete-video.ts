import type { NextApiRequest, NextApiResponse } from 'next';
import cloudinary from '../../../lib/cloudinary';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({ error: 'Public ID is required' });
    }

    // Delete video from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'video',
      invalidate: true
    });

    if (result.result === 'ok' || result.result === 'not found') {
      return res.status(200).json({ 
        success: true, 
        message: 'Video deleted successfully',
        result 
      });
    } else {
      return res.status(500).json({ 
        error: 'Failed to delete video',
        result 
      });
    }
  } catch (error: any) {
    console.error('Error deleting video from Cloudinary:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}
