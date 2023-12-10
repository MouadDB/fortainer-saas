import { Error, Loading } from '@/components/shared';
import { NodeTab } from '@/components/node';
import useNode from 'hooks/useNode';
import { GetServerSidePropsContext } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { toast } from 'react-hot-toast';
import env from '@/lib/env';
import { DirectoriesWrapper } from '@boxyhq/react-ui/dsync';
import styles from 'styles/sdk-override.module.css';

const DSYNC_CSS = {
  button: { ctoa: 'btn-primary', destructive: 'btn-error' },
  input: `${styles['sdk-input']} input input-bordered`,
  textarea: styles['sdk-input'],
  confirmationPrompt: {
    button: {
      ctoa: 'btn-md',
      cancel: 'btn-md btn-outline',
    },
  },
  secretInput: 'input input-bordered',
  section: 'mb-8',
};

const DirectorySync = ({ nodeFeatures }) => {
  const { isLoading, isError, node } = useNode();
  const { t } = useTranslation('common');

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
      <NodeTab
        activeTab="directory-sync"
        node={node}
        nodeFeatures={nodeFeatures}
      />
      <DirectoriesWrapper
        classNames={DSYNC_CSS}
        componentProps={{
          directoryList: { cols: ['name', 'type', 'status', 'actions'] },
          createDirectory: {
            excludeFields: [
              'product',
              'tenant',
              'webhook_secret',
              'webhook_url',
              'log_webhook_events',
            ],
          },
          editDirectory: {
            excludeFields: [
              'webhook_url',
              'webhook_secret',
              'log_webhook_events',
            ],
          },
        }}
        urls={{
          get: `/api/nodes/${node.slug}/dsync`,
          post: `/api/nodes/${node.slug}/dsync`,
          patch: `/api/nodes/${node.slug}/dsync`,
          delete: `/api/nodes/${node.slug}/dsync`,
        }}
        successCallback={({ operation }) => {
          if (operation === 'CREATE') {
            toast.success(`Connection created successfully.`);
          } else if (operation === 'UPDATE') {
            toast.success(`Connection updated successfully.`);
          } else if (operation === 'DELETE') {
            toast.success(`Connection deleted successfully.`);
          } else if (operation === 'COPY') {
            toast.success(`Contents copied to clipboard`);
          }
        }}
        errorCallback={(errMessage) => toast.error(errMessage)}
      />
    </>
  );
};

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  if (!env.nodeFeatures.dsync) {
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

export default DirectorySync;
