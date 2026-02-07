import { useCourse } from "@/hooks/use-courses";
import { useCourseProgress, useUpdateProgress } from "@/hooks/use-progress";
import { useLessons } from "@/hooks/use-lessons";
import { useQuiz, useQuizAttempts, useSubmitQuizAttempt } from "@/hooks/use-quizzes";
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
  Menu, 
  CheckCircle, 
  ChevronRight,
  ChevronLeft,
  FileText,
  PlayCircle,
  Image as ImageIcon,
  HelpCircle,
  Star,
  Award,
  Loader2,
  X
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
  onComplete 
}: { 
  quizId: string;
  onComplete: (score: number, points: number) => void;
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
        selectedOptions: selected.map(Number)
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
          <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
            passed ? "bg-green-100" : "bg-amber-100"
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
          <Button onClick={() => {
            setCurrentQuestion(0);
            setAnswers({});
            setShowResults(false);
            setResults(null);
          }}>
            Try Again
          </Button>
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
                    <p className="font-medium">{review.userName || "Anonymous"}</p>
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
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: lessons, isLoading: lessonsLoading } = useLessons(courseId);
  const { data: progressResponse, isLoading: progressLoading } = useCourseProgress(courseId);
  const updateProgress = useUpdateProgress();
  
  // Extract progress array from API response
  const progressData = progressResponse?.progress || [];
  const percentageFromApi = progressResponse?.percentage || 0;

  const [activeLessonId, setActiveLessonId] = useState<string | null>(initialLessonId || null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("content");
  const [showPointsPopup, setShowPointsPopup] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

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

  if (authLoading || courseLoading || lessonsLoading || progressLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) return <Redirect to="/auth" />;
  if (!course) return <Redirect to="/404" />;

  const sortedLessons = lessons ? [...lessons].sort((a, b) => a.order - b.order) : [];
  const activeLesson = sortedLessons.find(l => l.id === activeLessonId);
  
  const activeIndex = sortedLessons.findIndex(l => l.id === activeLessonId);
  const nextLesson = sortedLessons[activeIndex + 1];
  const prevLesson = sortedLessons[activeIndex - 1];

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
          // Show points popup
          setEarnedPoints(10);
          setShowPointsPopup(true);
          setTimeout(() => setShowPointsPopup(false), 3000);
          
          // Auto advance
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

  const percentComplete = progressData && sortedLessons.length
    ? Math.round((progressData.filter(p => p.completed).length / sortedLessons.length) * 100)
    : percentageFromApi;

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
          <h1 className="font-bold text-lg truncate max-w-md">{course.title}</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-4 w-32">
            <div className="flex justify-between w-full text-xs mb-1">
              <span>{percentComplete}% Complete</span>
            </div>
            <Progress value={percentComplete} className="h-2" />
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="flex-grow flex overflow-hidden">
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
                        quizId={activeLesson.quizId || activeLesson.id} 
                        onComplete={handleQuizComplete}
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
                            >
                              {updateProgress.isPending && (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              )}
                              Mark as Complete
                            </Button>
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
          </Tabs>
        </main>

        {/* Sidebar Lesson List */}
        <aside 
          className={cn(
            "w-80 bg-white border-l flex-shrink-0 transition-all duration-300 absolute md:relative h-full z-10",
            sidebarOpen ? "right-0" : "-right-80 md:w-0 md:border-l-0 md:overflow-hidden"
          )}
        >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b bg-muted/10 flex items-center justify-between">
              <span className="font-medium">Course Content</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <ScrollArea className="flex-grow">
              <div className="divide-y">
                {sortedLessons.map((lesson, idx) => {
                  const isActive = lesson.id === activeLessonId;
                  const completed = isCompleted(lesson.id);
                  
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => {
                        setActiveLessonId(lesson.id);
                        setActiveTab("content");
                        if (window.innerWidth < 768) setSidebarOpen(false);
                      }}
                      className={cn(
                        "w-full text-left p-4 flex gap-3 transition-colors hover:bg-muted/50",
                        isActive && "bg-primary/5 border-l-4 border-primary pl-3"
                      )}
                    >
                      <div className="pt-0.5">
                        {completed ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                            isActive ? "border-primary" : "border-muted-foreground/40"
                          )}>
                            {getLessonIcon(lesson.type)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          completed && "text-muted-foreground"
                        )}>
                          {idx + 1}. {lesson.title}
                        </p>
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
            {percentComplete === 100 && (
              <div className="p-4 border-t bg-green-50">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Course Completed!</span>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Sidebar Toggle for Desktop */}
        <Button
          variant="secondary"
          size="sm"
          className={cn(
            "absolute right-4 top-20 z-10 shadow-md hidden md:flex", 
            sidebarOpen && "right-84"
          )}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {sidebarOpen ? "" : "Content"}
        </Button>
      </div>
    </div>
  );
}
