import { useTranslation } from 'next-i18next';
import Link from 'next/link';

const HeroSection = () => {
  const { t } = useTranslation('common');
  return (
    <div className="hero py-52">
      <div className="hero-content text-center">
        <div className="max-w-7md">
          <h1 className="text-5xl font-bold"> Fortainer Docker Manager</h1>
          <p className="py-6 text-2xl font-normal">
            Manage your docker server in one place
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
