import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { FileUpload } from "@/components/FileUpload";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link, Redirect } from "wouter";
import { useDebounce } from "@/hooks/use-debounce";
import { coursesApi } from "@/lib/api";
import { Course } from "@shared/types";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash,
  Eye,
  Users,
  Share2,
  BookOpen,
  Loader2,
  Globe,
  Lock,
  CreditCard,
  CheckCircle,
  XCircle,
  TrendingUp,
  Settings,
  List,
  LayoutGrid,
  Clock,
  PlayCircle,
  Download,
  FileText,
  Trash2,
  GraduationCap
} from "lucide-react";

// ============ TYPES ============
type ViewMode = 'list' | 'kanban';
type ReportingFilter = 'all' | 'not-started' | 'in-progress' | 'completed';

// ============ INSTRUCTOR DASHBOARD COMPONENT ============
export default function InstructorHub() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // State
  const [activeTab, setActiveTab] = useState("courses");
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [courseSearch, setCourseSearch] = useState("");
  const [reportingSearch, setReportingSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reportingFilter, setReportingFilter] = useState<ReportingFilter>("all");
  const [deleteCourseId, setDeleteCourseId] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [createCourseStep, setCreateCourseStep] = useState(1);
  const [newCourseData, setNewCourseData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    category: '',
    visibility: 'everyone' as 'everyone' | 'signed_in',
    accessRule: 'open' as 'open' | 'invitation' | 'payment',
    price: 0,
    coverImage: '',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');

  const debouncedCourseSearch = useDebounce(courseSearch, 300);
  const debouncedReportingSearch = useDebounce(reportingSearch, 300);

  // ============ QUERIES ============
  // Fetch only THIS instructor's courses
  const { data: myCourses, isLoading: coursesLoading } = useQuery({
    queryKey: ['instructor', 'courses', user?.id],
    queryFn: () => coursesApi.list({ instructorId: user?.id }),
    enabled: !!user?.id,
  });

  // Fetch enrollments for instructor's own courses (for reporting)
  const { data: allEnrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['instructor', 'enrollments', user?.id],
    queryFn: async () => {
      const enrollments: any[] = [];
      if (myCourses) {
        for (const course of myCourses) {
          try {
            const courseEnrollments = await coursesApi.getEnrollments(course.id);
            enrollments.push(...courseEnrollments.map((e: any) => ({ ...e, course })));
          } catch (e) { }
        }
      }
      return enrollments;
    },
    enabled: !!myCourses && myCourses.length > 0,
  });

  // ============ MUTATIONS ============
  const deleteCourseMutation = useMutation({
    mutationFn: (courseId: string) => coursesApi.delete(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({ title: "Success", description: "Course deleted successfully" });
      setDeleteCourseId(null);
      setSelectedCourse(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const publishCourseMutation = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      coursesApi.publish(id, published),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({ title: "Success", description: "Course status updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Course>) =>
      coursesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({ title: "Success", description: "Course updated successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: (data: typeof newCourseData) => coursesApi.create({
      title: data.title,
      description: data.description,
      shortDescription: data.shortDescription,
      category: data.category || undefined,
      visibility: data.visibility,
      published: false,
      accessRule: data.accessRule,
      price: data.accessRule === 'payment' ? data.price : undefined,
      instructorId: user?.id,
      coverImage: data.coverImage || undefined,
      tags: data.tags,
    }),
    onSuccess: (course: any) => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsCreateCourseOpen(false);
      resetCreateCourseForm();
      toast({ title: "Course Created", description: "Redirecting to editor..." });
      navigate(`/instructor/course/${course.id}`);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const resetCreateCourseForm = () => {
    setCreateCourseStep(1);
    setNewCourseData({
      title: '', description: '', shortDescription: '', category: '',
      visibility: 'everyone', accessRule: 'open', price: 0, coverImage: '', tags: [],
    });
    setTagInput('');
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !newCourseData.tags.includes(tag)) {
      setNewCourseData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setNewCourseData(prev => ({ ...prev, tags: prev.tags.filter((_, i) => i !== index) }));
  };

  // ============ AUTH CHECKS ============
  if (authLoading) return null;
  if (!isAuthenticated) return <Redirect to="/auth" />;
  if (user?.role !== 'instructor' && user?.role !== 'admin') return <Redirect to="/dashboard" />;

  // ============ DERIVED DATA ============
  const filteredCourses = myCourses?.filter((c: any) => {
    const matchesSearch = !debouncedCourseSearch ||
      c.title.toLowerCase().includes(debouncedCourseSearch.toLowerCase()) ||
      c.description?.toLowerCase().includes(debouncedCourseSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'published' && c.published) ||
      (statusFilter === 'draft' && !c.published);
    return matchesSearch && matchesStatus;
  }) || [];

  const publishedCourses = filteredCourses.filter((c: any) => c.published);
  const draftCourses = filteredCourses.filter((c: any) => !c.published);

  const reportingData = allEnrollments?.filter((e: any) => {
    const matchesSearch = !debouncedReportingSearch ||
      e.user?.displayName?.toLowerCase().includes(debouncedReportingSearch.toLowerCase()) ||
      e.user?.email?.toLowerCase().includes(debouncedReportingSearch.toLowerCase()) ||
      e.course?.title?.toLowerCase().includes(debouncedReportingSearch.toLowerCase());
    if (reportingFilter === 'all') return matchesSearch;
    if (reportingFilter === 'not-started') return matchesSearch && (!e.startedAt && !e.completedAt);
    if (reportingFilter === 'in-progress') return matchesSearch && (e.startedAt && !e.completedAt);
    if (reportingFilter === 'completed') return matchesSearch && e.completedAt;
    return matchesSearch;
  }) || [];

  const totalParticipants = allEnrollments?.length || 0;
  const notStartedCount = allEnrollments?.filter((e: any) => !e.startedAt && !e.completedAt).length || 0;
  const inProgressCount = allEnrollments?.filter((e: any) => e.startedAt && !e.completedAt).length || 0;
  const completedCount = allEnrollments?.filter((e: any) => e.completedAt).length || 0;

  // ============ HELPERS ============
  const copyShareLink = (courseId: string) => {
    const url = `${window.location.origin}/courses/${courseId}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link Copied", description: "Course link copied to clipboard" });
  };

  const exportReportingCSV = () => {
    const headers = ['Sr No', 'Course', 'Participant', 'Email', 'Enrolled', 'Started', 'Progress', 'Completed', 'Status'];
    const rows = reportingData.map((e: any, idx: number) => [
      idx + 1,
      e.course?.title || '',
      e.user?.displayName || '',
      e.user?.email || '',
      e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString() : '',
      e.startedAt ? new Date(e.startedAt).toLocaleDateString() : '',
      `${e.progress || 0}%`,
      e.completedAt ? new Date(e.completedAt).toLocaleDateString() : '',
      e.completedAt ? 'Completed' : e.startedAt ? 'In Progress' : 'Not Started',
    ]);
    const csv = [headers, ...rows].map((r: any) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `instructor-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ============ RENDER ============
  return (
    <div className="min-h-screen bg-background pb-20">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold">Instructor Dashboard</h1>
                <p className="text-muted-foreground">Manage your courses &amp; track learner progress</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3 h-12">
            <TabsTrigger value="courses" className="gap-2 text-sm">
              <BookOpen className="w-4 h-4" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="reporting" className="gap-2 text-sm">
              <TrendingUp className="w-4 h-4" />
              Reporting
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 text-sm">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* ============ COURSES TAB ============ */}
          <TabsContent value="courses" className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-1 gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search courses..." className="pl-10" value={courseSearch} onChange={(e) => setCourseSearch(e.target.value)} />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex border rounded-lg p-1">
                  <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')}><List className="w-4 h-4" /></Button>
                  <Button variant={viewMode === 'kanban' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('kanban')}><LayoutGrid className="w-4 h-4" /></Button>
                </div>

                <Dialog open={isCreateCourseOpen} onOpenChange={(open) => {
                  setIsCreateCourseOpen(open);
                  if (!open) resetCreateCourseForm();
                }}>
                  <DialogTrigger asChild>
                    <Button><Plus className="w-4 h-4 mr-2" />Create Course</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Create New Course
                      </DialogTitle>
                      <DialogDescription>
                        Step {createCourseStep} of 3: {createCourseStep === 1 ? 'Basic Information' : createCourseStep === 2 ? 'Configuration' : 'Review & Create'}
                      </DialogDescription>
                    </DialogHeader>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-between mb-6">
                      {[1, 2, 3].map((step) => (
                        <div key={step} className="flex items-center">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                            createCourseStep >= step
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}>
                            {createCourseStep > step ? <CheckCircle className="w-4 h-4" /> : step}
                          </div>
                          {step < 3 && (
                            <div className={cn(
                              "w-16 h-1 mx-2",
                              createCourseStep > step ? "bg-primary" : "bg-muted"
                            )} />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Step 1: Basic Information */}
                    {createCourseStep === 1 && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="courseTitle" className="text-sm font-medium">
                            Course Title <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="courseTitle"
                            placeholder="e.g. Introduction to Web Development"
                            value={newCourseData.title}
                            onChange={(e) => setNewCourseData(prev => ({ ...prev, title: e.target.value }))}
                            autoFocus
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="shortDesc">Short Description</Label>
                          <Input
                            id="shortDesc"
                            placeholder="A brief summary (1-2 sentences)"
                            value={newCourseData.shortDescription}
                            onChange={(e) => setNewCourseData(prev => ({ ...prev, shortDescription: e.target.value }))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Full Description</Label>
                          <Textarea
                            id="description"
                            placeholder="Describe what learners will gain from this course..."
                            value={newCourseData.description}
                            onChange={(e) => setNewCourseData(prev => ({ ...prev, description: e.target.value }))}
                            className="min-h-[100px]"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select
                            value={newCourseData.category || 'none'}
                            onValueChange={(val) => setNewCourseData(prev => ({ ...prev, category: val === 'none' ? '' : val }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Category</SelectItem>
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
                        </div>

                        <div className="space-y-2">
                          <Label>Tags</Label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {newCourseData.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="px-2 py-1">
                                {tag}
                                <button
                                  type="button"
                                  className="ml-2 hover:text-destructive"
                                  onClick={() => removeTag(index)}
                                >
                                  <XCircle className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add a tag..."
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addTag();
                                }
                              }}
                            />
                            <Button type="button" variant="outline" onClick={addTag}>
                              Add
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Cover Image</Label>
                          <FileUpload
                            onUploadComplete={(url) => setNewCourseData(prev => ({ ...prev, coverImage: url }))}
                            className="h-32"
                            label={newCourseData.coverImage ? "Change Image" : "Upload Cover Image"}
                          />
                          {newCourseData.coverImage && (
                            <div className="mt-2 relative w-32 h-20 rounded-lg overflow-hidden">
                              <img src={newCourseData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Step 2: Configuration */}
                    {createCourseStep === 2 && (
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Visibility</Label>
                          <RadioGroup
                            value={newCourseData.visibility}
                            onValueChange={(val) => setNewCourseData(prev => ({ ...prev, visibility: val as any }))}
                          >
                            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                              <RadioGroupItem value="everyone" id="vis-everyone" />
                              <div className="flex-grow">
                                <Label htmlFor="vis-everyone" className="font-medium flex items-center gap-2">
                                  <Globe className="w-4 h-4" />
                                  Everyone
                                </Label>
                                <p className="text-sm text-muted-foreground">Anyone can see this course</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                              <RadioGroupItem value="signed_in" id="vis-signed" />
                              <div className="flex-grow">
                                <Label htmlFor="vis-signed" className="font-medium flex items-center gap-2">
                                  <Lock className="w-4 h-4" />
                                  Signed In Users
                                </Label>
                                <p className="text-sm text-muted-foreground">Only logged-in users can see</p>
                              </div>
                            </div>
                          </RadioGroup>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Access Rule</Label>
                          <RadioGroup
                            value={newCourseData.accessRule}
                            onValueChange={(val) => setNewCourseData(prev => ({ ...prev, accessRule: val as any }))}
                          >
                            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                              <RadioGroupItem value="open" id="access-open" />
                              <div className="flex-grow">
                                <Label htmlFor="access-open" className="font-medium">Open</Label>
                                <p className="text-sm text-muted-foreground">Anyone can start learning</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                              <RadioGroupItem value="invitation" id="access-invite" />
                              <div className="flex-grow">
                                <Label htmlFor="access-invite" className="font-medium">On Invitation</Label>
                                <p className="text-sm text-muted-foreground">Only invited/enrolled users can access</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                              <RadioGroupItem value="payment" id="access-payment" />
                              <div className="flex-grow">
                                <Label htmlFor="access-payment" className="font-medium flex items-center gap-2">
                                  <CreditCard className="w-4 h-4" />
                                  On Payment
                                </Label>
                                <p className="text-sm text-muted-foreground">Users must pay to access</p>
                              </div>
                            </div>
                          </RadioGroup>

                          {newCourseData.accessRule === 'payment' && (
                            <div className="ml-6 mt-2 space-y-2">
                              <Label>Price ($)</Label>
                              <Input
                                type="number"
                                min="0"
                                value={newCourseData.price}
                                onChange={(e) => setNewCourseData(prev => ({ ...prev, price: Number(e.target.value) }))}
                                className="w-32"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Step 3: Review & Create */}
                    {createCourseStep === 3 && (
                      <div className="space-y-4">
                        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                          <h4 className="font-semibold">Course Summary</h4>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Title:</span>
                              <p className="font-medium">{newCourseData.title || '-'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Category:</span>
                              <p className="font-medium capitalize">{newCourseData.category || 'None'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Visibility:</span>
                              <p className="font-medium capitalize">{newCourseData.visibility === 'everyone' ? 'Public' : 'Signed In Only'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Access:</span>
                              <p className="font-medium capitalize">
                                {newCourseData.accessRule === 'payment'
                                  ? `Paid ($${newCourseData.price})`
                                  : newCourseData.accessRule === 'invitation'
                                    ? 'Invitation Only'
                                    : 'Open'}
                              </p>
                            </div>
                          </div>

                          {newCourseData.shortDescription && (
                            <div>
                              <span className="text-muted-foreground text-sm">Short Description:</span>
                              <p className="text-sm">{newCourseData.shortDescription}</p>
                            </div>
                          )}

                          {newCourseData.tags.length > 0 && (
                            <div>
                              <span className="text-muted-foreground text-sm">Tags:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {newCourseData.tags.map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {newCourseData.coverImage && (
                            <div>
                              <span className="text-muted-foreground text-sm">Cover Image:</span>
                              <div className="mt-1 w-32 h-20 rounded-lg overflow-hidden">
                                <img src={newCourseData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 text-sm">
                          <p className="text-blue-700 dark:text-blue-300">
                            <strong>Note:</strong> The course will be created as a <Badge variant="secondary">Draft</Badge>.
                            After creation, you'll be redirected to the Course Editor to add content and lessons.
                          </p>
                        </div>
                      </div>
                    )}

                    <DialogFooter className="mt-6">
                      {createCourseStep > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCreateCourseStep(prev => prev - 1)}
                        >
                          Back
                        </Button>
                      )}
                      <Button variant="outline" onClick={() => setIsCreateCourseOpen(false)}>
                        Cancel
                      </Button>
                      {createCourseStep < 3 ? (
                        <Button
                          onClick={() => setCreateCourseStep(prev => prev + 1)}
                          disabled={createCourseStep === 1 && !newCourseData.title.trim()}
                        >
                          Next
                        </Button>
                      ) : (
                        <Button
                          onClick={() => createCourseMutation.mutate(newCourseData)}
                          disabled={!newCourseData.title.trim() || createCourseMutation.isPending}
                        >
                          {createCourseMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Create Course
                        </Button>
                      )}
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Course Views */}
            {coursesLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : viewMode === 'list' ? (
              /* ---- List View ---- */
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Course</TableHead>
                      <TableHead>Lessons</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Access</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCourses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                          {myCourses?.length === 0 ? (
                            <div className="flex flex-col items-center gap-2">
                              <BookOpen className="w-10 h-10 opacity-50" />
                              <p>You haven't created any courses yet.</p>
                              <Button size="sm" onClick={() => setIsCreateCourseOpen(true)}><Plus className="w-4 h-4 mr-2" /> Create your first course</Button>
                            </div>
                          ) : "No courses match your filters"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCourses.map((course: any) => (
                        <TableRow key={course.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-8 rounded bg-muted overflow-hidden flex-shrink-0">
                                {course.coverImage ? (
                                  <img src={course.coverImage} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-4 h-4 text-muted-foreground" /></div>
                                )}
                              </div>
                              <div>
                                <Link href={`/instructor/course/${course.id}`}>
                                  <button className="font-medium max-w-[200px] truncate hover:text-primary hover:underline text-left">{course.title}</button>
                                </Link>
                                {course.tags && course.tags.length > 0 && (
                                  <div className="flex gap-1 mt-1">
                                    {course.tags.slice(0, 2).map((tag: string) => (
                                      <Badge key={tag} variant="outline" className="text-[10px] px-1">{tag}</Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><span className="text-sm">{course.lessons?.length || 0}</span></TableCell>
                          <TableCell>
                            <Badge variant={course.published ? "default" : "secondary"} className={cn("gap-1", course.published ? "bg-green-100 text-green-700 hover:bg-green-100" : "")}>
                              {course.published ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {course.published ? "Published" : "Draft"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {course.visibility === 'everyone' ? <Globe className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                              {course.visibility || 'everyone'}
                            </Badge>
                          </TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{course.accessRule || 'open'}</Badge></TableCell>
                          <TableCell><span className="text-sm text-muted-foreground">{course.viewsCount || 0}</span></TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate(`/learn/${course.id}`)}><Eye className="w-4 h-4 mr-2" />Preview</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/instructor/course/${course.id}`)}><Edit className="w-4 h-4 mr-2" />Edit Course</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => copyShareLink(course.id)}><Share2 className="w-4 h-4 mr-2" />Share Link</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => publishCourseMutation.mutate({ id: course.id, published: !course.published })}>
                                  {course.published ? <XCircle className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                  {course.published ? "Unpublish" : "Publish"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSelectedCourse(course)}><Settings className="w-4 h-4 mr-2" />Manage Course</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteCourseId(course.id)}>
                                  <Trash2 className="w-4 h-4 mr-2" />Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            ) : (
              /* ---- Kanban View ---- */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Draft Column */}
                <Card>
                  <CardHeader className="bg-amber-50 dark:bg-amber-950/30 py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2"><XCircle className="w-4 h-4 text-amber-600" />Draft</CardTitle>
                      <Badge variant="secondary">{draftCourses.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
                    {draftCourses.map((course: any) => (
                      <Card key={course.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedCourse(course)}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
                              {course.coverImage ? (
                                <img src={course.coverImage} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-5 h-5 text-muted-foreground" /></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{course.title}</p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{course.lessons?.length || 0} lessons</span>
                                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{course.viewsCount || 0}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {draftCourses.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No draft courses</p>}
                  </CardContent>
                </Card>

                {/* Published Column */}
                <Card>
                  <CardHeader className="bg-green-50 dark:bg-green-950/30 py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" />Published</CardTitle>
                      <Badge variant="secondary">{publishedCourses.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
                    {publishedCourses.map((course: any) => (
                      <Card key={course.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedCourse(course)}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
                              {course.coverImage ? (
                                <img src={course.coverImage} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-5 h-5 text-muted-foreground" /></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{course.title}</p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{course.lessons?.length || 0} lessons</span>
                                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{course.viewsCount || 0}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {publishedCourses.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No published courses</p>}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ============ REPORTING TAB ============ */}
          <TabsContent value="reporting" className="space-y-6">
            {/* Status Filter Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className={cn("cursor-pointer transition-all hover:shadow-md", reportingFilter === 'all' && "ring-2 ring-blue-500")} onClick={() => setReportingFilter('all')}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600"><Users className="w-5 h-5" /></div>
                    <div><p className="text-2xl font-bold">{totalParticipants}</p><p className="text-xs text-muted-foreground">Total Participants</p></div>
                  </div>
                </CardContent>
              </Card>
              <Card className={cn("cursor-pointer transition-all hover:shadow-md", reportingFilter === 'not-started' && "ring-2 ring-orange-500")} onClick={() => setReportingFilter('not-started')}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-100 text-orange-600"><Clock className="w-5 h-5" /></div>
                    <div><p className="text-2xl font-bold">{notStartedCount}</p><p className="text-xs text-muted-foreground">Yet to Start</p></div>
                  </div>
                </CardContent>
              </Card>
              <Card className={cn("cursor-pointer transition-all hover:shadow-md", reportingFilter === 'in-progress' && "ring-2 ring-purple-500")} onClick={() => setReportingFilter('in-progress')}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-600"><PlayCircle className="w-5 h-5" /></div>
                    <div><p className="text-2xl font-bold">{inProgressCount}</p><p className="text-xs text-muted-foreground">In Progress</p></div>
                  </div>
                </CardContent>
              </Card>
              <Card className={cn("cursor-pointer transition-all hover:shadow-md", reportingFilter === 'completed' && "ring-2 ring-green-500")} onClick={() => setReportingFilter('completed')}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 text-green-600"><CheckCircle className="w-5 h-5" /></div>
                    <div><p className="text-2xl font-bold">{completedCount}</p><p className="text-xs text-muted-foreground">Completed</p></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reporting Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-1 gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search by name, email, or course..." className="pl-10" value={reportingSearch} onChange={(e) => setReportingSearch(e.target.value)} />
                </div>
                {reportingFilter !== 'all' && (
                  <Badge variant="secondary" className="h-10 px-4 flex items-center gap-2 cursor-pointer" onClick={() => setReportingFilter('all')}>
                    {reportingFilter.replace('-', ' ')}<XCircle className="w-3 h-3" />
                  </Badge>
                )}
              </div>
              <Button variant="outline" onClick={exportReportingCSV}><Download className="w-4 h-4 mr-2" />Export CSV</Button>
            </div>

            {/* Reporting Table */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Sr No</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Participant</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollmentsLoading ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                  ) : reportingData.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No enrollment data found</TableCell></TableRow>
                  ) : (
                    reportingData.map((enrollment: any, idx: number) => (
                      <TableRow key={enrollment.id || idx}>
                        <TableCell className="font-medium">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-6 rounded bg-muted overflow-hidden flex-shrink-0">
                              {enrollment.course?.coverImage ? (
                                <img src={enrollment.course.coverImage} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-3 h-3 text-muted-foreground" /></div>
                              )}
                            </div>
                            <span className="truncate max-w-[150px]">{enrollment.course?.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div><p className="font-medium">{enrollment.user?.displayName || 'Unknown'}</p><p className="text-xs text-muted-foreground">{enrollment.user?.email}</p></div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{enrollment.startedAt ? new Date(enrollment.startedAt).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={enrollment.progress || 0} className="h-2 w-20" />
                            <span className="text-xs text-muted-foreground">{enrollment.progress || 0}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{enrollment.completedAt ? new Date(enrollment.completedAt).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>
                          {enrollment.completedAt ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Completed</Badge>
                          ) : enrollment.startedAt ? (
                            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">In Progress</Badge>
                          ) : (
                            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Not Started</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ============ SETTINGS TAB ============ */}
          <TabsContent value="settings">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Settings className="w-12 h-12 mb-4 opacity-50" />
                <h3 className="text-lg font-medium">Settings</h3>
                <p>Instructor settings configuration coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
