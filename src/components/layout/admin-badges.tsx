
'use client';

import { useFirestore, useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { collection, query, where } from 'firebase/firestore';
import { Button } from '../ui/button';
import Link from 'next/link';
import { Gift, Users as UsersIcon } from 'lucide-react';
import { Badge } from '../ui/badge';

export function AdminBadges() {
  const firestore = useFirestore();

  // Queries for admin badges
  const pendingInvitationsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'invitations'), where('status', '==', 'pending'));
  }, [firestore]);

  const pendingUsersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('subscription', '==', 'Invitado'));
  }, [firestore]);

  const { data: pendingInvitations } = useCollection(pendingInvitationsQuery);
  const { data: pendingUsers } = useCollection(pendingUsersQuery);

  const pendingInvitationsCount = pendingInvitations?.length || 0;
  const pendingUsersCount = pendingUsers?.length || 0;

  return (
    <>
      <Button asChild variant="ghost" className="relative h-10 w-10 rounded-full">
        <Link href="/admin/invitaciones">
          <Gift className="h-5 w-5" />
          {pendingInvitationsCount > 0 && (
            <Badge variant="destructive" className="absolute top-1 right-1 h-5 w-5 p-0 justify-center rounded-full text-xs">{pendingInvitationsCount}</Badge>
          )}
        </Link>
      </Button>
      <Button asChild variant="ghost" className="relative h-10 w-10 rounded-full">
        <Link href="/admin/usuarios">
          <UsersIcon className="h-5 w-5" />
          {pendingUsersCount > 0 && (
            <Badge variant="destructive" className="absolute top-1 right-1 h-5 w-5 p-0 justify-center rounded-full text-xs">{pendingUsersCount}</Badge>
          )}
        </Link>
      </Button>
    </>
  );
}
