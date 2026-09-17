/**
 * AI Mentor - Real-Time LLM Career Coach & Interview Assistant
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { Header } from '../../src/components/Header';
import { api } from '../../src/services/api';

interface MessageItem {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

const DEFAULT_GREETING: MessageItem = {
  id: 'init-1',
  sender: 'ai',
  text: "Hello! I am your AI Technical Interview & Career Coach. Ask me anything about system design, coding problem strategies, STAR behavioral answers, or salary negotiation tactics!",
  timestamp: 'Just now',
};

export default function AIChatScreen() {
  const [messages, setMessages] = useState<MessageItem[]>([DEFAULT_GREETING]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Call LLM through backend / ML microservice
      const res = await api.sendChatMessage(textToSend.trim(), 'INTERVIEW_COACH');

      let replyText = "I've analyzed your question. Focus on structured problem decomposition and quantifying your engineering results!";
      if (res.success && res.data?.message?.message) {
        replyText = res.data.message.message;
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
        text: "Great point! When answering in interviews, always structure your answer with the STAR framework (Situation, Task, Action, Result).",
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
                <Text style={styles.loadingText}>AI Mentor is thinking...</Text>
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

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask your LLM mentor anything..."
            placeholderTextColor={Colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            editable={!isLoading}
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101824',
    borderTopWidth: 1,
    borderTopColor: '#1C293A',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
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
    opacity: 0.4,
  },
});
