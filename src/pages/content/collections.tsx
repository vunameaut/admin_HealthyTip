import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { database } from '../../lib/firebase';
import { ref, onValue } from 'firebase/database';
import { HealthTip, ShortVideo } from '../../types';

export default function CollectionsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'articles' | 'videos'>('articles');
  const [articles, setArticles] = useState<HealthTip[]>([]);
  const [videos, setVideos] = useState<ShortVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const articlesRef = ref(database, 'healthTips');
    const videosRef = ref(database, 'videos');
    
    const unsubscribeArticles = onValue(articlesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const articlesArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setArticles(articlesArray);
      } else {
        setArticles([]);
      }
    });

    const unsubscribeVideos = onValue(videosRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const videosArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setVideos(videosArray);
      } else {
        setVideos([]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeArticles();
      unsubscribeVideos();
    };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2> Đang tải dữ liệu từ Firebase...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1> Import/Export Dữ liệu</h1>
      <p>Bài viết: {articles.length} | Video: {videos.length}</p>
      {articles.length > 0 && (
        <div>
          <h3>Bài viết mới nhất:</h3>
          <p>{articles[0].title}</p>
        </div>
      )}
      {videos.length > 0 && (
        <div>
          <h3>Video mới nhất:</h3>
          <p>{videos[0].title}</p>
        </div>
      )}
    </div>
  );
}
