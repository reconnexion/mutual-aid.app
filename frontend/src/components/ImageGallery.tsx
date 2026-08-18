import { Image } from 'antd';

type Props = {
  images: string[];
};

const GAP = 4;
const HEIGHT = 260;

/** A gallery matching the classic "hero + stacked thumbnails" listing layout: one large photo on
 *  the left, up to two smaller ones stacked on the right, with a "+N photos" overlay on the last
 *  thumbnail when there are more. Falls back to a single image or a simple 2-up row below 3
 *  photos. Every photo (including ones only reachable via the "+N" overlay) opens the same
 *  click-through lightbox, via Antd's `Image.PreviewGroup`. */
const ImageGallery = ({ images }: Props) => {
  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <Image.PreviewGroup>
        <Image src={images[0]} style={{ width: '100%', maxHeight: HEIGHT, objectFit: 'cover', borderRadius: 8 }} />
      </Image.PreviewGroup>
    );
  }

  if (images.length === 2) {
    return (
      <Image.PreviewGroup>
        <div style={{ display: 'flex', gap: GAP, height: HEIGHT, borderRadius: 8, overflow: 'hidden' }}>
          {images.map((src, i) => (
            <Image key={i} src={src} style={{ flex: 1, minWidth: 0, height: '100%', objectFit: 'cover' }} />
          ))}
        </div>
      </Image.PreviewGroup>
    );
  }

  const extra = images.length - 3;

  return (
    <Image.PreviewGroup>
      <div style={{ display: 'flex', gap: GAP, height: HEIGHT, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ flex: 2, minWidth: 0, height: '100%' }}>
          <Image src={images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: GAP, height: '100%' }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Image src={images[1]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            <Image src={images[2]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {extra > 0 && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 600,
                  pointerEvents: 'none'
                }}
              >
                +{extra} photo{extra > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
        {images.slice(3).map((src, i) => (
          <Image key={i + 3} src={src} style={{ display: 'none' }} />
        ))}
      </div>
    </Image.PreviewGroup>
  );
};

export default ImageGallery;
