
'use client';

import React, { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, Save, Plus, Trash2, Building, User as UserIcon, FileText, Award, Lightbulb, UserCheck, Star, Languages, Github, Linkedin, Globe } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfileInService } from '@/services/user.service';
import type { UserProfile, Education, Experience, Publication, Award, Project, Association, Skill, Language } from '@/types';
import { updateProfileSettings } from '@/actions/profile.actions';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

function SubmitButton({ children, disabled }: { children?: React.ReactNode, disabled?: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button disabled={pending || disabled}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {children || 'Save Changes'}
        </Button>
    );
}

function DynamicFieldArray({
    name,
    fields,
    title,
    icon: Icon,
    initialItems = []
}: {
    name: 'education' | 'experience' | 'publications' | 'awards' | 'projects' | 'associations' | 'skills' | 'languages',
    fields: { name: string, label: string, type: 'text' | 'textarea' | 'url' | 'number' | 'date' | 'select', options?: { value: string, label: string }[] }[],
    title: string,
    icon: React.ElementType,
    initialItems?: any[]
}) {
    const [items, setItems] = useState(initialItems.length > 0 ? initialItems : [{}]);

    const addItem = () => setItems([...items, {}]);
    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

    const handleItemChange = (index: number, fieldName: string, value: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [fieldName]: value };
        setItems(newItems);
    };

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
                        <Card key={index} className="p-4 relative bg-background/50">
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
                                        ) : (
                                            <Input id={`${name}[${index}][${field.name}]`} name={`${name}[${index}][${field.name}]`} type={field.type} defaultValue={item[field.name] || ''} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}
                    <div className="flex justify-end">
                        <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="mr-2 h-4 w-4" />Add New</Button>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}


export function ProfileSettingsTab({ userProfile }: { userProfile: UserProfile }) {
    const [state, formAction] = useActionState(updateProfileSettings, null);
    const { toast } = useToast();

    useEffect(() => {
        if (state?.success) {
            toast({ title: "Success", description: state.message });
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: "Error", description: state.error });
        }
    }, [state, toast]);

    return (
        <form action={formAction} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>This information will be displayed publicly on your profile page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" name="name" defaultValue={userProfile.name} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="preferredAiName">Preferred AI Name</Label>
                            <Input id="preferredAiName" name="preferredAiName" placeholder="e.g., Acharya, Vidvan" defaultValue={userProfile.preferredAiName || ''} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bio">Bio / About Me</Label>
                        <Textarea id="bio" name="bio" defaultValue={userProfile.bio || ''} rows={4} />
                    </div>
                    <div>
                        <Label>Links</Label>
                        <div className="space-y-2 mt-2">
                             <div className="relative"><Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input id="links.github" name="links.github" placeholder="https://github.com/..." defaultValue={userProfile.links?.github} className="pl-9"/></div>
                             <div className="relative"><Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input id="links.linkedin" name="links.linkedin" placeholder="https://linkedin.com/in/..." defaultValue={userProfile.links?.linkedin} className="pl-9"/></div>
                             <div className="relative"><Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input id="links.website" name="links.website" placeholder="https://..." defaultValue={userProfile.links?.website} className="pl-9"/></div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter><SubmitButton>Save Profile</SubmitButton></CardFooter>
            </Card>
            <Accordion type="multiple" className="w-full space-y-4">
                 <DynamicFieldArray name="education" title="Education" icon={Building} initialItems={userProfile.education} fields={[
                    { name: 'institution', label: 'Institution*', type: 'text' },
                    { name: 'degree', label: 'Degree*', type: 'text' },
                    { name: 'fieldOfStudy', label: 'Field of Study*', type: 'text' },
                    { name: 'startYear', label: 'Start Year*', type: 'text'},
                    { name: 'endYear', label: 'End Year (or "Present")', type: 'text' },
                    { name: 'description', label: 'Description (Optional)', type: 'textarea' },
                ]}/>
                 <DynamicFieldArray name="experience" title="Professional Experience" icon={UserIcon} initialItems={userProfile.experience} fields={[
                    { name: 'organization', label: 'Company / Organization*', type: 'text' },
                    { name: 'title', label: 'Role / Title*', type: 'text' },
                    { name: 'startDate', label: 'Start Date*', type: 'text' },
                    { name: 'endDate', label: 'End Date (or "Present")', type: 'text' },
                    { name: 'description', label: 'Description (Optional)', type: 'textarea' },
                ]}/>
                 <DynamicFieldArray name="skills" title="Skills" icon={Star} initialItems={userProfile.skills as any[]} fields={[
                    { name: 'name', label: 'Skill Name*', type: 'text' },
                    { name: 'proficiency', label: 'Proficiency Level*', type: 'select', options: [{value: 'Beginner', label: 'Beginner'},{value: 'Intermediate', label: 'Intermediate'},{value: 'Expert', label: 'Expert'}] },
                ]}/>
                <DynamicFieldArray name="languages" title="Languages" icon={Languages} initialItems={userProfile.languages} fields={[
                    { name: 'name', label: 'Language*', type: 'text' },
                    { name: 'proficiency', label: 'Proficiency*', type: 'select', options: [{value: 'Basic', label: 'Basic'},{value: 'Conversational', label: 'Conversational'},{value: 'Fluent', label: 'Fluent'},{value: 'Native', label: 'Native/Bilingual'}] },
                ]}/>
                 <DynamicFieldArray name="publications" title="Publications" icon={FileText} initialItems={userProfile.publications} fields={[
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
            </Accordion>
            <div className="flex justify-end">
                <SubmitButton>Save All Changes</SubmitButton>
            </div>
        </form>
    )
}
