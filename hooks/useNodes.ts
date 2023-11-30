import fetcher from '@/lib/fetcher';
import useSWR, { mutate } from 'swr';
import type { ApiResponse, NodeWithMemberCount } from 'types';

const useNodes = () => {
  const url = `/api/nodes`;

  const { data, error, isLoading } = useSWR<ApiResponse<NodeWithMemberCount[]>>(
    url,
    fetcher
  );

  const mutateNodes = async () => {
    mutate(url);
  };

  return {
    isLoading,
    isError: error,
    nodes: data?.data,
    mutateNodes,
  };
};

export default useNodes;
