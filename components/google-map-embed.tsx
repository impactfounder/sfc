/**
 * components/google-map-embed.tsx
 * 구글 맵 임베드 컴포넌트 (주소를 받아 지도를 표시)
 */
"use client";

interface GoogleMapEmbedProps {
  location: string;
  apiKey: string;
  className?: string;
}

export function GoogleMapEmbed({ location, apiKey, className }: GoogleMapEmbedProps) {
  if (!location) return null;

  // 주소를 URL 인코딩
  const encodedLocation = encodeURIComponent(location);

  // Google Maps Embed API URL
  const mapSrc = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedLocation}&language=ko`;

  return (
    <div className={`w-full h-full min-h-[300px] rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-50 ${className || ""}`}>
      <iframe
        width="100%"
        height="100%"
        style={{ border: 0, minHeight: "300px" }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={mapSrc}
        title="Google Map"
      />
    </div>
  );
}
