import React, { useState } from 'react';

interface TopicInputProps {
  onSearch: (topic: string) => void;
  isLoading: boolean;
}

export const TopicInput: React.FC<TopicInputProps> = ({ onSearch, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSearch(input.trim());
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
        何を<span className="text-primary-600">学び</span>ますか？
      </h1>
      <p className="text-gray-500 mb-8 text-lg">
        AIが学習ガイド、クイズ、チャットボットを自動生成します。
      </p>
      
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="h-6 w-6 text-gray-400 group-focus-within:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="例: 量子力学, React Hooks, フランス革命..."
          className="block w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-300 text-lg shadow-sm"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className={`absolute right-2 top-2 bottom-2 px-6 rounded-xl font-medium transition-all duration-200 ${
            !input.trim() || isLoading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              生成中...
            </span>
          ) : (
            '学習開始'
          )}
        </button>
      </form>

      <div className="mt-8 flex justify-center gap-3 text-sm text-gray-400">
        <span className="px-3 py-1 bg-white border border-gray-100 rounded-full shadow-sm">⚡ 高速学習</span>
        <span className="px-3 py-1 bg-white border border-gray-100 rounded-full shadow-sm">🧠 クイズ生成</span>
        <span className="px-3 py-1 bg-white border border-gray-100 rounded-full shadow-sm">💬 AIチューター</span>
      </div>
    </div>
  );
};
