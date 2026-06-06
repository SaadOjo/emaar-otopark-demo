import type { DigitalSignage } from '../../domain/types'

export function getSignageBoardContent(signage: DigitalSignage): {
  theme: string
  headline: string
  subline: string
  motionAccent?: string
  videoSrc?: string
  embedSrc?: string
  imageSrc?: string
  previewImageSrc?: string
} {
  const content = `${signage.contentTitle} ${signage.template} ${signage.location}`.toUpperCase()

  if (content.includes('STARBUCKS')) {
    return {
      theme: 'campaign',
      headline: 'FREE TALL COFFEE',
      subline: 'STARBUCKS · SELECTED PARKING VISITORS · TODAY ONLY',
      embedSrc: 'https://player.vimeo.com/video/518547289?autoplay=1&muted=1&loop=1&background=1',
      previewImageSrc: 'https://vumbnail.com/518547289.jpg',
      imageSrc: '/signage/starbucks_board.svg',
      motionAccent: 'campaign',
    }
  }

  if (content.includes('ADIDAS')) {
    return {
      theme: 'campaign',
      headline: 'ADIDAS MEMBER OFFER',
      subline: 'SELECTED PERFORMANCE ITEMS · LIMITED TIME',
      videoSrc: '/videos/adidas-offer.mp4',
      imageSrc: '/signage/adidas_campaign.jpg',
      motionAccent: 'adidas',
    }
  }

  if (content.includes('ATASUN')) {
    return {
      theme: 'campaign',
      headline: 'ATASUN OPTIK',
      subline: 'SELECTED FRAMES & SUNGLASSES · IN-STORE ADVANTAGE',
      imageSrc: '/signage/atasun_campaign.jpeg',
      motionAccent: 'campaign',
    }
  }

  if (content.includes('VIP')) {
    return {
      theme: 'vip',
      headline: signage.contentTitle,
      subline: 'FOLLOW THE RESERVED VIP CORRIDOR',
      imageSrc: '/signage/vip_board.svg',
    }
  }

  if (content.includes('VALET')) {
    return {
      theme: 'service',
      headline: signage.contentTitle,
      subline: 'CHECK-IN AND PICKUP LANE AHEAD',
      imageSrc: '/signage/valet_campaign.jpeg',
    }
  }

  if (content.includes('PAYMENT')) {
    return {
      theme: 'service',
      headline: 'PAYMENT KIOSK',
      subline: 'CARD AND MOBILE PAYMENT AVAILABLE AHEAD',
      imageSrc: '/signage/payment_board.svg',
    }
  }

  if (content.includes('FIND YOUR CAR')) {
    return {
      theme: 'guidance',
      headline: 'FIND YOUR CAR',
      subline: 'USE THE KIOSK OR APP FOR QUICK GUIDANCE',
      imageSrc: '/signage/findcar_board.svg',
    }
  }

  if (content.includes('GUIDE') || content.includes('EXIT') || content.includes('DIRECTION')) {
    return {
      theme: 'guidance',
      headline: signage.contentTitle,
      subline: signage.location.toUpperCase(),
      imageSrc: '/signage/guide_board.svg',
    }
  }

  if (content.includes('OFFLINE') || content.includes('SERVICE CHECK') || content.includes('DIAGNOSTICS')) {
    return {
      theme: 'system',
      headline: 'SERVICE CHECK',
      subline: 'TEMPORARILY UNAVAILABLE',
      imageSrc: '/signage/system_board.svg',
    }
  }

  if (content.includes('WELCOME') || content.includes('EMAAR')) {
    return {
      theme: 'welcome',
      headline: signage.contentTitle,
      subline: 'EMAAR SQUARE AVM · ENJOY YOUR VISIT',
      embedSrc: 'https://www.youtube.com/embed/yAeQL0OX6KU?autoplay=1&mute=1&controls=0&loop=1&playlist=yAeQL0OX6KU&modestbranding=1&rel=0',
      previewImageSrc: 'https://img.youtube.com/vi/yAeQL0OX6KU/maxresdefault.jpg',
      imageSrc: '/signage/emaar_welcome_board.svg',
    }
  }

  return {
    theme: 'welcome',
    headline: signage.contentTitle,
    subline: 'EMAAR SQUARE AVM · ENJOY YOUR VISIT',
  }
}
