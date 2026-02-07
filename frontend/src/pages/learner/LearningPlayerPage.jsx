// Full-Screen Learning Player
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getCourse,
  getLessonsByCourse,
  getQuizByLesson,
  getQuizAttemptsByUser,
} from '../../services/courseService';
import { updateLessonProgress } from '../../services/progressService';
import { submitQuizAttempt } from '../../services/quizService';
import toast from 'react-hot-toast';
import { XMarkIcon, CheckCircleIcon, PlayIcon } from '@heroicons/react/24/solid';

const LearningPlayer = () => {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizAttempts, setQuizAttempts] = useState([]);

  const enrollmentId = `${userProfile?.uid}_${courseId}`;

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  useEffect(() => {
    const lessonId = searchParams.get('lessonId');
    if (lessonId && lessons.length > 0) {
      const lesson = lessons.find((l) => l.id === lessonId);
      if (lesson) {
        setCurrentLesson(lesson);
        if (lesson.type === 'quiz') {
          loadQuiz(lessonId);
        }
      }
    } else if (lessons.length > 0 && !currentLesson) {
      setCurrentLesson(lessons[0]);
    }
  }, [searchParams, lessons]);

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      const [courseData, lessonsData] = await Promise.all([
        getCourse(courseId),
        getLessonsByCourse(courseId),
      ]);

      setCourse(courseData);
      setLessons(lessonsData);
    } catch (error) {
      console.error('Error fetching course data:', error);
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const loadQuiz = async (lessonId) => {
    try {
      const quizData = await getQuizByLesson(lessonId);
      setQuiz(quizData);

      if (quizData && userProfile) {
        const attempts = await getQuizAttemptsByUser(userProfile.id, quizData.id);
        setQuizAttempts(attempts);
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
    }
  };

  const handleLessonClick = (lesson) => {
    setCurrentLesson(lesson);
    setQuizSubmitted(false);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    navigate(`/learner/courses/${courseId}/learn?lessonId=${lesson.id}`);
  };

  const handleMarkComplete = async () => {
    if (!currentLesson || !userProfile) return;

    try {
      await updateLessonProgress(
        enrollmentId,
        userProfile.id,
        courseId,
        currentLesson.id,
        true
      );
      toast.success('Lesson marked as complete!');
      
      // Move to next lesson
      const currentIndex = lessons.findIndex((l) => l.id === currentLesson.id);
      if (currentIndex < lessons.length - 1) {
        handleLessonClick(lessons[currentIndex + 1]);
      }
    } catch (error) {
      console.error('Error marking complete:', error);
      toast.error('Failed to mark as complete');
    }
  };

  const handleQuizAnswer = (questionId, optionId) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: optionId,
    });
  };

  const handleQuizSubmit = async () => {
    if (!quiz || !userProfile) return;

    const answers = quiz.questions.map((q) => {
      const selectedOption = selectedAnswers[q.id];
      const correctOption = q.options.find((opt) => opt.isCorrect);
      return {
        questionId: q.id,
        selectedOptionId: selectedOption,
        isCorrect: selectedOption === correctOption?.id,
      };
    });

    const score = answers.filter((a) => a.isCorrect).length;
    const attemptNumber = quizAttempts.length + 1;

    // Calculate points based on attempt number
    let pointsEarned = 0;
    if (attemptNumber === 1) pointsEarned = quiz.rewards.attempt1;
    else if (attemptNumber === 2) pointsEarned = quiz.rewards.attempt2;
    else if (attemptNumber === 3) pointsEarned = quiz.rewards.attempt3;
    else pointsEarned = quiz.rewards.attempt4Plus;

    try {
      await submitQuizAttempt({
        userId: userProfile.id,
        courseId,
        quizId: quiz.id,
        lessonId: currentLesson.id,
        attemptNumber,
        answers,
        score,
        totalQuestions: quiz.questions.length,
        pointsEarned,
      });

      setQuizSubmitted(true);
      toast.success(`Quiz submitted! You earned ${pointsEarned} points!`);
      
      // Mark lesson as complete
      await updateLessonProgress(
        enrollmentId,
        userProfile.id,
        courseId,
        currentLesson.id,
        true
      );
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
    }
  };

  const renderLessonContent = () => {
    if (!currentLesson) return null;

    switch (currentLesson.type) {
      case 'video':
        return (
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {currentLesson.contentUrl.includes('youtube.com') ||
            currentLesson.contentUrl.includes('youtu.be') ? (
              <iframe
                src={currentLesson.contentUrl.replace('watch?v=', 'embed/')}
                className="w-full h-full"
                allowFullScreen
              ></iframe>
            ) : (
              <video src={currentLesson.contentUrl} controls className="w-full h-full"></video>
            )}
          </div>
        );

      case 'document':
        return (
          <div className="bg-white rounded-lg p-8">
            <embed
              src={currentLesson.contentUrl}
              type="application/pdf"
              className="w-full h-[600px]"
            />
            {currentLesson.allowDownload && (
              <a
                href={currentLesson.contentUrl}
                download
                className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Download PDF
              </a>
            )}
          </div>
        );

      case 'image':
        return (
          <div className="bg-white rounded-lg p-8">
            <img
              src={currentLesson.contentUrl}
              alt={currentLesson.title}
              className="w-full h-auto rounded-lg"
            />
          </div>
        );

      case 'quiz':
        return renderQuiz();

      default:
        return <div>Unsupported lesson type</div>;
    }
  };

  const renderQuiz = () => {
    if (!quiz) return <div>Loading quiz...</div>;

    if (quizSubmitted) {
      const correctCount = Object.values(selectedAnswers).filter((answerId) =>
        quiz.questions.some((q) =>
          q.options.find((opt) => opt.id === answerId && opt.isCorrect)
        )
      ).length;

      return (
        <div className="bg-white rounded-lg p-8 text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Quiz Submitted!
          </h2>
          <p className="text-gray-600 mb-6">
            You scored {correctCount} out of {quiz.questions.length}
          </p>
          <button
            onClick={() => {
              setQuizSubmitted(false);
              setSelectedAnswers({});
              setCurrentQuestionIndex(0);
            }}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retake Quiz
          </button>
        </div>
      );
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];

    return (
      <div className="bg-white rounded-lg p-8">
        <div className="mb-6">
          <div className="text-sm text-gray-500 mb-2">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{
                width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-6">
          {currentQuestion.question}
        </h3>

        <div className="space-y-3 mb-8">
          {currentQuestion.options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleQuizAnswer(currentQuestion.id, option.id)}
              className={`w-full text-left p-4 border-2 rounded-lg transition ${
                selectedAnswers[currentQuestion.id] === option.id
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {option.text}
            </button>
          ))}
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>

          {currentQuestionIndex === quiz.questions.length - 1 ? (
            <button
              onClick={handleQuizSubmit}
              disabled={Object.keys(selectedAnswers).length !== quiz.questions.length}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              Submit Quiz
            </button>
          ) : (
            <button
              onClick={() =>
                setCurrentQuestionIndex((prev) =>
                  Math.min(quiz.questions.length - 1, prev + 1)
                )
              }
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Next
            </button>
          )}
        </div>

        <div className="mt-6 text-sm text-gray-500 text-center">
          Attempt {quizAttempts.length + 1}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar - Lesson List */}
      <div className="w-80 bg-gray-800 text-white overflow-y-auto">
        <div className="p-4 border-b border-gray-700">
          <button
            onClick={() => navigate(`/learner/courses/${courseId}`)}
            className="text-gray-300 hover:text-white flex items-center gap-2"
          >
            <XMarkIcon className="h-5 w-5" />
            Exit Course
          </button>
        </div>

        <div className="p-4">
          <h2 className="text-lg font-bold mb-4">{course?.title}</h2>
          <div className="space-y-2">
            {lessons.map((lesson, index) => (
              <button
                key={lesson.id}
                onClick={() => handleLessonClick(lesson)}
                className={`w-full text-left p-3 rounded-lg transition ${
                  currentLesson?.id === lesson.id
                    ? 'bg-primary-600'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">{index + 1}</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{lesson.title}</div>
                    <div className="text-xs text-gray-400 capitalize">
                      {lesson.type}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-5xl mx-auto p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {currentLesson?.title}
            </h1>
            <p className="text-gray-600">{currentLesson?.description}</p>
          </div>

          {renderLessonContent()}

          {currentLesson?.type !== 'quiz' && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleMarkComplete}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Mark as Complete & Continue
              </button>
            </div>
          )}

          {/* Attachments */}
          {currentLesson?.attachments && currentLesson.attachments.length > 0 && (
            <div className="mt-8 bg-white rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Attachments
              </h3>
              <div className="space-y-2">
                {currentLesson.attachments.map((attachment, index) => (
                  <a
                    key={index}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    {attachment.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningPlayer;
