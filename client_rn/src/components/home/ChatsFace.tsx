import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { useLanguage } from '../../lib/LanguageContext';
import { useTheme } from '../../theme';
import { t } from '../../lib/i18n';
import type { ContactSummary, ContactItem } from '../../lib/formTypes';
import type { CubeFace } from '../../lib/useCubeNavigation';

type Props = {
  contacts: ContactSummary[];
  error: string | null;
  showNewChat: boolean;
  setShowNewChat: (v: boolean) => void;
  newChatSelectedIds: number[];
  setNewChatSelectedIds: (fn: (prev: number[]) => number[]) => void;
  newChatTitle: string;
  setNewChatTitle: (v: string) => void;
  creatingChat: boolean;
  newChatError: string | null;
  setNewChatError: (v: string | null) => void;
  handleOpenChat: (id: number, name: string, isGroup: boolean) => void;
  handleCreateChat: () => void;
  userContacts: ContactItem[];
  setFace: (face: CubeFace) => void;
};

export default function ChatsFace({
  contacts, error, showNewChat, setShowNewChat,
  newChatSelectedIds, setNewChatSelectedIds,
  newChatTitle, setNewChatTitle, creatingChat, newChatError, setNewChatError,
  handleOpenChat, handleCreateChat, userContacts, setFace,
}: Props) {
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const tr = useMemo(() => t(lang), [lang]);
  const inp = [styles.input, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder, color: theme.colors.text }];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { backgroundColor: theme.colors.panel, borderColor: theme.colors.border }]}>
          <Text style={[styles.heading, { color: theme.colors.text }]}>{tr.chats}</Text>

          <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.colors.green08, borderColor: theme.colors.green30 }]}
            onPress={() => { setShowNewChat(!showNewChat); setNewChatSelectedIds(() => []); setNewChatTitle(''); setNewChatError(null); }}
            activeOpacity={0.7}>
            <Text style={[styles.addBtnText, { color: theme.colors.green }]}>{tr.newChat}</Text>
          </TouchableOpacity>

          {showNewChat && (
            <View style={styles.newChatSection}>
              {userContacts.length === 0 ? (
                <Text style={[styles.muted, { color: theme.colors.green50 }]}>{tr.noContactsYet}</Text>
              ) : (
                <>
                  <Text style={[styles.label, { color: theme.colors.green55 }]}>{tr.selectContacts}</Text>
                  <View style={[styles.list, { borderColor: theme.colors.inputBorder }]}>
                    {userContacts.map((c) => (
                      <TouchableOpacity key={c.id} style={[styles.listRow, { borderBottomColor: theme.colors.green10 }]}
                        onPress={() => setNewChatSelectedIds((prev) => prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id])}
                        activeOpacity={0.7}>
                        <Text style={[styles.listName, { color: theme.colors.green }]} numberOfLines={1}>{c.displayName}</Text>
                        <Text style={{ color: theme.colors.green, fontSize: 16 }}>{newChatSelectedIds.includes(c.id) ? '\u2611' : '\u2610'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {newChatSelectedIds.length >= 2 && (
                    <TextInput style={inp} value={newChatTitle} onChangeText={setNewChatTitle}
                      maxLength={32} placeholder={tr.groupTitle} placeholderTextColor={theme.colors.textMuted} />
                  )}
                  {newChatError ? <Text style={[styles.error, { color: theme.colors.error }]}>{newChatError}</Text> : null}
                  {newChatSelectedIds.length > 0 && (
                    <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.colors.green08, borderColor: theme.colors.green30 }]}
                      onPress={handleCreateChat} disabled={creatingChat} activeOpacity={0.7}>
                      <Text style={[styles.addBtnText, { color: theme.colors.green }]}>
                        {creatingChat ? '\u2026' : newChatSelectedIds.length === 1 ? tr.openChat : tr.createGroup}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          )}

          {error ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{tr.couldNotLoadChats}</Text>
              <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>{error}</Text>
            </View>
          ) : contacts.length === 0 ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{tr.noChatsYet}</Text>
              <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>{tr.addContactsToStart}</Text>
            </View>
          ) : (
            <View style={styles.chatList}>
              {contacts.map((c) => (
                <TouchableOpacity key={c.id} style={[styles.chatRow, { borderBottomColor: theme.colors.green10 }]}
                  onPress={() => handleOpenChat(Number(c.id), c.name, c.isGroup)} activeOpacity={0.7}>
                  <Text style={[styles.chatName, { color: theme.colors.text }]} numberOfLines={1}>{c.name}</Text>
                  <Text style={[styles.chatLast, { color: theme.colors.textMuted }]} numberOfLines={1}>{c.lastMessage}</Text>
                </TouchableOpacity>
              ))}
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
  card: { width: '100%', maxWidth: 380, borderRadius: 12, borderWidth: 1, padding: 16 },
  heading: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  addBtn: { borderRadius: 8, paddingVertical: 10, alignItems: 'center', borderWidth: 1, marginTop: 4 },
  addBtnText: { fontSize: 14, fontWeight: '600' },
  newChatSection: { marginTop: 8, gap: 6 },
  label: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  list: { borderWidth: 1, borderRadius: 8, maxHeight: 150 },
  listRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1 },
  listName: { fontSize: 13, flex: 1 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13 },
  error: { fontSize: 12 },
  muted: { fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  empty: { alignItems: 'center', paddingVertical: 24, gap: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptyText: { fontSize: 13, textAlign: 'center' },
  chatList: { marginTop: 8 },
  chatRow: { paddingVertical: 10, borderBottomWidth: 1 },
  chatName: { fontSize: 14, fontWeight: '600' },
  chatLast: { fontSize: 12, marginTop: 2 },
});
