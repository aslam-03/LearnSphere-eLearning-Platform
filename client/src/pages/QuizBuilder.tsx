import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/use-auth";
import { useQuiz, useUpdateQuiz, useAddQuestion, useUpdateQuestion, useDeleteQuestion } from "@/hooks/use-quizzes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link, Redirect, useRoute } from "wouter";
import { ArrowLeft, Plus, Trash2, Check, Award, Settings, GripVertical, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const questionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  options: z.array(z.object({
    text: z.string().min(1, "Option text is required"),
    isCorrect: z.boolean()
  })).min(2, "At least 2 options required"),
  points: z.number().int().min(1).default(10),
});

type QuestionFormValues = z.infer<typeof questionSchema>;

const rewardsSchema = z.object({
  attempt1: z.number().int().min(0),
  attempt2: z.number().int().min(0),
  attempt3: z.number().int().min(0),
  attempt4Plus: z.number().int().min(0),
});

type RewardsFormValues = z.infer<typeof rewardsSchema>;

export default function QuizBuilder() {
  const [, params] = useRoute("/instructor/course/:courseId/quiz/:quizId");
  const courseId = params?.courseId;
  const quizId = params?.quizId;
  
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: quiz, isLoading: quizLoading } = useQuiz(quizId);
  
  const updateQuiz = useUpdateQuiz();
  const addQuestion = useAddQuestion();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();
  
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [isRewardsDialogOpen, setIsRewardsDialogOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);
  
  const [options, setOptions] = useState<{ text: string; isCorrect: boolean }[]>([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false }
  ]);

  const questionForm = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      text: "",
      options: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }],
      points: 10,
    }
  });

  const rewardsForm = useForm<RewardsFormValues>({
    resolver: zodResolver(rewardsSchema),
    defaultValues: {
      attempt1: quiz?.rewards?.attempt1 || 10,
      attempt2: quiz?.rewards?.attempt2 || 7,
      attempt3: quiz?.rewards?.attempt3 || 5,
      attempt4Plus: quiz?.rewards?.attempt4Plus || 3,
    }
  });

  if (authLoading || quizLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) return <Redirect to="/auth" />;
  if (!quiz) return <Redirect to={`/instructor/course/${courseId}`} />;

  const questions = quiz.questions || [];
  const currentQuestion = questions[selectedQuestionIndex];

  const handleAddQuestion = () => {
    setEditingQuestionId(null);
    setOptions([{ text: "", isCorrect: false }, { text: "", isCorrect: false }]);
    questionForm.reset({
      text: "",
      options: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }],
      points: 10,
    });
    setIsQuestionDialogOpen(true);
  };

  const handleEditQuestion = (question: any) => {
    setEditingQuestionId(question.id);
    setOptions(question.options);
    questionForm.reset({
      text: question.text,
      options: question.options,
      points: question.points,
    });
    setIsQuestionDialogOpen(true);
  };

  const addOption = () => {
    setOptions([...options, { text: "", isCorrect: false }]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOptionText = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index].text = text;
    setOptions(newOptions);
  };

  const toggleOptionCorrect = (index: number) => {
    const newOptions = [...options];
    newOptions[index].isCorrect = !newOptions[index].isCorrect;
    setOptions(newOptions);
  };

  const onSubmitQuestion = (data: QuestionFormValues) => {
    const questionData = {
      ...data,
      options,
      quizId: quizId!,
    };

    if (editingQuestionId) {
      updateQuestion.mutate({
        id: editingQuestionId,
        quizId: quizId!,
        ...questionData
      }, {
        onSuccess: () => setIsQuestionDialogOpen(false)
      });
    } else {
      addQuestion.mutate(questionData, {
        onSuccess: () => {
          setIsQuestionDialogOpen(false);
          setSelectedQuestionIndex(questions.length);
        }
      });
    }
  };

  const onSubmitRewards = (data: RewardsFormValues) => {
    updateQuiz.mutate({
      id: quizId!,
      rewards: data
    }, {
      onSuccess: () => setIsRewardsDialogOpen(false)
    });
  };

  const handleDeleteQuestion = () => {
    if (deleteQuestionId) {
      deleteQuestion.mutate({ id: deleteQuestionId, quizId: quizId! }, {
        onSuccess: () => {
          setDeleteQuestionId(null);
          if (selectedQuestionIndex >= questions.length - 1) {
            setSelectedQuestionIndex(Math.max(0, questions.length - 2));
          }
        }
      });
    }
  };

  const openRewardsDialog = () => {
    rewardsForm.reset({
      attempt1: quiz?.rewards?.attempt1 || 10,
      attempt2: quiz?.rewards?.attempt2 || 7,
      attempt3: quiz?.rewards?.attempt3 || 5,
      attempt4Plus: quiz?.rewards?.attempt4Plus || 3,
    });
    setIsRewardsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/instructor/course/${courseId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-lg">{quiz.title}</h1>
              <p className="text-sm text-muted-foreground">
                {questions.length} questions
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={openRewardsDialog}>
              <Award className="w-4 h-4 mr-2" />
              Rewards
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-8rem)]">
        {/* Left Panel - Question List */}
        <div className="w-80 border-r bg-muted/30 flex flex-col">
          <div className="p-4 border-b bg-white">
            <Button onClick={handleAddQuestion} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {questions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No questions yet</p>
                  <p className="text-sm">Click "Add Question" to get started</p>
                </div>
              ) : (
                questions.map((question, index) => (
                  <Card
                    key={question.id}
                    className={`cursor-pointer transition-all ${
                      selectedQuestionIndex === index 
                        ? "border-primary ring-1 ring-primary" 
                        : "hover:border-muted-foreground/50"
                    }`}
                    onClick={() => setSelectedQuestionIndex(index)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                          <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center">
                            {index + 1}
                          </Badge>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {question.text || "Untitled Question"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {question.options?.length || 0} options • {question.points} pts
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Question Editor */}
        <div className="flex-1 overflow-auto">
          {currentQuestion ? (
            <div className="p-8 max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Question {selectedQuestionIndex + 1}</h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditQuestion(currentQuestion)}>
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-destructive"
                    onClick={() => setDeleteQuestionId(currentQuestion.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{currentQuestion.text}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentQuestion.options?.map((option, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-4 rounded-lg border ${
                          option.isCorrect 
                            ? "bg-green-50 border-green-200" 
                            : "bg-muted/30"
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          option.isCorrect 
                            ? "border-green-500 bg-green-500" 
                            : "border-muted-foreground/30"
                        }`}>
                          {option.isCorrect && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <span className={option.isCorrect ? "font-medium" : ""}>
                          {option.text}
                        </span>
                        {option.isCorrect && (
                          <Badge className="ml-auto bg-green-500">Correct</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Points for this question</span>
                    <Badge variant="secondary" className="text-lg px-4">
                      {currentQuestion.points} pts
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <p className="mb-2">No question selected</p>
                <Button onClick={handleAddQuestion}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Question
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Question Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestionId ? "Edit Question" : "Add Question"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={questionForm.handleSubmit(onSubmitQuestion)} className="space-y-6">
            <div className="space-y-2">
              <Label>Question Text</Label>
              <Textarea
                placeholder="Enter your question here..."
                className="min-h-[100px]"
                {...questionForm.register("text")}
              />
              {questionForm.formState.errors.text && (
                <p className="text-xs text-destructive">{questionForm.formState.errors.text.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Options</Label>
                <Button type="button" variant="outline" size="sm" onClick={addOption}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Option
                </Button>
              </div>
              
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  <button
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      option.isCorrect 
                        ? "border-green-500 bg-green-500" 
                        : "border-muted-foreground/30 hover:border-green-500"
                    }`}
                    onClick={() => toggleOptionCorrect(index)}
                  >
                    {option.isCorrect && <Check className="w-4 h-4 text-white" />}
                  </button>
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option.text}
                    onChange={(e) => updateOptionText(index, e.target.value)}
                    className="flex-1"
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => removeOption(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Click the circle to mark the correct answer(s)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Points</Label>
              <Input
                type="number"
                min={1}
                {...questionForm.register("points", { valueAsNumber: true })}
                className="w-32"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addQuestion.isPending || updateQuestion.isPending}>
                {(addQuestion.isPending || updateQuestion.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingQuestionId ? "Save Changes" : "Add Question"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rewards Dialog */}
      <Dialog open={isRewardsDialogOpen} onOpenChange={setIsRewardsDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Quiz Rewards
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={rewardsForm.handleSubmit(onSubmitRewards)} className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Set points awarded based on attempt number. Multiple attempts help learners practice.
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>First Attempt</Label>
                <Input
                  type="number"
                  min={0}
                  {...rewardsForm.register("attempt1", { valueAsNumber: true })}
                  className="w-24 text-right"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Second Attempt</Label>
                <Input
                  type="number"
                  min={0}
                  {...rewardsForm.register("attempt2", { valueAsNumber: true })}
                  className="w-24 text-right"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Third Attempt</Label>
                <Input
                  type="number"
                  min={0}
                  {...rewardsForm.register("attempt3", { valueAsNumber: true })}
                  className="w-24 text-right"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Fourth+ Attempts</Label>
                <Input
                  type="number"
                  min={0}
                  {...rewardsForm.register("attempt4Plus", { valueAsNumber: true })}
                  className="w-24 text-right"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRewardsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateQuiz.isPending}>
                {updateQuiz.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Rewards
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteQuestionId} onOpenChange={() => setDeleteQuestionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this question.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteQuestion}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
