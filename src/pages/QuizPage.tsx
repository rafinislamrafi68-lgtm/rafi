import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCcw, 
  Award, 
  ArrowRight, 
  Play, 
  Plus,
  TrendingUp,
  Sparkles,
  X
} from 'lucide-react';
import { Quiz, QuizQuestion, QuizAttempt } from '../types';
import { StorageService } from '../services/storage';

export const QuizPage: React.FC = () => {
  const activeWsId = StorageService.getActiveWorkspaceId();
  const [quizzes, setQuizzes] = useState<Quiz[]>(StorageService.getQuizzes(activeWsId || undefined));
  const [attempts, setAttempts] = useState<QuizAttempt[]>(StorageService.getAttempts());
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Quiz Form
  const [newTitle, setNewTitle] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOption, setCorrectOption] = useState('');
  const [explanation, setExplanation] = useState('');

  // Active quiz runtime states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [fillAnswer, setFillAnswer] = useState<string>('');
  const [userAnswers, setUserAnswers] = useState<{ [qId: string]: string }>({});
  const [scoreCount, setScoreCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeQuiz && !isCompleted) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeQuiz, isCompleted]);

  const refresh = () => {
    setQuizzes(StorageService.getQuizzes(activeWsId || undefined));
    setAttempts(StorageService.getAttempts());
  };

  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentIndex(0);
    setSelectedOption('');
    setFillAnswer('');
    setUserAnswers({});
    setScoreCount(0);
    setIsCompleted(false);
    setTimerSeconds(0);
  };

  const handleNextQuestion = () => {
    if (!activeQuiz) return;
    const currentQ = activeQuiz.questions[currentIndex];

    const given = currentQ.type === 'fill_in_the_blank' ? fillAnswer.trim() : selectedOption;
    const isCorrect = given.toLowerCase() === currentQ.correctAnswer.toLowerCase();
    
    let newScore = scoreCount;
    if (isCorrect) {
      newScore += 1;
      setScoreCount(newScore);
    }

    const updatedAnswers = { ...userAnswers, [currentQ.id]: given };
    setUserAnswers(updatedAnswers);

    if (currentIndex + 1 < activeQuiz.questions.length) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption('');
      setFillAnswer('');
    } else {
      setIsCompleted(true);
      const weakTopics: string[] = [];
      activeQuiz.questions.forEach(q => {
        const ans = q.id === currentQ.id ? given : updatedAnswers[q.id];
        if (ans?.toLowerCase() !== q.correctAnswer.toLowerCase()) {
          weakTopics.push(q.topicTag);
        }
      });

      const attempt: QuizAttempt = {
        id: 'att-' + Date.now(),
        quizId: activeQuiz.id,
        quizTitle: activeQuiz.title,
        workspaceId: activeQuiz.workspaceId,
        score: Math.round((newScore / activeQuiz.questions.length) * 100),
        totalQuestions: activeQuiz.questions.length,
        correctCount: newScore,
        wrongCount: activeQuiz.questions.length - newScore,
        timeTakenSeconds: timerSeconds,
        weakTopics,
        completedAt: new Date().toISOString()
      };

      StorageService.saveAttempt(attempt);
      refresh();
    }
  };

  const handleCreateQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newQuestion.trim()) return;
    const wsId = StorageService.ensureActiveWorkspaceId();

    const quiz: Quiz = {
      id: 'quiz-' + Date.now(),
      workspaceId: wsId,
      title: newTitle.trim(),
      questions: [
        {
          id: 'q1',
          type: 'mcq',
          question: newQuestion.trim(),
          options: [optA.trim(), optB.trim(), optC.trim(), optD.trim()].filter(Boolean),
          correctAnswer: correctOption.trim() || optA.trim(),
          explanation: explanation.trim() || 'Verified by author.',
          topicTag: 'General'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncState: 'SYNC_PENDING'
    };

    StorageService.saveQuiz(quiz);
    refresh();
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewQuestion('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setCorrectOption('');
    setExplanation('');
  };

  // If in active quiz test mode
  if (activeQuiz && !isCompleted) {
    const currentQ = activeQuiz.questions[currentIndex];
    const progressPct = Math.round(((currentIndex + 1) / activeQuiz.questions.length) * 100);

    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              {activeQuiz.title}
            </span>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Question {currentIndex + 1} of {activeQuiz.questions.length}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
            <Clock className="w-4 h-4 text-indigo-500" />
            <span>{Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>

        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
              {currentQ.question}
            </h2>
          </div>

          {currentQ.options && (
            <div className="space-y-3">
              {currentQ.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedOption(opt)}
                  className={`w-full p-4 rounded-2xl border text-left text-sm font-medium transition-all cursor-pointer flex items-center justify-between ${
                    selectedOption === opt
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span>{opt}</span>
                  <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                    selectedOption === opt ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {selectedOption === opt && '✓'}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setActiveQuiz(null)}
              className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Cancel Quiz
            </button>
            <button
              onClick={handleNextQuestion}
              disabled={!selectedOption}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <span>{currentIndex + 1 === activeQuiz.questions.length ? 'Finish Quiz' : 'Next Question'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If Quiz Completed View
  if (activeQuiz && isCompleted) {
    const total = activeQuiz.questions.length;
    const percentage = Math.round((scoreCount / total) * 100);

    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-12">
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Quiz Completed!
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {activeQuiz.title}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
            <div>
              <div className="text-xs text-slate-400">Score</div>
              <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{percentage}%</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Correct</div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{scoreCount}/{total}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Duration</div>
              <div className="text-xl font-bold text-slate-700 dark:text-slate-300 font-mono">
                {Math.floor(timerSeconds / 60)}m {timerSeconds % 60}s
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <button
              onClick={() => handleStartQuiz(activeQuiz)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Quiz</span>
            </button>
            <button
              onClick={() => setActiveQuiz(null)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              Back to Quiz Hub
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Quiz & Active Recall Engine
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create custom quizzes manually or generate from sources to test mastery.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Create Quiz</span>
        </button>
      </div>

      {quizzes.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Quizzes Created</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Design practice quizzes with multiple-choice questions or use the AI Assistant to generate one.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Quiz</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizzes.map(quiz => (
            <div
              key={quiz.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {quiz.questions.length} Questions
                  </span>
                  <span>Offline Database</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {quiz.title}
                </h3>
              </div>

              <button
                onClick={() => handleStartQuiz(quiz)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start Practice Quiz</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Attempt History */}
      {attempts.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Quiz Attempt History</span>
          </h2>

          <div className="space-y-2">
            {attempts.map(att => (
              <div
                key={att.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {att.quizTitle}
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    {new Date(att.completedAt).toLocaleString()} · Duration: {att.timeTakenSeconds}s
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                    {att.score}%
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {att.correctCount}/{att.totalQuestions} correct
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Create Quiz */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create Custom Quiz</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateQuiz} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Quiz Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Systems Practice 1"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  First Question
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. What is the CAP theorem consistency tradeoff?"
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Option A</label>
                  <input
                    type="text"
                    required
                    placeholder="Option A"
                    value={optA}
                    onChange={e => setOptA(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Option B</label>
                  <input
                    type="text"
                    required
                    placeholder="Option B"
                    value={optB}
                    onChange={e => setOptB(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Option C</label>
                  <input
                    type="text"
                    placeholder="Option C"
                    value={optC}
                    onChange={e => setOptC(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Option D</label>
                  <input
                    type="text"
                    placeholder="Option D"
                    value={optD}
                    onChange={e => setOptD(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Correct Answer (Match exact option text)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Paste the exact text of the correct option"
                  value={correctOption}
                  onChange={e => setCorrectOption(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  Save Quiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
