import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Users, FileText } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
}

interface Student {
  student_id: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
}

const ManageCourse = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single() as any;

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch enrollments
      const { data: enrollmentData } = await supabase
        .from("enrollments")
        .select("student_id")
        .eq("course_id", courseId) as any;

      // Fetch profiles for enrolled students
      const studentIds = enrollmentData?.map((e: any) => e.student_id) || [];
      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", studentIds) as any;

      // Combine data
      const studentsData = enrollmentData?.map((e: any) => ({
        student_id: e.student_id,
        profiles: profileData?.find((p: any) => p.user_id === e.student_id) || { full_name: '', email: '' }
      })) || [];

      setStudents(studentsData);

      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("assignments")
        .select("*")
        .eq("course_id", courseId)
        .order("created_at", { ascending: false }) as any;

      if (assignmentsError) throw assignmentsError;
      setAssignments(assignmentsData || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from("assignments")
        .insert({
          course_id: courseId,
          title: assignmentTitle,
          description: assignmentDescription,
          due_date: dueDate || null,
        } as any) as any;

      if (error) throw error;

      toast.success("Assignment created successfully!");
      setShowAssignmentDialog(false);
      setAssignmentTitle("");
      setAssignmentDescription("");
      setDueDate("");
      fetchCourseData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!course) {
    return <div className="flex items-center justify-center min-h-screen">Course not found</div>;
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-subtle)" }}>
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold">{course.title}</h1>
              <p className="text-sm text-muted-foreground">{course.duration}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList>
            <TabsTrigger value="students">
              <Users className="w-4 h-4 mr-2" />
              Students
            </TabsTrigger>
            <TabsTrigger value="assignments">
              <FileText className="w-4 h-4 mr-2" />
              Assignments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Enrolled Students ({students.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No students enrolled yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {students.map((student) => (
                      <div
                        key={student.student_id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{student.profiles.full_name}</p>
                          <p className="text-sm text-muted-foreground">{student.profiles.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Assignments ({assignments.length})</CardTitle>
                <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
                  <DialogTrigger asChild>
                    <Button style={{ background: "var(--gradient-primary)" }}>
                      <Plus className="w-4 h-4 mr-2" />
                      New Assignment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Assignment</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateAssignment} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="assignmentTitle">Title *</Label>
                        <Input
                          id="assignmentTitle"
                          value={assignmentTitle}
                          onChange={(e) => setAssignmentTitle(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="assignmentDescription">Description</Label>
                        <Textarea
                          id="assignmentDescription"
                          value={assignmentDescription}
                          onChange={(e) => setAssignmentDescription(e.target.value)}
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input
                          id="dueDate"
                          type="datetime-local"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                        />
                      </div>
                      <Button type="submit" className="w-full" style={{ background: "var(--gradient-primary)" }}>
                        Create Assignment
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {assignments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No assignments created yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="p-4 border rounded-lg hover:shadow-[var(--shadow-card)] transition-shadow cursor-pointer"
                        onClick={() => navigate(`/assignments/${assignment.id}/submissions`)}
                      >
                        <h3 className="font-medium">{assignment.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{assignment.description}</p>
                        {assignment.due_date && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Due: {new Date(assignment.due_date).toLocaleString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ManageCourse;
