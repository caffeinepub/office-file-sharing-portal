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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Clock, FileText, Loader2, Reply, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { FileStatus } from "../backend";
import type { UserProfile } from "../backend";
import {
  useListAllSubmissions,
  useListAllUsers,
  useReplyToSubmission,
} from "../hooks/useQueries";

type Page =
  | "dashboard"
  | "upload"
  | "my-submissions"
  | "groups"
  | "admin-submissions"
  | "admin-users";

interface AdminDashboardProps {
  profile: UserProfile | null;
  onNavigate: (page: Page) => void;
}

export default function AdminDashboard({
  profile,
  onNavigate,
}: AdminDashboardProps) {
  const { data: submissions, isLoading: subLoading } = useListAllSubmissions();
  const { data: users, isLoading: usersLoading } = useListAllUsers();
  const replyMutation = useReplyToSubmission();

  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replySubmissionId, setReplySubmissionId] = useState<bigint | null>(
    null,
  );
  const [replyText, setReplyText] = useState("");

  const totalUsers = users?.length ?? 0;
  const totalSubmissions = submissions?.length ?? 0;
  const pendingSubmissions =
    submissions?.filter((s) => s.status === FileStatus.pending).length ?? 0;

  const recentSubmissions =
    submissions
      ?.slice()
      .sort((a, b) => Number(b.timestamp - a.timestamp))
      .slice(0, 5) ?? [];

  const kpiCards = [
    {
      label: "Total Users",
      value: totalUsers,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Total Submissions",
      value: totalSubmissions,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Pending Submissions",
      value: pendingSubmissions,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  const handleOpenReply = (submissionId: bigint) => {
    setReplySubmissionId(submissionId);
    setReplyText("");
    setReplyDialogOpen(true);
  };

  const handleReplySubmit = async () => {
    if (!replySubmissionId || !replyText.trim()) {
      toast.error("Please enter a reply message.");
      return;
    }
    try {
      await replyMutation.mutateAsync({
        submissionId: replySubmissionId,
        replyMessage: replyText.trim(),
      });
      setReplyDialogOpen(false);
      toast.success("Reply sent successfully!");
    } catch {
      toast.error("Failed to send reply.");
    }
  };

  // Show profile name in header
  const greeting = profile?.username
    ? `Welcome, ${profile.username}`
    : "Admin Dashboard";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{greeting}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of all office portal activity
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
            >
              <Card className="bg-card card-shadow border-border">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-muted-foreground font-medium">
                      {card.label}
                    </p>
                    <div
                      className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}
                    >
                      <Icon size={16} className={card.color} />
                    </div>
                  </div>
                  {subLoading || usersLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground">
                      {card.value}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Two-column panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.3 }}
        >
          <Card className="bg-card card-shadow border-border h-full">
            <CardHeader className="px-5 pt-5 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Users</CardTitle>
                <Button
                  data-ocid="admin_dashboard.users.link"
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate("admin-users")}
                  className="text-primary text-xs h-7"
                >
                  View all
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {usersLoading ? (
                <div
                  className="p-5 space-y-2"
                  data-ocid="admin_dashboard.users.loading_state"
                >
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !users || users.length === 0 ? (
                <div
                  data-ocid="admin_dashboard.users.empty_state"
                  className="text-center py-12 text-muted-foreground"
                >
                  <Users size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No users yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="pl-5 text-xs font-semibold text-muted-foreground">
                        Username
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">
                        Role
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.slice(0, 5).map((user, idx) => (
                      <TableRow
                        key={`user-${user.username}-${idx}`}
                        data-ocid={`admin_dashboard.users.item.${idx + 1}`}
                        className="border-border"
                      >
                        <TableCell className="pl-5 text-sm font-medium">
                          {user.username}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {user.username === "Brahma CSC"
                              ? "Admin"
                              : "Member"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Submissions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34, duration: 0.3 }}
        >
          <Card className="bg-card card-shadow border-border h-full">
            <CardHeader className="px-5 pt-5 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  Recent Submissions
                </CardTitle>
                <Button
                  data-ocid="admin_dashboard.submissions.link"
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate("admin-submissions")}
                  className="text-primary text-xs h-7"
                >
                  View all
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {subLoading ? (
                <div
                  className="p-5 space-y-2"
                  data-ocid="admin_dashboard.submissions.loading_state"
                >
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : recentSubmissions.length === 0 ? (
                <div
                  data-ocid="admin_dashboard.submissions.empty_state"
                  className="text-center py-12 text-muted-foreground"
                >
                  <FileText size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No submissions yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="pl-5 text-xs font-semibold text-muted-foreground">
                        Filename
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">
                        Status
                      </TableHead>
                      <TableHead className="pr-5 text-xs font-semibold text-muted-foreground">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSubmissions.map((sub, idx) => (
                      <TableRow
                        key={sub.id.toString()}
                        data-ocid={`admin_dashboard.submissions.item.${idx + 1}`}
                        className="border-border"
                      >
                        <TableCell className="pl-5 text-sm font-medium max-w-[150px] truncate">
                          {sub.filename}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs px-2 py-0.5 rounded-full border ${
                              sub.status === FileStatus.pending
                                ? "status-pending"
                                : "status-replied"
                            }`}
                          >
                            {sub.status === FileStatus.pending
                              ? "Pending"
                              : "Replied"}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-5">
                          {sub.status === FileStatus.pending && (
                            <Button
                              data-ocid={`admin_dashboard.reply.button.${idx + 1}`}
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenReply(sub.id)}
                              className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/5"
                            >
                              <Reply size={12} />
                              Reply
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent data-ocid="admin_dashboard.reply.dialog">
          <DialogHeader>
            <DialogTitle>Reply to Submission</DialogTitle>
            <DialogDescription>
              Send a response to the user's file submission.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="reply-msg" className="text-sm font-medium">
              Your Reply
            </Label>
            <Textarea
              id="reply-msg"
              data-ocid="admin_dashboard.reply.textarea"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your response here..."
              className="mt-2 resize-none h-28"
            />
          </div>
          <DialogFooter>
            <Button
              data-ocid="admin_dashboard.reply.cancel_button"
              variant="outline"
              onClick={() => setReplyDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="admin_dashboard.reply.confirm_button"
              onClick={handleReplySubmit}
              disabled={replyMutation.isPending || !replyText.trim()}
              className="bg-primary text-white"
            >
              {replyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reply"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
