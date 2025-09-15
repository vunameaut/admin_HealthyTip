// API endpoint for getting Cloudinary signature for signed uploads
import { NextApiRequest, NextApiResponse } from 'next';
import { v2 as cloudinary } from 'cloudinary';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Configure Cloudinary inside the handler
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { folder = 'health_content', public_id } = req.body;
    
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // Create the signature
    const paramsToSign: Record<string, any> = {
      timestamp,
      folder,
    };
    
    if (public_id) {
      paramsToSign.public_id = public_id;
    }
    
    const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET!);
    
    res.status(200).json({
      signature,
      timestamp,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      folder,
    });
  } catch (error) {
    console.error('Error generating signature:', error);
    res.status(500).json({ error: 'Failed to generate signature' });
  }
}
