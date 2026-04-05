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
import { Users } from "lucide-react";
import { motion } from "motion/react";
import { useListAllUsers } from "../hooks/useQueries";

export default function AdminAllUsers() {
  const { data: users, isLoading } = useListAllUsers();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">All Users</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage all registered portal users
        </p>
      </div>

      {/* KPI */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-card card-shadow border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users size={22} className="text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  Total Registered Users
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold text-foreground">
                    {users?.length ?? 0}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <Card className="bg-card card-shadow border-border">
          <CardHeader className="px-5 pt-5 pb-3">
            <CardTitle className="text-base font-semibold">
              User Directory
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div
                className="p-6 space-y-3"
                data-ocid="admin_users.loading_state"
              >
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : !users || users.length === 0 ? (
              <div
                data-ocid="admin_users.empty_state"
                className="text-center py-16 text-muted-foreground"
              >
                <Users size={42} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No users registered yet</p>
                <p className="text-xs mt-1">
                  Users appear here after their first login.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="pl-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        #
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Username
                      </TableHead>
                      <TableHead className="pr-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Role
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user, idx) => (
                      <motion.tr
                        key={`user-${user.username}-${idx}`}
                        data-ocid={`admin_users.item.${idx + 1}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="border-border hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="pl-5 text-sm text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {user.username[0]?.toUpperCase() ?? "?"}
                            </div>
                            <span className="text-sm font-medium text-foreground">
                              {user.username}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="pr-5">
                          <Badge
                            variant="outline"
                            className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                              user.username === "Brahma CSC"
                                ? "bg-primary/10 text-primary border-primary/20"
                                : "text-muted-foreground"
                            }`}
                          >
                            {user.username === "Brahma CSC"
                              ? "Admin"
                              : "Member"}
                          </Badge>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
