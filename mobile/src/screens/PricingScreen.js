import React, { useState } from 'react';
import { Text, View } from 'react-native';
import Screen from '../components/Screen';
import Button from '../components/Button';
import Field from '../components/Field';
import { Segmented } from '../components/Controls';
import { useI18n } from '../context/I18nContext';
import { useStyles, useTheme } from '../theme';
import { formatMoney, planPrice } from '../shared/format';
import { calcPrice, checkCounts, parseCount, SAMPLE_PACKS, unitPrice } from '../shared/pricing';

const PLANS = [1, 2, 3];

export default function PricingScreen({ navigation }) {
  const { t, L } = useI18n();
  const c = useTheme();
  const s = useStyles();
  const [yearly, setYearly] = useState(false);
  const [uploads, setUploads] = useState('3');
  const [outs, setOuts] = useState('3');
  const [pickedPack, setPickedPack] = useState(null);

  const u = parseCount(uploads);
  const o = parseCount(outs);
  const err = checkCounts(u, o);
  const price = err ? null : calcPrice(L, u, o);
  // Lỗi "nhập sai số" gắn vào ô bị sai; lỗi "dịch ra quá nhiều" gắn vào ô số video dịch ra.
  const upErr = u === null ? 'pc_bad' : null;
  const outErr = o === null ? 'pc_bad' : err === 'pc_over' ? 'pc_over' : null;

  const changeUploads = (v) => { setUploads(v); setPickedPack(null); };
  const changeOuts = (v) => { setOuts(v); setPickedPack(null); };
  const applyPack = (pack) => {
    setUploads(String(pack.uploads));
    setOuts(String(pack.outs));
    setPickedPack(pack.id);
  };

  return (
    <Screen>
      <Text accessibilityRole="header" style={s.h1}>{t('pr_title')}</Text>
      <Text style={[s.p, { marginVertical: 12 }]}>{t('pr_sub')}</Text>

      <View style={s.section}>
        <Text accessibilityRole="header" style={s.h2}>{t('pc_title')}</Text>
        <Field
          label={t('pc_up')}
          value={uploads}
          onChangeText={changeUploads}
          error={upErr && t(upErr)}
          keyboardType="number-pad"
        />
        <Field
          label={t('pc_out')}
          value={outs}
          onChangeText={changeOuts}
          error={outErr && t(outErr)}
          keyboardType="number-pad"
        />
        <Text style={[s.p, { fontSize: 13.5, marginBottom: 16 }]}>{t('pc_hint')}</Text>
        {price ? (
          <View style={[s.card, { padding: 20 }]}>
            <Text style={s.body}>
              {t('pc_row_up')}: {u} × {formatMoney(L, unitPrice(L, 0))} = {formatMoney(L, price.up)}
            </Text>
            <Text style={[s.body, { marginTop: 6 }]}>
              {t('pc_row_out')}: {o} × {formatMoney(L, unitPrice(L, 1))} = {formatMoney(L, price.out)}
            </Text>
            <Text style={[s.p, { marginTop: 14 }]}>{t('pc_total')}</Text>
            <Text testID="pc-total" accessibilityLiveRegion="polite" style={{ fontSize: 32, fontWeight: '800', color: c.ink }}>
              {formatMoney(L, price.total)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={s.section}>
        <Text accessibilityRole="header" style={s.h2}>{t('pk_title')}</Text>
        <Text style={[s.p, { marginBottom: 16 }]}>{t('pk_sub')}</Text>
        <View style={{ gap: 16 }}>
          {SAMPLE_PACKS.map((pack) => (
            <View key={pack.id} style={[s.card, { padding: 20 }]}>
              <Text accessibilityRole="header" style={[s.h3, { fontSize: 19 }]}>{t('pk' + pack.id + '_n')}</Text>
              <Text style={s.p}>{t('pk' + pack.id + '_d')}</Text>
              <View style={{ marginVertical: 12, gap: 6 }}>
                <Text style={s.body}>✓  {pack.uploads} {t('pk_vid')}</Text>
                <Text style={s.body}>✓  {pack.outs} {t('pk_out')}</Text>
              </View>
              <Text testID={'pk-price-' + pack.id} style={{ fontSize: 28, fontWeight: '800', color: c.ink, marginBottom: 14 }}>
                {formatMoney(L, calcPrice(L, pack.uploads, pack.outs).total)}
              </Text>
              <Button variant="ghost" title={t('pk_use')} onPress={() => applyPack(pack)} />
              {pickedPack === pack.id ? (
                <Text accessibilityLiveRegion="polite" style={[s.note, { marginTop: 10 }]}>{t('pk_filled')}</Text>
              ) : null}
            </View>
          ))}
        </View>
      </View>

      <View style={s.section}>
        <Text accessibilityRole="header" style={s.h2}>{t('pl_title')}</Text>
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
      </View>
    </Screen>
  );
}
