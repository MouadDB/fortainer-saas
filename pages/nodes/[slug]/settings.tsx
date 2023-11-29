import { Error, Loading } from '@/components/shared';
import { AccessControl } from '@/components/shared/AccessControl';
import { RemoveNode, NodeSettings, NodeTab } from '@/components/node';
import env from '@/lib/env';
import useNode from 'hooks/useNode';
import type { GetServerSidePropsContext } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { NodeFeature } from 'types';

const Settings = ({ nodeFeatures }: { nodeFeatures: NodeFeature }) => {
  const { t } = useTranslation('common');
  const { isLoading, isError, node } = useNode();

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <Error message={isError.message} />;
  }

  if (!node) {
    return <Error message={t('node-not-found')} />;
  }

  return (
    <>
      <NodeTab activeTab="settings" node={node} nodeFeatures={nodeFeatures} />
      <div className="space-y-6">
        <NodeSettings node={node} />
        <AccessControl resource="node" actions={['delete']}>
          <RemoveNode node={node} allowDelete={nodeFeatures.deleteNode} />
        </AccessControl>
      </div>
    </>
  );
};

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
      nodeFeatures: env.nodeFeatures,
    },
  };
}

export default Settings;
