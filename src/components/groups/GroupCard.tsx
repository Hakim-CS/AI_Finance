import { Users, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getTotalGroupExpenses, getUserBalance } from "@/data/groupsData";
import { cn } from "@/lib/utils";
import { Group } from "@/hooks/useGroups";
import { useAuth } from "@/context/AuthContext";

interface GroupCardProps {
  group: Group;
  onClick: () => void;
}

export function GroupCard({ group, onClick }: GroupCardProps) {
  const { user } = useAuth();
  const totalExpenses = getTotalGroupExpenses(group as any);
  const userBalance = user ? getUserBalance(group as any, user.id.toString()) : 0;

  return (
    <Card
      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/30 group"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">{group.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{group.description}</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Members */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {group.members.slice(0, 4).map((member) => (
                <Avatar key={member.id} className="w-8 h-8 border-2 border-background">
                  <AvatarFallback className="text-xs bg-muted">
                    {member.name ? member.name.split(" ").map(n => n[0]).join("") : "?"}
                  </AvatarFallback>
                </Avatar>
              ))}
              {group.members.length > 4 && (
                <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                  +{group.members.length - 4}
                </div>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {group.members.length} members
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground">Total expenses</p>
              <p className="font-semibold">₺{totalExpenses.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Your balance</p>
              <Badge
                variant="secondary"
                className={cn(
                  "font-semibold",
                  userBalance > 0 && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                  userBalance < 0 && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                  userBalance === 0 && "bg-muted text-muted-foreground"
                )}
              >
                {userBalance > 0 ? "+" : ""}{userBalance === 0 ? "Settled" : `₺${userBalance.toFixed(2)}`}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
