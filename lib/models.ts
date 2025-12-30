export type SaleType = 'AUCTION' | 'NORMAL'

export type AuctionStatus = 'OPEN' | 'ENDED' | 'SOLD'
export type NormalStatus = 'OPEN' | 'RESERVED' | 'SOLD'

export interface ItemBase {
  ownerId: string
  saleType: SaleType
  title: string
  description: string
  region: string
  images: string[]
  createdAt: { seconds: number; nanoseconds: number }
}

export interface AuctionItem extends ItemBase {
  saleType: 'AUCTION'
  status: AuctionStatus
  startPrice: number
  buyNowPrice?: number
  currentPrice: number
  highestBidderId?: string
  bidCount: number
  endsAt: { seconds: number; nanoseconds: number }
  endedAt?: { seconds: number; nanoseconds: number }
}

export interface NormalItem extends ItemBase {
  saleType: 'NORMAL'
  status: NormalStatus
  normalPrice: number
  reservedByUid?: string
  soldToUid?: string
  reservedAt?: { seconds: number; nanoseconds: number }
  soldAt?: { seconds: number; nanoseconds: number }
}

export interface Bid {
  bidderId: string
  amount: number
  createdAt: { seconds: number; nanoseconds: number }
}
