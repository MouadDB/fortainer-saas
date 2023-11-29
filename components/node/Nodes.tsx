import { LetterAvatar } from '@/components/shared';
import { defaultHeaders } from '@/lib/common';
import { Node } from '@prisma/client';
import useNodes from 'hooks/useNodes';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from 'react-daisyui';
import toast from 'react-hot-toast';
import type { ApiResponse } from 'types';
import { useRouter } from 'next/router';
import ConfirmationDialog from '../shared/ConfirmationDialog';
import { WithLoadingAndError } from '@/components/shared';
import CreateNode from './CreateNode';

const Nodes = () => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [node, setNode] = useState<Node | null>(null);
  const { isLoading, isError, nodes, mutateNodes } = useNodes();
  const [askConfirmation, setAskConfirmation] = useState(false);
  const [createNodeVisible, setCreateNodeVisible] = useState(false);

  const { newNode } = router.query as { newNode: string };

  useEffect(() => {
    if (newNode) {
      setCreateNodeVisible(true);
    }
  }, [newNode]);

  const leaveNode = async (node: Node) => {
    const response = await fetch(`/api/nodes/${node.slug}/members`, {
      method: 'PUT',
      headers: defaultHeaders,
    });

    const json = (await response.json()) as ApiResponse;

    if (!response.ok) {
      toast.error(json.error.message);
      return;
    }

    toast.success(t('leave-node-success'));
    mutateNodes();
  };

  return (
    <WithLoadingAndError isLoading={isLoading} error={isError}>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="space-y-3">
            <h2 className="text-xl font-medium leading-none tracking-tight">
              {t('all-nodes')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('node-listed')}
            </p>
          </div>
          <Button
            color="primary"
            variant="outline"
            size="md"
            onClick={() => setCreateNodeVisible(!createNodeVisible)}
          >
            {t('create-node')}
          </Button>
        </div>
        <table className="text-sm table w-full border-b dark:border-base-200">
          <thead className="bg-base-200">
            <tr>
              <th>{t('name')}</th>
              <th>{t('members')}</th>
              <th>{t('created-at')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {nodes &&
              nodes.map((node) => {
                return (
                  <tr key={node.id}>
                    <td>
                      <Link href={`/nodes/${node.slug}/members`}>
                        <div className="flex items-center justify-start space-x-2">
                          <LetterAvatar name={node.name} />
                          <span className="underline">{node.name}</span>
                        </div>
                      </Link>
                    </td>
                    <td>{node._count.members}</td>
                    <td>{new Date(node.createdAt).toDateString()}</td>
                    <td>
                      <Button
                        variant="outline"
                        size="xs"
                        color="error"
                        onClick={() => {
                          setNode(node);
                          setAskConfirmation(true);
                        }}
                      >
                        {t('leave-node')}
                      </Button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
        <ConfirmationDialog
          visible={askConfirmation}
          title={`${t('leave-node')} ${node?.name}`}
          onCancel={() => setAskConfirmation(false)}
          onConfirm={() => {
            if (node) {
              leaveNode(node);
            }
          }}
          confirmText={t('leave-node')}
        >
          {t('leave-node-confirmation')}
        </ConfirmationDialog>
        <CreateNode
          visible={createNodeVisible}
          setVisible={setCreateNodeVisible}
        />
      </div>
    </WithLoadingAndError>
  );
};

export default Nodes;
