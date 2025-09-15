
import type { ConversationParticipant, Genre, Category } from '.';

// --- Constants for the AI user ---
export const VAIKHARI_USER_ID = 'vaia-ai';
export const VAIKHARI_USER_PROFILE: ConversationParticipant = {
    id: VAIKHARI_USER_ID,
    name: 'VAIA',
    avatarUrl: '/media/om-icon.svg', 
};


export interface PostAuthor {
  id: string;
  name: string;
  avatarUrl: string;
  role?: string;
}

export interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear?: string;
  endYear?: string;
  description?: string;
  achievements?: string;
}

export interface Experience {
  organization: string;
  company?: string;
  title: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  startYear?: string;
  endYear?: string;
}

export interface Skill {
  name: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Expert';
}

export interface Language {
    name: string;
    proficiency: 'Basic' | 'Conversational' | 'Fluent' | 'Native';
}

export interface Publication {
    title: string;
    type: 'Journal Article' | 'Book' | 'Conference Paper' | 'Other';
    year?: string;
    link?: string;
    description?: string;
}

export interface Award {
    name: string;
    awardingBody: string;
    year?: string;
    description?: string;
}

export interface Project {
    title: string;
    description: string;
    duration?: string;
    link?: string;
}

export interface Association {
    name: string;
    role: string;
    year?: string;
}

export interface Portfolio {
    name: string;
    type: 'personal' | 'organization';
    designation: string;
    website?: string;
}

export interface PrivacyPreferences {
    visibility: {
        experience: 'public' | 'followers' | 'private';
        education: 'public' | 'followers' | 'private';
        publications: 'public' | 'followers' | 'private';
        phone: 'public' | 'followers' | 'private';
        email: 'public' | 'followers' | 'private';
        organizations: 'public' | 'followers' | 'private';
        circles: 'public' | 'followers' | 'private';
    };
    resumeDownload: 'public' | 'followers' | 'private';
}

export interface UserPreferences {
    favoriteGenres?: Genre[];
    favoriteCategories?: Category[];
    notifications?: {
        inApp?: {
            messages?: boolean;
            replies?: boolean;
            circleActivity?: boolean;
            newFollower?: boolean;
            bookPublished?: boolean;
            newChapterInBook?: boolean;
            newArticleInBook?: boolean;
            newSerial?: boolean;
            newSerialEpisode?: boolean;
            repositoryUpdate?: boolean;
            mention?: boolean;
        },
        email?: {
            digest?: 'daily' | 'weekly' | 'never';
            alerts?: boolean;
        },
        sounds?: boolean;
    };
    privacy?: PrivacyPreferences;
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
  coverUrl: string;
  coverPosition?: string;
  username?: string;
  tagline?: string;
  bio?: string;
  location?: string;
  currentRole?: string;
  currentInstitution?: string;
  fieldOfStudy?: string;

  education?: Education[];
  experience?: Experience[];
  skills?: Skill[] | string[];
  languages?: Language[];
  publications?: Publication[];
  awards?: Award[];
  projects?: Project[];
  associations?: Association[];
  portfolio?: Portfolio[];
  organizations?: string[];
  
  links?: {
    github?: string;
    linkedin?: string;
    website?: string;
  };
  
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'revoked' | 'banned' | 'pending_setup';
  mfaEnrolled: boolean;
  onboardingCompleted?: boolean;
  stats: {
    views: number;
    messages: number;
    circles: number;
    rating?: number;
    bookCount?: number;
    articlesPublished?: number;
    whitepapersPublished?: number;
  };
  phone?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  
  preferences?: UserPreferences;
  preferredAiName?: string;
  
  followers?: string[]; // Array of user emails
  following?: string[]; // Array of user emails
}

export interface Bookmark {
  id: string;
  userId: string;
  type: 'article' | 'block' | 'post' | 'book' | 'standalone-article';
  bookId?: string;
  chapterId?: string | number;
  verse?: string | number;
  blockId?: string;
  postId?: string;
  createdAt: number;
  note?: string;
  // For display purposes
  bookName?: string;
  articleTitle?: string;
  blockTextPreview?: string;
  postContentPreview?: string;
  profileUrl?: string;
  shortDescription?: string;
  sourcePath?: string;
  isBookmark?: boolean;
}

export interface CircleMember {
  userId: string;
  name: string;
  avatarUrl: string;
  role: 'admin' | 'contributor' | 'reader';
}

export interface CircleRequest {
  userId: string;
  name: string;
  avatarUrl: string;
  message?: string;
  requestedAt: number;
}

export interface Circle {
  id: string;
  name: string;
  description: string;
  type: 'personal' | 'organization';
  genreId: string;
  categoryId: string;
  subCategoryId?: string;
  ownerId: string;
  avatarUrl?: string;
  coverUrl?: string;
  members: CircleMember[];
  requests: CircleRequest[];
  createdAt: number;
}

export interface Answer {
  id: string;
  author: PostAuthor;
  content: string;
  createdAt: number;
  upvotes: number;
  downvotes: number;
}


export interface Notification {
    id: string;
    userId: string;
    actor: {
        id: string;
        name: string;
        avatarUrl: string;
    };
    type: 'book_published' | 'message' | 'repository_update' | 'comment' | 'mention' | 'new_follower' | 'circle_invite' | 'comment_reply';
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: number;
}
