import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Screen from '../components/Screen';
import Button from '../components/Button';
import Wave from '../components/Wave';
import { useI18n } from '../context/I18nContext';
import { useStyles, useTheme } from '../theme';
import { CUES } from '../shared/i18n';

const TRACKS = [
  ['vi', 'VI', 0],
  ['en', 'EN', 1],
  ['zh', '中文', 2],
];
const FEATURES = ['fa', 'fb', 'fc', 'fd', 'fe', 'ff'];
const STEPS = ['s1', 's2', 's3', 's4'];
const BANDS = [
  ['vi', 'Tiếng Việt', 'l_vi_d'],
  ['en', 'English', 'l_en_d'],
  ['zh', '中文', 'l_zh_d'],
];

export default function HomeScreen({ navigation }) {
  const { t } = useI18n();
  const c = useTheme();
  const s = useStyles();
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % CUES.length), 4200);
    return () => clearInterval(id);
  }, [i]);

  return (
    <Screen>
      <Text accessibilityRole="header" style={[s.h1, { fontSize: 38, lineHeight: 44 }]}>{t('h_title')}</Text>
      <Text style={[s.p, { marginTop: 14, fontSize: 16.5 }]}>{t('h_sub')}</Text>
      <View style={{ marginTop: 22 }}>
        <Button title={t('h_cta1')} onPress={() => navigation.navigate('Demo')} />
      </View>

      <View style={[s.card, { marginTop: 28, paddingTop: 6 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.line }}>
          <Text style={{ fontWeight: '600', color: c.ink }}>{t('rec_name')}</Text>
          <Text style={{ color: c.muted }}>{t('step')} {i + 1}/{CUES.length}</Text>
        </View>
        {TRACKS.map(([lang, tag, seed]) => (
          <View key={lang} style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.line }}>
            <Text style={{ fontWeight: '700', fontSize: 12.5, color: c[lang], marginBottom: 4 }}>{tag}</Text>
            <Text style={{ color: c.ink, fontSize: 15.5, lineHeight: 22, minHeight: 66 }}>{CUES[i][lang]}</Text>
            <Wave color={c[lang]} seed={seed} />
          </View>
        ))}
        <View style={{ flexDirection: 'row', gap: 8, paddingTop: 14, paddingBottom: 8 }}>
          {CUES.map((_, n) => (
            <View key={n} accessibilityLabel={t('step') + ' ' + (n + 1)} style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: n === i ? c.ink : c.line }} />
          ))}
        </View>
      </View>

      <View style={s.section}>
        <Text accessibilityRole="header" style={s.h2}>{t('ft_title')}</Text>
        {FEATURES.map((k) => (
          <View key={k} style={s.row}>
            <Text style={s.h3}>{t(k + '_t')}</Text>
            <Text style={s.p}>{t(k + '_d')}</Text>
          </View>
        ))}
      </View>

      <View style={s.section}>
        <Text accessibilityRole="header" style={s.h2}>{t('how_title')}</Text>
        {STEPS.map((k, n) => (
          <View key={k} style={[s.row, { flexDirection: 'row', gap: 16 }]}>
            <Text style={{ fontSize: 32, fontWeight: '800', color: c.muted, width: 30 }}>{n + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.h3}>{t(k + 't')}</Text>
              <Text style={s.p}>{t(k + 'd')}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={s.section}>
        <Text accessibilityRole="header" style={s.h2}>{t('langs_title')}</Text>
        {BANDS.map(([lang, name, key]) => (
          <View key={lang} style={{ borderLeftWidth: 5, borderLeftColor: c[lang], paddingLeft: 16, paddingVertical: 10, marginBottom: 12 }}>
            <Text style={{ fontSize: 26, fontWeight: '800', color: c[lang], marginBottom: 4 }}>{name}</Text>
            <Text style={s.p}>{t(key)}</Text>
          </View>
        ))}
      </View>

      <View style={[s.section, s.card]}>
        <Text style={s.h2}>{t('cta_title')}</Text>
        <Text style={[s.p, { marginBottom: 18 }]}>{t('cta_sub')}</Text>
        <Button title={t('cta_btn')} onPress={() => navigation.navigate('Account')} />
      </View>
    </Screen>
  );
}
