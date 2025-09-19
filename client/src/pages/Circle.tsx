import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'wouter';
import { useApi, useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { formatDateTime, getStepName } from '../lib/utils';

interface Circle {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  status: string;
  currentStep: string;
  stepEndTime: string | null;
  createdAt: string;
  createdBy: string;
  isActive: boolean;
}

export default function CirclePage() {
  const { id } = useParams<{ id: string }>();
  const { apiCall } = useApi();
  const { user } = useAuth();

  const [circle, setCircle] = useState<Circle | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [circleData, circleProposals] = await Promise.all([
          apiCall(`/circles/${id}`),
          apiCall(`/circles/${id}/proposals`),
        ]);
        setCircle(circleData);
        setProposals(circleProposals);
      } catch (error) {
        console.error('Failed to load circle data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const myProposals = proposals.filter(p => p.createdBy === user?.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading circle...</div>
      </div>
    );
  }

  if (!circle) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-gray-900">Circle Not Found</h1>
        <p className="text-gray-600 mt-2">The circle you're looking for doesn't exist.</p>
      </div>
    );
  }

  const activeProposals = proposals.filter(p => (typeof p.isActive === 'boolean' ? p.isActive : (p.status !== 'resolved' && p.status !== 'archived')));

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{circle.name}</h1>
          {circle.description && (
            <p className="text-gray-600 mt-1">{circle.description}</p>
          )}
        </div>
        <Button asChild>
          <Link href="/create-proposal">New Proposal</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Proposals</h2>
          <div className="space-y-4">
            {activeProposals.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  No active proposals in this circle
                </CardContent>
              </Card>
            ) : (
              activeProposals.map((proposal) => (
                <Card key={proposal.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                        {proposal.title}
                      </h3>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        {proposal.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {proposal.description}
                    </p>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>Current: {getStepName(proposal.currentStep)}</span>
                      <span>{formatDateTime(proposal.createdAt)}</span>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button asChild size="sm">
                        <Link href={`/proposal/${proposal.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">My Proposals</h2>
          <div className="space-y-4">
            {myProposals.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  You haven't created any proposals in this circle yet
                </CardContent>
              </Card>
            ) : (
              myProposals.map((proposal) => (
                <Card key={proposal.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{proposal.title}</CardTitle>
                    <CardDescription>{formatDateTime(proposal.createdAt)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-end">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/proposal/${proposal.id}`}>Open</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
