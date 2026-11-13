/**
 * Dubchef local voice-over export (offline demonstration engine).
 * Converts a PUBLISHED narration timeline from SQL into spoken audio with
 * eSpeak NG and FFmpeg. Produces real MP3 and video+replacement-audio MP4.
 * The voice is synthetic/robotic, not commercial neural TTS.
 * No shell execution, no user-controlled paths or SQL mutations.
 */
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const VOICE = Object.freeze({ vi: 'vi', en: 'en-us', zh: 'zh' });
const MAX_SECONDS = 600;
const MAX_LINES = 100;
const MAX_CHARS = 12000;
const speechError = (code, status = 422, extra = {}) => Object.assign(new Error(code), { code, status, ...extra });

export function parseNarration(content, language) {
  if (!Object.hasOwn(VOICE, language)) throw speechError('language_not_supported', 400);
  let rows;
  try { rows = typeof content === 'string' ? JSON.parse(content) : content; }
  catch { throw speechError('invalid_timeline'); }
  if (!Array.isArray(rows) || !rows.length || rows.length > MAX_LINES) throw speechError('invalid_timeline');
  let total = 0;
  let lastEnd = 0;
  const lines = rows.map((r, i) => {
    const text = typeof r?.text === 'string' ? r.text.trim() : '';
    const start = r?.start;
    const end = r?.end;
    total += text.length;
    if (!text || text.length > 1500 || !Number.isFinite(start) || !Number.isFinite(end) ||
      start < 0 || end <= start || end > MAX_SECONDS || (i > 0 && start < lastEnd)) {
      throw speechError('invalid_timeline');
    }
    lastEnd = end;
    return { text, start, end };
  });
  if (total > MAX_CHARS) throw speechError('export_too_large', 413);
  return lines;
}

/** Execute only fixed binaries and fixed CLI flags: text is passed through stdin. */
export function runBinary(binary, args, { input = null, timeoutMs = 90000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    let stderr = '';
    let stdout = '';
    let settled = false;
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      error ? reject(error) : resolve(result);
    };
    const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
    child.on('error', (e) => finish(speechError(e.code === 'ENOENT' ? 'export_unavailable' : 'export_failed', 503)));
    child.stdout.on('data', chunk => { if (stdout.length < 16000) stdout += String(chunk); });
    child.stderr.on('data', chunk => { if (stderr.length < 16000) stderr += String(chunk); });
    child.on('close', (code, signal) => finish(code === 0 ? null : speechError(signal ? 'export_timeout' : 'export_failed', signal ? 504 : 422), stdout.trim()));
    if (input == null) child.stdin.end();
    else child.stdin.end(input, 'utf8');
    child.stdin.on('error', () => {});
  });
}

async function probeDuration(path, ffprobeBin) {
  const out = await runBinary(ffprobeBin,
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', path],
    { timeoutMs: 15000 });
  const seconds = Number(out);
  if (!Number.isFinite(seconds) || seconds <= 0) throw speechError('invalid_video');
  return seconds;
}

/**
 * Returns {directory, output}, caller MUST remove directory after download.
 * Sources are resolved by authenticated API from SQL, never by user-supplied path.
 */
export async function produceVoiceover({ content, language, format, sourceVideo, ttsBin = process.env.TTS_BIN || 'espeak-ng',
  ffmpegBin = process.env.FFMPEG_BIN || 'ffmpeg', ffprobeBin = process.env.FFPROBE_BIN || 'ffprobe' }) {
  if (!['mp3', 'mp4'].includes(format)) throw speechError('invalid_format', 400);
  const lines = parseNarration(content, language);
  if (format === 'mp4' && !sourceVideo) throw speechError('video_file_missing', 409);
  const end = Math.max(...lines.map(row => row.end));
  const duration = format === 'mp4' ? await probeDuration(sourceVideo, ffprobeBin) : end;
  if (duration > MAX_SECONDS) throw speechError('export_too_large', 413);
  if (duration + 0.08 < end) throw speechError('timeline_overflow');

  const directory = await mkdtemp(join(tmpdir(), 'dubchef-export-'));
  try {
    const clips = [];
    for (const [index, row] of lines.entries()) {
      const wav = join(directory, `speech-${index}.wav`);
      await runBinary(ttsBin, ['--stdin', '-v', VOICE[language], '-s', '155', '-w', wav],
        { input: row.text, timeoutMs: 20000 });
      const spokenSeconds = await probeDuration(wav, ffprobeBin);
      const segmentSeconds = row.end - row.start;
      const speed = Math.max(1, spokenSeconds / segmentSeconds);
      if (speed > 2.5) throw speechError('speech_too_long', 422, { segment: index + 1 });
      clips.push({ wav, start: row.start, duration: segmentSeconds, speed });
    }
    // Input 0 is silence of the full timeline: silence remains between utterances.
    const inputs = ['-f', 'lavfi', '-t', String(duration), '-i', 'anullsrc=channel_layout=mono:sample_rate=24000'];
    for (const clip of clips) inputs.push('-i', clip.wav);
    const filters = clips.map((clip, i) => {
      const delay = Math.round(clip.start * 1000);
      const tempo = clip.speed > 1.001 ? `atempo=${Math.min(clip.speed, 2).toFixed(3)},${clip.speed > 2 ? `atempo=${(clip.speed / 2).toFixed(3)},` : ''}` : '';
      return `[${i+1}:a]aresample=24000,${tempo}atrim=duration=${clip.duration.toFixed(3)},adelay=${delay}:all=1[s${i}]`;
    });
    const mixes = '[0:a]' + clips.map((_, i) => `[s${i}]`).join('');
    filters.push(`${mixes}amix=inputs=${clips.length+1}:duration=first:normalize=0,atrim=duration=${duration.toFixed(3)}[mixed]`);
    const mp3 = join(directory, 'voiceover.mp3');
    await runBinary(ffmpegBin, ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y',
      ...inputs, '-filter_complex', filters.join(';'), '-map', '[mixed]',
      '-c:a', 'libmp3lame', '-q:a', '3', '-t', String(duration), mp3], { timeoutMs: 120000 });
    if (format === 'mp3') return { directory, output: mp3 };

    // Replace the original track with the new voice track; do not mislabel a video-only copy as dubbed.
    const mp4 = join(directory, 'dubbed.mp4');
    const videoCodec = (await runBinary(ffprobeBin, ['-v', 'error', '-select_streams', 'v:0',
      '-show_entries', 'stream=codec_name', '-of', 'default=noprint_wrappers=1:nokey=1', sourceVideo],
      {timeoutMs:15000})).trim();
    if (!videoCodec) throw speechError('invalid_video');
    const baseArgs = ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-i', sourceVideo, '-i', mp3,
      '-map', '0:v:0', '-map', '1:a:0'];
    const finishArgs = ['-c:a','aac','-b:a','160k','-t',String(duration),'-movflags','+faststart',mp4];
    const encode = ['-c:v','libx264','-preset','veryfast','-crf','24'];
    if (videoCodec === 'h264') {
      try { await runBinary(ffmpegBin, [...baseArgs,'-c:v','copy',...finishArgs], {timeoutMs:120000}); }
      catch { await runBinary(ffmpegBin, [...baseArgs,...encode,...finishArgs], {timeoutMs:120000}); }
    } else {
      // VP9, HEVC, etc. are re-encoded to H.264 for broader MP4 player support.
      await runBinary(ffmpegBin, [...baseArgs,...encode,...finishArgs], {timeoutMs:120000});
    }
    return { directory, output: mp4 };
  } catch (error) {
    await rm(directory, { recursive: true, force: true });
    throw error;
  }
}
