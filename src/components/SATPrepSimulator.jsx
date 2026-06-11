import React, { useState } from 'react';

interface PrepQuestion {
  id: string;
  type: 'Math' | 'Reading' | 'IELTS_Vocab';
  question: string;
  options: string[];
  correctIdx: number;
  explanation: string;
}

export function SATPrepSimulator() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);

  const testQuestions: PrepQuestion[] = [
    {
      id: 'sat-m-01',
      type: 'Math',
      question: "If 3x + 15 = 2x - 4, what is the value of 5x?",
      options: ["-95", "-19", "-5", "5"],
      correctIdx: 0,
      explanation: "Subtracting 2x from both sides yields x + 15 = -4. Subtracting 15 from both sides yields x = -19. Multiplying by 5 gives 5x = -95."
    },
    {
      id: 'sat-r-01',
      type: 'Reading',
      question: "The passage primarily serves to:",
      options: [
        "Describe a beautiful landscape",
        "Argue for environmental conservation",
        "Narrate a personal experience",
        "Criticize urban development"
      ],
      correctIdx: 1,
      explanation: "The main purpose of the passage is to persuade readers to support environmental conservation efforts."
    },
    {
      id: 'sat-v-01',
      type: 'IELTS_Vocab',
      question: "Which word best completes the sentence: The professor's lecture was ___ and difficult to follow.",
      options: ["clear", "concise", "mundane", "convoluted"],
      correctIdx: 3,
      explanation: "Convoluted means overly complicated and difficult to understand, which fits the context."
    }
  ];

  const currentQ = testQuestions[activeIdx];

  const handleCommit = () => {
    if (selectedOpt === null) return;
    setIsAnswered(true);
    if (selectedOpt === currentQ.correctIdx) {
      setScore(prev => prev + 10);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] bg-sky-500/10 text-sky-400 font-mono font-bold uppercase py-0.5 px-2.5 rounded-full border border-sky-500/20">
          SAT Diagnostic: {currentQ.type}
        </span>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <span className="text-slate-500">⏳</span>
          <span>Timer Active</span>
        </div>
      </div>

      <p className="text-xs text-slate-200 font-medium mb-4 leading-relaxed">
        {currentQ.question}
      </p>

      <div className="space-y-2 mb-4">
        {currentQ.options.map((opt, i) => {
          let optStyle = "border-slate-850 bg-slate-950 text-slate-300 hover:border-slate-700";
          if (isAnswered) {
            if (i === currentQ.correctIdx) optStyle = "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
            else if (selectedOpt === i) optStyle = "border-rose-500/30 bg-rose-500/10 text-rose-400";
          } else if (selectedOpt === i) {
            optStyle = "border-sky-500 bg-sky-500/5 text-sky-300";
          }

          return (
            <button
              key={i}
              onClick={() => !isAnswered && setSelectedOpt(i)}
              className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all ${optStyle}`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      <div className="flex justify-between items-center">
        <span className="text-[11px] text-slate-500 font-mono font-bold">
          Score Level: {score} XP
        </span>
        {!isAnswered ? (
          <button
            onClick={handleCommit}
            disabled={selectedOpt === null}
            className="bg-emerald-500 text-slate-950 font-bold text-xs py-1.5 px-4 rounded-lg hover:bg-emerald-400 transition"
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={() => {
              setIsAnswered(false);
              setSelectedOpt(null);
              setActiveIdx((prev) => (prev + 1) % testQuestions.length);
            }}
            className="bg-slate-800 text-white font-bold text-xs py-1.5 px-4 rounded-lg hover:bg-slate-750 transition"
          >
            Next Challenge
          </button>
        )}
      </div>
    </div>
  );
}