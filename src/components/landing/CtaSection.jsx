import { Link } from 'react-router-dom';
import Container from '../common/Container';
import Reveal from '../common/Reveal';
import Button from '../ui/Button';
import { useI18n } from '../../i18n';

export default function CtaSection() {
  const { t } = useI18n();

  return (
    <section className="bg-white py-16 lg:py-24" aria-labelledby="cta-heading">
      <Container>
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id="cta-heading"
              className="text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl"
            >
              {t('cta.title')}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-500">{t('cta.description')}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button as={Link} to="/register" size="lg" className="w-full sm:w-auto">
                {t('cta.createAccount')}
              </Button>
              <Button
                as={Link}
                to="/freelancers"
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                {t('cta.findTalent')}
              </Button>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
