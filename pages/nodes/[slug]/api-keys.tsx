import APIKeysContainer from '@/components/apiKey/APIKeysContainer';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import env from '@/lib/env';

const APIKeys = ({ nodeFeatures }) => {
  return <APIKeysContainer nodeFeatures={nodeFeatures} />;
};

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  if (!env.nodeFeatures.apiKey) {
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

export default APIKeys;
