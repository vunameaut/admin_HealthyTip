import { NextApiRequest, NextApiResponse } from 'next';
import { videosService } from '../../../services/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const videos = await videosService.getAll();
      
      const videoData = videos.map(video => ({
        id: video.id,
        title: video.title,
        cloudinaryPublicId: video.cloudinaryPublicId,
        cldPublicId: (video as any).cldPublicId,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        status: video.status
      }));

      res.status(200).json({
        success: true,
        count: videos.length,
        videos: videoData
      });
    } catch (error) {
      console.error('Error fetching videos:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch videos'
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
