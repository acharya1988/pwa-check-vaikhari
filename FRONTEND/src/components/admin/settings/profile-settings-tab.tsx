

'use client';

import React, { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, Save, Plus, Trash2, Building, User as UserIcon, FileText, Award, Lightbulb, UserCheck, Star, Languages, Github, Linkedin, Globe, X, ArrowLeft, ArrowRight, Lock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile, Education, Experience, Publication, Award as AwardType, Project, Association, Skill, Language } from '@/types';
import { updateProfileSettings } from '@/actions/profile.actions';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { CreatableCombobox } from '@/components/ui/creatable-combobox';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';

function SubmitButton({ children, disabled }: { children?: React.ReactNode, disabled?: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button disabled={pending || disabled} size="lg">
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {children || 'Save Changes'}
        </Button>
    );
}

const MAJOR_LANGUAGES = [
    { value: "Sanskrit", label: "Sanskrit" },
    { value: "English", label: "English" },
    { value: "Hindi", label: "Hindi" },
    { value: "Spanish", label: "Spanish" },
    { value: "French", label: "French" },
    { value: "German", label: "German" },
    { value: "Mandarin Chinese", label: "Mandarin Chinese" },
    { value: "Arabic", label: "Arabic" },
    { value: "Bengali", label: "Bengali" },
    { value: "Russian", label: "Russian" },
    { value: "Portuguese", label: "Portuguese" },
    { value: "Japanese", label: "Japanese" },
    { value: "Kannada", label: "Kannada" },
    { value: "Tamil", label: "Tamil" },
    { value: "Telugu", label: "Telugu" },
];


