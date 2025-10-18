import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, FileText, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  teacher_id: string;
}

interface Enrollment {
  course_id: string;
  courses: Course;
}

export const StudentDashboard = ({ userId }: { userId: string }) => {
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, [userId]);

  const fetchCourses = async () => {
    try {
      const { data: enrolled, error: enrolledError } = await supabase
        .from("enrollments")
        .select("course_id, courses(*)")
        .eq("student_id", userId) as any;

      if (enrolledError) throw enrolledError;

      const { data: allCourses, error: coursesError } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false }) as any;

      if (coursesError) throw coursesError;

      const enrolledIds = enrolled?.map((e: any) => e.course_id) || [];
      const available = allCourses?.filter((c: any) => !enrolledIds.includes(c.id)) || [];

      setEnrolledCourses(enrolled || []);
      setAvailableCourses(available);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const enrollInCourse = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from("enrollments")
        .insert({ course_id: courseId, student_id: userId } as any) as any;

      if (error) throw error;

      toast.success("Enrolled successfully!");
      fetchCourses();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <section>
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Award className="w-12 h-12 text-primary" />
                <div>
                  <h3 className="text-xl font-bold">My Grades</h3>
                  <p className="text-sm text-muted-foreground">View your performance and feedback</p>
                </div>
              </div>
              <Button
                onClick={() => navigate("/my-grades")}
                style={{ background: "var(--gradient-primary)" }}
              >
                View Grades
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">My Courses</h2>
        </div>
        
        {enrolledCourses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No enrolled courses yet. Browse available courses below to get started!
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((enrollment) => (
              <Card 
                key={enrollment.course_id} 
                className="hover:shadow-[var(--shadow-card)] transition-shadow cursor-pointer"
                onClick={() => navigate(`/courses/${enrollment.course_id}`)}
              >
                <CardHeader>
                  <CardTitle>{enrollment.courses.title}</CardTitle>
                  <CardDescription>{enrollment.courses.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{enrollment.courses.duration}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-6 h-6 text-accent" />
          <h2 className="text-2xl font-bold">Available Courses</h2>
        </div>
        
        {availableCourses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              All courses enrolled! Check back later for new courses.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-[var(--shadow-card)] transition-shadow">
                <CardHeader>
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{course.duration}</span>
                  </div>
                  <Button
                    onClick={() => enrollInCourse(course.id)}
                    className="w-full"
                    style={{ background: "var(--gradient-accent)" }}
                  >
                    Enroll Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
