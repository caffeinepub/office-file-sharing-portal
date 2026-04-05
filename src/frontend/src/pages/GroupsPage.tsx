import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Principal } from "@icp-sdk/core/principal";
import {
  FolderOpen,
  Loader2,
  Plus,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCreateGroup, useGetGroupMembers } from "../hooks/useQueries";

interface StoredGroup {
  id: string;
  name: string;
  createdAt: number;
}

function validatePrincipal(text: string): boolean {
  try {
    Principal.fromText(text);
    return true;
  } catch {
    return false;
  }
}

function truncatePrincipal(p: string) {
  if (p.length <= 14) return p;
  return `${p.slice(0, 6)}...${p.slice(-6)}`;
}

function useStoredGroups(principalStr: string) {
  const key = `office_portal_groups_${principalStr}`;
  const [groups, setGroups] = useState<StoredGroup[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? "[]");
    } catch {
      return [];
    }
  });

  const addGroup = (group: StoredGroup) => {
    setGroups((prev) => {
      const next = [...prev, group];
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  };

  const removeGroup = (id: string) => {
    setGroups((prev) => {
      const next = prev.filter((g) => g.id !== id);
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  };

  return { groups, addGroup, removeGroup };
}

interface GroupCardProps {
  group: StoredGroup;
  onRemove: (id: string) => void;
  index: number;
}

function GroupCard({ group, onRemove, index }: GroupCardProps) {
  const groupId = BigInt(group.id);
  const { data: members, isLoading } = useGetGroupMembers(groupId);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        data-ocid={`groups.item.${index + 1}`}
        className="bg-card card-shadow border-border"
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FolderOpen size={18} className="text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{group.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Created {new Date(group.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              type="button"
              data-ocid={`groups.delete_button.${index + 1}`}
              onClick={() => onRemove(group.id)}
              className="text-muted-foreground hover:text-destructive transition-colors p-1"
            >
              <Trash2 size={15} />
            </button>
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Users size={13} className="text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                {isLoading
                  ? "Loading members..."
                  : `${members?.length ?? 0} member${members?.length !== 1 ? "s" : ""}`}
              </span>
            </div>
            {!isLoading && members && members.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {members.slice(0, 6).map((m) => (
                  <Badge
                    key={m.toString()}
                    variant="outline"
                    className="text-xs px-2 py-0.5 rounded-full font-mono"
                  >
                    {truncatePrincipal(m.toString())}
                  </Badge>
                ))}
                {members.length > 6 && (
                  <Badge
                    variant="outline"
                    className="text-xs px-2 py-0.5 rounded-full"
                  >
                    +{members.length - 6} more
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function GroupsPage() {
  const { identity } = useInternetIdentity();
  const principalStr = identity?.getPrincipal().toString() ?? "anonymous";
  const { groups, addGroup, removeGroup } = useStoredGroups(principalStr);
  const createGroupMutation = useCreateGroup();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [memberInput, setMemberInput] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [memberError, setMemberError] = useState("");

  const handleAddMember = () => {
    const trimmed = memberInput.trim();
    if (!trimmed) return;
    if (!validatePrincipal(trimmed)) {
      setMemberError("Invalid Principal ID format.");
      return;
    }
    if (members.includes(trimmed)) {
      setMemberError("This member is already added.");
      return;
    }
    setMembers((prev) => [...prev, trimmed]);
    setMemberInput("");
    setMemberError("");
  };

  const handleRemoveMember = (p: string) => {
    setMembers((prev) => prev.filter((m) => m !== p));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Please enter a group name.");
      return;
    }
    try {
      const principalIds = members.map((m) => Principal.fromText(m));
      const groupId = await createGroupMutation.mutateAsync({
        name: groupName.trim(),
        memberIds: principalIds,
      });
      addGroup({
        id: groupId.toString(),
        name: groupName.trim(),
        createdAt: Date.now(),
      });
      setDialogOpen(false);
      setGroupName("");
      setMembers([]);
      setMemberInput("");
      toast.success(`Group "${groupName.trim()}" created!`);
    } catch {
      toast.error("Failed to create group. Please try again.");
    }
  };

  const resetDialog = () => {
    setGroupName("");
    setMembers([]);
    setMemberInput("");
    setMemberError("");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Groups</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your collaboration groups
          </p>
        </div>

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetDialog();
          }}
        >
          <DialogTrigger asChild>
            <Button
              data-ocid="groups.open_modal_button"
              className="bg-primary hover:bg-primary/90 text-white gap-2"
            >
              <Plus size={16} />
              Create New Group
            </Button>
          </DialogTrigger>
          <DialogContent data-ocid="groups.dialog" className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
              <DialogDescription>
                Create a group and add members by entering their Principal IDs.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="group-name" className="text-sm font-medium">
                  Group Name
                </Label>
                <Input
                  id="group-name"
                  data-ocid="groups.input"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Marketing Team"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Add Members</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    data-ocid="groups.search_input"
                    value={memberInput}
                    onChange={(e) => {
                      setMemberInput(e.target.value);
                      setMemberError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                    placeholder="Enter Principal ID"
                    className="flex-1 font-mono text-xs"
                  />
                  <Button
                    type="button"
                    data-ocid="groups.secondary_button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddMember}
                    className="gap-1.5 flex-shrink-0"
                  >
                    <UserPlus size={14} />
                    Add
                  </Button>
                </div>
                {memberError && (
                  <p
                    data-ocid="groups.error_state"
                    className="text-xs text-destructive mt-1"
                  >
                    {memberError}
                  </p>
                )}
              </div>

              {/* Member pills */}
              {members.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    {members.length} member{members.length !== 1 ? "s" : ""}{" "}
                    added
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {members.map((m) => (
                      <div
                        key={m}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-mono border border-border"
                      >
                        <span>{truncatePrincipal(m)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m)}
                          className="text-muted-foreground hover:text-destructive ml-0.5"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                data-ocid="groups.cancel_button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                data-ocid="groups.confirm_button"
                onClick={handleCreateGroup}
                disabled={createGroupMutation.isPending || !groupName.trim()}
                className="bg-primary text-white"
              >
                {createGroupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Group"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <Card className="bg-card card-shadow border-border">
          <CardContent
            className="py-16 text-center"
            data-ocid="groups.empty_state"
          >
            <FolderOpen
              size={42}
              className="mx-auto mb-3 text-muted-foreground opacity-30"
            />
            <p className="text-sm font-medium text-muted-foreground">
              No groups yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Create your first group to start collaborating.
            </p>
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((group, idx) => (
              <GroupCard
                key={group.id}
                group={group}
                onRemove={removeGroup}
                index={idx}
              />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
