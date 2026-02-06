'use client';

import { useFirestore, useDoc, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { doc } from 'firebase/firestore';
import { Button } from '../ui/button';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMemo } from 'react';

interface UserProfile {
    subscription?: 'Básico' | 'Pro' | 'Invitado';
    createdAt?: { toDate: () => Date };
}

export function TrialBadge() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore || user.isAnonymous) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const trialDaysRemaining = useMemo(() => {
    if (!userProfile?.createdAt || userProfile?.subscription !== 'Invitado') {
        return null;
    }
    
    const registrationDate = userProfile.createdAt.toDate();
    const trialEndDate = new Date(registrationDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    
    if (now > trialEndDate) {
        return 0;
    }
    
    const diffTime = Math.abs(trialEndDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }, [userProfile]);

  if (!user || user.isAnonymous || trialDaysRemaining === null || trialDaysRemaining <= 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild variant="ghost" className="relative h-10 w-10 rounded-full">
            <Link href="/suscripcion">
              <Bell className="h-5 w-5" />
              <Badge variant="destructive" className="absolute top-1 right-1 h-5 w-5 p-0 justify-center rounded-full text-xs">
                {trialDaysRemaining}
              </Badge>
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Quedan {trialDaysRemaining} {trialDaysRemaining === 1 ? 'día' : 'días'} de tu prueba gratuita.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
