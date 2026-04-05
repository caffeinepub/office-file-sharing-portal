import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ExternalBlob,
  FileType,
  Submission,
  UserProfile,
  UserRole,
} from "../backend";
import { useActor } from "./useActor";

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useGetOwnSubmissions() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<Submission[]>({
    queryKey: ["ownSubmissions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOwnSubmissions();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useListAllSubmissions() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<Submission[]>({
    queryKey: ["allSubmissions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAllSubmissions();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useListAllUsers() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<UserProfile[]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAllUsers();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useAssignCallerUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.assignCallerUserRole(user, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
    },
  });
}

export function useSubmitFile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: [ExternalBlob, string, FileType, string]) => {
      if (!actor) throw new Error("Actor not available");
      return actor.submitFile(...params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ownSubmissions"] });
      queryClient.invalidateQueries({ queryKey: ["allSubmissions"] });
    },
  });
}

export function useReplyToSubmission() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      submissionId,
      replyMessage,
    }: {
      submissionId: bigint;
      replyMessage: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.replyToSubmission(submissionId, replyMessage);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allSubmissions"] });
      queryClient.invalidateQueries({ queryKey: ["ownSubmissions"] });
    },
  });
}

export function useCreateGroup() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      name,
      memberIds,
    }: {
      name: string;
      memberIds: Principal[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createGroup(name, memberIds);
    },
  });
}

export function useGetGroupMembers(groupId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<Principal[]>({
    queryKey: ["groupMembers", groupId?.toString()],
    queryFn: async () => {
      if (!actor || groupId === null) return [];
      return actor.getGroupMembers(groupId);
    },
    enabled: !!actor && !actorFetching && groupId !== null,
  });
}
