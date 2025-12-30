"use client"

import Image from "next/image";
import { useState } from "react";
import type { AuctionItem } from "../lib/models";

const initialAuctions: AuctionItem[] = [
  {
    ownerId: "owner1",
    saleType: "AUCTION",
    title: "신선한 오이 1kg",
    description: "아침에 수확한 신선한 오이입니다.",
    region: "강원도",
    images: ["/cucumber.jpg"],
    createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
    status: "OPEN",
    startPrice: 1000,
    buyNowPrice: 5000,
    currentPrice: 1000,
    bidCount: 0,
    endsAt: { seconds: Math.floor(Date.now() / 1000) + 3600, nanoseconds: 0 },
  },
  {
    ownerId: "owner2",
    saleType: "AUCTION",
    title: "유기농 오이 세트",
    description: "무농약 재배, 맛있는 오이 세트입니다.",
    region: "전라도",
    images: ["/cucumber2.jpg"],
    createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
    status: "OPEN",
    startPrice: 2000,
    buyNowPrice: 8000,
    currentPrice: 2000,
    bidCount: 0,
    endsAt: { seconds: Math.floor(Date.now() / 1000) + 7200, nanoseconds: 0 },
  },
];

export default function Home() {
  const [items, setItems] = useState<AuctionItem[]>(initialAuctions);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleBuyNow(index: number) {
    const item = items[index];
    if (!item || item.status !== "OPEN" || !item.buyNowPrice) return;
    setLoadingId(item.title);

    // Try to call server API first
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const res = await fetch('/api/bid', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ itemId: item.title, amount: item.buyNowPrice }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.status === 'sold' || data?.status === 'accepted') {
          // 성공: 상태 업데이트
          const newItems = [...items];
          newItems[index] = { ...item, status: 'SOLD', currentPrice: item.buyNowPrice } as AuctionItem;
          setItems(newItems);
          setLoadingId(null);
          alert('즉시 구매가 완료되었습니다.');
          return;
        }
      } else if (res.status === 401) {
        // 인증 필요: 개발 모드에서는 로컬 상태로 처리
        const newItems = [...items];
        newItems[index] = { ...item, status: 'SOLD', currentPrice: item.buyNowPrice } as AuctionItem;
        setItems(newItems);
        setLoadingId(null);
        alert('로그인 필요 (개발 모드): 로컬에서 즉시 구매 처리했습니다.');
        return;
      }

      // 그 외 실패는 로컬 처리
      const newItems = [...items];
      newItems[index] = { ...item, status: 'SOLD', currentPrice: item.buyNowPrice } as AuctionItem;
      setItems(newItems);
      setLoadingId(null);
      alert('서버 호출 실패: 로컬에서 즉시 구매 처리했습니다.');
    } catch (e) {
      const newItems = [...items];
      newItems[index] = { ...item, status: 'SOLD', currentPrice: item.buyNowPrice } as AuctionItem;
      setItems(newItems);
      setLoadingId(null);
      alert('오류 발생: 로컬에서 즉시 구매 처리했습니다.');
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans p-8">
      <header className="max-w-4xl mx-auto mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">오이마켓</h1>
        <div className="text-sm text-zinc-600">경매 / 즉시구매 샘플</div>
      </header>

      <main className="max-w-4xl mx-auto grid gap-6">
        {items.map((it, idx) => (
          <article key={it.title} className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm">
            <div className="w-28 h-28 relative flex-shrink-0 rounded-md bg-zinc-100 overflow-hidden">
              {it.images[0] ? (
                // 이미지 파일이 public에 없을 수 있어 간단한 <img>로 렌더링
                <img src={it.images[0]} alt={it.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400">이미지</div>
              )}
            </div>
            <div className="flex flex-1 flex-col">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{it.title}</h2>
                <div className="text-sm text-zinc-500">{it.region}</div>
              </div>
              <p className="text-sm text-zinc-600 mt-1">{it.description}</p>
              <div className="mt-3 flex items-center gap-4">
                <div className="text-sm text-zinc-500">현재가: <span className="font-medium">{it.currentPrice}원</span></div>
                {it.buyNowPrice && <div className="text-sm text-zinc-500">즉시구매: <span className="font-medium">{it.buyNowPrice}원</span></div>}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                className="rounded-md bg-green-600 px-4 py-2 text-white disabled:opacity-50"
                onClick={() => handleBuyNow(idx)}
                disabled={it.status !== 'OPEN' || loadingId === it.title}
              >
                {loadingId === it.title ? '처리중...' : '즉시 구매'}
              </button>
              <div className="text-xs text-zinc-500">상태: {it.status}</div>
            </div>
          </article>
        ))}
      </main>
    </div>
  );
}
