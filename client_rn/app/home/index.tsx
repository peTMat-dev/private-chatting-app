import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { CubeContainer } from '../../src/components/cube/CubeContainer';
import { useHomeCube } from '../../src/hooks/useHomeCube';
import ChatsFace from '../../src/components/home/ChatsFace';
import ContactsFace from '../../src/components/home/ContactsFace';
import MessagesFace from '../../src/components/home/MessagesFace';
import SettingsFace from '../../src/components/home/SettingsFace';
import HomeInfoFace from '../../src/components/home/InfoFace';
import HomeLogoutFace from '../../src/components/home/LogoutFace';
import { t } from '../../src/lib/i18n';
import { useLanguage } from '../../src/lib/LanguageContext';

export default function HomeCubeScreen() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);

  const handleLogout = useCallback(() => {
    router.replace('/');
  }, [router]);

  const home = useHomeCube(handleLogout);
  const {
    cubeNav, username, authChecked, chats, contacts, messages,
    settings, info, logout, alertDialog, setAlertDialog,
  } = home;

  const tr = useMemo(() => t(lang), [lang]);

  const showToast = useCallback((message: { title: string; body: string }) => {
    setToast(message);
    setTimeout(() => setToast(null), 4500);
  }, []);

  if (!authChecked) return null;

  const faces = {
    front: (
      <ChatsFace
        contacts={chats.contacts} error={chats.error}
        showNewChat={chats.showNewChat} setShowNewChat={chats.setShowNewChat}
        newChatSelectedIds={chats.newChatSelectedIds} setNewChatSelectedIds={chats.setNewChatSelectedIds}
        newChatTitle={chats.newChatTitle} setNewChatTitle={chats.setNewChatTitle}
        creatingChat={chats.creatingChat} newChatError={chats.newChatError}
        setNewChatError={chats.setNewChatError}
        handleOpenChat={(id, name, isGroup) => { messages.handleOpenChat(id, name, isGroup); cubeNav.setFace('right'); }}
        handleCreateChat={chats.handleCreateChat}
        userContacts={contacts.userContacts}
        setFace={cubeNav.setFace}
      />
    ),
    left: (
      <ContactsFace
        showPublicUserSelect={contacts.showPublicUserSelect} setShowPublicUserSelect={contacts.setShowPublicUserSelect}
        sortedPublicUsers={contacts.sortedPublicUsers} loadingPublicUsers={contacts.loadingPublicUsers}
        publicUserSearch={contacts.publicUserSearch} setPublicUserSearch={contacts.setPublicUserSearch}
        sortOrder={contacts.sortOrder} setSortOrder={contacts.setSortOrder}
        removingPublicUserId={contacts.removingPublicUserId} addingPublicUserId={contacts.addingPublicUserId}
        handleRemovePublicUser={contacts.handleRemovePublicUser} handleAddPublicUser={contacts.handleAddPublicUser}
        fetchPublicUsers={contacts.fetchPublicUsers}
        showRequestInput={contacts.showRequestInput} setShowRequestInput={contacts.setShowRequestInput}
        requestDisplayName={contacts.requestDisplayName} setRequestDisplayName={contacts.setRequestDisplayName}
        privateRequestSent={contacts.privateRequestSent} setPrivateRequestSent={contacts.setPrivateRequestSent}
        handleSendRequest={contacts.handleSendRequest}
        showContactList={contacts.showContactList} setShowContactList={contacts.setShowContactList}
        contactsError={contacts.contactsError} userContacts={contacts.userContacts}
        contactSortOrder={contacts.contactSortOrder} setContactSortOrder={contacts.setContactSortOrder}
        contactSearch={contacts.contactSearch} setContactSearch={contacts.setContactSearch}
        sortedContacts={contacts.sortedContacts} removingContactId={contacts.removingContactId}
        handleRemoveContact={contacts.handleRemoveContact} handleChatWithContact={contacts.handleChatWithContact}
        fetchUserContacts={contacts.fetchUserContacts}
        showContactListGroups={contacts.showContactListGroups} setShowContactListGroups={contacts.setShowContactListGroups}
        contactGroupsError={contacts.contactGroupsError} loadingContactGroups={contacts.loadingContactGroups}
        contactGroups={contacts.contactGroups}
        groupChatTitleEdit={contacts.groupChatTitleEdit} setGroupChatTitleEdit={contacts.setGroupChatTitleEdit}
        removingGroupId={contacts.removingGroupId} setRemovingGroupId={contacts.setRemovingGroupId}
        groupChatCreating={contacts.groupChatCreating}
        handleChatWithGroup={contacts.handleChatWithGroup} fetchContactGroups={contacts.fetchContactGroups}
        showCreateGroup={contacts.showCreateGroup} setShowCreateGroup={contacts.setShowCreateGroup}
        createGroupError={contacts.createGroupError} createGroupName={contacts.createGroupName}
        setCreateGroupName={contacts.setCreateGroupName} creatingGroup={contacts.creatingGroup}
        handleCreateGroup={contacts.handleCreateGroup}
        createGroupSelectedIds={contacts.createGroupSelectedIds} setCreateGroupSelectedIds={contacts.setCreateGroupSelectedIds}
        showRequests={contacts.showRequests} setShowRequests={contacts.setShowRequests}
        loadingRequests={contacts.loadingRequests}
        incomingRequests={contacts.incomingRequests} outgoingRequests={contacts.outgoingRequests}
        approvingRequestId={contacts.approvingRequestId} rejectingRequestId={contacts.rejectingRequestId}
        cancellingRequestId={contacts.cancellingRequestId}
        handleApproveRequest={contacts.handleApproveRequest} handleRejectRequest={contacts.handleRejectRequest}
        handleCancelRequest={contacts.handleCancelRequest} fetchRequests={contacts.fetchRequests}
        showWhoseContactAmI={contacts.showWhoseContactAmI} setShowWhoseContactAmI={contacts.setShowWhoseContactAmI}
        loadingWhoseContactAmI={contacts.loadingWhoseContactAmI} whoseContactAmI={contacts.whoseContactAmI}
        fetchWhoseContactAmI={contacts.fetchWhoseContactAmI}
      />
    ),
    right: (
      <MessagesFace
        activeChatId={messages.activeChatId} activeChatName={messages.activeChatName}
        activeChatIsGroup={messages.activeChatIsGroup} activeChatMessages={messages.activeChatMessages}
        messageInput={messages.messageInput} setMessageInput={messages.setMessageInput}
        chatLoading={messages.chatLoading} chatError={messages.chatError}
        sendingMessage={messages.sendingMessage}
        confirmDialog={messages.confirmDialog} setConfirmDialog={messages.setConfirmDialog}
        handleSendMessage={messages.handleSendMessage} handleDeleteMessage={messages.handleDeleteMessage}
        handleMessageDoubleTap={messages.handleMessageDoubleTap}
        settings={settings.settings} setFace={cubeNav.setFace}
      />
    ),
    back: (
      <SettingsFace
        settings={settings.settings} setSettings={settings.setSettings}
        settingsError={settings.settingsError} savingSettings={settings.savingSettings}
        settingsSaved={settings.settingsSaved} handleSaveSettings={settings.handleSaveSettings}
        timezones={settings.timezones} lang={settings.lang}
        showLangSelect={settings.showLangSelect} setShowLangSelect={settings.setShowLangSelect}
        handleLangChange={settings.handleLangChange}
        showMaxParticipantsSelect={settings.showMaxParticipantsSelect}
        setShowMaxParticipantsSelect={settings.setShowMaxParticipantsSelect}
        showTimezoneSelect={settings.showTimezoneSelect} setShowTimezoneSelect={settings.setShowTimezoneSelect}
        showThemeSelect={settings.showThemeSelect} setShowThemeSelect={settings.setShowThemeSelect}
        handleThemeChange={settings.handleThemeChange}
        showColorPicker={settings.showColorPicker} setShowColorPicker={settings.setShowColorPicker}
        handleCubeColorChange={settings.handleCubeColorChange}
        handleColorDoubleTap={settings.handleColorDoubleTap}
      />
    ),
    top: (
      <HomeLogoutFace handleLogout={logout.handleLogout} goUp={cubeNav.goUp} />
    ),
    bottom: (
      <HomeInfoFace
        activeInfoTab={info.activeInfoTab} setActiveInfoTab={info.setActiveInfoTab}
        infoItems={info.infoItems} loadingInfoItems={info.loadingInfoItems}
        selectedInfo={info.selectedInfo} setSelectedInfo={info.setSelectedInfo}
        reportedBugs={info.reportedBugs} loadingBugs={info.loadingBugs}
        bugTitleInput={info.bugTitleInput} setBugTitleInput={info.setBugTitleInput}
        bugInput={info.bugInput} setBugInput={info.setBugInput}
        bugCategoryInput={info.bugCategoryInput} setBugCategoryInput={info.setBugCategoryInput}
        submittingBug={info.submittingBug} bugReported={info.bugReported}
        bugSubView={info.bugSubView} setBugSubView={info.setBugSubView}
        handleSubmitBug={info.handleSubmitBug} lang={lang} goDown={cubeNav.goDown}
      />
    ),
  };

  return (
    <View style={styles.screen}>
      <CubeContainer
        faces={faces}
        rotationX={cubeNav.rotationX} rotationY={cubeNav.rotationY}
        goLeft={cubeNav.goLeft} goRight={cubeNav.goRight}
        goUp={cubeNav.goUp} goDown={cubeNav.goDown}
        beginDrag={cubeNav.beginDrag} updateDrag={cubeNav.updateDrag} endDrag={cubeNav.endDrag}
        activeFace={cubeNav.activeFace}
      />

      {/* Alert Dialog */}
      {alertDialog?.show && (
        <TouchableOpacity style={styles.alertOverlay} onPress={() => setAlertDialog(null)} activeOpacity={1}>
          <View style={[styles.alertCard, { backgroundColor: '#0a1a14' }]}>
            {alertDialog.title && <Text style={styles.alertTitle}>{alertDialog.title}</Text>}
            <Text style={styles.alertMessage}>{alertDialog.message}</Text>
            <TouchableOpacity style={styles.alertBtn} onPress={() => setAlertDialog(null)} activeOpacity={0.7}>
              <Text style={styles.alertBtnText}>{tr.cancel}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* Toast */}
      {toast && (
        <View style={styles.toastContainer}>
          <View style={styles.toastBox}>
            <Text style={styles.toastTitle}>{toast.title}</Text>
            <Text style={styles.toastBody}>{toast.body}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  alertOverlay: { position: 'absolute', inset: 0, zIndex: 1000, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)' },
  alertCard: { maxWidth: 280, width: '80%', borderRadius: 12, padding: 20 },
  alertTitle: { color: '#06ec90', fontSize: 15, fontWeight: '700', marginBottom: 8 },
  alertMessage: { color: '#06ec90', fontSize: 14, marginBottom: 16 },
  alertBtn: { backgroundColor: '#06ec90', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  alertBtnText: { color: '#020202', fontSize: 14, fontWeight: '600' },
  toastContainer: { position: 'absolute', bottom: 40, left: 16, right: 16, alignItems: 'center' },
  toastBox: { backgroundColor: 'rgba(6, 236, 144, 0.95)', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, maxWidth: 360 },
  toastTitle: { color: '#020202', fontWeight: '700', fontSize: 13 },
  toastBody: { color: '#020202', fontSize: 12, marginTop: 2 },
});
