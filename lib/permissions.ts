import { Role } from '@prisma/client';

export type RoleType = (typeof Role)[keyof typeof Role];
export type Action = 'create' | 'update' | 'read' | 'delete' | 'leave';
export type Resource =
  | 'node'
  | 'node_member'
  | 'node_invitation'
  | 'node_sso'
  | 'node_dsync'
  | 'node_audit_log'
  | 'node_webhook'
  | 'node_api_key';

export type RolePermissions = {
  [role in RoleType]: Permission[];
};

export type Permission = {
  resource: Resource;
  actions: Action[] | '*';
};

export const availableRoles = [
  {
    id: Role.MEMBER,
    name: 'Member',
  },
  {
    id: Role.ADMIN,
    name: 'Admin',
  },
  {
    id: Role.OWNER,
    name: 'Owner',
  },
];

export const permissions: RolePermissions = {
  OWNER: [
    {
      resource: 'node',
      actions: '*',
    },
    {
      resource: 'node_member',
      actions: '*',
    },
    {
      resource: 'node_invitation',
      actions: '*',
    },
    {
      resource: 'node_sso',
      actions: '*',
    },
    {
      resource: 'node_dsync',
      actions: '*',
    },
    {
      resource: 'node_audit_log',
      actions: '*',
    },
    {
      resource: 'node_webhook',
      actions: '*',
    },
    {
      resource: 'node_api_key',
      actions: '*',
    },
  ],
  ADMIN: [
    {
      resource: 'node',
      actions: '*',
    },
    {
      resource: 'node_member',
      actions: '*',
    },
    {
      resource: 'node_invitation',
      actions: '*',
    },
    {
      resource: 'node_sso',
      actions: '*',
    },
    {
      resource: 'node_dsync',
      actions: '*',
    },
    {
      resource: 'node_audit_log',
      actions: '*',
    },
    {
      resource: 'node_webhook',
      actions: '*',
    },
    {
      resource: 'node_api_key',
      actions: '*',
    },
  ],
  MEMBER: [
    {
      resource: 'node',
      actions: ['read', 'leave'],
    },
  ],
};
