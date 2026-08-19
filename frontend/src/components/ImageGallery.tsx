import { Image } from 'antd';

type Props = {
  images: string[];
};

const GAP = 4;
const HEIGHT = 260;

// No hover mask (eye icon + "Aperçu" label + darkened background) — the images already look
// clickable in this layout, the mask was just visual noise. `cursor: pointer` on the image
// itself is what now signals that, since the mask isn't there to imply it anymore.
const NO_MASK = { mask: null };
const IMG_STYLE = { width: '100%', height: '100%', objectFit: 'cover' as const, cursor: 'pointer' as const };

/** A gallery matching the classic "hero + stacked thumbnails" listing layout: one large photo on
 *  the left, up to two smaller ones stacked on the right, with a "+N photos" overlay on the last
 *  thumbnail when there are more. Falls back to a single image or a simple 2-up row below 3
 *  photos. Every photo (including ones only reachable via the "+N" overlay) opens the same
 *  click-through lightbox, via Antd's `Image.PreviewGroup`.
 *
 *  Every photo is both wrapped in its own sized `<div>` *and* given explicit `width`/`height`
 *  props (not just `style`, which only reaches the inner `<img>` — `width`/`height` are what
 *  size Antd's own `.ant-image` wrapper element around it). Without both, that wrapper can end
 *  up unsized on some viewports, letting the image overflow past its container's rounded corners
 *  on one edge only. */
const ImageGallery = ({ images }: Props) => {
  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <Image.PreviewGroup>
        <div style={{ height: HEIGHT, borderRadius: 8, overflow: 'hidden' }}>
          <Image src={images[0]} preview={NO_MASK} width="100%" height="100%" style={IMG_STYLE} />
        </div>
      </Image.PreviewGroup>
    );
  }

  if (images.length === 2) {
    return (
      <Image.PreviewGroup>
        <div style={{ display: 'flex', gap: GAP, height: HEIGHT, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ flex: 2, minWidth: 0, height: '100%' }}>
            <Image src={images[0]} preview={NO_MASK} width="100%" height="100%" style={IMG_STYLE} />
          </div>
          <div style={{ flex: 1, minWidth: 0, height: '100%' }}>
            <Image src={images[1]} preview={NO_MASK} width="100%" height="100%" style={IMG_STYLE} />
          </div>
        </div>
      </Image.PreviewGroup>
    );
  }

  const extra = images.length - 3;

  return (
    <Image.PreviewGroup>
      <div style={{ display: 'flex', gap: GAP, height: HEIGHT, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ flex: 2, minWidth: 0, height: '100%' }}>
          <Image src={images[0]} preview={NO_MASK} width="100%" height="100%" style={IMG_STYLE} />
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: GAP, height: '100%' }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Image src={images[1]} preview={NO_MASK} width="100%" height="100%" style={IMG_STYLE} />
          </div>
          <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            <Image src={images[2]} preview={NO_MASK} width="100%" height="100%" style={IMG_STYLE} />
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
