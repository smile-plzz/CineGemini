
import React, { useState, useEffect } from 'react';
import { NewsArticle } from '../types';
import { movieService } from '../services/movieService';
import { ExternalLink, Clock, Newspaper, Loader2 } from 'lucide-react';

const NewsSection: React.FC = () => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const articles = await movieService.fetchEntertainmentNews();
        setNews(articles);
      } catch (e) {
        console.error("News sync error", e);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-[10px] font-black tracking-widest uppercase text-gray-500">Updating News Feed...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-3">
          <Newspaper className="text-blue-500" size={28} /> Hollywood Pulse
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {news.map((article, idx) => (
          <a 
            key={idx} 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex flex-col sm:flex-row bg-[#0d0d0d] border border-white/5 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-300"
          >
            <div className="w-full sm:w-1/3 aspect-video sm:aspect-square relative overflow-hidden shrink-0">
              <img 
                src={article.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070&auto=format&fit=crop'} 
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>

            <div className="p-5 flex flex-col justify-between flex-1">
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                  <span className="text-blue-500">{article.source.name}</span>
                  <div className="w-1 h-1 bg-white/10 rounded-full"></div>
                  <span className="flex items-center gap-1"><Clock size={10} /> {new Date(article.publishedAt).toLocaleDateString()}</span>
                </div>
                <h3 className="text-base font-black leading-snug group-hover:text-blue-400 transition-colors line-clamp-2">
                  {article.title}
                </h3>
              </div>
              <div className="mt-4 flex items-center text-[9px] font-black text-blue-500 uppercase tracking-widest">
                Read Full Report <ExternalLink size={10} className="ml-2" />
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default NewsSection;
