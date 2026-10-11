import React, { useState } from 'react';
import { Text, View } from 'react-native';
import Screen from '../components/Screen';
import Button from '../components/Button';
import { Segmented } from '../components/Controls';
import { useI18n } from '../context/I18nContext';
import { useStyles, useTheme } from '../theme';
import { formatMoney, planPrice } from '../shared/format';

const PLANS = [1, 2, 3];

export default function PricingScreen({ navigation }) {
  const { t, L } = useI18n();
  const c = useTheme();
  const s = useStyles();
  const [yearly, setYearly] = useState(false);

  return (
    <Screen>
      <Text accessibilityRole="header" style={s.h1}>{t('pr_title')}</Text>
      <Text style={[s.p, { marginVertical: 12 }]}>{t('pr_sub')}</Text>
      <Segmented
        value={yearly ? 'y' : 'm'}
        onChange={(k) => setYearly(k === 'y')}
        options={[{ key: 'm', label: t('pr_monthly') }, { key: 'y', label: t('pr_yearly') }]}
      />
      <View style={{ marginTop: 22, gap: 16 }}>
        {PLANS.map((n, p) => {
          const pick = p === 1;
          return (
            <View key={n} style={[s.card, { padding: 22, borderWidth: pick ? 2 : 1, borderColor: pick ? c.ink : c.line }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[s.h3, { fontSize: 20 }]}>{t('pl' + n)}</Text>
                {pick ? (
                  <View style={{ backgroundColor: c.accent, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
                    <Text style={{ color: c.onAccent, fontSize: 12, fontWeight: '600' }}>{t('pl_pick')}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={{ fontSize: 32, fontWeight: '800', color: c.ink, marginTop: 10 }}>
                {formatMoney(L, planPrice(L, p, yearly))}
                <Text style={{ fontSize: 14, fontWeight: '500', color: c.muted }}> {t('pr_per')}</Text>
              </Text>
              <View style={{ marginVertical: 16, gap: 8 }}>
                {[1, 2, 3].map((k) => (
                  <Text key={k} style={s.body}>✓  {t('pl' + n + '_' + k)}</Text>
                ))}
              </View>
              <Button
                variant={pick ? 'primary' : 'ghost'}
                title={p === 0 ? t('pl_c1') : t('pl_c')}
                onPress={() => navigation.navigate('Account')}
              />
            </View>
          );
        })}
      </View>
    </Screen>
  );
}
