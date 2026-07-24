"use client";

import { useMemo } from "react";
import { useHomeCube } from "../../hooks/useHomeCube";
import { CubeNavigationProvider } from "../../lib/CubeNavigationContext";
import { t } from "../../lib/i18n";
import ChatsFace from "../components/home/ChatsFace";
import ContactsFace from "../components/home/ContactsFace";
import SettingsFace from "../components/home/SettingsFace";
import MessagesFace from "../components/home/MessagesFace";
import HomeInfoFace from "../components/home/InfoFace";
import HomeLogoutFace from "../components/home/LogoutFace";

export default function HomeCube() {
  const home = useHomeCube();
  const { cubeNav, username, authChecked, chats, contacts, messages, settings, info, logout, alertDialog, setAlertDialog } = home;

  const tr = useMemo(() => t(settings.lang), [settings.lang]);

  // Don't render until auth is checked
  if (!authChecked) {
    return null;
  }

  return (
    <CubeNavigationProvider value={cubeNav}>
      <div
        className="mobile-auth-screen"
        onKeyDown={cubeNav.handleKeyDown}
        tabIndex={0}
      >
        <div className="auth-cube-stage">
          <div
            className="auth-cube"
            style={{
              transform: `rotateX(${cubeNav.rotation.x}deg) rotateY(${cubeNav.rotation.y}deg)`,
              transition: cubeNav.transitionEnabled ? "transform 0.5s ease-out" : "none",
            }}
            onTouchStart={cubeNav.handleTouchStart}
            onTouchEnd={cubeNav.handleTouchEnd}
          >
          {/* Front: Chats */}
          <ChatsFace
            contacts={chats.contacts}
            error={chats.error}
            showNewChat={chats.showNewChat}
            setShowNewChat={chats.setShowNewChat}
            newChatSelectedIds={chats.newChatSelectedIds}
            setNewChatSelectedIds={chats.setNewChatSelectedIds}
            newChatTitle={chats.newChatTitle}
            setNewChatTitle={chats.setNewChatTitle}
            creatingChat={chats.creatingChat}
            newChatError={chats.newChatError}
            setNewChatError={chats.setNewChatError}
            handleOpenChat={(id, name, isGroup) => {
              messages.handleOpenChat(id, name, isGroup);
              cubeNav.setFace("right");
            }}
            handleCreateChat={chats.handleCreateChat}
            userContacts={contacts.userContacts}
            handleHeaderTripleTap={cubeNav.handleHeaderTripleTap}
            handleFooterTripleTap={cubeNav.handleFooterTripleTap}
            setFace={cubeNav.setFace}
            tr={tr}
          />

          {/* Left: Contacts */}
          <ContactsFace
            handleHeaderTripleTap={cubeNav.handleHeaderTripleTap}
            handleFooterTripleTap={cubeNav.handleFooterTripleTap}
            showPublicUserSelect={contacts.showPublicUserSelect}
            setShowPublicUserSelect={contacts.setShowPublicUserSelect}
            sortedPublicUsers={contacts.sortedPublicUsers}
            loadingPublicUsers={contacts.loadingPublicUsers}
            publicUserSearch={contacts.publicUserSearch}
            setPublicUserSearch={contacts.setPublicUserSearch}
            sortOrder={contacts.sortOrder}
            setSortOrder={contacts.setSortOrder}
            removingPublicUserId={contacts.removingPublicUserId}
            addingPublicUserId={contacts.addingPublicUserId}
            handleRemovePublicUser={contacts.handleRemovePublicUser}
            handleAddPublicUser={contacts.handleAddPublicUser}
            fetchPublicUsers={contacts.fetchPublicUsers}
            showRequestInput={contacts.showRequestInput}
            setShowRequestInput={contacts.setShowRequestInput}
            requestDisplayName={contacts.requestDisplayName}
            setRequestDisplayName={contacts.setRequestDisplayName}
            privateRequestSent={contacts.privateRequestSent}
            setPrivateRequestSent={contacts.setPrivateRequestSent}
            handleSendRequest={contacts.handleSendRequest}
            showContactList={contacts.showContactList}
            setShowContactList={contacts.setShowContactList}
            contactsError={contacts.contactsError}
            userContacts={contacts.userContacts}
            contactSortOrder={contacts.contactSortOrder}
            setContactSortOrder={contacts.setContactSortOrder}
            contactSearch={contacts.contactSearch}
            setContactSearch={contacts.setContactSearch}
            sortedContacts={contacts.sortedContacts}
            removingContactId={contacts.removingContactId}
            handleRemoveContact={contacts.handleRemoveContact}
            handleChatWithContact={contacts.handleChatWithContact}
            fetchUserContacts={contacts.fetchUserContacts}
            showContactListGroups={contacts.showContactListGroups}
            setShowContactListGroups={contacts.setShowContactListGroups}
            contactGroupsError={contacts.contactGroupsError}
            loadingContactGroups={contacts.loadingContactGroups}
            contactGroups={contacts.contactGroups}
            groupChatTitleEdit={contacts.groupChatTitleEdit}
            setGroupChatTitleEdit={contacts.setGroupChatTitleEdit}
            removingGroupId={contacts.removingGroupId}
            setRemovingGroupId={contacts.setRemovingGroupId}
            groupChatCreating={contacts.groupChatCreating}
            handleChatWithGroup={contacts.handleChatWithGroup}
            fetchContactGroups={contacts.fetchContactGroups}
            showCreateGroup={contacts.showCreateGroup}
            setShowCreateGroup={contacts.setShowCreateGroup}
            createGroupError={contacts.createGroupError}
            createGroupName={contacts.createGroupName}
            setCreateGroupName={contacts.setCreateGroupName}
            creatingGroup={contacts.creatingGroup}
            handleCreateGroup={contacts.handleCreateGroup}
            createGroupSelectedIds={contacts.createGroupSelectedIds}
            setCreateGroupSelectedIds={contacts.setCreateGroupSelectedIds}
            showRequests={contacts.showRequests}
            setShowRequests={contacts.setShowRequests}
            loadingRequests={contacts.loadingRequests}
            incomingRequests={contacts.incomingRequests}
            outgoingRequests={contacts.outgoingRequests}
            approvingRequestId={contacts.approvingRequestId}
            rejectingRequestId={contacts.rejectingRequestId}
            cancellingRequestId={contacts.cancellingRequestId}
            handleApproveRequest={contacts.handleApproveRequest}
            handleRejectRequest={contacts.handleRejectRequest}
            handleCancelRequest={contacts.handleCancelRequest}
            fetchRequests={contacts.fetchRequests}
            showWhoseContactAmI={contacts.showWhoseContactAmI}
            setShowWhoseContactAmI={contacts.setShowWhoseContactAmI}
            loadingWhoseContactAmI={contacts.loadingWhoseContactAmI}
            whoseContactAmI={contacts.whoseContactAmI}
            fetchWhoseContactAmI={contacts.fetchWhoseContactAmI}
            tr={tr}
          />

          {/* Back: Settings */}
          <SettingsFace
            settings={settings.settings}
            setSettings={settings.setSettings}
            settingsError={settings.settingsError}
            savingSettings={settings.savingSettings}
            settingsSaved={settings.settingsSaved}
            handleSaveSettings={settings.handleSaveSettings}
            timezones={settings.timezones}
            lang={settings.lang}
            showLangSelect={settings.showLangSelect}
            setShowLangSelect={settings.setShowLangSelect}
            handleLangChange={settings.handleLangChange}
            showMaxParticipantsSelect={settings.showMaxParticipantsSelect}
            setShowMaxParticipantsSelect={settings.setShowMaxParticipantsSelect}
            showTimezoneSelect={settings.showTimezoneSelect}
            setShowTimezoneSelect={settings.setShowTimezoneSelect}
            showThemeSelect={settings.showThemeSelect}
            setShowThemeSelect={settings.setShowThemeSelect}
            handleThemeChange={settings.handleThemeChange}
            handleHeaderTripleTap={cubeNav.handleHeaderTripleTap}
            handleFooterTripleTap={cubeNav.handleFooterTripleTap}
            tr={tr}
          />

          {/* Right: Messages */}
          <MessagesFace
            activeChatId={messages.activeChatId}
            activeChatName={messages.activeChatName}
            activeChatIsGroup={messages.activeChatIsGroup}
            activeChatMessages={messages.activeChatMessages}
            messageInput={messages.messageInput}
            setMessageInput={messages.setMessageInput}
            chatLoading={messages.chatLoading}
            chatError={messages.chatError}
            sendingMessage={messages.sendingMessage}
            confirmDialog={messages.confirmDialog}
            setConfirmDialog={messages.setConfirmDialog}
            handleSendMessage={messages.handleSendMessage}
            handleDeleteMessage={messages.handleDeleteMessage}
            handleMessageDoubleTap={messages.handleMessageDoubleTap}
            settings={settings.settings}
            handleHeaderTripleTap={cubeNav.handleHeaderTripleTap}
            handleFooterTripleTap={cubeNav.handleFooterTripleTap}
            setFace={cubeNav.setFace}
            messagesEndRef={messages.messagesEndRef}
            tr={tr}
          />

          {/* Bottom: Info */}
          <HomeInfoFace
            activeInfoTab={info.activeInfoTab}
            setActiveInfoTab={info.setActiveInfoTab}
            infoItems={info.infoItems}
            loadingInfoItems={info.loadingInfoItems}
            selectedInfo={info.selectedInfo}
            setSelectedInfo={info.setSelectedInfo}
            reportedBugs={info.reportedBugs}
            loadingBugs={info.loadingBugs}
            bugTitleInput={info.bugTitleInput}
            setBugTitleInput={info.setBugTitleInput}
            bugInput={info.bugInput}
            setBugInput={info.setBugInput}
            bugCategoryInput={info.bugCategoryInput}
            setBugCategoryInput={info.setBugCategoryInput}
            submittingBug={info.submittingBug}
            bugReported={info.bugReported}
            bugSubView={info.bugSubView}
            setBugSubView={info.setBugSubView}
            handleSubmitBug={info.handleSubmitBug}
            lang={settings.lang}
            goDown={cubeNav.goDown}
            tr={tr}
          />

            {/* Top: Logout */}
            <HomeLogoutFace
              handleLogout={logout.handleLogout}
              goUp={cubeNav.goUp}
              tr={tr}
            />
          </div>
        </div>

        {/* Alert Dialog */}
        {alertDialog?.show && (
          <div
            onClick={() => setAlertDialog(null)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.55)",
            }}
          >
            <div
              className="auth-card"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "fit-content",
                maxWidth: "280px",
                padding: "1rem 1.25rem",
                boxShadow: "0 10px 40px rgba(6, 236, 144, 0.4)",
              }}
            >
              {alertDialog.title && (
                <h3 style={{ color: "var(--color-green)", fontSize: "0.95rem", margin: "0 0 0.5rem 0" }}>
                  {alertDialog.title}
                </h3>
              )}
              <p style={{ color: "var(--color-green)", fontSize: "0.85rem", margin: "0 0 1rem 0" }}>
                {alertDialog.message}
              </p>
              <button
                type="button"
                className="auth-btn"
                onClick={() => setAlertDialog(null)}
                style={{ width: "100%", padding: "0.5rem", fontSize: "0.85rem" }}
              >
                {tr.cancel}
              </button>
            </div>
          </div>
        )}
      </div>
    </CubeNavigationProvider>
  );
}