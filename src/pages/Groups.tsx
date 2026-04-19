import { useState } from "react";
import { Users, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { GroupCard } from "@/components/groups/GroupCard";
import { GroupDetail } from "@/components/groups/GroupDetail";
import { CreateGroupDialog } from "@/components/groups/CreateGroupDialog";
import { useGroups, Group } from "@/hooks/useGroups";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function Groups() {
  const { groups, isLoading, createGroup } = useGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { t } = useTranslation();

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateGroup = async (name: string, description: string, memberEmails: string[]) => {
    try {
      await createGroup({ name, description, memberEmails });
      toast({
        title: t('common.success'),
        description: t('groupsPage.groupCreated'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('common.tryAgain'),
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">{t('common.loadingGroups')}</p>
      </div>
    );
  }

  if (selectedGroup) {
    return (
      <div className="animate-fade-in">
        <GroupDetail group={selectedGroup as any} onBack={() => setSelectedGroupId(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('groupsPage.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('groupsPage.subtitle')}</p>
        </div>
        <CreateGroupDialog onCreateGroup={handleCreateGroup} />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('groupsPage.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Groups Grid */}
      {filteredGroups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onClick={() => setSelectedGroupId(group.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {searchQuery ? t('groupsPage.noGroupsFound') : t('groupsPage.noGroupsYet')}
          </h3>
          <p className="text-muted-foreground max-w-md mb-4">
            {searchQuery
              ? t('groupsPage.noResults')
              : t('groupsPage.createFirst')}
          </p>
        </div>
      )}
    </div>
  );
}
