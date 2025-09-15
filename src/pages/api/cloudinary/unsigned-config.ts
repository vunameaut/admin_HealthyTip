import { NextApiRequest, NextApiResponse } from 'next';
import { v2 as cloudinary } from 'cloudinary';
import slugify from 'slugify';

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
    const { category, resourceType } = req.body;

    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }

    if (!resourceType || !['image', 'video'].includes(resourceType)) {
      return res.status(400).json({ error: 'Valid resourceType (image/video) is required' });
    }

    // Tạo folder structure theo yêu cầu: healthy_tip/[slug_chủ_đề]/[YYYY]/[MM]
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const categorySlug = slugify(category, { lower: true, strict: true });

    const folder = `healthy_tip/${categorySlug}/${year}/${month}`;

    console.log('Unsigned upload config for:', { category, resourceType, folder });

    // Trả về thông tin cho unsigned upload
    res.status(200).json({
      upload_preset: 'healthtip_unsigned', // Sẽ tạo preset này trên Cloudinary
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      folder,
      resource_type: resourceType,
      api_key: process.env.CLOUDINARY_API_KEY,
      upload_url: `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
      note: 'This is for unsigned upload - no signature needed!'
    });

  } catch (error) {
    console.error('Error generating unsigned upload config:', error);
    res.status(500).json({ 
      error: 'Failed to generate upload config',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
