import { useParams, Link } from 'wouter';
import { useEffect, useState } from 'react';
import { useApi } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
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
  createdAt: string;
}

export default function CirclePage() {
  const { id } = useParams<{ id: string }>();
  const { apiCall } = useApi();
  const [circle, setCircle] = useState<Circle | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [c, ps] = await Promise.all([
          apiCall(`/circles/${id}`),
          apiCall(`/circles/${id}/proposals`)
        ]);
        setCircle(c);
        setProposals(ps);
      } catch (e) {
        // noop
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{circle.name}</CardTitle>
          <CardDescription>{circle.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Created {formatDateTime(circle.createdAt)}</p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Proposals</h2>
        <div className="space-y-4">
          {proposals.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">No proposals in this circle yet</CardContent>
            </Card>
          ) : (
            proposals.map((p) => (
              <Card key={p.id} className="hover:shadow-sm">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{p.title}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">{p.status}</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{p.description}</p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Current: {getStepName(p.currentStep)}</span>
                    <span>{formatDateTime(p.createdAt)}</span>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Link href={`/proposal/${p.id}`}>
                      <Button size="sm">View Details</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
