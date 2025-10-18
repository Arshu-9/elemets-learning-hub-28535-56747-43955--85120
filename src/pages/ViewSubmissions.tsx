import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, User, Calendar } from "lucide-react";

interface Submission {
  id: string;
  content: string;
  submitted_at: string;
  student_id: string;
  profiles: {
    full_name: string;
    email: string;
  };
  grades: Array<{
    grade: number;
    feedback: string | null;
  }>;
}

const ViewSubmissions = () => {
  const { assignmentId } = useParams();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignmentTitle, setAssignmentTitle] = useState("");

  useEffect(() => {
    fetchAssignment();
    fetchSubmissions();
  }, [assignmentId]);

  const fetchAssignment = async () => {
    const { data } = await supabase
      .from("assignments")
      .select("title")
      .eq("id", assignmentId)
      .single();

    if (data) setAssignmentTitle(data.title);
  };

  const fetchSubmissions = async () => {
    try {
      const { data: subs, error: subsErr } = await supabase
        .from("submissions")
        .select("id, content, submitted_at, student_id, assignment_id")
        .eq("assignment_id", assignmentId)
        .order("submitted_at", { ascending: false });

      if (subsErr) throw subsErr;

      const submissionsList = subs || [];
      if (submissionsList.length === 0) {
        setSubmissions([]);
        return;
      }

      const studentIds = Array.from(new Set(submissionsList.map((s: any) => s.student_id)));
      const submissionIds = submissionsList.map((s: any) => s.id);

      const [profilesRes, gradesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", studentIds),
        supabase
          .from("grades")
          .select("submission_id, grade, feedback")
          .in("submission_id", submissionIds),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (gradesRes.error) throw gradesRes.error;

      const profileMap = new Map(
        (profilesRes.data || []).map((p: any) => [p.user_id, { full_name: p.full_name, email: p.email }])
      );

      const gradesMap = new Map<string, Array<{ grade: number; feedback: string | null }>>();
      (gradesRes.data || []).forEach((g: any) => {
        const arr = gradesMap.get(g.submission_id) || [];
        arr.push({ grade: g.grade, feedback: g.feedback });
        gradesMap.set(g.submission_id, arr);
      });

      const combined = submissionsList.map((s: any) => ({
        id: s.id,
        content: s.content,
        submitted_at: s.submitted_at,
        student_id: s.student_id,
        profiles: profileMap.get(s.student_id) || { full_name: "Unknown Student", email: "" },
        grades: gradesMap.get(s.id) || [],
      })) as Submission[];

      setSubmissions(combined);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load submissions");
      setSubmissions([]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <button onClick={() => window.history.back()} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          <h1 className="text-2xl font-bold mt-2">Submissions: {assignmentTitle}</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {submissions.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No submissions yet
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {submissions.map((submission) => (
              <Card key={submission.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        {submission.profiles?.full_name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(submission.submitted_at).toLocaleString()}
                        </span>
                        {submission.grades && submission.grades.length > 0 && (
                          <Badge variant="secondary">
                            Grade: {submission.grades[0].grade}/100
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                    <Link to={`/submissions/${submission.id}/grade`}>
                      <Button size="sm">
                        {submission.grades && submission.grades.length > 0 ? "Edit Grade" : "Grade"}
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap text-sm">{submission.content}</p>
                  </div>
                  {submission.grades && submission.grades.length > 0 && submission.grades[0].feedback && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Feedback:</p>
                      <p className="text-sm text-muted-foreground">{submission.grades[0].feedback}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ViewSubmissions;
