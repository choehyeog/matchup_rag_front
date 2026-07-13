import { getIllustrationSrc } from '@/lib/illustrations'

interface IllustrationImageProps {
  illustrationKey: string | undefined
  className?: string
  alt?: string
}

export function IllustrationImage({ illustrationKey, className, alt = '' }: IllustrationImageProps) {
  const src = getIllustrationSrc(illustrationKey)
  if (!src) return null
  return <img src={src} alt={alt} className={className} />
}
