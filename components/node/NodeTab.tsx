import {
  Cog6ToothIcon,
  DocumentMagnifyingGlassIcon,
  KeyIcon,
  PaperAirplaneIcon,
  ShieldExclamationIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import type { Node } from '@prisma/client';
import classNames from 'classnames';
import useCanAccess from 'hooks/useCanAccess';
import Link from 'next/link';
import { NodeFeature } from 'types';

interface NodeTabProps {
  activeTab: string;
  node: Node;
  heading?: string;
  nodeFeatures: NodeFeature;
}

const NodeTab = ({ activeTab, node, heading, nodeFeatures }: NodeTabProps) => {
  const { canAccess } = useCanAccess();

  const navigations = [
    {
      name: 'Settings',
      href: `/nodes/${node.slug}/settings`,
      active: activeTab === 'settings',
      icon: Cog6ToothIcon,
    },
  ];

  if (canAccess('node_member', ['create', 'update', 'read', 'delete'])) {
    navigations.push({
      name: 'Members',
      href: `/nodes/${node.slug}/members`,
      active: activeTab === 'members',
      icon: UserPlusIcon,
    });
  }

  if (
    nodeFeatures.sso &&
    canAccess('node_sso', ['create', 'update', 'read', 'delete'])
  ) {
    navigations.push({
      name: 'Single Sign-On',
      href: `/nodes/${node.slug}/sso`,
      active: activeTab === 'sso',
      icon: ShieldExclamationIcon,
    });
  }

  if (
    nodeFeatures.dsync &&
    canAccess('node_dsync', ['create', 'update', 'read', 'delete'])
  ) {
    navigations.push({
      name: 'Directory Sync',
      href: `/nodes/${node.slug}/directory-sync`,
      active: activeTab === 'directory-sync',
      icon: UserPlusIcon,
    });
  }

  if (
    nodeFeatures.auditLog &&
    canAccess('node_audit_log', ['create', 'update', 'read', 'delete'])
  ) {
    navigations.push({
      name: 'Audit Logs',
      href: `/nodes/${node.slug}/audit-logs`,
      active: activeTab === 'audit-logs',
      icon: DocumentMagnifyingGlassIcon,
    });
  }

  if (
    nodeFeatures.webhook &&
    canAccess('node_webhook', ['create', 'update', 'read', 'delete'])
  ) {
    navigations.push({
      name: 'Webhooks',
      href: `/nodes/${node.slug}/webhooks`,
      active: activeTab === 'webhooks',
      icon: PaperAirplaneIcon,
    });
  }

  if (
    nodeFeatures.apiKey &&
    canAccess('node_api_key', ['create', 'update', 'read', 'delete'])
  ) {
    navigations.push({
      name: 'API Keys',
      href: `/nodes/${node.slug}/api-keys`,
      active: activeTab === 'api-keys',
      icon: KeyIcon,
    });
  }

  return (
    <div className="flex flex-col pb-6">
      <h2 className="text-xl font-semibold mb-2">
        {heading ? heading : node.name}
      </h2>
      <nav
        className=" flex space-x-5 border-b border-gray-300"
        aria-label="Tabs"
      >
        {navigations.map((menu) => {
          return (
            <Link
              href={menu.href}
              key={menu.href}
              className={classNames(
                'inline-flex items-center border-b-2 py-4 text-sm font-medium',
                menu.active
                  ? 'border-gray-900 text-gray-700 dark:text-gray-100'
                  : 'border-transparent text-gray-500 hover:border-gray-300  hover:text-gray-700 hover:dark:text-gray-100'
              )}
            >
              {menu.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default NodeTab;
