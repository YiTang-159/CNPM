import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../theme';
import { LANGS } from '../shared/i18n';

const LABEL = { vi: 'VI', en: 'EN', zh: '中文' };

function LangSwitch() {
  const { L, setL, t } = useI18n();
  const c = useTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={t('langlabel')}
      style={{ flexDirection: 'row', borderWidth: 1, borderColor: c.line, borderRadius: 10, overflow: 'hidden', backgroundColor: c.panel }}
    >
      {LANGS.map((code, n) => (
        <Pressable
          key={code}
          accessibilityRole="radio"
          accessibilityState={{ selected: n === L }}
          onPress={() => setL(n)}
          style={{ minHeight: 38, minWidth: 42, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, backgroundColor: n === L ? c.accent : 'transparent' }}
        >
          <Text style={{ color: n === L ? c.onAccent : c.muted, fontWeight: '700', fontSize: 12.5 }}>{LABEL[code]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Khung chung cho mọi màn hình: thanh đầu (logo + đổi ngôn ngữ) và vùng cuộn. */
export default function Screen({ children }) {
  const c = useTheme();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style={c.dark ? 'light' : 'dark'} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.line }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ gap: 3, width: 24 }}>
            <View style={{ height: 5, borderRadius: 3, width: '100%', backgroundColor: c.vi }} />
            <View style={{ height: 5, borderRadius: 3, width: '72%', backgroundColor: c.en }} />
            <View style={{ height: 5, borderRadius: 3, width: '88%', backgroundColor: c.zh }} />
          </View>
          <Text accessibilityRole="header" style={{ fontSize: 21, fontWeight: '800', color: c.ink }}>Dubchef</Text>
        </View>
        <LangSwitch />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
