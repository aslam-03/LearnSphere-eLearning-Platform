import { useCourse } from "@/hooks/use-courses";
import { useCourseProgress, useUpdateProgress } from "@/hooks/use-progress";
import { useLessons } from "@/hooks/use-lessons";
import { useQuiz, useQuizzes, useQuizAttempts, useSubmitQuizAttempt } from "@/hooks/use-quizzes";
import { useReviews, useCreateReview } from "@/hooks/use-reviews";
import { useAuth } from "@/hooks/use-auth";
import { PDFViewer } from "@/components/PDFViewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link, Redirect, useRoute } from "wouter";
import {
  ArrowLeft,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  FileText,
  PlayCircle,
  Image as ImageIcon,
  HelpCircle,
  Star,
  Award,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Quiz Player Component
function QuizPlayer({
  quizId,
  onComplete,
  onMarkComplete,
  isQuizCompleted
}: {
  quizId: string;
  onComplete: (score: number, points: number) => void;
  onMarkComplete: () => void;
  isQuizCompleted: boolean;
}) {
  const { data: quiz, isLoading } = useQuiz(quizId);
  const { data: attempts } = useQuizAttempts(quizId);
  const submitAttempt = useSubmitQuizAttempt();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<{ score: number; pointsEarned: number; } | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quiz || !quiz.questions?.length) {
    return (
      <div className="text-center py-12">
        <HelpCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <p>No questions available for this quiz</p>
      </div>
    );
  }

  const questions = quiz.questions;
  const question = questions[currentQuestion];
  const attemptNumber = (attempts?.length || 0) + 1;

  const handleSelectAnswer = (questionId: string, optionIndex: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: [optionIndex]
    }));
  };

  const handleSubmit = () => {
    submitAttempt.mutate({
      quizId,
      answers: Object.entries(answers).map(([questionId, selected]) => ({
        questionId,
        selectedOption: Math.max(...selected.map(Number)) // Take the last selected option as number
      }))
    }, {
      onSuccess: (data: any) => {
        setResults({
          score: data.score,
          pointsEarned: data.pointsEarned
        });
        setShowResults(true);
        onComplete(data.score, data.pointsEarned);
      }
    });
  };

  if (showResults && results) {
    const percentage = Math.round((results.score / questions.length) * 100);
    const passed = percentage >= 70;

    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="pt-8 text-center">
          <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${passed ? "bg-green-100" : "bg-amber-100"
            }`}>
            {passed ? (
              <CheckCircle className="w-10 h-10 text-green-600" />
            ) : (
              <HelpCircle className="w-10 h-10 text-amber-600" />
            )}
          </div>
          <h3 className="text-2xl font-bold mb-2">
            {passed ? "Great Job!" : "Keep Practicing!"}
          </h3>
          <p className="text-muted-foreground mb-4">
            You scored {results.score} out of {questions.length} ({percentage}%)
          </p>
          <div className="bg-primary/10 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              <span className="font-bold text-lg">+{results.pointsEarned} points</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Attempt #{attemptNumber}
            </p>
          </div>
          <div className="space-y-3">
            {!isQuizCompleted && (
              <Button
                onClick={onMarkComplete}
                size="lg"
                className="w-full"
                variant="default"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Complete
              </Button>
            )}
            {isQuizCompleted && (
              <Badge variant="secondary" className="w-full justify-center h-10 text-sm bg-green-100 text-green-700 hover:bg-green-100">
                <CheckCircle className="w-3 h-3 mr-2" />
                Completed
              </Badge>
            )}
            <Button
              onClick={() => {
                setCurrentQuestion(0);
                setAnswers({});
                setShowResults(false);
                setResults(null);
              }}
              variant="outline"
              size="lg"
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Question {currentQuestion + 1} of {questions.length}</CardTitle>
          <Badge variant="secondary">{question.points} pts</Badge>
        </div>
        <Progress value={((currentQuestion + 1) / questions.length) * 100} className="mt-2" />
      </CardHeader>
      <CardContent>
        <p className="text-lg font-medium mb-6">{question.text}</p>

        <RadioGroup
          value={answers[question.id]?.[0] || ""}
          onValueChange={(value) => handleSelectAnswer(question.id, value)}
        >
          {question.options?.map((option, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors",
                answers[question.id]?.[0] === String(idx)
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/50"
              )}
              onClick={() => handleSelectAnswer(question.id, String(idx))}
            >
              <RadioGroupItem value={String(idx)} id={`option-${idx}`} />
              <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                {option.text}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(prev => prev - 1)}
            disabled={currentQuestion === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentQuestion < questions.length - 1 ? (
            <Button
              onClick={() => setCurrentQuestion(prev => prev + 1)}
              disabled={!answers[question.id]}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={Object.keys(answers).length < questions.length || submitAttempt.isPending}
            >
              {submitAttempt.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Quiz
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Reviews Tab Component
function ReviewsTab({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const { data: reviewsResponse, isLoading } = useReviews(courseId);
  const createReview = useCreateReview();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);

  // Destructure reviews array from API response
  const reviewsList = reviewsResponse?.reviews || [];
  const apiAverageRating = reviewsResponse?.averageRating || 0;

  const hasReviewed = reviewsList?.some(r => r.userId === user?.id);

  const handleSubmitReview = () => {
    createReview.mutate({
      courseId,
      rating,
      comment
    }, {
      onSuccess: () => {
        setComment("");
        setRating(5);
      }
    });
  };

  const averageRating = apiAverageRating.toFixed(1);

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="text-center">
          <p className="text-4xl font-bold">{averageRating}</p>
          <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                className={cn(
                  "w-4 h-4",
                  star <= Math.round(Number(averageRating))
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                )}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {reviewsList?.length || 0} reviews
          </p>
        </div>
      </div>

      {/* Add Review Form */}
      {!hasReviewed && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Write a Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Your Rating</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                  >
                    <Star
                      className={cn(
                        "w-8 h-8 transition-colors",
                        star <= (hoveredStar || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground hover:text-yellow-300"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Comment (optional)</Label>
              <Textarea
                placeholder="Share your experience with this course..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mt-2"
              />
            </div>
            <Button onClick={handleSubmitReview} disabled={createReview.isPending}>
              {createReview.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Review
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : reviewsList?.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            No reviews yet. Be the first to review!
          </p>
        ) : (
          reviewsList?.map(review => (
            <Card key={review.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{review.user?.displayName || "Anonymous"}</p>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={cn(
                            "w-4 h-4",
                            star <= review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {review.comment && (
                  <p className="mt-3 text-muted-foreground">{review.comment}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default function Learn() {
  const [, params] = useRoute("/learn/:courseId");
  const [, lessonParams] = useRoute("/learn/:courseId/lesson/:lessonId");
  const courseId = params?.courseId || lessonParams?.courseId || "";
  const initialLessonId = lessonParams?.lessonId;

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: course, isLoading: courseLoading, error: courseError } = useCourse(courseId);
  const { data: lessons, isLoading: lessonsLoading } = useLessons(courseId);
  const { data: quizzesData, isLoading: quizzesLoading } = useQuizzes(courseId);
  const { data: progressResponse, isLoading: progressLoading } = useCourseProgress(courseId);
  const updateProgress = useUpdateProgress();

  // Extract progress array from API response
  const progressData = progressResponse?.progress || [];
  const percentageFromApi = progressResponse?.percentage || 0;

  const [activeLessonId, setActiveLessonId] = useState<string | null>(initialLessonId || null);
  const [activeTab, setActiveTab] = useState("content");
  const [showPointsPopup, setShowPointsPopup] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [courseCompleted, setCourseCompleted] = useState(false);

  // Set initial active lesson
  useEffect(() => {
    if (lessons && lessons.length > 0 && !activeLessonId) {
      const sortedLessons = [...lessons].sort((a, b) => a.order - b.order);
      const firstUncompleted = sortedLessons.find(l =>
        !progressData?.some(p => p.lessonId === l.id && p.completed)
      );
      setActiveLessonId(firstUncompleted?.id || sortedLessons[0].id);
    }
  }, [lessons, progressData, activeLessonId]);

  if (authLoading || courseLoading || lessonsLoading || progressLoading || quizzesLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return <Redirect to="/auth" />;

  if (courseError || (!course && !courseLoading)) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <HelpCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Course Content</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          {courseError ? (courseError as Error).message : "The course content could not be found or you don't have access."}
        </p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
          <Link href="/dashboard">
            <Button>Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const sortedLessons = lessons ? [...lessons].sort((a, b) => a.order - b.order) : [];

  // Add quizzes at the end of lessons
  let allLessonsWithQuiz = [...sortedLessons];
  if (quizzesData && quizzesData.length > 0) {
    const quizLessons = quizzesData.map((quiz, idx) => ({
      id: `quiz-${quiz.id}`,
      courseId: courseId,
      title: quiz.title,
      type: 'quiz' as const,
      quizId: quiz.id,
      order: sortedLessons.length + idx + 1,
      description: quiz.description,
      content: '',
      allowDownload: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    allLessonsWithQuiz = [...sortedLessons, ...quizLessons];
  }

  const activeLesson = allLessonsWithQuiz.find(l => l.id === activeLessonId);

  const activeIndex = allLessonsWithQuiz.findIndex(l => l.id === activeLessonId);
  const nextLesson = allLessonsWithQuiz[activeIndex + 1];
  const prevLesson = allLessonsWithQuiz[activeIndex - 1];

  const isCompleted = (lessonId: string) =>
    progressData?.some(p => p.lessonId === lessonId && p.completed);

  const handleComplete = () => {
    if (activeLessonId) {
      updateProgress.mutate({
        lessonId: activeLessonId,
        completed: true,
        courseId
      }, {
        onSuccess: () => {
          // No points for completing regular content
          // Auto advance to next lesson
          if (nextLesson) {
            setActiveLessonId(nextLesson.id);
          }
        }
      });
    }
  };

  const handleQuizComplete = (score: number, points: number) => {
    setEarnedPoints(points);
    setShowPointsPopup(true);
    setTimeout(() => setShowPointsPopup(false), 3000);

    if (activeLessonId) {
      updateProgress.mutate({
        lessonId: activeLessonId,
        completed: true,
        courseId
      });
    }
  };

  const handleQuizMarkComplete = () => {
    // Check if quiz is the last item and all previous items are completed
    const isLastLesson = activeIndex === allLessonsWithQuiz.length - 1;
    const allPreviousCompleted = completedNonQuizLessons === nonQuizLessons;

    // Check if this is a quiz and if it's marked complete
    const quizzesInCourse = allLessonsWithQuiz.filter(l => l.type === 'quiz');
    const allQuizzesCompleted = quizzesInCourse.every(q => isCompleted(q.id));

    if (isLastLesson && allPreviousCompleted && allQuizzesCompleted) {
      // Course is complete!
      handleCourseComplete();
    } else if (isLastLesson && allPreviousCompleted) {
      // All lessons done, waiting for quiz completion
      setShowPointsPopup(true);
      setEarnedPoints(10);
      setTimeout(() => setShowPointsPopup(false), 3000);
    }
  };

  const handleCourseComplete = () => {
    // Award course completion bonus points
    const courseCompletionBonus = 25;
    setEarnedPoints(courseCompletionBonus);
    setShowPointsPopup(true);
    setTimeout(() => setShowPointsPopup(false), 3000);
    setCourseCompleted(true);
  };

  // Calculate completion percentage including both lessons and quiz
  const nonQuizLessons = sortedLessons.length;
  const completedNonQuizLessons = progressData?.filter(p =>
    !p.lessonId.startsWith('quiz-') && p.completed
  ).length || 0;

  // Count quizzes that are completed
  const quizzesInCourse = allLessonsWithQuiz.filter(l => l.type === 'quiz');
  const completedQuizzes = quizzesInCourse.filter(q => isCompleted(q.id)).length;

  // Total items considering lessons and at least one quiz (if exists)
  const totalItems = nonQuizLessons + (quizzesInCourse.length > 0 ? 1 : 0); // Count all quizzes as one item
  const completedItems = completedNonQuizLessons + (completedQuizzes > 0 ? 1 : 0);

  const percentComplete = totalItems > 0
    ? Math.round((completedItems / totalItems) * 100)
    : 0;

  // Calculate if course is fully completed (all lessons + quiz)
  const allNonQuizCompleted = completedNonQuizLessons === nonQuizLessons && nonQuizLessons > 0;
  const quizCompleted = quizzesData && quizzesData.length > 0
    ? allLessonsWithQuiz.filter(l => l.type === 'quiz').some(q => isCompleted(q.id))
    : true; // If no quiz, course can be completed without it
  const isCourseFullyCompleted = allNonQuizCompleted && quizCompleted;

  const getLessonIcon = (type: string) => {
    switch (type) {
      case "video": return <PlayCircle className="w-4 h-4" />;
      case "document": return <FileText className="w-4 h-4" />;
      case "image": return <ImageIcon className="w-4 h-4" />;
      case "quiz": return <HelpCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Points Popup */}
      {showPointsPopup && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-gradient-to-r from-primary to-primary/80 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
            <Award className="w-5 h-5" />
            <span className="font-bold">+{earnedPoints} Points Earned!</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="h-16 border-b bg-white flex items-center px-4 justify-between flex-shrink-0 z-20 relative">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="h-6 w-px bg-border mx-2" />
          <h1 className="font-bold text-lg truncate max-w-md">{course?.title}</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-4 w-32">
            <div className="flex justify-between w-full text-xs mb-1">
              <span>{percentComplete}% Complete</span>
            </div>
            <Progress value={percentComplete} className="h-2" />
          </div>
        </div>
      </header>

      <div className="flex-grow flex overflow-hidden">
        {/* Sidebar Lesson List - LEFT SIDE */}
        <aside className="w-80 bg-white border-r flex-shrink-0 h-full">

          <div className="h-full flex flex-col">
            <div className="p-4 border-b bg-muted/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Course Content</span>
              </div>
              {/* Progress Bar in Sidebar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-primary">{percentComplete}%</span>
                </div>
                <Progress value={percentComplete} className="h-2" />
              </div>
            </div>
            <ScrollArea className="flex-grow">
              <div className="divide-y">
                {allLessonsWithQuiz.map((lesson, idx) => {
                  const isActive = lesson.id === activeLessonId;
                  const completed = isCompleted(lesson.id);

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => {
                        setActiveLessonId(lesson.id);
                        setActiveTab("content");
                      }}
                      className={cn(
                        "w-full text-left p-4 flex gap-3 transition-all hover:bg-muted/50",
                        isActive && "bg-primary/5 border-l-4 border-primary pl-3",
                        completed && "opacity-75"
                      )}
                    >
                      <div className="pt-0.5 flex-shrink-0">
                        {completed ? (
                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                        ) : (
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                            isActive ? "border-primary bg-primary/10" : "border-muted-foreground/40"
                          )}>
                            {getLessonIcon(lesson.type)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            "text-sm font-medium truncate flex-1",
                            completed && "text-muted-foreground line-through"
                          )}>
                            {idx + 1}. {lesson.title}
                          </p>
                          {completed && (
                            <Badge
                              variant="secondary"
                              className="flex-shrink-0 bg-green-100 text-green-700 hover:bg-green-100 text-xs"
                            >
                              Done
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground capitalize">
                            {lesson.type}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Course Completion Status */}
            <div className="p-4 border-t bg-muted/5 space-y-3">
              <div className="text-xs font-medium text-muted-foreground">
                <div className="flex justify-between mb-2">
                  <span>{completedItems} of {totalItems} completed</span>
                </div>
              </div>
              {percentComplete === 100 ? (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="font-semibold text-sm">Course Complete! 🎉</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">Great job! You've finished all content.</p>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  <span>{totalItems - completedItems} item{totalItems - completedItems !== 1 ? 's' : ''} remaining</span>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-grow overflow-y-auto bg-muted/20 relative">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="bg-white border-b px-6 pt-4">
              <TabsList>
                <TabsTrigger value="content">Lesson</TabsTrigger>
                <TabsTrigger value="reviews">
                  <Star className="w-4 h-4 mr-2" />
                  Reviews
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="content" className="flex-1 m-0 overflow-y-auto">
              <div className="max-w-4xl mx-auto p-6 md:p-12 min-h-full flex flex-col">
                {activeLesson ? (
                  <>
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold mb-2">{activeLesson.title}</h2>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getLessonIcon(activeLesson.type)}
                          {activeLesson.type}
                        </Badge>
                        {isCompleted(activeLesson.id) && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Content Viewer based on type */}
                    {activeLesson.type === 'quiz' ? (
                      <QuizPlayer
                        quizId={(activeLesson as any).quizId || activeLesson.id}
                        onComplete={handleQuizComplete}
                        onMarkComplete={handleQuizMarkComplete}
                        isQuizCompleted={isCompleted(activeLesson.id)}
                      />
                    ) : activeLesson.type === 'video' ? (
                      <div className="bg-black rounded-2xl shadow-sm border mb-8 aspect-video overflow-hidden">
                        {activeLesson.content ? (
                          activeLesson.content.includes("youtube") || activeLesson.content.includes("youtu.be") ? (
                            <iframe
                              src={activeLesson.content
                                .replace("watch?v=", "embed/")
                                .replace("youtu.be/", "youtube.com/embed/")}
                              className="w-full h-full"
                              allowFullScreen
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            />
                          ) : activeLesson.content.includes("vimeo") ? (
                            <iframe
                              src={activeLesson.content.replace("vimeo.com/", "player.vimeo.com/video/")}
                              className="w-full h-full"
                              allowFullScreen
                            />
                          ) : (
                            <video
                              src={activeLesson.content}
                              controls
                              className="w-full h-full"
                            />
                          )
                        ) : (
                          <div className="h-full flex items-center justify-center text-white">
                            <div className="text-center">
                              <PlayCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                              <p>No video content available</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : activeLesson.type === 'image' ? (
                      <div className="bg-white rounded-2xl shadow-sm border mb-8 p-4 overflow-hidden">
                        {activeLesson.content ? (
                          <img
                            src={activeLesson.content}
                            alt={activeLesson.title}
                            className="w-full max-h-[70vh] object-contain mx-auto rounded-lg"
                          />
                        ) : (
                          <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
                            <div className="text-center text-muted-foreground">
                              <ImageIcon className="w-16 h-16 mx-auto mb-4" />
                              <p>No image available</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl shadow-sm border mb-8">
                        {activeLesson.content ? (
                          activeLesson.content.startsWith('data:application/pdf') || activeLesson.content.endsWith('.pdf') ? (
                            <PDFViewer
                              src={activeLesson.content}
                              title={activeLesson.title}
                              className="rounded-lg"
                            />
                          ) : (
                            <div className="prose max-w-none p-8">
                              <div dangerouslySetInnerHTML={{ __html: activeLesson.content }} />
                            </div>
                          )
                        ) : (
                          <div className="text-center py-12 text-muted-foreground">
                            <FileText className="w-16 h-16 mx-auto mb-4" />
                            <p>No document content available</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Description */}
                    {activeLesson.description && (
                      <div className="prose max-w-none mb-8">
                        <h3 className="text-lg font-semibold mb-2">Description</h3>
                        <p className="text-muted-foreground">{activeLesson.description}</p>
                      </div>
                    )}

                    {/* Attachments */}
                    {activeLesson.attachments && activeLesson.attachments.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-3">Attachments</h3>
                        <div className="grid gap-2">
                          {activeLesson.attachments.map((attachment, idx) => (
                            <a
                              key={idx}
                              href={attachment.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                            >
                              <FileText className="w-5 h-5 text-muted-foreground" />
                              <span className="font-medium">{attachment.name}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Navigation (not for quizzes) */}
                    {activeLesson.type !== 'quiz' && (
                      <div className="mt-auto pt-8 border-t flex justify-between items-center">
                        <Button
                          variant="outline"
                          onClick={() => prevLesson && setActiveLessonId(prevLesson.id)}
                          disabled={!prevLesson}
                        >
                          <ChevronLeft className="w-4 h-4 mr-2" />
                          Previous
                        </Button>

                        <div className="flex gap-2">
                          {!isCompleted(activeLesson.id) && (
                            <Button
                              onClick={handleComplete}
                              disabled={updateProgress.isPending}
                              variant="default"
                            >
                              {updateProgress.isPending && (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              )}
                              Mark as Complete
                            </Button>
                          )}
                          {isCompleted(activeLesson.id) && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 h-fit">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                          {nextLesson && (
                            <Button
                              variant={isCompleted(activeLesson.id) ? "default" : "outline"}
                              onClick={() => setActiveLessonId(nextLesson.id)}
                            >
                              Next
                              <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Select a lesson to start</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="flex-1 m-0 overflow-y-auto">
              <div className="max-w-2xl mx-auto p-6 md:p-12">
                <ReviewsTab courseId={courseId} />
              </div>
            </TabsContent>

            {/* Course Completion Dialog */}
            {isCourseFullyCompleted && !courseCompleted && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className="max-w-md w-full animate-in fade-in zoom-in-95 duration-300">
                  <CardContent className="pt-12 pb-8 text-center">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center bg-gradient-to-br from-green-100 to-green-200">
                      <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Course Completed!</h2>
                    <p className="text-muted-foreground mb-6">
                      Congratulations! You've successfully completed the entire course.
                    </p>
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 mb-8">
                      <div className="flex items-center justify-center gap-2">
                        <Award className="w-6 h-6 text-primary" />
                        <span className="font-bold text-2xl text-primary">+25 Points</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Course Completion Bonus</p>
                    </div>
                    <Button
                      onClick={handleCourseComplete}
                      size="lg"
                      className="w-full"
                    >
                      Claim Reward & Continue
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </Tabs>
        </main>
      </div>
    </div>
  );
}
