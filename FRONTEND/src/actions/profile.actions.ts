

'use server';

import { z } from 'zod';
import { 
    createCircle, 
    handleCircleRequest, 
    deleteCircle as deleteCircleFromService, 
    addUserToCircle as addUserToCircleService,
    requestToJoinCircle,
    createOrganization,
    updateOrganization,
    deleteOrganization as deleteOrganizationFromService,
    toggleFollow,
} from '@/services/profile.service';
import { addSubCategoryToCategory } from '@/services/genre.service';
import { getUserProfile, getUserProfileById, updateUserProfileInService, addNotification, toggleBookmark } from '@/services/user.service';
import { revalidatePath } from 'next/cache';
import type { CircleMember, UserProfile, Organization, Education, Experience, Portfolio, Skill, Language, Publication, Award, Project, Association } from '@/types';
import { getBook } from '@/services/book.service';
import { auth } from '@/lib/firebase/config';
import { updateProfile } from 'firebase/auth';

const UpdateImageSchema = z.object({
    imageType: z.enum(['avatar', 'cover']),
    imageUrl: z.string().min(1, 'Image URL cannot be empty.'),
    imagePosition: z.string().optional(),
});

export async function updateProfileImage(prevState: any, formData: FormData) {
    const validatedFields = UpdateImageSchema.safeParse(Object.fromEntries(formData));

    if (!validatedFields.success) {
        console.error("Profile image update validation failed:", validatedFields.error.flatten());
        return { error: 'Invalid data provided.' };
    }

    const { imageType, imageUrl, imagePosition } = validatedFields.data;

    try {
        const dataToUpdate: Partial<UserProfile> = {};
        if (imageType === 'avatar') {
            dataToUpdate.avatarUrl = imageUrl;
        } else {
            dataToUpdate.coverUrl = imageUrl;
            dataToUpdate.coverPosition = imagePosition || '50% 50%';
        }
        
        await updateUserProfileInService(dataToUpdate);
        
        revalidatePath('/admin', 'layout'); // Revalidate the whole admin layout to update sidebar
        revalidatePath('/admin/profile'); // Revalidate the profile page
        
        return { success: true, message: `${imageType.charAt(0).toUpperCase() + imageType.slice(1)} image updated.` };
    } catch (error: any) {
        return { error: 'Failed to update profile image.' };
    }
}

const CircleSchema = z.object({
    name: z.string().min(3, 'Circle name must be at least 3 characters.'),
    description: z.string().min(10, 'Description must be at least 10 characters.'),
    type: z.enum(['personal', 'organization']),
    genreId: z.string().optional(),
    categoryId: z.string().optional(),
    subCategoryId: z.string().optional(),
    newSubCategory: z.string().optional(),
    avatarUrl: z.string().url().optional(),
    coverUrl: z.string().url().optional(),
});


export async function createCircleAction(prevState: any, formData: FormData) {
    const validatedFields = CircleSchema.safeParse(Object.fromEntries(formData));
    if (!validatedFields.success) {
        return { error: 'Validation failed', fieldErrors: validatedFields.error.flatten().fieldErrors };
    }
    
    try {
        const user = await getUserProfile();
        let { subCategoryId, newSubCategory, categoryId, ...data } = validatedFields.data;

        if (newSubCategory && categoryId && !subCategoryId) {
            const newSub = await addSubCategoryToCategory(categoryId, newSubCategory);
            subCategoryId = newSub.id;
        }

        const created = await createCircle(
            {id: user.email, name: user.name, avatarUrl: user.avatarUrl }, 
            { ...data, categoryId: categoryId || '', subCategoryId }
        );
        revalidatePath('/admin/profile');
        revalidatePath('/admin/circles');
        return { success: true, message: 'Circle created successfully!', id: created.id };
    } catch (error: any) {
        return { error: error.message };
    }
}

const OrganizationSchema = z.object({
    name: z.string().min(1),
    type: z.string().min(1),
    // All other fields are optional on the base schema
}).catchall(z.any());


