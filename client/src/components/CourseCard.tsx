import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { type Course } from "@shared/types";
import { Clock, Users, ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface CourseCardProps {
  course: Course;
  progress?: number;
  isEnrolled?: boolean;
}

export function CourseCard({ course, progress, isEnrolled }: CourseCardProps) {
  // Using a consistent placeholder if no image provided
  const coverImage = course.coverImage || "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&q=80";

  return (
    <Card className="group overflow-hidden border-border/50 bg-card hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col h-full">
      {/* Image Container with Zoom Effect */}
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={coverImage} 
          alt={course.title}
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" 
        />
        <div className="absolute top-2 right-2 flex gap-1">
          <Badge variant={course.price ? "default" : "secondary"} className="shadow-sm">
            {course.price ? `$${(course.price / 100).toFixed(2)}` : "Free"}
          </Badge>
        </div>
      </div>

      <CardHeader className="p-5 pb-2">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-display font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-2 h-10">
          {course.description}
        </p>
      </CardHeader>

      <CardContent className="p-5 pt-2 flex-grow">
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>Active</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Self-paced</span>
          </div>
        </div>

        {isEnrolled && progress !== undefined && (
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardContent>

      <CardFooter className="p-5 pt-0 mt-auto">
        <Link href={isEnrolled ? `/learn/${course.id}` : `/courses/${course.id}`} className="w-full">
          <Button 
            className="w-full group/btn" 
            variant={isEnrolled ? "secondary" : "default"}
          >
            {isEnrolled ? "Continue Learning" : "View Course"}
            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
