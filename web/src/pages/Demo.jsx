import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../context/I18nContext.jsx';
import { usePageTitle } from '../utils/usePageTitle.js';
import { CUES } from '../shared/i18n.js';
import Scene from '../components/Scenes.jsx';
import { LANGCODE, hasSpeech, reduceMotion, stopSpeech, voiceFor, voicesLoaded } from '../utils/speech.js';

const STAGES = ['s2t', 's3t', 'p3', 's4t'];
const LANG_TAG = { vi: 'VI', en: 'EN', zh: '中文' };

export default function Demo() {
  const { t, lang } = useI18n();
  usePageTitle('d_title');

  // --- tải video + quy trình mô phỏng ---
  const [file, setFile] = useState('');
  const [url, setUrl] = useState('');
  const [needInput, setNeedInput] = useState(false);
  const [over, setOver] = useState(false);
  const [showPipe, setShowPipe] = useState(false);
  const [stages, setStages] = useState(STAGES.map(() => 'wait'));
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const pipeTimer = useRef(null);
  const playerRef = useRef(null);

  // --- trình phát ---
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [voice, setVoice] = useState(lang);
  const [subs, setSubs] = useState({ [lang]: true });
  const [speed, setSpeed] = useState(1);
  const [, refreshVoices] = useState(0);

  // Danh sách giọng đọc của trình duyệt nạp chậm: vẽ lại khi có giọng mới
  useEffect(() => {
    if (!hasSpeech) return undefined;
    const bump = () => refreshVoices((n) => n + 1);
    window.speechSynthesis.addEventListener('voiceschanged', bump);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', bump);
  }, []);

  useEffect(() => () => {
    clearTimeout(pipeTimer.current);
    stopSpeech();
  }, []);

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

    const v = voice !== 'off' ? voiceFor(voice) : null;
    if (v) {
      speechDone = false;
      stopSpeech();
      const u = new window.SpeechSynthesisUtterance(CUES[i][voice]);
      u.lang = LANGCODE[voice];
      u.rate = speed;
      u.voice = v;
      const end = () => { speechDone = true; advance(); };
      u.onend = end;
      u.onerror = end;
      try { window.speechSynthesis.speak(u); } catch (e) { speechDone = true; }
      timers.push(setTimeout(end, 16000));
    }

    return () => {
      alive = false;
      timers.forEach(clearTimeout);
      stopSpeech();
    };
  }, [playing, i, voice, speed]);

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
  const toggleSub = (l) => setSubs((s) => {
    const next = { ...s };
    if (next[l]) delete next[l]; else next[l] = true;
    return next;
  });

  const pickFile = (f) => {
    if (!f) return;
    setFile(f.name);
    setNeedInput(false);
  };

  const start = () => {
    if (running) return;
    if (!file && !url.trim()) {
      setNeedInput(true);
      return;
    }
    setNeedInput(false);
    setDone(false);
    setShowPipe(true);
    setRunning(true);
    setStages(STAGES.map(() => 'wait'));
    let k = 0;
    const step = () => {
      if (k >= STAGES.length) {
        setRunning(false);
        setDone(true);
        if (playerRef.current) playerRef.current.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        return;
      }
      const cur = k;
      setStages((s) => s.map((v, n) => (n === cur ? 'run' : v)));
      pipeTimer.current = setTimeout(() => {
        setStages((s) => s.map((v, n) => (n === cur ? 'done' : v)));
        k += 1;
        step();
      }, reduceMotion ? 300 : 1150);
    };
    step();
  };

  const shownSubs = ['vi', 'en', 'zh'].filter((l) => subs[l]);
  const voiceMissing = voice !== 'off' && (!hasSpeech || (voicesLoaded() && !voiceFor(voice)));

  return (
    <>
      <div className="wrap page-head">
        <h1>{t('d_title')}</h1>
        <p>{t('d_sub')}</p>
      </div>
      <div className="wrap">
        <div className="up">
          <label
            className={'drop' + (over ? ' over' : '')}
            onDragEnter={(e) => { e.preventDefault(); setOver(true); }}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setOver(false); }}
            onDrop={(e) => { e.preventDefault(); setOver(false); pickFile(e.dataTransfer.files[0]); }}
          >
            <input type="file" accept="video/*" onChange={(e) => pickFile(e.target.files[0])} />
            <strong>{t('d_drop')}</strong>
            <small>{file ? t('d_chosen') + file : ''}</small>
          </label>
          <div>
            <div className="field">
              <label htmlFor="url">{t('d_url')}</label>
              <input id="url" type="url" inputMode="url" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
            <button className="btn btn-primary" type="button" onClick={start} disabled={running}>{t('d_start')}</button>
            {needInput ? <p className="err" role="alert" style={{ marginTop: 12 }}>{t('d_need')}</p> : null}
          </div>
        </div>

        {showPipe ? (
          <ol className="pipe">
            {STAGES.map((key, n) => (
              <li key={key} data-s={stages[n]}>
                <span>{t(key)}</span>
                <span className="st">{t('st_' + stages[n])}</span>
                <div className="bar-t"><b /></div>
              </li>
            ))}
          </ol>
        ) : null}
        {done ? <p className="ok" role="status" style={{ marginTop: 16 }}>{t('d_done')}</p> : null}

        <div className="player" ref={playerRef}>
          <div>
            <div className="stage">
              <Scene index={i} />
              {shownSubs.length > 0 ? (
                <div className="subs" aria-live="polite">
                  {shownSubs.map((l) => (
                    <p className={l} lang={l === 'zh' ? 'zh-CN' : l} key={l}>
                      <b>{LANG_TAG[l]}</b>
                      <span>{CUES[i][l]}</span>
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="controls">
              <div className="seg-progress">
                {CUES.map((_, n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={t('step') + ' ' + (n + 1)}
                    aria-current={n === i ? 'true' : undefined}
                    onClick={() => jump(n)}
                  />
                ))}
              </div>
              <div className="ctl-row">
                <button className="btn btn-primary" type="button" onClick={togglePlay}>
                  {playing ? t('d_pause') : finished ? t('d_replay') : t('d_play')}
                </button>
                <div className="ctl-group">
                  <span>{t('d_voice')}</span>
                  <div className="chips" role="group" aria-label={t('d_voice')}>
                    {['vi', 'en', 'zh'].map((l) => (
                      <button key={l} type="button" className="chip" lang={l === 'zh' ? 'zh-CN' : l} aria-pressed={voice === l} onClick={() => setVoice(l)}>
                        {l === 'vi' ? 'Tiếng Việt' : l === 'en' ? 'English' : '中文'}
                      </button>
                    ))}
                    <button type="button" className="chip" aria-pressed={voice === 'off'} onClick={() => setVoice('off')}>{t('d_off')}</button>
                  </div>
                </div>
              </div>
              <div className="ctl-row">
                <div className="ctl-group">
                  <span>{t('d_subs')}</span>
                  <div className="chips" role="group" aria-label={t('d_subs')}>
                    {['vi', 'en', 'zh'].map((l) => (
                      <button key={l} type="button" className="chip" aria-pressed={!!subs[l]} onClick={() => toggleSub(l)}>{LANG_TAG[l]}</button>
                    ))}
                  </div>
                </div>
                <div className="ctl-group">
                  <label htmlFor="speed" style={{ fontSize: '.9rem', fontWeight: 600 }}>{t('d_speed')}</label>
                  <select id="speed" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))}>
                    <option value={0.8}>0.8×</option>
                    <option value={1}>1×</option>
                    <option value={1.25}>1.25×</option>
                  </select>
                </div>
              </div>
              {voiceMissing ? <p className="note">{t('d_nospeech')}</p> : null}
            </div>
          </div>
          <div>
            <h3>{t('d_sample')}{t('rec_name')}</h3>
            <ol className="cue-list" aria-label={t('d_steps')}>
              {CUES.map((c, n) => (
                <li key={n}>
                  <button type="button" aria-current={n === i ? 'true' : undefined} onClick={() => jump(n)}>{c[lang]}</button>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div style={{ height: 84 }} />
      </div>
    </>
  );
}
