import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

interface Submission {
  id: string;
  content: string;
  submitted_at: string;
  profiles: {
    full_name: string;
  };
}

interface Grade {
  grade: number;
  feedback: string | null;
}

const GradeSubmission = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [existingGrade, setExistingGrade] = useState<Grade | null>(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    fetchSubmission();
    fetchGrade();
  }, [submissionId]);

  const fetchSubmission = async () => {
    const { data, error } = await supabase
      .from("submissions")
      .select(`
        *,
        profiles!submissions_student_id_fkey(full_name)
      `)
      .eq("id", submissionId)
      .single() as any;

    if (error) {
      toast.error("Failed to load submission");
    } else {
      setSubmission(data as any);
    }
  };

  const fetchGrade = async () => {
    const { data } = await supabase
      .from("grades")
      .select("*")
      .eq("submission_id", submissionId)
      .maybeSingle() as any;

    if (data) {
      setExistingGrade(data);
      setGrade(data.grade.toString());
      setFeedback(data.feedback || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const gradeValue = parseInt(grade);
    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 100) {
      toast.error("Grade must be between 0 and 100");
      return;
    }

    if (existingGrade) {
      const { error } = await supabase
        .from("grades")
        .update({
          grade: gradeValue,
          feedback: feedback || null,
        } as any)
        .eq("submission_id", submissionId) as any;

      if (error) {
        toast.error("Failed to update grade");
      } else {
        toast.success("Grade updated successfully!");
        navigate(-1);
      }
    } else {
      const { error } = await supabase.from("grades").insert({
        submission_id: submissionId,
        grade: gradeValue,
        feedback: feedback || null,
      } as any) as any;

      if (error) {
        toast.error("Failed to submit grade");
      } else {
        toast.success("Grade submitted successfully!");
        navigate(-1);
      }
    }
  };

  if (!submission) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          <h1 className="text-2xl font-bold mt-2">Grade Submission</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Student Submission</CardTitle>
            <div className="text-sm text-muted-foreground mt-2">
              Student: {submission.profiles?.full_name} • Submitted: {new Date(submission.submitted_at).toLocaleString()}
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{submission.content}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{existingGrade ? "Update Grade" : "Assign Grade"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="grade">Grade (0-100)</Label>
                <Input
                  id="grade"
                  type="number"
                  min="0"
                  max="100"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="Enter grade"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback (Optional)</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide feedback to the student..."
                  className="min-h-[150px]"
                />
              </div>
              <Button type="submit" className="w-full">
                {existingGrade ? "Update Grade" : "Submit Grade"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default GradeSubmission;
