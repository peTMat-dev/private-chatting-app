import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { useLanguage } from '../../lib/LanguageContext';
import { useTheme } from '../../theme';
import { t } from '../../lib/i18n';
import type { ContactItem, PublicUser, ContactRequest, MemberGroup, ContactGroup } from '../../lib/formTypes';
import type { Dispatch, SetStateAction } from 'react';

type Props = {
  // public users
  showPublicUserSelect: boolean; setShowPublicUserSelect: Dispatch<SetStateAction<boolean>>;
  sortedPublicUsers: PublicUser[]; loadingPublicUsers: boolean;
  publicUserSearch: string; setPublicUserSearch: Dispatch<SetStateAction<string>>;
  sortOrder: 'asc' | 'desc'; setSortOrder: Dispatch<SetStateAction<'asc' | 'desc'>>;
  removingPublicUserId: number | null; addingPublicUserId: number | null;
  handleRemovePublicUser: (id: number) => void; handleAddPublicUser: (id: number, displayName: string) => void;
  fetchPublicUsers: () => void;
  // private request
  showRequestInput: boolean; setShowRequestInput: Dispatch<SetStateAction<boolean>>;
  requestDisplayName: string; setRequestDisplayName: Dispatch<SetStateAction<string>>;
  privateRequestSent: boolean; setPrivateRequestSent: Dispatch<SetStateAction<boolean>>;
  handleSendRequest: () => void;
  // contact list
  showContactList: boolean; setShowContactList: Dispatch<SetStateAction<boolean>>;
  contactsError: string | null; userContacts: ContactItem[];
  contactSortOrder: 'asc' | 'desc'; setContactSortOrder: Dispatch<SetStateAction<'asc' | 'desc'>>;
  contactSearch: string; setContactSearch: Dispatch<SetStateAction<string>>;
  sortedContacts: ContactItem[]; removingContactId: number | null;
  handleRemoveContact: (id: number) => void; handleChatWithContact: (id: number) => void;
  fetchUserContacts: () => void;
  // contact groups
  showContactListGroups: boolean; setShowContactListGroups: Dispatch<SetStateAction<boolean>>;
  contactGroupsError: string | null; loadingContactGroups: boolean;
  contactGroups: ContactGroup[];
  groupChatTitleEdit: { groupId: number; value: string } | null;
  setGroupChatTitleEdit: Dispatch<SetStateAction<{ groupId: number; value: string } | null>>;
  removingGroupId: number | null; setRemovingGroupId: Dispatch<SetStateAction<number | null>>;
  groupChatCreating: boolean;
  handleChatWithGroup: (g: ContactGroup, title: string) => void;
  fetchContactGroups: () => void;
  // create group
  showCreateGroup: boolean; setShowCreateGroup: Dispatch<SetStateAction<boolean>>;
  createGroupError: string | null; createGroupName: string;
  setCreateGroupName: Dispatch<SetStateAction<string>>; creatingGroup: boolean;
  handleCreateGroup: () => void;
  createGroupSelectedIds: number[]; setCreateGroupSelectedIds: Dispatch<SetStateAction<number[]>>;
  // requests
  showRequests: boolean; setShowRequests: Dispatch<SetStateAction<boolean>>;
  loadingRequests: boolean; incomingRequests: ContactRequest[]; outgoingRequests: ContactRequest[];
  approvingRequestId: number | null; rejectingRequestId: number | null; cancellingRequestId: number | null;
  handleApproveRequest: (id: number) => void; handleRejectRequest: (id: number) => void;
  handleCancelRequest: (requestId: number, userId: number) => void; fetchRequests: () => void;
  // whose contact am I
  showWhoseContactAmI: boolean; setShowWhoseContactAmI: Dispatch<SetStateAction<boolean>>;
  loadingWhoseContactAmI: boolean; whoseContactAmI: MemberGroup[];
  fetchWhoseContactAmI: () => void;
};

