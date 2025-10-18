import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Users, FileText, Award } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string | null;
  duration: string | null;
  teacher_id: string;
  profiles: { full_name: string };
}

interface Student {
  id: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
}

const CourseDetail = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    fetchCourse();
    fetchUserRole();
    fetchStudents();
    fetchAssignments();
  }, [courseId]);

  const fetchCourse = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select(`
        *,
        profiles!courses_teacher_id_fkey(full_name)
      `)
      .eq("id", courseId)
      .single();

    if (error) {
      toast.error("Failed to load course");
    } else {
      setCourse(data);
    }
  };

  const fetchUserRole = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    if (data) setUserRole(data.role);
  };

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from("enrollments")
      .select(`
        id,
        profiles!enrollments_student_id_fkey(full_name, email)
      `)
      .eq("course_id", courseId);

    if (!error && data) {
      setStudents(data as any);
    }
  };

  const fetchAssignments = async () => {
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("course_id", courseId)
      .order("due_date", { ascending: true });

    if (!error && data) {
      setAssignments(data);
    }
  };

  if (!course) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link to="/courses" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Courses
          </Link>
          <h1 className="text-2xl font-bold mt-2">{course.title}</h1>
          <p className="text-muted-foreground">Instructor: {course.profiles?.full_name}</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            {userRole === "teacher" && course.teacher_id === user?.id && (
              <TabsTrigger value="students">Students</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Course Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{course.description || "No description available"}</p>
                <div className="mt-4 text-sm text-muted-foreground">
                  Duration: {course.duration || "Self-paced"}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            {assignments.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No assignments yet
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {assignments.map((assignment) => (
                  <Card key={assignment.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        {assignment.title}
                      </CardTitle>
                      <CardDescription>
                        {assignment.description || "No description"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : "No due date"}
                        </span>
                        {userRole === "student" && (
                          <Link to={`/assignments/${assignment.id}/submit`}>
                            <Button size="sm">Submit</Button>
                          </Link>
                        )}
                        {userRole === "teacher" && course.teacher_id === user?.id && (
                          <Link to={`/assignments/${assignment.id}/submissions`}>
                            <Button size="sm" variant="outline">View Submissions</Button>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {userRole === "teacher" && course.teacher_id === user?.id && (
            <TabsContent value="students" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Enrolled Students ({students.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {students.length === 0 ? (
                    <p className="text-muted-foreground">No students enrolled yet</p>
                  ) : (
                    <div className="space-y-2">
                      {students.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{student.profiles?.full_name}</div>
                            <div className="text-sm text-muted-foreground">{student.profiles?.email}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default CourseDetail;