function cleanUndefined(obj: any): any {
    if (obj === null || obj === undefined || obj === '') {
        return undefined;
    }
    if (Array.isArray(obj)) {
        const cleanedArray = obj.map(cleanUndefined).filter(v => v !== undefined);
        return cleanedArray.length > 0 ? cleanedArray : undefined;
    }
    if (typeof obj !== 'object' || obj instanceof Date) {
        return obj;
    }
    const newObj: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (value !== undefined && value !== null && value !== '') {
                const cleanedValue = cleanUndefined(value);
                if (cleanedValue !== undefined) {
                    newObj[key] = cleanedValue;
                }
            }
        }
    }
    if (Object.keys(newObj).length === 0) {
        return undefined;
    }
    return newObj;
}

function formDataToOrgObject(formData: FormData): Partial<Omit<Organization, 'id' | 'ownerId' | 'createdAt' | 'members'>> {
    const data = Object.fromEntries(formData.entries());

    const founders: any[] = [];
    for(let i = 0; ; i++) {
        const nameKey = `founders[${i}][name]`;
        if (formData.has(nameKey)) {
            founders.push({
                name: formData.get(nameKey) as string,
                role: formData.get(`founders[${i}][role]`) as string,
                profileLink: formData.get(`founders[${i}][profileLink]`) as string,
            });
        } else {
            break; // No more founders
        }
    }

    return cleanUndefined({
        name: data.name as string,
        displayName: data.displayName as string,
        type: data.type as string,
        industry: data.industry as string,
        tagline: data.tagline as string,
        logoUrl: data.logoUrl as string,
        coverUrl: data.coverUrl as string,
        username: data.username as string,
        theme: data.theme as string,
        registration: {
            number: data['registration.number'] as string,
            date: data['registration.date'] as string,
            pan: data['registration.pan'] as string,
            gstin: data['registration.gstin'] as string,
            certificateUrl: data['registration.certificateUrl'] as string,
            msmeId: data['registration.msmeId'] as string,
        },
        contact: {
            officialEmail: data['contact.officialEmail'] as string,
            phone: {
                primary: data['contact.phone.primary'] as string,
                alternate: data['contact.phone.alternate'] as string,
            },
            websiteUrl: data['contact.websiteUrl'] as string,
            address: {
                street: data['contact.address.street'] as string,
                city: data['contact.address.city'] as string,
                state: data['contact.address.state'] as string,
                pincode: data['contact.address.pincode'] as string,
                country: data['contact.address.country'] as string,
            },
             googleMapsLink: data['contact.googleMapsLink'] as string,
        },
        about: {
            longDescription: data['about.longDescription'] as string,
            missionStatement: data['about.missionStatement'] as string,
            visionStatement: data['about.visionStatement'] as string,
            keyActivities: (data['about.keyActivities'] as string)?.split(',').map(s => s.trim()),
            foundingYear: data['about.foundingYear'] ? Number(data['about.foundingYear']) : undefined,
        },
        socialLinks: {
            facebook: data['socialLinks.facebook'] as string,
            instagram: data['socialLinks.instagram'] as string,
            linkedin: data['socialLinks.linkedin'] as string,
            youtube: data['socialLinks.youtube'] as string,
            twitter: data['socialLinks.twitter'] as string,
        },
        compliance: {
            verificationStatus: 'unverified',
            authorizedSignatory: {
                name: data['compliance.authorizedSignatory.name'] as string,
                designation: data['compliance.authorizedSignatory.designation'] as string,
                pan: data['compliance.authorizedSignatory.pan'] as string
            },
            authorityLetterUrl: data['compliance.authorityLetterUrl'] as string,
        },
         media: {
            gallery: (data['media.gallery'] as string)?.split(',').map(s => s.trim()),
            introVideoUrl: data['media.introVideoUrl'] as string,
            brochureUrl: data['media.brochureUrl'] as string,
        },
        operational: {
            hours: data['operational.hours'] as string,
            languages: (data['operational.languages'] as string)?.split(',').map(s => s.trim()),
            serviceAreas: (data['operational.serviceAreas'] as string)?.split(',').map(s => s.trim()),
            membershipDetails: data['operational.membershipDetails'] as string,
        },
         taxonomy: {
            primaryCategory: data['taxonomy.primaryCategory'] as string,
            secondaryCategories: (data['taxonomy.secondaryCategories'] as string)?.split(',').map(s => s.trim()),
            tags: (data['taxonomy.tags'] as string)?.split(',').map(s => s.trim()),
        },
        people: founders,
    });
}


