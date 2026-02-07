import { useAuth } from "@/hooks/use-auth";
import { Link, Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/CourseCard";
import { useCourses } from "@/hooks/use-courses";
import { ArrowRight, BookOpen, CheckCircle, Trophy, Users } from "lucide-react";
import { Navigation } from "@/components/Navigation";

export default function Home() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: courses, isLoading: coursesLoading } = useCourses();

  // Show only published courses and limit to 3 for featured section
  const featuredCourses = courses?.filter(c => c.published).slice(0, 3);

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-[#153a7a] to-secondary text-white pt-24 pb-32">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-20 left-10 w-64 h-64 bg-accent rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-highlight rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8 animate-in slide-in-from-bottom-8 duration-700">
            <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight tracking-tight text-white">
              Unlock Your <span className="text-highlight">Potential</span> With Expert-Led Courses
            </h1>
            <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
              Join thousands of learners on LearnSphere. Master new skills in programming, design, business, and more with our interactive platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/courses">
                <Button size="lg" className="h-14 px-8 text-lg bg-highlight text-primary hover:bg-white hover:text-primary transition-all font-semibold rounded-xl">
                  Browse Courses
                  <BookOpen className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              {!isAuthenticated && (
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="h-14 px-8 text-lg border-white/30 text-white bg-transparent hover:bg-white/10 rounded-xl"
                  onClick={() => window.location.href = '/auth'}
                >
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center justify-center gap-4 p-6 rounded-2xl bg-muted/30">
              <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <Users className="w-8 h-8" />
              </div>
              <div className="text-left">
                <p className="text-3xl font-bold text-foreground">10k+</p>
                <p className="text-muted-foreground">Active Learners</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 p-6 rounded-2xl bg-muted/30">
              <div className="p-3 bg-accent/10 text-accent rounded-xl">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="text-left">
                <p className="text-3xl font-bold text-foreground">95%</p>
                <p className="text-muted-foreground">Completion Rate</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 p-6 rounded-2xl bg-muted/30">
              <div className="p-3 bg-secondary/10 text-secondary rounded-xl">
                <Trophy className="w-8 h-8" />
              </div>
              <div className="text-left">
                <p className="text-3xl font-bold text-foreground">500+</p>
                <p className="text-muted-foreground">Courses Available</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-4">Featured Courses</h2>
              <p className="text-muted-foreground max-w-lg">
                Explore our highest-rated courses handpicked for you. Start your learning journey today.
              </p>
            </div>
            <Link href="/courses">
              <Button variant="ghost" className="hidden md:flex gap-2">
                View All Courses <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {coursesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-96 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredCourses?.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
          
          <div className="mt-12 text-center md:hidden">
            <Link href="/courses">
              <Button variant="outline" className="w-full">
                View All Courses
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="bg-primary rounded-3xl p-12 md:p-20 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-highlight/10 rounded-full blur-3xl -ml-10 -mb-10" />
            
            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <h2 className="text-4xl md:text-5xl font-display font-bold text-white">Ready to start learning?</h2>
              <p className="text-lg text-blue-100">
                Create an account today and get unlimited access to our entire library of courses.
              </p>
              <Button 
                size="lg" 
                className="h-14 px-8 text-lg bg-white text-primary hover:bg-gray-100 font-semibold rounded-xl shadow-lg shadow-black/20"
                onClick={() => window.location.href = isAuthenticated ? '/courses' : '/auth'}
              >
                {isAuthenticated ? "Go to Dashboard" : "Sign Up for Free"}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
