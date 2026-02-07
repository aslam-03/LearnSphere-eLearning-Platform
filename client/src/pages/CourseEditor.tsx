import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/use-auth";
import { useCourse, usePublishCourse, useUpdateCourse } from "@/hooks/use-courses";
import { useLessons, useCreateLesson, useUpdateLesson, useDeleteLesson } from "@/hooks/use-lessons";
import { PDFViewer } from "@/components/PDFViewer";
import { useCreateQuiz, useQuizzes, useDeleteQuiz } from "@/hooks/use-quizzes";
import { useInvitations, useSendInvitation } from "@/hooks/use-invitations";
import { Button } from "@/components/ui/button";
import { Link, Redirect, useLocation } from "wouter";
import { 
  ArrowLeft, 
  GripVertical, 
  Plus, 
  Video, 
  FileText, 
  ListChecks, 
  Image as ImageIcon,
  MoreVertical,
  Pencil,
  Trash2,
  Check,
  Loader2,
  HelpCircle,
  Eye,
  Mail,
  UserPlus,
  Share2,
  Globe,
  Lock,
  CreditCard,
  Send,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileUpload } from "@/components/FileUpload";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

// Schema for lesson
const lessonSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["video", "document", "image", "quiz"]),
  content: z.string().optional(), // For URL
  order: z.number(),
  allowDownload: z.boolean().optional(),
});

type LessonFormValues = z.infer<typeof lessonSchema>;

// Schema for course update
const courseUpdateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  visibility: z.enum(["everyone", "signed_in"]),
  accessRule: z.enum(["open", "invitation", "payment"]),
  price: z.number().optional(),
});

type CourseUpdateValues = z.infer<typeof courseUpdateSchema>;

