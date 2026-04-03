'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PendingIdea {
  id: string;
  title: string;
  oneLiner: string;
  score: number;
  verdict: string;
  category: string;
  tags: string[];
  createdAt: string;
}

export default function AdminIdeasPage() {
  const [ideas, setIdeas] = useState<PendingIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPendingIdeas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/ideas');
      if (!response.ok) {
        throw new Error('Failed to fetch pending ideas');
      }
      const data = await response.json();
      setIdeas(data.ideas || []);
    } catch (error) {
      console.error('Error fetching ideas:', error);
      toast.error('Failed to load pending ideas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingIdeas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'feature') => {
    try {
      setActionLoading(`${action}-${id}`);
      const response = await fetch('/api/admin/ideas', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, action }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${action} idea`);
      }

      // Remove the idea from the list
      setIdeas((prev) => prev.filter((idea) => idea.id !== id));
      toast.success(`Idea ${action}d successfully`);
    } catch (error) {
      console.error(`Error ${action}ing idea:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to ${action} idea`);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (score >= 65) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (score >= 50) return 'bg-slate-100 text-slate-700 border-slate-200';
    if (score >= 35) return 'bg-amber-50 text-amber-600 border-amber-100';
    return 'bg-red-50 text-red-600 border-red-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">AI Idea Curation</h1>
          <p className="text-slate-600 mt-2">
            Review and curate AI-generated startup ideas
          </p>
        </div>

        {ideas.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No pending ideas
              </h3>
              <p className="text-slate-600 text-center max-w-sm">
                All AI-generated ideas have been reviewed. New ideas will appear here when generated.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {ideas.map((idea) => (
              <Card key={idea.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-slate-900 leading-tight">
                        {idea.title}
                      </CardTitle>
                      <p className="text-slate-600 text-sm mt-1">{idea.oneLiner}</p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`shrink-0 ${getScoreColor(idea.score)}`}
                    >
                      Score: {idea.score}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {idea.category}
                    </Badge>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="text-slate-500 text-xs">
                      {formatDate(idea.createdAt)}
                    </span>
                    {idea.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs bg-slate-100 text-slate-600"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAction(idea.id, 'approve')}
                      disabled={!!actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {actionLoading === `approve-${idea.id}` ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-1" />
                      )}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(idea.id, 'feature')}
                      disabled={!!actionLoading}
                      className="border-amber-200 hover:bg-amber-50 text-amber-700"
                    >
                      {actionLoading === `feature-${idea.id}` ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Star className="h-4 w-4 mr-1" />
                      )}
                      Feature
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(idea.id, 'reject')}
                      disabled={!!actionLoading}
                      className="border-red-200 hover:bg-red-50 text-red-700"
                    >
                      {actionLoading === `reject-${idea.id}` ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-1" />
                      )}
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
