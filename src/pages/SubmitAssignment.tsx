import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  course_id: string;
}

const SubmitAssignment = () => {
  const { assignmentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [content, setContent] = useState("");
  const [existingSubmission, setExistingSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignmentData();
  }, [assignmentId, user]);

  const fetchAssignmentData = async () => {
    if (!user) return;

    try {
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("assignments")
        .select("*")
        .eq("id", assignmentId)
        .single();

      if (assignmentError) throw assignmentError;
      setAssignment(assignmentData);

      const { data: submissionData, error: submissionError } = await supabase
        .from("submissions")
        .select("*, grades(*)")
        .eq("assignment_id", assignmentId)
        .eq("student_id", user.id)
        .maybeSingle();

      if (submissionError) throw submissionError;

      if (submissionData) {
        setExistingSubmission(submissionData);
        setContent(submissionData.content);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !assignment) return;

    setSubmitting(true);
    try {
      if (existingSubmission) {
        const { error } = await supabase
          .from("submissions")
          .update({ content })
          .eq("id", existingSubmission.id);

        if (error) throw error;
        toast.success("Assignment updated successfully!");
      } else {
        const { error } = await supabase
          .from("submissions")
          .insert({
            assignment_id: assignmentId,
            student_id: user.id,
            content,
          });

        if (error) throw error;
        toast.success("Assignment submitted successfully!");
      }

      navigate(`/courses/${assignment.course_id}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
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
          <Button variant="ghost" onClick={() => navigate(`/courses/${assignment.course_id}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>{assignment.title}</CardTitle>
            <p className="text-muted-foreground">{assignment.description}</p>
            {assignment.due_date && (
              <p className="text-sm text-muted-foreground">
                Due: {new Date(assignment.due_date).toLocaleString()}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {existingSubmission?.grades && existingSubmission.grades.length > 0 ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-medium mb-2">Grade: {existingSubmission.grades[0].grade}/100</h3>
                  {existingSubmission.grades[0].feedback && (
                    <p className="text-sm text-muted-foreground">
                      Feedback: {existingSubmission.grades[0].feedback}
                    </p>
                  )}
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Your Submission:</h4>
                  <p className="text-sm whitespace-pre-wrap">{existingSubmission.content}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="content">Your Submission *</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    rows={12}
                    placeholder="Type your answer here..."
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/courses/${assignment.course_id}`)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {submitting ? "Submitting..." : existingSubmission ? "Update" : "Submit"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SubmitAssignment;
