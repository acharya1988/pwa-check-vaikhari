
'use client';

import { z } from 'zod';
import type { BookTheme } from './theme.types';

export const workSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Work title is required.'),
  summary: z.string().optional(),
  coverImage: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().url().optional(),
});
export type Work = z.infer<typeof workSchema>;


export const personSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Person's name is required."),
    role: z.string().optional(),
    photoUrl: z.string().url().optional(),
    profileLink: z.string().url().optional(),
});
export type Person = z.infer<typeof personSchema>;


export const orgSchema = z.object({
  handle: z.string().min(3, "Handle must be at least 3 characters."),
  name: z.string().min(1, "Organization name is required."),
  displayName: z.string().optional(),
  type: z.string().min(1),
  industry: z.string().optional(),
  tagline: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  coverUrl: z.string().url().optional().or(z.literal('')),
  theme: z.string().optional(),

  registrationNumber: z.string().optional(),
  registrationDate: z.string().optional(),
  pan: z.string().optional(),
  gstin: z.string().optional(),
  msmeStartupId: z.string().optional(),
  certificateUrl: z.string().url().optional().or(z.literal('')),

  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  phone: z.string().optional(),
  altPhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  mapsLink: z.string().url().optional().or(z.literal('')),

  longDescription: z.string().optional(),
  missionHtml: z.string().optional(),
  visionHtml: z.string().optional(),
  keyActivities: z.string().optional(),
  foundingYear: z.string().optional(),

  facebook: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
  linkedin: z.string().url().optional().or(z.literal('')),
  youtube: z.string().url().optional().or(z.literal('')),
  twitter: z.string().url().optional().or(z.literal('')),

  galleryCsv: z.string().optional(),
  videoUrl: z.string().url().optional().or(z.literal('')),
  brochureUrl: z.string().url().optional().or(z.literal('')),

  operatingHours: z.string().optional(),
  languagesCsv: z.string().optional(),
  serviceAreasCsv: z.string().optional(),
  membershipHtml: z.string().optional(),

  showAbout: z.boolean().default(true),
  showWorks: z.boolean().default(true),
  showFounders: z.boolean().default(true),
  showGallery: z.boolean().default(true),
  showContact: z.boolean().default(true),

  works: z.array(workSchema).default([]),
  people: z.array(personSchema).default([]),
});

export type OrgInput = z.infer<typeof orgSchema>;

export interface Organization {
  id: string; // Same as handle
  ownerId: string;
  name: string;
  displayName?: string;
  type: string;
  industry?: string;
  tagline?: string;
  logoUrl?: string;
  coverUrl?: string;
  username?: string;
  theme?: string;
  themeObject: BookTheme;
  genreId?: string;
  categoryId?: string;
  subCategoryId?: string;
  registration?: {
    number?: string;
    date?: string;
    pan?: string;
    gstin?: string;
    certificateUrl?: string;
    msmeId?: string;
  };
  contact?: {
    officialEmail?: string;
    phone?: {
      primary: string;
      alternate?: string;
    };
    websiteUrl?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      pincode: string;
      country: string;
    };
    googleMapsLink?: string;
    show?: boolean;
  };
  about?: {
    longDescription?: string;
    missionStatement?: string;
    visionStatement?: string;
    keyActivities?: string[];
    foundingYear?: number;
    show?: boolean;
  };
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
    twitter?: string;
  };
  compliance?: {
    verificationStatus: 'verified' | 'unverified' | 'pending';
    authorizedSignatory: {
      name: string;
      designation: string;
      pan?: string;
    };
    authorityLetterUrl?: string;
  };
  media?: {
    gallery?: string[];
    introVideoUrl?: string;
    brochureUrl?: string;
    show?: boolean;
  };
  operational?: {
    hours?: string;
    languages?: string[];
    serviceAreas?: string[];
    membershipDetails?: string;
  };
  taxonomy?: {
    primaryCategory?: string;
    secondaryCategories?: string[];
    tags?: string[];
  };
  works: (Work & { show?: boolean })[];
  people: (Person & { show?: boolean })[];
  createdAt: number;
  updatedAt?: number;
  members: { userId: string, name: string, avatarUrl: string, role: 'admin' | 'editor' | 'member' }[];
  verificationStatus?: 'verified' | 'unverified' | 'pending' | 'revoked' | 'banned';
}
