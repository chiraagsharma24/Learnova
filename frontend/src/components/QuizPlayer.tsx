import { useState, useEffect } from "react";
import { CheckCircle2, ArrowRight, RotateCcw, Trophy, Play, HelpCircleIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitQuizAttempt } from "@/fetchers/quiz";
import type { Quiz } from "@/types/quiz";
import toast from "react-hot-toast";
import { cn } from "../lib/utils";

interface QuizPlayerProps {
  quiz: Quiz;
  courseId: string;
  lessonId: string;
  onComplete: (data: any) => void;
}

export function QuizPlayer({ quiz, courseId, lessonId, onComplete }: QuizPlayerProps) {
  const [currentStep, setCurrentStep] = useState(0); // 0 = start, 1..n = questions, n+1 = result
  const [answers, setAnswers] = useState<{ questionId: string; choiceIndex: number }[]>([]);
  const [showResult, setShowResult] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => submitQuizAttempt(courseId, lessonId, answers),
    onSuccess: (data) => {
      setShowResult(true);
      queryClient.invalidateQueries({ queryKey: ["progress", courseId] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      onComplete(data);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Submission failed");
    },
  });

  const questions = quiz.questions;
  const currentQuestion = questions[currentStep - 1];

  const handleStart = () => setCurrentStep(1);

  const handleSelect = (choiceIndex: number) => {
    const newAnswers = [...answers];
    const existingIdx = newAnswers.findIndex((a) => a.questionId === currentQuestion._id);
    if (existingIdx > -1) {
      newAnswers[existingIdx].choiceIndex = choiceIndex;
    } else {
      newAnswers.push({ questionId: currentQuestion._id, choiceIndex });
    }
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentStep < questions.length) {
      setCurrentStep(currentStep + 1);
    } else {
      mutation.mutate();
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAnswers([]);
    setShowResult(false);
  };

  if (showResult && mutation.data) {
    const res = mutation.data;
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <Trophy className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-2">Quiz Completed!</h2>
        <p className="text-slate-500 mb-8">Great job on finishing the assessment.</p>

        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-10">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="text-2xl font-black text-indigo-600">{res.scorePercentage}%</div>
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Score</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="text-2xl font-black text-emerald-600">+{res.earnedPoints}</div>
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Points</div>
          </div>
        </div>

        <div className="bg-indigo-50 p-6 rounded-3xl w-full max-w-md mb-10 text-left">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-bold text-indigo-900">Attempt summary</span>
            <span className="text-xs bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full font-black">
              Attempt #{res.attemptNumber}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Correct answers</span>
              <span className="font-bold text-slate-800">
                {res.correctCount} / {res.totalQuestions}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">User total points</span>
              <span className="font-bold text-slate-800">{res.totalPoints}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Try again for more points?
        </button>
      </div>
    );
  }

  if (currentStep === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
          <HelpCircleIcon className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-2">Knowledge Check</h2>
        <p className="text-slate-500 mb-8 max-w-sm">
          Test your understanding with {questions.length} questions. You'll earn points based on your score and attempt
          number.
        </p>

        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 w-full max-w-sm mb-8 text-left space-y-4">
          {quiz.attemptRewards.slice(0, 3).map((r, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Attempt {r.attempt}</span>
              <span className="font-bold text-indigo-600">{r.pointsPercentage}% Points</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleStart}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-10 py-4 rounded-2xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-2 group"
        >
          Start Quiz <Play className="w-4 h-4 group-hover:scale-110 transition-transform fill-current" />
        </button>
      </div>
    );
  }

  const selectedIdx = answers.find((a) => a.questionId === currentQuestion._id)?.choiceIndex;

  return (
    <div className="p-8 md:p-12">
      <div className="mb-10">
        <div className="flex justify-between items-end mb-4">
          <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">
            Question {currentStep} of {questions.length}
          </span>
          <span className="text-xs text-slate-400 font-bold">
            {Math.round((currentStep / questions.length) * 100)}% Complete
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${(currentStep / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-8">{currentQuestion.question}</h3>

      <div className="space-y-3 mb-10 text-center">
        {currentQuestion.choices.map((choice, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(idx)}
            className={cn(
              "w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between group",
              selectedIdx === idx
                ? "bg-indigo-50 border-indigo-600 text-indigo-900"
                : "bg-white border-slate-100 hover:border-slate-200 text-slate-700",
            )}
          >
            <span className="font-medium">{choice.text}</span>
            <div
              className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                selectedIdx === idx
                  ? "border-indigo-600 bg-indigo-600"
                  : "border-slate-200 group-hover:border-slate-300",
              )}
            >
              {selectedIdx === idx && <CheckCircle2 className="w-4 h-4 text-white" />}
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          disabled={selectedIdx === undefined || mutation.isPending}
          className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold px-8 py-3.5 rounded-2xl transition-all flex items-center gap-2 group"
        >
          {currentStep < questions.length ? "Next Question" : mutation.isPending ? "Submitting..." : "Finish Quiz"}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
