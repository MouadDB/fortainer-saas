import { sendNodeInviteEmail } from '@/lib/email/sendNodeInviteEmail';
import { ApiError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { sendAudit } from '@/lib/retraced';
import { getSession } from '@/lib/session';
import { sendEvent } from '@/lib/svix';
import {
  createInvitation,
  deleteInvitation,
  getInvitation,
  getInvitations,
  isInvitationExpired,
} from 'models/invitation';
import { addNodeMember, throwIfNoNodeAccess } from 'models/node';
import { throwIfNotAllowed } from 'models/user';
import type { NextApiRequest, NextApiResponse } from 'next';
import { recordMetric } from '@/lib/metrics';
import { isEmailAllowed } from '@/lib/email/utils';

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
      case 'POST':
        await handlePOST(req, res);
        break;
      case 'PUT':
        await handlePUT(req, res);
        break;
      case 'DELETE':
        await handleDELETE(req, res);
        break;
      default:
        res.setHeader('Allow', 'GET, POST, PUT, DELETE');
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

// Invite a user to a node
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const nodeMember = await throwIfNoNodeAccess(req, res);
  throwIfNotAllowed(nodeMember, 'node_invitation', 'create');

  const { email, role } = req.body;

  if (!isEmailAllowed(email)) {
    throw new ApiError(
      400,
      'It seems you entered a non-business email. Invitations can only be sent to work emails.'
    );
  }

  const memberExists = await prisma.nodeMember.count({
    where: {
      nodeId: nodeMember.nodeId,
      user: {
        email,
      },
    },
  });

  if (memberExists) {
    throw new ApiError(400, 'This user is already a member of the node.');
  }

  const invitationExists = await prisma.invitation.count({
    where: {
      email,
      nodeId: nodeMember.nodeId,
    },
  });

  if (invitationExists) {
    throw new ApiError(400, 'An invitation already exists for this email.');
  }

  const invitation = await createInvitation({
    nodeId: nodeMember.nodeId,
    invitedBy: nodeMember.userId,
    email,
    role,
  });

  await sendEvent(nodeMember.nodeId, 'invitation.created', invitation);
  await sendNodeInviteEmail(nodeMember.node, invitation);

  sendAudit({
    action: 'member.invitation.create',
    crud: 'c',
    user: nodeMember.user,
    node: nodeMember.node,
  });

  recordMetric('invitation.created');

  res.status(200).json({ data: invitation });
};

// Get all invitations for a node
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const nodeMember = await throwIfNoNodeAccess(req, res);
  throwIfNotAllowed(nodeMember, 'node_invitation', 'read');

  const invitations = await getInvitations(nodeMember.nodeId);

  recordMetric('invitation.fetched');

  res.status(200).json({ data: invitations });
};

// Delete an invitation
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const nodeMember = await throwIfNoNodeAccess(req, res);
  throwIfNotAllowed(nodeMember, 'node_invitation', 'delete');

  const { id } = req.query as { id: string };

  const invitation = await getInvitation({ id });

  if (
    invitation.invitedBy != nodeMember.user.id ||
    invitation.nodeId != nodeMember.nodeId
  ) {
    throw new ApiError(
      400,
      `You don't have permission to delete this invitation.`
    );
  }

  await deleteInvitation({ id });

  sendAudit({
    action: 'member.invitation.delete',
    crud: 'd',
    user: nodeMember.user,
    node: nodeMember.node,
  });

  await sendEvent(nodeMember.nodeId, 'invitation.removed', invitation);

  recordMetric('invitation.removed');

  res.status(200).json({ data: {} });
};

// Accept an invitation to an organization
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const { inviteToken } = req.body as { inviteToken: string };

  const invitation = await getInvitation({ token: inviteToken });

  if (await isInvitationExpired(invitation)) {
    throw new ApiError(400, 'Invitation expired. Please request a new one.');
  }

  const session = await getSession(req, res);
  const userId = session?.user?.id as string;

  if (session?.user.email != invitation.email) {
    throw new ApiError(
      400,
      'You must be logged in with the email address you were invited with.'
    );
  }

  const nodeMember = await addNodeMember(
    invitation.node.id,
    userId,
    invitation.role
  );

  await sendEvent(invitation.node.id, 'member.created', nodeMember);
  await deleteInvitation({ token: inviteToken });

  recordMetric('member.created');

  res.status(200).json({ data: {} });
};
