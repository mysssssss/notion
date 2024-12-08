import liveblocks from '@/lib/liveblocks';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../firebase-admin';

export async function POST(req: NextRequest) {
  const { userId, sessionClaims } = await auth();
  const { room } = await req.json();
  const session = liveblocks.prepareSession(sessionClaims?.email!, {
    userInfo: {
      name: sessionClaims?.fullName!,
      email: sessionClaims?.email!,
      avatar: sessionClaims?.image!,
    },
  });

  const usersInRoom = await adminDb
    .collectionGroup('rooms')
    .where('userId', '==', sessionClaims?.email)
    .get();

  const userInRoom = usersInRoom.docs.find((doc) => doc.id == room);

  if (!userId) {
    redirect('/');
  }
  if (userInRoom?.exists) {
    session.allow(room, session.FULL_ACCESS);
    const { body, status } = await session.authorize();

    return new Response(body, { status });
  } else {
    return NextResponse.json(
      {
        message: 'you are not in this room',
      },
      { status: 403 }
    );
  }
}
