import React, { useState } from 'react';
import { QuizQuestion } from '../types';

interface QuizViewProps {
  questions: QuizQuestion[];
  onRetake: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ questions, onRetake }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  const handleOptionClick = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    if (index === currentQuestion.correctAnswerIndex) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
    }
  };

  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden p-8 md:p-12 text-center animate-in zoom-in duration-300">
        <div className="mb-6 inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-tr from-primary-400 to-primary-600 text-white text-4xl font-bold shadow-lg">
          {percentage}%
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">クイズ完了!</h2>
        <p className="text-gray-500 mb-8 text-lg">
          {questions.length}問中 {score}問 正解しました
        </p>

        <div className="w-full bg-gray-100 rounded-full h-4 mb-8 overflow-hidden">
          <div 
            className="bg-primary-500 h-4 rounded-full transition-all duration-1000 ease-out" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>

        <button
          onClick={onRetake}
          className="bg-gray-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-gray-800 transition-all hover:shadow-lg active:scale-95"
        >
          もう一度挑戦する
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="mb-6 flex justify-between items-center text-sm font-medium text-gray-500">
        <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
        <span>Score: {score}</span>
      </div>

      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-gray-100">
           <div 
             className="h-full bg-primary-500 transition-all duration-300"
             style={{ width: `${((currentQuestionIndex) / questions.length) * 100}%` }}
           />
        </div>

        <div className="p-8 md:p-10">
          <h3 className="text-2xl font-bold text-gray-800 mb-8 leading-snug">
            {currentQuestion.question}
          </h3>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              let buttonStyle = "border-gray-200 hover:border-primary-300 hover:bg-gray-50";
              let icon = null;

              if (isAnswered) {
                if (index === currentQuestion.correctAnswerIndex) {
                  buttonStyle = "border-green-500 bg-green-50 text-green-700 font-medium";
                  icon = (
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  );
                } else if (index === selectedOption) {
                  buttonStyle = "border-red-500 bg-red-50 text-red-700";
                  icon = (
                    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  );
                } else {
                  buttonStyle = "border-gray-100 opacity-50";
                }
              } else if (selectedOption === index) {
                buttonStyle = "border-primary-500 bg-primary-50 text-primary-700";
              }

              return (
                <button
                  key={index}
                  onClick={() => handleOptionClick(index)}
                  disabled={isAnswered}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group ${buttonStyle}`}
                >
                  <span className="text-lg">{option}</span>
                  {icon}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div className="mt-8 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="bg-primary-50 rounded-xl p-5 border border-primary-100">
                <div className="flex items-start gap-3">
                  <div className="bg-primary-100 p-2 rounded-lg text-primary-600 mt-1">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-primary-800 mb-1">解説</h4>
                    <p className="text-primary-700 leading-relaxed">{currentQuestion.explanation}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleNext}
                  className="bg-primary-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-md hover:shadow-xl flex items-center"
                >
                  {currentQuestionIndex < questions.length - 1 ? '次の問題へ' : '結果を見る'}
                  <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
