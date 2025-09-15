

'use client';

import React, { useEffect, useRef, useState, type ReactNode, useTransition, useActionState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createOrganizationAction, updateOrganizationAction } from '@/actions/profile.actions';
import { checkOrganizationHandle } from '@/services/organization.service';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Save, ArrowLeft, ArrowRight, Plus, Trash2, Building, User as UserIcon, FileText, Award, Lightbulb, UserCheck, Star, Languages, Github, Linkedin, Globe, Fingerprint, Contact, Info, Link as LinkIcon, ImageIcon, Briefcase, KeyRound, Settings, X, Check, HelpCircle, Users as UsersIcon, Palette, Eye } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import type { Editor } from '@tiptap/react';
import { EditorToolbar } from '@/components/admin/editor/toolbar';
import { Checkbox } from '@/components/ui/checkbox';
import { TagInput } from '@/components/ui/tag-input';
import type { Organization, BookTheme, Person } from '@/types';
import { useDebounce } from '@/hooks/use-debounce';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { BookThemeProvider } from '@/components/theme/BookThemeContext';
import { ThemeSaraswati } from '@/components/organization-themes/ThemeSaraswati';
import { ThemeTantra } from '@/components/organization-themes/ThemeTantra';
import { ThemeWabiSabi } from '@/components/organization-themes/ThemeWabiSabi';
import { getThemePresetByName } from '@/services/theme.service';
import { OrganizationOnePage } from '@/components/OrganizationOnePage';

const RichTextEditor = dynamic(() => import('@/components/admin/rich-text-editor').then(mod => mod.RichTextEditor), {
    ssr: false,
    loading: () => <div className="min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 animate-pulse" />
});

const themePreviews: { [key: string]: React.ComponentType<{ org: any }> } = {
  'Saraswati': ThemeSaraswati,
  'Tantra': ThemeTantra,
  'WabiSabi': ThemeWabiSabi
};

const orgFormSteps = [
    { step: 1, id: 'basic', label: 'Basic Info', icon: Building, fields: ['name', 'displayName', 'type', 'industry', 'tagline', 'logoUrl', 'coverUrl', 'username'] },
    { step: 2, id: 'registration', label: "Registration", icon: Fingerprint, fields: ['registration.number', 'registration.date', 'registration.pan', 'registration.gstin', 'registration.certificateUrl', 'registration.msmeId'] },
    { step: 3, id: 'contact', label: "Contact", icon: Contact, fields: ['contact.officialEmail', 'contact.phone.primary', 'contact.phone.alternate', 'contact.websiteUrl', 'contact.address.street', 'contact.address.city', 'contact.address.state', 'contact.address.pincode', 'contact.address.country', 'contact.googleMapsLink'] },
    { step: 4, id: 'about', label: "About", icon: Lightbulb, fields: ['about.longDescription', 'about.missionStatement', 'about.visionStatement', 'about.keyActivities', 'about.foundingYear'] },
    { step: 5, id: 'founders', label: 'Founders', icon: UsersIcon, fields: [] },
    { step: 6, id: 'verification', label: "Verification", icon: UserCheck, fields: ['compliance.authorizedSignatory.name', 'compliance.authorizedSignatory.designation', 'compliance.authorizedSignatory.pan', 'compliance.authorityLetterUrl'] },
    { step: 7, id: 'media', label: "Media", icon: ImageIcon, fields: ['media.gallery', 'media.introVideoUrl', 'media.brochureUrl'] },
    { step: 8, id: 'operational', label: "Operational", icon: Languages, fields: ['operational.hours', 'operational.languages', 'operational.serviceAreas', 'operational.membershipDetails'] },
    { step: 9, id: 'taxonomy', label: "Taxonomy", icon: Award, fields: ['taxonomy.tags'] },
    { step: 10, id: 'social', label: "Social", icon: LinkIcon, fields: ['socialLinks.facebook', 'socialLinks.instagram', 'socialLinks.linkedin', 'socialLinks.youtube', 'socialLinks.twitter'] },
    { step: 11, id: 'visibility', label: "Visibility", icon: Settings, fields: ['showAbout', 'showWorks', 'showFounders', 'showGallery', 'showContact'] },
    { step: 12, id: 'theme', label: "Theme", icon: Palette, fields: ['theme'] },
];

interface FormState {
    name: string;
    displayName: string;
    type: string;
    industry: string;
    tagline: string;
    logoUrl: string;
    coverUrl: string;
    registrationNumber: string;
    registrationDate: string;
    registrationPan: string;
    registrationGstin: string;
    registrationCertificateUrl: string;
    registrationMsmeId: string;
    officialEmail: string;
    websiteUrl: string;
    primaryPhone: string;
    alternatePhone: string;
    addressStreet: string;
    addressCity: string;
    addressState: string;
    addressPincode: string;
    addressCountry: string;
    googleMapsLink: string;
    facebook: string;
    instagram: string;
    linkedin: string;
    youtube: string;
    twitter: string;
    languages: string;
    serviceAreas: string;
    membershipDetails: string;
    gallery: string;
    introVideoUrl: string;
    brochureUrl: string;
    authorizedSignatoryName: string;
    authorizedSignatoryDesignation: string;
    authorizedSignatoryPan: string;
    authorityLetterUrl: string;
    keyActivities: string;
    foundingYear: string;
    showAbout: boolean;
    showWorks: boolean;
    showFounders: boolean;
    showGallery: boolean;
    showContact: boolean;
}

