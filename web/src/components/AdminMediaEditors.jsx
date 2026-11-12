import { useEffect, useMemo, useState } from 'react';
import { mediaClock, saveMediaExport, subtitleFileText, wordsIn } from '../utils/adminMediaFormats.js';

const LANGUAGE_TAGS = { vi: 'vi-VN', en: 'en-US', zh: 'zh-CN' };
const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const displayTime = value => mediaClock(Math.max(0, n(value)), '.');

/** Phụ đề: các câu ngắn, thời điểm bắt đầu/kết thúc, xem trước và định dạng SRT/VTT. */
export function SubtitleEditor({ editor, patchRow, addRow, removeRow, onNotice }) {
  const [playhead, setPlayhead] = useState(0);
  const duration = useMemo(() => Math.max(1, ...editor.lines.map(x => n(x.end))), [editor.lines]);
  const active = editor.lines.find(x => n(x.start) <= playhead && playhead < n(x.end));
  const issues = editor.lines.map((x, i) => {
    const cps = String(x.text || '').length / Math.max(.1, n(x.end) - n(x.start));
    return { index: i, chars: String(x.text || '').length, cps, fast: cps > 20 };
  });
  function exportAs(format) {
    const rows = editor.lines;
    if (!rows.length || rows.some(x => !x.text.trim() || !Number.isFinite(x.start) || !Number.isFinite(x.end) ||
      x.start < 0 || x.end <= x.start || x.end > 86400) ||
      rows.some((x, i) => i > 0 && x.start < rows[i - 1].end)) {
      onNotice('Hãy hoàn thiện nội dung và các mốc thời gian trước khi xuất tệp phụ đề.');
      return;
    }
    const content = subtitleFileText(rows, format);
    saveMediaExport(content, `phu-de-video-${editor.videoId}-${editor.language}.${format}`,
      format === 'vtt' ? 'text/vtt;charset=utf-8' : 'application/x-subrip;charset=utf-8');
    onNotice(`Đã tạo tệp ${format.toUpperCase()} từ nội dung đang mở. Nếu có chỉnh sửa, hãy lưu SQL Server riêng để lưu phiên bản.`);
  }
  return <div className="media-workspace media-workspace-subtitles">
    <div className="media-workspace-head"><div><h3>Biên tập dòng phụ đề</h3>
      <p className="fine">Chỉnh chính xác thời gian xuất hiện và câu chữ trên màn hình. Mỗi dòng có mốc thời gian riêng.</p></div>
      <div className="adm-actions"><button type="button" className="btn btn-sm" onClick={() => exportAs('srt')}>Xuất SRT</button>
        <button type="button" className="btn btn-sm" onClick={() => exportAs('vtt')}>Xuất VTT</button></div>
    </div>
    <div className="media-preview" role="region" aria-label="Xem trước phụ đề theo thời gian">
      <div className="media-preview-screen">
        <span className="media-preview-watermark">XEM TRƯỚC PHỤ ĐỀ · {editor.language.toUpperCase()}</span>
        <div className="media-preview-caption">{active?.text || 'Chưa có phụ đề tại thời điểm này'}</div>
      </div>
      <div className="media-preview-controls"><label htmlFor="subtitle-preview-time">Vị trí xem trước: {displayTime(playhead)}</label>
        <input id="subtitle-preview-time" type="range" min="0" max={duration} step="0.1" value={Math.min(playhead, duration)}
          onChange={e => setPlayhead(Number(e.target.value))} /></div>
    </div>
    <div className="adm-table-wrap"><table className="adm-table media-lines-table"><thead><tr>
      <th>#</th><th>Bắt đầu (giây)</th><th>Kết thúc (giây)</th><th>Câu phụ đề</th><th>Tốc độ đọc</th><th>Thao tác</th>
    </tr></thead><tbody>{editor.lines.map((r,i) => <tr key={i}>
      <td>{i+1}</td><td><input aria-label={`Bắt đầu dòng ${i+1}`} className="ops-number" type="number" step="0.1" min="0" value={r.start}
        onChange={e => patchRow(i, 'start', e.target.value)} /></td>
      <td><input aria-label={`Kết thúc dòng ${i+1}`} className="ops-number" type="number" step="0.1" min="0" value={r.end}
        onChange={e => patchRow(i, 'end', e.target.value)} /></td>
      <td><textarea aria-label={`Nội dung dòng ${i+1}`} rows={2} maxLength={4000} value={r.text}
        onChange={e => patchRow(i, 'text', e.target.value)} />
        <span className="fine">{issues[i].chars} ký tự</span></td>
      <td><span className={issues[i].fast ? 'media-warning' : 'fine'}>{issues[i].cps.toFixed(1)} ký tự/giây</span>
        {issues[i].fast && <small className="media-warning">Nên rút ngắn câu hoặc tăng thời gian hiển thị.</small>}</td>
      <td><button type="button" className="btn btn-sm" disabled={editor.lines.length === 1} onClick={() => removeRow(i)}>Xóa dòng</button></td>
    </tr>)}</tbody></table></div>
    <div className="adm-actions ops-gap"><button type="button" className="btn" onClick={addRow}>+ Thêm dòng phụ đề</button></div>
  </div>;
}

/** Thuyết minh: biên tập kịch bản và nghe thử bằng engine giọng nói của trình duyệt.
 * Voice/rate chỉ là lựa chọn nghe thử, KHÔNG được lưu vào SQL / tạo file âm thanh. */
