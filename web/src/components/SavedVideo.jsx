import { useEffect, useRef, useState } from 'react';
import { workApi } from '../api/workflows.js';
const TAG = {vi:'vi-VN',en:'en-US',zh:'zh-CN'};
export default function SavedVideo({video, onClose}) {
  const [url,setUrl] = useState('');
  const [data,setData] = useState(null);
  const [error,setError] = useState('');
  const [language,setLanguage] = useState('vi');
  const [time,setTime] = useState(0);
  const [voice,setVoice] = useState(false);
  const [speed,setSpeed] = useState(1);
  const player = useRef(null);
  const last = useRef(-1);
  useEffect(() => {
    let active = true, objectUrl;
    Promise.all([workApi.downloadVideo(video.id),workApi.videoResults(video.id)]).then(([blob,results]) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob);setUrl(objectUrl);setData(results);
      setLanguage(results.subtitles?.[0]?.language || 'vi');
    }).catch(() => { if(active) setError('Không mở được video hoặc kết quả đã lưu.'); });
    return () => { active=false; if(objectUrl) URL.revokeObjectURL(objectUrl); window.speechSynthesis?.cancel(); };
  },[video.id]);
  const rows = kind => {
    try { return JSON.parse(data?.[kind]?.find(x => x.language===language)?.content || '[]'); }
    catch { return []; }
  };
  const subtitles = rows('subtitles');
  const narrations = rows('narrations');
  const indexAt = (lines,t) => lines.findIndex((x,i) => {
    const d=player.current?.duration || lines.length*3;
    const start=x.start ?? i*d/lines.length, end=x.end ?? (i+1)*d/lines.length;
    return t>=start && t<end;
  });
  const idx=indexAt(subtitles,time);
  function update() {
    const v=player.current;if(!v) return;
    setTime(v.currentTime);
    const n=indexAt(narrations,v.currentTime);
    if(n!==last.current) {
      last.current=n;
      if(voice && n>=0 && window.speechSynthesis && window.SpeechSynthesisUtterance) {
        window.speechSynthesis.cancel();
        const u=new SpeechSynthesisUtterance(narrations[n].text);u.lang=TAG[language] || language;u.rate=speed;
        window.speechSynthesis.speak(u);
      }
    }
  }
  function stop() { window.speechSynthesis?.cancel();last.current=-1; }
  return <section className="panel" aria-label="Video và kết quả đã lưu">
    <div className="panel-head"><h2>{video.title}</h2><button className="btn btn-sm" onClick={onClose}>Đóng video</button></div>
    {error ? <p role="alert">{error}</p> : !url ? <p>Đang tải video…</p> : <>
      <video ref={player} src={url} controls muted={voice} style={{width:'100%',maxHeight:420}}
        onTimeUpdate={update} onPause={stop} onSeeked={stop} onEnded={stop} onPlay={() => {last.current=-1;update();}} />
      <p aria-live="off">{idx>=0 ? subtitles[idx].text : ' '}</p>
      <label>Ngôn ngữ <select value={language} onChange={e => {stop();setLanguage(e.target.value);}}>
        {data?.subtitles?.map(x => <option key={x.language} value={x.language}>{x.language}</option>)}
      </select></label>
      <label><input type="checkbox" checked={voice} onChange={e => {stop();setVoice(e.target.checked);}} /> Đọc thuyết minh</label>
      <label>Tốc độ <select value={speed} onChange={e => {const n=Number(e.target.value);setSpeed(n);if(player.current) player.current.playbackRate=n;stop();}}>
        {[0.8,1,1.25].map(n=><option key={n} value={n}>{n}×</option>)}
      </select></label>
      <p className="fine">Giọng đọc sử dụng giọng có sẵn trên thiết bị. Video tải xuống là tệp gốc; phụ đề và lời thuyết minh được lưu riêng.</p>
    </>}
  </section>;
}
