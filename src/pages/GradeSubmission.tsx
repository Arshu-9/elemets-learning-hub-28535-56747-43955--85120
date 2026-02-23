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
    const { data: submissionData, error: submissionError } = await supabase
      .from("submissions")
      .select("*")
      .eq("id", submissionId)
      .single() as any;

    if (submissionError) {
      toast.error("Failed to load submission");
      return;
    }

    // Fetch the student profile separately
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", submissionData.student_id)
      .single() as any;

    setSubmission({
      ...submissionData,
      profiles: profileData
    } as any);
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

    // Use upsert to handle both insert and update cases
    const { error } = await supabase
      .from("grades")
      .upsert({
        submission_id: submissionId,
        grade: gradeValue,
        feedback: feedback || null,
      } as any, {
        onConflict: 'submission_id'
      }) as any;

    if (error) {
      console.error("Grade submission error:", error);
      toast.error("Failed to submit grade");
    } else {
      toast.success(existingGrade ? "Grade updated successfully!" : "Grade submitted successfully!");
      // Use setTimeout to ensure toast is visible before navigation
      setTimeout(() => {
        navigate(-1);
      }, 500);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (!submission) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="inline-flex items-center text-sm mb-2 px-0 hover:bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold mt-2">Grade Submission</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 lg:px-8 py-8 space-y-6">
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
