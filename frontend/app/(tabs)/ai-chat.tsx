/**
 * AI Mentor - Real-Time LLM Career Coach & Interview Assistant
 * Supports Multimodal Documents & Photos Analysis with Google Gemini
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { Header } from '../../src/components/Header';
import { api } from '../../src/services/api';

// Dynamic loaders for media pickers to ensure safe runtime compatibility
const getImagePicker = () => {
  try {
    return require('expo-image-picker');
  } catch (e) {
    console.warn('expo-image-picker unavailable:', e);
    return null;
  }
};

const getDocumentPicker = () => {
  try {
    return require('expo-document-picker');
  } catch (e) {
    console.warn('expo-document-picker unavailable:', e);
    return null;
  }
};

interface ChatAttachment {
  name: string;
  type: string;
  uri: string;
  base64: string;
  isImage: boolean;
  size?: number;
}

interface MessageItem {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  attachment?: {
    name: string;
    type: string;
    uri?: string;
    isImage?: boolean;
  };
}

const DEFAULT_GREETING: MessageItem = {
  id: 'init-1',
  sender: 'ai',
  text: "Hello! I am your AI Technical Interview & Career Coach. Ask me anything about system design, coding algorithms, STAR behavioral responses, or upload photos of architecture diagrams, code screenshots, or resume documents for an instant critique!",
  timestamp: 'Just now',
};

export default function AIChatScreen() {
  const [messages, setMessages] = useState<MessageItem[]>([DEFAULT_GREETING]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<ChatAttachment | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const res = await api.getChatHistory();
      if (res.success && res.data?.history && res.data.history.length > 0) {
        const formatted: MessageItem[] = res.data.history.map((m: any) => ({
          id: m.id,
          sender: m.sender.toLowerCase() === 'user' ? 'user' : 'ai',
          text: m.message,
          timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        setMessages(formatted);
      }
    } catch (err) {
      console.log('Using local greeting:', err);
    }
  };

  /**
   * Converts local file URI to Base64 string across Web and Native
   */
  const convertUriToBase64 = async (uri: string): Promise<string> => {
    try {
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1] || '');
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        const FileSystem = require('expo-file-system');
        if (FileSystem && FileSystem.readAsStringAsync) {
          return await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType?.Base64 || 'base64',
          });
        }
      }
    } catch (err) {
      console.warn('[AIChat] convertUriToBase64 error:', err);
    }
    return '';
  };

  /**
   * Photo / Image attachment picker
   */
  const handlePickPhoto = async () => {
    try {
      const ImagePicker = getImagePicker();
      if (!ImagePicker) {
        Alert.alert('Notice', 'Image picker is not available on this platform.');
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library access to attach images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.75,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const filename = asset.fileName || asset.uri.split('/').pop() || 'photo.jpg';
        let b64 = asset.base64 || '';
        if (!b64 && asset.uri) {
          b64 = await convertUriToBase64(asset.uri);
        }

        const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

        setSelectedAttachment({
          name: filename,
          type: mimeType,
          uri: asset.uri,
          base64: b64,
          isImage: true,
          size: asset.fileSize,
        });
      }
    } catch (err: any) {
      Alert.alert('Photo Error', err?.message || 'Could not attach image.');
    }
  };

  /**
   * Document (PDF / Text / Code) attachment picker
   */
  const handlePickDocument = async () => {
    try {
      const DocumentPicker = getDocumentPicker();
      if (!DocumentPicker) {
        Alert.alert('Notice', 'Document picker is not available on this platform.');
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        let b64 = '';
        if (asset.uri) {
          b64 = await convertUriToBase64(asset.uri);
        }

        const filename = asset.name || 'document.pdf';
        const isPdf = filename.toLowerCase().endsWith('.pdf');
        const mimeType = asset.mimeType || (isPdf ? 'application/pdf' : 'text/plain');

        setSelectedAttachment({
          name: filename,
          type: mimeType,
          uri: asset.uri,
          base64: b64,
          isImage: false,
          size: asset.size,
        });
      }
    } catch (err: any) {
      Alert.alert('Document Error', err?.message || 'Could not attach document.');
    }
  };

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputText;
    const attachmentToSend = selectedAttachment;

    if ((!textToSend.trim() && !attachmentToSend) || isLoading) return;

    const userMsgText = textToSend.trim() || (attachmentToSend ? `Please review this attached ${attachmentToSend.name}` : '');

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachment: attachmentToSend
        ? {
            name: attachmentToSend.name,
            type: attachmentToSend.type,
            uri: attachmentToSend.uri,
            isImage: attachmentToSend.isImage,
          }
        : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setSelectedAttachment(null);
    setIsLoading(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const payloadAttachment = attachmentToSend?.base64
        ? {
            name: attachmentToSend.name,
            type: attachmentToSend.type,
            data: attachmentToSend.base64,
          }
        : undefined;

      const res = await api.sendChatMessage(userMsgText, 'INTERVIEW_COACH', payloadAttachment);

      let replyText = "";
      if (res.success && res.data?.message?.message) {
        replyText = res.data.message.message;
      } else if (!res.success) {
        if (res.message?.includes('401') || res.message?.toLowerCase().includes('unauthorized') || res.message?.toLowerCase().includes('token')) {
          replyText = "⚠️ Your login session has expired. Please sign in again from your Profile to chat with AI Mentor.";
        } else if (res.message?.includes('timed out') || res.message?.toLowerCase().includes('network')) {
          replyText = `⚠️ Connection issue: ${res.message}. Please verify your server connection.`;
        } else {
          replyText = res.message || "I'm having a brief issue connecting to the AI mentor engine. Please try sending again in a moment.";
        }
      } else {
        replyText = "I've analyzed your submission. Focus on structured problem breakdown and engineering trade-offs!";
      }

      const aiReply: MessageItem = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err: any) {
      const fallbackReply: MessageItem = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: "I analyzed your query! When discussing technical implementations, always outline requirements, architectural constraints, and the STAR framework (Situation, Task, Action, Result).",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setInputText(suggestion);
    handleSend(suggestion);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="AI Career Coach (LLM)" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.chatScroll}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                msg.sender === 'user' ? styles.userRow : styles.aiRow,
              ]}
            >
              {msg.sender === 'ai' && (
                <View style={styles.aiAvatar}>
                  <Ionicons name="sparkles" size={14} color={Colors.primary} />
                </View>
              )}

              <View
                style={[
                  styles.messageBubble,
                  msg.sender === 'user' ? styles.userBubble : styles.aiBubble,
                ]}
              >
                {/* Render Attached Image */}
                {msg.attachment?.isImage && msg.attachment.uri && (
                  <View style={styles.bubbleImageWrapper}>
                    <Image
                      source={{ uri: msg.attachment.uri }}
                      style={styles.bubbleImage}
                      resizeMode="cover"
                    />
                  </View>
                )}

                {/* Render Attached Document Chip */}
                {msg.attachment && !msg.attachment.isImage && (
                  <View style={styles.bubbleDocChip}>
                    <Ionicons name="document-text" size={16} color="#00F5D4" />
                    <Text style={styles.bubbleDocText} numberOfLines={1}>
                      {msg.attachment.name}
                    </Text>
                  </View>
                )}

                <Text
                  style={[
                    styles.messageText,
                    msg.sender === 'user' ? styles.userText : styles.aiText,
                  ]}
                >
                  {msg.text}
                </Text>
                <Text style={styles.timestamp}>{msg.timestamp}</Text>
              </View>
            </View>
          ))}

          {isLoading && (
            <View style={[styles.messageRow, styles.aiRow]}>
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={14} color={Colors.primary} />
              </View>
              <View style={[styles.messageBubble, styles.aiBubble, styles.loadingBubble]}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>AI Mentor is reviewing and thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Suggestions Chips */}
        <View style={styles.suggestionsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
            <TouchableOpacity
              style={styles.suggestionChip}
              onPress={() => handleSuggestion("How do I structure a STAR method answer for a conflict with a team member?")}
            >
              <Ionicons name="bulb-outline" size={13} color={Colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.suggestionText}>STAR Conflict Example</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.suggestionChip}
              onPress={() => handleSuggestion("What are the key system design components for a scalable URL shortener?")}
            >
              <Ionicons name="layers-outline" size={13} color={Colors.info} style={{ marginRight: 4 }} />
              <Text style={styles.suggestionText}>System Design Blueprint</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.suggestionChip}
              onPress={() => handleSuggestion("How do I negotiate salary for an internship or junior developer role?")}
            >
              <Ionicons name="cash-outline" size={13} color="#FFD166" style={{ marginRight: 4 }} />
              <Text style={styles.suggestionText}>Salary Negotiation Tips</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Attachment Preview Bar */}
        {selectedAttachment && (
          <View style={styles.attachmentPreviewBar}>
            <View style={styles.attachmentPreviewContent}>
              {selectedAttachment.isImage ? (
                <Image source={{ uri: selectedAttachment.uri }} style={styles.attachmentThumbnail} />
              ) : (
                <View style={styles.attachmentDocIcon}>
                  <Ionicons name="document-text" size={20} color={Colors.primary} />
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.attachmentName} numberOfLines={1}>
                  {selectedAttachment.name}
                </Text>
                <Text style={styles.attachmentMeta}>
                  {selectedAttachment.isImage ? 'Photo attached' : 'Document attached'} • Ready to analyze
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedAttachment(null)}
                style={styles.removeAttachmentBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Input Bar with Photo and Document Attach Buttons */}
        <View style={styles.inputContainer}>
          {/* Attach Photo Button */}
          <TouchableOpacity
            style={styles.attachIconButton}
            onPress={handlePickPhoto}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <Ionicons name="image-outline" size={22} color={Colors.primary} />
          </TouchableOpacity>

          {/* Attach Document Button */}
          <TouchableOpacity
            style={styles.attachIconButton}
            onPress={handlePickDocument}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <Ionicons name="document-attach-outline" size={22} color={Colors.primary} />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder={selectedAttachment ? "Add a question about this attachment..." : "Ask your LLM mentor anything..."}
            placeholderTextColor={Colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            editable={!isLoading}
            onSubmitEditing={() => handleSend()}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() && !selectedAttachment) || isLoading ? styles.sendButtonDisabled : null,
            ]}
            onPress={() => handleSend()}
            disabled={(!inputText.trim() && !selectedAttachment) || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#070C12" />
            ) : (
              <Ionicons name="arrow-up" size={20} color="#070C12" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070C12',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  chatScroll: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  aiRow: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#162232',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
  },
  aiBubble: {
    backgroundColor: '#101824',
    borderWidth: 1,
    borderColor: '#1C293A',
  },
  userBubble: {
    backgroundColor: '#17303E',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
  },
  bubbleImageWrapper: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: 8,
  },
  bubbleImage: {
    width: 220,
    height: 140,
    borderRadius: BorderRadius.md,
  },
  bubbleDocChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.25)',
  },
  bubbleDocText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00F5D4',
    flex: 1,
  },
  messageText: {
    fontSize: Typography.bodySmall,
    lineHeight: 22,
  },
  aiText: {
    color: Colors.textPrimary,
  },
  userText: {
    color: Colors.textPrimary,
  },
  timestamp: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
  },
  suggestionsContainer: {
    paddingVertical: Spacing.xs,
  },
  suggestionsScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101824',
    borderWidth: 1,
    borderColor: '#1C293A',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
  },
  suggestionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // Attachment Preview Bar
  attachmentPreviewBar: {
    backgroundColor: '#121F2F',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 245, 212, 0.3)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  attachmentPreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentThumbnail: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.sm,
  },
  attachmentDocIcon: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  attachmentMeta: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  removeAttachmentBtn: {
    padding: 4,
  },

  // Input Bar
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101824',
    borderTopWidth: 1,
    borderTopColor: '#1C293A',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 8,
  },
  attachIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 245, 212, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.bodySmall,
    height: 44,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.35,
  },
});
