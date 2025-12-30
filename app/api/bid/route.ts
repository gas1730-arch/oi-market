import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adminAuth, adminDb } from '../../../lib/firebaseAdmin'

function getMinIncrement(current: number) {
  if (current < 10000) return 10
  if (current < 100000) return 100
  return 1000
}

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
  const { itemId, amount } = body as { itemId?: string; amount?: number }
  if (!itemId || typeof amount !== 'number') return NextResponse.json({ error: 'invalid' }, { status: 400 })

  const itemRef = adminDb.collection('items').doc(itemId)

  try {
    const res = await adminDb.runTransaction(async (tx: any) => {
      const snap = await tx.get(itemRef)
      if (!snap.exists) throw { code: 'not-found' }
      const item = snap.data()
      if (!item) throw { code: 'not-found' }
      if (item.saleType !== 'AUCTION') throw { code: 'not-auction' }
      if (item.status !== 'OPEN') throw { code: 'not-open' }

      const now = Date.now()
      const endsAt = (item.endsAt?.seconds || 0) * 1000
      if (endsAt <= now) throw { code: 'ended' }

      const current = item.currentPrice || item.startPrice || 0
      const minInc = getMinIncrement(current)
      if (amount <= current) throw { code: 'too-low' }
      if ((amount - current) < minInc) throw { code: 'insufficient-increment', minInc }

      // 즉시구매 처리
      if (item.buyNowPrice && amount >= item.buyNowPrice) {
        tx.update(itemRef, {
          status: 'SOLD',
          currentPrice: amount,
          highestBidderId: uid,
          bidCount: (item.bidCount || 0) + 1,
          endedAt: { seconds: Math.floor(now / 1000), nanoseconds: 0 },
        })
        const bidRef = itemRef.collection('bids').doc()
        tx.set(bidRef, {
          bidderId: uid,
          amount,
          createdAt: { seconds: Math.floor(now / 1000), nanoseconds: 0 },
        })
        return { status: 'sold' }
      }

      // 일반 입찰 처리: currentPrice / highestBidderId / bidCount 갱신
      tx.update(itemRef, {
        currentPrice: amount,
        highestBidderId: uid,
        bidCount: (item.bidCount || 0) + 1,
      })
      const bidRef = itemRef.collection('bids').doc()
      tx.set(bidRef, {
        bidderId: uid,
        amount,
        createdAt: { seconds: Math.floor(now / 1000), nanoseconds: 0 },
      })

      return { status: 'accepted' }
    })

    return NextResponse.json(res)
  } catch (err: any) {
    const code = err?.code || 'error'
    return NextResponse.json({ error: code, detail: err?.message || null }, { status: 400 })
  }
}
