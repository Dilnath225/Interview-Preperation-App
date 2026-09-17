/**
 * AI Mentor - Coding Challenge Screen (Functionalized with Backend API)
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../src/constants/theme';
import { Header } from '../src/components/Header';
import { api } from '../src/services/api';

export default function CodingChallengeScreen() {
  const router = useRouter();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [code, setCode] = useState('');
  const [outputMessage, setOutputMessage] = useState<string | null>(null);
  const [outputStatus, setOutputStatus] = useState<'success' | 'error' | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showList, setShowList] = useState(true);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const res = await api.getCodingChallenges();
      if (res.success && res.data?.challenges) {
        setChallenges(res.data.challenges);
      }
    } catch (err) {
      console.warn('Load challenges error:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectChallenge = async (slug: string) => {
    try {
      const res = await api.getChallengeBySlug(slug);
      if (res.success && res.data) {
        setSelected(res.data);
        setCode(res.data.starterCode || '');
        setOutputMessage(null);
        setOutputStatus(null);
        setShowList(false);
      }
    } catch (err) {
      console.warn('Get challenge error:', err);
    }
  };

  const handleRunCode = () => {
    if (!code.trim()) {
      Alert.alert('Empty Code', 'Please write your solution before running.');
      return;
    }
    setOutputMessage('⏳ Running test cases...');
    setOutputStatus(null);
    setTimeout(() => {
      setOutputMessage('✓ Sample test cases passed (local simulation)');
      setOutputStatus('success');
    }, 600);
  };

  const handleSubmit = async () => {
    if (!selected || !code.trim()) {
      Alert.alert('Empty Code', 'Write your solution before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitCode(selected.id, code);
      if (res.success && res.data) {
        const { status, score, output } = res.data;
        setOutputMessage(output);
        setOutputStatus(status === 'ACCEPTED' ? 'success' : 'error');

        if (status === 'ACCEPTED') {
          Alert.alert('🎉 Accepted!', `Score: ${score}/100\n${output}`, [
            { text: 'Next Challenge', onPress: () => setShowList(true) },
            { text: 'Stay', style: 'cancel' },
          ]);
        }
      }
    } catch (err) {
      console.warn('Submit code error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getDifficultyColor = (d: string) => {
    if (d === 'Easy') return Colors.success;
    if (d === 'Medium') return Colors.warning;
    return Colors.error;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ color: Colors.textSecondary, marginTop: 12 }}>Loading challenges...</Text>
      </SafeAreaView>
    );
  }

  // Show challenge list
  if (showList) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Coding Challenges" showBack />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.listTitle}>Choose a Challenge</Text>
          {challenges.map((ch) => (
            <TouchableOpacity
              key={ch.id}
              style={styles.challengeCard}
              onPress={() => selectChallenge(ch.slug)}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.challengeTitle}>{ch.title}</Text>
                <Text style={styles.challengeMeta}>{ch.category} • {ch.acceptanceRate}</Text>
              </View>
              <View style={[styles.diffBadge, { backgroundColor: `${getDifficultyColor(ch.difficulty)}20` }]}>
                <Text style={[styles.diffText, { color: getDifficultyColor(ch.difficulty) }]}>{ch.difficulty}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Show selected challenge editor
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Coding Challenge" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Challenge Meta Bar */}
        <View style={styles.metaRow}>
          <View style={[styles.difficultyBadge, { backgroundColor: `${getDifficultyColor(selected?.difficulty)}20` }]}>
            <Text style={[styles.difficultyText, { color: getDifficultyColor(selected?.difficulty) }]}>
              {selected?.difficulty || 'Medium'}
            </Text>
          </View>

          <TouchableOpacity style={styles.backToListBtn} onPress={() => setShowList(true)}>
            <Ionicons name="list-outline" size={14} color={Colors.primary} />
            <Text style={styles.backToListText}>All Problems</Text>
          </TouchableOpacity>
        </View>

        {/* Problem Title & Description */}
        <Text style={styles.problemTitle}>{selected?.title}</Text>
        <Text style={styles.problemDescription}>{selected?.description}</Text>

        {/* Code Editor */}
        <View style={styles.editorWindow}>
          <View style={styles.editorTopBar}>
            <View style={styles.windowControls}>
              <View style={[styles.controlDot, { backgroundColor: '#FF5F56' }]} />
              <View style={[styles.controlDot, { backgroundColor: '#FFBD2E' }]} />
              <View style={[styles.controlDot, { backgroundColor: '#27C93F' }]} />
            </View>
            <View style={styles.fileTab}>
              <Text style={styles.fileName}>solution.ts</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <TextInput
            style={styles.codeText}
            multiline
            value={code}
            onChangeText={setCode}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
          />
        </View>

        {/* Execution Output */}
        {outputMessage && (
          <View style={[styles.outputBox, outputStatus === 'error' && styles.outputError]}>
            <Text style={[styles.outputText, outputStatus === 'error' && { color: Colors.error }]}>
              {outputMessage}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.runButton} onPress={handleRunCode} activeOpacity={0.8}>
            <Ionicons name="play" size={16} color={Colors.textPrimary} />
            <Text style={styles.runButtonText}>Run Code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={Colors.background} />
            ) : (
              <Text style={styles.submitButtonText}>Submit</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070C12' },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  listTitle: { fontSize: Typography.h3, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.lg },
  challengeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#101824', borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: '#1C293A', marginBottom: Spacing.md },
  challengeTitle: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.textPrimary },
  challengeMeta: { fontSize: Typography.caption, color: Colors.textMuted, marginTop: 2 },
  diffBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: BorderRadius.sm },
  diffText: { fontSize: 11, fontWeight: Typography.bold },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  difficultyBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: BorderRadius.sm },
  difficultyText: { fontSize: Typography.caption, fontWeight: Typography.bold },
  backToListBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backToListText: { fontSize: Typography.caption, color: Colors.primary, fontWeight: Typography.semiBold },
  problemTitle: { fontSize: Typography.h3, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  problemDescription: { fontSize: Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.xl },
  editorWindow: { backgroundColor: '#0C131D', borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: '#1C2A3D', overflow: 'hidden', marginBottom: Spacing.lg },
  editorTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0E1724', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: '#1C2A3D' },
  windowControls: { flexDirection: 'row', gap: 6 },
  controlDot: { width: 10, height: 10, borderRadius: 5 },
  fileTab: { backgroundColor: '#0C131D', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 4, borderTopWidth: 2, borderTopColor: Colors.primary },
  fileName: { fontSize: Typography.caption, fontWeight: Typography.semiBold, color: Colors.primary },
  codeText: { color: '#33F7DD', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 13, lineHeight: 20, padding: Spacing.md, minHeight: 220 },
  outputBox: { backgroundColor: 'rgba(0, 230, 118, 0.1)', borderWidth: 1, borderColor: 'rgba(0, 230, 118, 0.3)', borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.lg },
  outputError: { backgroundColor: 'rgba(255, 82, 82, 0.1)', borderColor: 'rgba(255, 82, 82, 0.3)' },
  outputText: { color: '#00E676', fontSize: Typography.bodySmall, fontWeight: Typography.semiBold },
  actionButtonsRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm, marginBottom: Spacing.xxxl },
  runButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#101824', borderWidth: 1, borderColor: '#1C293A', borderRadius: BorderRadius.xl, paddingVertical: Spacing.lg, gap: Spacing.xs },
  runButtonText: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Colors.textPrimary },
  submitButton: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, paddingVertical: Spacing.lg },
  submitButtonText: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.background },
});