export default function ContactsFace(props: Props) {
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const tr = useMemo(() => t(lang), [lang]);
  const inp = [styles.input, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder, color: theme.colors.text }];

  const toggleSection = (section: string) => {
    const setters: Record<string, (v: boolean) => void> = {
      publicUser: props.setShowPublicUserSelect,
      requestInput: props.setShowRequestInput,
      contactList: props.setShowContactList,
      groups: props.setShowContactListGroups,
      createGroup: props.setShowCreateGroup,
      requests: props.setShowRequests,
      whoseContact: props.setShowWhoseContactAmI,
    };
    const stateMap: Record<string, boolean> = {
      publicUser: props.showPublicUserSelect,
      requestInput: props.showRequestInput,
      contactList: props.showContactList,
      groups: props.showContactListGroups,
      createGroup: props.showCreateGroup,
      requests: props.showRequests,
      whoseContact: props.showWhoseContactAmI,
    };
    // Close all others
    Object.entries(setters).forEach(([key, setter]) => {
      if (key !== section) setter(false);
    });
    // Toggle target
    setters[section](!stateMap[section]);
    if (section === 'publicUser' && !props.showPublicUserSelect) props.fetchPublicUsers();
    if (section === 'contactList' && !props.showContactList) props.fetchUserContacts();
    if (section === 'groups' && !props.showContactListGroups) props.fetchContactGroups();
    if (section === 'requests' && !props.showRequests) props.fetchRequests();
    if (section === 'whoseContact' && !props.showWhoseContactAmI) props.fetchWhoseContactAmI();
    if (section === 'requestInput') props.setPrivateRequestSent(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { backgroundColor: theme.colors.panel, borderColor: theme.colors.border }]}>
          <Text style={[styles.heading, { color: theme.colors.text }]}>{tr.contacts}</Text>

          {/* Section: Public Users */}
          <TouchableOpacity style={[styles.sectionBtn, { borderBottomColor: theme.colors.green10 }]}
            onPress={() => toggleSection('publicUser')} activeOpacity={0.7}>
            <Text style={[styles.sectionBtnText, { color: theme.colors.green }]}>{tr.addPublicUser}</Text>
            <Text style={[styles.arrow, { color: theme.colors.green }]}>{props.showPublicUserSelect ? '\u25B2' : '\u25BC'}</Text>
          </TouchableOpacity>
          {props.showPublicUserSelect && (
            <View style={styles.sectionContent}>
              <TextInput style={inp} value={props.publicUserSearch} onChangeText={props.setPublicUserSearch}
                placeholder={tr.loadingUsers} placeholderTextColor={theme.colors.textMuted} />
              <TouchableOpacity onPress={() => props.setSortOrder(props.sortOrder === 'asc' ? 'desc' : 'asc')} activeOpacity={0.7}>
                <Text style={[styles.sortBtn, { color: theme.colors.green55 }]}>
                  {props.sortOrder === 'asc' ? 'A\u2192Z' : 'Z\u2192A'}
                </Text>
              </TouchableOpacity>
              {props.loadingPublicUsers ? (
                <Text style={[styles.muted, { color: theme.colors.green50 }]}>{tr.loadingUsers}</Text>
              ) : props.sortedPublicUsers.length === 0 ? (
                <Text style={[styles.muted, { color: theme.colors.green50 }]}>{tr.noPublicUsers}</Text>
              ) : (
                <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                  {props.sortedPublicUsers.map((u) => (
                    <View key={u.id} style={[styles.listRow, { borderBottomColor: theme.colors.green10 }]}>
                      <Text style={[styles.listName, { color: theme.colors.green }]} numberOfLines={1}>{u.displayName}</Text>
                      {u.isAlreadyContact ? (
                        <Text style={[styles.badge, { color: theme.colors.green50 }]}>{tr.added}</Text>
                      ) : u.hasPendingRequest ? (
                        <Text style={[styles.badge, { color: theme.colors.green50 }]}>{tr.requestPending}</Text>
                      ) : !u.canBeAddedToContacts ? (
                        <Text style={[styles.badge, { color: theme.colors.green50 }]}>{tr.cannotBeRequested}</Text>
                      ) : (
                        <TouchableOpacity
                          style={[styles.addBtn, { backgroundColor: theme.colors.green08, borderColor: theme.colors.green30 }]}
                          onPress={() => props.handleAddPublicUser(u.id, u.displayName)}
                          disabled={props.addingPublicUserId === u.id} activeOpacity={0.7}>
                          <Text style={[styles.addBtnText, { color: theme.colors.green }]}>
                            {props.addingPublicUserId === u.id ? '\u2026' : '+'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Section: Private Request */}
          <TouchableOpacity style={[styles.sectionBtn, { borderBottomColor: theme.colors.green10 }]}
            onPress={() => toggleSection('requestInput')} activeOpacity={0.7}>
            <Text style={[styles.sectionBtnText, { color: theme.colors.green }]}>{tr.requestByName}</Text>
            <Text style={[styles.arrow, { color: theme.colors.green }]}>{props.showRequestInput ? '\u25B2' : '\u25BC'}</Text>
          </TouchableOpacity>
          {props.showRequestInput && (
            <View style={styles.sectionContent}>
              <TextInput style={inp} value={props.requestDisplayName} onChangeText={props.setRequestDisplayName}
                placeholder={tr.enterDisplayName} placeholderTextColor={theme.colors.textMuted} />
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.colors.green08, borderColor: theme.colors.green30, alignSelf: 'stretch' }]}
                onPress={props.handleSendRequest} activeOpacity={0.7}>
                <Text style={[styles.addBtnText, { color: theme.colors.green }]}>{tr.sendRequest}</Text>
              </TouchableOpacity>
              {props.privateRequestSent && (
                <Text style={[styles.muted, { color: theme.colors.green50 }]}>{tr.privateRequestSent}</Text>
              )}
            </View>
          )}

          {/* Section: Contact List */}
          <TouchableOpacity style={[styles.sectionBtn, { borderBottomColor: theme.colors.green10 }]}
            onPress={() => toggleSection('contactList')} activeOpacity={0.7}>
            <Text style={[styles.sectionBtnText, { color: theme.colors.green }]}>{tr.contactList}</Text>
            <Text style={[styles.arrow, { color: theme.colors.green }]}>{props.showContactList ? '\u25B2' : '\u25BC'}</Text>
          </TouchableOpacity>
          {props.showContactList && (
            <View style={styles.sectionContent}>
              {props.contactsError ? (
                <Text style={[styles.muted, { color: theme.colors.green50 }]}>{tr.couldNotLoadContacts}: {props.contactsError}</Text>
              ) : (
                <>
                  <View style={styles.filterRow}>
                    <TextInput style={[inp, { flex: 1 }]} value={props.contactSearch} onChangeText={props.setContactSearch}
                      placeholder={tr.contacts} placeholderTextColor={theme.colors.textMuted} />
                    <TouchableOpacity onPress={() => props.setContactSortOrder(props.contactSortOrder === 'asc' ? 'desc' : 'asc')} activeOpacity={0.7}>
                      <Text style={[styles.sortBtn, { color: theme.colors.green55 }]}>
                        {props.contactSortOrder === 'asc' ? 'A\u2192Z' : 'Z\u2192A'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {props.sortedContacts.length === 0 ? (
                    <Text style={[styles.muted, { color: theme.colors.green50 }]}>{tr.noContactsYet}</Text>
                  ) : (
                    <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                      {props.sortedContacts.map((c) => (
                        <View key={c.id} style={[styles.listRow, { borderBottomColor: theme.colors.green10 }]}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.listName, { color: theme.colors.green }]} numberOfLines={1}>{c.displayName}</Text>
                            <Text style={[styles.listSub, { color: theme.colors.green50 }]}>
                              {tr.addedDate}: {new Date(c.addedAt).toLocaleDateString()}
                            </Text>
                          </View>
                          <TouchableOpacity style={[styles.miniBtn, { borderColor: theme.colors.green30 }]}
                            onPress={() => props.handleChatWithContact(c.id)} activeOpacity={0.7}>
                            <Text style={[styles.miniBtnText, { color: theme.colors.green }]}>{tr.chat}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.miniBtn, { borderColor: theme.colors.green30 }]}
                            onPress={() => props.handleRemoveContact(c.id)}
                            disabled={props.removingContactId === c.id} activeOpacity={0.7}>
                            <Text style={[styles.miniBtnText, { color: theme.colors.green }]}>
                              {props.removingContactId === c.id ? '\u2026' : '\u2715'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  )}
                </>
              )}
            </View>
          )}

          {/* Section: Contact Groups */}
          <TouchableOpacity style={[styles.sectionBtn, { borderBottomColor: theme.colors.green10 }]}
            onPress={() => toggleSection('groups')} activeOpacity={0.7}>
            <Text style={[styles.sectionBtnText, { color: theme.colors.green }]}>{tr.contactListGroups}</Text>
            <Text style={[styles.arrow, { color: theme.colors.green }]}>{props.showContactListGroups ? '\u25B2' : '\u25BC'}</Text>
          </TouchableOpacity>
          {props.showContactListGroups && (
            <View style={styles.sectionContent}>
              {props.contactGroupsError ? (
                <Text style={[styles.muted, { color: theme.colors.green50 }]}>{props.contactGroupsError}</Text>
              ) : props.loadingContactGroups ? (
                <Text style={[styles.muted, { color: theme.colors.green50 }]}>{tr.loadingUsers}</Text>
              ) : props.contactGroups.length === 0 ? (
                <Text style={[styles.muted, { color: theme.colors.green50 }]}>{tr.noGroupsYet}</Text>
              ) : (
                <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                  {props.contactGroups.map((g) => (
                    <View key={g.id} style={[styles.listRow, { borderBottomColor: theme.colors.green10 }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.listName, { color: theme.colors.green }]}>{g.name}</Text>
                        <Text style={[styles.listSub, { color: theme.colors.green50 }]}>{g.memberIds.length} members</Text>
                      </View>
                      {props.groupChatTitleEdit?.groupId === g.id ? (
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                          <TextInput style={[styles.miniInput, { borderColor: theme.colors.inputBorder, color: theme.colors.text }]}
                            value={props.groupChatTitleEdit.value} onChangeText={(v) => props.setGroupChatTitleEdit({ groupId: g.id, value: v })}
                            placeholder={tr.groupTitle} placeholderTextColor={theme.colors.textMuted} />
                          <TouchableOpacity style={[styles.miniBtn, { borderColor: theme.colors.green30 }]}
                            onPress={() => props.handleChatWithGroup(g, props.groupChatTitleEdit!.value)} activeOpacity={0.7}>
                            <Text style={[styles.miniBtnText, { color: theme.colors.green }]}>{'\u2713'}</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity style={[styles.miniBtn, { borderColor: theme.colors.green30 }]}
                          onPress={() => props.setGroupChatTitleEdit({ groupId: g.id, value: g.name })} activeOpacity={0.7}>
                          <Text style={[styles.miniBtnText, { color: theme.colors.green }]}>{tr.chat}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Section: Create Group */}
          <TouchableOpacity style={[styles.sectionBtn, { borderBottomColor: theme.colors.green10 }]}
            onPress={() => toggleSection('createGroup')} activeOpacity={0.7}>
            <Text style={[styles.sectionBtnText, { color: theme.colors.green }]}>{tr.contactCreateGroup}</Text>
            <Text style={[styles.arrow, { color: theme.colors.green }]}>{props.showCreateGroup ? '\u25B2' : '\u25BC'}</Text>
          </TouchableOpacity>
          {props.showCreateGroup && (
            <View style={styles.sectionContent}>
              <TextInput style={inp} value={props.createGroupName} onChangeText={props.setCreateGroupName}
                placeholder={tr.groupName} placeholderTextColor={theme.colors.textMuted} />
              {props.userContacts.length === 0 ? (
                <Text style={[styles.muted, { color: theme.colors.green50 }]}>{tr.noContactsForGroup}</Text>
              ) : (
                <>
                  <Text style={[styles.label, { color: theme.colors.green55 }]}>{tr.selectGroupMembers}</Text>
                  <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                    {props.userContacts.map((c) => (
                      <TouchableOpacity key={c.id} style={[styles.listRow, { borderBottomColor: theme.colors.green10 }]}
                        onPress={() => props.setCreateGroupSelectedIds((prev) =>
                          prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                        )} activeOpacity={0.7}>
                        <Text style={[styles.listName, { color: theme.colors.green, flex: 1 }]} numberOfLines={1}>{c.displayName}</Text>
                        <Text style={{ color: theme.colors.green, fontSize: 16 }}>
                          {props.createGroupSelectedIds.includes(c.id) ? '\u2611' : '\u2610'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}
              {props.createGroupError && <Text style={[styles.error, { color: theme.colors.error }]}>{props.createGroupError}</Text>}
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.colors.green08, borderColor: theme.colors.green30 }]}
                onPress={props.handleCreateGroup} disabled={props.creatingGroup} activeOpacity={0.7}>
                <Text style={[styles.addBtnText, { color: theme.colors.green }]}>{props.creatingGroup ? '\u2026' : tr.createGroup}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Section: Requests */}
          <TouchableOpacity style={[styles.sectionBtn, { borderBottomColor: theme.colors.green10 }]}
            onPress={() => toggleSection('requests')} activeOpacity={0.7}>
            <Text style={[styles.sectionBtnText, { color: theme.colors.green }]}>{tr.requests}</Text>
            <Text style={[styles.arrow, { color: theme.colors.green }]}>{props.showRequests ? '\u25B2' : '\u25BC'}</Text>
          </TouchableOpacity>
          {props.showRequests && (
            <View style={styles.sectionContent}>
              {props.loadingRequests ? (
                <Text style={[styles.muted, { color: theme.colors.green50 }]}>{tr.loadingUsers}</Text>
              ) : (
                <>
                  <Text style={[styles.subLabel, { color: theme.colors.green55 }]}>{tr.incomingRequests}</Text>
                  {props.incomingRequests.length === 0 ? (
                    <Text style={[styles.muted, { color: theme.colors.green50 }]}>{tr.noIncomingRequests}</Text>
                  ) : (
                    props.incomingRequests.map((req) => (
                      <View key={req.requestId} style={[styles.listRow, { borderBottomColor: theme.colors.green10 }]}>
                        <Text style={[styles.listName, { color: theme.colors.green, flex: 1 }]} numberOfLines={1}>{req.displayName}</Text>
                        <TouchableOpacity style={[styles.miniBtn, { borderColor: theme.colors.green30 }]}
                          onPress={() => props.handleApproveRequest(req.requestId)}
                          disabled={props.approvingRequestId === req.requestId} activeOpacity={0.7}>
                          <Text style={[styles.miniBtnText, { color: theme.colors.green }]}>
                            {props.approvingRequestId === req.requestId ? '\u2026' : '\u2713'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.miniBtn, { borderColor: theme.colors.green30 }]}
                          onPress={() => props.handleRejectRequest(req.requestId)}
                          disabled={props.rejectingRequestId === req.requestId} activeOpacity={0.7}>
                          <Text style={[styles.miniBtnText, { color: theme.colors.green }]}>
                            {props.rejectingRequestId === req.requestId ? '\u2026' : '\u2715'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                  <Text style={[styles.subLabel, { color: theme.colors.green55, marginTop: 8 }]}>{tr.outgoingRequests}</Text>
                  {props.outgoingRequests.length === 0 ? (
                    <Text style={[styles.muted, { color: theme.colors.green50 }]}>{tr.noOutgoingRequests}</Text>
                  ) : (
                    props.outgoingRequests.map((req) => (
                      <View key={req.requestId} style={[styles.listRow, { borderBottomColor: theme.colors.green10 }]}>
                        <Text style={[styles.listName, { color: theme.colors.green, flex: 1 }]} numberOfLines={1}>{req.displayName}</Text>
                        <TouchableOpacity style={[styles.miniBtn, { borderColor: theme.colors.green30 }]}
                          onPress={() => props.handleCancelRequest(req.requestId, req.userId)}
                          disabled={props.cancellingRequestId === req.requestId} activeOpacity={0.7}>
                          <Text style={[styles.miniBtnText, { color: theme.colors.green }]}>
                            {props.cancellingRequestId === req.requestId ? '\u2026' : '\u2715'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </>
              )}
            </View>
          )}

          {/* Section: Whose Contact Am I */}
          <TouchableOpacity style={[styles.sectionBtn, { borderBottomColor: theme.colors.green10 }]}
            onPress={() => toggleSection('whoseContact')} activeOpacity={0.7}>
            <Text style={[styles.sectionBtnText, { color: theme.colors.green }]}>{tr.whoseContactAmI}</Text>
            <Text style={[styles.arrow, { color: theme.colors.green }]}>{props.showWhoseContactAmI ? '\u25B2' : '\u25BC'}</Text>
          </TouchableOpacity>
          {props.showWhoseContactAmI && (
            <View style={styles.sectionContent}>
              {props.loadingWhoseContactAmI ? (
                <Text style={[styles.muted, { color: theme.colors.green50 }]}>{tr.loadingUsers}</Text>
              ) : props.whoseContactAmI.length === 0 ? (
                <Text style={[styles.muted, { color: theme.colors.green50 }]}>{tr.chatSoon}</Text>
              ) : (
                <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                  {props.whoseContactAmI.map((m) => (
                    <View key={m.groupId + '-' + m.ownerId} style={[styles.listRow, { borderBottomColor: theme.colors.green10 }]}>
                      <Text style={[styles.listName, { color: theme.colors.green }]} numberOfLines={1}>{m.ownerDisplayName}</Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 24 },
  card: { width: '100%', maxWidth: 380, borderRadius: 12, borderWidth: 1, padding: 0, overflow: 'hidden' },
  heading: { fontSize: 20, fontWeight: '700', padding: 16, paddingBottom: 8 },
  sectionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  sectionBtnText: { fontSize: 14, fontWeight: '600' },
  arrow: { fontSize: 12 },
  sectionContent: { padding: 12, gap: 6 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13 },
  sortBtn: { fontSize: 12, paddingVertical: 4 },
  filterRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  list: { maxHeight: 150 },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, borderBottomWidth: 1, gap: 8 },
  listName: { fontSize: 13 },
  listSub: { fontSize: 10, marginTop: 2 },
  muted: { fontSize: 12, textAlign: 'center', paddingVertical: 12 },
  badge: { fontSize: 11 },
  addBtn: { borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, alignItems: 'center' },
  addBtnText: { fontSize: 12, fontWeight: '600' },
  miniBtn: { borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8, borderWidth: 1 },
  miniBtnText: { fontSize: 11, fontWeight: '600' },
  miniInput: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, fontSize: 11, flex: 1 },
  label: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  subLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  error: { fontSize: 12 },
});
