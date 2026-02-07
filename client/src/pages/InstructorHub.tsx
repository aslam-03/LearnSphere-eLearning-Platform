import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/use-auth";
import { useCourses, useCreateCourse } from "@/hooks/use-courses";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { Redirect, useLocation, Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileUpload } from "@/components/FileUpload";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function InstructorHub() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: courses, isLoading: coursesLoading } = useCourses({ instructorId: user?.id });
  const createCourse = useCreateCourse();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const resetForm = () => {
    setCreateCourseStep(1);
    setNewCourseData({
      title: '',
      description: '',
      shortDescription: '',
      category: '',
      visibility: 'everyone',
      accessRule: 'open',
      price: 0,
      coverImage: '',
      tags: [],
    });
    setTagInput('');
  };

  const handleCreateCourse = () => {
    if (!newCourseData.title.trim()) return;
    
    createCourse.mutate({
      title: newCourseData.title.trim(),
      description: newCourseData.description,
      shortDescription: newCourseData.shortDescription,
      category: newCourseData.category || undefined,
      tags: newCourseData.tags,
      instructorId: user!.id,
      published: false,
      visibility: newCourseData.visibility, 
      accessRule: newCourseData.accessRule,
      price: newCourseData.accessRule === 'payment' ? newCourseData.price : undefined,
      coverImage: newCourseData.coverImage || undefined,
    }, {
      onSuccess: (newCourse: any) => {
        setIsDialogOpen(false);
        resetForm();
        toast({ title: "Course Created", description: "Course created successfully. Redirecting to editor..." });
        navigate(`/instructor/course/${newCourse.id}`);
      }
    });
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

  const handleCopyLink = (courseId: string) => {
    const link = `${window.location.origin}/courses/${courseId}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link copied!", description: "Course link copied to clipboard" });
  };

  if (authLoading) return null;
  if (!isAuthenticated) return <Redirect to="/auth" />;
  if (user?.role !== "instructor" && user?.role !== "admin") {
    return <Redirect to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Instructor Hub</h1>
            <p className="text-muted-foreground mt-1">Manage your courses and track student progress.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-lg shadow-primary/20">
                <Plus className="w-5 h-5 mr-2" />
                Create New Course
              </Button>
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
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
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
                    onClick={handleCreateCourse}
                    disabled={!newCourseData.title.trim() || createCourse.isPending}
                  >
                    {createCourse.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Course
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Course List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>My Courses</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search courses..." className="pl-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {coursesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}
              </div>
            ) : courses?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">You haven't created any courses yet.</p>
                <p className="text-sm mt-1">Click "Create New Course" to get started.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <div className="grid grid-cols-12 gap-4 p-4 font-medium text-sm text-muted-foreground border-b bg-muted/30">
                  <div className="col-span-4">Course Info</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Lessons</div>
                  <div className="col-span-2">Students</div>
                  <div className="col-span-2"></div>
                </div>
                {courses?.map((course) => (
                  <div key={course.id} className="grid grid-cols-12 gap-4 p-4 items-center border-b last:border-0 hover:bg-muted/10 transition-colors">
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-muted overflow-hidden flex-shrink-0">
                        {course.coverImage && <img src={course.coverImage} className="w-full h-full object-cover" alt="" />}
                      </div>
                      <button 
                        onClick={() => navigate(`/instructor/course/${course.id}`)}
                        className="font-medium hover:text-primary hover:underline truncate text-left"
                      >
                        {course.title}
                      </button>
                    </div>
                    <div className="col-span-2">
                      <Badge variant={course.published ? "default" : "secondary"}>
                        {course.published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <div className="col-span-2 flex items-center gap-1 text-sm text-muted-foreground">
                      <BookOpen className="w-4 h-4" />
                      <span>{course.lessons?.length || 0}</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>0</span>
                    </div>
                    <div className="col-span-2 flex justify-end gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/instructor/course/${course.id}`}>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Course
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/courses/${course.id}`}>
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem onClick={() => handleCopyLink(course.id)}>
                            <Share2 className="w-4 h-4 mr-2" />
                            Share Link
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            <Trash className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
