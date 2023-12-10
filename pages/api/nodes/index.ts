import { slugify } from '@/lib/common';
import { ApiError } from '@/lib/errors';
import { getSession } from '@/lib/session';
import { createNode, getNodes, isNodeExists } from 'models/node';
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
      case 'POST':
        await handlePOST(req, res);
        break;
      default:
        res.setHeader('Allow', 'GET, POST');
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

// Get nodes
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getSession(req, res);

  const nodes = await getNodes(session?.user.id as string);

  recordMetric('node.fetched');

  res.status(200).json({ data: nodes });
};

// Create a node
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { name } = req.body;

  const session = await getSession(req, res);
  const slug = slugify(name);

  if (await isNodeExists([{ slug }])) {
    throw new ApiError(400, 'A node with the name already exists.');
  }

  const node = await createNode({
    userId: session?.user?.id as string,
    name,
    slug,
  });

  recordMetric('node.created');

  res.status(200).json({ data: node });
};
