import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth, useApi } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { useToast } from '../components/ui/toaster';

interface Circle {
  id: string;
  name: string;
  description: string;
}

export default function CreateProposal() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [circleId, setCircleId] = useState('');
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCircles, setLoadingCircles] = useState(true);
  
  const { user } = useAuth();
  const { apiCall } = useApi();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCircles = async () => {
      try {
        const data = await apiCall('/circles');
        setCircles(data);
        if (data.length > 0) {
          setCircleId(data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch circles:', error);
        toast({
          title: 'Failed to load circles',
          description: 'Could not load available circles',
          variant: 'destructive',
        });
      } finally {
        setLoadingCircles(false);
      }
    };

    fetchCircles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!circleId) {
      toast({
        title: 'Please select a circle',
        description: 'You must select a circle for your proposal',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const proposal = await apiCall('/proposals', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          circleId,
        }),
      });

      toast({
        title: 'Proposal created',
        description: 'Your proposal has been created successfully',
      });

      setLocation(`/proposal/${proposal.id}`);
    } catch (error: any) {
      toast({
        title: 'Failed to create proposal',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingCircles) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading circles...</div>
      </div>
    );
  }

  if (circles.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>No Circles Available</CardTitle>
            <CardDescription>
              You need to be a member of at least one circle to create a proposal.
              Please contact an administrator to be added to a circle.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Proposal</h1>
        <p className="text-gray-600 mt-1">
          Submit a new proposal for consideration by your circle
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Proposal Details</CardTitle>
          <CardDescription>
            Provide a clear title and description for your proposal
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div>
              <label htmlFor="circle" className="block text-sm font-medium text-gray-700 mb-2">
                Circle
              </label>
              <select
                id="circle"
                value={circleId}
                onChange={(e) => setCircleId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a circle</option>
                {circles.map((circle) => (
                  <option key={circle.id} value={circle.id}>
                    {circle.name}
                  </option>
                ))}
              </select>
              {circleId && (
                <p className="text-sm text-gray-600 mt-1">
                  {circles.find(c => c.id === circleId)?.description}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Proposal Title
              </label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Enter a clear, descriptive title"
                maxLength={255}
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Proposal Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Provide a detailed description of your proposal, including the rationale and expected outcomes"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={6}
              />
              <p className="text-sm text-gray-500 mt-1">
                {description.length} characters
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">What happens next?</h3>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Your proposal will be reviewed by circle members</li>
                <li>2. The facilitator will schedule it for the sociocratic process</li>
                <li>3. The 7-step decision-making process will begin</li>
                <li>4. You'll receive notifications at each step</li>
              </ol>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setLocation('/dashboard')}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={loading || !title || !description || !circleId}
            >
              {loading ? 'Creating...' : 'Create Proposal'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
