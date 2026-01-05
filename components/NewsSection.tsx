
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
      const articles = await gemini.fetchEntertainmentNews();
      setNews(articles);
      setLoading(false);
    };
    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <h2 className="text-xl font-black tracking-tighter uppercase text-gray-500">Syncing Global Headlines...</h2>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tighter flex items-center gap-4">
            <Newspaper className="text-blue-500" size={36} /> HOLLYWOOD PULSE
          </h2>
          <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Real-time entertainment news powered by Global Sources</p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 px-4 py-2 rounded-full">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Live Updates</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {news.map((article, idx) => (
          <a 
            key={idx} 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden hover:border-blue-500/30 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col"
          >
            <div className="relative aspect-video overflow-hidden">
              <img 
                src={article.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070&auto=format&fit=crop'} 
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-60"></div>
              <div className="absolute top-4 left-4">
                <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                  {article.source.name}
                </span>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  <Clock size={12} />
                  {new Date(article.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <h3 className="text-xl font-black leading-tight group-hover:text-blue-400 transition-colors line-clamp-3">
                  {article.title}
                </h3>
                <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed">
                  {article.description}
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between group-hover:border-blue-500/20">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                  Read Full Coverage <ExternalLink size={12} />
                </span>
                <Sparkles className="text-blue-500/20 group-hover:text-blue-500/60 transition-colors" size={18} />
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default NewsSection;