interface Founder {
    name: string;
    role: string;
    profileLink: string;
}

function DynamicFieldArray({ items, setItems, name, fields, title }: {
    items: Founder[],
    setItems: React.Dispatch<React.SetStateAction<Founder[]>>,
    name: 'founders',
    fields: { name: 'name' | 'role' | 'profileLink', label: string, type: string, required?: boolean }[],
    title: string
}) {
    const addItem = () => setItems(prev => [...prev, { name: '', role: '', profileLink: '' }]);
    const removeItem = (index: number) => setItems(prev => prev.filter((_, i) => i !== index));
    const updateItem = (index: number, field: keyof Founder, value: string) => {
        setItems(prev => {
            const newItems = [...prev];
            newItems[index] = { ...newItems[index], [field]: value };
            return newItems;
        })
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{title}</h3>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="mr-2 h-4 w-4"/>Add
                </Button>
            </div>
            {items.map((item, index) => (
                <Card key={index} className="p-4 relative bg-background/50">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7"
                        onClick={() => removeItem(index)}
                    >
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fields?.map(field => (
                            <div key={field.name} className={field.name === 'profileLink' ? 'md:col-span-2' : ''}>
                                <Label htmlFor={`${name}[${index}][${field.name}]`}>{field.label}</Label>
                                <Input
                                    id={`${name}[${index}][${field.name}]`}
                                    value={item[field.name]}
                                    onChange={(e) => updateItem(index, field.name, e.target.value)}
                                    type={field.type}
                                    required={field.required}
                                />
                            </div>
                        ))}
                    </div>
                </Card>
            ))}
        </div>
    )
}

const NavItem = ({ step, currentStep, onStepClick, disabled }: {
    step: typeof orgFormSteps[number],
    currentStep: number,
    onStepClick: (step: number) => void,
    disabled: boolean
}) => {
    const isActive = step.step === currentStep;
    return (
        <Button
            type="button"
            variant={isActive ? 'secondary' : 'ghost'}
            className="w-full justify-start gap-3"
            onClick={() => onStepClick(step.step)}
            disabled={disabled}
        >
            <step.icon className={cn("h-5 w-5", isActive ? 'text-primary' : 'text-muted-foreground', disabled && 'text-muted-foreground/50')} />
            <span className={cn(isActive && "font-bold", disabled && 'text-muted-foreground/50')}>{step.label}</span>
        </Button>
    )
}

const DayHourSelector = ({ day, value, onChange }: { day: string, value?: { from: string; to: string; open: boolean }, onChange: (value: { from: string; to: string; open: boolean }) => void }) => {
    const isOpen = value?.open ?? true;
    const from = value?.from || '09:00';
    const to = value?.to || '17:00';

    return (
        <div className="grid grid-cols-[120px_1fr] items-center gap-4 border-t p-3">
            <div className="flex items-center gap-3">
                <Checkbox
                    id={`day-open-${day}`}
                    checked={isOpen}
                    onCheckedChange={(checked) => onChange({ from, to, open: !!checked })}
                />
                <Label htmlFor={`day-open-${day}`} className="font-medium">{day}</Label>
            </div>
            {isOpen ? (
                <div className="flex items-center gap-2">
                    <Input
                        type="time"
                        value={from}
                        onChange={(e) => onChange({ from: e.target.value, to, open: isOpen })}
                        className="h-9"
                    />
                    <span className="text-muted-foreground text-sm">to</span>
                    <Input
                        type="time"
                        value={to}
                        onChange={(e) => onChange({ from, to: e.target.value, open: isOpen })}
                        className="h-9"
                    />
                </div>
            ) : <p className="text-sm text-muted-foreground">Closed</p>}
        </div>
    );
};

function ThemePreviewCard({ themeName, isSelected, onSelect, onPreview, children }: {
    themeName: string;
    isSelected: boolean;
    onSelect: () => void;
    onPreview: () => void;
    children: React.ReactNode;
}) {
    return (
        <Card
            className={cn(
                "cursor-pointer transition-all border-2",
                isSelected ? 'border-primary ring-2 ring-primary' : 'border-border hover:border-primary/50'
            )}
            onClick={onSelect}
        >
            <div className="aspect-[4/3] rounded-t-lg p-3 overflow-hidden bg-muted">
                <div className="w-full h-full bg-background/50 backdrop-blur-sm rounded-md p-2 flex flex-col gap-2 shadow-inner">
                    {children}
                </div>
            </div>
            <CardHeader className="p-3">
                <CardTitle className="text-sm flex justify-between items-center">
                    {themeName}
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={(e) => { e.stopPropagation(); onPreview(); }}>
                        <Eye className="mr-1 h-3 w-3" /> Preview
                    </Button>
                </CardTitle>
            </CardHeader>
        </Card>
    );
}

