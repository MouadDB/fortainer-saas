import fetcher from '@/lib/fetcher';
import type { NodeMember, User } from '@prisma/client';
import useSWR, { mutate } from 'swr';
import type { ApiResponse } from 'types';

export type NodeMemberWithUser = NodeMember & { user: User };

const useNodeMembers = (slug: string) => {
  const url = `/api/nodes/${slug}/members`;

  const { data, error, isLoading } = useSWR<ApiResponse<NodeMemberWithUser[]>>(
    url,
    fetcher
  );

  const mutateNodeMembers = async () => {
    mutate(url);
  };

  return {
    isLoading,
    isError: error,
    members: data?.data,
    mutateNodeMembers,
  };
};

export default useNodeMembers;
