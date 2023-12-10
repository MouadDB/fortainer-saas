import { Card } from '@/components/shared';
import { Error, Loading } from '@/components/shared';
import { NodeTab } from '@/components/node';
import env from '@/lib/env';
import { inferSSRProps } from '@/lib/inferSSRProps';
import { getViewerToken } from '@/lib/retraced';
import { getSession } from '@/lib/session';
import useCanAccess from 'hooks/useCanAccess';
import useNode from 'hooks/useNode';
import { getNodeMember } from 'models/node';
import { throwIfNotAllowed } from 'models/user';
import { GetServerSidePropsContext } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import dynamic from 'next/dynamic';
import type { NextPageWithLayout } from 'types';

interface RetracedEventsBrowserProps {
  host: string;
  auditLogToken: string;
  header: string;
}

const RetracedEventsBrowser = dynamic<RetracedEventsBrowserProps>(
  () => import('@retracedhq/logs-viewer'),
  {
    ssr: false,
  }
);

const Events: NextPageWithLayout<inferSSRProps<typeof getServerSideProps>> = ({
  auditLogToken,
  retracedHost,
  error,
  nodeFeatures,
}) => {
  const { t } = useTranslation('common');
  const { canAccess } = useCanAccess();
  const { isLoading, isError, node } = useNode();

  if (isLoading) {
    return <Loading />;
  }

  if (isError || error) {
    return <Error message={isError?.message || error?.message} />;
  }

  if (!node) {
    return <Error message={t('node-not-found')} />;
  }

  return (
    <>
      <NodeTab activeTab="audit-logs" node={node} nodeFeatures={nodeFeatures} />
      <Card>
        <Card.Body>
          {canAccess('node_audit_log', ['read']) && auditLogToken && (
            <RetracedEventsBrowser
              host={`${retracedHost}/viewer/v1`}
              auditLogToken={auditLogToken}
              header={t('audit-logs')}
            />
          )}
        </Card.Body>
      </Card>
    </>
  );
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  if (!env.nodeFeatures.auditLog) {
    return {
      notFound: true,
    };
  }

  const { locale, req, res, query } = context;

  const session = await getSession(req, res);
  const nodeMember = await getNodeMember(
    session?.user.id as string,
    query.slug as string
  );

  try {
    throwIfNotAllowed(nodeMember, 'node_audit_log', 'read');

    const auditLogToken = await getViewerToken(
      nodeMember.node.id,
      session?.user.id as string
    );

    return {
      props: {
        ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
        error: null,
        auditLogToken: auditLogToken ?? '',
        retracedHost: env.retraced.url ?? '',
        nodeFeatures: env.nodeFeatures,
      },
    };
  } catch (error: unknown) {
    const { message } = error as { message: string };
    return {
      props: {
        ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
        error: {
          message,
        },
        auditLogToken: null,
        retracedHost: null,
        nodeFeatures: env.nodeFeatures,
      },
    };
  }
}

export default Events;
