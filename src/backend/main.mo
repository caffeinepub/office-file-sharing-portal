import Map "mo:core/Map";
import Set "mo:core/Set";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Include Mixins
  let accessControlState = AccessControl.initState();
  include MixinStorage();
  include MixinAuthorization(accessControlState);

  // Timestamp
  var groupIdGenerator = 0;
  var submissionIdGenerator = 0;

  // Types
  type SubmissionId = Nat;
  type GroupId = Nat;
  type Username = Text;
  type UserId = Principal;
  type FileName = Text;

  type FileType = {
    #image;
    #pdf;
  };

  type FileStatus = {
    #pending;
    #replied;
  };

  type Submission = {
    id : SubmissionId;
    uploader : UserId;
    blob : Storage.ExternalBlob;
    filename : FileName;
    filetype : FileType;
    message : Text;
    timestamp : Int;
    status : FileStatus;
    reply : ?Text;
  };

  module Submission {
    public func compareById(a : Submission, b : Submission) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  type Group = {
    id : GroupId;
    creator : UserId;
    name : Text;
    members : [UserId];
    created_at : Int;
  };

  module Group {
    public func compareById(a : Group, b : Group) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  type UserProfile = {
    username : Username;
    // add other user metadata if needed
  };

  module UserProfile {
    public func compareByUsername(a : UserProfile, b : UserProfile) : Order.Order {
      Text.compare(a.username, b.username);
    };
  };

  // Persistent State
  let submissions = Map.empty<SubmissionId, Submission>();
  let groups = Map.empty<GroupId, Group>();
  let u2p = Map.empty<UserId, UserProfile>();

  // Guard Functions for Authorization

  func isSubmissionOwner(caller : Principal, submissionId : SubmissionId) : Bool {
    switch (submissions.get(submissionId)) {
      case (null) { false };
      case (?submission) { submission.uploader == caller };
    };
  };

  func isGroupMember(caller : Principal, groupId : GroupId) : Bool {
    switch (groups.get(groupId)) {
      case (null) { false };
      case (?group) {
        group.members.find(func(member) { member == caller }) != null;
      };
    };
  };

  func isGroupCreatorInternal(caller : Principal, groupId : GroupId) : Bool {
    switch (groups.get(groupId)) {
      case (null) { false };
      case (?group) { group.creator == caller };
    };
  };

  // User Functions

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    u2p.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    u2p.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    let currentUserId = caller;
    switch (u2p.get(currentUserId)) {
      case (?existingProfile) {
        // Update existing user
        u2p.add(currentUserId, profile);
      };
      case (null) {
        // New user
        u2p.add(currentUserId, profile);
      };
    };
  };

  // Submission Functions

  public shared ({ caller }) func submitFile(blob : Storage.ExternalBlob, filename : FileName, filetype : FileType, message : Text) : async SubmissionId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit files");
    };
    let currentUserId = caller;
    let submissionId = submissionIdGenerator;
    submissionIdGenerator += 1;

    let submission : Submission = {
      id = submissionId;
      uploader = currentUserId;
      blob;
      filename;
      filetype;
      message;
      timestamp = Time.now();
      status = #pending;
      reply = null;
    };

    submissions.add(submissionId, submission);
    submissionId;
  };

  public shared ({ caller }) func replyToSubmission(submissionId : SubmissionId, replyMessage : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can reply to submissions");
    };
    switch (submissions.get(submissionId)) {
      case (null) {
        Runtime.trap("Submission not found");
      };
      case (?submission) {
        let updatedSubmission : Submission = {
          id = submission.id;
          uploader = submission.uploader;
          blob = submission.blob;
          filename = submission.filename;
          filetype = submission.filetype;
          message = submission.message;
          timestamp = submission.timestamp;
          status = #replied;
          reply = ?replyMessage;
        };
        submissions.add(submissionId, updatedSubmission);
      };
    };
  };

  public query ({ caller }) func getOwnSubmissions() : async [Submission] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view submissions");
    };
    let currentUserId = caller;
    submissions.values().toArray().filter(
      func(submission) {
        submission.uploader == currentUserId;
      }
    ).sort(Submission.compareById);
  };

  // Group Functions

  public shared ({ caller }) func createGroup(name : Text, member_ids : [UserId]) : async GroupId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create groups");
    };
    let currentUserId = caller;
    let groupId = groupIdGenerator;
    groupIdGenerator += 1;

    let group : Group = {
      id = groupId;
      creator = currentUserId;
      name;
      members = member_ids.concat([currentUserId]);
      created_at = Time.now();
    };
    groups.add(groupId, group);

    groupId;
  };

  public shared ({ caller }) func addMemberToGroup(groupId : GroupId, member_id : UserId) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add members to groups");
    };
    if (not isGroupCreatorInternal(caller, groupId) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only group creator or admin can add members");
    };
    switch (groups.get(groupId)) {
      case (null) {
        Runtime.trap("Group not found");
      };
      case (?group) {
        // Check if already a member
        if (group.members.find(func(id) { id == member_id }) != null) {
          true;
        } else {
          let updatedMembers = group.members.concat([member_id]);
          let updatedGroup : Group = {
            id = group.id;
            creator = group.creator;
            name = group.name;
            members = updatedMembers;
            created_at = group.created_at;
          };
          groups.add(groupId, updatedGroup);
          true;
        };
      };
    };
  };

  // Admin Functions

  public query ({ caller }) func listAllUsers() : async [UserProfile] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can list all users");
    };
    u2p.values().toArray().sort(UserProfile.compareByUsername);
  };

  public query ({ caller }) func listAllSubmissions() : async [Submission] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can list all submissions");
    };
    submissions.values().toArray().sort(Submission.compareById);
  };

  // Helper Functions

  public query ({ caller }) func getGroupMembers(groupId : GroupId) : async [UserId] {
    if (not isGroupMember(caller, groupId) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only group members or admin can view members");
    };
    switch (groups.get(groupId)) {
      case (null) {
        Runtime.trap("Group not found");
      };
      case (?group) {
        group.members;
      };
    };
  };

  public shared ({ caller }) func removeGroupMember(groupId : GroupId, member_id : UserId) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove members from groups");
    };
    if (not isGroupCreatorInternal(caller, groupId) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only group creator or admin can remove members");
    };
    switch (groups.get(groupId)) {
      case (null) {
        Runtime.trap("Group not found");
      };
      case (?group) {
        let updatedMembers = group.members.filter(
          func(id) { id != member_id }
        );
        let updatedGroup : Group = {
          id = group.id;
          creator = group.creator;
          name = group.name;
          members = updatedMembers;
          created_at = group.created_at;
        };
        groups.add(groupId, updatedGroup);
        true;
      };
    };
  };

  public query ({ caller }) func getGroupCreator(groupId : GroupId) : async ?UserId {
    if (not isGroupMember(caller, groupId) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only group members or admin can view group creator");
    };
    switch (groups.get(groupId)) {
      case (null) {
        null;
      };
      case (?group) {
        ?group.creator;
      };
    };
  };

  public query ({ caller }) func isGroupCreator(groupId : GroupId) : async Bool {
    isGroupCreatorInternal(caller, groupId);
  };

  public query ({ caller }) func isGroupMemberQuery(groupId : GroupId) : async Bool {
    isGroupMember(caller, groupId);
  };

  public query ({ caller }) func isSubmissionOwnerQuery(submissionId : SubmissionId) : async Bool {
    isSubmissionOwner(caller, submissionId);
  };

  // Filtering submissions by status
  // TODO: DISPATCH
  // export function filterSubmissions(submissions: [Submission], statusFilter: SubmissionStatus)  {
  //   return submissions.filter(s => s.status === statusFilter);
  // }

  // export function filterByFileType(submissions: [Submission], fileTypeFilter: SubmissionType) {
  //   return submissions.filter(s => s.filetype === fileTypeFilter);
  // }

  // Filtering submissions by creation date
};
