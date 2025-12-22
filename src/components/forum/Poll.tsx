import { useState } from 'react';
import { Check, Vote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

interface PollProps {
  threadId: string;
}

interface PollOption {
  text: string;
}

export function Poll({ threadId }: PollProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);

  // Fetch poll data
  const { data: poll, isLoading } = useQuery({
    queryKey: ['poll', threadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .eq('thread_id', threadId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Fetch votes
  const { data: votes } = useQuery({
    queryKey: ['poll-votes', poll?.id],
    queryFn: async () => {
      if (!poll) return [];
      const { data, error } = await supabase
        .from('poll_votes')
        .select('*')
        .eq('poll_id', poll.id);

      if (error) throw error;
      return data;
    },
    enabled: !!poll,
  });

  // Check if user has voted
  const userVote = votes?.find(v => v.user_id === user?.id);
  const hasVoted = !!userVote;

  // Calculate vote counts
  const voteCounts: Record<number, number> = {};
  const totalVotes = votes?.length || 0;
  
  votes?.forEach(vote => {
    voteCounts[vote.option_index] = (voteCounts[vote.option_index] || 0) + 1;
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async (optionIndices: number[]) => {
      if (!user || !poll) throw new Error('Not authenticated or no poll');

      // For single choice, just insert one vote
      // For multiple choice, insert multiple votes
      const votesToInsert = optionIndices.map(index => ({
        poll_id: poll.id,
        user_id: user.id,
        option_index: index,
      }));

      const { error } = await supabase.from('poll_votes').insert(votesToInsert);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poll-votes', poll?.id] });
      toast({ title: 'Vote submitted!' });
      setSelectedOptions([]);
    },
    onError: () => {
      toast({ title: 'Failed to vote', variant: 'destructive' });
    },
  });

  const handleVote = () => {
    if (selectedOptions.length === 0) {
      toast({ title: 'Please select an option', variant: 'destructive' });
      return;
    }
    voteMutation.mutate(selectedOptions);
  };

  const handleOptionChange = (index: number, checked: boolean) => {
    if (poll?.is_multiple_choice) {
      if (checked) {
        setSelectedOptions(prev => [...prev, index]);
      } else {
        setSelectedOptions(prev => prev.filter(i => i !== index));
      }
    } else {
      setSelectedOptions([index]);
    }
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="py-6">
          <div className="h-4 w-1/3 bg-muted rounded mb-4" />
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded" />
            <div className="h-8 bg-muted rounded" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!poll) return null;

  const options = (Array.isArray(poll.options) ? poll.options : []) as PollOption[];
  const isExpired = poll.expires_at && new Date(poll.expires_at) < new Date();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Vote className="h-5 w-5 text-primary" />
            {poll.question}
          </CardTitle>
          {poll.is_multiple_choice && (
            <Badge variant="secondary">Multiple Choice</Badge>
          )}
        </div>
        {poll.expires_at && (
          <p className="text-sm text-muted-foreground">
            {isExpired ? 'Ended ' : 'Ends '}
            {formatDistanceToNow(new Date(poll.expires_at), { addSuffix: true })}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Show results if voted or expired */}
        {(hasVoted || isExpired) ? (
          <div className="space-y-3">
            {options.map((option, index) => {
              const count = voteCounts[index] || 0;
              const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              const isUserChoice = userVote?.option_index === index;

              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      {option.text}
                      {isUserChoice && <Check className="h-4 w-4 text-primary" />}
                    </span>
                    <span className="text-muted-foreground">{percentage}% ({count})</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
            <p className="text-sm text-muted-foreground text-center pt-2">
              {totalVotes} vote{totalVotes !== 1 ? 's' : ''} total
            </p>
          </div>
        ) : (
          /* Show voting options */
          <div className="space-y-3">
            {poll.is_multiple_choice ? (
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Checkbox
                      id={`option-${index}`}
                      checked={selectedOptions.includes(index)}
                      onCheckedChange={(checked) => handleOptionChange(index, !!checked)}
                      disabled={!user || isExpired}
                    />
                    <Label htmlFor={`option-${index}`} className="cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <RadioGroup
                value={selectedOptions[0]?.toString()}
                onValueChange={(value) => setSelectedOptions([parseInt(value)])}
                disabled={!user || isExpired}
              >
                {options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {user ? (
              <Button
                onClick={handleVote}
                disabled={selectedOptions.length === 0 || voteMutation.isPending || isExpired}
                className="w-full mt-4"
              >
                {voteMutation.isPending ? 'Submitting...' : 'Vote'}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground text-center pt-2">
                Sign in to vote
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
