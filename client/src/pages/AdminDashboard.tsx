import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/use-auth";
import { useCourses, usePublishCourse, useUpdateCourse } from "@/hooks/use-courses";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  TrendingUp, 
  Shield,
  Search,
  MoreVertical,
  UserCog,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Plus,
  LayoutGrid,
  List,
  Filter,
  Share2,
  Clock,
  FileText,
  PlayCircle,
  Settings,
  BarChart3,
  Download,
  Mail,
  UserPlus,
  Edit,
  Loader2,
  AlertTriangle,
  Calendar,
  Globe,
  Lock,
  CreditCard,
  ChevronDown,
  Video,
  HelpCircle,
  Image as ImageIcon,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { Redirect, Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// ============ TYPES ============
type ViewMode = 'list' | 'kanban';
type ReportingFilter = 'all' | 'not-started' | 'in-progress' | 'completed';

interface PlatformSettings {
  appName: string;
  supportEmail: string;
  defaultVisibility: 'everyone' | 'signed_in';
  defaultAccessRule: 'open' | 'invitation' | 'payment';
  enableGamification: boolean;
  pointsPerLesson: number;
}

// ============ ADMIN DASHBOARD COMPONENT ============
export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // State
  const [activeTab, setActiveTab] = useState("overview");
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [userSearch, setUserSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [reportingSearch, setReportingSearch] = useState("");
  const [instructorFilter, setInstructorFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reportingFilter, setReportingFilter] = useState<ReportingFilter>("all");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteCourseId, setDeleteCourseId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<PlatformSettings>({
    appName: 'LearnSphere',
    supportEmail: 'support@learnsphere.com',
    defaultVisibility: 'everyone',
    defaultAccessRule: 'open',
    enableGamification: true,
    pointsPerLesson: 10,
  });
  
  const debouncedUserSearch = useDebounce(userSearch, 300);
  const debouncedCourseSearch = useDebounce(courseSearch, 300);
  const debouncedReportingSearch = useDebounce(reportingSearch, 300);

  // ============ QUERIES ============
  // Fetch all users (admin only)
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminApi.getAllUsers(),
    enabled: user?.role === 'admin',
  });

  // Fetch ALL courses (admin sees all)
  const { data: allCourses, isLoading: coursesLoading, refetch: refetchCourses } = useQuery({
    queryKey: ['admin', 'courses'],
    queryFn: () => coursesApi.list(),
    enabled: user?.role === 'admin',
  });

  // Fetch platform stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.getPlatformStats(),
    enabled: user?.role === 'admin',
  });

  // Fetch all enrollments for reporting
  const { data: allEnrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['admin', 'enrollments'],
    queryFn: async () => {
      // Get enrollments for all courses
      const enrollments: any[] = [];
      if (allCourses) {
        for (const course of allCourses) {
          try {
            const courseEnrollments = await coursesApi.getEnrollments(course.id);
            enrollments.push(...courseEnrollments.map(e => ({ ...e, course })));
          } catch (e) {}
        }
      }
      return enrollments;
    },
    enabled: user?.role === 'admin' && !!allCourses,
  });

  // ============ MUTATIONS ============
  // Update user role
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'admin' | 'instructor' | 'learner' }) =>
      adminApi.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ title: "Success", description: "User role updated successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // Delete user
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => adminApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast({ title: "Success", description: "User deleted successfully" });
      setDeleteUserId(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // Delete course
  const deleteCourseMutation = useMutation({
    mutationFn: (courseId: string) => adminApi.deleteCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({ title: "Success", description: "Course deleted successfully" });
      setDeleteCourseId(null);
      setSelectedCourse(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // Publish course
  const publishCourseMutation = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      coursesApi.publish(id, published),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({ title: "Success", description: "Course status updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // Update course (change owner, visibility, etc.)
  const updateCourseMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Course>) =>
      coursesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({ title: "Success", description: "Course updated successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // Create course
  const createCourseMutation = useMutation({
    mutationFn: (title: string) => coursesApi.create({ 
      title, 
      description: '', 
      visibility: 'everyone', 
      published: false, 
      accessRule: 'open', 
      tags: [] 
    }),
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsCreateCourseOpen(false);
      setNewCourseName("");
      navigate(`/instructor/course/${course.id}`);
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
  const instructors = users?.filter(u => u.role === 'instructor') || [];
  
  // Filter users
  const filteredUsers = users?.filter(u => {
    const matchesSearch = !debouncedUserSearch || 
      u.displayName?.toLowerCase().includes(debouncedUserSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(debouncedUserSearch.toLowerCase());
    return matchesSearch;
  }) || [];

  // Filter courses
  const filteredCourses = allCourses?.filter(c => {
    const matchesSearch = !debouncedCourseSearch || 
      c.title.toLowerCase().includes(debouncedCourseSearch.toLowerCase()) ||
      c.description?.toLowerCase().includes(debouncedCourseSearch.toLowerCase());
    const matchesInstructor = instructorFilter === 'all' || c.instructorId === instructorFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'published' && c.published) || 
      (statusFilter === 'draft' && !c.published);
    return matchesSearch && matchesInstructor && matchesStatus;
  }) || [];

  // Group courses for Kanban view
  const publishedCourses = filteredCourses.filter(c => c.published);
  const draftCourses = filteredCourses.filter(c => !c.published);

  // Reporting data
  const reportingData = allEnrollments?.filter(e => {
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

  // Stats for reporting
  const totalParticipants = allEnrollments?.length || 0;
  const notStartedCount = allEnrollments?.filter(e => !e.startedAt && !e.completedAt).length || 0;
  const inProgressCount = allEnrollments?.filter(e => e.startedAt && !e.completedAt).length || 0;
  const completedCount = allEnrollments?.filter(e => e.completedAt).length || 0;

  // ============ HELPERS ============
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'instructor': return 'default';
      default: return 'secondary';
    }
  };

  const getInstructorName = (instructorId: string) => {
    const instructor = users?.find(u => u.id === instructorId);
    return instructor?.displayName || instructor?.email || 'Unknown';
  };

  const copyShareLink = (courseId: string) => {
    const url = `${window.location.origin}/courses/${courseId}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link Copied", description: "Course link copied to clipboard" });
  };

  const exportReportingCSV = () => {
    const headers = ['Sr No', 'Course', 'Participant', 'Email', 'Enrolled', 'Started', 'Progress', 'Completed', 'Status'];
    const rows = reportingData.map((e, idx) => [
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
    
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `platform-report-${new Date().toISOString().split('T')[0]}.csv`;
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
              <div className="p-2.5 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl shadow-lg shadow-red-500/20">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">Platform management &amp; oversight</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => {
                refetchUsers();
                refetchCourses();
                refetchStats();
              }}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </header>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 h-12">
            <TabsTrigger value="overview" className="gap-2 text-sm">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="courses" className="gap-2 text-sm">
              <BookOpen className="w-4 h-4" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2 text-sm">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="reporting" className="gap-2 text-sm">
              <TrendingUp className="w-4 h-4" />
              Reporting
            </TabsTrigger>
          </TabsList>

          {/* ============ OVERVIEW TAB ============ */}
          <TabsContent value="overview" className="space-y-6">
            {/* Platform Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Users</CardTitle>
                  <Users className="w-5 h-5 opacity-80" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalUsers || users?.length || 0}</div>
                  <p className="text-xs opacity-80 mt-1">
                    +{stats?.newUsersThisMonth || 0} this month
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Courses</CardTitle>
                  <BookOpen className="w-5 h-5 opacity-80" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalCourses || allCourses?.length || 0}</div>
                  <p className="text-xs opacity-80 mt-1">
                    {allCourses?.filter(c => c.published).length || 0} published
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Enrollments</CardTitle>
                  <GraduationCap className="w-5 h-5 opacity-80" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalEnrollments || totalParticipants}</div>
                  <p className="text-xs opacity-80 mt-1">
                    {stats?.completedEnrollments || completedCount} completed
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Instructors</CardTitle>
                  <UserCog className="w-5 h-5 opacity-80" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {instructors.length}
                  </div>
                  <p className="text-xs opacity-80 mt-1">
                    Creating content
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setIsCreateCourseOpen(true)}>
                    <Plus className="w-5 h-5" />
                    <span>Create Course</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setActiveTab("users")}>
                    <UserPlus className="w-5 h-5" />
                    <span>Manage Users</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setActiveTab("reporting")}>
                    <BarChart3 className="w-5 h-5" />
                    <span>View Reports</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setIsSettingsOpen(true)}>
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                  </Button>
                </CardContent>
              </Card>

              {/* Role Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>User Distribution</CardTitle>
                  <CardDescription>Users by role</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-sm font-medium">Admins</span>
                      </div>
                      <span className="font-bold">{users?.filter(u => u.role === 'admin').length || 0}</span>
                    </div>
                    <Progress value={(users?.filter(u => u.role === 'admin').length || 0) / (users?.length || 1) * 100} className="h-2 bg-red-100" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-sm font-medium">Instructors</span>
                      </div>
                      <span className="font-bold">{instructors.length}</span>
                    </div>
                    <Progress value={instructors.length / (users?.length || 1) * 100} className="h-2 bg-blue-100" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-sm font-medium">Learners</span>
                      </div>
                      <span className="font-bold">{users?.filter(u => u.role === 'learner').length || 0}</span>
                    </div>
                    <Progress value={(users?.filter(u => u.role === 'learner').length || 0) / (users?.length || 1) * 100} className="h-2 bg-green-100" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Courses & Users */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Courses */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Courses</CardTitle>
                    <CardDescription>Latest courses on the platform</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("courses")}>
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {allCourses?.slice(0, 5).map(course => (
                      <div key={course.id} className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                          {course.coverImage ? (
                            <img src={course.coverImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{course.title}</p>
                          <p className="text-xs text-muted-foreground">
                            by {getInstructorName(course.instructorId)}
                          </p>
                        </div>
                        <Badge variant={course.published ? "default" : "secondary"}>
                          {course.published ? "Published" : "Draft"}
                        </Badge>
                      </div>
                    ))}
                    {(!allCourses || allCourses.length === 0) && (
                      <p className="text-center text-muted-foreground py-4">No courses yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Users */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Users</CardTitle>
                    <CardDescription>Newest platform members</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("users")}>
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users?.slice(0, 5).map(u => (
                      <div key={u.id} className="flex items-center gap-4">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={u.photoURL || undefined} />
                          <AvatarFallback>{(u.displayName || u.email || 'U').slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{u.displayName || 'User'}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                        <Badge variant={getRoleBadgeVariant(u.role)}>
                          {u.role}
                        </Badge>
                      </div>
                    ))}
                    {(!users || users.length === 0) && (
                      <p className="text-center text-muted-foreground py-4">No users yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ============ COURSES TAB ============ */}
          <TabsContent value="courses" className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-1 gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search courses..." 
                    className="pl-10"
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                  />
                </div>
                <Select value={instructorFilter} onValueChange={setInstructorFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Instructors</SelectItem>
                    {instructors.map(inst => (
                      <SelectItem key={inst.id} value={inst.id}>
                        {inst.displayName || inst.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex border rounded-lg p-1">
                  <Button 
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant={viewMode === 'kanban' ? 'secondary' : 'ghost'} 
                    size="sm"
                    onClick={() => setViewMode('kanban')}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                </div>
                <Button onClick={() => setIsCreateCourseOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Course
                </Button>
              </div>
            </div>

            {/* Course Views */}
            {coursesLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : viewMode === 'list' ? (
              /* List View */
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Course</TableHead>
                      <TableHead>Instructor</TableHead>
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
                        <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                          No courses found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCourses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell>
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
                              <div>
                                <p className="font-medium max-w-[200px] truncate">{course.title}</p>
                                {course.tags && course.tags.length > 0 && (
                                  <div className="flex gap-1 mt-1">
                                    {course.tags.slice(0, 2).map(tag => (
                                      <Badge key={tag} variant="outline" className="text-[10px] px-1">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{getInstructorName(course.instructorId)}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{course.lessons?.length || 0}</span>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={course.published ? "default" : "secondary"}
                              className={cn(
                                "gap-1",
                                course.published ? "bg-green-100 text-green-700 hover:bg-green-100" : ""
                              )}
                            >
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
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {course.accessRule || 'open'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{course.viewsCount || 0}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <Link href={`/courses/${course.id}`}>
                                  <DropdownMenuItem>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Preview
                                  </DropdownMenuItem>
                                </Link>
                                <Link href={`/instructor/course/${course.id}`}>
                                  <DropdownMenuItem>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Course
                                  </DropdownMenuItem>
                                </Link>
                                <DropdownMenuItem onClick={() => copyShareLink(course.id)}>
                                  <Share2 className="w-4 h-4 mr-2" />
                                  Share Link
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => publishCourseMutation.mutate({ id: course.id, published: !course.published })}>
                                  {course.published ? <XCircle className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                  {course.published ? "Unpublish" : "Publish"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSelectedCourse(course)}>
                                  <Settings className="w-4 h-4 mr-2" />
                                  Manage Course
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteCourseId(course.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
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
              /* Kanban View */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Draft Column */}
                <Card>
                  <CardHeader className="bg-amber-50 py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-amber-600" />
                        Draft
                      </CardTitle>
                      <Badge variant="secondary">{draftCourses.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
                    {draftCourses.map(course => (
                      <Card key={course.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedCourse(course)}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
                              {course.coverImage ? (
                                <img src={course.coverImage} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <BookOpen className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{course.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {getInstructorName(course.instructorId)}
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  {course.lessons?.length || 0} lessons
                                </span>
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {course.viewsCount || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {draftCourses.length === 0 && (
                      <p className="text-center text-muted-foreground py-8 text-sm">No draft courses</p>
                    )}
                  </CardContent>
                </Card>

                {/* Published Column */}
                <Card>
                  <CardHeader className="bg-green-50 py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Published
                      </CardTitle>
                      <Badge variant="secondary">{publishedCourses.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
                    {publishedCourses.map(course => (
                      <Card key={course.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedCourse(course)}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
                              {course.coverImage ? (
                                <img src={course.coverImage} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <BookOpen className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{course.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {getInstructorName(course.instructorId)}
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  {course.lessons?.length || 0} lessons
                                </span>
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {course.viewsCount || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {publishedCourses.length === 0 && (
                      <p className="text-center text-muted-foreground py-8 text-sm">No published courses</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ============ USERS TAB ============ */}
          <TabsContent value="users" className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="relative flex-1 md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search users by name or email..." 
                  className="pl-10"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{filteredUsers.length} users</span>
              </div>
            </div>

            {/* Users Table */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Enrollments</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={u.photoURL || undefined} />
                              <AvatarFallback>{(u.displayName || u.email || 'U').slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{u.displayName || 'Unknown'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{u.email}</TableCell>
                        <TableCell>
                          <Select
                            defaultValue={u.role}
                            onValueChange={(value) => 
                              updateRoleMutation.mutate({ 
                                userId: u.id, 
                                role: value as 'admin' | 'instructor' | 'learner' 
                              })
                            }
                            disabled={u.id === user?.id}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="learner">
                                <span className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-green-500" />
                                  Learner
                                </span>
                              </SelectItem>
                              <SelectItem value="instructor">
                                <span className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                                  Instructor
                                </span>
                              </SelectItem>
                              <SelectItem value="admin">
                                <span className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-red-500" />
                                  Admin
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{u.points || 0}</TableCell>
                        <TableCell>
                          {allEnrollments?.filter(e => e.userId === u.id).length || 0}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setSelectedUser(u)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                toast({ title: "Email", description: `Email: ${u.email}` });
                              }}>
                                <Mail className="w-4 h-4 mr-2" />
                                Contact
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteUserId(u.id)}
                                disabled={u.id === user?.id}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete User
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
          </TabsContent>

          {/* ============ REPORTING TAB ============ */}
          <TabsContent value="reporting" className="space-y-6">
            {/* Status Filter Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  reportingFilter === 'all' && "ring-2 ring-blue-500"
                )}
                onClick={() => setReportingFilter('all')}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totalParticipants}</p>
                      <p className="text-xs text-muted-foreground">Total Participants</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  reportingFilter === 'not-started' && "ring-2 ring-orange-500"
                )}
                onClick={() => setReportingFilter('not-started')}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{notStartedCount}</p>
                      <p className="text-xs text-muted-foreground">Yet to Start</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  reportingFilter === 'in-progress' && "ring-2 ring-purple-500"
                )}
                onClick={() => setReportingFilter('in-progress')}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                      <PlayCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{inProgressCount}</p>
                      <p className="text-xs text-muted-foreground">In Progress</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  reportingFilter === 'completed' && "ring-2 ring-green-500"
                )}
                onClick={() => setReportingFilter('completed')}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{completedCount}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-1 gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by name, email, or course..." 
                    className="pl-10"
                    value={reportingSearch}
                    onChange={(e) => setReportingSearch(e.target.value)}
                  />
                </div>
                {reportingFilter !== 'all' && (
                  <Badge 
                    variant="secondary" 
                    className="h-10 px-4 flex items-center gap-2 cursor-pointer"
                    onClick={() => setReportingFilter('all')}
                  >
                    {reportingFilter.replace('-', ' ')}
                    <XCircle className="w-3 h-3" />
                  </Badge>
                )}
              </div>
              <Button variant="outline" onClick={exportReportingCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
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
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : reportingData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                        No enrollment data found
                      </TableCell>
                    </TableRow>
                  ) : (
                    reportingData.map((enrollment, idx) => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-6 rounded bg-muted overflow-hidden flex-shrink-0">
                              {enrollment.course?.coverImage ? (
                                <img src={enrollment.course.coverImage} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <BookOpen className="w-3 h-3 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <span className="truncate max-w-[150px]">{enrollment.course?.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{enrollment.user?.displayName || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{enrollment.user?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {enrollment.startedAt ? new Date(enrollment.startedAt).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={enrollment.progress || 0} className="h-2 w-20" />
                            <span className="text-xs text-muted-foreground">{enrollment.progress || 0}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {enrollment.completedAt ? new Date(enrollment.completedAt).toLocaleDateString() : '-'}
                        </TableCell>
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
        </Tabs>
      </div>

      {/* ============ DIALOGS & SHEETS ============ */}

      {/* Create Course Dialog */}
      <Dialog open={isCreateCourseOpen} onOpenChange={setIsCreateCourseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <DialogDescription>Enter a name for your new course. You can add details later.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="courseName">Course Name</Label>
              <Input 
                id="courseName" 
                placeholder="e.g. Introduction to Web Development"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateCourseOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => createCourseMutation.mutate(newCourseName)}
              disabled={!newCourseName.trim() || createCourseMutation.isPending}
            >
              {createCourseMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Course Management Sheet */}
      <Sheet open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
        <SheetContent className="w-[500px] sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle>Manage Course</SheetTitle>
            <SheetDescription>
              Admin controls for this course
            </SheetDescription>
          </SheetHeader>
          
          {selectedCourse && (
            <ScrollArea className="h-[calc(100vh-150px)] pr-4 mt-6">
              <div className="space-y-6">
                {/* Course Preview */}
                <div className="flex items-start gap-4">
                  <div className="w-24 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {selectedCourse.coverImage ? (
                      <img src={selectedCourse.coverImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedCourse.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      by {getInstructorName(selectedCourse.instructorId)}
                    </p>
                    <Badge variant={selectedCourse.published ? "default" : "secondary"} className="mt-2">
                      {selectedCourse.published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Change Course Owner */}
                <div className="space-y-3">
                  <Label>Course Owner / Admin</Label>
                  <Select 
                    value={selectedCourse.instructorId}
                    onValueChange={(value) => {
                      updateCourseMutation.mutate({ id: selectedCourse.id, instructorId: value });
                      setSelectedCourse({ ...selectedCourse, instructorId: value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.filter(u => u.role === 'instructor' || u.role === 'admin').map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.displayName || u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Change the course responsible person</p>
                </div>

                {/* Visibility */}
                <div className="space-y-3">
                  <Label>Visibility</Label>
                  <Select 
                    value={selectedCourse.visibility || 'everyone'}
                    onValueChange={(value) => {
                      updateCourseMutation.mutate({ id: selectedCourse.id, visibility: value as any });
                      setSelectedCourse({ ...selectedCourse, visibility: value as any });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="everyone">
                        <span className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Everyone
                        </span>
                      </SelectItem>
                      <SelectItem value="signed_in">
                        <span className="flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Signed In Only
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Access Rule */}
                <div className="space-y-3">
                  <Label>Access Rule</Label>
                  <Select 
                    value={selectedCourse.accessRule || 'open'}
                    onValueChange={(value) => {
                      updateCourseMutation.mutate({ id: selectedCourse.id, accessRule: value as any });
                      setSelectedCourse({ ...selectedCourse, accessRule: value as any });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="invitation">On Invitation</SelectItem>
                      <SelectItem value="payment">On Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price (if payment) */}
                {selectedCourse.accessRule === 'payment' && (
                  <div className="space-y-3">
                    <Label>Price ($)</Label>
                    <Input 
                      type="number" 
                      value={selectedCourse.price || 0}
                      onChange={(e) => {
                        const price = Number(e.target.value);
                        updateCourseMutation.mutate({ id: selectedCourse.id, price });
                        setSelectedCourse({ ...selectedCourse, price });
                      }}
                    />
                  </div>
                )}

                <Separator />

                {/* Quick Actions */}
                <div className="space-y-3">
                  <Label>Quick Actions</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/courses/${selectedCourse.id}`}>
                      <Button variant="outline" className="w-full" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                    </Link>
                    <Link href={`/instructor/course/${selectedCourse.id}`}>
                      <Button variant="outline" className="w-full" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      size="sm"
                      onClick={() => copyShareLink(selectedCourse.id)}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    <Button 
                      variant={selectedCourse.published ? "secondary" : "default"}
                      className="w-full" 
                      size="sm"
                      onClick={() => {
                        publishCourseMutation.mutate({ id: selectedCourse.id, published: !selectedCourse.published });
                        setSelectedCourse({ ...selectedCourse, published: !selectedCourse.published });
                      }}
                    >
                      {selectedCourse.published ? (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Publish
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Danger Zone */}
                <div className="space-y-3">
                  <Label className="text-destructive">Danger Zone</Label>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => {
                      setDeleteCourseId(selectedCourse.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Course
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      {/* User Profile Sheet */}
      <Sheet open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>User Profile</SheetTitle>
            <SheetDescription>View user details and activity</SheetDescription>
          </SheetHeader>
          
          {selectedUser && (
            <div className="mt-6 space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedUser.photoURL || undefined} />
                  <AvatarFallback className="text-xl">
                    {(selectedUser.displayName || selectedUser.email || 'U').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedUser.displayName || 'User'}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  <Badge variant={getRoleBadgeVariant(selectedUser.role)} className="mt-2">
                    {selectedUser.role}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-2xl font-bold">{selectedUser.points || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Points</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-2xl font-bold">
                      {allEnrollments?.filter(e => e.userId === selectedUser.id).length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Enrollments</p>
                  </CardContent>
                </Card>
              </div>

              {/* Role Change */}
              <div className="space-y-3">
                <Label>Change Role</Label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(value) => {
                    updateRoleMutation.mutate({ 
                      userId: selectedUser.id, 
                      role: value as 'admin' | 'instructor' | 'learner' 
                    });
                    setSelectedUser({ ...selectedUser, role: value as any });
                  }}
                  disabled={selectedUser.id === user?.id}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="learner">Learner</SelectItem>
                    <SelectItem value="instructor">Instructor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Account Info */}
              <div className="space-y-2">
                <Label>Account Information</Label>
                <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">User ID</span>
                    <span className="font-mono text-xs">{selectedUser.id.slice(0, 12)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Joined</span>
                    <span>{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => setDeleteUserId(selectedUser.id)}
                  disabled={selectedUser.id === user?.id}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete User
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Platform Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Platform Settings</DialogTitle>
            <DialogDescription>Configure platform-wide settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Application Name</Label>
              <Input 
                value={settings.appName}
                onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Support Email</Label>
              <Input 
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Default Course Visibility</Label>
              <Select 
                value={settings.defaultVisibility}
                onValueChange={(v) => setSettings({ ...settings, defaultVisibility: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="signed_in">Signed In Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default Access Rule</Label>
              <Select 
                value={settings.defaultAccessRule}
                onValueChange={(v) => setSettings({ ...settings, defaultAccessRule: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="invitation">On Invitation</SelectItem>
                  <SelectItem value="payment">On Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Gamification</Label>
                <p className="text-xs text-muted-foreground">Points, badges, and leaderboards</p>
              </div>
              <Switch 
                checked={settings.enableGamification}
                onCheckedChange={(v) => setSettings({ ...settings, enableGamification: v })}
              />
            </div>

            <div className="space-y-2">
              <Label>Points Per Lesson Completion</Label>
              <Input 
                type="number"
                value={settings.pointsPerLesson}
                onChange={(e) => setSettings({ ...settings, pointsPerLesson: Number(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              toast({ title: "Settings Saved", description: "Platform settings updated successfully" });
              setIsSettingsOpen(false);
            }}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete User
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone
              and will remove all their data including enrollments and progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteUserId && deleteUserMutation.mutate(deleteUserId)}
            >
              {deleteUserMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Course Confirmation */}
      <AlertDialog open={!!deleteCourseId} onOpenChange={() => setDeleteCourseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Course
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this course? This action cannot be undone
              and will remove all lessons, quizzes, and student enrollments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteCourseId && deleteCourseMutation.mutate(deleteCourseId)}
            >
              {deleteCourseMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
