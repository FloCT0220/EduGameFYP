'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, RotateCcw, ArrowLeft } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useAuth } from '@/contexts/AuthContext';
import { getSession } from '@/lib/session';

interface CodingChallenge {
  id: number;
  title: string;
  description: string;
  difficulty: 'easy' | 'intermediate' | 'hard';
  points: number;
  supported_languages: string[];
  is_active: boolean;
  created_at: string;
  created_by_username: string;
  submissions_count: number;
  success_rate: number;
  code_snippets?: CodeSnippet[];
  correct_answer?: string[];
}

interface CodeSnippet {
  id: string;
  code: string;
}

export default function ChallengeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [challenge, setChallenge] = useState<CodingChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [availableSnippets, setAvailableSnippets] = useState<CodeSnippet[]>([]);
  const [dropZones, setDropZones] = useState<(CodeSnippet | null)[]>([null, null, null, null]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);

  const fetchChallenge = useCallback(async () => {
    try {
      const response = await fetch(`/api/coding-challenges/${params.id}?language=${selectedLanguage}`);
      if (response.ok) {
        const data = await response.json();
        setChallenge(data);
      }
    } catch (error) {
      console.error('Error fetching challenge:', error);
    } finally {
      setLoading(false);
    }
  }, [params.id, selectedLanguage]);

  const generateCodeSnippets = useCallback(() => {
    if (!challenge) return;

    // Use code snippets from the database
    if (challenge.code_snippets && challenge.code_snippets.length > 0) {
      setAvailableSnippets(challenge.code_snippets);
    } else {
      setAvailableSnippets([]);
    }
    setDropZones([null, null, null, null]);
  }, [challenge]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (params.id) {
      fetchChallenge();
    }
  }, [params.id, fetchChallenge]);

  useEffect(() => {
    if (challenge) {
      generateCodeSnippets();
    }
  }, [challenge, selectedLanguage, generateCodeSnippets]);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    // Drag from available to dropzone
    if (source.droppableId === 'available' && destination.droppableId.startsWith('zone')) {
      const zoneIdx = parseInt(destination.droppableId.replace('zone', '')) - 1;
      const snippet = availableSnippets.find(s => s.id === draggableId);
      if (!snippet) return;
      if (dropZones[zoneIdx]) return; // already filled
      setAvailableSnippets(prev => prev.filter(s => s.id !== draggableId));
      setDropZones(prev => prev.map((z, i) => (i === zoneIdx ? snippet : z)));
    }
    // Drag from dropzone back to available
    else if (source.droppableId.startsWith('zone') && destination.droppableId === 'available') {
      const zoneIdx = parseInt(source.droppableId.replace('zone', '')) - 1;
      const snippet = dropZones[zoneIdx];
      if (!snippet) return;
      setDropZones(prev => prev.map((z, i) => (i === zoneIdx ? null : z)));
      setAvailableSnippets(prev => [...prev, snippet]);
    }
    // Move between dropzones
    else if (source.droppableId.startsWith('zone') && destination.droppableId.startsWith('zone')) {
      const fromIdx = parseInt(source.droppableId.replace('zone', '')) - 1;
      const toIdx = parseInt(destination.droppableId.replace('zone', '')) - 1;
      if (fromIdx === toIdx) return;
      const snippet = dropZones[fromIdx];
      if (!snippet || dropZones[toIdx]) return;
      setDropZones(prev => prev.map((z, i) => {
        if (i === fromIdx) return null;
        if (i === toIdx) return snippet;
        return z;
      }));
    }
  };

  const checkAnswer = async () => {
    if (!user) {
      alert('Please log in to submit your answer!');
      return;
    }

    const requiredZones = [0, 1, 2, 3];
    const allFilled = requiredZones.every(idx => dropZones[idx]);
    if (!allFilled) {
      alert('Please fill all the required code sections!');
      return;
    }

    // Get the IDs of snippets in the drop zones in order
    const submittedAnswer = dropZones.map(snippet => snippet?.id || '').filter(id => id !== '');
    
    try {
      const token = getSession('authToken');
      const response = await fetch('/api/coding-challenges/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          challengeId: challenge?.id,
          programmingLanguage: selectedLanguage,
          submittedAnswer
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setIsCorrect(result.isCorrect);
        setShowResult(true);
      } else {
        console.error('Error submitting answer');
        setIsCorrect(false);
        setShowResult(true);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setIsCorrect(false);
    setShowResult(true);
    }
  };

  const resetChallenge = () => {
    setDropZones([null, null, null, null]);
    setIsCorrect(null);
    setShowResult(false);
    generateCodeSnippets();
  };

  const getPoints = (challenge: CodingChallenge) => challenge.points;

  const handleBack = () => {
    router.push('/coding-sim');
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen p-6 bg-blue-50">
        <div className="max-w-4x2 mx-auto">
          <div className="text-center py-12">
            <div className="text-blue-600">Checking authentication...</div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen p-6 bg-blue-50">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="max-w-4x2 mx-auto space-y-6">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors font-medium mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Challenges
          </button>

          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">{challenge?.title}</h1>
            {/* Language Dropdown */}
            {challenge?.supported_languages && challenge.supported_languages.length > 1 && (
              <div className="flex items-center gap-2">
                <label htmlFor="language-select" className="font-semibold text-blue-900">Language:</label>
              <select
                  id="language-select"
                value={selectedLanguage}
                  onChange={e => setSelectedLanguage(e.target.value)}
                  className="border border-blue-300 rounded px-2 py-1 text-blue-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {challenge.supported_languages.map(lang => (
                    <option value={lang} key={lang}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</option>
                ))}
              </select>
            </div>
            )}
          </div>
          {challenge?.description && (
            <div className="bg-white rounded-lg shadow p-4 border border-blue-100 mb-4">
              <h2 className="text-lg font-bold text-blue-900 mb-2">Challenge Description</h2>
              <pre className="whitespace-pre-wrap text-blue-900 bg-blue-50 p-4 rounded-lg text-base border border-blue-100">{challenge.description}</pre>
            </div>
          )}

          <div className="bg-white p-4 rounded-lg shadow space-y-3 font-mono">
            <div className="grid grid-cols-2 gap-6">
              {/* Available Snippets Column */}
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Available Code Snippets</h3>
                <Droppable droppableId="available">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="grid grid-cols-2 gap-2 min-h-[200px]"
                    >
                      {availableSnippets.map((snippet, idx) => (
                        <Draggable draggableId={snippet.id} index={idx} key={snippet.id}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-blue-50 border border-blue-200 rounded-lg p-3 cursor-move hover:bg-blue-100 transition-colors ${snapshot.isDragging ? 'scale-95 opacity-60 z-50' : ''}`}
                            >
                              <code className="text-sm text-blue-800 font-mono">{snippet.code}</code>
                    </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
                </div>

              {/* Drop Zones Column */}
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Code Structure</h3>
                <div className="space-y-2">
                  {[0, 1, 2, 3].map((zoneIdx) => (
                    <Droppable droppableId={`zone${zoneIdx + 1}`} key={zoneIdx}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`border-2 border-dashed rounded p-2 bg-white min-h-[40px] transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-blue-100' : ''}`}
                        >
                          {dropZones[zoneIdx] ? (
                            <Draggable draggableId={dropZones[zoneIdx]!.id} index={0} key={dropZones[zoneIdx]!.id}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-blue-50 border border-blue-200 rounded-lg p-3 cursor-move hover:bg-blue-100 transition-colors ${snapshot.isDragging ? 'scale-95 opacity-60 z-50' : ''}`}
                                >
                                  <span className="text-blue-800 font-mono">{dropZones[zoneIdx]!.code}</span>
                    </div>
                              )}
                            </Draggable>
                          ) : (
                            <span className="text-blue-300">Drop code here...</span>
                          )}
                          {provided.placeholder}
                    </div>
                  )}
                    </Droppable>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={checkAnswer}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-bold shadow"
            >
              Check Answer
            </button>
            <button
              onClick={resetChallenge}
              className="px-6 py-3 bg-white border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-bold shadow"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {showResult && (
            <div
              className={`rounded-lg p-4 mt-2 ${
                isCorrect ? 'bg-green-100 border border-green-400' : 'bg-red-100 border border-red-400'
              }`}
            >
              <div className="flex items-center gap-2">
                {isCorrect ? (
                  <CheckCircle className="w-5 h-5 text-green-700" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-700" />
                )}
                <span className={`font-bold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                  {isCorrect ? 'Correct! Well done!' : 'Incorrect. Try again!'}
                </span>
              </div>
              {isCorrect && (
                <p className="text-green-800 mt-2">You earned {challenge ? getPoints(challenge) : 0} points!</p>
              )}
            </div>
          )}
        </div>
      </DragDropContext>
    </div>
  );
} 
