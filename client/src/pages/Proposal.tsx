import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useAuth, useApi } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { useToast } from '../components/ui/toaster';
import { formatDateTime, getStepName, getStepDescription, formatTimeRemaining } from '../lib/utils';
import { Clock, MessageCircle, AlertTriangle, CheckCircle, Users } from 'lucide-react';

interface Proposal {
  id: string;
  title: string;
  description: string;
  status: string;
  currentStep: string;
  stepEndTime: string | null;
  createdAt: string;
  createdBy: string;
}

interface Question {
  id: string;
  question: string;
  userId: string;
  createdAt: string;
}

interface Reaction {
  id: string;
  reaction: string;
  userId: string;
  createdAt: string;
}

interface Objection {
  id: string;
  objection: string;
  severity: string;
  userId: string;
  createdAt: string;
}

interface ConsentResponse {
  id: string;
  choice: string;
  reason: string | null;
  userId: string;
  createdAt: string;
}

export default function Proposal() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { apiCall } = useApi();
  const { toast } = useToast();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [objections, setObjections] = useState<Objection[]>([]);
  const [consents, setConsents] = useState<ConsentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newQuestion, setNewQuestion] = useState('');
  const [newReaction, setNewReaction] = useState('');
  const [newObjection, setNewObjection] = useState('');
  const [objectionSeverity, setObjectionSeverity] = useState<'minor_concern' | 'major_concern' | 'deal_breaker'>('minor_concern');
  const [consentChoice, setConsentChoice] = useState<'consent' | 'consent_with_reservations' | 'withhold_consent'>('consent');
  const [consentReason, setConsentReason] = useState('');

  const fetchData = async () => {
    try {
      const [proposalData, questionsData, reactionsData, objectionsData, consentsData] = await Promise.all([
        apiCall(`/proposals/${id}`),
        apiCall(`/proposals/${id}/questions`),
        apiCall(`/proposals/${id}/reactions`),
        apiCall(`/proposals/${id}/objections`),
        apiCall(`/proposals/${id}/consent`)
      ]);

      setProposal(proposalData);
      setQuestions(questionsData);
      setReactions(reactionsData);
      setObjections(objectionsData);
      setConsents(consentsData);
    } catch (error) {
      console.error('Failed to fetch proposal data:', error);
      toast({
        title: 'Failed to load proposal',
        description: 'Could not load proposal details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    try {
      await apiCall(`/proposals/${id}/questions`, {
        method: 'POST',
        body: JSON.stringify({ question: newQuestion }),
      });
      setNewQuestion('');
      fetchData();
      toast({
        title: 'Question submitted',
        description: 'Your clarifying question has been added',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to submit question',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSubmitReaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReaction.trim()) return;

    try {
      await apiCall(`/proposals/${id}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ reaction: newReaction }),
      });
      setNewReaction('');
      fetchData();
      toast({
        title: 'Reaction submitted',
        description: 'Your reaction has been added',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to submit reaction',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSubmitObjection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObjection.trim()) return;

    try {
      await apiCall(`/proposals/${id}/objections`, {
        method: 'POST',
        body: JSON.stringify({ 
          objection: newObjection,
          severity: objectionSeverity
        }),
      });
      setNewObjection('');
      setObjectionSeverity('minor_concern');
      fetchData();
      toast({
        title: 'Objection submitted',
        description: 'Your objection has been recorded',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to submit objection',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSubmitConsent = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await apiCall(`/proposals/${id}/consent`, {
        method: 'POST',
        body: JSON.stringify({ 
          choice: consentChoice,
          reason: consentReason || null
        }),
      });
      setConsentReason('');
      fetchData();
      toast({
        title: 'Consent response submitted',
        description: 'Your consent decision has been recorded',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to submit consent',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStepColor = (step: string) => {
    const colors: Record<string, string> = {
      'proposal_presentation': 'bg-blue-100 text-blue-800',
      'clarifying_questions': 'bg-purple-100 text-purple-800',
      'quick_reactions': 'bg-green-100 text-green-800',
      'objections_round': 'bg-orange-100 text-orange-800',
      'resolve_objections': 'bg-red-100 text-red-800',
      'consent_round': 'bg-emerald-100 text-emerald-800',
      'record_outcome': 'bg-gray-100 text-gray-800'
    };
    return colors[step] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading proposal...</div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-gray-900">Proposal Not Found</h1>
        <p className="text-gray-600 mt-2">The proposal you're looking for doesn't exist.</p>
      </div>
    );
  }

  const userHasSubmittedQuestion = questions.some(q => q.userId === user?.id);
  const userHasSubmittedReaction = reactions.some(r => r.userId === user?.id);
  const userHasSubmittedObjection = objections.some(o => o.userId === user?.id);
  const userHasSubmittedConsent = consents.some(c => c.userId === user?.id);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Proposal Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{proposal.title}</CardTitle>
              <CardDescription className="mt-2">
                Created {formatDateTime(proposal.createdAt)}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStepColor(proposal.currentStep)}`}>
                {getStepName(proposal.currentStep)}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                {proposal.status}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">{proposal.description}</p>
          
          {proposal.stepEndTime && (
            <div className="mt-4 flex items-center space-x-2 text-sm">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-orange-600 font-medium">
                Time remaining: {formatTimeRemaining(proposal.stepEndTime)}
              </span>
            </div>
          )}
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-1">{getStepName(proposal.currentStep)}</h3>
            <p className="text-sm text-blue-800">{getStepDescription(proposal.currentStep)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Step-specific content */}
      {proposal.currentStep === 'clarifying_questions' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <span>Clarifying Questions</span>
            </CardTitle>
            <CardDescription>
              Ask questions to better understand the proposal (max 3 questions)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((question) => (
              <div key={question.id} className="border-l-4 border-blue-400 pl-4 py-2">
                <p className="text-gray-800">{question.question}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Asked {formatDateTime(question.createdAt)}
                </p>
              </div>
            ))}
            
            {questions.length < 3 && !userHasSubmittedQuestion && user?.role !== 'observer' && (
              <form onSubmit={handleSubmitQuestion} className="mt-4">
                <Input
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Ask a clarifying question..."
                  className="mb-2"
                />
                <Button type="submit" disabled={!newQuestion.trim()}>
                  Submit Question
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {proposal.currentStep === 'quick_reactions' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <span>Quick Reactions</span>
            </CardTitle>
            <CardDescription>
              Share your initial thoughts and reactions (max 300 characters)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {reactions.map((reaction) => (
              <div key={reaction.id} className="border-l-4 border-green-400 pl-4 py-2">
                <p className="text-gray-800">{reaction.reaction}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Shared {formatDateTime(reaction.createdAt)}
                </p>
              </div>
            ))}
            
            {!userHasSubmittedReaction && user?.role !== 'observer' && (
              <form onSubmit={handleSubmitReaction} className="mt-4">
                <textarea
                  value={newReaction}
                  onChange={(e) => setNewReaction(e.target.value)}
                  placeholder="Share your reaction..."
                  className="w-full border rounded-md p-2"
                  rows={3}
                  maxLength={300}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-500">{newReaction.length}/300</span>
                  <Button type="submit" disabled={!newReaction.trim()}>
                    Submit Reaction
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {proposal.currentStep === 'objections_round' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Objections</span>
            </CardTitle>
            <CardDescription>
              Voice any objections you may have to this proposal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {objections.map((objection) => (
              <div key={objection.id} className="border-l-4 border-orange-400 pl-4 py-2">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    objection.severity === 'deal_breaker' ? 'bg-red-100 text-red-800' :
                    objection.severity === 'major_concern' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {objection.severity.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-gray-800">{objection.objection}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Raised {formatDateTime(objection.createdAt)}
                </p>
              </div>
            ))}
            
            {!userHasSubmittedObjection && user?.role !== 'observer' && (
              <form onSubmit={handleSubmitObjection} className="mt-4">
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Severity Level
                  </label>
                  <select
                    value={objectionSeverity}
                    onChange={(e) => setObjectionSeverity(e.target.value as any)}
                    className="border rounded-md p-2"
                  >
                    <option value="minor_concern">Minor Concern</option>
                    <option value="major_concern">Major Concern</option>
                    <option value="deal_breaker">Deal Breaker</option>
                  </select>
                </div>
                <textarea
                  value={newObjection}
                  onChange={(e) => setNewObjection(e.target.value)}
                  placeholder="Describe your objection..."
                  className="w-full border rounded-md p-2"
                  rows={3}
                />
                <Button type="submit" disabled={!newObjection.trim()} className="mt-2">
                  Submit Objection
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {proposal.currentStep === 'consent_round' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Consent Round</span>
            </CardTitle>
            <CardDescription>
              Give your final consent decision on this proposal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {consents.map((consent) => (
              <div key={consent.id} className="border-l-4 border-emerald-400 pl-4 py-2">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    consent.choice === 'consent' ? 'bg-green-100 text-green-800' :
                    consent.choice === 'consent_with_reservations' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {consent.choice.replace(/_/g, ' ')}
                  </span>
                </div>
                {consent.reason && (
                  <p className="text-gray-800 mb-1">{consent.reason}</p>
                )}
                <p className="text-sm text-gray-500">
                  Decided {formatDateTime(consent.createdAt)}
                </p>
              </div>
            ))}
            
            {!userHasSubmittedConsent && user?.role !== 'observer' && (
              <form onSubmit={handleSubmitConsent} className="mt-4">
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Decision
                  </label>
                  <select
                    value={consentChoice}
                    onChange={(e) => setConsentChoice(e.target.value as any)}
                    className="border rounded-md p-2"
                  >
                    <option value="consent">Consent</option>
                    <option value="consent_with_reservations">Consent with Reservations</option>
                    <option value="withhold_consent">Withhold Consent</option>
                  </select>
                </div>
                
                {(consentChoice === 'consent_with_reservations' || consentChoice === 'withhold_consent') && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason (required)
                    </label>
                    <textarea
                      value={consentReason}
                      onChange={(e) => setConsentReason(e.target.value)}
                      placeholder="Explain your reasoning..."
                      className="w-full border rounded-md p-2"
                      rows={3}
                      required={consentChoice !== 'consent'}
                    />
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  disabled={
                    (consentChoice === 'consent_with_reservations' || consentChoice === 'withhold_consent') 
                    && !consentReason.trim()
                  }
                >
                  Submit Decision
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
