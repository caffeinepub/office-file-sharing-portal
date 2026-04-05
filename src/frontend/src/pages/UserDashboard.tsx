import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Clock, FileText, FolderOpen, Upload } from "lucide-react";
import { motion } from "motion/react";
import { FileStatus } from "../backend";
import type { UserProfile } from "../backend";
import { useGetOwnSubmissions } from "../hooks/useQueries";

type Page =
  | "dashboard"
  | "upload"
  | "my-submissions"
  | "groups"
  | "admin-submissions"
  | "admin-users";

interface UserDashboardProps {
  profile: UserProfile | null;
  onNavigate: (page: Page) => void;
  groupCount: number;
}

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

export default function UserDashboard({
  profile,
  onNavigate,
  groupCount,
}: UserDashboardProps) {
  const { data: submissions, isLoading } = useGetOwnSubmissions();

  const totalSubmissions = submissions?.length ?? 0;
  const pendingReplies =
    submissions?.filter((s) => s.status === FileStatus.pending).length ?? 0;
  const recentSubmissions =
    submissions
      ?.slice()
      .sort((a, b) => Number(b.timestamp - a.timestamp))
      .slice(0, 5) ?? [];

  const kpiCards = [
    {
      label: "Total Submissions",
      value: totalSubmissions,
      icon: FileText,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Pending Replies",
      value: pendingReplies,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Groups Joined",
      value: groupCount,
      icon: FolderOpen,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {profile?.username ?? "User"} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Here's an overview of your activity
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
                  {isLoading ? (
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

      {/* Quick Upload */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.3 }}
      >
        <Card className="bg-card card-shadow border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Upload size={22} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Quick Upload
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Send images or PDF files to the admin
                  </p>
                </div>
              </div>
              <Button
                data-ocid="dashboard.upload.primary_button"
                onClick={() => onNavigate("upload")}
                className="bg-primary hover:bg-primary/90 text-white gap-2"
              >
                Upload Files
                <ArrowRight size={15} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Submissions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, duration: 0.3 }}
      >
        <Card className="bg-card card-shadow border-border">
          <CardHeader className="pb-3 px-5 pt-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-foreground">
                Recent Submissions
              </CardTitle>
              <Button
                data-ocid="dashboard.submissions.link"
                variant="ghost"
                size="sm"
                onClick={() => onNavigate("my-submissions")}
                className="text-primary hover:text-primary/80 h-8 text-xs gap-1"
              >
                View all <ArrowRight size={13} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {isLoading ? (
              <div
                className="space-y-3"
                data-ocid="dashboard.submissions.loading_state"
              >
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentSubmissions.length === 0 ? (
              <div
                data-ocid="dashboard.submissions.empty_state"
                className="text-center py-10 text-muted-foreground"
              >
                <FileText size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No submissions yet.</p>
                <p className="text-xs mt-1">
                  Upload your first file to get started.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentSubmissions.map((sub, idx) => (
                  <div
                    key={sub.id.toString()}
                    data-ocid={`dashboard.submissions.item.${idx + 1}`}
                    className="flex items-center gap-3 py-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <FileText size={14} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {sub.filename}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(sub.timestamp)}
                      </p>
                    </div>
                    <Badge
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        sub.status === FileStatus.pending
                          ? "status-pending"
                          : "status-replied"
                      }`}
                      variant="outline"
                    >
                      {sub.status === FileStatus.pending
                        ? "Pending"
                        : "Replied"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
