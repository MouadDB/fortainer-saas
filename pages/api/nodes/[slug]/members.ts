import { ApiError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { sendAudit } from '@/lib/retraced';
import { sendEvent } from '@/lib/svix';
import { Role } from '@prisma/client';
import {
  getNodeMembers,
  removeNodeMember,
  throwIfNoNodeAccess,
} from 'models/node';
import { throwIfNotAllowed } from 'models/user';
import type { NextApiRequest, NextApiResponse } from 'next';
import { recordMetric } from '@/lib/metrics';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        await handleGET(req, res);
        break;
      case 'DELETE':
        await handleDELETE(req, res);
        break;
      case 'PUT':
        await handlePUT(req, res);
        break;
      case 'PATCH':
        await handlePATCH(req, res);
        break;
      default:
        res.setHeader('Allow', 'GET, DELETE, PUT, PATCH');
        res.status(405).json({
          error: { message: `Method ${method} Not Allowed` },
        });
    }
  } catch (error: any) {
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;

    res.status(status).json({ error: { message } });
  }
}

// Get members of a node
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const nodeMember = await throwIfNoNodeAccess(req, res);
  throwIfNotAllowed(nodeMember, 'node_member', 'read');

  const members = await getNodeMembers(nodeMember.node.slug);

  recordMetric('member.fetched');

  res.status(200).json({ data: members });
};

// Delete the member from the node
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const nodeMember = await throwIfNoNodeAccess(req, res);
  throwIfNotAllowed(nodeMember, 'node_member', 'delete');

  const { memberId } = req.query as { memberId: string };

  const nodeMemberRemoved = await removeNodeMember(nodeMember.nodeId, memberId);

  await sendEvent(nodeMember.nodeId, 'member.removed', nodeMemberRemoved);

  sendAudit({
    action: 'member.remove',
    crud: 'd',
    user: nodeMember.user,
    node: nodeMember.node,
  });

  recordMetric('member.removed');

  res.status(200).json({ data: {} });
};

// Leave a node
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const nodeMember = await throwIfNoNodeAccess(req, res);
  throwIfNotAllowed(nodeMember, 'node', 'leave');

  const totalNodeOwners = await prisma.nodeMember.count({
    where: {
      role: Role.OWNER,
      nodeId: nodeMember.nodeId,
    },
  });

  if (totalNodeOwners <= 1) {
    throw new ApiError(400, 'A node should have at least one owner.');
  }

  await removeNodeMember(nodeMember.nodeId, nodeMember.user.id);

  recordMetric('member.left');

  res.status(200).json({ data: {} });
};

// Update the role of a member
const handlePATCH = async (req: NextApiRequest, res: NextApiResponse) => {
  const nodeMember = await throwIfNoNodeAccess(req, res);
  throwIfNotAllowed(nodeMember, 'node_member', 'update');

  const { memberId, role } = req.body as { memberId: string; role: Role };

  const memberUpdated = await prisma.nodeMember.update({
    where: {
      nodeId_userId: {
        nodeId: nodeMember.nodeId,
        userId: memberId,
      },
    },
    data: {
      role,
    },
  });

  sendAudit({
    action: 'member.update',
    crud: 'u',
    user: nodeMember.user,
    node: nodeMember.node,
  });

  recordMetric('member.role.updated');

  res.status(200).json({ data: memberUpdated });
};
