import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../context/I18nContext.jsx';
import { usePageTitle } from '../utils/usePageTitle.js';
import { reduceMotion } from '../utils/speech.js';
import { CUES } from '../shared/i18n.js';
import Wave from '../components/Wave.jsx';

const TRACKS = [
  ['vi', 'VI', 0],
  ['en', 'EN', 1],
  ['zh', '中文', 2],
];
const STEPS = ['s1', 's2', 's3', 's4'];
const BANDS = [
  ['vi', 'Tiếng Việt', 'l_vi_d'],
  ['en', 'English', 'l_en_d'],
  ['zh', '中文', 'l_zh_d'],
];

/** Ba track lồng tiếng chạy song song, tự chuyển bước mỗi ~4 giây. */
function HeroTracks() {
  const { t } = useI18n();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const id = setInterval(() => {
      if (!document.hidden) setI((v) => (v + 1) % CUES.length);
    }, 4200);
    return () => clearInterval(id);
  }, [i]); // đổi bước bằng tay thì đồng hồ tính lại từ đầu

  return (
    <div className="tracks">
      <div className="tracks-head">
        <span>{t('rec_name')}</span>
        <span>{t('step')} {i + 1}/{CUES.length}</span>
      </div>
      {TRACKS.map(([lang, tag, seed]) => (
        <div className={'track ' + lang} key={lang}>
          <span className="tag">{tag}</span>
          <p className="cap enter" key={i} lang={lang === 'zh' ? 'zh-CN' : lang}>{CUES[i][lang]}</p>
          <Wave seed={seed} />
        </div>
      ))}
      <div className="dots">
        {CUES.map((_, n) => (
          <button
            key={n}
            type="button"
            aria-label={t('step') + ' ' + (n + 1)}
            aria-current={n === i ? 'true' : undefined}
            onClick={() => setI(n)}
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const { t } = useI18n();
  usePageTitle('pt_home');

  return (
    <>
      <div className="hero">
        <div className="wrap hero-grid">
          <div>
            <h1>{t('h_title')}</h1>
            <p className="lead">{t('h_sub')}</p>
            <div className="cta-row">
              <Link className="btn btn-primary" to="/demo">{t('h_cta1')}</Link>
              <Link className="btn" to="/features">{t('h_cta2')}</Link>
            </div>
          </div>
          <HeroTracks />
        </div>
      </div>

      <div className="section alt">
        <div className="wrap">
          <h2 className="sec">{t('how_title')}</h2>
          <ol className="steps">
            {STEPS.map((k, n) => (
              <li key={k}>
                <div className="n">{n + 1}</div>
                <h3>{t(k + 't')}</h3>
                <p>{t(k + 'd')}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="section">
        <div className="wrap">
          <h2 className="sec">{t('langs_title')}</h2>
          <div className="bands">
            {BANDS.map(([lang, name, key]) => (
              <div className={'band ' + lang} key={lang}>
                <div className="name" lang={lang === 'zh' ? 'zh-CN' : lang}>{name}</div>
                <p>{t(key)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section alt cta-band">
        <div className="wrap">
          <h2>{t('cta_title')}</h2>
          <p>{t('cta_sub')}</p>
          <Link className="btn btn-primary" to="/register">{t('cta_btn')}</Link>
        </div>
      </div>
    </>
  );
}
