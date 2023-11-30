import { Error, LetterAvatar, Loading } from '@/components/shared';
import { Node, NodeMember } from '@prisma/client';
import useCanAccess from 'hooks/useCanAccess';
import useNodeMembers, { NodeMemberWithUser } from 'hooks/useNodeMembers';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'next-i18next';
import { Button } from 'react-daisyui';
import toast from 'react-hot-toast';

import { InviteMember } from '@/components/invitation';
import UpdateMemberRole from './UpdateMemberRole';
import { defaultHeaders } from '@/lib/common';
import type { ApiResponse } from 'types';
import ConfirmationDialog from '../shared/ConfirmationDialog';
import { useState } from 'react';

const Members = ({ node }: { node: Node }) => {
  const { data: session } = useSession();
  const { t } = useTranslation('common');
  const { canAccess } = useCanAccess();
  const [visible, setVisible] = useState(false);
  const [selectedMember, setSelectedMember] =
    useState<NodeMemberWithUser | null>(null);
  const [confirmationDialogVisible, setConfirmationDialogVisible] =
    useState(false);

  const { isLoading, isError, members, mutateNodeMembers } = useNodeMembers(
    node.slug
  );

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <Error message={isError.message} />;
  }

  if (!members) {
    return null;
  }

  const removeNodeMember = async (member: NodeMember | null) => {
    if (!member) return;

    const sp = new URLSearchParams({ memberId: member.userId });

    const response = await fetch(
      `/api/nodes/${node.slug}/members?${sp.toString()}`,
      {
        method: 'DELETE',
        headers: defaultHeaders,
      }
    );

    const json = (await response.json()) as ApiResponse;

    if (!response.ok) {
      toast.error(json.error.message);
      return;
    }

    mutateNodeMembers();
    toast.success(t('member-deleted'));
  };

  const canUpdateRole = (member: NodeMember) => {
    return (
      session?.user.id != member.userId && canAccess('node_member', ['update'])
    );
  };

  const canRemoveMember = (member: NodeMember) => {
    return (
      session?.user.id != member.userId && canAccess('node_member', ['delete'])
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="space-y-3">
          <h2 className="text-xl font-medium leading-none tracking-tight">
            Members
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Node members and their roles.
          </p>
        </div>
        <Button
          color="primary"
          variant="outline"
          size="md"
          onClick={() => setVisible(!visible)}
        >
          {t('add-member')}
        </Button>
      </div>
      <table className="text-sm table w-full border-b dark:border-base-200">
        <thead className="bg-base-200">
          <tr>
            <th>{t('name')}</th>
            <th>{t('email')}</th>
            <th>{t('role')}</th>
            {canAccess('node_member', ['delete']) && <th>{t('action')}</th>}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            return (
              <tr key={member.id}>
                <td>
                  <div className="flex items-center justify-start space-x-2">
                    <LetterAvatar name={member.user.name} />
                    <span>{member.user.name}</span>
                  </div>
                </td>
                <td>{member.user.email}</td>
                <td>
                  {canUpdateRole(member) ? (
                    <UpdateMemberRole node={node} member={member} />
                  ) : (
                    <span>{member.role}</span>
                  )}
                </td>
                <td>
                  {canRemoveMember(member) ? (
                    <Button
                      size="sm"
                      color="error"
                      variant="outline"
                      onClick={() => {
                        setSelectedMember(member);
                        setConfirmationDialogVisible(true);
                      }}
                    >
                      {t('remove')}
                    </Button>
                  ) : (
                    <span>-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <ConfirmationDialog
        visible={confirmationDialogVisible}
        onCancel={() => setConfirmationDialogVisible(false)}
        onConfirm={() => removeNodeMember(selectedMember)}
        title={t('confirm-delete-member')}
      >
        {t('delete-member-warning', {
          name: selectedMember?.user.name,
          email: selectedMember?.user.email,
        })}
      </ConfirmationDialog>
      <InviteMember visible={visible} setVisible={setVisible} node={node} />
    </div>
  );
};

export default Members;
