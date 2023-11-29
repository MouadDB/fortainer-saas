import { Card } from '@/components/shared';
import { Node } from '@prisma/client';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { Button } from 'react-daisyui';
import toast from 'react-hot-toast';

import ConfirmationDialog from '../shared/ConfirmationDialog';
import { defaultHeaders } from '@/lib/common';
import type { ApiResponse } from 'types';

interface RemoveNodeProps {
  node: Node;
  allowDelete: boolean;
}

const RemoveNode = ({ node, allowDelete }: RemoveNodeProps) => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [loading, setLoading] = useState(false);
  const [askConfirmation, setAskConfirmation] = useState(false);

  const removeNode = async () => {
    setLoading(true);

    const response = await fetch(`/api/nodes/${node.slug}`, {
      method: 'DELETE',
      headers: defaultHeaders,
    });

    const json = (await response.json()) as ApiResponse;

    setLoading(false);

    if (!response.ok) {
      toast.error(json.error.message);
      return;
    }

    toast.success(t('node-removed-successfully'));
    router.push('/nodes');
  };

  return (
    <>
      <Card>
        <Card.Body>
          <Card.Header>
            <Card.Title>{t('remove-node')}</Card.Title>
            <Card.Description>
              {allowDelete
                ? t('remove-node-warning')
                : t('remove-node-restricted')}
            </Card.Description>
          </Card.Header>
        </Card.Body>
        {allowDelete && (
          <Card.Footer>
            <Button
              color="error"
              onClick={() => setAskConfirmation(true)}
              loading={loading}
              variant="outline"
              size="md"
            >
              {t('remove-node')}
            </Button>
          </Card.Footer>
        )}
      </Card>
      {allowDelete && (
        <ConfirmationDialog
          visible={askConfirmation}
          title={t('remove-node')}
          onCancel={() => setAskConfirmation(false)}
          onConfirm={removeNode}
        >
          {t('remove-node-confirmation')}
        </ConfirmationDialog>
      )}
    </>
  );
};

export default RemoveNode;
