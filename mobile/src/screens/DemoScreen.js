import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Speech from 'expo-speech';
import * as DocumentPicker from 'expo-document-picker';
import Screen from '../components/Screen';
import Button from '../components/Button';
import Scene from '../components/Scenes';
import { Chip } from '../components/Controls';
import { useI18n } from '../context/I18nContext';
import { useStyles, useTheme } from '../theme';
import { CUES } from '../shared/i18n';

const STAGES = ['s2t', 's3t', 'p3', 's4t'];
const LANGCODE = { vi: 'vi-VN', en: 'en-US', zh: 'zh-CN' };
const TAG = { vi: 'VI', en: 'EN', zh: '中文' };
const SPEEDS = [0.8, 1, 1.25];

export default function DemoScreen() {
  const { t, lang } = useI18n();
  const c = useTheme();
  const s = useStyles();

  const [file, setFile] = useState('');
  const [needFile, setNeedFile] = useState(false);
  const [showPipe, setShowPipe] = useState(false);
  const [stages, setStages] = useState(STAGES.map(() => 'wait'));
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const pipeTimer = useRef(null);

  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [voice, setVoice] = useState(lang);
  const [subs, setSubs] = useState({ [lang]: true });
  const [speed, setSpeed] = useState(1);
  const [voices, setVoices] = useState([]);

  // Danh sách giọng đọc có trên điện thoại (để cảnh báo nếu thiếu ngôn ngữ)
  useEffect(() => {
    Speech.getAvailableVoicesAsync().then(setVoices).catch(() => {});
    return () => {
      clearTimeout(pipeTimer.current);
      Speech.stop();
    };
  }, []);

  const voiceMissing =
    voice !== 'off' &&
    voices.length > 0 &&
    !voices.some((v) => String(v.language).toLowerCase().replace('_', '-').startsWith(voice));

  // Phát từng bước: đọc xong VÀ đủ thời gian tối thiểu mới sang bước tiếp
  useEffect(() => {
    if (!playing) return undefined;
    let alive = true;
    let speechDone = true;
    let timeDone = false;
    const timers = [];

    const advance = () => {
      if (!alive || !speechDone || !timeDone) return;
      if (i + 1 < CUES.length) setI(i + 1);
      else {
        setPlaying(false);
        setFinished(true);
      }
    };

    timers.push(setTimeout(() => { timeDone = true; advance(); }, 3600 / speed));

    if (voice !== 'off' && !voiceMissing) {
      speechDone = false;
      Speech.stop();
      const end = () => { speechDone = true; advance(); };
      Speech.speak(CUES[i][voice], { language: LANGCODE[voice], rate: speed, onDone: end, onStopped: end, onError: end });
      timers.push(setTimeout(end, 16000));
    }

    return () => {
      alive = false;
      timers.forEach(clearTimeout);
      Speech.stop();
    };
  }, [playing, i, voice, speed, voiceMissing]);

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (finished) {
      setI(0);
      setFinished(false);
    }
    setPlaying(true);
  };
  const jump = (n) => {
    setI(n);
    setFinished(false);
  };
  const toggleSub = (l) => setSubs((prev) => {
    const next = { ...prev };
    if (next[l]) delete next[l]; else next[l] = true;
    return next;
  });

  const pick = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'video/*', copyToCacheDirectory: false });
      if (!res.canceled && res.assets && res.assets[0]) {
        setFile(res.assets[0].name);
        setNeedFile(false);
      }
    } catch (e) { /* người dùng hủy */ }
  };

  const start = () => {
    if (running) return;
    if (!file) {
      setNeedFile(true);
      return;
    }
    setNeedFile(false);
    setDone(false);
    setShowPipe(true);
    setRunning(true);
    setStages(STAGES.map(() => 'wait'));
    let k = 0;
    const step = () => {
      if (k >= STAGES.length) {
        setRunning(false);
        setDone(true);
        return;
      }
      const cur = k;
      setStages((prev) => prev.map((v, n) => (n === cur ? 'run' : v)));
      pipeTimer.current = setTimeout(() => {
        setStages((prev) => prev.map((v, n) => (n === cur ? 'done' : v)));
        k += 1;
        step();
      }, 1150);
    };
    step();
  };

  const shown = ['vi', 'en', 'zh'].filter((l) => subs[l]);

  return (
    <Screen>
      <Text accessibilityRole="header" style={s.h1}>{t('d_title')}</Text>
      <Text style={[s.p, { marginVertical: 12 }]}>{t('d_sub_m')}</Text>

      <Pressable
        accessibilityRole="button"
        onPress={pick}
        style={{ minHeight: 120, borderWidth: 2, borderStyle: 'dashed', borderColor: c.line, borderRadius: 16, backgroundColor: c.panel, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 6 }}
      >
        <Text style={{ fontWeight: '600', color: c.ink, textAlign: 'center' }}>{t('m_pick')}</Text>
        {file ? <Text style={{ color: c.muted, fontSize: 13 }}>{t('d_chosen') + file}</Text> : null}
      </Pressable>
      {needFile ? <Text accessibilityLiveRegion="polite" style={s.err}>{t('d_need')}</Text> : null}
      <Button title={t('d_start')} onPress={start} disabled={running} style={{ marginTop: 14 }} />

      {showPipe ? (
        <View style={{ marginTop: 20, gap: 10 }}>
          {STAGES.map((key, n) => (
            <View key={key} style={[s.card, { padding: 14, flexDirection: 'row', justifyContent: 'space-between' }]}>
              <Text style={s.body}>{t(key)}</Text>
              <Text style={{ color: stages[n] === 'done' ? c.en : c.muted, fontWeight: stages[n] === 'done' ? '600' : '400', fontSize: 13.5 }}>{t('st_' + stages[n])}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {done ? <Text accessibilityLiveRegion="polite" style={[s.ok, { marginTop: 16, color: c.ink }]}>{t('d_done')}</Text> : null}

      <Text style={[s.h3, { marginTop: 30, marginBottom: 10 }]}>{t('d_sample') + t('rec_name')}</Text>
      <View style={{ aspectRatio: 16 / 9, borderRadius: 16, overflow: 'hidden', backgroundColor: c.scBg, borderWidth: 1, borderColor: c.line }}>
        <Scene index={i} />
        {shown.length > 0 ? (
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 10, gap: 4, backgroundColor: 'rgba(10,28,24,0.88)' }}>
            {shown.map((l) => (
              <View key={l} style={{ flexDirection: 'row', gap: 8 }}>
                <Text style={{ width: 28, fontSize: 11, fontWeight: '700', color: l === 'vi' ? '#FF9C8C' : l === 'en' ? '#9DB6FF' : '#F2CB6B' }}>{TAG[l]}</Text>
                <Text style={{ flex: 1, color: '#fff', fontSize: 12.5, lineHeight: 17 }}>{CUES[i][l]}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', gap: 6, marginTop: 14 }}>
        {CUES.map((_, n) => (
          <Pressable
            key={n}
            accessibilityRole="button"
            accessibilityLabel={t('step') + ' ' + (n + 1)}
            onPress={() => jump(n)}
            hitSlop={{ top: 12, bottom: 12 }}
            style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: n === i ? c.ink : c.line }}
          />
        ))}
      </View>

      <Button title={playing ? t('d_pause') : finished ? t('d_replay') : t('d_play')} onPress={togglePlay} style={{ marginTop: 16 }} />

      <Text style={[s.label, { marginTop: 18 }]}>{t('d_voice')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Chip label="Tiếng Việt" selected={voice === 'vi'} onPress={() => setVoice('vi')} />
        <Chip label="English" selected={voice === 'en'} onPress={() => setVoice('en')} />
        <Chip label="中文" selected={voice === 'zh'} onPress={() => setVoice('zh')} />
        <Chip label={t('d_off')} selected={voice === 'off'} onPress={() => setVoice('off')} />
      </View>

      <Text style={[s.label, { marginTop: 16 }]}>{t('d_subs')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {['vi', 'en', 'zh'].map((l) => (
          <Chip key={l} label={TAG[l]} selected={!!subs[l]} onPress={() => toggleSub(l)} />
        ))}
      </View>

      <Text style={[s.label, { marginTop: 16 }]}>{t('d_speed')}</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {SPEEDS.map((v) => (
          <Chip key={v} label={v + '×'} selected={speed === v} onPress={() => setSpeed(v)} />
        ))}
      </View>

      {voiceMissing ? <Text style={s.note}>{t('d_nospeech')}</Text> : null}

      <Text style={[s.h3, { marginTop: 28, marginBottom: 10 }]}>{t('d_steps')}</Text>
      <View style={{ gap: 8 }}>
        {CUES.map((cue, n) => (
          <Pressable
            key={n}
            accessibilityRole="button"
            onPress={() => jump(n)}
            style={{ backgroundColor: c.panel, borderWidth: 1, borderColor: n === i ? c.ink : c.line, borderLeftWidth: n === i ? 4 : 1, borderRadius: 10, padding: 12 }}
          >
            <Text style={[s.body, { fontSize: 14.5 }]}>{cue[lang]}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