export async function createOrganizationAction(prevState: any, formData: FormData) {
    try {
        const user = await getUserProfile();
        
        const rawData = Object.fromEntries(formData);
        const parsedResult = OrganizationSchema.safeParse(rawData);

        if (!parsedResult.success) {
            console.error("Validation Error:", parsedResult.error.flatten());
            return {
                error: "Validation failed.",
                fieldErrors: parsedResult.error.flatten().fieldErrors,
            };
        }

        const orgData = formDataToOrgObject(formData);
        
        if (!orgData || !orgData.name) {
            throw new Error("Cannot create an organization with empty data.");
        }
        
        await createOrganization(user, orgData);
        revalidatePath('/admin/settings');
        revalidatePath('/admin/organizations');
        return { success: true, message: 'Organization created successfully!' };
    } catch (error: any) {
        console.error("Error creating organization:", error);
        return { 
            error: error.message, 
            fieldErrors: error instanceof z.ZodError ? error.flatten().fieldErrors : undefined 
        };
    }
}


export async function updateOrganizationAction(prevState: any, formData: FormData) {
    const orgId = formData.get('id') as string;
    if (!orgId) {
        return { error: "Organization ID is missing." };
    }

    try {
        const user = await getUserProfile();
        
        const rawData = Object.fromEntries(formData);
        const parsedResult = OrganizationSchema.safeParse(rawData);

        if (!parsedResult.success) {
            return {
                error: "Validation failed.",
                fieldErrors: parsedResult.error.flatten().fieldErrors,
            };
        }
        
        const orgData = formDataToOrgObject(formData);

        if (!orgData) {
            throw new Error("Cannot update an organization with empty data.");
        }
        
        await updateOrganization(orgId, orgData);
        revalidatePath('/admin/settings');
        revalidatePath('/admin/organizations');
        return { success: true, message: 'Organization updated successfully!' };
    } catch (error: any) {
        return { error: error.message, fieldErrors: error instanceof z.ZodError ? error.flatten().fieldErrors : undefined };
    }
}


const DeleteOrganizationSchema = z.object({
    organizationId: z.string().min(1, 'Organization ID is required.'),
});

export async function deleteOrganization(prevState: any, formData: FormData) {
    const validatedFields = DeleteOrganizationSchema.safeParse(Object.fromEntries(formData));
    if (!validatedFields.success) {
        return { error: 'Invalid data.' };
    }
    
    try {
        await deleteOrganizationFromService(validatedFields.data.organizationId);
        revalidatePath('/admin/organizations');
        return { success: true, message: 'Organization deleted successfully.' };
    } catch (error: any) {
        return { error: error.message };
    }
}

const BaseRequestSchema = z.object({
    circleId: z.string().min(1, "Circle ID is required."),
    requestUserId: z.string().min(1, "User ID is required."),
});

const AcceptRequestSchema = BaseRequestSchema.extend({
    action: z.literal('accept'),
    role: z.enum(['reader', 'contributor', 'admin']),
});

const RejectRequestSchema = BaseRequestSchema.extend({
    action: z.literal('reject'),
});

const ManageRequestSchema = z.discriminatedUnion("action", [
    AcceptRequestSchema,
    RejectRequestSchema
]);


export async function manageCircleRequest(prevState: any, formData: FormData) {
    const action = formData.get('action');
    
    const dataToValidate: any = {
        circleId: formData.get('circleId'),
        requestUserId: formData.get('requestUserId'),
        action: action,
    };

    if (action === 'accept') {
        dataToValidate.role = formData.get('role');
    }
    
    const validatedFields = ManageRequestSchema.safeParse(dataToValidate);
    
    if (!validatedFields.success) {
        return { error: 'Invalid request data.', fieldErrors: validatedFields.error.flatten().fieldErrors };
    }

    try {
        await handleCircleRequest(
            validatedFields.data.circleId, 
            validatedFields.data.requestUserId, 
            validatedFields.data.action,
            validatedFields.data.action === 'accept' ? validatedFields.data.role : undefined
        );
        revalidatePath('/admin/profile');
        revalidatePath('/admin/circles');
        const message = validatedFields.data.action === 'accept' ? 'Request accepted and user added to circle.' : 'Request rejected.';
        return { success: true, message };
    } catch (error: any) {
        return { error: error.message };
    }
}


const AddUserToCircleSchema = z.object({
    circleId: z.string().min(1, "A circle must be selected."),
    userId: z.string().min(1),
    userName: z.string().min(1),
    userAvatarUrl: z.string().url(),
    role: z.enum(['reader', 'contributor']),
});

