import React from 'react';
import { LearningContent } from '../types';

interface LearningViewProps {
  content: LearningContent;
}

export const LearningView: React.FC<LearningViewProps> = ({ content }) => {
  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-primary-600 px-8 py-10 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
           <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-indigo-900 opacity-20 rounded-full blur-2xl"></div>
           
          <h2 className="text-3xl md:text-4xl font-bold mb-4 relative z-10">{content.title}</h2>
          <p className="text-primary-100 text-lg leading-relaxed max-w-2xl relative z-10">
            {content.summary}
          </p>
        </div>
        
        <div className="p-8 md:p-12 space-y-10">
          {content.sections.map((section, index) => (
            <section key={index} className="group">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-sm md:text-base border border-primary-100 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3 group-hover:text-primary-700 transition-colors">
                    {section.heading}
                  </h3>
                  <div className="prose prose-indigo text-gray-600 leading-7 text-lg whitespace-pre-line">
                    {section.content}
                  </div>
                </div>
              </div>
              {index < content.sections.length - 1 && (
                <div className="ml-5 md:ml-6 mt-10 h-8 border-l-2 border-dashed border-gray-100"></div>
              )}
            </section>
          ))}
        </div>
        
        <div className="bg-gray-50 p-6 text-center text-gray-500 text-sm border-t border-gray-100">
          AI生成コンテンツ • 内容を確認しながら学習してください
        </div>
      </div>
    </div>
  );
};
