"use client"

const placeholder = "https://images.unsplash.com/photo-1449333256621-bc90451f0767?auto=format&fit=crop&q=80&w=400";
// Force the provided image URL for testing (fallback will also use this)
const forcedImage = "https://images.unsplash.com/photo-1449333256621-bc90451f0767?auto=format&fit=crop&q=80&w=400";
import { useState } from "react";
import type { AuctionItem } from "../lib/models";

const initialAuctions: AuctionItem[] = [
  {
    ownerId: "owner1",
    saleType: "AUCTION",
    title: "신선한 오이 1kg",
    description: "아침에 수확한 신선한 오이입니다.",
    region: "강원도",
    images: [forcedImage],
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
    images: [forcedImage],
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
  const [query, setQuery] = useState('');
  const categories = ['농산물', '가전', '의류', '가구', '무료나눔'];
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const filtered = items.filter((it) => {
    if (activeCat && activeCat !== '전체' && it.title.indexOf(activeCat) === -1 && it.description.indexOf(activeCat) === -1) return false;
    if (!query) return true;
    return it.title.toLowerCase().includes(query.toLowerCase()) || it.description.toLowerCase().includes(query.toLowerCase());
  });

  function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
      OPEN: 'bg-green-100 text-green-800',
      SOLD: 'bg-gray-100 text-gray-600',
      ENDED: 'bg-gray-100 text-gray-600',
    }
    const cls = map[status] || 'bg-gray-100 text-gray-600'
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{status}</span>
    )
  }

  function fmt(price?: number) {
    if (!price) return '-';
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  }

  function timeLeft(item: AuctionItem) {
    const now = Date.now();
    const ends = (item.endsAt.seconds || 0) * 1000;
    const diff = Math.max(0, ends - now);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}시간 ${minutes}분`;
  }

  async function handleBuyNow(index: number) {
    const item = items[index];
    if (!item || item.status !== 'OPEN' || !item.buyNowPrice) return;
    setLoadingId(item.title);

    // 낙관적 UI: 먼저 로컬 상태 갱신
    const backup = items[index];
    const newItems = [...items];
    newItems[index] = { ...item, status: 'SOLD', currentPrice: item.buyNowPrice } as AuctionItem;
    setItems(newItems);

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

      if (!res.ok) {
        if (res.status === 401) throw new Error('auth-required');
        throw new Error('server-error');
      }

      const data = await res.json();
      if (!(data?.status === 'sold' || data?.status === 'accepted')) throw new Error('accepted-failed');

      setLoadingId(null);
      alert('즉시 구매가 완료되었습니다.');
    } catch (e: any) {
      // 실패하면 롤백
      const revert = [...items];
      revert[index] = backup;
      setItems(revert);
      setLoadingId(null);
      if (e.message === 'auth-required') alert('로그인이 필요합니다. (개발모드: 서버 미연동)');
      else alert('즉시구매에 실패했습니다. 문제를 확인하세요.');
    }
  }

  return (
    <div className="min-h-screen font-sans p-0 bg-[#F2F3F6]">
      {/* Header */}
      <header className="sticky top-0 bg-white shadow-sm z-20">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-3 w-1/3">
            <div className="w-10 h-10 bg-[#2D5A27] rounded-md flex items-center justify-center text-white font-bold">오</div>
            <div className="text-lg font-bold">오이마켓</div>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-[420px]">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="동네, 상품명을 입력해보세요"
                className="w-full border rounded-full px-4 py-2 shadow-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="w-1/3 flex justify-end gap-4">
            <button aria-label="채팅" className="text-gray-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button aria-label="알림" className="text-gray-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 0 0-5-5.917V4a2 2 0 1 0-4 0v1.083A6 6 0 0 0 4 11v3.159c0 .538-.214 1.055-.595 1.436L2 17h5" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 py-6">
        <nav className="flex gap-3 mb-4 overflow-auto">
          <button
            className={`px-3 py-1 rounded-full ${!activeCat ? 'bg-green-100 text-[#2D5A27]' : 'bg-white'}`}
            onClick={() => setActiveCat(null)}
          >전체</button>
          {categories.map((c) => (
            <button
              key={c}
              className={`px-3 py-1 rounded-full ${activeCat === c ? 'bg-green-100 text-[#2D5A27]' : 'bg-white'}`}
              onClick={() => setActiveCat(activeCat === c ? null : c)}
            >{c}</button>
          ))}
        </nav>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((it, idx) => (
            <article key={it.title} className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden flex flex-col items-start gap-4 card-forced-spacing w-full h-full relative translate-y-1 hover:-translate-y-1 hover:shadow-lg transition-transform duration-150">
              <div className="w-full aspect-square bg-gray-200 overflow-hidden rounded-t-2xl">
                <img
                  src={forcedImage}
                  alt={it.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = forcedImage }}
                />
              </div>

              <div className="flex-1 flex flex-col justify-between gap-2 h-full p-4">
                <div>
                  <h3 className="text-black font-extrabold text-lg leading-snug mb-1">{it.title}</h3>
                  <p className="text-sm text-gray-500 mb-2 line-clamp-2">{it.description}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">{it.region} · 남은시간 {timeLeft(it)}</div>
                    <div className="text-lg font-bold text-[#2D5A27] mt-1">{fmt(it.currentPrice)}</div>
                  </div>

                  <div className="flex items-end">
                    <button
                      className="bg-[#2D5A27] hover:bg-[#25481f] text-white px-3 py-1 text-sm rounded-md disabled:opacity-50"
                      onClick={() => handleBuyNow(idx)}
                      disabled={it.status !== 'OPEN' || loadingId === it.title}
                    >
                      {loadingId === it.title ? '처리중...' : '즉시 구매'}
                    </button>
                    <div className="text-xs">
                      <StatusBadge status={it.status} />
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* Bottom navigation bar */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-sm z-40">
          <div className="max-w-[1200px] mx-auto px-4 py-2 flex items-center justify-between gap-4">
            <button className="flex-1 text-center text-sm text-gray-700">🏠<div className="text-xs">홈</div></button>
            <button className="flex-1 text-center text-sm text-gray-700">＋<div className="text-xs">등록</div></button>
            <button className="flex-1 text-center text-sm text-gray-700">👤<div className="text-xs">마이</div></button>
            <button className="flex-1 text-center text-sm text-gray-700">⚙️<div className="text-xs">설정</div></button>
          </div>
        </nav>

        <div className="h-16" />
      </main>
    </div>
  );
}
