import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Trophy, Medal, Award, Users, TrendingUp, Filter } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMembers, useLeaderboard } from '@/hooks/useMembers';

export default function Members() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'reputation' | 'posts' | 'joined' | 'name'>('reputation');
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'weekly' | 'monthly' | 'alltime'>('alltime');

  const { data: membersData, isLoading } = useMembers({ search, sortBy, limit: 50 });
  const { data: leaderboard } = useLeaderboard(leaderboardPeriod, 10);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground">#{index + 1}</span>;
  };

  return (
    <Layout>
      <div className="container px-2 sm:px-4 py-4 sm:py-8 max-w-full">
        <div className="flex flex-col gap-4 sm:gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                Community Members
              </h1>
              <p className="text-xs sm:text-base text-muted-foreground mt-0.5 sm:mt-1">
                {membersData?.total || 0} members
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Leaderboard */}
            <Card className="lg:col-span-1">
              <CardHeader className="p-3 sm:p-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Leaderboard
                </CardTitle>
                <Tabs value={leaderboardPeriod} onValueChange={(v) => setLeaderboardPeriod(v as typeof leaderboardPeriod)}>
                  <TabsList className="grid w-full grid-cols-3 h-8 sm:h-9">
                    <TabsTrigger value="weekly" className="text-[10px] sm:text-xs">Weekly</TabsTrigger>
                    <TabsTrigger value="monthly" className="text-[10px] sm:text-xs">Monthly</TabsTrigger>
                    <TabsTrigger value="alltime" className="text-[10px] sm:text-xs">All Time</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent className="p-2 sm:p-4 pt-0 space-y-1 sm:space-y-2">
                {leaderboard?.map((member, index) => (
                  <Link
                    key={member.id}
                    to={`/profile/${member.username}`}
                    className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg hover:bg-accent active:scale-[0.98] transition-all duration-200"
                  >
                    <div className="w-6 sm:w-8 flex justify-center">
                      {getRankIcon(index)}
                    </div>
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 ring-2 ring-primary/10">
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback className="text-xs sm:text-sm bg-primary/10 text-primary">{member.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">{member.display_name || member.username}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">@{member.username}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2">{member.reputation_points || 0} pts</Badge>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Members List */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              {/* Search and Filters */}
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search members..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-9 sm:h-10 text-sm"
                      />
                    </div>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                      <SelectTrigger className="w-full sm:w-40 h-9 sm:h-10 text-xs sm:text-sm">
                        <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reputation">Reputation</SelectItem>
                        <SelectItem value="joined">Join Date</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Members Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-muted" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 sm:h-4 w-24 bg-muted rounded" />
                            <div className="h-2 sm:h-3 w-16 bg-muted rounded" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  {membersData?.members.map((member) => (
                    <Link key={member.id} to={`/profile/${member.username}`}>
                      <Card className="hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-primary/10">
                              <AvatarImage src={member.avatar_url || undefined} />
                              <AvatarFallback className="text-sm bg-primary/10 text-primary">{member.username[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm sm:text-base truncate">
                                {member.display_name || member.username}
                              </p>
                              <p className="text-xs sm:text-sm text-muted-foreground">@{member.username}</p>
                              {member.bio && (
                                <p className="text-xs text-muted-foreground truncate mt-0.5 hidden sm:block">
                                  {member.bio}
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <Badge variant="outline" className="text-[10px] sm:text-xs">{member.reputation_points || 0} pts</Badge>
                              {member.location && (
                                <p className="text-[10px] text-muted-foreground mt-1 hidden sm:block">{member.location}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}

              {membersData?.members.length === 0 && !isLoading && (
                <Card>
                  <CardContent className="py-6 sm:py-8 text-center">
                    <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                    <p className="text-sm text-muted-foreground">No members found</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
