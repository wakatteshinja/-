import React, { useState, useCallback } from 'react';
import { TopicInput } from './components/TopicInput';
import { LearningView } from './components/LearningView';
import { QuizView } from './components/QuizView';
import { ChatInterface } from './components/ChatInterface';
import { generateLearningContent, generateQuiz, createChatSession } from './services/geminiService';
import { AppMode, LearningContent, QuizQuestion } from './types';
import { Chat } from '@google/genai';

function App() {
  const [mode, setMode] = useState<AppMode>(AppMode.HOME);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data States
  const [learningContent, setLearningContent] = useState<LearningContent | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[] | null>(null);
  const [chatSession, setChatSession] = useState<Chat | null>(null);

  const handleSearch = useCallback(async (searchTopic: string) => {
    setLoading(true);
    setError(null);
    setTopic(searchTopic);

    try {
      // Parallel execution to load both content and quiz
      // In a real app, we might lazy load the quiz, but this feels snappy once loaded.
      const [content, quiz] = await Promise.all([
        generateLearningContent(searchTopic),
        generateQuiz(searchTopic)
      ]);
      
      const chat = createChatSession(searchTopic);

      setLearningContent(content);
      setQuizQuestions(quiz);
      setChatSession(chat);
      setMode(AppMode.LEARN);
    } catch (err) {
      console.error(err);
      setError("コンテンツの生成中にエラーが発生しました。別のトピックを試すか、しばらく待ってから再試行してください。");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRetakeQuiz = () => {
    // Just reset the component state, logic is inside QuizView, 
    // but to fully reset we can force remount or just use local state in QuizView (which we do).
    // We just need to ensure the user stays in Quiz mode.
  };

  const resetApp = () => {
    setMode(AppMode.HOME);
    setTopic('');
    setLearningContent(null);
    setQuizQuestions(null);
    setChatSession(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-primary-200 selection:text-primary-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer group" 
            onClick={resetApp}
          >
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/30 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">Manabu AI</span>
          </div>
          
          {mode !== AppMode.HOME && (
            <div className="flex bg-gray-100/50 p-1 rounded-xl">
              <button
                onClick={() => setMode(AppMode.LEARN)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  mode === AppMode.LEARN ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                学習
              </button>
              <button
                onClick={() => setMode(AppMode.QUIZ)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  mode === AppMode.QUIZ ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                クイズ
              </button>
              <button
                onClick={() => setMode(AppMode.CHAT)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  mode === AppMode.CHAT ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                チャット
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {mode === AppMode.HOME ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-full animate-in fade-in zoom-in duration-500">
              <TopicInput onSearch={handleSearch} isLoading={loading} />
            </div>
            {error && (
              <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 max-w-md text-center">
                {error}
              </div>
            )}
            
            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mt-24 w-full max-w-5xl">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-4 text-indigo-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">AIによる概念解説</h3>
                <p className="text-gray-500 text-sm">複雑なトピックも、AIが初心者向けに分かりやすく構造化して解説します。</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center mb-4 text-pink-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">理解度チェッククイズ</h3>
                <p className="text-gray-500 text-sm">学習内容に基づいた4択クイズで、知識の定着を確認できます。</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-4 text-emerald-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">AIチューターとチャット</h3>
                <p className="text-gray-500 text-sm">疑問点はすぐにチャットで質問。あなた専用の先生が24時間サポートします。</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full">
            {mode === AppMode.LEARN && learningContent && (
              <LearningView content={learningContent} />
            )}
            {mode === AppMode.QUIZ && quizQuestions && (
              <QuizView questions={quizQuestions} onRetake={handleRetakeQuiz} />
            )}
            {mode === AppMode.CHAT && chatSession && (
              <div className="max-w-4xl mx-auto">
                 <ChatInterface chatSession={chatSession} topic={topic} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
