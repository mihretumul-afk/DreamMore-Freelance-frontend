import { Link } from 'react-router-dom';
import Container from '../common/Container';
import Logo from '../common/Logo';
import { FOOTER_COLUMNS } from '../../constants/navigation';
import { useI18n } from '../../i18n';

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-white/10 bg-ink-950 text-slate-300">
      <Container className="py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" aria-label={t('nav.home')}>
              <Logo variant="light" />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              {t('footer.description')}
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.headingKey}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                {t(column.headingKey)}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.labelKey}>
                    <Link
                      to={link.to}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Dream More AppWorks. {t('footer.rights')}
          </p>
          <p className="text-xs text-slate-500">{t('footer.madeWith')}</p>
        </div>
      </Container>
    </footer>
  );
}
