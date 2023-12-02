import { Role, NodeMember } from '@prisma/client';
import type { User } from 'next-auth';

export const isNodeAdmin = (user: User, members: NodeMember[]) => {
  return (
    members.filter(
      (member) =>
        member.userId === user.id &&
        (member.role === Role.ADMIN || member.role === Role.OWNER)
    ).length > 0
  );
};
