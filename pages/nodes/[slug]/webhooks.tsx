import { Error, Loading } from '@/components/shared';
import { NodeTab } from '@/components/node';
import { Webhooks } from '@/components/webhook';
import useNode from 'hooks/useNode';
import { GetServerSidePropsContext } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import env from '@/lib/env';

const WebhookList = ({ nodeFeatures }) => {
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
      <NodeTab activeTab="webhooks" node={node} nodeFeatures={nodeFeatures} />
      <Webhooks node={node} />
    </>
  );
};

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  if (!env.nodeFeatures.webhook) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
      nodeFeatures: env.nodeFeatures,
    },
  };
}

export default WebhookList;
