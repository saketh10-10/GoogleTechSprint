"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { getLeaderboard } from "@/lib/issuehub-service";
import { LeaderboardEntry } from "@/lib/types";

interface LeaderboardProps {
  entries?: LeaderboardEntry[];
  loading?: boolean;
}

export function Leaderboard({ entries, loading: propLoading }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(entries || []);
  const [loading, setLoading] = useState(propLoading !== undefined ? propLoading : true);

  useEffect(() => {
    if (entries) {
      setLeaderboard(entries);
      setLoading(propLoading !== undefined ? propLoading : false);
      return;
    }

    const loadLeaderboard = async () => {
      try {
        const data = await getLeaderboard();
        setLeaderboard(data);
      } catch (error) {
        console.error('Error loading leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [entries, propLoading]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground w-5 text-center">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case 2:
        return "bg-gray-400/10 text-gray-400 border-gray-400/20";
      case 3:
        return "bg-amber-600/10 text-amber-600 border-amber-600/20";
      default:
        return "bg-secondary text-muted-foreground border-secondary";
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-secondary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Community Leaders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading leaderboard...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-secondary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Community Leaders
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Top contributors ranked by reputation and impact
        </p>
      </CardHeader>
      <CardContent>
        {leaderboard.length > 0 ? (
          <div className="space-y-4">
            {leaderboard.map((entry) => (
              <div
                key={entry.userId}
                className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors duration-200"
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(entry.rank)}
                </div>

                {/* Avatar */}
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/20 text-primary text-sm">
                    {entry.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {entry.name}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getRankBadgeColor(entry.rank)}`}
                    >
                      Rank #{entry.rank}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>📝 {entry.postsCount} posts</span>
                    <span>💬 {entry.answersCount} answers</span>
                    <span>👍 {entry.totalUpvotesReceived} upvotes</span>
                  </div>
                </div>

                {/* Reputation Score */}
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">
                    {entry.reputation}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    reputation
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-secondary">
              <p className="text-xs text-muted-foreground text-center">
                Reputation = upvotes + (posts × 2) + answers
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No contributors yet</p>
            <p className="text-xs mt-1">Start posting and answering to appear here!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
