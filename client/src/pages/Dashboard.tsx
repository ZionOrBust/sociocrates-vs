import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useAuth, useApi } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { formatDateTime, getStepName } from '../lib/utils';
import { Plus, Clock, Users, FileText } from 'lucide-react';

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
}

export default function Dashboard() {
  const { user } = useAuth();
  const { apiCall } = useApi();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [circlesData] = await Promise.all([
          apiCall('/circles')
        ]);
        
        setCircles(circlesData);

        // Fetch proposals for each circle
        const allProposals: Proposal[] = [];
        for (const circle of circlesData) {
          try {
            const circleProposals = await apiCall(`/circles/${circle.id}/proposals`);
            allProposals.push(...circleProposals);
          } catch (error) {
            console.error(`Failed to fetch proposals for circle ${circle.id}:`, error);
          }
        }
        setProposals(allProposals);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const activeProposals = proposals.filter(p => p.status === 'active');
  const pendingProposals = proposals.filter(p => p.status === 'pending_consent');
  const myProposals = proposals.filter(p => p.createdBy === user?.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.name}. Here's what's happening in your circles.
          </p>
        </div>
        <Link href="/create-proposal">
          <Button className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Proposal</span>
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="w-8 h-8 text-blue-500 mr-4" />
            <div>
              <p className="text-2xl font-bold">{circles.length}</p>
              <p className="text-sm text-gray-600">My Circles</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Clock className="w-8 h-8 text-orange-500 mr-4" />
            <div>
              <p className="text-2xl font-bold">{activeProposals.length}</p>
              <p className="text-sm text-gray-600">Active Proposals</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <FileText className="w-8 h-8 text-green-500 mr-4" />
            <div>
              <p className="text-2xl font-bold">{myProposals.length}</p>
              <p className="text-sm text-gray-600">My Proposals</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Clock className="w-8 h-8 text-purple-500 mr-4" />
            <div>
              <p className="text-2xl font-bold">{pendingProposals.length}</p>
              <p className="text-sm text-gray-600">Pending Consent</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Proposals */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Proposals</h2>
          <div className="space-y-4">
            {activeProposals.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  No active proposals at the moment
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
                      <Link href={`/proposal/${proposal.id}`}>
                        <Button size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* My Circles */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">My Circles</h2>
          <div className="space-y-4">
            {circles.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  You're not a member of any circles yet
                </CardContent>
              </Card>
            ) : (
              circles.map((circle) => (
                <Card key={circle.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{circle.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {circle.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        Created {formatDateTime(circle.createdAt)}
                      </span>
                      <div className="space-x-2">
                        <Button size="sm" variant="outline">
                          View Circle
                        </Button>
                      </div>
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