export async function addUserToCircleAction(prevState: any, formData: FormData) {
    const validatedFields = AddUserToCircleSchema.safeParse(Object.fromEntries(formData));

    if (!validatedFields.success) {
        return { error: 'Validation failed', fieldErrors: validatedFields.error.flatten().fieldErrors };
    }

    try {
        const { circleId, userId, userName, userAvatarUrl, role } = validatedFields.data;
        await addUserToCircleService(circleId, { userId, name: userName, avatarUrl: userAvatarUrl }, role);
        revalidatePath('/admin/profile');
        return { success: true, message: `Successfully added ${userName} to the circle.` };
    } catch (error: any) {
        return { error: error.message };
    }
}

const DeleteCircleSchema = z.object({
    circleId: z.string().min(1),
});

export async function deleteCircleAction(prevState: any, formData: FormData) {
    const validatedFields = DeleteCircleSchema.safeParse(Object.fromEntries(formData));
    if (!validatedFields.success) {
        return { error: 'Invalid data for circle deletion.' };
    }
    
    const { circleId } = validatedFields.data;
    
    try {
        await deleteCircleFromService(circleId);
        revalidatePath('/admin/profile');
        return { success: true, message: 'Circle deleted successfully.' };
    } catch (error: any) {
        return { error: error.message };
    }
}

const SettingsSchema = z.object({
  name: z.string().min(2, 'Name is required.').optional(),
  bio: z.string().optional(),
  preferredAiName: z.string().optional(),
  'links.github': z.string().url().optional().or(z.literal('')),
  'links.linkedin': z.string().url().optional().or(z.literal('')),
  'links.website': z.string().url().optional().or(z.literal('')),
  'notifications.inApp.messages': z.string().optional(),
  'notifications.inApp.replies': z.string().optional(),
  'notifications.inApp.circleActivity': z.string().optional(),
  'notifications.inApp.newFollower': z.string().optional(),
  'notifications.inApp.bookPublished': z.string().optional(),
  'notifications.inApp.newChapterInBook': z.string().optional(),
  'notifications.inApp.newArticleInBook': z.string().optional(),
  'notifications.inApp.newSerial': z.string().optional(),
  'notifications.inApp.newSerialEpisode': z.string().optional(),
  'notifications.inApp.repositoryUpdate': z.string().optional(),
  'notifications.inApp.mention': z.string().optional(),
  'notifications.email.digest': z.enum(['daily', 'weekly', 'never']).optional(),
  'notifications.email.alerts': z.string().optional(),
  'notifications.sounds': z.string().optional(),
  'privacy.visibility.experience': z.enum(['public', 'followers', 'private']).optional(),
  'privacy.visibility.education': z.enum(['public', 'followers', 'private']).optional(),
  'privacy.visibility.publications': z.enum(['public', 'followers', 'private']).optional(),
  'privacy.visibility.phone': z.enum(['public', 'followers', 'private']).optional(),
  'privacy.visibility.email': z.enum(['public', 'followers', 'private']).optional(),
  'privacy.visibility.organizations': z.enum(['public', 'followers', 'private']).optional(),
  'privacy.visibility.circles': z.enum(['public', 'followers', 'private']).optional(),
  'privacy.resumeDownload': z.enum(['public', 'followers', 'private']).optional(),
});

function parseDynamicFieldsForAction<T>(formData: FormData, name: string, fields: string[]): T[] {
    const items: any[] = [];
    const keys = Array.from(formData.keys());
    
    const itemKeys = keys.filter(k => k.startsWith(`${name}[`));
    const indices = [...new Set(itemKeys.map(k => k.match(/\d+/)?.[0]))].filter(Boolean);

    for (const index of indices) {
        const item: any = {};
        let hasValue = false;
        for (const field of fields) {
            const value = formData.get(`${name}[${index}][${field}]`);
            if (value && String(value).trim()) {
                item[field] = value;
                hasValue = true;
            }
        }
        if (hasValue) {
            items.push(item);
        }
    }
    return items as T[];
}

