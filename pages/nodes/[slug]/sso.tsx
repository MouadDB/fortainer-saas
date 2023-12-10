import { Error, Loading } from '@/components/shared';
import { NodeTab } from '@/components/node';
import { ConnectionsWrapper } from '@boxyhq/react-ui/sso';
import useNode from 'hooks/useNode';
import { GetServerSidePropsContext } from 'next';
import { useTranslation } from 'next-i18next';
import toast from 'react-hot-toast';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import styles from 'styles/sdk-override.module.css';
import env from '@/lib/env';

const SSO_CSS = {
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

const NodeSSO = ({ nodeFeatures, SPConfigURL }) => {
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
      <NodeTab activeTab="sso" node={node} nodeFeatures={nodeFeatures} />
      <ConnectionsWrapper
        urls={{
          spMetadata: SPConfigURL,
          get: `/api/nodes/${node.slug}/sso`,
          post: `/api/nodes/${node.slug}/sso`,
          patch: `/api/nodes/${node.slug}/sso`,
          delete: `/api/nodes/${node.slug}/sso`,
        }}
        successCallback={({
          operation,
          connectionIsSAML,
          connectionIsOIDC,
        }) => {
          const ssoType = connectionIsSAML
            ? 'SAML'
            : connectionIsOIDC
              ? 'OIDC'
              : '';
          if (operation === 'CREATE') {
            toast.success(`${ssoType} connection created successfully.`);
          } else if (operation === 'UPDATE') {
            toast.success(`${ssoType} connection updated successfully.`);
          } else if (operation === 'DELETE') {
            toast.success(`${ssoType} connection deleted successfully.`);
          } else if (operation === 'COPY') {
            toast.success(`Contents copied to clipboard`);
          }
        }}
        errorCallback={(errMessage) => toast.error(errMessage)}
        classNames={SSO_CSS}
        componentProps={{
          connectionList: {
            cols: ['provider', 'type', 'status', 'actions'],
          },
          editOIDCConnection: { displayInfo: false },
          editSAMLConnection: { displayInfo: false },
        }}
      />
    </>
  );
};

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  if (!env.nodeFeatures.sso) {
    return {
      notFound: true,
    };
  }

  const SPConfigURL = env.jackson.selfHosted
    ? `${env.jackson.url}/well-known/saml-configuration`
    : '/well-known/saml-configuration';

  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
      nodeFeatures: env.nodeFeatures,
      SPConfigURL,
    },
  };
}

export default NodeSSO;
