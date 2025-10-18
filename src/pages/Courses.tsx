import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, BookOpen, Clock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface Course {
  id: string;
  title: string;
  description: string | null;
  duration: string | null;
  teacher_id: string;
  profiles: { full_name: string };
}

const Courses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", duration: "" });

  useEffect(() => {
    fetchUserRole();
    fetchCourses();
  }, []);

  const fetchUserRole = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single() as any;
    if (data) setUserRole(data.role);
  };

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select(`
        *,
        profiles!courses_teacher_id_fkey(full_name)
      `)
      .order("created_at", { ascending: false }) as any;

    if (error) {
      toast.error("Failed to load courses");
    } else {
      setCourses(data || []);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase.from("courses").insert({
      title: formData.title,
      description: formData.description,
      duration: formData.duration,
      teacher_id: user.id,
    } as any) as any;

    if (error) {
      toast.error("Failed to create course");
    } else {
      toast.success("Course created successfully!");
      setFormData({ title: "", description: "", duration: "" });
      setOpen(false);
      fetchCourses();
    }
  };

  const handleEnroll = async (courseId: string) => {
    if (!user) return;

    const { error } = await supabase.from("enrollments").insert({
      course_id: courseId,
      student_id: user.id,
    } as any) as any;

    if (error) {
      toast.error("Failed to enroll");
    } else {
      toast.success("Enrolled successfully!");
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
          <div className="flex justify-between items-center mt-2">
            <h1 className="text-2xl font-bold">Courses</h1>
            {userRole === "teacher" && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Course
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Course</DialogTitle>
                    <DialogDescription>Add a new course to your teaching portfolio</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateCourse} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Course Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration</Label>
                      <Input
                        id="duration"
                        placeholder="e.g., 8 weeks"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      />
                    </div>
                    <Button type="submit" className="w-full">Create Course</Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <CardTitle className="mt-4">{course.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {course.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    {course.duration || "Self-paced"}
                  </div>
                  <div>Instructor: {course.profiles?.full_name}</div>
                </div>
                <Link to={`/courses/${course.id}`} className="block mt-4">
                  <Button className="w-full" variant="outline">
                    View Course
                  </Button>
                </Link>
                {userRole === "student" && course.teacher_id !== user?.id && (
                  <Button
                    onClick={() => handleEnroll(course.id)}
                    className="w-full mt-2"
                    size="sm"
                  >
                    Enroll
                  </Button>
                )}
                {userRole === "teacher" && course.teacher_id === user?.id && (
                  <Link to={`/courses/${course.id}/manage`} className="block mt-2">
                    <Button className="w-full" size="sm">
                      Manage
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        {courses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No courses available yet</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Courses;
