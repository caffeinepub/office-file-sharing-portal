import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Image as ImageIcon, MessageSquare } from "lucide-react";
import { motion } from "motion/react";
import { FileStatus, FileType } from "../backend";
import { useGetOwnSubmissions } from "../hooks/useQueries";

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

export default function MySubmissions() {
  const { data: submissions, isLoading } = useGetOwnSubmissions();

  const sorted =
    submissions?.slice().sort((a, b) => Number(b.timestamp - a.timestamp)) ??
    [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Submissions</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track all your uploaded files and admin responses
        </p>
      </div>

      <Card className="bg-card card-shadow border-border">
        <CardHeader className="px-5 pt-5 pb-3">
          <CardTitle className="text-base font-semibold">
            Submitted Files
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div
              className="p-6 space-y-3"
              data-ocid="submissions.loading_state"
            >
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div
              data-ocid="submissions.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <FileText size={42} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No submissions yet</p>
              <p className="text-xs mt-1">
                Upload a file to send it to the admin.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pl-5">
                      File Name
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
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pr-5">
                      Admin Reply
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((sub, idx) => (
                    <TableRow
                      key={sub.id.toString()}
                      data-ocid={`submissions.item.${idx + 1}`}
                      className="border-border hover:bg-muted/30"
                    >
                      <TableCell className="pl-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
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
                          <span className="text-sm font-medium text-foreground max-w-[180px] truncate">
                            {sub.filename}
                          </span>
                        </div>
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
                        <span className="text-sm text-muted-foreground max-w-[150px] truncate block">
                          {sub.message || (
                            <span className="italic opacity-50">—</span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="pr-5">
                        {sub.reply ? (
                          <div className="flex items-start gap-1.5">
                            <MessageSquare
                              size={13}
                              className="text-emerald-600 mt-0.5 flex-shrink-0"
                            />
                            <span className="text-sm text-foreground max-w-[180px] truncate">
                              {sub.reply}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Awaiting reply
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
