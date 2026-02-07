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
  Clock,
  BookOpen
} from "lucide-react";
import { Link, Redirect, useLocation } from "wouter";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

// Simple schema for course creation - just the name
const createCourseFormSchema = z.object({
  title: z.string().min(1, "Course name is required"),
});

type CreateCourseFormValues = z.infer<typeof createCourseFormSchema>;

export default function InstructorHub() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: courses, isLoading: coursesLoading } = useCourses({ instructorId: user?.id });
  const createCourse = useCreateCourse();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<CreateCourseFormValues>({
    resolver: zodResolver(createCourseFormSchema),
    defaultValues: {
      title: "",
    }
  });

  const onSubmit = (data: CreateCourseFormValues) => {
    createCourse.mutate({
      ...data,
      description: "",
      coverImage: "",
      instructorId: user!.id,
      published: false,
      visibility: "everyone", 
      accessRule: "open",
    }, {
      onSuccess: (newCourse: any) => {
        setIsDialogOpen(false);
        form.reset();
        // Navigate to course editor to add content
        navigate(`/instructor/course/${newCourse.id}`);
      }
    });
  };

  const handleCopyLink = (courseId: string) => {
    const link = `${window.location.origin}/courses/${courseId}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link copied!", description: "Course link copied to clipboard" });
  };

  if (authLoading) return null;
  if (!isAuthenticated) return <Redirect to="/auth" />;
  if (user?.role !== "instructor" && user?.role !== "admin") {
    // Should be a 403 Forbidden page, but redirecting to dashboard for now
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
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-lg shadow-primary/20">
                <Plus className="w-5 h-5 mr-2" />
                Create New Course
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogDescription>
                  Enter the course name to get started. You can add content later.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Name</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g. Advanced React Patterns" 
                    {...form.register("title")}
                    autoFocus
                  />
                  {form.formState.errors.title && (
                    <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
                  )}
                </div>

                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createCourse.isPending}>
                    {createCourse.isPending ? "Creating..." : "Create & Continue"}
                  </Button>
                </DialogFooter>
              </form>
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
                <p>You haven't created any courses yet.</p>
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
                        {course.coverImage && <img src={course.coverImage} className="w-full h-full object-cover" />}
                      </div>
                      <Link href={`/instructor/course/${course.id}`} className="font-medium hover:text-primary hover:underline truncate">
                        {course.title}
                      </Link>
                    </div>
                    <div className="col-span-2">
                      <Badge variant={course.published ? "default" : "secondary"}>
                        {course.published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <div className="col-span-2 flex items-center gap-1 text-sm text-muted-foreground">
                      <BookOpen className="w-4 h-4" />
                      <span>-</span>
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
                          <DropdownMenuItem asChild>
                            <Link href={`/instructor/course/${course.id}`}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Course
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/courses/${course.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </Link>
                          </DropdownMenuItem>
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
