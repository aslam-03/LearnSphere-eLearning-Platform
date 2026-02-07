import { Navigation } from "@/components/Navigation";
import { useCourse } from "@/hooks/use-courses";
import { useEnroll, useMyEnrollments } from "@/hooks/use-enrollments";
import { useAuth } from "@/hooks/use-auth";
import { useReviews, useCreateReview } from "@/hooks/use-reviews";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Link, Redirect, useRoute } from "wouter";
import { useState } from "react";
import { 
  Clock, 
  Users, 
  BarChart, 
  CheckCircle2, 
  PlayCircle,
  Lock,
  FileText,
  Star,
  MessageSquare
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function StarRating({ rating, onRatingChange, interactive = false }: { 
  rating: number; 
  onRatingChange?: (rating: number) => void;
  interactive?: boolean;
}) {
  const [hover, setHover] = useState(0);
  
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-5 h-5 cursor-${interactive ? 'pointer' : 'default'} transition-colors ${
            star <= (hover || rating) 
              ? 'fill-yellow-400 text-yellow-400' 
              : 'text-gray-300'
          }`}
          onClick={() => interactive && onRatingChange?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
        />
      ))}
    </div>
  );
}

export default function CourseDetails() {
  const [, params] = useRoute("/courses/:id");
  const courseId = params?.id || "";
  
  const { user, isAuthenticated } = useAuth();
  const { data: course, isLoading } = useCourse(courseId);
  const { data: enrollments } = useMyEnrollments();
  const { data: reviews } = useReviews(courseId);
  const enroll = useEnroll();
  const createReview = useCreateReview();

  const [newReviewRating, setNewReviewRating] = useState(0);
  const [newReviewContent, setNewReviewContent] = useState("");

  if (isLoading) return null;
  if (!course) return <Redirect to="/404" />;

  const isEnrolled = enrollments?.some(e => e.courseId === courseId);
  const isInstructor = user?.id === course.instructorId;
  const userHasReviewed = reviews?.some(r => r.userId === user?.id);
  
  // Calculate average rating
  const avgRating = reviews?.length 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
    : 0;
  
  // Check course visibility and access
  const isPublished = course.isPublished !== false;
  const hasAccess = isEnrolled || isInstructor || user?.role === 'admin' || 
    (course.accessRules?.allowGuests);

  const handleEnroll = () => {
    if (!isAuthenticated) {
      window.location.href = '/auth';
      return;
    }
    enroll.mutate(courseId);
  };

  const handleSubmitReview = () => {
    if (newReviewRating > 0 && newReviewContent.trim()) {
      createReview.mutate({
        courseId,
        rating: newReviewRating,
        content: newReviewContent.trim(),
        userId: user?.id || '',
      });
      setNewReviewRating(0);
      setNewReviewContent("");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navigation />

      {/* Hero Header */}
      <div className="bg-[#0F2854] text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <Badge className="bg-highlight text-primary hover:bg-highlight/90">
                  {course.tags?.[0] || "Development"}
                </Badge>
                <span className="text-blue-200 text-sm">Last updated {new Date(course.createdAt).toLocaleDateString()}</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight">
                {course.title}
              </h1>
              
              <p className="text-xl text-blue-100 leading-relaxed max-w-2xl">
                {course.description}
              </p>

              <div className="flex items-center gap-6 pt-4 text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border-2 border-white/20">
                    <AvatarImage src={course.instructor?.profileImageUrl || undefined} />
                    <AvatarFallback>{course.instructor?.username?.slice(0, 2).toUpperCase() || 'IN'}</AvatarFallback>
                  </Avatar>
                  <span>By {course.instructor?.username || 'Instructor'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart className="w-4 h-4" />
                  <span>{course.difficulty || 'Intermediate'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{course.enrollmentCount || 0} Enrolled</span>
                </div>
                {avgRating > 0 && (
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{avgRating.toFixed(1)} ({reviews?.length} reviews)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-10 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8 py-10">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="content">Course Content</TabsTrigger>
              <TabsTrigger value="reviews" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Reviews ({reviews?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-6">What you'll learn</h2>
                <div className="bg-white border rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(course.learningObjectives || ['Master the core concepts', 'Build real-world projects', 'Understand best practices', 'Gain certificate of completion']).map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-6">Course Content</h2>
                <div className="bg-white border rounded-2xl overflow-hidden">
                  <div className="bg-muted/30 p-4 border-b flex justify-between items-center text-sm">
                    <span>{course.lessons.length} Lessons</span>
                    <span>Total duration: {course.duration || '4h 30m'}</span>
                  </div>
                  <div className="divide-y">
                    {course.lessons.sort((a,b) => a.order - b.order).map((lesson, idx) => (
                      <div key={lesson.id} className="p-4 flex items-center gap-4 hover:bg-muted/10 transition-colors">
                        <div className="text-muted-foreground font-mono text-sm w-6">
                          {idx + 1}
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 font-medium">
                            {lesson.type === 'video' ? <PlayCircle className="w-4 h-4 text-primary" /> : <FileText className="w-4 h-4 text-primary" />}
                            {lesson.title}
                          </div>
                        </div>
                        {isEnrolled || isInstructor ? (
                          <span className="text-xs text-muted-foreground">{lesson.duration || '10:00'}</span>
                        ) : (
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {course.prerequisites && course.prerequisites.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold mb-6">Prerequisites</h2>
                  <div className="bg-white border rounded-2xl p-6">
                    <ul className="space-y-2">
                      {course.prerequisites.map((prereq, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-blue-500" />
                          {prereq}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="space-y-6">
              {/* Write Review Form - Only for enrolled users who haven't reviewed */}
              {isEnrolled && !userHasReviewed && (
                <Card>
                  <CardHeader>
                    <CardTitle>Write a Review</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Your Rating</p>
                      <StarRating 
                        rating={newReviewRating} 
                        onRatingChange={setNewReviewRating} 
                        interactive 
                      />
                    </div>
                    <Textarea
                      placeholder="Share your experience with this course..."
                      value={newReviewContent}
                      onChange={(e) => setNewReviewContent(e.target.value)}
                      rows={4}
                    />
                    <Button 
                      onClick={handleSubmitReview}
                      disabled={!newReviewRating || !newReviewContent.trim() || createReview.isPending}
                    >
                      {createReview.isPending ? "Submitting..." : "Submit Review"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Rating Summary */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-4xl font-bold">{avgRating.toFixed(1)}</p>
                      <StarRating rating={Math.round(avgRating)} />
                      <p className="text-sm text-muted-foreground mt-1">{reviews?.length || 0} reviews</p>
                    </div>
                    <div className="flex-1 space-y-2">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviews?.filter(r => r.rating === star).length || 0;
                        const percentage = reviews?.length ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-sm">
                            <span className="w-3">{star}</span>
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-yellow-400 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="w-8 text-muted-foreground">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reviews List */}
              {reviews?.length ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarFallback>
                              {(review.user?.username || 'U').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium">{review.user?.username || 'Anonymous'}</p>
                                <StarRating rating={review.rating} />
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground">{review.content}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No reviews yet. Be the first to review this course!</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Card */}
        <div className="relative">
          <div className="lg:absolute top-[-150px] w-full">
            <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
              <div className="aspect-video relative">
                <img 
                  src={course.coverImage || "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&q=80"} 
                  className="w-full h-full object-cover" 
                  alt={course.title}
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                    <PlayCircle className="w-10 h-10 text-white fill-white" />
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-primary">
                    {course.price ? `$${(course.price / 100).toFixed(2)}` : "Free"}
                  </span>
                  {course.price && <span className="text-muted-foreground line-through mb-1">$99.99</span>}
                </div>

                {isEnrolled ? (
                  <Link href={`/learn/${courseId}`}>
                    <Button className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/20">
                      Continue Learning
                    </Button>
                  </Link>
                ) : isInstructor ? (
                  <Link href={`/instructor/course/${courseId}`}>
                    <Button className="w-full h-12 text-lg font-semibold" variant="outline">
                      Edit Course
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    onClick={handleEnroll} 
                    disabled={enroll.isPending}
                    className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/20"
                  >
                    {enroll.isPending ? "Enrolling..." : "Enroll Now"}
                  </Button>
                )}

                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> Duration</span>
                    <span>4.5 hours</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Lessons</span>
                    <span>{course.lessons.length}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> Access</span>
                    <span>Lifetime</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
