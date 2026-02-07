import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  BookOpen, 
  Search,
  MoreVertical,
  UserCog,
  Trash2,
  Eye,
  Plus,
  Mail,
  Loader2,
  AlertTriangle,
  Calendar,
  GraduationCap,
  Edit,
  RefreshCw,
  UserPlus,
  Lock,
  CheckCircle
} from "lucide-react";
import { Redirect, Link } from "wouter";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { adminApi, coursesApi } from "@/lib/api";
import type { User, Course } from "@shared/types";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

export default function ManageInstructors() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // State
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newInstructor, setNewInstructor] = useState({ email: "", password: "", displayName: "" });
  const [deleteInstructorId, setDeleteInstructorId] = useState<string | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<User | null>(null);
  
  const debouncedSearch = useDebounce(search, 300);

  // ============ QUERIES ============
  // Fetch all instructors
  const { data: instructors, isLoading: instructorsLoading, refetch: refetchInstructors } = useQuery({
    queryKey: ['admin', 'instructors'],
    queryFn: () => adminApi.getInstructors(),
    enabled: user?.role === 'admin',
  });

  // Fetch all courses (to show instructor's courses)
  const { data: allCourses } = useQuery({
    queryKey: ['admin', 'courses'],
    queryFn: () => coursesApi.list(),
    enabled: user?.role === 'admin',
  });

  // ============ MUTATIONS ============
  // Create instructor
  const createInstructorMutation = useMutation({
    mutationFn: ({ email, password, displayName }: { email: string; password: string; displayName: string }) =>
      adminApi.createInstructor(email, password, displayName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ title: "Success", description: "Instructor account created successfully" });
      setIsAddDialogOpen(false);
      setNewInstructor({ email: "", password: "", displayName: "" });
    },
    onError: (err: Error) => {
      toast({ 
        title: "Error", 
        description: err.message.includes('email-already-in-use') 
          ? "This email is already registered" 
          : err.message, 
        variant: "destructive" 
      });
    },
  });

  // Delete instructor (demote to learner or delete)
  const deleteInstructorMutation = useMutation({
    mutationFn: (userId: string) => adminApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ title: "Success", description: "Instructor deleted successfully" });
      setDeleteInstructorId(null);
      setSelectedInstructor(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // Demote to learner
  const demoteToLearnerMutation = useMutation({
    mutationFn: (userId: string) => adminApi.updateUserRole(userId, 'learner'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ title: "Success", description: "User demoted to learner" });
      setSelectedInstructor(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // ============ AUTH CHECKS ============
  if (authLoading) return null;
  if (!isAuthenticated) return <Redirect to="/auth" />;
  if (user?.role !== 'admin') return <Redirect to="/dashboard" />;

  // ============ DERIVED DATA ============
  const filteredInstructors = instructors?.filter(i => {
    const matchesSearch = !debouncedSearch || 
      i.displayName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      i.email?.toLowerCase().includes(debouncedSearch.toLowerCase());
    return matchesSearch;
  }) || [];

  const getInstructorCourses = (instructorId: string) => {
    return allCourses?.filter(c => c.instructorId === instructorId) || [];
  };

  const getPublishedCount = (instructorId: string) => {
    return getInstructorCourses(instructorId).filter(c => c.published).length;
  };

  const getDraftCount = (instructorId: string) => {
    return getInstructorCourses(instructorId).filter(c => !c.published).length;
  };

  const handleCreateInstructor = () => {
    if (!newInstructor.email || !newInstructor.password || !newInstructor.displayName) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }
    if (newInstructor.password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    createInstructorMutation.mutate(newInstructor);
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
                <UserCog className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold">Manage Instructors</h1>
                <p className="text-muted-foreground">Create and manage instructor accounts</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => refetchInstructors()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Instructor
              </Button>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Instructors</CardTitle>
              <Users className="w-5 h-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{instructors?.length || 0}</div>
              <p className="text-xs opacity-80 mt-1">Active instructor accounts</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Courses</CardTitle>
              <BookOpen className="w-5 h-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {instructors?.reduce((acc, i) => acc + getInstructorCourses(i.id).length, 0) || 0}
              </div>
              <p className="text-xs opacity-80 mt-1">Courses by instructors</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Published Courses</CardTitle>
              <CheckCircle className="w-5 h-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {instructors?.reduce((acc, i) => acc + getPublishedCount(i.id), 0) || 0}
              </div>
              <p className="text-xs opacity-80 mt-1">Live and available</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search instructors by name or email..." 
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredInstructors.length} instructor{filteredInstructors.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Instructors Grid */}
        {instructorsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredInstructors.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Instructors Found</h3>
              <p className="text-muted-foreground mb-4">
                {search ? "No instructors match your search" : "There are no instructors yet"}
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add First Instructor
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInstructors.map((instructor) => {
              const courses = getInstructorCourses(instructor.id);
              const publishedCount = getPublishedCount(instructor.id);
              const draftCount = getDraftCount(instructor.id);
              
              return (
                <Card key={instructor.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={instructor.photoURL || undefined} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                            {(instructor.displayName || instructor.email || 'I').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{instructor.displayName || 'Instructor'}</CardTitle>
                          <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                            {instructor.email}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setSelectedInstructor(instructor)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            navigator.clipboard.writeText(instructor.email);
                            toast({ title: "Copied", description: "Email copied to clipboard" });
                          }}>
                            <Mail className="w-4 h-4 mr-2" />
                            Copy Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteInstructorId(instructor.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <BookOpen className="w-4 h-4" />
                          <span>{courses.length} Course{courses.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {publishedCount} Published
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {draftCount} Draft
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Joined */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Joined {instructor.createdAt 
                            ? new Date(instructor.createdAt).toLocaleDateString() 
                            : 'N/A'}
                        </span>
                      </div>
                      
                      {/* Recent Courses */}
                      {courses.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Recent Courses</p>
                          <div className="space-y-1">
                            {courses.slice(0, 2).map(course => (
                              <Link key={course.id} href={`/courses/${course.id}`}>
                                <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer">
                                  <div className="w-8 h-6 rounded bg-muted overflow-hidden flex-shrink-0">
                                    {course.coverImage ? (
                                      <img src={course.coverImage} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <BookOpen className="w-3 h-3 text-muted-foreground" />
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-sm truncate flex-1">{course.title}</span>
                                  <Badge variant={course.published ? "default" : "secondary"} className="text-[10px] px-1.5">
                                    {course.published ? "Live" : "Draft"}
                                  </Badge>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ============ DIALOGS ============ */}

      {/* Add Instructor Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Add New Instructor
            </DialogTitle>
            <DialogDescription>
              Create a new instructor account. The instructor can sign in with these credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Full Name</Label>
              <Input 
                id="displayName" 
                placeholder="e.g. John Smith"
                value={newInstructor.displayName}
                onChange={(e) => setNewInstructor({ ...newInstructor, displayName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email"
                  placeholder="instructor@example.com"
                  className="pl-10"
                  value={newInstructor.email}
                  onChange={(e) => setNewInstructor({ ...newInstructor, email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password"
                  placeholder="Minimum 6 characters"
                  className="pl-10"
                  value={newInstructor.password}
                  onChange={(e) => setNewInstructor({ ...newInstructor, password: e.target.value })}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                The instructor can change this password after signing in
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateInstructor}
              disabled={createInstructorMutation.isPending}
            >
              {createInstructorMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Instructor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Instructor Profile Sheet */}
      <Sheet open={!!selectedInstructor} onOpenChange={() => setSelectedInstructor(null)}>
        <SheetContent className="w-[400px] sm:max-w-[400px]">
          <SheetHeader>
            <SheetTitle>Instructor Profile</SheetTitle>
            <SheetDescription>View instructor details and courses</SheetDescription>
          </SheetHeader>
          
          {selectedInstructor && (
            <ScrollArea className="h-[calc(100vh-150px)] pr-4 mt-6">
              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={selectedInstructor.photoURL || undefined} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                      {(selectedInstructor.displayName || selectedInstructor.email || 'I').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedInstructor.displayName || 'Instructor'}</h3>
                    <p className="text-sm text-muted-foreground">{selectedInstructor.email}</p>
                    <Badge className="mt-2 bg-blue-100 text-blue-700 hover:bg-blue-100">
                      <UserCog className="w-3 h-3 mr-1" />
                      Instructor
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-2xl font-bold">{getInstructorCourses(selectedInstructor.id).length}</p>
                      <p className="text-xs text-muted-foreground">Total Courses</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-2xl font-bold">{getPublishedCount(selectedInstructor.id)}</p>
                      <p className="text-xs text-muted-foreground">Published</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Account Info */}
                <div className="space-y-2">
                  <Label>Account Information</Label>
                  <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">User ID</span>
                      <span className="font-mono text-xs">{selectedInstructor.id.slice(0, 12)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Joined</span>
                      <span>
                        {selectedInstructor.createdAt 
                          ? new Date(selectedInstructor.createdAt).toLocaleDateString() 
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Points</span>
                      <span>{selectedInstructor.points || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Courses List */}
                <div className="space-y-3">
                  <Label>Courses ({getInstructorCourses(selectedInstructor.id).length})</Label>
                  {getInstructorCourses(selectedInstructor.id).length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No courses created yet</p>
                  ) : (
                    <div className="space-y-2">
                      {getInstructorCourses(selectedInstructor.id).map(course => (
                        <Link key={course.id} href={`/courses/${course.id}`}>
                          <Card className="cursor-pointer hover:shadow-md transition-shadow">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-8 rounded bg-muted overflow-hidden flex-shrink-0">
                                  {course.coverImage ? (
                                    <img src={course.coverImage} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{course.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {course.lessons?.length || 0} lessons
                                  </p>
                                </div>
                                <Badge variant={course.published ? "default" : "secondary"} className="text-xs">
                                  {course.published ? "Live" : "Draft"}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Actions */}
                <div className="space-y-2">
                  <Label>Actions</Label>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => {
                        demoteToLearnerMutation.mutate(selectedInstructor.id);
                      }}
                      disabled={demoteToLearnerMutation.isPending}
                    >
                      {demoteToLearnerMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <GraduationCap className="w-4 h-4 mr-2" />
                      )}
                      Demote to Learner
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="w-full justify-start"
                      onClick={() => setDeleteInstructorId(selectedInstructor.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Instructor
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteInstructorId} onOpenChange={() => setDeleteInstructorId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Instructor
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this instructor? This action cannot be undone
              and will remove their account and all their data. Their courses will remain but
              will need a new owner assigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteInstructorId && deleteInstructorMutation.mutate(deleteInstructorId)}
            >
              {deleteInstructorMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
