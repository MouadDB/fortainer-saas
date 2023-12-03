import { Loading } from '@/components/shared';
import useNodes from 'hooks/useNodes';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import type { NextPageWithLayout } from 'types';

const Dashboard: NextPageWithLayout = () => {
  const router = useRouter();
  const { nodes, isLoading } = useNodes();

  useEffect(() => {
    if (isLoading || !nodes) {
      return;
    }

    if (nodes.length > 0) {
      router.push(`/nodes/${nodes[0].slug}/settings`);
    } else {
      router.push('nodes?newNode=true');
    }
  }, [isLoading, router, nodes]);

  return <Loading />;
};

export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default Dashboard;
