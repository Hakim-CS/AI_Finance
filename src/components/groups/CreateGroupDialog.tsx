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

interface CreateGroupDialogProps {
  onCreateGroup: (name: string, description: string, memberEmails: string[]) => void;
}

export function CreateGroupDialog({ onCreateGroup }: CreateGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberEmails, setMemberEmails] = useState<string[]>([]);

  const handleAddMember = () => {
    const email = memberEmail.trim().toLowerCase();
    if (!email) return;
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    if (memberEmails.includes(email)) {
      toast.error("This email is already added");
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
      toast.error("Please enter a group name");
      return;
    }
    
    onCreateGroup(name.trim(), description.trim(), memberEmails);
    toast.success("Group created successfully!");
    
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
          Create Group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription>
            Create a group to split expenses with friends, family, or colleagues.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              placeholder="e.g., Roommates, Trip to Paris"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="What's this group for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="members">Add Members</Label>
            <div className="flex gap-2">
              <Input
                id="members"
                placeholder="Enter email address"
                type="email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddMember())}
              />
              <Button type="button" variant="outline" onClick={handleAddMember}>
                Add
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
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="gradient-primary">
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
