import fetcher from '@/lib/fetcher';
import type { Node } from '@prisma/client';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import type { ApiResponse } from 'types';

const useNode = (slug?: string) => {
  const { query, isReady } = useRouter();

  const nodeSlug = slug || (isReady ? query.slug : null);

  const { data, error, isLoading } = useSWR<ApiResponse<Node>>(
    nodeSlug ? `/api/nodes/${nodeSlug}` : null,
    fetcher
  );

  return {
    isLoading,
    isError: error,
    node: data?.data,
  };
};

export default useNode;