function DynamicFieldArray({
    name,
    fields,
    title,
    icon: Icon,
    initialItems = []
}: {
    name: 'education' | 'experience' | 'publications' | 'awards' | 'projects' | 'associations' | 'skills' | 'languages',
    fields: { name: string, label: string, type: 'text' | 'textarea' | 'url' | 'number' | 'date' | 'select' | 'creatable-combobox', options?: {value: string, label: string}[] }[],
    title: string,
    icon: React.ElementType,
    initialItems?: any[]
}) {
    const [items, setItems] = useState(initialItems.length > 0 ? initialItems.map(item => ({...item, _id: crypto.randomUUID()})) : [{_id: crypto.randomUUID()}]);

    const addItem = () => setItems([...items, {_id: crypto.randomUUID()}]);
    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

    return (
        <AccordionItem value={name}>
            <AccordionTrigger>
                <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="text-lg font-semibold">{title}</span>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <div className="space-y-4 pt-2">
                    {items.map((item, index) => (
                        <Card key={item._id} className="p-4 relative bg-background/50">
                            <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => removeItem(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {fields.map(field => (
                                    <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                                        <Label htmlFor={`${name}[${index}][${field.name}]`}>{field.label}</Label>
                                        {field.type === 'textarea' ? (
                                            <Textarea id={`${name}[${index}][${field.name}]`} name={`${name}[${index}][${field.name}]`} defaultValue={item[field.name] || ''} />
                                        ) : field.type === 'select' ? (
                                            <Select name={`${name}[${index}][${field.name}]`} defaultValue={item[field.name] || ''}>
                                                <SelectTrigger><SelectValue placeholder={`Select ${field.label}...`} /></SelectTrigger>
                                                <SelectContent>
                                                    {field.options?.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        ) : field.type === 'creatable-combobox' ? (
                                             <CreatableCombobox
                                                name={`${name}[${index}][${field.name}]`}
                                                options={field.options || []}
                                                defaultValue={item[field.name] || ''}
                                                placeholder="Select or create..."
                                            />
                                        ) : (
                                            <Input id={`${name}[${index}][${field.name}]`} name={`${name}[${index}][${field.name}]`} type={field.type} defaultValue={item[field.name] || ''} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}
                    <div className="flex justify-end">
                        <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="mr-2 h-4 w-4"/>Add New</Button>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    )
}

const profileFormSteps = [
    { step: 1, id: "profile", label: "Profile", icon: UserIcon },
    { step: 2, id: "experience", label: "Experience", icon: Building },
    { step: 3, id: "education", label: "Education", icon: Award },
    { step: 4, id: "skills", label: "Skills & Languages", icon: Star },
    { step: 5, id: "accomplishments", label: "Accomplishments", icon: FileText },
    { step: 6, id: "privacy", label: "Privacy", icon: Lock },
];

const NavItem = ({ step, currentStep, onStepClick }: { 
    step: typeof profileFormSteps[number], 
    currentStep: number, 
    onStepClick: (step: number) => void
}) => {
    const isActive = step.step === currentStep;
    return (
        <Button
            type="button"
            variant={isActive ? 'secondary' : 'ghost'}
            className="w-full justify-start gap-3"
            onClick={() => onStepClick(step.step)}
        >
            <step.icon className={cn("h-5 w-5", isActive ? 'text-primary' : 'text-muted-foreground')} />
            <span className={cn(isActive && "font-bold")}>{step.label}</span>
        </Button>
    )
}

function PrivacyVisibilityControl({
    name,
    label,
    defaultValue
}: {
    name: string;
    label: string;
    defaultValue?: 'public' | 'followers' | 'private';
}) {
    const id = name.replace(/\./g, '-');
    return (
        <div className="flex items-center justify-between">
            <Label>{label}</Label>
            <RadioGroup name={name} defaultValue={defaultValue || 'public'} className="flex">
                <div className="flex items-center space-x-2"><RadioGroupItem value="public" id={`${id}-pub`}/><Label htmlFor={`${id}-pub`}>Public</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="followers" id={`${id}-fol`}/><Label htmlFor={`${id}-fol`}>Followers</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="private" id={`${id}-pri`}/><Label htmlFor={`${id}-pri`}>Private</Label></div>
            </RadioGroup>
        </div>
    )
}

function calculateProfileCompletion(profile: UserProfile): number {
    const totalPoints = 11;
    let completedPoints = 0;

    if (profile.name) completedPoints++;
    if (profile.tagline) completedPoints++;
    if (profile.bio) completedPoints++;
    if (profile.links?.website || profile.links?.github || profile.links?.linkedin) completedPoints++;
    if (profile.experience && profile.experience.length > 0) completedPoints++;
    if (profile.education && profile.education.length > 0) completedPoints++;
    if (profile.skills && profile.skills.length > 0) completedPoints++;
    if (profile.languages && profile.languages.length > 0) completedPoints++;
    if (profile.publications && profile.publications.length > 0) completedPoints++;
    if (profile.projects && profile.projects.length > 0) completedPoints++;
    if (profile.associations && profile.associations.length > 0) completedPoints++;

    return Math.round((completedPoints / totalPoints) * 100);
}


export function ProfileSettingsTab({ userProfile }: { userProfile: UserProfile }) {
    const [state, formAction] = useActionState(updateProfileSettings, null);
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    
    const completionPercentage = calculateProfileCompletion(userProfile);

    useEffect(() => {
        if (state?.success) {
            toast({ title: "Success", description: state.message });
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: "Error", description: state.error });
        }
    }, [state, toast]);
    
    const privacyPrefs = userProfile.preferences?.privacy;

    return (
         <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-12">
            <aside className="hidden md:block">
                <div className="sticky top-24 space-y-2">
                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle className="text-base">Profile Completion</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Progress value={completionPercentage} className="h-2" />
                                <span className="font-bold text-sm">{completionPercentage}%</span>
                            </div>
                             <p className="text-xs text-muted-foreground mt-2">
                                {completionPercentage < 100 
                                    ? "Complete your profile to enhance your visibility."
                                    : "Your profile is complete!"
                                }
                            </p>
                        </CardContent>
                    </Card>
                    {profileFormSteps.map(step => (
                        <NavItem
                            key={step.id}
                            step={step}
                            currentStep={currentStep}
                            onStepClick={setCurrentStep}
                        />
                    ))}
                </div>
            </aside>
            <form action={formAction} className="space-y-8">
                 <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                 >
                    <div className={currentStep !== 1 ? 'hidden' : ''}>
                        <Card>
                            <CardHeader><CardTitle>Profile</CardTitle><CardDescription>This information will be displayed publicly on your profile page.</CardDescription></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2"><Label htmlFor="name">Full Name</Label><Input id="name" name="name" defaultValue={userProfile.name} /></div>
                                    <div className="space-y-2"><Label htmlFor="preferredAiName">Preferred AI Name</Label><Input id="preferredAiName" name="preferredAiName" placeholder="e.g., Acharya, Vidvan" defaultValue={userProfile.preferredAiName || ''} /></div>
                                </div>
                                <div className="space-y-2"><Label htmlFor="bio">Bio / About Me</Label><Textarea id="bio" name="bio" defaultValue={userProfile.bio || ''} rows={4} /></div>
                                <div>
                                    <Label>Links</Label>
                                    <div className="space-y-2 mt-2">
                                         <div className="relative"><Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input id="links.github" name="links.github" placeholder="https://github.com/..." defaultValue={userProfile.links?.github} className="pl-9"/></div>
                                         <div className="relative"><Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input id="links.linkedin" name="links.linkedin" placeholder="https://linkedin.com/in/..." defaultValue={userProfile.links?.linkedin} className="pl-9"/></div>
                                         <div className="relative"><Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input id="links.website" name="links.website" placeholder="https://..." defaultValue={userProfile.links?.website} className="pl-9"/></div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    
                    <Accordion type="multiple" className="w-full space-y-4">
                        <div className={currentStep !== 2 ? 'hidden' : ''}>
                            <DynamicFieldArray name="experience" title="Professional Experience" icon={Building} initialItems={userProfile.experience} fields={[
                                { name: 'organization', label: 'Company / Organization*', type: 'text' },
                                { name: 'title', label: 'Role / Title*', type: 'text' },
                                { name: 'startDate', label: 'Start Date*', type: 'text' },
                                { name: 'endDate', label: 'End Date (or "Present")', type: 'text' },
                                { name: 'description', label: 'Description (Optional)', type: 'textarea' },
                            ]}/>
                        </div>

                        <div className={currentStep !== 3 ? 'hidden' : ''}>
                            <DynamicFieldArray name="education" title="Education" icon={Award} initialItems={userProfile.education} fields={[
                                { name: 'institution', label: 'Institution*', type: 'text' },
                                { name: 'degree', label: 'Degree*', type: 'text' },
                                { name: 'fieldOfStudy', label: 'Field of Study*', type: 'text'},
                                { name: 'startYear', label: 'Start Year*', type: 'text'},
                                { name: 'endYear', label: 'End Year (or "Present")', type: 'text' },
                                { name: 'description', label: 'Achievements / Thesis Topic', type: 'textarea' },
                            ]}/>
                        </div>

                        <div className={currentStep !== 4 ? 'hidden' : ''}>
                            <DynamicFieldArray name="skills" title="Skills" icon={Star} initialItems={userProfile.skills as any[]} fields={[
                                { name: 'name', label: 'Skill Name*', type: 'text' },
                                { name: 'proficiency', label: 'Proficiency Level*', type: 'select', options: [{value: 'Beginner', label: 'Beginner'},{value: 'Intermediate', label: 'Intermediate'},{value: 'Expert', label: 'Expert'}] },
                            ]}/>
                            <DynamicFieldArray name="languages" title="Languages" icon={Languages} initialItems={userProfile.languages} fields={[
                                { name: 'name', label: 'Language Name*', type: 'creatable-combobox', options: MAJOR_LANGUAGES },
                                { name: 'proficiency', label: 'Proficiency*', type: 'select', options: [
                                    { value: 'Basic', label: 'Basic' },
                                    { value: 'Conversational', label: 'Conversational' },
                                    { value: 'Fluent', label: 'Fluent' },
                                    { value: 'Native', label: 'Native/Bilingual' },
                                ]},
                            ]}/>
                        </div>

                        <div className={currentStep !== 5 ? 'hidden' : ''}>
                            <DynamicFieldArray name="publications" title="Research & Publications" icon={FileText} initialItems={userProfile.publications} fields={[
                                { name: 'title', label: 'Title*', type: 'text' },
                                { name: 'type', label: 'Type*', type: 'select', options: [{value: 'Journal Article', label: 'Journal Article'}, {value: 'Book', label: 'Book'}, {value: 'Conference Paper', label: 'Conference Paper'}, {value: 'Other', label: 'Other'}] },
                                { name: 'year', label: 'Publication Year', type: 'number' },
                                { name: 'link', label: 'DOI / Link', type: 'url' },
                                { name: 'description', label: 'Brief Description', type: 'textarea' },
                            ]}/>
                            <DynamicFieldArray name="awards" title="Awards & Recognition" icon={Award} initialItems={userProfile.awards} fields={[
                                { name: 'name', label: 'Award Name*', type: 'text' },
                                { name: 'awardingBody', label: 'Awarding Body*', type: 'text' },
                                { name: 'year', label: 'Year', type: 'number' },
                                { name: 'description', label: 'Description', type: 'textarea' },
                            ]}/>
                            <DynamicFieldArray name="projects" title="Projects" icon={Lightbulb} initialItems={userProfile.projects} fields={[
                                { name: 'title', label: 'Project Title*', type: 'text' },
                                { name: 'duration', label: 'Duration (e.g., 2022-2023)', type: 'text' },
                                    { name: 'link', label: 'Project Link', type: 'url' },
                                { name: 'description', label: 'Description', type: 'textarea' },
                            ]}/>
                            <DynamicFieldArray name="associations" title="Professional Associations" icon={UserCheck} initialItems={userProfile.associations} fields={[
                                { name: 'name', label: 'Association Name*', type: 'text' },
                                { name: 'role', label: 'Role*', type: 'text' },
                                { name: 'year', label: 'Year Joined', type: 'number' },
                            ]}/>
                        </div>
                    </Accordion>
                    <div className={currentStep !== 6 ? 'hidden' : ''}>
                        <Card>
                            <CardHeader><CardTitle>Profile Privacy</CardTitle><CardDescription>Control who can see different parts of your profile.</CardDescription></CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <Label className="font-semibold">Section Visibility</Label>
                                    <div className="space-y-4 mt-2 p-4 border rounded-lg">
                                        <PrivacyVisibilityControl name="privacy.visibility.experience" label="Experience" defaultValue={privacyPrefs?.visibility?.experience} />
                                        <PrivacyVisibilityControl name="privacy.visibility.education" label="Education" defaultValue={privacyPrefs?.visibility?.education} />
                                        <PrivacyVisibilityControl name="privacy.visibility.publications" label="Publications" defaultValue={privacyPrefs?.visibility?.publications} />
                                        <PrivacyVisibilityControl name="privacy.visibility.organizations" label="Organizations" defaultValue={privacyPrefs?.visibility?.organizations} />
                                        <PrivacyVisibilityControl name="privacy.visibility.circles" label="Circles" defaultValue={privacyPrefs?.visibility?.circles} />
                                    </div>
                                </div>
                                    <div>
                                    <Label className="font-semibold">Contact & Affiliation Visibility</Label>
                                    <div className="space-y-4 mt-2 p-4 border rounded-lg">
                                        <PrivacyVisibilityControl name="privacy.visibility.email" label="Email Address" defaultValue={privacyPrefs?.visibility?.email} />
                                        <PrivacyVisibilityControl name="privacy.visibility.phone" label="Phone Number" defaultValue={privacyPrefs?.visibility?.phone} />
                                    </div>
                                </div>
                                <div>
                                    <Label className="font-semibold">Resume Download</Label>
                                        <RadioGroup name="privacy.resumeDownload" defaultValue={privacyPrefs?.resumeDownload || 'followers'} className="space-y-2 mt-2 p-4 border rounded-lg">
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="public" id="rd-pub" /><Label htmlFor="rd-pub">Anyone</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="followers" id="rd-fol" /><Label htmlFor="rd-fol">Followers Only</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="private" id="rd-pri" /><Label htmlFor="rd-pri">Only Me</Label></div>
                                    </RadioGroup>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                 </motion.div>
                
                <div className="flex justify-end">
                    <SubmitButton>Save All Changes</SubmitButton>
                </div>
            </form>
        </div>
    );
}
