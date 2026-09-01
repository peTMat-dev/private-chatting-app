import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useLanguage } from '../../lib/LanguageContext';
import { useTheme } from '../../theme';
import { t } from '../../lib/i18n';
import type { ChatMessage, UserSettings, ConfirmDialog } from '../../lib/formTypes';
import type { CubeFace } from '../../lib/useCubeNavigation';
import type { Dispatch, SetStateAction } from 'react';

type Props = {
  activeChatId: number | null;
  activeChatName: string;
  activeChatIsGroup: boolean;
  activeChatMessages: ChatMessage[];
  messageInput: string;
  setMessageInput: Dispatch<SetStateAction<string>>;
  chatLoading: boolean;
  chatError: string | null;
  sendingMessage: boolean;
  confirmDialog: ConfirmDialog | null;
  setConfirmDialog: Dispatch<SetStateAction<ConfirmDialog | null>>;
  handleSendMessage: () => void;
  handleDeleteMessage: (messageId: number) => void;
  handleMessageDoubleTap: (messageId: number) => void;
  settings: UserSettings | null;
  setFace: (face: CubeFace) => void;
};

export default function MessagesFace({
  activeChatId, activeChatName, activeChatIsGroup, activeChatMessages,
  messageInput, setMessageInput, chatLoading, chatError, sendingMessage,
  confirmDialog, setConfirmDialog, handleSendMessage, handleDeleteMessage,
  handleMessageDoubleTap, settings, setFace,
}: Props) {
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const tr = useMemo(() => t(lang), [lang]);
  const scrollRef = useRef<ScrollView>(null);

  const tz = settings?.user_timezone || 'UTC';
  const tzOpts = { timeZone: tz };

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [activeChatMessages.length]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Confirm dialog overlay */}
      {confirmDialog?.show && (
        <View style={styles.overlay}>
          <View style={[styles.dialogCard, { backgroundColor: theme.colors.panel }]}>
            <Text style={[styles.dialogText, { color: theme.colors.green }]}>{confirmDialog.message}</Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity style={[styles.ghostBtn, { borderColor: theme.colors.border }]}
                onPress={() => setConfirmDialog(null)} activeOpacity={0.7}>
                <Text style={[styles.ghostText, { color: theme.colors.text }]}>{tr.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dialogBtn, { backgroundColor: theme.colors.green }]}
                onPress={confirmDialog.onConfirm} activeOpacity={0.7}>
                <Text style={[styles.dialogBtnText, { color: theme.colors.greenLabel }]}>{tr.confirmAction}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={[styles.card, { backgroundColor: theme.colors.panel, borderColor: theme.colors.border }]}>
        {!activeChatId ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>{tr.openConversation}</Text>
            <TouchableOpacity style={[styles.goBtn, { backgroundColor: theme.colors.green08, borderColor: theme.colors.green30 }]}
              onPress={() => setFace('front')} activeOpacity={0.7}>
              <Text style={{ color: theme.colors.green, fontSize: 13 }}>{tr.chats}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={[styles.chatHeader, { borderBottomColor: theme.colors.green15 }]}>
              <Text style={[styles.chatName, { color: theme.colors.text }]} numberOfLines={1}>{activeChatName}</Text>
              {activeChatIsGroup && <Text style={[styles.groupLabel, { color: theme.colors.green55 }]}>{tr.createGroup}</Text>}
            </View>

            {chatLoading ? (
              <View style={styles.empty}><Text style={{ color: theme.colors.textMuted }}>{tr.loadingInfo}</Text></View>
            ) : chatError ? (
              <View style={styles.empty}><Text style={{ color: theme.colors.error }}>{chatError}</Text></View>
            ) : (
              <ScrollView ref={scrollRef} style={styles.messagesArea} showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 12 }}>
                {activeChatMessages.length === 0 ? (
                  <Text style={[styles.emptyText, { color: theme.colors.textMuted, textAlign: 'center', paddingVertical: 24 }]}>{tr.noMessagesYet}</Text>
                ) : (
                  activeChatMessages.map((m) => {
                    const msgDate = new Date(m.sentAt);
                    return (
                      <View key={m.messageId} style={[styles.msgRow, m.isOwn ? styles.msgOwn : styles.msgOther]}>
                        {!m.isOwn && <Text style={[styles.senderName, { color: theme.colors.green55 }]}>{m.senderDisplayName}</Text>}
                        <TouchableOpacity
                          style={[styles.bubble, { backgroundColor: m.isOwn ? theme.colors.green25 : theme.colors.green10, borderColor: theme.colors.green30 }]}
                          onLongPress={m.isOwn ? () => handleMessageDoubleTap(m.messageId) : undefined}
                          activeOpacity={m.isOwn ? 0.7 : 1}
                          disabled={!m.isOwn}
                        >
                          <Text style={[styles.bubbleText, { color: theme.colors.text }]}>{m.text}</Text>
                        </TouchableOpacity>
                        <Text style={[styles.msgTime, { color: theme.colors.green55 }]}>
                          {msgDate.toLocaleTimeString([], { ...tzOpts, hour: '2-digit', minute: '2-digit', hour12: false })}
                        </Text>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            )}

            <View style={[styles.inputBar, { borderTopColor: theme.colors.green15 }]}>
              <TextInput
                style={[styles.msgInput, { backgroundColor: theme.colors.green08, borderColor: theme.colors.green30, color: theme.colors.green }]}
                value={messageInput} onChangeText={setMessageInput}
                placeholder={tr.typeMessage} placeholderTextColor={theme.colors.green50}
                multiline returnKeyType="default"
                onSubmitEditing={handleSendMessage}
              />
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: theme.colors.green08, borderColor: theme.colors.green30, opacity: (sendingMessage || !messageInput.trim()) ? 0.5 : 1 }]}
                onPress={handleSendMessage} disabled={sendingMessage || !messageInput.trim()} activeOpacity={0.7}
              >
                <Text style={[styles.sendText, { color: theme.colors.green }]}>{sendingMessage ? '\u2026' : tr.sendMessage}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', padding: 16 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)' },
  dialogCard: { borderRadius: 12, padding: 16, maxWidth: 260, width: '80%' },
  dialogText: { fontSize: 14, textAlign: 'center', marginBottom: 12 },
  dialogActions: { flexDirection: 'row', gap: 8 },
  ghostBtn: { flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center', borderWidth: 1 },
  ghostText: { fontSize: 13 },
  dialogBtn: { flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  dialogBtnText: { fontSize: 13, fontWeight: '600' },
  card: { width: '100%', maxWidth: 380, borderRadius: 12, borderWidth: 1, overflow: 'hidden', flex: 1, maxHeight: 520 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  emptyText: { fontSize: 13, textAlign: 'center' },
  goBtn: { borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1 },
  chatHeader: { paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  chatName: { fontSize: 14, fontWeight: '600', flex: 1 },
  groupLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  messagesArea: { flex: 1 },
  msgRow: { marginBottom: 6 },
  msgOwn: { alignItems: 'flex-end' },
  msgOther: { alignItems: 'flex-start' },
  senderName: { fontSize: 10, marginBottom: 2, paddingHorizontal: 4 },
  bubble: { maxWidth: '75%', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1 },
  bubbleText: { fontSize: 13, flexWrap: 'wrap' },
  msgTime: { fontSize: 9, marginTop: 2 },
  inputBar: { paddingVertical: 8, paddingHorizontal: 12, borderTopWidth: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  msgInput: { flex: 1, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, maxHeight: 80 },
  sendBtn: { borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1 },
  sendText: { fontSize: 12, fontWeight: '600' },
});