export default function CourseEditor() {
  // Support both /instructor/course/:id and /admin/course/:id routes
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Extract courseId from URL path
  const pathParts = location.split('/');
  const courseIndex = pathParts.indexOf('course');
  const courseId = courseIndex !== -1 && pathParts[courseIndex + 1] ? pathParts[courseIndex + 1] : "";
  const isAdminRoute = location.startsWith('/admin');
  
  console.log('CourseEditor - location:', location, 'courseId:', courseId, 'isAdminRoute:', isAdminRoute);
  
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: course, isLoading: courseLoading, error: courseError } = useCourse(courseId);
  const { data: lessonsData, isLoading: lessonsLoading } = useLessons(courseId);
  const { data: quizzesData, isLoading: quizzesLoading } = useQuizzes(courseId);
  const { data: invitations, isLoading: invitationsLoading } = useInvitations(courseId);
  const publishCourse = usePublishCourse();
  const updateCourse = useUpdateCourse();
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();
  const createQuiz = useCreateQuiz();
  const deleteQuiz = useDeleteQuiz();
  const sendInvitation = useSendInvitation();
  
  // Base path for navigation (admin or instructor)
  const basePath = isAdminRoute ? '/admin' : '/instructor';
  
  const [activeTab, setActiveTab] = useState("content");
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonTab, setLessonTab] = useState("content");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmails, setInviteEmails] = useState("");
  const [invitingInProgress, setInvitingInProgress] = useState(false);

  const lessonForm = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "video",
      content: "",
      order: 0,
      allowDownload: false,
    }
  });

  // Course update form
  const courseForm = useForm<CourseUpdateValues>({
    defaultValues: {
      title: course?.title || "",
      description: course?.description || "",
      coverImage: course?.coverImage || "",
      visibility: (course?.visibility as any) || "everyone",
      accessRule: (course?.accessRule as any) || "open",
      price: course?.price || 0,
    }
  });

  // Early return if no courseId
  if (!courseId) {
    console.error('CourseEditor - No courseId found in URL');
    return <Redirect to={isAdminRoute ? "/admin" : "/instructor"} />;
  }

  if (authLoading || courseLoading || lessonsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (courseError) {
    console.error('CourseEditor - Error loading course:', courseError);
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-destructive">Error loading course: {(courseError as Error).message}</p>
        <Button onClick={() => window.location.href = isAdminRoute ? "/admin" : "/instructor"}>
          Go Back
        </Button>
      </div>
    );
  }
  
  if (!isAuthenticated) return <Redirect to="/auth" />;
  if (!course) {
    console.error('CourseEditor - Course not found for id:', courseId);
    return <Redirect to={isAdminRoute ? "/admin" : "/instructor"} />;
  }

  const lessons = lessonsData ? [...lessonsData].sort((a, b) => a.order - b.order) : [];
  const quizzes = quizzesData || [];

  const handleCreateLesson = () => {
    setEditingLessonId(null);
    setLessonTab("content");
    lessonForm.reset({
      title: "",
      description: "",
      type: "video",
      content: "",
      order: lessons.length,
      allowDownload: false,
    });
    setIsLessonDialogOpen(true);
  };

  const handleEditLesson = (lesson: any) => {
    setEditingLessonId(lesson.id);
    setLessonTab("content");
    lessonForm.reset({
      title: lesson.title,
      description: lesson.description || "",
      type: lesson.type as any,
      content: lesson.content || "",
      order: lesson.order,
      allowDownload: lesson.allowDownload || false,
    });
    setIsLessonDialogOpen(true);
  };

  const onSubmitLesson = (data: LessonFormValues) => {
    if (editingLessonId) {
      updateLesson.mutate({
        id: editingLessonId,
        courseId,
        ...data
      }, {
        onSuccess: () => setIsLessonDialogOpen(false)
      });
    } else {
      // For quiz type, create a quiz first then create the lesson
      if (data.type === "quiz") {
        createQuiz.mutate({
          courseId,
          title: data.title,
          description: data.description,
          rewards: { attempt1: 10, attempt2: 7, attempt3: 5, attempt4Plus: 3 }
        }, {
          onSuccess: (quiz: any) => {
            createLesson.mutate({
              courseId,
              ...data,
              quizId: quiz.id,
              allowDownload: false
            }, {
              onSuccess: () => {
                setIsLessonDialogOpen(false);
                // Navigate to quiz builder
                navigate(`${basePath}/course/${courseId}/quiz/${quiz.id}`);
              }
            });
          }
        });
      } else {
        createLesson.mutate({
          courseId,
          ...data,
          allowDownload: false
        }, {
          onSuccess: () => setIsLessonDialogOpen(false)
        });
      }
    }
  };

  const handleTogglePublish = () => {
    publishCourse.mutate({ id: courseId, published: !course.published });
  };

  const handleSaveCourseDetails = (data: CourseUpdateValues) => {
    updateCourse.mutate({
      id: courseId,
      ...data,
    }, {
      onSuccess: () => {
        toast({ title: "Saved", description: "Course details updated successfully" });
      }
    });
  };

  const handleCreateQuiz = () => {
    createQuiz.mutate({
      courseId,
      title: "New Quiz",
      description: "",
      rewards: { attempt1: 10, attempt2: 7, attempt3: 5, attempt4Plus: 3 }
    }, {
      onSuccess: (quiz: any) => {
        navigate(`${basePath}/course/${courseId}/quiz/${quiz.id}`);
      }
    });
  };

  const handleSendInvitations = async () => {
    const emails = inviteEmails
      .split(/[\n,;]+/)
      .map(e => e.trim())
      .filter(e => e && e.includes('@'));
    
    if (emails.length === 0) {
      toast({ title: "Error", description: "Please enter valid email addresses", variant: "destructive" });
      return;
    }

    setInvitingInProgress(true);
    let successCount = 0;
    let failCount = 0;

    for (const email of emails) {
      try {
        await sendInvitation.mutateAsync({ courseId, email });
        successCount++;
      } catch (error) {
        failCount++;
      }
    }

    setInvitingInProgress(false);
    setInviteEmails("");
    setIsInviteDialogOpen(false);
    
    if (successCount > 0) {
      toast({ 
        title: "Invitations Sent", 
        description: `Successfully sent ${successCount} invitation${successCount > 1 ? 's' : ''}${failCount > 0 ? `, ${failCount} failed` : ''}` 
      });
    }
  };

  const sortedLessons = lessons;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navigation />

      {/* Header */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={basePath}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-lg truncate max-w-md">{course.title}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant={course.published ? "default" : "secondary"} className="h-5 px-1.5 text-[10px]">
                  {course.published ? "Published" : "Draft"}
                </Badge>
                <span>{lessons.length} lessons</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 border-r">
              <span className="text-sm font-medium">{course.published ? "Published" : "Draft"}</span>
              <Switch checked={course.published} onCheckedChange={handleTogglePublish} />
            </div>
            <Link href={`/courses/${courseId}`}>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => setIsInviteDialogOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Attendees
            </Button>
            <Button variant="outline" size="sm">
              <Mail className="w-4 h-4 mr-2" />
              Contact
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Course Image Upload */}
        <div className="mb-6 flex items-start gap-6">
          <div className="w-48 h-32 rounded-lg overflow-hidden bg-muted relative group flex-shrink-0">
            {course.coverImage ? (
              <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <ImageIcon className="w-10 h-10" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <FileUpload 
                onUploadComplete={(url) => {
                  console.log("Upload complete, saving to Firestore:", url);
                  if (url) {
                    updateCourse.mutate(
                      { id: courseId, coverImage: url },
                      {
                        onSuccess: () => {
                          console.log("Cover image saved successfully");
                        },
                        onError: (error) => {
                          console.error("Failed to save cover image:", error);
                        }
                      }
                    );
                  } else {
                    console.error("No URL returned from upload");
                  }
                }}
                className="w-auto"
                label="Change Image"
              />
            </div>
          </div>
          <div className="flex-grow space-y-3">
            <div className="space-y-1">
              <Label>Course Title</Label>
              <Input 
                defaultValue={course.title}
                className="text-lg font-medium"
                onBlur={(e) => {
                  if (e.target.value !== course.title) {
                    updateCourse.mutate({ id: courseId, title: e.target.value });
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{course.visibility === 'everyone' ? 'Public' : 'Signed In Only'}</Badge>
              <Badge variant="outline">{course.accessRule === 'open' ? 'Open Access' : course.accessRule === 'invitation' ? 'Invitation Only' : 'Paid'}</Badge>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
            <TabsTrigger value="quiz">Quiz</TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Course Content</h2>
              <Button onClick={handleCreateLesson} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Content
              </Button>
            </div>

            <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
              {sortedLessons.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="font-medium text-lg">No lessons yet</h3>
                  <p className="mb-4">Start building your course by adding your first lesson.</p>
                  <Button onClick={handleCreateLesson}>Add Content</Button>
                </div>
              ) : (
                <div className="divide-y">
                  {sortedLessons.map((lesson, index) => (
                    <div key={lesson.id} className="p-4 flex items-center gap-4 hover:bg-muted/30 group">
                      <div className="cursor-grab text-muted-foreground/50 hover:text-muted-foreground">
                        <GripVertical className="w-5 h-5" />
                      </div>
                      
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        {lesson.type === 'video' && <Video className="w-5 h-5" />}
                        {lesson.type === 'document' && <FileText className="w-5 h-5" />}
                        {lesson.type === 'quiz' && <HelpCircle className="w-5 h-5" />}
                        {lesson.type === 'image' && <ImageIcon className="w-5 h-5" />}
                      </div>

                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{lesson.title}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground truncate capitalize">{lesson.type}</p>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {lesson.type === 'quiz' && lesson.quizId && (
                          <Link href={`${basePath}/course/${courseId}/quiz/${lesson.quizId}`}>
                            <Button variant="outline" size="sm" className="h-8">
                              Edit Quiz
                            </Button>
                          </Link>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditLesson(lesson)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this lesson?")) {
                              deleteLesson.mutate({ id: lesson.id, courseId });
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Description Tab */}
          <TabsContent value="description" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Description</CardTitle>
                <CardDescription>This description will be shown to learners on the course detail page.</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea 
                  className="min-h-[200px]"
                  placeholder="Enter a detailed description of your course..."
                  defaultValue={course.description}
                  onBlur={(e) => {
                    if (e.target.value !== course.description) {
                      updateCourse.mutate({ id: courseId, description: e.target.value });
                    }
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
                <CardDescription>Add tags to help learners find your course</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {(course.tags || []).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1 text-sm">
                      {tag}
                      <button
                        type="button"
                        className="ml-2 hover:text-destructive"
                        onClick={() => {
                          const newTags = course.tags.filter((_, i) => i !== index);
                          updateCourse.mutate({ id: courseId, tags: newTags });
                        }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = (e.target as HTMLFormElement).elements.namedItem('newTag') as HTMLInputElement;
                    const newTag = input.value.trim();
                    if (newTag && !course.tags?.includes(newTag)) {
                      updateCourse.mutate({ id: courseId, tags: [...(course.tags || []), newTag] });
                      input.value = '';
                    }
                  }}
                >
                  <Input name="newTag" placeholder="Add a tag..." className="flex-grow" />
                  <Button type="submit" size="sm">Add</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Short Description</CardTitle>
                <CardDescription>A brief summary displayed in course listings</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea 
                  className="min-h-[100px]"
                  placeholder="Enter a short summary of your course (1-2 sentences)..."
                  defaultValue={course.shortDescription || ''}
                  onBlur={(e) => {
                    if (e.target.value !== (course.shortDescription || '')) {
                      updateCourse.mutate({ id: courseId, shortDescription: e.target.value });
                    }
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category</CardTitle>
                <CardDescription>Select a category for your course</CardDescription>
              </CardHeader>
              <CardContent>
                <Select 
                  value={course.category || "uncategorized"}
                  onValueChange={(value) => updateCourse.mutate({ id: courseId, category: value === "uncategorized" ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uncategorized">No Category</SelectItem>
                    <SelectItem value="programming">Programming</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="data-science">Data Science</SelectItem>
                    <SelectItem value="personal-development">Personal Development</SelectItem>
                    <SelectItem value="photography">Photography</SelectItem>
                    <SelectItem value="music">Music</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Options Tab */}
          <TabsContent value="options" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Visibility</CardTitle>
                <CardDescription>Control who can see this course</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  defaultValue={course.visibility || "everyone"}
                  onValueChange={(value) => updateCourse.mutate({ id: courseId, visibility: value as any })}
                >
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                    <RadioGroupItem value="everyone" id="everyone" />
                    <div className="flex-grow">
                      <Label htmlFor="everyone" className="font-medium flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Everyone
                      </Label>
                      <p className="text-sm text-muted-foreground">Anyone can see this course</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                    <RadioGroupItem value="signed_in" id="signed_in" />
                    <div className="flex-grow">
                      <Label htmlFor="signed_in" className="font-medium flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Signed In Users
                      </Label>
                      <p className="text-sm text-muted-foreground">Only logged-in users can see this course</p>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Access Rule</CardTitle>
                <CardDescription>Control who can enroll and start learning</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup 
                  defaultValue={course.accessRule || "open"}
                  onValueChange={(value) => updateCourse.mutate({ id: courseId, accessRule: value as any })}
                >
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                    <RadioGroupItem value="open" id="open" />
                    <div className="flex-grow">
                      <Label htmlFor="open" className="font-medium">Open</Label>
                      <p className="text-sm text-muted-foreground">Anyone can start learning</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                    <RadioGroupItem value="invitation" id="invitation" />
                    <div className="flex-grow">
                      <Label htmlFor="invitation" className="font-medium">On Invitation</Label>
                      <p className="text-sm text-muted-foreground">Only invited/enrolled users can access</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                    <RadioGroupItem value="payment" id="payment" />
                    <div className="flex-grow">
                      <Label htmlFor="payment" className="font-medium flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        On Payment
                      </Label>
                      <p className="text-sm text-muted-foreground">Users must pay to access</p>
                    </div>
                  </div>
                </RadioGroup>

                {course.accessRule === 'payment' && (
                  <div className="space-y-2 pt-4 border-t">
                    <Label>Price ($)</Label>
                    <Input 
                      type="number" 
                      defaultValue={course.price || 0}
                      onBlur={(e) => updateCourse.mutate({ id: courseId, price: Number(e.target.value) })}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invitations Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Attendees &amp; Invitations</CardTitle>
                    <CardDescription>Manage course enrollments and send invitations</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setIsInviteDialogOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {invitationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : invitations && invitations.length > 0 ? (
                  <div className="space-y-2">
                    {invitations.map((invite: any) => (
                      <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Mail className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{invite.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Invited {new Date(invite.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={invite.status === 'accepted' ? 'default' : 'secondary'}>
                          {invite.status || 'pending'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserPlus className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No invitations sent yet</p>
                    <p className="text-xs mt-1">Invite learners to give them access to this course</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quiz Tab */}
          <TabsContent value="quiz" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Quizzes</h2>
              <Button onClick={handleCreateQuiz} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Quiz
              </Button>
            </div>

            <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
              {quizzes.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <h3 className="font-medium text-lg">No quizzes yet</h3>
                  <p className="mb-4">Add quizzes to test your learners' knowledge.</p>
                  <Button onClick={handleCreateQuiz}>Add Quiz</Button>
                </div>
              ) : (
                <div className="divide-y">
                  {quizzes.map((quiz) => (
                    <div key={quiz.id} className="p-4 flex items-center gap-4 hover:bg-muted/30 group">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <HelpCircle className="w-5 h-5" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="font-medium truncate">{quiz.title}</h4>
                        <p className="text-xs text-muted-foreground">{quiz.description || 'No description'}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`${basePath}/course/${courseId}/quiz/${quiz.id}`}>
                          <Button variant="outline" size="sm" className="h-8">
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this quiz?")) {
                              deleteQuiz.mutate({ id: quiz.id, courseId });
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Lesson Dialog with Tabs */}
      <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLessonId ? "Edit Lesson" : "Add New Content"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={lessonForm.handleSubmit(onSubmitLesson)} className="space-y-4">
            <Tabs value={lessonTab} onValueChange={setLessonTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="attachments">Attachments</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Lesson Title *</Label>
                  <Input {...lessonForm.register("title")} placeholder="e.g. Introduction to Variables" />
                  {lessonForm.formState.errors.title && (
                    <p className="text-xs text-destructive">{lessonForm.formState.errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Content Type</Label>
                  <Select 
                    value={lessonForm.watch("type")}
                    onValueChange={(val) => lessonForm.setValue("type", val as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          Video
                        </div>
                      </SelectItem>
                      <SelectItem value="document">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Document
                        </div>
                      </SelectItem>
                      <SelectItem value="image">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          Image
                        </div>
                      </SelectItem>
                      <SelectItem value="quiz">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="w-4 h-4" />
                          Quiz
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {lessonForm.watch("type") !== "quiz" && (
                  <>
                    <div className="space-y-2">
                      <Label>Content URL or Upload</Label>
                      <div className="flex gap-2">
                        <Input {...lessonForm.register("content")} placeholder="https://youtube.com/..." className="flex-grow" />
                      </div>
                      <FileUpload 
                        onUploadComplete={(url) => lessonForm.setValue("content", url)}
                        className="h-24"
                        label="Or upload a file"
                        accept={
                          lessonForm.watch("type") === "document" 
                            ? ".pdf,application/pdf"
                            : lessonForm.watch("type") === "image"
                            ? "image/*"
                            : "video/*"
                        }
                      />
                      
                      {/* Content Preview */}
                      {lessonForm.watch("content") && (
                        <div className="mt-4 p-4 border rounded-lg bg-muted/30">
                          <div className="text-sm font-medium mb-2">Preview:</div>
                          {lessonForm.watch("type") === "document" && (
                            lessonForm.watch("content").startsWith('data:application/pdf') || lessonForm.watch("content").endsWith('.pdf') ? (
                              <div className="max-h-[300px] overflow-hidden rounded border">
                                <PDFViewer 
                                  src={lessonForm.watch("content")}
                                  title="Preview"
                                  className="h-[300px]"
                                />
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">URL preview will appear when lesson is saved</p>
                            )
                          )}
                          {lessonForm.watch("type") === "image" && (
                            <img 
                              src={lessonForm.watch("content")} 
                              alt="Preview"
                              className="max-h-[300px] max-w-full object-contain rounded"
                            />
                          )}
                        </div>
                      )}
                    </div>
                    
                    {(lessonForm.watch("type") === "document" || lessonForm.watch("type") === "image") && (
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={lessonForm.watch("allowDownload")}
                          onCheckedChange={(checked) => lessonForm.setValue("allowDownload", checked)}
                        />
                        <Label>Allow Download</Label>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="description" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Lesson Description</Label>
                  <Textarea 
                    {...lessonForm.register("description")} 
                    placeholder="Describe what learners will learn in this lesson..."
                    className="min-h-[150px]"
                  />
                </div>
              </TabsContent>

              <TabsContent value="attachments" className="space-y-4 pt-4">
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Additional attachments can be added after creating the lesson.</p>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsLessonDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLesson.isPending || updateLesson.isPending || createQuiz.isPending}>
                {(createLesson.isPending || updateLesson.isPending || createQuiz.isPending) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editingLessonId ? "Save Changes" : "Add Content"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invite Attendees Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Invite Attendees</DialogTitle>
            <DialogDescription>
              Send course invitations via email. Enter one email per line or separate with commas.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Addresses</Label>
              <Textarea
                placeholder="john@example.com&#10;jane@example.com&#10;..."
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                className="min-h-[150px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {inviteEmails.split(/[\n,;]+/).filter(e => e.trim() && e.includes('@')).length} valid email(s) entered
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendInvitations} 
              disabled={invitingInProgress || !inviteEmails.trim()}
            >
              {invitingInProgress ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Invitations
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