export function NarrationEditor({ editor, patchRow, addRow, removeRow, onNotice }) {
  const [rate, setRate] = useState(1);
  const [voiceId, setVoiceId] = useState('');
  const [voices, setVoices] = useState([]);
  const [speaking, setSpeaking] = useState(false);
  const totalWords = editor.lines.reduce((sum, line) => sum + wordsIn(line.text), 0);
  useEffect(() => {
    if (!('speechSynthesis' in window)) return undefined;
    const synthesis = window.speechSynthesis;
    const update = () => setVoices(synthesis.getVoices());
    update();
    synthesis.addEventListener?.('voiceschanged', update);
    return () => { synthesis.cancel(); synthesis.removeEventListener?.('voiceschanged', update); };
  }, [editor.videoId, editor.language]);
  function stop() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }
  function preview(text) {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      onNotice('Trình duyệt này không hỗ trợ nghe thử bằng giọng đọc. Vui lòng thử Edge hoặc Chrome.'); return;
    }
    if (!text.trim()) { onNotice('Hãy nhập kịch bản trước khi nghe thử.'); return; }
    const synthesis = window.speechSynthesis;
    synthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = LANGUAGE_TAGS[editor.language] || editor.language;
    utterance.rate = rate;
    const preferred = voices.find(v => v.voiceURI === voiceId) || voices.find(v => v.lang.toLowerCase().startsWith(editor.language));
    if (preferred) utterance.voice = preferred;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synthesis.speak(utterance);
  }
  function downloadScript() {
    const content = editor.lines.map((line, i) => `[Đoạn ${i+1} · ${displayTime(line.start)}–${displayTime(line.end)}]\n${line.text.trim()}`).join('\n\n');
    if (!editor.lines.every(x => x.text.trim())) { onNotice('Hãy nhập đủ nội dung trước khi xuất kịch bản.'); return; }
    saveMediaExport(content, `kich-ban-thuyet-minh-video-${editor.videoId}-${editor.language}.txt`);
    onNotice('Đã tạo tệp TXT chứa kịch bản đang mở. Đây không phải tệp âm thanh MP3.');
  }
  return <div className="media-workspace media-workspace-narrations">
    <div className="media-workspace-head"><div><h3>Kịch bản giọng đọc</h3>
      <p className="fine">Chỉnh lời thoại và nghe thử cách đọc. {editor.lines.length} đoạn · {totalWords} từ.</p></div>
      <button type="button" className="btn btn-sm" onClick={downloadScript}>Xuất kịch bản TXT</button>
    </div>
    <div className="media-voice-toolbar">
      <label>Giọng nghe thử (trên máy này)
        <select value={voiceId} onChange={e => setVoiceId(e.target.value)}>
          <option value="">Tự động theo ngôn ngữ</option>
          {voices.filter(v => v.lang.toLowerCase().startsWith(editor.language)).map(v =>
            <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
        </select>
      </label>
      <label>Tốc độ nghe thử: {rate.toFixed(1)}x
        <input aria-label="Tốc độ nghe thử" type="range" min="0.6" max="1.6" step="0.1" value={rate} onChange={e => setRate(Number(e.target.value))} />
      </label>
      <div className="media-voice-buttons"><button type="button" className="btn btn-primary btn-sm"
        onClick={() => preview(editor.lines.map(x => x.text).join('. '))}>Nghe toàn bộ</button>
        <button type="button" className="btn btn-sm" onClick={stop} disabled={!speaking}>Dừng nghe</button></div>
    </div>
    <p className="media-note">Nghe thử dùng giọng đọc có sẵn trong trình duyệt; chưa tạo hoặc lưu MP3 vào máy chủ. Giọng và tốc độ nghe thử không được ghi vào SQL.</p>
    <div className="media-script-list">{editor.lines.map((line, i) => <article className="media-script-card" key={i}>
      <div className="media-script-card-head"><div><b>Đoạn thuyết minh {i+1}</b><span className="fine">{wordsIn(line.text)} từ · {displayTime(line.start)} – {displayTime(line.end)}</span></div>
        <div className="adm-actions"><button type="button" className="btn btn-sm" onClick={() => preview(line.text)}>Nghe đoạn</button>
          <button type="button" className="btn btn-sm" disabled={editor.lines.length===1} onClick={() => removeRow(i)}>Xóa đoạn</button></div></div>
      <label className="media-script-label">Lời thuyết minh
        <textarea aria-label={`Nội dung dòng ${i+1}`} rows={4} maxLength={4000} value={line.text}
          placeholder="Nhập lời đọc cho đoạn video..." onChange={e => patchRow(i, 'text', e.target.value)} />
      </label>
      <details className="media-timing"><summary>Đồng bộ lời đọc với video (giây)</summary>
        <div className="ops-toolbar"><label>Bắt đầu
          <input aria-label={`Bắt đầu dòng ${i+1}`} type="number" step="0.1" min="0" value={line.start} onChange={e => patchRow(i,'start',e.target.value)} /></label>
          <label>Kết thúc
          <input aria-label={`Kết thúc dòng ${i+1}`} type="number" step="0.1" min="0" value={line.end} onChange={e => patchRow(i,'end',e.target.value)} /></label></div>
      </details>
    </article>)}</div>
    <div className="adm-actions ops-gap"><button type="button" className="btn" onClick={addRow}>+ Thêm đoạn thuyết minh</button></div>
  </div>;
}
