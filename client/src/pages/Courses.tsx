import { Navigation } from "@/components/Navigation";
import { CourseCard } from "@/components/CourseCard";
import { useCourses } from "@/hooks/use-courses";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce"; // We need to create this simple hook

export default function Courses() {
  const [search, setSearch] = useState("");
  // Simple debounce implementation inside component for now if hook doesn't exist yet
  // Ideally use useDebounce hook
  
  const { data: courses, isLoading } = useCourses({ search: search });

  // Filter only published courses for public catalog
  const publishedCourses = courses?.filter(c => c.published);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navigation />
      
      <div className="bg-primary/5 py-12 mb-12 border-b">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-display font-bold mb-6">Course Catalog</h1>
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input 
              placeholder="Search for courses..." 
              className="pl-12 h-14 rounded-xl text-lg bg-white border-transparent shadow-sm focus:border-primary focus:ring-4 focus:ring-primary/10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : publishedCourses?.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-bold text-muted-foreground">No courses found matching "{search}"</h3>
            <p className="mt-2 text-muted-foreground">Try adjusting your search terms</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {publishedCourses?.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
