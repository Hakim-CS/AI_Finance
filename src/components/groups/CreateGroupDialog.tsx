import { useState } from "react";
import { Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface CreateGroupDialogProps {
  onCreateGroup: (name: string, description: string, memberEmails: string[]) => void;
}

export function CreateGroupDialog({ onCreateGroup }: CreateGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberEmails, setMemberEmails] = useState<string[]>([]);
  const { t } = useTranslation();

  const handleAddMember = () => {
    const email = memberEmail.trim().toLowerCase();
    if (!email) return;
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(t('groupsPage.errors.invalidEmail'));
      return;
    }
    
    if (memberEmails.includes(email)) {
      toast.error(t('groupsPage.errors.emailExists'));
      return;
    }
    
    setMemberEmails([...memberEmails, email]);
    setMemberEmail("");
  };

  const handleRemoveMember = (email: string) => {
    setMemberEmails(memberEmails.filter(e => e !== email));
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error(t('groupsPage.errors.nameRequired'));
      return;
    }
    
    onCreateGroup(name.trim(), description.trim(), memberEmails);
    toast.success(t('groupsPage.groupCreated'));
    
    // Reset form
    setName("");
    setDescription("");
    setMemberEmails([]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          {t('groupsPage.createGroup')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('groupsPage.createNewGroup')}</DialogTitle>
          <DialogDescription>
            {t('groupsPage.createDialogDesc')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('groupsPage.groupName')}</Label>
            <Input
              id="name"
              placeholder={t('groupsPage.groupNamePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">{t('groupsPage.descriptionOptional')}</Label>
            <Textarea
              id="description"
              placeholder={t('groupsPage.descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="members">{t('groupsPage.addMembers')}</Label>
            <div className="flex gap-2">
              <Input
                id="members"
                placeholder={t('groupsPage.memberEmailPlaceholder')}
                type="email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddMember())}
              />
              <Button type="button" variant="outline" onClick={handleAddMember}>
                {t('common.add')}
              </Button>
            </div>
            
            {memberEmails.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {memberEmails.map((email) => (
                  <Badge key={email} variant="secondary" className="pl-2 pr-1 py-1">
                    {email}
                    <button
                      onClick={() => handleRemoveMember(email)}
                      className="ml-1 p-0.5 rounded-full hover:bg-muted-foreground/20"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} className="gradient-primary">
            {t('groupsPage.createGroup')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
