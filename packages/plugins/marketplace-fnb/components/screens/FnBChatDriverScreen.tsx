import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  FlatList,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Send2, Call, Add } from 'iconsax-react-nativejs';
import { scale, moderateVerticalScale, getHorizontalPadding, FontFamily, ScreenHeader } from '@core/config';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';
import { getCustomChatTemplates, addCustomChatTemplate, removeCustomChatTemplate } from '../../utils/chatTemplateStorage';

type Message = {
  id: string;
  text: string;
  isMe: boolean;
  time: string;
};

// Chat template (quick reply) untuk konteks delivery
const CHAT_TEMPLATES: string[] = [
  'Saya sudah di lokasi',
  'Tolong tunggu sebentar',
  'Ini pesanan saya',
  'Terima kasih',
];

// Mock data chat awal
const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    text: 'Halo kak, sesuai aplikasi ya pesanannya. Mohon ditunggu.',
    isMe: false,
    time: '12:05',
  },
  {
    id: '2',
    text: 'Oke pak. Tolong jangan lupa sambalnya dipisah ya.',
    isMe: true,
    time: '12:06',
  }
];

export const FnBChatDriverScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding();
  const route = useRoute();

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [customTemplates, setCustomTemplates] = useState<string[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newTemplateText, setNewTemplateText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const allTemplates = [...CHAT_TEMPLATES, ...customTemplates];
  const customSet = new Set(customTemplates);

  useEffect(() => {
    let cancelled = false;
    getCustomChatTemplates().then((list) => {
      if (!cancelled) setCustomTemplates(list);
    });
    return () => { cancelled = true; };
  }, []);

  const refreshCustomTemplates = useCallback(async () => {
    const list = await getCustomChatTemplates();
    setCustomTemplates(list);
  }, []);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleOpenAddTemplate = () => {
    setNewTemplateText('');
    setAddModalVisible(true);
  };

  const handleSaveNewTemplate = async () => {
    const trimmed = newTemplateText.trim();
    if (!trimmed) return;
    const ok = await addCustomChatTemplate(trimmed);
    if (ok) {
      await refreshCustomTemplates();
      setAddModalVisible(false);
    }
  };

  const handleLongPressTemplate = (template: string) => {
    if (!customSet.has(template)) return;
    Alert.alert(
      t('fnb.deleteTemplateTitle'),
      t('fnb.deleteTemplateMessage', { template }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await removeCustomChatTemplate(template);
            await refreshCustomTemplates();
          },
        },
      ]
    );
  };

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: trimmed,
      isMe: true,
      time: timeString,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
  }, []);

  const handleSend = () => {
    sendMessage(inputText);
  };

  const handleTemplatePress = (template: string) => {
    sendMessage(template);
  };

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const renderMessage = ({ item }: { item: Message }) => {
    return (
      <View style={[styles.messageBubbleWrap, item.isMe ? styles.messageBubbleWrapMe : styles.messageBubbleWrapOther]}>
        <View
          style={[
            styles.messageBubble,
            item.isMe ? [styles.messageBubbleMe, { backgroundColor: colors.primaryLight }] : [styles.messageBubbleOther, { backgroundColor: colors.surface }],
          ]}
        >
          <Text style={[styles.messageText, { color: item.isMe ? colors.primary : colors.text }]}>{item.text}</Text>
          <Text style={[styles.messageTime, { color: item.isMe ? colors.primary : colors.textSecondary }]}>{item.time}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: '#F8F9FA' }]} // Sedikit abu untuk bg chat
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        title="Budi Santoso"
        onBackPress={handleBack}
        rightComponent={
          <TouchableOpacity onPress={() => {}} style={{ padding: scale(8) }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Call size={scale(22)} color={colors.text} variant="Outline" />
          </TouchableOpacity>
        }
        showBorder
        style={{ paddingTop: insets.top, backgroundColor: colors.surface }}
      />

      {/* CHAT AREA */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={[styles.chatList, { paddingBottom: moderateVerticalScale(24) }]}
        showsVerticalScrollIndicator={false}
      />

      {/* CHAT TEMPLATES (quick reply) */}
      <View style={[styles.templateContainer, { backgroundColor: colors.surface }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.templateScroll}
        >
          {allTemplates.map((template) => (
            <TouchableOpacity
              key={template}
              style={[styles.templateChip, { borderColor: colors.border }]}
              onPress={() => handleTemplatePress(template)}
              onLongPress={() => handleLongPressTemplate(template)}
              activeOpacity={0.7}
            >
              <Text style={[styles.templateChipText, { color: colors.text }]} numberOfLines={1}>
                {template}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.templateChipAdd, { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}
            onPress={handleOpenAddTemplate}
            activeOpacity={0.7}
          >
            <Add size={scale(16)} color={colors.primary} variant="Bold" />
            <Text style={[styles.templateChipAddText, { color: colors.primary }]}>Tambah</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* MODAL: Tambah template */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAddModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('fnb.addChatTemplate')}</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              placeholder={t('fnb.chatTemplatePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={newTemplateText}
              onChangeText={setNewTemplateText}
              maxLength={100}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel, { borderColor: colors.border }]}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.text }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSave, { backgroundColor: colors.primary }]}
                onPress={handleSaveNewTemplate}
                disabled={!newTemplateText.trim()}
              >
                <Text style={[styles.modalBtnText, { color: colors.surface }]}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* INPUT AREA */}
      <View style={[styles.inputContainer, { backgroundColor: colors.surface, paddingBottom: insets.bottom + moderateVerticalScale(12) }]}>
        <View style={[styles.inputWrap, { backgroundColor: '#F0F2F5' }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder={t('fnb.writeMessage')}
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={200}
          />
        </View>
        <TouchableOpacity 
          style={[styles.sendBtn, { backgroundColor: inputText.trim() ? colors.primary : colors.border }]} 
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Send2 size={scale(20)} color={colors.surface} variant="Bold" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatList: {
    paddingHorizontal: scale(16),
    paddingTop: scale(24),
  },
  messageBubbleWrap: {
    marginBottom: scale(16),
    width: '100%',
    flexDirection: 'row',
  },
  messageBubbleWrapMe: {
    justifyContent: 'flex-end',
  },
  messageBubbleWrapOther: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    borderRadius: scale(16),
  },
  messageBubbleMe: {
    borderBottomRightRadius: scale(4),
  },
  messageBubbleOther: {
    borderBottomLeftRadius: scale(4),
  },
  messageText: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.regular,
    lineHeight: scale(20),
  },
  messageTime: {
    fontSize: scale(10),
    fontFamily: FontFamily.monasans.medium,
    marginTop: scale(4),
    textAlign: 'right',
    opacity: 0.7,
  },
  templateContainer: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  templateScroll: {
    flexDirection: 'row',
    gap: scale(8),
    paddingVertical: scale(4),
  },
  templateChip: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    borderRadius: scale(20),
    borderWidth: 1,
  },
  templateChipText: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.medium,
  },
  templateChipAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    borderRadius: scale(20),
    borderWidth: 1,
  },
  templateChipAddText: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.semiBold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(24),
  },
  modalContent: {
    width: '100%',
    maxWidth: scale(340),
    borderRadius: scale(16),
    padding: scale(20),
  },
  modalTitle: {
    fontSize: scale(16),
    fontFamily: FontFamily.monasans.bold,
    marginBottom: scale(16),
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: scale(12),
    paddingHorizontal: scale(14),
    paddingVertical: scale(12),
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.regular,
    minHeight: scale(44),
    maxHeight: scale(80),
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: scale(12),
    marginTop: scale(20),
  },
  modalBtn: {
    paddingHorizontal: scale(20),
    paddingVertical: scale(10),
    borderRadius: scale(8),
  },
  modalBtnCancel: {
    borderWidth: 1,
  },
  modalBtnSave: {},
  modalBtnText: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.semiBold,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: scale(16),
    paddingTop: scale(12),
  },
  inputWrap: {
    flex: 1,
    borderRadius: scale(24),
    minHeight: scale(40),
    maxHeight: scale(100),
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    marginRight: scale(12),
  },
  input: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.regular,
    padding: 0, 
    margin: 0,
  },
  sendBtn: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(2), // Align with input visually
  },
});