export async function updateProfileSettings(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    
    // Manual validation because of dynamic fields and checkboxes
    if (data.name && typeof data.name === 'string' && data.name.length < 2) {
        return { error: 'Validation failed', fieldErrors: { name: ['Name is required.'] }};
    }

    try {
        const profileUpdate: Partial<UserProfile> = {};

        if (data.name) profileUpdate.name = data.name as string;
        if (data.bio) profileUpdate.bio = data.bio as string;
        if (data.preferredAiName) profileUpdate.preferredAiName = data.preferredAiName as string;
        
        profileUpdate.links = {
            github: data['links.github'] as string || '',
            linkedin: data['links.linkedin'] as string || '',
            website: data['links.website'] as string || '',
        };

        const notifications = {
            inApp: {
                messages: data['notifications.inApp.messages'] === 'on',
                replies: data['notifications.inApp.replies'] === 'on',
                circleActivity: data['notifications.inApp.circleActivity'] === 'on',
                newFollower: data['notifications.inApp.newFollower'] === 'on',
                bookPublished: data['notifications.inApp.bookPublished'] === 'on',
                newChapterInBook: data['notifications.inApp.newChapterInBook'] === 'on',
                newArticleInBook: data['notifications.inApp.newArticleInBook'] === 'on',
                newSerial: data['notifications.inApp.newSerial'] === 'on',
                newSerialEpisode: data['notifications.inApp.newSerialEpisode'] === 'on',
                repositoryUpdate: data['notifications.inApp.repositoryUpdate'] === 'on',
                mention: data['notifications.inApp.mention'] === 'on',
            },
            email: {
                digest: data['notifications.email.digest'] as 'daily' | 'weekly' | 'never',
                alerts: data['notifications.email.alerts'] === 'on',
            },
            sounds: data['notifications.sounds'] === 'on',
        };

        const privacy = {
            visibility: {
                experience: data['privacy.visibility.experience'] as 'public' | 'followers' | 'private' || 'public',
                education: data['privacy.visibility.education'] as 'public' | 'followers' | 'private' || 'public',
                publications: data['privacy.visibility.publications'] as 'public' | 'followers' | 'private' || 'public',
                phone: data['privacy.visibility.phone'] as 'public' | 'followers' | 'private' || 'private',
                email: data['privacy.visibility.email'] as 'public' | 'followers' | 'private' || 'private',
                organizations: data['privacy.visibility.organizations'] as 'public' | 'followers' | 'private' || 'public',
                circles: data['privacy.visibility.circles'] as 'public' | 'followers' | 'private' || 'public',
            },
            resumeDownload: data['privacy.resumeDownload'] as 'public' | 'followers' | 'private' || 'followers',
        };
        
        profileUpdate.preferences = { notifications, privacy };
        
        const education = parseDynamicFieldsForAction<Education>(formData, 'education', ['institution', 'degree', 'fieldOfStudy', 'startYear', 'endYear', 'description']);
        const experience = parseDynamicFieldsForAction<Experience>(formData, 'experience', ['organization', 'title', 'startDate', 'endDate', 'description']);
        const skills = parseDynamicFieldsForAction<Skill>(formData, 'skills', ['name', 'proficiency']);
        const languages = parseDynamicFieldsForAction<Language>(formData, 'languages', ['name', 'proficiency']);
        const publications = parseDynamicFieldsForAction<Publication>(formData, 'publications', ['title', 'type', 'year', 'link', 'description']);
        const awards = parseDynamicFieldsForAction<Award>(formData, 'awards', ['name', 'awardingBody', 'year', 'description']);
        const projects = parseDynamicFieldsForAction<Project>(formData, 'projects', ['title', 'duration', 'link', 'description']);
        const associations = parseDynamicFieldsForAction<Association>(formData, 'associations', ['name', 'role', 'year']);

        if(education.length > 0) profileUpdate.education = education;
        if(experience.length > 0) profileUpdate.experience = experience;
        if(skills.length > 0) profileUpdate.skills = skills;
        if(languages.length > 0) profileUpdate.languages = languages;
        if(publications.length > 0) profileUpdate.publications = publications;
        if(awards.length > 0) profileUpdate.awards = awards;
        if(projects.length > 0) profileUpdate.projects = projects;
        if(associations.length > 0) profileUpdate.associations = associations;
        
        await updateUserProfileInService(profileUpdate);
        revalidatePath('/admin/settings');
        revalidatePath('/admin/profile');
        revalidatePath('/admin/copilot');
        return { success: true, message: 'Your settings have been updated.' };
    } catch (error: any) {
        return { error: error.message };
    }
}

