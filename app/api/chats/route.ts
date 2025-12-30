import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adminAuth, adminDb } from '../../../lib/firebaseAdmin'

async function verifyToken(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const m = auth.match(/^Bearer (.+)$/)
  if (!m) return null
  try {
    const decoded = await adminAuth.verifyIdToken(m[1])
    return decoded.uid
  } catch (e) {
    return null
  }
}

export async function POST(req: NextRequest) {
  const uid = await verifyToken(req)
  if (!uid) return NextResponse.json({ error: 'auth-required' }, { status: 401 })

  const body = await req.json()
  const { itemId } = body as { itemId?: string }
  if (!itemId) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  const itemRef = adminDb.collection('items').doc(itemId)
  const itemSnap = await itemRef.get()
  if (!itemSnap.exists) return NextResponse.json({ error: 'not-found' }, { status: 404 })
  const item = itemSnap.data()
  if (!item) return NextResponse.json({ error: 'not-found' }, { status: 404 })

  // AUCTION: 채팅은 낙찰 확정 후 활성화 (판매자 + 낙찰자만)
  if (item.saleType === 'AUCTION') {
    if (item.status !== 'SOLD') return NextResponse.json({ error: 'auction-chat-not-allowed' }, { status: 403 })
    const sellerId = item.ownerId
    const buyerId = item.highestBidderId
    if (!buyerId) return NextResponse.json({ error: 'no-winner' }, { status: 400 })
    // 채팅방 id 규칙: `auction-${itemId}`
    const chatId = `auction-${itemId}`
    const chatRef = adminDb.collection('chats').doc(chatId)
    const chatSnap = await chatRef.get()
    if (!chatSnap.exists) {
      await chatRef.set({
        itemId,
        sellerId,
        otherUid: buyerId,
        saleType: 'AUCTION',
        createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
        lastMessage: null,
        lastMessageAt: null,
      })
    }
    // 참여자 확인: 요청자만 읽기/쓰기
    if (uid !== sellerId && uid !== buyerId) return NextResponse.json({ error: 'not-participant' }, { status: 403 })
    return NextResponse.json({ chatId })
  }

  // NORMAL: 누구나(로그인 사용자) 판매자에게 채팅 시작 요청 가능
  if (item.saleType === 'NORMAL') {
    const sellerId = item.ownerId
    if (uid === sellerId) return NextResponse.json({ error: 'cannot-chat-self' }, { status: 400 })
    const chatQuery = await adminDb.collection('chats')
      .where('itemId', '==', itemId)
      .where('sellerId', '==', sellerId)
      .where('otherUid', '==', uid)
      .limit(1)
      .get()
    if (!chatQuery.empty) {
      const existing = chatQuery.docs[0]
      return NextResponse.json({ chatId: existing.id })
    }
    const chatRef = adminDb.collection('chats').doc()
    await chatRef.set({
      itemId,
      sellerId,
      otherUid: uid,
      saleType: 'NORMAL',
      createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
      lastMessage: null,
      lastMessageAt: null,
    })
    return NextResponse.json({ chatId: chatRef.id })
  }

  return NextResponse.json({ error: 'unsupported' }, { status: 400 })
}
