
import React, { useState, useEffect } from 'react';
import { NewsArticle } from '../types';
import { gemini } from '../services/geminiService';
import { ExternalLink, Clock, Newspaper, Loader2, Sparkles } from 'lucide-react';

const NewsSection: React.FC = () => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const articles = await gemini.fetchEntertainmentNews();
        setNews(articles);
      } catch (e) {
        console.error("News sync failed", e);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-[10px] font-black tracking-widest uppercase text-gray-500">Retrieving Global Pulse...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-8">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tighter flex items-center gap-4 italic uppercase">
            <Newspaper className="text-blue-500" size={32} /> Hollywood Pulse
          </h2>
          <p className="text-gray-500 font-bold uppercase text-[9px] tracking-[0.3em]">Neural Feed Sync: Worldwide Entertainment Reporting</p>
        </div>
        <div className="flex items-center gap-3 self-start">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
            <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Live Updates</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {news.map((article, idx) => (
          <a 
            key={idx} 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative bg-[#0a0a0a] border border-white/5 rounded-[2rem] overflow-hidden hover:border-blue-500/30 transition-all duration-500 flex flex-col h-full"
          >
            <div className="relative aspect-video overflow-hidden">
              <img 
                src={article.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070&auto=format&fit=crop'} 
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-40"></div>
              <div className="absolute top-4 left-4">
                <span className="bg-blue-600/90 backdrop-blur-md text-white text-[8px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border border-white/10">
                  {article.source.name}
                </span>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col space-y-4">
              <div className="flex items-center gap-2 text-[9px] font-black text-gray-600 uppercase tracking-widest">
                <Clock size={12} />
                {new Date(article.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </div>
              <h3 className="text-lg font-black leading-tight group-hover:text-blue-400 transition-colors line-clamp-2">
                {article.title}
              </h3>
              <p className="text-gray-500 text-xs line-clamp-3 leading-relaxed font-medium italic">
                {article.description}
              </p>

              <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                  Full Report <ExternalLink size={10} />
                </span>
                <Sparkles className="text-blue-500/10 group-hover:text-blue-500/50 transition-colors" size={16} />
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default NewsSection;
