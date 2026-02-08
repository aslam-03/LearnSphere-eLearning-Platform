import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/use-auth";
import { useMyEnrollments } from "@/hooks/use-enrollments";
import { useUserBadge } from "@/hooks/use-gamification";
import { CourseCard } from "@/components/CourseCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  BookOpen, 
  GraduationCap, 
  Trophy, 
  Search, 
  Award
} from "lucide-react";
import { Link, Redirect } from "wouter";
import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";

// Badge level configuration as per requirements
const BADGE_LEVELS = [
  { name: 'Newbie', points: 20, icon: '🌱', color: 'bg-gray-100 text-gray-700' },
  { name: 'Explorer', points: 40, icon: '🔍', color: 'bg-blue-100 text-blue-700' },
  { name: 'Achiever', points: 60, icon: '⭐', color: 'bg-yellow-100 text-yellow-700' },
  { name: 'Specialist', points: 80, icon: '🎯', color: 'bg-green-100 text-green-700' },
  { name: 'Expert', points: 100, icon: '👑', color: 'bg-purple-100 text-purple-700' },
  { name: 'Master', points: 120, icon: '🏆', color: 'bg-amber-100 text-amber-700' },
];

function getBadgeForPoints(points: number) {
  let currentBadge = { name: 'Beginner', points: 0, icon: '🌟', color: 'bg-slate-100 text-slate-700' };
  let nextBadge: typeof BADGE_LEVELS[0] | null = BADGE_LEVELS[0];
  
  for (let i = BADGE_LEVELS.length - 1; i >= 0; i--) {
    if (points >= BADGE_LEVELS[i].points) {
      currentBadge = BADGE_LEVELS[i];
      nextBadge = BADGE_LEVELS[i + 1] || null;
      break;
    }
  }
  
  return { currentBadge, nextBadge };
}

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: enrollments, isLoading: enrollmentsLoading } = useMyEnrollments();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  if (authLoading) return null;
  if (!isAuthenticated) return <Redirect to="/auth" />;

  const completedCount = enrollments?.filter(e => e.status === "completed").length || 0;
  const inProgressCount = enrollments?.filter(e => e.status === "active").length || 0;
  const totalEnrolled = enrollments?.length || 0;
  
  const userPoints = user?.points || 0;
  const { currentBadge, nextBadge } = getBadgeForPoints(userPoints);
  const progressToNextBadge = nextBadge 
    ? Math.min(100, Math.max(0, ((userPoints - (currentBadge?.points || 0)) / (nextBadge.points - (currentBadge?.points || 0))) * 100))
    : 100;

  // Filter enrollments based on search
  const filteredEnrollments = enrollments?.filter(enrollment => {
    if (!debouncedSearch) return true;
    const search = debouncedSearch.toLowerCase();
    return enrollment.course?.title?.toLowerCase().includes(search) ||
           enrollment.course?.description?.toLowerCase().includes(search);
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <header className="mb-8">
              <h1 className="text-3xl font-display font-bold">My Courses</h1>
              <p className="text-muted-foreground mt-2">Continue your learning journey</p>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className="p-3 bg-primary/10 text-primary rounded-xl">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">In Progress</p>
                    <p className="text-2xl font-bold">{inProgressCount}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 text-green-600 rounded-xl">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Completed</p>
                    <p className="text-2xl font-bold">{completedCount}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Total Points</p>
                    <p className="text-2xl font-bold">{userPoints}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search courses by name..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Course List */}
            <div className="space-y-6">
              {enrollmentsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2].map(i => <div key={i} className="h-80 bg-muted rounded-2xl animate-pulse" />)}
                </div>
              ) : filteredEnrollments?.length === 0 ? (
                <div className="bg-muted/30 border-2 border-dashed border-border rounded-2xl p-12 text-center">
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="bg-background w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <BookOpen className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold">
                      {searchQuery ? "No courses found" : "Start your learning journey"}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? "Try a different search term" 
                        : "Explore our catalog and find your next skill to master."}
                    </p>
                    {!searchQuery && (
                      <Link href="/courses">
                        <Button className="mt-4">Browse Courses</Button>
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredEnrollments?.map((enrollment) => (
                    <CourseCard 
                      key={enrollment.courseId} 
                      course={enrollment.course} 
                      isEnrolled={true}
                      progress={enrollment.progress || 0}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader className="text-center pb-2">
                <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-primary/20">
                  <AvatarImage src={user?.photoURL || undefined} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {(user?.displayName || user?.email || 'U').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">{user?.displayName || 'Learner'}</CardTitle>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Badge */}
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10">
                  <span className="text-4xl">{currentBadge.icon}</span>
                  <p className="font-bold text-lg mt-2">{currentBadge.name}</p>
                  <Badge className={currentBadge.color}>{userPoints} points</Badge>
                </div>

                {/* Progress to Next Badge */}
                {nextBadge && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Next: {nextBadge.icon} {nextBadge.name}</span>
                    </div>
                    <Progress value={progressToNextBadge} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">
                      {nextBadge.points - userPoints} points to go
                    </p>
                  </div>
                )}

                {/* Badge Levels */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Badge Levels
                  </h4>
                  <div className="space-y-1.5">
                    {BADGE_LEVELS.map((badge) => (
                      <div 
                        key={badge.name} 
                        className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                          userPoints >= badge.points 
                            ? 'bg-primary/10 text-primary' 
                            : 'bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{badge.icon}</span>
                          <span>{badge.name}</span>
                        </span>
                        <span className="text-xs">{badge.points} pts</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{totalEnrolled}</p>
                    <p className="text-xs text-muted-foreground">Enrolled</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
