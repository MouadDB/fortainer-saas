import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { findOrCreateApp } from '@/lib/svix';
import { Role, Node } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

export const createNode = async (param: {
  userId: string;
  name: string;
  slug: string;
}) => {
  const { userId, name, slug } = param;

  const node = await prisma.node.create({
    data: {
      name,
      slug,
    },
  });

  await addNodeMember(node.id, userId, Role.OWNER);

  await findOrCreateApp(node.name, node.id);

  return node;
};

export const getNode = async (key: { id: string } | { slug: string }) => {
  return await prisma.node.findUniqueOrThrow({
    where: key,
  });
};

export const deleteNode = async (key: { id: string } | { slug: string }) => {
  return await prisma.node.delete({
    where: key,
  });
};

export const addNodeMember = async (
  nodeId: string,
  userId: string,
  role: Role
) => {
  return await prisma.nodeMember.upsert({
    create: {
      nodeId,
      userId,
      role,
    },
    update: {
      role,
    },
    where: {
      nodeId_userId: {
        nodeId,
        userId,
      },
    },
  });
};

export const removeNodeMember = async (nodeId: string, userId: string) => {
  return await prisma.nodeMember.delete({
    where: {
      nodeId_userId: {
        nodeId,
        userId,
      },
    },
  });
};

export const getNodes = async (userId: string) => {
  return await prisma.node.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
    include: {
      _count: {
        select: { members: true },
      },
    },
  });
};

export async function getNodeRoles(userId: string) {
  const nodeRoles = await prisma.nodeMember.findMany({
    where: {
      userId,
    },
    select: {
      nodeId: true,
      role: true,
    },
  });

  return nodeRoles;
}

// Check if the user is an admin or owner of the node
export async function isNodeAdmin(userId: string, nodeId: string) {
  const nodeMember = await prisma.nodeMember.findFirstOrThrow({
    where: {
      userId,
      nodeId,
    },
  });

  return nodeMember.role === Role.ADMIN || nodeMember.role === Role.OWNER;
}

export const getNodeMembers = async (slug: string) => {
  return await prisma.nodeMember.findMany({
    where: {
      node: {
        slug,
      },
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });
};

export const updateNode = async (slug: string, data: Partial<Node>) => {
  return await prisma.node.update({
    where: {
      slug,
    },
    data: data,
  });
};

export const isNodeExists = async (condition: any) => {
  return await prisma.node.count({
    where: {
      OR: condition,
    },
  });
};

// Check if the current user has access to the node
// Should be used in API routes to check if the user has access to the node
export const throwIfNoNodeAccess = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const session = await getSession(req, res);

  if (!session) {
    throw new Error('Unauthorized');
  }

  const nodeMember = await getNodeMember(
    session.user.id,
    req.query.slug as string
  );

  if (!nodeMember) {
    throw new Error('You do not have access to this node');
  }

  return {
    ...nodeMember,
    user: {
      ...session.user,
    },
  };
};

// Get the current user's node member object
export const getNodeMember = async (userId: string, slug: string) => {
  const nodeMember = await prisma.nodeMember.findFirstOrThrow({
    where: {
      userId,
      node: {
        slug,
      },
      role: {
        in: ['ADMIN', 'MEMBER', 'OWNER'],
      },
    },
    include: {
      node: true,
    },
  });

  return nodeMember;
};
