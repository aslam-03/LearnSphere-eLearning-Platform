import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/use-auth";
import { useReportingOverview, useReportingDetails } from "@/hooks/use-reporting";
import { useCourses } from "@/hooks/use-courses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Redirect } from "wouter";
import {
  Users,
  BookOpen,
  CheckCircle,
  TrendingUp,
  Search,
  Loader2,
  Download,
  Settings2,
  Clock,
  PlayCircle,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

const ALL_COLUMNS = [
  { id: "name", label: "Name", default: true },
  { id: "email", label: "Email", default: true },
  { id: "enrolled", label: "Enrolled Courses", default: true },
  { id: "completed", label: "Completed", default: true },
  { id: "progress", label: "Progress", default: true },
  { id: "points", label: "Points", default: false },
  { id: "badge", label: "Badge", default: false },
  { id: "lastActive", label: "Last Active", default: false },
];

type StatusFilter = "all" | "not-started" | "in-progress" | "completed";

export default function Reporting() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: overview, isLoading: overviewLoading } = useReportingOverview();
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    ALL_COLUMNS.filter(c => c.default).map(c => c.id)
  );
  
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { data: courses } = useCourses(user?.id);
  
  const { data: details, isLoading: detailsLoading } = useReportingDetails(
    selectedCourse === "all" ? undefined : selectedCourse
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return <Redirect to="/auth" />;
  if (user?.role !== "instructor" && user?.role !== "admin") {
    return <Redirect to="/" />;
  }

  // Calculate status counts
  const allUsers = details?.users || [];
  const notStartedCount = allUsers.filter(u => (u.averageProgress || 0) === 0 && (u.enrolledCourses || 0) > 0).length;
  const inProgressCount = allUsers.filter(u => (u.averageProgress || 0) > 0 && (u.averageProgress || 0) < 100).length;
  const completedCount = allUsers.filter(u => (u.completedCourses || 0) > 0 && u.averageProgress === 100).length;

  // Apply all filters
  const filteredUsers = allUsers.filter(user => {
    // Search filter
    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase();
      if (
        !user.name?.toLowerCase().includes(search) &&
        !user.email?.toLowerCase().includes(search)
      ) {
        return false;
      }
    }
    
    // Status filter
    if (statusFilter !== "all") {
      const progress = user.averageProgress || 0;
      const completed = user.completedCourses || 0;
      
      switch (statusFilter) {
        case "not-started":
          if (progress !== 0) return false;
          break;
        case "in-progress":
          if (progress === 0 || progress === 100) return false;
          break;
        case "completed":
          if (completed === 0 || progress !== 100) return false;
          break;
      }
    }
    
    return true;
  });

  const toggleColumn = (columnId: string) => {
    if (visibleColumns.includes(columnId)) {
      setVisibleColumns(visibleColumns.filter(id => id !== columnId));
    } else {
      setVisibleColumns([...visibleColumns, columnId]);
    }
  };

  const exportCSV = () => {
    const headers = ALL_COLUMNS.filter(c => visibleColumns.includes(c.id));
    const csvRows = [headers.map(h => h.label).join(",")];
    
    filteredUsers.forEach(user => {
      const row = headers.map(h => {
        switch (h.id) {
          case "name": return user.name || "";
          case "email": return user.email || "";
          case "enrolled": return user.enrolledCourses || 0;
          case "completed": return user.completedCourses || 0;
          case "progress": return `${user.averageProgress || 0}%`;
          case "points": return user.totalPoints || 0;
          case "badge": return user.currentBadge || "None";
          case "lastActive": return user.lastActive ? new Date(user.lastActive).toLocaleDateString() : "N/A";
          default: return "";
        }
      });
      csvRows.push(row.join(","));
    });
    
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `learners-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusCards = [
    { 
      id: "all" as StatusFilter, 
      label: "Total Participants", 
      count: allUsers.length,
      icon: Users,
      color: "text-blue-600 bg-blue-100",
      borderColor: "border-blue-500"
    },
    { 
      id: "not-started" as StatusFilter, 
      label: "Yet to Start", 
      count: notStartedCount,
      icon: Clock,
      color: "text-orange-600 bg-orange-100",
      borderColor: "border-orange-500"
    },
    { 
      id: "in-progress" as StatusFilter, 
      label: "In Progress", 
      count: inProgressCount,
      icon: PlayCircle,
      color: "text-purple-600 bg-purple-100",
      borderColor: "border-purple-500"
    },
    { 
      id: "completed" as StatusFilter, 
      label: "Completed", 
      count: completedCount,
      icon: CheckCircle,
      color: "text-green-600 bg-green-100",
      borderColor: "border-green-500"
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Reporting Dashboard</h1>
          <p className="text-muted-foreground">
            Track learner progress and engagement across your courses
          </p>
        </div>

        {/* Status Filter Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statusCards.map((card) => {
            const Icon = card.icon;
            const isActive = statusFilter === card.id;
            return (
              <Card 
                key={card.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isActive ? `ring-2 ring-offset-2 ${card.borderColor}` : ''
                }`}
                onClick={() => setStatusFilter(card.id)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${card.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{card.count}</p>
                      <p className="text-xs text-muted-foreground">{card.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-blue-700 font-medium">Total Courses</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {overviewLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : overview?.totalCourses || 0}
                  </p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-green-700 font-medium">Completion Rate</p>
                  <p className="text-2xl font-bold text-green-900">
                    {overviewLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `${overview?.completionRate || 0}%`}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-purple-700 font-medium">Avg. Progress</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {overviewLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `${overview?.averageProgress || 0}%`}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
              <Progress value={overview?.averageProgress || 0} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-amber-700 font-medium">Active Enrollments</p>
                  <p className="text-2xl font-bold text-amber-900">
                    {overviewLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : overview?.activeEnrollments || 0}
                  </p>
                </div>
                <Users className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Learners Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle>Learner Details</CardTitle>
                  {statusFilter !== "all" && (
                    <Badge variant="secondary" className="capitalize">
                      {statusFilter.replace("-", " ")}
                      <button 
                        className="ml-1 hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setStatusFilter("all"); }}
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  {filteredUsers.length} learner{filteredUsers.length !== 1 ? 's' : ''} 
                  {statusFilter !== "all" && ` • Filtered by: ${statusFilter.replace("-", " ")}`}
                </CardDescription>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search learners..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-[200px]"
                  />
                </div>
                
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses?.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Settings2 className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {ALL_COLUMNS.map(column => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        checked={visibleColumns.includes(column.id)}
                        onCheckedChange={() => toggleColumn(column.id)}
                      >
                        {column.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="outline" onClick={exportCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {detailsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery ? "No learners match your search" : "No learners enrolled yet"}
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {visibleColumns.includes("name") && (
                        <TableHead>Name</TableHead>
                      )}
                      {visibleColumns.includes("email") && (
                        <TableHead>Email</TableHead>
                      )}
                      {visibleColumns.includes("enrolled") && (
                        <TableHead className="text-center">Enrolled</TableHead>
                      )}
                      {visibleColumns.includes("completed") && (
                        <TableHead className="text-center">Completed</TableHead>
                      )}
                      {visibleColumns.includes("progress") && (
                        <TableHead>Progress</TableHead>
                      )}
                      {visibleColumns.includes("points") && (
                        <TableHead className="text-center">Points</TableHead>
                      )}
                      {visibleColumns.includes("badge") && (
                        <TableHead>Badge</TableHead>
                      )}
                      {visibleColumns.includes("lastActive") && (
                        <TableHead>Last Active</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((learner) => (
                      <TableRow key={learner.id}>
                        {visibleColumns.includes("name") && (
                          <TableCell className="font-medium">
                            {learner.name || "Unknown"}
                          </TableCell>
                        )}
                        {visibleColumns.includes("email") && (
                          <TableCell className="text-muted-foreground">
                            {learner.email}
                          </TableCell>
                        )}
                        {visibleColumns.includes("enrolled") && (
                          <TableCell className="text-center">
                            {learner.enrolledCourses || 0}
                          </TableCell>
                        )}
                        {visibleColumns.includes("completed") && (
                          <TableCell className="text-center">
                            {learner.completedCourses || 0}
                          </TableCell>
                        )}
                        {visibleColumns.includes("progress") && (
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-[120px]">
                              <Progress 
                                value={learner.averageProgress || 0} 
                                className="h-2 flex-1" 
                              />
                              <span className="text-sm text-muted-foreground w-10">
                                {learner.averageProgress || 0}%
                              </span>
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.includes("points") && (
                          <TableCell className="text-center">
                            {learner.totalPoints || 0}
                          </TableCell>
                        )}
                        {visibleColumns.includes("badge") && (
                          <TableCell>
                            {learner.currentBadge ? (
                              <Badge variant="secondary">
                                {learner.currentBadge}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                        )}
                        {visibleColumns.includes("lastActive") && (
                          <TableCell className="text-muted-foreground">
                            {learner.lastActive
                              ? new Date(learner.lastActive).toLocaleDateString()
                              : "N/A"}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