function ThemePreview({ themeName, org }: { themeName: string | null; org: Organization }) {
    const [themeObject, setThemeObject] = React.useState<BookTheme | null>(null);

    React.useEffect(() => {
        if (themeName) {
            getThemePresetByName(themeName).then(setThemeObject);
        }
    }, [themeName]);

    if (!themeName || !themeObject) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    const ThemeComponent = themePreviews[themeName];

    return (
        <BookThemeProvider theme={themeObject}>
            <div className="w-full h-full overflow-y-auto">
                <ThemeComponent org={org} />
            </div>
        </BookThemeProvider>
    );
}

// FIX: This function now properly parses the 'founders' array from FormData
function formDataToOrgObject(formData: FormData): Partial<Omit<Organization, 'id' | 'ownerId' | 'createdAt' | 'members'>> {
    const data = Object.fromEntries(formData.entries());

    const founders: Person[] = [];
    for (let i = 0; ; i++) {
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

    return {
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
            tags: (data['taxonomy.tags'] as string)?.split(',').map(s => s.trim()),
        },
        people: founders, // Add the parsed founders here
    };
}


export default function OrganizationDesignerPage({ organizationToEdit, onComplete }: { organizationToEdit?: Organization | null, onComplete?: () => void }) {
    const { toast } = useToast();
    const router = useRouter();
    const isEditMode = !!organizationToEdit;

    const [currentStep, setCurrentStep] = useState(1);
    const [highestStepReached, setHighestStepReached] = useState(isEditMode ? orgFormSteps.length : 1);

    const [formState, setFormState] = useState<FormState>(() => ({
        name: organizationToEdit?.name || '',
        displayName: organizationToEdit?.displayName || '',
        type: organizationToEdit?.type || '',
        industry: organizationToEdit?.industry || '',
        tagline: organizationToEdit?.tagline || '',
        logoUrl: organizationToEdit?.logoUrl || '',
        coverUrl: organizationToEdit?.coverUrl || '',
        registrationNumber: organizationToEdit?.registration?.number || '',
        registrationDate: organizationToEdit?.registration?.date || '',
        registrationPan: organizationToEdit?.registration?.pan || '',
        registrationGstin: organizationToEdit?.registration?.gstin || '',
        registrationCertificateUrl: organizationToEdit?.registration?.certificateUrl || '',
        registrationMsmeId: organizationToEdit?.registration?.msmeId || '',
        officialEmail: organizationToEdit?.contact?.officialEmail || '',
        websiteUrl: organizationToEdit?.contact?.websiteUrl || '',
        primaryPhone: organizationToEdit?.contact?.phone?.primary || '',
        alternatePhone: organizationToEdit?.contact?.phone?.alternate || '',
        addressStreet: organizationToEdit?.contact?.address?.street || '',
        addressCity: organizationToEdit?.contact?.address?.city || '',
        addressState: organizationToEdit?.contact?.address?.state || '',
        addressPincode: organizationToEdit?.contact?.address?.pincode || '',
        addressCountry: organizationToEdit?.contact?.address?.country || 'India',
        googleMapsLink: organizationToEdit?.contact?.googleMapsLink || '',
        facebook: organizationToEdit?.socialLinks?.facebook || '',
        instagram: organizationToEdit?.socialLinks?.instagram || '',
        linkedin: organizationToEdit?.socialLinks?.linkedin || '',
        youtube: organizationToEdit?.socialLinks?.youtube || '',
        twitter: organizationToEdit?.socialLinks?.twitter || '',
        languages: organizationToEdit?.operational?.languages?.join(', ') || '',
        serviceAreas: organizationToEdit?.operational?.serviceAreas?.join(', ') || '',
        membershipDetails: organizationToEdit?.operational?.membershipDetails || '',
        gallery: organizationToEdit?.media?.gallery?.join(', ') || '',
        introVideoUrl: organizationToEdit?.media?.introVideoUrl || '',
        brochureUrl: organizationToEdit?.media?.brochureUrl || '',
        authorizedSignatoryName: organizationToEdit?.compliance?.authorizedSignatory?.name || '',
        authorizedSignatoryDesignation: organizationToEdit?.compliance?.authorizedSignatory?.designation || '',
        authorizedSignatoryPan: organizationToEdit?.compliance?.authorizedSignatory?.pan || '',
        authorityLetterUrl: organizationToEdit?.compliance?.authorityLetterUrl || '',
        keyActivities: organizationToEdit?.about?.keyActivities?.join(', ') || '',
        foundingYear: organizationToEdit?.about?.foundingYear?.toString() || '',
        showAbout: (organizationToEdit?.about as any)?.show ?? true,
        showWorks: (organizationToEdit?.works as any)?.show ?? true,
        showFounders: (organizationToEdit?.people as any)?.show ?? true,
        showGallery: (organizationToEdit?.media as any)?.show ?? true,
        showContact: (organizationToEdit?.contact as any)?.show ?? true,
    }));

    const [longDescription, setLongDescription] = useState(organizationToEdit?.about?.longDescription || '');
    const [missionStatement, setMissionStatement] = useState(organizationToEdit?.about?.missionStatement || '');
    const [visionStatement, setVisionStatement] = useState(organizationToEdit?.about?.visionStatement || '');
    const [longDescriptionEditor, setLongDescriptionEditor] = useState<Editor | null>(null);
    const [missionEditor, setMissionEditor] = useState<Editor | null>(null);
    const [visionEditor, setVisionEditor] = useState<Editor | null>(null);

    const [taxonomyTags, setTaxonomyTags] = useState<string[]>(organizationToEdit?.taxonomy?.tags || []);
    const [founders, setFounders] = useState<Founder[]>(
        organizationToEdit?.people?.map(p => ({ name: p.name || '', role: p.role || '', profileLink: p.profileLink || '' })) ||
        [{ name: '', role: '', profileLink: '' }]
    );
    const [selectedTheme, setSelectedTheme] = useState<string>(organizationToEdit?.theme || 'Saraswati');
    const [previewTheme, setPreviewTheme] = useState<string | null>(null);


    const [operationalHours, setOperationalHours] = useState<Record<string, { from: string; to: string; open: boolean }>>(() => {
        const defaultHours = {
            Monday: { from: '09:00', to: '17:00', open: true },
            Tuesday: { from: '09:00', to: '17:00', open: true },
            Wednesday: { from: '09:00', to: '17:00', open: true },
            Thursday: { from: '09:00', to: '17:00', open: true },
            Friday: { from: '09:00', to: '17:00', open: true },
            Saturday: { from: '09:00', to: '17:00', open: false },
            Sunday: { from: '09:00', to: '17:00', open: false },
        };
        try {
            if (organizationToEdit?.operational?.hours) {
                return JSON.parse(organizationToEdit.operational.hours);
            }
        } catch (e) {
            console.error("Could not parse operational hours:", e);
        }
        return defaultHours;
    });

    const [username, setUsername] = useState(organizationToEdit?.username || '');
    const debouncedUsername = useDebounce(username, 500);
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');

    const actionToUse = isEditMode ? updateOrganizationAction : createOrganizationAction;
    const [state, formAction] = useActionState(actionToUse, null);
    const [isSubmitting, startTransition] = useTransition();

    const updateField = (field: keyof FormState, value: any) => {
        setFormState(prev => ({
            ...prev,
            [field]: value
        }));
    };

    useEffect(() => {
        if (state?.success) {
            toast({ title: "Success!", description: state.message });
            if (onComplete) {
                onComplete();
            } else {
                router.push('/admin/organizations');
            }
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
            const firstErrorField = Object.keys(state.fieldErrors || {})[0];
            const errorStep = orgFormSteps.find(s => s.fields.includes(firstErrorField))?.step || 1;
            setCurrentStep(errorStep);
        }
    }, [state, toast, router, onComplete]);

    useEffect(() => {
        if (debouncedUsername.length < 3 || (isEditMode && debouncedUsername === organizationToEdit.username)) {
            setUsernameStatus('idle');
            return;
        }

        async function check() {
            setUsernameStatus('checking');
            const { available } = await checkOrganizationHandle(debouncedUsername);
            setUsernameStatus(available ? 'available' : 'unavailable');
        }
        check();
    }, [debouncedUsername, isEditMode, organizationToEdit?.username]);

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^a-z0-9_]/gi, '');
        setUsername(value);
    }

    const currentStepData = orgFormSteps[currentStep - 1];

    const handleNextStep = () => {
        if (currentStep < orgFormSteps.length) {
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);
            if (nextStep > highestStepReached) {
                setHighestStepReached(nextStep);
            }
        }
    };

    const handlePrevStep = () => {
         if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    }

    const handleStepClick = (step: number) => {
        if (step <= highestStepReached) {
            setCurrentStep(step);
        }
    }

    const handleFormSubmit = () => {
        const formData = new FormData();
        Object.entries(formState).forEach(([key, value]) => {
            const keyMap = {
                registrationNumber: 'registration.number', registrationDate: 'registration.date', registrationPan: 'registration.pan', registrationGstin: 'registration.gstin', registrationCertificateUrl: 'registration.certificateUrl', registrationMsmeId: 'registration.msmeId',
                officialEmail: 'contact.officialEmail', primaryPhone: 'contact.phone.primary', alternatePhone: 'contact.phone.alternate', websiteUrl: 'contact.websiteUrl', addressStreet: 'contact.address.street', addressCity: 'contact.address.city', addressState: 'contact.address.state', addressPincode: 'contact.address.pincode', addressCountry: 'contact.address.country', googleMapsLink: 'contact.googleMapsLink',
                facebook: 'socialLinks.facebook', instagram: 'socialLinks.instagram', linkedin: 'socialLinks.linkedin', youtube: 'socialLinks.youtube', twitter: 'socialLinks.twitter',
                authorizedSignatoryName: 'compliance.authorizedSignatory.name', authorizedSignatoryDesignation: 'compliance.authorizedSignatory.designation', authorizedSignatoryPan: 'compliance.authorizedSignatory.pan', authorityLetterUrl: 'compliance.authorityLetterUrl',
                gallery: 'media.gallery', introVideoUrl: 'media.introVideoUrl', brochureUrl: 'media.brochureUrl',
                languages: 'operational.languages', serviceAreas: 'operational.serviceAreas', membershipDetails: 'operational.membershipDetails',
                keyActivities: 'about.keyActivities', foundingYear: 'about.foundingYear',
            };
            const formKey = keyMap[key as keyof typeof keyMap] || key;
            if (typeof value === 'boolean') formData.append(formKey, value.toString());
            else if (value) formData.append(formKey, value);
        });

        formData.append('about.longDescription', longDescription);
        formData.append('about.missionStatement', missionStatement);
        formData.append('about.visionStatement', visionStatement);
        formData.append('operational.hours', JSON.stringify(operationalHours));
        founders.forEach((founder, index) => {
            if (founder.name && founder.role) {
                formData.append(`founders[${index}][name]`, founder.name);
                formData.append(`founders[${index}][role]`, founder.role);
                formData.append(`founders[${index}][profileLink]`, founder.profileLink);
            }
        });
        formData.append('taxonomy.tags', taxonomyTags.join(','));
        formData.append('username', username);
        formData.append('theme', selectedTheme);
        if (isEditMode) formData.append('id', organizationToEdit.id);
        startTransition(() => formAction(formData));
    };

    const usernameInputIcon = () => {
        if (isEditMode && username === organizationToEdit.username) return null;
        switch (usernameStatus) {
            case 'checking': return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
            case 'available': return <Check className="h-4 w-4 text-green-500" />;
            case 'unavailable': return <X className="h-4 w-4 text-destructive" />;
            default: return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
        }
    };
    
    const buildPreviewOrg = (): Organization => ({
        id: organizationToEdit?.id || 'preview-org',
        ownerId: organizationToEdit?.ownerId || 'preview-user',
        name: formState.name || 'Organization Name',
        displayName: formState.displayName, type: formState.type, industry: formState.industry, tagline: formState.tagline || 'A brief and compelling tagline for the organization.',
        logoUrl: formState.logoUrl, coverUrl: formState.coverUrl, theme: selectedTheme,
        about: { longDescription: longDescription || 'This is the detailed description...', missionStatement: missionStatement || 'The mission statement...', visionStatement: visionStatement || 'The vision statement...' },
        works: [], people: founders, createdAt: Date.now(),
    } as Organization);

    const renderStepContent = (step: number) => {
        switch(step) {
            case 1: return (
                 <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <Label htmlFor="name">Organization Name*</Label>
                              <Input id="name" value={formState.name} onChange={(e) => updateField('name', e.target.value)} required />
                          </div>
                          <div>
                              <Label htmlFor="displayName">Display Name / Brand Name</Label>
                              <Input id="displayName" value={formState.displayName} onChange={(e) => updateField('displayName', e.target.value)} />
                          </div>
                      </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <Label htmlFor="type">Organization Type*</Label>
                              <Input id="type" value={formState.type} onChange={(e) => updateField('type', e.target.value)} placeholder="e.g., NGO, Trust" required />
                          </div>
                          <div>
                              <Label htmlFor="industry">Industry / Sector</Label>
                              <Input id="industry" value={formState.industry} onChange={(e) => updateField('industry', e.target.value)} placeholder="e.g., Education"/>
                          </div>
                      </div>
                      <div>
                          <Label htmlFor="tagline">Short Tagline / Motto</Label>
                          <Input id="tagline" value={formState.tagline} onChange={(e) => updateField('tagline', e.target.value)} />
                      </div>
                      <p className="text-xs text-muted-foreground">Note: You can upload images from the Media Library page.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <Label htmlFor="logoUrl">Logo URL</Label>
                              <Input id="logoUrl" value={formState.logoUrl} onChange={(e) => updateField('logoUrl', e.target.value)} placeholder="https://..." />
                          </div>
                          <div>
                              <Label htmlFor="coverUrl">Cover Image URL</Label>
                              <Input id="coverUrl" value={formState.coverUrl} onChange={(e) => updateField('coverUrl', e.target.value)} placeholder="https://..." />
                          </div>
                      </div>
                      <div>
                          <Label htmlFor="username">Profile Handle (@username)</Label>
                          <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                              <Input id="username" placeholder="e.g., vaikhari_foundation" value={username} onChange={handleUsernameChange} className="pl-6" disabled={isEditMode} />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2">{usernameInputIcon()}</span>
                          </div>
                          {usernameStatus === 'unavailable' && <p className="text-sm text-destructive mt-1">This handle is already taken.</p>}
                      </div>
                  </div>
            );
            case 2: return (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><Label htmlFor="registrationNumber">Registration Number</Label><Input id="registrationNumber" name="registration.number" value={formState.registrationNumber} onChange={(e) => updateField('registrationNumber', e.target.value)} /></div>
                        <div><Label htmlFor="registrationDate">Registration Date</Label><Input id="registrationDate" name="registration.date" type="date" value={formState.registrationDate} onChange={(e) => updateField('registrationDate', e.target.value)} /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><Label htmlFor="pan">PAN</Label><Input id="pan" name="registration.pan" value={formState.registrationPan} onChange={(e) => updateField('registrationPan', e.target.value)} /></div>
                        <div><Label htmlFor="gstin">GSTIN</Label><Input id="gstin" name="registration.gstin" value={formState.registrationGstin} onChange={(e) => updateField('registrationGstin', e.target.value)} /></div>
                    </div>
                    <div><Label htmlFor="certificateUrl">Registration Certificate URL</Label><Input id="certificateUrl" name="registration.certificateUrl" type="url" value={formState.registrationCertificateUrl} onChange={(e) => updateField('registrationCertificateUrl', e.target.value)} /></div>
                    <div><Label htmlFor="msmeId">MSME / Startup India ID</Label><Input id="msmeId" name="registration.msmeId" value={formState.registrationMsmeId} onChange={(e) => updateField('registrationMsmeId', e.target.value)} /></div>
                </div>
            );
            case 3: return (
                 <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><Label htmlFor="email">Official Email</Label><Input id="email" name="contact.officialEmail" type="email" value={formState.officialEmail} onChange={(e) => updateField('officialEmail', e.target.value)} /></div>
                        <div><Label htmlFor="website">Website URL</Label><Input id="website" name="contact.websiteUrl" type="url" value={formState.websiteUrl} onChange={(e) => updateField('websiteUrl', e.target.value)} /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><Label htmlFor="phone">Primary Phone</Label><Input id="phone" name="contact.phone.primary" type="tel" value={formState.primaryPhone} onChange={(e) => updateField('primaryPhone', e.target.value)} /></div>
                        <div><Label htmlFor="altPhone">Alternate Phone</Label><Input id="altPhone" name="contact.phone.alternate" type="tel" value={formState.alternatePhone} onChange={(e) => updateField('alternatePhone', e.target.value)} /></div>
                    </div>
                    <div><Label>Address</Label>
                        <div className="space-y-2 mt-1">
                            <Input placeholder="Street" value={formState.addressStreet} onChange={(e) => updateField('addressStreet', e.target.value)} />
                            <div className="grid grid-cols-3 gap-2">
                                <Input placeholder="City" value={formState.addressCity} onChange={(e) => updateField('addressCity', e.target.value)} />
                                <Input placeholder="State" value={formState.addressState} onChange={(e) => updateField('addressState', e.target.value)} />
                                <Input placeholder="Pincode" value={formState.addressPincode} onChange={(e) => updateField('addressPincode', e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <div><Label htmlFor="mapsLink">Google Maps Link</Label><Input id="mapsLink" name="contact.googleMapsLink" type="url" value={formState.googleMapsLink} onChange={(e) => updateField('googleMapsLink', e.target.value)} /></div>
                 </div>
            );
            case 4: return (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="longDescription">Long Description</Label>
                        <div className="rounded-md border"><EditorToolbar editor={longDescriptionEditor} /><RichTextEditor id="longDescriptionEditor" content={longDescription} onChange={setLongDescription} setEditorInstance={(id, editor) => setLongDescriptionEditor(editor)} removeEditorInstance={() => {}} /></div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="missionStatement">Mission Statement</Label>
                        <div className="rounded-md border"><EditorToolbar editor={missionEditor} /><RichTextEditor id="missionStatementEditor" content={missionStatement} onChange={setMissionStatement} setEditorInstance={(id, editor) => setMissionEditor(editor)} removeEditorInstance={() => {}}/></div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="visionStatement">Vision Statement</Label>
                        <div className="rounded-md border"><EditorToolbar editor={visionEditor} /><RichTextEditor id="visionStatementEditor" content={visionStatement} onChange={setVisionStatement} setEditorInstance={(id, editor) => setVisionEditor(editor)} removeEditorInstance={() => {}}/></div>
                    </div>
                   <div><Label htmlFor="keyActivities">Key Activities</Label><Input id="keyActivities" name="about.keyActivities" value={formState.keyActivities} onChange={(e) => updateField('keyActivities', e.target.value)} /></div>
                   <div><Label htmlFor="foundingYear">Founding Year</Label><Input id="foundingYear" name="about.foundingYear" type="number" value={formState.foundingYear} onChange={(e) => updateField('foundingYear', e.target.value)} /></div>
                </div>
            );
            case 5: return <DynamicFieldArray items={founders} setItems={setFounders} name="founders" title="Founders / Key People" fields={[{ name: 'name', label: 'Name', type: 'text', required: true },{ name: 'role', label: 'Role', type: 'text', required: true },{ name: 'profileLink', label: 'Profile Link (Optional)', type: 'url' }]} />;
            case 6: return (
                 <div className="space-y-4">
                     <p className="text-sm text-muted-foreground">This information is confidential and used for verification purposes only.</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div><Label htmlFor="authName">Signatory Name</Label><Input id="authName" name="compliance.authorizedSignatory.name" value={formState.authorizedSignatoryName} onChange={(e) => updateField('authorizedSignatoryName', e.target.value)} /></div>
                         <div><Label htmlFor="authDesignation">Signatory Designation</Label><Input id="authDesignation" name="compliance.authorizedSignatory.designation" value={formState.authorizedSignatoryDesignation} onChange={(e) => updateField('authorizedSignatoryDesignation', e.target.value)} /></div>
                     </div>
                     <div><Label htmlFor="authPan">Signatory PAN</Label><Input id="authPan" name="compliance.authorizedSignatory.pan" value={formState.authorizedSignatoryPan} onChange={(e) => updateField('authorizedSignatoryPan', e.target.value)} /></div>
                     <div><Label htmlFor="authLetter">Authority Letter URL</Label><Input id="authLetter" name="compliance.authorityLetterUrl" type="url" value={formState.authorityLetterUrl} onChange={(e) => updateField('authorityLetterUrl', e.target.value)} /></div>
                 </div>
            );
            case 7: return (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Enter URLs for media assets. Multiple URLs can be comma-separated for the gallery.</p>
                    <div><Label htmlFor="gallery">Gallery Images</Label><Textarea id="gallery" name="media.gallery" placeholder="Comma-separated URLs" value={formState.gallery} onChange={(e) => updateField('gallery', e.target.value)} /></div>
                    <div><Label htmlFor="introVideoUrl">Intro Video URL</Label><Input id="introVideoUrl" name="media.introVideoUrl" type="url" value={formState.introVideoUrl} onChange={(e) => updateField('introVideoUrl', e.target.value)} /></div>
                    <div><Label htmlFor="brochureUrl">Brochure URL</Label><Input id="brochureUrl" name="media.brochureUrl" type="url" value={formState.brochureUrl} onChange={(e) => updateField('brochureUrl', e.target.value)} /></div>
                </div>
            );
            case 8: return (
                 <div className="space-y-4">
                    <div><Label>Operating Hours</Label><div className="border rounded-md divide-y">{Object.entries(operationalHours).map(([day, hours]) => (<DayHourSelector key={day} day={day} value={hours} onChange={(newHours) => setOperationalHours(prev => ({...prev, [day]: newHours}))} />))}</div></div>
                    <div><Label htmlFor="languages">Languages</Label><Input id="languages" name="operational.languages" placeholder="Comma-separated" value={formState.languages} onChange={(e) => updateField('languages', e.target.value)} /></div>
                    <div><Label htmlFor="serviceAreas">Service Areas</Label><Input id="serviceAreas" name="operational.serviceAreas" placeholder="Comma-separated" value={formState.serviceAreas} onChange={(e) => updateField('serviceAreas', e.target.value)} /></div>
                    <div><Label htmlFor="membershipDetails">Membership Details</Label><Textarea id="membershipDetails" name="operational.membershipDetails" value={formState.membershipDetails} onChange={(e) => updateField('membershipDetails', e.target.value)} /></div>
                </div>
            );
            case 9: return (
                <div className="space-y-4">
                    <div><Label>Tags</Label><TagInput value={taxonomyTags} onChange={setTaxonomyTags} placeholder="Add relevant tags..." /></div>
                </div>
            );
            case 10: return (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label htmlFor="facebook">Facebook</Label><Input id="facebook" name="socialLinks.facebook" value={formState.facebook} onChange={(e) => updateField('facebook', e.target.value)} /></div>
                    <div><Label htmlFor="instagram">Instagram</Label><Input id="instagram" name="socialLinks.instagram" value={formState.instagram} onChange={(e) => updateField('instagram', e.target.value)} /></div>
                    <div><Label htmlFor="linkedin">LinkedIn</Label><Input id="linkedin" name="socialLinks.linkedin" value={formState.linkedin} onChange={(e) => updateField('linkedin', e.target.value)} /></div>
                    <div><Label htmlFor="youtube">YouTube</Label><Input id="youtube" name="socialLinks.youtube" value={formState.youtube} onChange={(e) => updateField('youtube', e.target.value)} /></div>
                    <div><Label htmlFor="twitter">X (Twitter)</Label><Input id="twitter" name="socialLinks.twitter" value={formState.twitter} onChange={(e) => updateField('twitter', e.target.value)} /></div>
                </div>
            );
            case 11: return (
                 <div className="space-y-3">
                    <div className="flex items-center justify-between"><Label htmlFor="showAbout">About Section</Label><Switch id="showAbout" name="showAbout" checked={formState.showAbout} onCheckedChange={(c) => updateField('showAbout', c)} /></div>
                    <div className="flex items-center justify-between"><Label htmlFor="showWorks">Works Section</Label><Switch id="showWorks" name="showWorks" checked={formState.showWorks} onCheckedChange={(c) => updateField('showWorks', c)} /></div>
                    <div className="flex items-center justify-between"><Label htmlFor="showFounders">Founders Section</Label><Switch id="showFounders" name="showFounders" checked={formState.showFounders} onCheckedChange={(c) => updateField('showFounders', c)} /></div>
                    <div className="flex items-center justify-between"><Label htmlFor="showGallery">Gallery Section</Label><Switch id="showGallery" name="showGallery" checked={formState.showGallery} onCheckedChange={(c) => updateField('showGallery', c)} /></div>
                    <div className="flex items-center justify-between"><Label htmlFor="showContact">Contact Section</Label><Switch id="showContact" name="showContact" checked={formState.showContact} onCheckedChange={(c) => updateField('showContact', c)} /></div>
                </div>
            );
            case 12: return (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <ThemePreviewCard themeName="Saraswati" isSelected={selectedTheme === 'Saraswati'} onSelect={() => setSelectedTheme('Saraswati')} onPreview={() => setPreviewTheme('Saraswati')}>
                         <div className="h-4 w-3/4 rounded-sm bg-[#5D4037]"></div><div className="h-2 w-full rounded-sm bg-[#3E2723]"></div><div className="h-2 w-5/6 rounded-sm bg-[#3E2723]"></div><div className="h-2 w-1/2 rounded-sm bg-[#D5A100]"></div>
                    </ThemePreviewCard>
                    <ThemePreviewCard themeName="Tantra" isSelected={selectedTheme === 'Tantra'} onSelect={() => setSelectedTheme('Tantra')} onPreview={() => setPreviewTheme('Tantra')}>
                        <div className="h-4 w-3/4 rounded-sm bg-red-400"></div><div className="h-2 w-full rounded-sm bg-gray-300"></div><div className="h-2 w-5/6 rounded-sm bg-gray-300"></div><div className="h-2 w-1/2 rounded-sm bg-purple-400"></div>
                    </ThemePreviewCard>
                    <ThemePreviewCard themeName="WabiSabi" isSelected={selectedTheme === 'WabiSabi'} onSelect={() => setSelectedTheme('WabiSabi')} onPreview={() => setPreviewTheme('WabiSabi')}>
                        <div className="h-4 w-3/4 rounded-sm bg-gray-700"></div><div className="h-2 w-full rounded-sm bg-gray-500"></div><div className="h-2 w-5/6 rounded-sm bg-gray-500"></div><div className="h-2 w-1/2 rounded-sm bg-orange-300"></div>
                    </ThemePreviewCard>
                </div>
            );
            default: return <div>Step not implemented.</div>;
        }
    };

    return (
         <>
            <Dialog open={!!previewTheme} onOpenChange={(isOpen) => !isOpen && setPreviewTheme(null)}>
                <DialogContent className="max-w-7xl h-[90vh] p-0 flex flex-col">
                    <DialogHeader className="p-4 border-b flex-shrink-0">
                        <DialogTitle>Theme Preview: {previewTheme}</DialogTitle>
                    </DialogHeader>
                    <BookThemeProvider theme={{id: 'preview', themeName: previewTheme || 'Saraswati', styles: {}} as any}>
                        <ThemePreview themeName={previewTheme} org={buildPreviewOrg()} />
                    </BookThemeProvider>
                </DialogContent>
            </Dialog>

            <div className="container mx-auto py-8 h-full flex flex-col">
                {!isEditMode && (
                     <div className="flex items-center gap-4 mb-8">
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/admin/organizations"><ArrowLeft className="h-4 w-4" /></Link>
                        </Button>
                        <div><h1 className="text-3xl font-bold">Organization Builder</h1><p className="text-muted-foreground">Create a public-facing page for your institution.</p></div>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-12 flex-1 overflow-hidden">
                    <aside className="hidden md:block"><div className="sticky top-24 space-y-2">{orgFormSteps.map(step => (<NavItem key={step.id} step={step} currentStep={currentStep} onStepClick={handleStepClick} disabled={step.step > highestStepReached} />))}</div></aside>
                    <div className="flex flex-col overflow-hidden">
                        <ScrollArea className="flex-1 pr-4 -mr-4">
                           <Card className="shadow-lg">
                                <CardHeader><CardTitle>{currentStepData.label}</CardTitle></CardHeader>
                                <CardContent>{renderStepContent(currentStep)}</CardContent>
                            </Card>
                        </ScrollArea>
                        <div className="flex justify-between mt-8 flex-shrink-0">
                            <Button type="button" variant="outline" onClick={handlePrevStep} disabled={currentStep === 1}><ArrowLeft className="mr-2 h-4 w-4" /> Previous</Button>
                            {currentStep < orgFormSteps.length ? (
                                <Button type="button" onClick={handleNextStep}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={handleFormSubmit}
                                    disabled={(!isEditMode && usernameStatus !== 'available') || isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    {isEditMode ? 'Save Changes' : 'Create Organization'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
         </>
    );
}
