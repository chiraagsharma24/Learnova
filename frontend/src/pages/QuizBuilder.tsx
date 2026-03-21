import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Save, ChevronLeft, HelpCircle, CheckCircle2, X, MoveHorizontal } from "lucide-react";
import { fetchQuiz, createQuiz, updateQuiz } from "@/fetchers/quiz";
import toast from "react-hot-toast";
import { cn } from "../lib/utils";

export function QuizBuilder() {
  const { id: courseId, lessonId } = useParams() as { id: string; lessonId: string };
  const queryClient = useQueryClient();

  const [questions, setQuestions] = useState<any[]>([]);
  const [totalPoints, setTotalPoints] = useState(100);
  const [rewards, setRewards] = useState([
    { attempt: 1, pointsPercentage: 100 },
    { attempt: 2, pointsPercentage: 75 },
    { attempt: 3, pointsPercentage: 50 },
  ]);

  const { data: quiz, isLoading } = useQuery({
    queryKey: ["quiz", lessonId],
    queryFn: () => fetchQuiz(courseId, lessonId),
  });

  useEffect(() => {
    if (quiz) {
      setQuestions(quiz.questions);
      setTotalPoints(quiz.totalPoints);
      setRewards(quiz.attemptRewards);
    }
  }, [quiz]);

  const mutation = useMutation({
    mutationFn: (data: any) => (quiz ? updateQuiz(courseId, lessonId, data) : createQuiz(courseId, lessonId, data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz", lessonId] });
      toast.success("Quiz saved successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to save quiz");
    },
  });

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "New Question",
        choices: [
          { text: "Option A", isCorrect: true },
          { text: "Option B", isCorrect: false },
        ],
      },
    ]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: string, value: any) => {
    const newQuestions = [...questions];
    newQuestions[idx][field] = value;
    setQuestions(newQuestions);
  };

  const addChoice = (qIdx: number) => {
    const newQuestions = [...questions];
    newQuestions[qIdx].choices.push({ text: "New Option", isCorrect: false });
    setQuestions(newQuestions);
  };

  const removeChoice = (qIdx: number, cIdx: number) => {
    const newQuestions = [...questions];
    newQuestions[qIdx].choices = newQuestions[qIdx].choices.filter((_: any, i: number) => i !== cIdx);
    setQuestions(newQuestions);
  };

  const setCorrect = (qIdx: number, cIdx: number) => {
    const newQuestions = [...questions];
    newQuestions[qIdx].choices = newQuestions[qIdx].choices.map((c: any, i: number) => ({
      ...c,
      isCorrect: i === cIdx,
    }));
    setQuestions(newQuestions);
  };

  const handleSubmit = () => {
    mutation.mutate({ questions, totalPoints, attemptRewards: rewards });
  };

  if (isLoading) return <div className="p-8">Loading builder...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link
        to={`/instructor/courses/${courseId}`}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-8 font-medium"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Lessons
      </Link>

      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Quiz Builder</h1>
          <p className="text-slate-500">Design assessments and define reward logic.</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={mutation.isPending}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
        >
          <Save className="w-5 h-5" /> Save Quiz
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          {questions.map((q, qIdx) => (
            <div
              key={qIdx}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6 relative group"
            >
              <button
                onClick={() => removeQuestion(qIdx)}
                className="absolute right-6 top-6 p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Question {qIdx + 1}
                </label>
                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => updateQuestion(qIdx, "question", e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Answer Choices
                </label>
                {q.choices.map((c: any, cIdx: number) => (
                  <div key={cIdx} className="flex items-center gap-3">
                    <button
                      onClick={() => setCorrect(qIdx, cIdx)}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all",
                        c.isCorrect
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-slate-100 text-slate-200 hover:border-slate-200",
                      )}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <input
                      type="text"
                      value={c.text}
                      onChange={(e) => {
                        const newChoices = [...q.choices];
                        newChoices[cIdx].text = e.target.value;
                        updateQuestion(qIdx, "choices", newChoices);
                      }}
                      className="flex-1 bg-white border border-slate-100 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                    <button onClick={() => removeChoice(qIdx, cIdx)} className="p-2 text-slate-300 hover:text-rose-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addChoice(qIdx)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 pt-2"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Option
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addQuestion}
            className="w-full py-8 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all flex flex-col items-center gap-2"
          >
            <Plus className="w-8 h-8" />
            Add Question
          </button>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
              <MoveHorizontal className="w-4 h-4 text-indigo-500" /> Reward Strategy
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Base Points (1st Attempt Max)</label>
                <input
                  type="number"
                  value={totalPoints}
                  onChange={(e) => setTotalPoints(parseInt(e.target.value))}
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 font-black text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-500 underline decoration-slate-200 underline-offset-4">
                  Point reduction per attempt
                </label>
                {rewards.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <span className="text-sm font-bold text-slate-600">Attempt {r.attempt}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={r.pointsPercentage}
                        onChange={(e) => {
                          const newRewards = [...rewards];
                          newRewards[i].pointsPercentage = parseInt(e.target.value);
                          setRewards(newRewards);
                        }}
                        className="w-16 bg-white border-none rounded-lg p-1 text-right text-sm font-bold focus:ring-0"
                      />
                      <span className="text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-purple-800 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100">
            <HelpCircle className="w-10 h-10 text-white/30 mb-4" />
            <h4 className="font-black text-lg mb-2">Gamification Tip</h4>
            <p className="text-indigo-100 text-sm leading-relaxed">
              Slightly reduce points for repeated attempts to encourage mastery on the first go, but keep rewards
              significant enough to motivate completion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