const FavoriteBookSchema = z.object({
    bookId: z.string().min(1, 'Book ID is required.'),
});

export async function toggleFavoriteBook(prevState: any, formData: FormData) {
    const validatedFields = FavoriteBookSchema.safeParse(Object.fromEntries(formData));
    if (!validatedFields.success) {
        return { error: 'Invalid data.' };
    }

    try {
        const user = await getUserProfile();
        const book = await getBook(validatedFields.data.bookId);

        if (!book) {
            throw new Error('Book not found.');
        }

        const result = await toggleBookmark({
            userId: user.email,
            type: 'book',
            bookId: book.id,
            bookName: book.name,
            profileUrl: book.profileUrl,
            shortDescription: book.shortDescription,
        });

        revalidatePath('/admin/profile');
        return { success: true, message: `Book ${result.action === 'added' ? 'added to' : 'removed from'} favorites.` };

    } catch (error: any) {
        return { error: error.message };
    }
}

const VerificationRequestSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().min(1, 'PIN code is required'),
});

export async function requestPersonalVerification(prevState: any, formData: FormData) {
  const validatedFields = VerificationRequestSchema.safeParse(Object.fromEntries(formData));
  if (!validatedFields.success) {
      return { error: 'Validation failed.', fieldErrors: validatedFields.error.flatten().fieldErrors };
  }

  try {
    // In a real app, you would save this request to a separate 'verification_requests' collection
    // and notify admins. For now, we just update the user's status.
    await updateUserProfileInService({ verificationStatus: 'pending' });
    revalidatePath('/admin/settings');
    return { success: true, message: 'Your verification request has been submitted for review.' };
  } catch (e: any) {
    return { error: `Failed to submit request: ${e.message}` };
  }
}

const FollowUserSchema = z.object({
  targetUserId: z.string().email(),
});

export async function toggleFollowUser(prevState: any, formData: FormData) {
    const validatedFields = FollowUserSchema.safeParse(Object.fromEntries(formData));
    if (!validatedFields.success) {
        return { error: 'Invalid user ID.' };
    }
    
    try {
        const currentUser = await getUserProfile();
        const targetUser = await getUserProfileById(validatedFields.data.targetUserId);
        
        if (!targetUser) {
            throw new Error('Target user not found.');
        }

        const result = await toggleFollow(currentUser, targetUser);
        
        // Notify the target user when they gain a new follower.
        if (result.action === 'followed') {
            await addNotification(targetUser.email, {
                type: 'new_follower',
                actor: currentUser,
                title: 'New Follower',
                message: `${currentUser.name} started following you.`,
                link: `/admin/profile/${encodeURIComponent(currentUser.email)}`
            });
        }

        revalidatePath('/admin/people');
        revalidatePath(`/admin/profile/${encodeURIComponent(currentUser.email)}`);
        revalidatePath(`/admin/profile/${encodeURIComponent(targetUser.email)}`);

        return { success: true, message: `Successfully ${result.action === 'unfollowed' ? 'unfollowed' : 'followed'} ${targetUser.name}.` };
    } catch (e: any) {
        return { error: e.message };
    }
}

const RequestJoinSchema = z.object({
  circleId: z.string().min(1),
  message: z.string().optional(),
});

export async function requestToJoinCircleAction(prevState: any, formData: FormData) {
  const validated = RequestJoinSchema.safeParse(Object.fromEntries(formData));
  if (!validated.success) {
    return { error: 'Validation failed', fieldErrors: validated.error.flatten().fieldErrors };
  }
  const { circleId, message } = validated.data;
  try {
    await requestToJoinCircle(circleId, message);
    revalidatePath(`/admin/circles/${circleId}`);
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function deleteOrganizationAction(prevState: any, formData: FormData) {
  const validated = DeleteOrganizationSchema.safeParse(Object.fromEntries(formData));
  if (!validated.success) {
    return { error: 'Invalid request', fieldErrors: validated.error.flatten().fieldErrors };
  }
  try {
    const { organizationId } = validated.data;
    await deleteOrganizationFromService(organizationId);
    revalidatePath('/admin/organizations');
    revalidatePath('/admin/settings');
    return { success: true, message: 'Organization deleted.' };
  } catch (e: any) {
    return { error: e.message };
  }
}
