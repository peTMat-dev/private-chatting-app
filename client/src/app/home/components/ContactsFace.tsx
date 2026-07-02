"use client";

import { Dispatch, SetStateAction } from "react";
import { type Translations } from "../../../lib/i18n";
import { type ContactItem, type PublicUser, type ContactRequest, type MemberGroup, type ContactGroup } from "../types";

type Props = {
  // navigation
  handleHeaderTripleTap: () => void;
  handleFooterTripleTap: () => void;
  // public user section
  showPublicUserSelect: boolean;
  setShowPublicUserSelect: Dispatch<SetStateAction<boolean>>;
  sortedPublicUsers: PublicUser[];
  loadingPublicUsers: boolean;
  publicUserSearch: string;
  setPublicUserSearch: Dispatch<SetStateAction<string>>;
  sortOrder: "asc" | "desc";
  setSortOrder: Dispatch<SetStateAction<"asc" | "desc">>;
  removingPublicUserId: number | null;
  addingPublicUserId: number | null;
  handleRemovePublicUser: (id: number) => void;
  handleAddPublicUser: (id: number, displayName: string) => void;
  fetchPublicUsers: () => void;
  // private request section
  showRequestInput: boolean;
  setShowRequestInput: Dispatch<SetStateAction<boolean>>;
  requestDisplayName: string;
  setRequestDisplayName: Dispatch<SetStateAction<string>>;
  privateRequestSent: boolean;
  setPrivateRequestSent: Dispatch<SetStateAction<boolean>>;
  handleSendRequest: () => void;
  // contact list section
  showContactList: boolean;
  setShowContactList: Dispatch<SetStateAction<boolean>>;
  contactsError: string | null;
  userContacts: ContactItem[];
  contactSortOrder: "asc" | "desc";
  setContactSortOrder: Dispatch<SetStateAction<"asc" | "desc">>;
  contactSearch: string;
  setContactSearch: Dispatch<SetStateAction<string>>;
  sortedContacts: ContactItem[];
  removingContactId: number | null;
  handleRemoveContact: (id: number) => void;
  handleChatWithContact: (id: number) => void;
  fetchUserContacts: () => void;
  // contact groups section
  showContactListGroups: boolean;
  setShowContactListGroups: Dispatch<SetStateAction<boolean>>;
  contactGroupsError: string | null;
  loadingContactGroups: boolean;
  contactGroups: ContactGroup[];
  groupChatTitleEdit: { groupId: number; value: string } | null;
  setGroupChatTitleEdit: Dispatch<SetStateAction<{ groupId: number; value: string } | null>>;
  removingGroupId: number | null;
  setRemovingGroupId: Dispatch<SetStateAction<number | null>>;
  groupChatCreating: boolean;
  handleChatWithGroup: (g: ContactGroup, title: string) => void;
  fetchContactGroups: () => void;
  // create group section
  showCreateGroup: boolean;
  setShowCreateGroup: Dispatch<SetStateAction<boolean>>;
  createGroupError: string | null;
  createGroupName: string;
  setCreateGroupName: Dispatch<SetStateAction<string>>;
  creatingGroup: boolean;
  handleCreateGroup: () => void;
  createGroupSelectedIds: number[];
  setCreateGroupSelectedIds: Dispatch<SetStateAction<number[]>>;
  // requests section
  showRequests: boolean;
  setShowRequests: Dispatch<SetStateAction<boolean>>;
  loadingRequests: boolean;
  incomingRequests: ContactRequest[];
  outgoingRequests: ContactRequest[];
  approvingRequestId: number | null;
  rejectingRequestId: number | null;
  cancellingRequestId: number | null;
  handleApproveRequest: (id: number) => void;
  handleRejectRequest: (id: number) => void;
  handleCancelRequest: (requestId: number, userId: number) => void;
  fetchRequests: () => void;
  // whose contact am I section
  showWhoseContactAmI: boolean;
  setShowWhoseContactAmI: Dispatch<SetStateAction<boolean>>;
  loadingWhoseContactAmI: boolean;
  whoseContactAmI: MemberGroup[];
  fetchWhoseContactAmI: () => void;
  tr: Translations;
};

