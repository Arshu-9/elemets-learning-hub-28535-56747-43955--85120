import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, Award, TrendingUp } from "lucide-react";

interface GradeData {
  id: string;
  grade: number;
  feedback: string | null;
  graded_at: string;
  submissions: {
    assignments: {
      title: string;
      courses: {
        title: string;
      };
    };
  };
}

const MyGrades = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState<GradeData[]>([]);
  const [averageGrade, setAverageGrade] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrades();
  }, [user]);

  const fetchGrades = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("grades")
      .select(`
        *,
        submissions!inner(
          student_id,
          assignments!inner(
            title,
            courses!inner(
              title
            )
          )
        )
      `)
      .eq("submissions.student_id", user.id)
      .order("graded_at", { ascending: false }) as any;

    if (error) {
      toast.error("Failed to load grades");
    } else {
      const typedData = data as any[] || [];
      setGrades(typedData);
      
      if (typedData.length > 0) {
        const avg = typedData.reduce((sum, g) => sum + g.grade, 0) / typedData.length;
        setAverageGrade(Math.round(avg));
      }
    }
    setLoading(false);
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return "text-green-600";
    if (grade >= 80) return "text-blue-600";
    if (grade >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4">
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold mt-2">My Grades</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : grades.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <Award className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No grades yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Overall Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Average Grade</span>
                    <span className={`text-2xl font-bold ${getGradeColor(averageGrade)}`}>
                      {averageGrade}%
                    </span>
                  </div>
                  <Progress value={averageGrade} className="h-3" />
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Total Assignments</div>
                    <div className="text-2xl font-bold">{grades.length}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Highest Grade</div>
                    <div className="text-2xl font-bold">
                      {Math.max(...grades.map(g => g.grade))}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {grades.map((gradeItem) => (
                <Card key={gradeItem.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {gradeItem.submissions?.assignments?.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {gradeItem.submissions?.assignments?.courses?.title}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-lg px-4 py-1">
                        <span className={getGradeColor(gradeItem.grade)}>
                          {gradeItem.grade}%
                        </span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Graded: {new Date(gradeItem.graded_at).toLocaleDateString()}
                      </div>
                      {gradeItem.feedback && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-1">Feedback:</p>
                          <p className="text-sm text-muted-foreground">{gradeItem.feedback}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyGrades;
