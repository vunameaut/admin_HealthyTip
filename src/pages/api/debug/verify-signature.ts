import { NextApiRequest, NextApiResponse } from 'next';
import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { params } = req.body;

    if (!params) {
      return res.status(400).json({ error: 'Params are required' });
    }

    console.log('Verifying signature with params:', params);

    // Extract folder and timestamp
    const { folder, timestamp } = params;
    
    if (!folder || !timestamp) {
      return res.status(400).json({ error: 'folder and timestamp are required' });
    }

    // Tạo string theo đúng format Cloudinary expect
    const stringToSign = `folder=${folder}&timestamp=${timestamp}`;
    console.log('Manual string to sign:', stringToSign);

    // Tạo signature manual bằng HMAC SHA1  
    const manualSignature = crypto
      .createHmac('sha1', process.env.CLOUDINARY_API_SECRET!)
      .update(stringToSign)
      .digest('hex');

    console.log('Manual generated signature:', manualSignature);

    // So sánh với SDK để debug
    const sdkSignature = cloudinary.utils.api_sign_request(
      { folder, timestamp },
      process.env.CLOUDINARY_API_SECRET!
    );
    console.log('SDK signature for comparison:', sdkSignature);

    res.status(200).json({
      success: true,
      generatedSignature: manualSignature,
      sdkSignature,
      params,
      stringToSign,
      manual_vs_sdk_match: manualSignature === sdkSignature,
      config: {
        cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        has_secret: !!process.env.CLOUDINARY_API_SECRET
      }
    });

  } catch (error) {
    console.error('Error verifying signature:', error);
    res.status(500).json({ 
      error: 'Verification failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
