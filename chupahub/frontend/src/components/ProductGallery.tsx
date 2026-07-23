'use client';

import { useState } from 'react';

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] || '/placeholder-product.png';
  return <div className="min-w-0">
    <div className="flex h-[clamp(28rem,48vw,37.5rem)] items-center justify-center rounded-3xl bg-white p-[clamp(1.25rem,4vw,3rem)] ring-1 ring-orange-100">
      <img src={current} alt={name} className="h-[92%] w-[92%] object-contain object-center" />
    </div>
    {images.length > 1 && <div className="mt-3 flex gap-3 overflow-x-auto pb-1" aria-label="Product images">
      {images.map((image, index) => <button key={image} type="button" onClick={() => setActive(index)} aria-label={`View image ${index + 1}`} className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-white p-2 ring-2 ${active === index ? 'ring-brand-orange' : 'ring-orange-100'}`}><img src={image} alt="" className="h-full w-full object-contain" /></button>)}
    </div>}
  </div>;
}
