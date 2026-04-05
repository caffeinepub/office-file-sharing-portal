import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type FileName = string;
export type GroupId = bigint;
export type SubmissionId = bigint;
export type UserId = Principal;
export type Username = string;
export interface Submission {
    id: SubmissionId;
    status: FileStatus;
    blob: ExternalBlob;
    filename: FileName;
    filetype: FileType;
    message: string;
    timestamp: bigint;
    uploader: UserId;
    reply?: string;
}
export interface UserProfile {
    username: Username;
}
export enum FileStatus {
    pending = "pending",
    replied = "replied"
}
export enum FileType {
    pdf = "pdf",
    image = "image"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addMemberToGroup(groupId: GroupId, member_id: UserId): Promise<boolean>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createGroup(name: string, member_ids: Array<UserId>): Promise<GroupId>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getGroupCreator(groupId: GroupId): Promise<UserId | null>;
    getGroupMembers(groupId: GroupId): Promise<Array<UserId>>;
    getOwnSubmissions(): Promise<Array<Submission>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isGroupCreator(groupId: GroupId): Promise<boolean>;
    isGroupMemberQuery(groupId: GroupId): Promise<boolean>;
    isSubmissionOwnerQuery(submissionId: SubmissionId): Promise<boolean>;
    listAllSubmissions(): Promise<Array<Submission>>;
    listAllUsers(): Promise<Array<UserProfile>>;
    removeGroupMember(groupId: GroupId, member_id: UserId): Promise<boolean>;
    replyToSubmission(submissionId: SubmissionId, replyMessage: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitFile(blob: ExternalBlob, filename: FileName, filetype: FileType, message: string): Promise<SubmissionId>;
}
