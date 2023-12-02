import fetcher from '@/lib/fetcher';
import type { Permission } from '@/lib/permissions';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import type { ApiResponse } from 'types';

const usePermissions = () => {
  const router = useRouter();
  const [nodeSlug, setNodeSlug] = useState<string | null>(null);

  const { slug } = router.query as { slug: string };

  useEffect(() => {
    if (slug) {
      setNodeSlug(slug);
    }
  }, [router.query, slug]);

  const { data, error, isLoading } = useSWR<ApiResponse<Permission[]>>(
    nodeSlug ? `/api/nodes/${nodeSlug}/permissions` : null,
    fetcher
  );

  return {
    isLoading,
    isError: error,
    permissions: data?.data,
  };
};

export default usePermissions;
