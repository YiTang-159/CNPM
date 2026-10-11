import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../context/I18nContext.jsx';
import { usePageTitle } from '../utils/usePageTitle.js';
import { translateLines, TranslateError } from '../shared/translate.js';
import { LANGCODE, availableVoiceLangs, firstAvailableVoice, hasSpeech, stopSpeech, voiceFor, voicesLoaded } from '../utils/speech.js';
import { fileToWhisperAudio, AudioExtractError } from '../utils/audio.js';
import { transcribeVideoAudio } from '../utils/whisper.js';

const STAGES_MANUAL = ['dp1', 'dp2', 'dp3', 'dp4'];
const STAGES_AUTO = ['dp0', 'dp1', 'dp2', 'dp3', 'dp4'];
const LANG_TAG = { vi: 'VI', en: 'EN', zh: '中文' };
const ERR_KEY = { net: 'e_net', server: 'd_translate_err', empty: 'd_translate_err', limit: 'd_translate_limit' };

export default function Demo() {
  const { t, lang } = useI18n();
  usePageTitle('d_title');

  // --- video + lời thoại ---
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [objectUrl, setObjectUrl] = useState('');
  const [url, setUrl] = useState('');
  const [script, setScript] = useState('');
  const [sourceLang, setSourceLang] = useState(lang);
  const [needInput, setNeedInput] = useState(false);
  const [needScript, setNeedScript] = useState(false);
  const [over, setOver] = useState(false);

  // --- quy trình dịch thật ---
  const [autoMode, setAutoMode] = useState(false); // true = đang/đã tự nhận diện giọng nói (Whisper), không cần gõ tay
  const [sttPhase, setSttPhase] = useState(''); // 'model' | 'listening' | ''
  const [showPipe, setShowPipe] = useState(false);
  const [stages, setStages] = useState(STAGES_MANUAL.map(() => 'wait'));
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [translateErr, setTranslateErr] = useState('');
  const playerRef = useRef(null);
  const videoRef = useRef(null);

  // --- kết quả dịch thật ---
  // segments: [{ vi, en, zh, start?, end? }, ...] hoặc null trước khi dịch.
  // start/end (giây) chỉ có khi tự nhận diện bằng Whisper — cho phép đồng bộ đúng theo lời nói thật
  // thay vì chia đều thời lượng video như khi người dùng tự gõ lời thoại.
  const [segments, setSegments] = useState(null);

  // --- phát lại ---
  const [i, setI] = useState(0);
  const [voice, setVoice] = useState(lang);
  const [subs, setSubs] = useState({ [lang]: true });
  const [speed, setSpeed] = useState(1);
  const [, refreshVoices] = useState(0);

  useEffect(() => {
    if (!hasSpeech) return undefined;
    const bump = () => refreshVoices((n) => n + 1);
    window.speechSynthesis.addEventListener('voiceschanged', bump);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', bump);
  }, []);

  useEffect(() => () => {
    stopSpeech();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  // Đồng bộ tốc độ và tắt/mở tiếng gốc theo lựa chọn giọng đọc
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = speed;
    v.muted = voice !== 'off';
  }, [speed, voice, segments]);

  // Video phát tới đoạn nào thì đổi phụ đề/giọng đọc theo đoạn đó.
  // Có mốc thời gian thật (Whisper) -> khớp theo mốc thật. Không có (gõ tay) -> chia đều thời lượng.
  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !segments || !segments.length) return;
    if (segments[0].start != null) {
      const t2 = v.currentTime;
      let seg = 0;
      for (let n = 0; n < segments.length; n += 1) {
        if (t2 >= segments[n].start) seg = n; else break;
      }
      if (seg !== i) setI(seg);
      return;
    }
    if (!v.duration) return;
    const seg = Math.min(segments.length - 1, Math.floor((v.currentTime / v.duration) * segments.length));
    if (seg !== i) setI(seg);
  };

  // Đọc thuyết minh khi sang đoạn mới (chỉ khi có chọn giọng và video đang phát)
  useEffect(() => {
    if (!segments || voice === 'off' || !videoRef.current || videoRef.current.paused) return undefined;
    const v = voiceFor(voice);
    if (!v) return undefined;
    stopSpeech();
    const u = new window.SpeechSynthesisUtterance(segments[i][voice]);
    u.lang = LANGCODE[voice];
    u.rate = speed;
    u.voice = v;
    try { window.speechSynthesis.speak(u); } catch (e) { /* bỏ qua */ }
    return () => stopSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, voice, segments]);

  const pickFile = (f) => {
    if (!f) return;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setFile(f);
    setFileName(f.name);
    setObjectUrl(URL.createObjectURL(f));
    setNeedInput(false);
    setNeedScript(false);
  };

  const jump = (n) => {
    setI(n);
    const v = videoRef.current;
    if (!v || !segments || !segments.length) return;
    if (segments[n].start != null) {
      v.currentTime = segments[n].start;
    } else {
      v.currentTime = (n / segments.length) * (v.duration || 0);
    }
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      const p = v.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } else {
      v.pause();
      stopSpeech();
    }
  };

  const toggleSub = (l) => setSubs((s) => {
    const next = { ...s };
    if (next[l]) delete next[l]; else next[l] = true;
    return next;
  });

  const runStage = (stageArr, key, status) => stageArr.map((v, n) => (n === key ? status : v));

  const start = async () => {
    if (running) return;
    const hasVideo = Boolean(file || url.trim());
    const hasScript = script.trim().length > 0;
    // Tự nhận diện giọng nói chỉ chạy được với file tải lên thật (đọc được dữ liệu âm thanh);
    // video dán bằng liên kết thì trình duyệt không có quyền đọc âm thanh, buộc phải gõ tay lời thoại.
    const isAuto = Boolean(file) && !hasScript;
    setNeedInput(!hasVideo);
    setNeedScript(hasVideo && !hasScript && !file);
    if (!hasVideo || (!hasScript && !file)) return;

    setAutoMode(isAuto);
    setTranslateErr('');
    setDone(false);
    setShowPipe(true);
    setRunning(true);
    setSttPhase('');

    // Chỉ số từng bước khớp với STAGES_AUTO ['dp0','dp1','dp2','dp3','dp4'] hoặc
    // STAGES_MANUAL ['dp1','dp2','dp3','dp4'] — auto có thêm bước "nhận diện giọng nói" ở đầu.
    const sttIdx = isAuto ? 0 : -1;
    const readyIdx = isAuto ? 1 : 0;
    const tIdx = isAuto ? 2 : 1;
    const vIdx = isAuto ? 3 : 2;
    const doneIdx = isAuto ? 4 : 3;
    const STAGE = isAuto ? STAGES_AUTO : STAGES_MANUAL;
    setStages(runStage(STAGE.map(() => 'wait'), readyIdx, 'done')); // video đã có sẵn từ trước khi bấm Dịch

    try {
      let lines;
      let chunkTimes = null;

      if (isAuto) {
        setStages((s) => runStage(s, sttIdx, 'run'));
        const { audio } = await fileToWhisperAudio(file);
        const output = await transcribeVideoAudio(audio, sourceLang, setSttPhase);
        const chunks = (output.chunks && output.chunks.length)
          ? output.chunks
          : [{ text: output.text || '', timestamp: [0, videoRef.current?.duration || null] }];
        lines = chunks.map((c) => (c.text || '').trim());
        chunkTimes = chunks.map((c) => ({ start: c.timestamp?.[0] ?? 0, end: c.timestamp?.[1] ?? null }));
        // Loại bỏ đoạn rỗng (Whisper thỉnh thoảng trả câu trống ở đầu/cuối)
        const kept = lines.map((text, n) => ({ text, time: chunkTimes[n] })).filter((x) => x.text);
        lines = kept.map((x) => x.text);
        chunkTimes = kept.map((x) => x.time);
        if (!lines.length) throw new TranslateError('empty');
        setStages((s) => runStage(s, sttIdx, 'done'));
      } else {
        lines = script.split('\n');
      }

      setStages((s) => runStage(s, tIdx, 'run'));
      const translated = await translateLines(lines, sourceLang);
      if (!translated.length) throw new TranslateError('empty');
      setStages((s) => runStage(s, tIdx, 'done'));

      setStages((s) => runStage(s, vIdx, 'run'));
      if (hasSpeech && !voicesLoaded()) await new Promise((r) => setTimeout(r, 200));

      const withTime = chunkTimes
        ? translated.map((seg, n) => ({ ...seg, start: chunkTimes[n].start, end: chunkTimes[n].end }))
        : translated;

      setSegments(withTime);
      setI(0);
      setVoice(firstAvailableVoice(lang));
      setSubs({ [lang]: true });
      setStages((s) => runStage(s, vIdx, 'done'));
      setStages((s) => runStage(s, doneIdx, 'done'));
      setDone(true);
      if (playerRef.current) playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      let key = 'd_translate_err';
      if (e instanceof TranslateError) key = ERR_KEY[e.code] || 'd_translate_err';
      else if (e instanceof AudioExtractError) key = 'd_stt_err';
      else if (isAuto) key = 'd_stt_err';
      setTranslateErr(key);
      setStages((s) => s.map((v) => (v === 'run' ? 'wait' : v)));
    } finally {
      setRunning(false);
      setSttPhase('');
    }
  };

  const shownSubs = segments ? ['vi', 'en', 'zh'].filter((l) => subs[l]) : [];
  const voiceMissing = segments && voice !== 'off' && (!hasSpeech || (voicesLoaded() && !voiceFor(voice)));
  const avail = segments ? availableVoiceLangs() : null; // null = chưa tải xong danh sách giọng, chưa vội khoá
  const anyLocked = avail && ['vi', 'en', 'zh'].some((l) => !avail[l]);
  const videoSrc = objectUrl || url.trim();
  const activeStages = autoMode ? STAGES_AUTO : STAGES_MANUAL;
  const sttRunning = running && autoMode && stages[0] === 'run';

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
            <small>{fileName ? t('d_chosen') + fileName : ''}</small>
          </label>
          <div>
            <div className="field">
              <label htmlFor="url">{t('d_url')}</label>
              <input id="url" type="url" inputMode="url" placeholder="https://" value={url} onChange={(e) => { setUrl(e.target.value); setNeedInput(false); }} />
            </div>
            <p className="note" style={{ marginBottom: 16 }}>{t('d_preview_note')}</p>
            {needInput ? <p className="err" role="alert" style={{ marginBottom: 12 }}>{t('d_need')}</p> : null}
          </div>
        </div>

        <div className="field" style={{ marginTop: 8 }}>
          <label htmlFor="script">{t('d_script_label')}</label>
          <textarea
            id="script"
            value={script}
            onChange={(e) => { setScript(e.target.value); setNeedScript(false); }}
            placeholder={t('d_script_placeholder')}
            style={{ minHeight: 160 }}
          />
          <p className="note">{t('d_auto_hint')}</p>
          {needScript ? <p className="err" role="alert">{t('d_need_script')}</p> : null}
        </div>

        <div className="ctl-row" style={{ marginTop: 4, marginBottom: 20 }}>
          <div className="ctl-group">
            <label htmlFor="src-lang" style={{ fontSize: '.9rem', fontWeight: 600 }}>{t('d_source_lang')}</label>
            <select id="src-lang" value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
              <option value="zh">中文</option>
            </select>
          </div>
          <button className="btn btn-primary" type="button" onClick={start} disabled={running}>
            {running ? t('d_translating') : t('d_translate_btn')}
          </button>
        </div>

        {translateErr ? <p className="err" role="alert" style={{ marginBottom: 16 }}>{t(translateErr)}</p> : null}

        {showPipe ? (
          <>
            <ol className="pipe">
              {activeStages.map((key, n) => (
                <li key={key} data-s={stages[n]}>
                  <span>{t(key)}</span>
                  <span className="st">{t('st_' + stages[n])}</span>
                  <div className="bar-t"><b /></div>
                </li>
              ))}
            </ol>
            {sttRunning ? (
              <p className="note" role="status" style={{ marginTop: 4 }}>
                {t(sttPhase === 'listening' ? 'd_stt_listen' : 'd_stt_model')}
              </p>
            ) : null}
          </>
        ) : null}
        {done ? <p className="ok" role="status" style={{ marginTop: 16 }}>{t('d_done')}</p> : null}

        {segments ? (
          <div className="player" ref={playerRef}>
            <div>
              <div className="stage">
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video
                  ref={videoRef}
                  src={videoSrc}
                  controls
                  onTimeUpdate={onTimeUpdate}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
                />
                {shownSubs.length > 0 ? (
                  <div className="subs" aria-live="polite">
                    {shownSubs.map((l) => (
                      <p className={l} lang={l === 'zh' ? 'zh-CN' : l} key={l}>
                        <b>{LANG_TAG[l]}</b>
                        <span>{segments[i][l]}</span>
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="controls">
                <div className="seg-progress">
                  {segments.map((_, n) => (
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
                  <button className="btn btn-primary" type="button" onClick={togglePlay}>{t('d_play')} / {t('d_pause')}</button>
                  <div className="ctl-group">
                    <span>{t('d_voice')}</span>
                    <div className="chips" role="group" aria-label={t('d_voice')}>
                      {['vi', 'en', 'zh'].map((l) => {
                        const locked = avail && !avail[l];
                        return (
                          <button
                            key={l}
                            type="button"
                            className="chip"
                            lang={l === 'zh' ? 'zh-CN' : l}
                            aria-pressed={voice === l}
                            disabled={locked}
                            title={locked ? t('d_novoice_chip') : undefined}
                            onClick={() => setVoice(l)}
                          >
                            {l === 'vi' ? 'Tiếng Việt' : l === 'en' ? 'English' : '中文'}{locked ? ' 🔒' : ''}
                          </button>
                        );
                      })}
                      <button type="button" className="chip" aria-pressed={voice === 'off'} onClick={() => setVoice('off')}>{t('d_off')}</button>
                    </div>
                    {anyLocked ? <p className="note">{t('d_novoice_summary')}</p> : null}
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
                {voice !== 'off' ? <p className="note">{t('d_mute_note')}</p> : null}
                {voiceMissing ? <p className="note">{t('d_nospeech')}</p> : null}
              </div>
            </div>
            <div>
              <h3>{t('d_sample')}{fileName || videoSrc}</h3>
              <ol className="cue-list" aria-label={t('d_steps')}>
                {segments.map((seg, n) => (
                  <li key={n}>
                    <button type="button" aria-current={n === i ? 'true' : undefined} onClick={() => jump(n)}>{seg[lang]}</button>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : null}
        <div style={{ height: 84 }} />
      </div>
    </>
  );
}
