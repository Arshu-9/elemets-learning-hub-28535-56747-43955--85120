import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, BookOpen, Users, FileText, Award, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [stats, setStats] = useState({ courses: 0, assignments: 0, enrollments: 0 });

  useEffect(() => {
  const fetchUserRole = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single() as any;
    
    if (data) setUserRole(data.role);
  };

    const fetchStats = async () => {
      if (!user) return;

      if (userRole === "teacher") {
        const { count: coursesCount } = await supabase
          .from("courses")
          .select("*", { count: "exact", head: true })
          .eq("teacher_id", user.id) as any;
        
        const { count: assignmentsCount } = await supabase
          .from("assignments")
          .select("*, courses!inner(*)", { count: "exact", head: true })
          .eq("courses.teacher_id", user.id) as any;

        setStats({ courses: coursesCount || 0, assignments: assignmentsCount || 0, enrollments: 0 });
      } else {
        const { count: enrollmentsCount } = await supabase
          .from("enrollments")
          .select("*", { count: "exact", head: true })
          .eq("student_id", user.id) as any;

        setStats({ courses: 0, assignments: 0, enrollments: enrollmentsCount || 0 });
      }
    };

    fetchUserRole();
    if (userRole) fetchStats();
  }, [user, userRole]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Learning Hub
          </h1>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome Back!</h2>
          <p className="text-muted-foreground">
            {userRole === "teacher" ? "Manage your courses and students" : "Continue your learning journey"}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {userRole === "teacher" ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">My Courses</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.courses}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Assignments</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.assignments}</div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.enrollments}</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                {userRole === "teacher" ? "Manage your teaching content" : "Explore learning resources"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {userRole === "teacher" ? (
                <>
                  <Link to="/courses" className="block">
                    <Button className="w-full justify-start" variant="outline">
                      <BookOpen className="w-4 h-4 mr-2" />
                      View All Courses
                    </Button>
                  </Link>
                  <Link to="/courses/create" className="block">
                    <Button className="w-full justify-start" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Course
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/courses" className="block">
                    <Button className="w-full justify-start" variant="outline">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Browse Courses
                    </Button>
                  </Link>
                  <Link to="/my-courses" className="block">
                    <Button className="w-full justify-start" variant="outline">
                      <Users className="w-4 h-4 mr-2" />
                      My Courses
                    </Button>
                  </Link>
                  <Link to="/my-grades" className="block">
                    <Button className="w-full justify-start" variant="outline">
                      <Award className="w-4 h-4 mr-2" />
                      My Grades
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

