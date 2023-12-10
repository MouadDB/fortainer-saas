import { hashPassword, validatePasswordPolicy } from '@/lib/auth';
import { generateToken, slugify } from '@/lib/common';
import { sendVerificationEmail } from '@/lib/email/sendVerificationEmail';
import { prisma } from '@/lib/prisma';
import { isEmailAllowed } from '@/lib/email/utils';
import env from '@/lib/env';
import { ApiError } from '@/lib/errors';
import { createNode, getNode, isNodeExists } from 'models/node';
import { createUser, getUser } from 'models/user';
import type { NextApiRequest, NextApiResponse } from 'next';
import { recordMetric } from '@/lib/metrics';
import { getInvitation, isInvitationExpired } from 'models/invitation';
import { validateRecaptcha } from '@/lib/recaptcha';
import { slackNotify } from '@/lib/slack';
import { Node } from '@prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    switch (method) {
      case 'POST':
        await handlePOST(req, res);
        break;
      default:
        res.setHeader('Allow', 'POST');
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

// Signup the user
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { name, email, password, node, inviteToken, recaptchaToken } = req.body;

  await validateRecaptcha(recaptchaToken);

  const invitation = inviteToken
    ? await getInvitation({ token: inviteToken })
    : null;

  if (invitation && (await isInvitationExpired(invitation))) {
    throw new ApiError(400, 'Invitation expired. Please request a new one.');
  }

  // If invitation is present, use the email from the invitation instead of the email in the request body
  const emailToUse = invitation ? invitation.email : email;

  if (!isEmailAllowed(emailToUse)) {
    throw new ApiError(
      400,
      `We currently only accept work email addresses for sign-up. Please use your work email to create an account. If you don't have a work email, feel free to contact our support node for assistance.`
    );
  }

  if (await getUser({ email: emailToUse })) {
    throw new ApiError(400, 'An user with this email already exists.');
  }

  validatePasswordPolicy(password);

  // Check if node name is available
  if (!invitation) {
    if (!node) {
      throw new ApiError(400, 'A node name is required.');
    }

    const slug = slugify(node);
    const nameCollisions = await isNodeExists([{ name: node }, { slug }]);

    if (nameCollisions > 0) {
      throw new ApiError(400, 'A node with this name already exists.');
    }
  }

  const user = await createUser({
    name,
    email: emailToUse,
    password: await hashPassword(password),
    emailVerified: invitation ? new Date() : null,
  });

  let userNode: Node | null = null;

  // Create node if user is not invited
  // So we can create the node with the user as the owner
  if (!invitation) {
    userNode = await createNode({
      userId: user.id,
      name: node,
      slug: slugify(node),
    });
  } else {
    userNode = await getNode({ id: invitation.nodeId });
  }

  // Send account verification email
  if (env.confirmEmail && !user.emailVerified) {
    const verificationToken = await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: generateToken(),
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await sendVerificationEmail({ user, verificationToken });
  }

  recordMetric('user.signup');

  slackNotify()?.alert({
    text: invitation
      ? 'New user signed up via invitation'
      : 'New user signed up',
    fields: {
      Name: user.name,
      Email: user.email,
      Node: userNode?.name,
    },
  });

  res.status(201).json({
    data: {
      confirmEmail: env.confirmEmail && !user.emailVerified,
    },
  });
};
