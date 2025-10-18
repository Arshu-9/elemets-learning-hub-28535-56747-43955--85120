import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Award } from "lucide-react";
import { toast } from "sonner";

interface Assignment {
  id: string;
  title: string;
  course_id: string;
}

interface Submission {
  id: string;
  content: string;
  submitted_at: string;
  student_id: string;
  profiles: {
    full_name: string;
    email: string;
  };
  grades: {
    grade: number;
    feedback: string;
  } | null;
}

const GradeAssignment = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [assignmentId]);

  const fetchData = async () => {
    try {
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("assignments")
        .select("id, title, course_id")
        .eq("id", assignmentId)
        .single() as any;

      if (assignmentError) throw assignmentError;
      setAssignment(assignmentData);

      // Fetch submissions with grades
      const { data: submissionData } = await supabase
        .from("submissions")
        .select("id, content, submitted_at, student_id, grades(grade, feedback)")
        .eq("assignment_id", assignmentId) as any;

      // Fetch profiles
      const studentIds = submissionData?.map((s: any) => s.student_id) || [];
      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", studentIds) as any;

      // Combine data
      const submissionsData = submissionData?.map((s: any) => ({
        ...s,
        profiles: profileData?.find((p: any) => p.user_id === s.student_id) || { full_name: '', email: '' }
      })) || [];

      setSubmissions(submissionsData);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    setGrading(true);
    try {
      const gradeValue = parseInt(grade);
      if (gradeValue < 0 || gradeValue > 100) {
        toast.error("Grade must be between 0 and 100");
        return;
      }

      if (selectedSubmission.grades) {
        const { error } = await supabase
          .from("grades")
          .update({ grade: gradeValue, feedback } as any)
          .eq("submission_id", selectedSubmission.id) as any;

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("grades")
          .insert({
            submission_id: selectedSubmission.id,
            grade: gradeValue,
            feedback,
          } as any) as any;

        if (error) throw error;
      }

      toast.success("Grade saved successfully!");
      setSelectedSubmission(null);
      setGrade("");
      setFeedback("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setGrading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!assignment) {
    return <div className="flex items-center justify-center min-h-screen">Assignment not found</div>;
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-subtle)" }}>
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate(`/courses/${assignment.course_id}/manage`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Submissions ({submissions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No submissions yet</p>
              ) : (
                <div className="space-y-3">
                  {submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedSubmission?.id === submission.id
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => {
                        setSelectedSubmission(submission);
                        setGrade(submission.grades?.grade.toString() || "");
                        setFeedback(submission.grades?.feedback || "");
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{submission.profiles.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(submission.submitted_at).toLocaleString()}
                          </p>
                        </div>
                        {submission.grades && (
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-accent" />
                            <span className="font-medium">{submission.grades.grade}/100</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {selectedSubmission ? "Grade Submission" : "Select a submission"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedSubmission ? (
                <div className="space-y-6">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Student Submission:</h4>
                    <p className="text-sm whitespace-pre-wrap">{selectedSubmission.content}</p>
                  </div>

                  <form onSubmit={handleGrade} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="grade">Grade (0-100) *</Label>
                      <Input
                        id="grade"
                        type="number"
                        min="0"
                        max="100"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="feedback">Feedback</Label>
                      <Textarea
                        id="feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={6}
                        placeholder="Provide feedback to the student..."
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={grading}
                      className="w-full"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      {grading ? "Saving..." : "Save Grade"}
                    </Button>
                  </form>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">
                  Select a submission from the list to grade it
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default GradeAssignment;
