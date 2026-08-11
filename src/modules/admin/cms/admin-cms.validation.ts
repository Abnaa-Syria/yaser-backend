import { z } from 'zod';
import { mediaUrlOrEmpty, requiredMediaUrl } from '../../../utils/mediaUrl.js';

const localizedString = z.union([
  z.string(),
  z.object({
    en: z.string().optional(),
    ar: z.string().optional(),
  }),
]);

const cmsSectionSchema = z.object({
  id: z.string().min(1),
  heading: z.string(),
  body: z.string(),
  listItems: z.array(z.string()).optional(),
  imageUrl: z.string().max(2000).optional(),
});

const postContentSchema = z.union([
  z.object({
    format: z.literal('markdown'),
    body: z.string().max(100_000),
  }),
  z.object({
    bullets: z.array(z.object({
      title: z.string().max(500).optional(),
      body: z.string().max(5000).optional(),
    })).max(100),
  }),
  z.object({
    blocks: z.array(z.object({
      type: z.literal('paragraph'),
      text: z.string().max(5000),
    })).max(250),
  }),
]);

export const faqSchema = z.object({
  body: z.object({
    faqs: z.array(z.object({
      question: localizedString,
      answer: localizedString,
    })).min(1, 'At least one FAQ is required')
  })
});

export const aboutUsSchema = z.object({
  body: z.object({
    mission: localizedString,
    vision: localizedString,
    description: localizedString,
    teamPhoto: z.string().max(2000).optional(),
  })
});

export const heroSchema = z.object({
  body: z.object({
    headline: localizedString,
    subheadline: localizedString,
    isVisible: z.boolean().optional(),
  })
});

export const createSectionSchema = z.object({
  body: z.object({
    key: z.string().min(1, 'Key is required'),
    content: z.record(z.string(), z.any()),

    isVisible: z.boolean().optional(),
    order: z.number().int().optional()
  })
});

export const upsertSectionByKeySchema = z.object({
  body: z.object({
    content: z.record(z.string(), z.any()),
    isVisible: z.boolean().optional(),
    order: z.number().int().optional(),
  }),
});

export const updateSectionSchema = z.object({
  body: z.object({
    key: z.string().optional(),
    content: z.record(z.string(), z.any()).optional(),

    isVisible: z.boolean().optional(),
    order: z.number().int().optional()
  })
});

export const addFaqSchema = z.object({
  body: z.object({
    question: localizedString,
    answer: localizedString,
  })
});

export const updateFaqSchema = z.object({
  params: z.object({
    id: z.string() // Using index or uuid
  }),
  body: z.object({
    question: localizedString.optional(),
    answer: localizedString.optional(),
  })
});

export const updateCmsPageSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
  body: z.object({
    titleEn: z.string().min(1).optional(),
    titleAr: z.string().min(1).optional(),
    subtitleEn: z.string().optional(),
    subtitleAr: z.string().optional(),
    sectionsEn: z.array(cmsSectionSchema).optional(),
    sectionsAr: z.array(cmsSectionSchema).optional(),
    isPublished: z.boolean().optional(),
    order: z.number().int().optional(),
  }),
});

export const featureReviewSchema = z.object({
  body: z.object({
    isFeatured: z.boolean()
  })
});

export const packageStatusSchema = z.object({
  body: z.object({
    isActive: z.boolean().optional(),
    isRecommended: z.boolean().optional(),
  })
});

export const createPackageSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(100),
    description: z.string().optional(),
    price: z.number().positive(),
    durationMonths: z.number().int().positive(),
    isRecommended: z.boolean().optional(),
    isActive: z.boolean().optional()
  })
});

export const updatePackageSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(100).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    durationMonths: z.number().int().positive().optional(),
    isRecommended: z.boolean().optional(),
    isActive: z.boolean().optional()
  })
});

// Posts
export const createPostSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    titleAr: z.string().optional(),
    slug: z.string().min(3),
    content: postContentSchema,
    contentAr: postContentSchema.optional(),
    thumbnail: mediaUrlOrEmpty.optional(),
    published: z.boolean().optional(),
    category: z.string().optional(),
  })
});

export const updatePostSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    title: z.string().min(1).optional(),
    titleAr: z.string().optional().nullable(),
    slug: z.string().min(3).optional(),
    content: postContentSchema.optional(),
    contentAr: postContentSchema.optional().nullable(),
    thumbnail: mediaUrlOrEmpty.optional(),
    published: z.boolean().optional(),
    category: z.string().optional(),
  })
});

// Banners
export const createBannerSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    titleAr: z.string().optional().nullable(),
    imageUrl: requiredMediaUrl,
    link: z.string().max(2048).optional().nullable(),
    isActive: z.boolean().optional(),
    order: z.number().int().optional(),
  })
});

