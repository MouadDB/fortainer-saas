import { PendingInvitations } from '@/components/invitation';
import { Error, Loading } from '@/components/shared';
import { Members, NodeTab } from '@/components/node';
import env from '@/lib/env';
import useNode from 'hooks/useNode';
import { GetServerSidePropsContext } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const NodeMembers = ({ nodeFeatures }) => {
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
      <NodeTab activeTab="members" node={node} nodeFeatures={nodeFeatures} />
      <div className="space-y-6">
        <Members node={node} />
        <PendingInvitations node={node} />
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

export default NodeMembers;
