import { Link } from 'react-router-dom';
import { useI18n } from '../context/I18nContext.jsx';
import { usePageTitle } from '../utils/usePageTitle.js';
import HeroArt from '../components/HeroArt.jsx';
import StepArt from '../components/StepArt.jsx';
import Wave from '../components/Wave.jsx';
import Scene from '../components/Scenes.jsx';

const STEPS = ['s1', 's2', 's3', 's4'];
const BANDS = [
  ['vi', 'Tiếng Việt', 'l_vi_d', 'Trứng xào cà chua', 1],
  ['en', 'English', 'l_en_d', 'Tomato and egg stir-fry', 2],
  ['zh', '中文', 'l_zh_d', '番茄炒蛋', 3],
];

export default function Home() {
  const { t } = useI18n();
  usePageTitle('pt_home');

  return (
    <>
      <div className="hero">
        <div className="wrap hero-center">
          <h1>{t('h_title')}</h1>
          <p className="lead">{t('h_sub')}</p>
          <div className="cta-row">
            <Link className="btn btn-primary" to="/demo">{t('h_cta1')}</Link>
            <Link className="btn" to="/features">{t('h_cta2')}</Link>
          </div>
          <HeroArt />
        </div>
      </div>

      <div className="section alt">
        <div className="wrap">
          <h2 className="sec">{t('how_title')}</h2>
          <ol className="steps">
            {STEPS.map((k, n) => (
              <li key={k}>
                <StepArt index={n} />
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
            {BANDS.map(([lang, name, key, dish, seed]) => (
              <div className={'band ' + lang} key={lang}>
                <div className="name" lang={lang === 'zh' ? 'zh-CN' : lang}>{name}</div>
                <div className="band-body">
                  <p>{t(key)}</p>
                  <div className="band-voice" aria-hidden="true">
                    <Wave seed={seed} />
                    <span lang={lang === 'zh' ? 'zh-CN' : lang}>{dish}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section alt cta-band">
        <div className="wrap cta-grid">
          <div>
            <h2>{t('cta_title')}</h2>
            <p>{t('cta_sub')}</p>
            <Link className="btn btn-primary" to="/register">{t('cta_btn')}</Link>
          </div>
          <div className="cta-art" aria-hidden="true">
            <Scene index={3} />
          </div>
        </div>
      </div>
    </>
  );
}
