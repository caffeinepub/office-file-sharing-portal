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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Download,
  Eye,
  FileText,
  Filter,
  Image as ImageIcon,
  Loader2,
  Reply,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { FileStatus, FileType, type Submission } from "../backend";
import {
  useListAllSubmissions,
  useReplyToSubmission,
} from "../hooks/useQueries";

function formatDate(timestamp: bigint) {
  try {
    return new Date(Number(timestamp / 1_000_000n)).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      },
    );
  } catch {
    return "—";
  }
}

function truncatePrincipal(p: string) {
  if (p.length <= 14) return p;
  return `${p.slice(0, 7)}...${p.slice(-7)}`;
}

export default function AdminAllSubmissions() {
  const { data: submissions, isLoading } = useListAllSubmissions();
  const replyMutation = useReplyToSubmission();

  const [filter, setFilter] = useState<"all" | "pending" | "replied">("all");
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replySubmissionId, setReplySubmissionId] = useState<bigint | null>(
    null,
  );
  const [replyText, setReplyText] = useState("");

  // View dialog state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewSub, setViewSub] = useState<Submission | null>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const filtered = (submissions ?? [])
    .filter((s) => {
      if (filter === "pending") return s.status === FileStatus.pending;
      if (filter === "replied") return s.status === FileStatus.replied;
      return true;
    })
    .sort((a, b) => Number(b.timestamp - a.timestamp));

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
      toast.success("Reply sent!");
    } catch {
      toast.error("Failed to send reply.");
    }
  };

  const handleViewFile = (sub: Submission) => {
    setViewSub(sub);
    setViewUrl(null);
    setViewLoading(true);
    setViewDialogOpen(true);
    try {
      const url = sub.blob.getDirectURL();
      setViewUrl(url);
    } catch {
      toast.error("Failed to load file preview.");
    } finally {
      setViewLoading(false);
    }
  };

  const downloadBlob = async (sub: Submission) => {
    try {
      const url = sub.blob.getDirectURL();
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = sub.filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(objectUrl);
      toast.success(`Downloading ${sub.filename}`);
    } catch {
      toast.error("Failed to download file.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">All Submissions</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage and reply to all user file submissions
        </p>
      </div>

      <Card className="bg-card card-shadow border-border">
        <CardHeader className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-base font-semibold">
              {filtered.length} Submission{filtered.length !== 1 ? "s" : ""}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-muted-foreground" />
              <Select
                value={filter}
                onValueChange={(v) =>
                  setFilter(v as "all" | "pending" | "replied")
                }
              >
                <SelectTrigger
                  data-ocid="admin_submissions.filter.select"
                  className="w-36 h-8 text-xs"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div
              className="p-6 space-y-3"
              data-ocid="admin_submissions.loading_state"
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              data-ocid="admin_submissions.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <FileText size={42} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No submissions found</p>
              <p className="text-xs mt-1">Try changing the filter above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="pl-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      File Name
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Uploader
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Type
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Date
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Message
                    </TableHead>
                    <TableHead className="pr-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((sub, idx) => (
                    <motion.tr
                      key={sub.id.toString()}
                      data-ocid={`admin_submissions.item.${idx + 1}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.04 }}
                      className="border-border hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="pl-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
                            {sub.filetype === FileType.image ? (
                              <ImageIcon
                                size={13}
                                className="text-muted-foreground"
                              />
                            ) : (
                              <FileText
                                size={13}
                                className="text-muted-foreground"
                              />
                            )}
                          </div>
                          <span className="text-sm font-medium max-w-[140px] truncate">
                            {sub.filename}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono text-muted-foreground">
                          {truncatePrincipal(sub.uploader.toString())}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs uppercase font-semibold text-muted-foreground">
                          {sub.filetype}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
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
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(sub.timestamp)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground max-w-[120px] truncate block">
                          {sub.message || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="pr-5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Button
                            data-ocid={`admin_submissions.view.button.${idx + 1}`}
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewFile(sub)}
                            className="h-7 text-xs gap-1 border-border text-muted-foreground hover:text-foreground"
                          >
                            <Eye size={12} />
                            View
                          </Button>
                          <Button
                            data-ocid={`admin_submissions.download.button.${idx + 1}`}
                            size="sm"
                            variant="outline"
                            onClick={() => downloadBlob(sub)}
                            className="h-7 text-xs gap-1 border-border text-muted-foreground hover:text-foreground"
                          >
                            <Download size={12} />
                            Download
                          </Button>
                          <Button
                            data-ocid={`admin_submissions.reply.button.${idx + 1}`}
                            size="sm"
                            variant={
                              sub.status === FileStatus.pending
                                ? "default"
                                : "outline"
                            }
                            onClick={() => handleOpenReply(sub.id)}
                            className={`h-7 text-xs gap-1 ${
                              sub.status === FileStatus.pending
                                ? "bg-primary text-white"
                                : "border-border text-muted-foreground"
                            }`}
                          >
                            <Reply size={12} />
                            {sub.status === FileStatus.pending
                              ? "Reply"
                              : "Re-reply"}
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View File Dialog */}
      <Dialog
        open={viewDialogOpen}
        onOpenChange={(open) => {
          setViewDialogOpen(open);
          if (!open) {
            setViewSub(null);
            setViewUrl(null);
          }
        }}
      >
        <DialogContent
          data-ocid="admin_submissions.view.dialog"
          className="max-w-3xl w-full"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 truncate pr-6">
              {viewSub?.filetype === FileType.image ? (
                <ImageIcon
                  size={16}
                  className="shrink-0 text-muted-foreground"
                />
              ) : (
                <FileText
                  size={16}
                  className="shrink-0 text-muted-foreground"
                />
              )}
              <span className="truncate">
                {viewSub?.filename ?? "File Preview"}
              </span>
            </DialogTitle>
            <DialogDescription>
              {viewSub?.filetype === FileType.image
                ? "Image preview"
                : "PDF preview"}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-[320px] flex items-center justify-center bg-muted/30 rounded-lg overflow-hidden border border-border">
            {viewLoading ? (
              <div
                data-ocid="admin_submissions.view.loading_state"
                className="flex flex-col items-center gap-3 text-muted-foreground"
              >
                <Loader2 size={32} className="animate-spin" />
                <span className="text-sm">Loading preview…</span>
              </div>
            ) : viewUrl && viewSub?.filetype === FileType.image ? (
              <img
                src={viewUrl}
                alt={viewSub?.filename}
                className="max-w-full max-h-[60vh] object-contain rounded"
              />
            ) : viewUrl && viewSub?.filetype === FileType.pdf ? (
              <iframe
                src={viewUrl}
                title={viewSub?.filename}
                className="w-full h-[60vh] border-0 rounded"
              />
            ) : (
              <div
                data-ocid="admin_submissions.view.error_state"
                className="flex flex-col items-center gap-2 text-muted-foreground"
              >
                <FileText size={32} className="opacity-40" />
                <span className="text-sm">Could not load preview.</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              data-ocid="admin_submissions.view.close_button"
              variant="outline"
              onClick={() => setViewDialogOpen(false)}
              className="gap-1.5"
            >
              <X size={14} />
              Close
            </Button>
            {viewSub && (
              <Button
                data-ocid="admin_submissions.view.download_button"
                onClick={() => downloadBlob(viewSub)}
                className="gap-1.5 bg-primary text-white"
              >
                <Download size={14} />
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent data-ocid="admin_submissions.reply.dialog">
          <DialogHeader>
            <DialogTitle>Reply to Submission</DialogTitle>
            <DialogDescription>
              Your reply will be visible to the user in their submissions.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="reply-text" className="text-sm font-medium">
              Reply Message
            </Label>
            <Textarea
              id="reply-text"
              data-ocid="admin_submissions.reply.textarea"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply here..."
              className="mt-2 resize-none h-32"
            />
          </div>
          <DialogFooter>
            <Button
              data-ocid="admin_submissions.reply.cancel_button"
              variant="outline"
              onClick={() => setReplyDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="admin_submissions.reply.confirm_button"
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
