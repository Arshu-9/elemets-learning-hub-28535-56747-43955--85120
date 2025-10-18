import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BookOpen, ArrowLeft, Users } from "lucide-react";
import { Link } from "react-router-dom";

interface Enrollment {
  id: string;
  course_id: string;
  courses: {
    id: string;
    title: string;
    description: string | null;
    duration: string | null;
    profiles: { full_name: string };
  };
}

const MyCourses = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrollments();
  }, [user]);

  const fetchEnrollments = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("enrollments")
      .select(`
        id,
        course_id,
        courses (
          id,
          title,
          description,
          duration,
          profiles!courses_teacher_id_fkey(full_name)
        )
      `)
      .eq("student_id", user.id);

    if (error) {
      toast.error("Failed to load your courses");
    } else {
      setEnrollments(data || []);
    }
    setLoading(false);
  };

  const handleUnenroll = async (enrollmentId: string) => {
    const { error } = await supabase
      .from("enrollments")
      .delete()
      .eq("id", enrollmentId);

    if (error) {
      toast.error("Failed to unenroll");
    } else {
      toast.success("Unenrolled successfully");
      fetchEnrollments();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold mt-2">My Courses</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">You haven't enrolled in any courses yet</p>
            <Link to="/courses">
              <Button>Browse Courses</Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enrollment) => (
              <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 w-fit">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="mt-4">{enrollment.courses.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {enrollment.courses.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Instructor: {enrollment.courses.profiles?.full_name}
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/courses/${enrollment.course_id}`} className="flex-1">
                      <Button className="w-full" variant="default">
                        View Course
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => handleUnenroll(enrollment.id)}
                    >
                      Unenroll
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyCourses;