export default function ContactsFace({
  handleHeaderTripleTap, handleFooterTripleTap,
  showPublicUserSelect, setShowPublicUserSelect, sortedPublicUsers, loadingPublicUsers,
  publicUserSearch, setPublicUserSearch, sortOrder, setSortOrder,
  removingPublicUserId, addingPublicUserId, handleRemovePublicUser, handleAddPublicUser, fetchPublicUsers,
  showRequestInput, setShowRequestInput, requestDisplayName, setRequestDisplayName,
  privateRequestSent, setPrivateRequestSent, handleSendRequest,
  showContactList, setShowContactList, contactsError, userContacts,
  contactSortOrder, setContactSortOrder, contactSearch, setContactSearch,
  sortedContacts, removingContactId, handleRemoveContact, handleChatWithContact, fetchUserContacts,
  showContactListGroups, setShowContactListGroups, contactGroupsError, loadingContactGroups,
  contactGroups, groupChatTitleEdit, setGroupChatTitleEdit, removingGroupId, setRemovingGroupId,
  groupChatCreating, handleChatWithGroup, fetchContactGroups,
  showCreateGroup, setShowCreateGroup, createGroupError, createGroupName, setCreateGroupName,
  creatingGroup, handleCreateGroup, createGroupSelectedIds, setCreateGroupSelectedIds,
  showRequests, setShowRequests, loadingRequests, incomingRequests, outgoingRequests,
  approvingRequestId, rejectingRequestId, cancellingRequestId,
  handleApproveRequest, handleRejectRequest, handleCancelRequest, fetchRequests,
  showWhoseContactAmI, setShowWhoseContactAmI, loadingWhoseContactAmI, whoseContactAmI, fetchWhoseContactAmI,
  tr,
}: Props) {
  return (
          <section className="cube-face cube-face-left">
            <article className="auth-card cube-face-panel">
              <div className="cube-face-content">
                <div className="cube-face-header" onClick={handleHeaderTripleTap}>
                  <h2>{tr.contacts}</h2>
                </div>
                
                <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(3, 160, 98, 0.15)" }}>
                  <div style={{ marginBottom: "1rem" }}>
                    <button
                      className="add-contact-btn"
                      onClick={() => {
                        setShowPublicUserSelect(!showPublicUserSelect);
                        setShowRequestInput(false);
                        setPrivateRequestSent(false);
                        setShowContactList(false);
                        setShowContactListGroups(false);
                        setShowCreateGroup(false);
                        setShowRequests(false);
                        setPublicUserSearch("");
                        if (!showPublicUserSelect && sortedPublicUsers.length === 0) {
                          fetchPublicUsers();
                        }
                      }}
                      style={{ width: "100%" }}
                    >
                      {tr.addPublicUser}
                    </button>
                    
                    {showPublicUserSelect && (
                      <div style={{ marginTop: "0.75rem" }}>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                          <button
                            type="button"
                            className={`sort-btn ${sortOrder === "asc" ? "active" : ""}`}
                            onClick={() => setSortOrder("asc")}
                            style={{ fontSize: "0.75rem", padding: "0.35rem 0.5rem" }}
                          >
                            A-Z
                          </button>
                          <button
                            type="button"
                            className={`sort-btn ${sortOrder === "desc" ? "active" : ""}`}
                            onClick={() => setSortOrder("desc")}
                            style={{ fontSize: "0.75rem", padding: "0.35rem 0.5rem" }}
                          >
                            Z-A
                          </button>
                          <input
                            type="text"
                            value={publicUserSearch}
                            onChange={(e) => setPublicUserSearch(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Escape") setPublicUserSearch(""); }}
                            placeholder="🔍"
                            style={{
                              flex: 1,
                              minWidth: 0,
                              fontSize: "0.75rem",
                              padding: "0.35rem 0.4rem",
                              background: "rgba(3,160,98,0.08)",
                              border: "1px solid rgba(3,160,98,0.3)",
                              borderRadius: "0.25rem",
                              color: "var(--color-green)",
                              outline: "none",
                            }}
                          />
                          {publicUserSearch && (
                            <button
                              type="button"
                              className="sort-btn"
                              onClick={() => setPublicUserSearch("")}
                              style={{ fontSize: "0.75rem", padding: "0.35rem 0.5rem" }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <div
                          className="auth-input"
                          style={{ 
                            cursor: "pointer", 
                            width: "100%",
                            maxHeight: "180px",
                            overflowY: "auto",
                            padding: "0",
                            opacity: loadingPublicUsers ? 0.6 : 1
                          }}
                        >
                          {loadingPublicUsers ? (
                            <div style={{ padding: "0.75rem", color: "var(--color-green)", textAlign: "center" }}>
                              {tr.loadingUsers}
                            </div>
                          ) : sortedPublicUsers.length === 0 ? (
                            <div style={{ padding: "0.75rem", color: "var(--color-green)", textAlign: "center" }}>
                              {tr.noPublicUsers}
                            </div>
                          ) : (
                            sortedPublicUsers.map((user) => {
                              const isBusy = removingPublicUserId === user.id || addingPublicUserId === user.id;
                              return (
                              <div
                                key={user.id}
                                style={{
                                  padding: "0.45rem 0.75rem",
                                  cursor: "default",
                                  backgroundColor: "transparent",
                                  color: user.isAlreadyContact ? "rgba(180,180,180,0.5)" : "var(--color-green)",
                                  borderBottom: "1px solid rgba(3, 160, 98, 0.1)",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {user.displayName}
                                </span>
                                <button
                                  className={`contact-action-btn ${user.isAlreadyContact ? "contact-action-btn--tick" : user.hasPendingRequest ? "contact-action-btn--pending" : !user.canBeAddedToContacts ? "contact-action-btn--blocked" : "contact-action-btn--add"}`}
                                  style={!user.canBeAddedToContacts ? { color: "#ff5555" } : {}}
                                  onClick={() => {
                                    if (isBusy || loadingPublicUsers || user.hasPendingRequest || !user.canBeAddedToContacts) return;
                                    if (user.isAlreadyContact) {
                                      handleRemovePublicUser(user.id);
                                    } else {
                                      handleAddPublicUser(user.id, user.displayName);
                                    }
                                  }}
                                  disabled={isBusy || loadingPublicUsers || (!user.isAlreadyContact && (user.hasPendingRequest || !user.canBeAddedToContacts))}
                                  title={user.isAlreadyContact ? "Remove contact" : user.hasPendingRequest ? tr.requestPending : !user.canBeAddedToContacts ? tr.cannotBeRequested : "Send contact request"}
                                >
                                  {isBusy ? "…" : user.isAlreadyContact ? "☑" : user.hasPendingRequest ? "⌛" : !user.canBeAddedToContacts ? "🚫" : "☐"}
                                </button>
                              </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <button
                      className="add-contact-btn"
                      onClick={() => {
                        setShowRequestInput(!showRequestInput);
                        setPrivateRequestSent(false);
                        setShowPublicUserSelect(false);
                        setShowContactListGroups(false);
                        setShowCreateGroup(false);
                        setShowRequests(false);
                      }}
                      style={{ width: "100%" }}
                    >
                      {tr.requestByName}
                    </button>
                    
                    {showRequestInput && (
                      <div style={{ marginTop: "0.75rem" }}>
                        {privateRequestSent ? (
                          <p style={{ fontSize: "0.75rem", color: "var(--color-green)", margin: "0", textAlign: "center", padding: "0.5rem 0", opacity: 0.75 }}>
                            {tr.privateRequestSent}
                          </p>
                        ) : (
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                            <input
                              type="text"
                              value={requestDisplayName}
                              onChange={(e) => setRequestDisplayName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter" && requestDisplayName.trim()) handleSendRequest(); }}
                              placeholder={tr.enterDisplayName}
                              style={{
                                flex: 1,
                                minWidth: 0,
                                fontSize: "0.75rem",
                                padding: "0.35rem 0.4rem",
                                background: "rgba(3,160,98,0.08)",
                                border: "1px solid rgba(3,160,98,0.3)",
                                borderRadius: "0.25rem",
                                color: "var(--color-green)",
                                outline: "none",
                              }}
                            />
                            <button
                              type="button"
                              className="sort-btn"
                              onClick={() => handleSendRequest()}
                              disabled={!requestDisplayName.trim()}
                              style={{ fontSize: "0.75rem", padding: "0.35rem 0.5rem" }}
                            >
                              ✓
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ marginBottom: "1rem" }}>
                    <button
                      className="add-contact-btn"
                      onClick={() => {
                        setShowContactList(!showContactList);
                        setShowPublicUserSelect(false);
                        setShowContactListGroups(false);
                        setShowCreateGroup(false);
                        setShowRequestInput(false);
                        setPrivateRequestSent(false);
                        setShowRequests(false);
                        setContactSearch("");
                      }}
                      style={{ width: "100%" }}
                    >
                      ☰ {tr.contactList}
                    </button>
                    {showContactList && (
                      <div style={{ marginTop: "0.75rem" }}>
                        {contactsError ? (
                          <div style={{ padding: "0.5rem 0.75rem", color: "rgba(255,80,80,0.8)", fontSize: "0.8rem" }}>
                            {tr.couldNotLoadContacts}
                          </div>
                        ) : userContacts.length === 0 ? (
                          <div style={{ padding: "0.5rem 0.75rem", color: "rgba(3,160,98,0.5)", fontSize: "0.8rem", textAlign: "center" }}>
                            {tr.noContactsYet}
                          </div>
                        ) : (
                          <>
                            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                              <button
                                type="button"
                                className={`sort-btn ${contactSortOrder === "asc" ? "active" : ""}`}
                                onClick={() => setContactSortOrder("asc")}
                                style={{ fontSize: "0.75rem", padding: "0.35rem 0.5rem" }}
                              >
                                A-Z
                              </button>
                              <button
                                type="button"
                                className={`sort-btn ${contactSortOrder === "desc" ? "active" : ""}`}
                                onClick={() => setContactSortOrder("desc")}
                                style={{ fontSize: "0.75rem", padding: "0.35rem 0.5rem" }}
                              >
                                Z-A
                              </button>
                              <input
                                type="text"
                                value={contactSearch}
                                onChange={(e) => setContactSearch(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Escape") setContactSearch(""); }}
                                placeholder="🔍"
                                style={{
                                  flex: 1,
                                  minWidth: 0,
                                  fontSize: "0.75rem",
                                  padding: "0.35rem 0.4rem",
                                  background: "rgba(3,160,98,0.08)",
                                  border: "1px solid rgba(3,160,98,0.3)",
                                  borderRadius: "0.25rem",
                                  color: "var(--color-green)",
                                  outline: "none",
                                }}
                              />
                              {contactSearch && (
                                <button
                                  type="button"
                                  className="sort-btn"
                                  onClick={() => setContactSearch("")}
                                  style={{ fontSize: "0.75rem", padding: "0.35rem 0.5rem" }}
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                            <div
                              className="auth-input"
                              style={{ padding: 0, maxHeight: "180px", overflowY: "auto" }}
                            >
                              {sortedContacts.map((c) => (
                              <div
                                key={c.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  padding: "0.45rem 0.75rem",
                                  borderBottom: "1px solid rgba(3, 160, 98, 0.1)",
                                  gap: "0.4rem",
                                }}
                              >
                                <span style={{ color: "var(--color-green)", fontSize: "0.85rem", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {c.displayName}{!c.isPublic && <span style={{ marginLeft: "0.3rem", fontSize: "0.75rem" }}>🔒</span>}
                                </span>
                                <button
                                  className="contact-action-btn contact-action-btn--chat-active"
                                  onClick={() => handleChatWithContact(c.id)}
                                  title="💬"
                                >
                                  💬
                                </button>
                                <button
                                  className="contact-action-btn contact-action-btn--tick"
                                  onClick={() => handleRemoveContact(c.id)}
                                  disabled={removingContactId === c.id}
                                >
                                  {removingContactId === c.id ? "…" : "☑"}
                                </button>
                              </div>
                            ))}
                          </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <button
                      className="add-contact-btn"
                      onClick={() => {
                        const next = !showContactListGroups;
                        setShowContactListGroups(next);
                        setShowContactList(false);
                        setShowPublicUserSelect(false);
                        setShowRequestInput(false);
                        setPrivateRequestSent(false);
                        setShowRequests(false);
                        setShowCreateGroup(false);
                        setShowWhoseContactAmI(false);
                        if (next) fetchContactGroups();
                      }}
                      style={{ width: "100%" }}
                    >
                      ☰ {tr.contactListGroups}
                    </button>
                    {showContactListGroups && (
                      <div style={{ marginTop: "0.75rem" }}>
                        {contactGroupsError ? (
                          <div style={{ padding: "0.5rem 0.75rem", color: "rgba(255,80,80,0.8)", fontSize: "0.8rem" }}>
                            {contactGroupsError}
                          </div>
                        ) : loadingContactGroups ? (
                          <div style={{ padding: "0.75rem", color: "var(--color-green)", textAlign: "center" }}>
                            {tr.loadingUsers}
                          </div>
                        ) : contactGroups.length === 0 ? (
                          <div style={{ padding: "0.5rem 0.75rem", color: "rgba(3,160,98,0.5)", fontSize: "0.8rem", textAlign: "center" }}>
                            {tr.noGroupsYet}
                          </div>
                        ) : (
                          <div
                            className="auth-input"
                            style={{ padding: 0, maxHeight: "180px", overflowY: "auto" }}
                          >
                            {contactGroups.map((g) => (
                              <div key={g.id}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "0.45rem 0.75rem",
                                    borderBottom: groupChatTitleEdit?.groupId === g.id ? "none" : "1px solid rgba(3, 160, 98, 0.1)",
                                    gap: "0.4rem",
                                  }}
                                >
                                  <span style={{ color: "var(--color-green)", fontSize: "0.85rem", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {g.name}
                                    <span style={{ marginLeft: "0.35rem", fontSize: "0.7rem", opacity: 0.55 }}>({g.memberIds.length})</span>
                                  </span>
                                  <button
                                    className={`contact-action-btn ${groupChatTitleEdit?.groupId === g.id ? "contact-action-btn--chat-active" : "contact-action-btn--chat-active"}`}
                                    onClick={() => setGroupChatTitleEdit(
                                      groupChatTitleEdit?.groupId === g.id ? null : { groupId: g.id, value: g.name }
                                    )}
                                    title="💬"
                                  >
                                    💬
                                  </button>
                                  <button
                                    className="contact-action-btn contact-action-btn--tick"
                                    onClick={() => setRemovingGroupId(g.id)}
                                    disabled={removingGroupId === g.id}
                                    title={tr.removeGroup}
                                  >
                                    {removingGroupId === g.id ? "…" : "☑"}
                                  </button>
                                </div>
                                {groupChatTitleEdit?.groupId === g.id && (
                                  <div style={{
                                    display: "flex", gap: "0.4rem", alignItems: "center",
                                    padding: "0.4rem 0.75rem 0.5rem",
                                    borderBottom: "1px solid rgba(3, 160, 98, 0.1)",
                                    background: "rgba(3,160,98,0.05)",
                                  }}>
                                    <input
                                      type="text"
                                      value={groupChatTitleEdit.value}
                                      onChange={(e) => setGroupChatTitleEdit({ groupId: g.id, value: e.target.value })}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && groupChatTitleEdit.value.trim()) handleChatWithGroup(g, groupChatTitleEdit.value);
                                        if (e.key === "Escape") setGroupChatTitleEdit(null);
                                      }}
                                      maxLength={32}
                                      placeholder={tr.groupTitle}
                                      autoFocus
                                      style={{
                                        flex: 1, minWidth: 0, fontSize: "0.8rem",
                                        padding: "0.3rem 0.45rem",
                                        background: "rgba(3,160,98,0.08)",
                                        border: "1px solid rgba(3,160,98,0.3)",
                                        borderRadius: "0.25rem",
                                        color: "var(--color-green)", outline: "none",
                                      }}
                                    />
                                    <button
                                      className="contact-action-btn contact-action-btn--confirm"
                                      onClick={() => handleChatWithGroup(g, groupChatTitleEdit.value)}
                                      disabled={!groupChatTitleEdit.value.trim() || groupChatCreating}
                                      title={tr.openChat}
                                    >
                                      {groupChatCreating ? "…" : "✓"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <button
                      className="add-contact-btn"
                      onClick={() => {
                        const next = !showCreateGroup;
                        setShowCreateGroup(next);
                        setShowContactList(false);
                        setShowContactListGroups(false);
                        setShowPublicUserSelect(false);
                        setShowRequestInput(false);
                        setPrivateRequestSent(false);
                        setShowRequests(false);
                        setShowWhoseContactAmI(false);
                        if (!next) {
                          setCreateGroupName("");
                          setCreateGroupSelectedIds([]);
                        } else if (userContacts.filter((c) => c.status_st).length === 0) {
                          fetchUserContacts();
                        }
                      }}
                      style={{ width: "100%" }}
                    >
                      ☰ {tr.contactCreateGroup}
                    </button>
                    {showCreateGroup && (
                      <div style={{ marginTop: "0.75rem" }}>
                        {createGroupError && (
                          <div style={{ padding: "0.4rem 0.75rem", color: "rgba(255,80,80,0.85)", fontSize: "0.8rem", marginBottom: "0.5rem" }}>
                            {createGroupError}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                          <input
                            type="text"
                            value={createGroupName}
                            onChange={(e) => setCreateGroupName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter" && createGroupName.trim()) handleCreateGroup(); }}
                            maxLength={32}
                            placeholder={tr.groupName}
                            style={{
                              flex: 1,
                              minWidth: 0,
                              fontSize: "0.75rem",
                              padding: "0.35rem 0.4rem",
                              background: "rgba(3,160,98,0.08)",
                              border: "1px solid rgba(3,160,98,0.3)",
                              borderRadius: "0.25rem",
                              color: "var(--color-green)",
                              outline: "none",
                            }}
                          />
                          <button
                            type="button"
                            className="sort-btn"
                            onClick={handleCreateGroup}
                            disabled={creatingGroup || !createGroupName.trim()}
                            style={{ fontSize: "0.75rem", padding: "0.35rem 0.5rem", color: "var(--color-green)" }}
                          >
                            {creatingGroup ? "…" : "✓"}
                          </button>
                        </div>
                        {userContacts.filter((c) => c.status_st).length === 0 ? (
                          <div style={{ padding: "0.4rem 0.75rem", color: "rgba(3,160,98,0.5)", fontSize: "0.8rem", textAlign: "center" }}>
                            {tr.noContactsForGroup}
                          </div>
                        ) : (
                          <div
                            className="auth-input"
                            style={{ padding: 0, maxHeight: "150px", overflowY: "auto" }}
                          >
                            <div style={{ padding: "0.3rem 0.75rem 0.25rem", fontSize: "0.7rem", color: "var(--color-green)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              {tr.selectGroupMembers}
                            </div>
                            {userContacts
                              .filter((c) => c.status_st)
                              .map((c) => {
                                const checked = createGroupSelectedIds.includes(c.id);
                                return (
                                  <div
                                    key={c.id}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      padding: "0.45rem 0.75rem",
                                      borderBottom: "1px solid rgba(3,160,98,0.1)",
                                      gap: "0.4rem",
                                    }}
                                  >
                                    <span style={{ color: "var(--color-green)", fontSize: "0.85rem", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {c.displayName}
                                    </span>
                                    <button
                                      type="button"
                                      className="contact-action-btn contact-action-btn--tick"
                                      onClick={() =>
                                        setCreateGroupSelectedIds((prev) =>
                                          checked ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                                        )
                                      }
                                    >
                                      {checked ? "☑" : "☐"}
                                    </button>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <button
                      className="add-contact-btn"
                      onClick={() => {
                        const next = !showRequests;
                        setShowRequests(next);
                        setShowContactList(false);
                        setShowContactListGroups(false);
                        setShowCreateGroup(false);
                        setShowPublicUserSelect(false);
                        setShowRequestInput(false);
                        setPrivateRequestSent(false);
                        setShowWhoseContactAmI(false);
                        if (next) fetchRequests();
                      }}
                      style={{ width: "100%" }}
                    >
                      📬 {tr.requests}
                    </button>
                    {showRequests && (
                      <div style={{ marginTop: "0.75rem" }}>
                        {loadingRequests ? (
                          <div style={{ padding: "0.75rem", color: "var(--color-green)", textAlign: "center" }}>
                            {tr.loadingUsers}
                          </div>
                        ) : (
                          <>
                            <div style={{ marginBottom: "0.75rem" }}>
                              <div style={{ fontSize: "0.7rem", color: "rgba(3,160,98,0.55)", padding: "0 0.5rem 0.35rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                {tr.incomingRequests}
                              </div>
                              <div
                                className="auth-input"
                                style={{ padding: 0, maxHeight: "130px", overflowY: "auto" }}
                              >
                                {incomingRequests.length === 0 ? (
                                  <div style={{ padding: "0.5rem 0.75rem", color: "rgba(3,160,98,0.5)", fontSize: "0.8rem", textAlign: "center" }}>
                                    {tr.noIncomingRequests}
                                  </div>
                                ) : (
                                  incomingRequests.map((req) => (
                                    <div
                                      key={req.requestId}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "0.45rem 0.75rem",
                                        borderBottom: "1px solid rgba(3, 160, 98, 0.1)",
                                        gap: "0.4rem",
                                      }}
                                    >
                                      <span style={{ flex: 1, color: "var(--color-green)", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {req.displayName}
                                      </span>
                                      <button
                                        className="contact-action-btn contact-action-btn--tick"
                                        onClick={() => handleApproveRequest(req.requestId)}
                                        disabled={approvingRequestId === req.requestId || rejectingRequestId === req.requestId}
                                        title={tr.approveRequest}
                                      >
                                        {approvingRequestId === req.requestId ? "\u2026" : "\u2713"}
                                      </button>
                                      <button
                                        className="contact-action-btn contact-action-btn--remove"
                                        onClick={() => handleRejectRequest(req.requestId)}
                                        disabled={approvingRequestId === req.requestId || rejectingRequestId === req.requestId}
                                        title={tr.rejectRequest}
                                      >
                                        {rejectingRequestId === req.requestId ? "\u2026" : "\u2717"}
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: "0.7rem", color: "rgba(3,160,98,0.55)", padding: "0 0.5rem 0.35rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                {tr.outgoingRequests}
                              </div>
                              <div
                                className="auth-input"
                                style={{ padding: 0, maxHeight: "130px", overflowY: "auto" }}
                              >
                                {outgoingRequests.length === 0 ? (
                                  <div style={{ padding: "0.5rem 0.75rem", color: "rgba(3,160,98,0.5)", fontSize: "0.8rem", textAlign: "center" }}>
                                    {tr.noOutgoingRequests}
                                  </div>
                                ) : (
                                  outgoingRequests.map((req) => (
                                    <div
                                      key={req.requestId}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "0.45rem 0.75rem",
                                        borderBottom: "1px solid rgba(3, 160, 98, 0.1)",
                                        gap: "0.4rem",
                                      }}
                                    >
                                      <span style={{ flex: 1, color: "var(--color-green)", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {req.displayName}
                                      </span>
                                      <button
                                        className="contact-action-btn contact-action-btn--cancel"
                                        onClick={() => handleCancelRequest(req.requestId, req.userId)}
                                        disabled={cancellingRequestId === req.requestId}
                                        title={tr.cancelRequest}
                                      >
                                        {cancellingRequestId === req.requestId ? "\u2026" : "\u2715"}
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <button
                      className="add-contact-btn"
                      onClick={() => {
                        const next = !showWhoseContactAmI;
                        setShowWhoseContactAmI(next);
                        setShowContactList(false);
                        setShowContactListGroups(false);
                        setShowCreateGroup(false);
                        setShowPublicUserSelect(false);
                        setShowRequestInput(false);
                        setPrivateRequestSent(false);
                        setShowRequests(false);
                        if (next) fetchWhoseContactAmI();
                      }}
                      style={{ width: "100%" }}
                    >
                      {tr.whoseContactAmI}
                    </button>
                    {showWhoseContactAmI && (
                      <div style={{ marginTop: "0.75rem" }}>
                        <div
                          className="auth-input"
                          style={{ padding: 0, maxHeight: "180px", overflowY: "auto", opacity: loadingWhoseContactAmI ? 0.6 : 1 }}
                        >
                          {loadingWhoseContactAmI ? (
                            <div style={{ padding: "0.75rem", color: "var(--color-green)", textAlign: "center" }}>
                              {tr.loadingUsers}
                            </div>
                          ) : whoseContactAmI.length === 0 ? (
                            <div style={{ padding: "0.75rem", color: "rgba(3,160,98,0.5)", textAlign: "center", fontSize: "0.8rem" }}>
                              —
                            </div>
                          ) : (
                            whoseContactAmI.map((group) => (
                              <div
                                key={group.groupId}
                                style={{
                                  padding: "0.5rem 0.75rem",
                                  color: "var(--color-green)",
                                  borderBottom: "1px solid rgba(3, 160, 98, 0.1)",
                                  fontSize: "0.85rem",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "flex-start",
                                  gap: "0.5rem",
                                }}
                              >
                                <div style={{ flex: 0, minWidth: "fit-content" }}>
                                  {group.ownerDisplayName}
                                </div>
                                <div style={{ flex: 1, textAlign: "right", wordBreak: "break-word" }}>
                                  {group.groupName}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
                <div className="cube-face-footer" onClick={handleFooterTripleTap}>▼</div>
            </article>
          </section>
  );
}
