import { Cog6ToothIcon, CloudIcon, CubeIcon, ServerIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'next-i18next';
import NavigationItems from './NavigationItems';
import { NavigationProps, MenuItem } from './NavigationItems';

interface NavigationItemsProps extends NavigationProps {
  slug: string;
}

const NodeNavigation = ({ slug, activePathname }: NavigationItemsProps) => {
  const { t } = useTranslation('common');

  const menus: MenuItem[] = [
    {
      name: t('containers'),
      href: `/nodes/${slug}/containers`,
      icon: CubeIcon,
      active: activePathname === `/nodes/${slug}/containers`,
    },
    {
      name: t('images'),
      href: `/nodes/${slug}/images`,
      icon: CloudIcon,
      active: activePathname === `/nodes/${slug}/images`,
    },
    {
      name: t('volumes'),
      href: `/nodes/${slug}/volumes`,
      icon: ServerIcon,
      active: activePathname === `/nodes/${slug}/volumes`,
    },
    {
      name: t('settings'),
      href: `/nodes/${slug}/settings`,
      icon: Cog6ToothIcon,
      active:activePathname === `/nodes/${slug}/settings`,
    },
  ];

  return <NavigationItems menus={menus} />;
};

export default NodeNavigation;
