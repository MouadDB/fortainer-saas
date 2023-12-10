import { sendAudit } from '@/lib/retraced';
import {
  deleteNode,
  getNode,
  throwIfNoNodeAccess,
  updateNode,
} from 'models/node';
import { throwIfNotAllowed } from 'models/user';
import type { NextApiRequest, NextApiResponse } from 'next';
import { recordMetric } from '@/lib/metrics';
import { validateDomain } from '@/lib/common';
import { ApiError } from '@/lib/errors';
import env from '@/lib/env';

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
      case 'PUT':
        await handlePUT(req, res);
        break;
      case 'DELETE':
        await handleDELETE(req, res);
        break;
      default:
        res.setHeader('Allow', 'GET, PUT, DELETE');
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

// Get a node by slug
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const nodeMember = await throwIfNoNodeAccess(req, res);
  throwIfNotAllowed(nodeMember, 'node', 'read');

  const node = await getNode({ id: nodeMember.nodeId });

  recordMetric('node.fetched');

  res.status(200).json({ data: node });
};

// Update a node
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const nodeMember = await throwIfNoNodeAccess(req, res);
  throwIfNotAllowed(nodeMember, 'node', 'update');

  const { name, slug, domain } = req.body;

  if (domain?.length > 0 && !validateDomain(domain)) {
    throw new ApiError(400, 'Invalid domain name');
  }

  const updatedNode = await updateNode(nodeMember.node.slug, {
    name,
    slug,
    domain,
  });

  sendAudit({
    action: 'node.update',
    crud: 'u',
    user: nodeMember.user,
    node: nodeMember.node,
  });

  recordMetric('node.updated');

  res.status(200).json({ data: updatedNode });
};

// Delete a node
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!env.nodeFeatures.deleteNode) {
    throw new ApiError(404, 'Not Found');
  }

  const nodeMember = await throwIfNoNodeAccess(req, res);

  throwIfNotAllowed(nodeMember, 'node', 'delete');

  await deleteNode({ id: nodeMember.nodeId });

  sendAudit({
    action: 'node.delete',
    crud: 'd',
    user: nodeMember.user,
    node: nodeMember.node,
  });

  recordMetric('node.removed');

  res.status(200).json({ data: {} });
};
