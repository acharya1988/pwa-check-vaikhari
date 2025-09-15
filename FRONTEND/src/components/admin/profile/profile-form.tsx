

'use client';

import React, { useActionState, useState, useRef, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Trash2, Github, Linkedin, Globe } from 'lucide-react';
import { completeOnboarding } from '@/actions/onboarding.actions';
import { TagInput } from '../ui/tag-input';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Separator } from '../ui/separator';
import { VaikhariLogo } from '@/components/icons';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button size="lg" type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Complete Profile & Enter'}
        </Button>
    );
}

function DynamicFieldArray({ name, fields, title }: { name: 'education' | 'experience' | 'portfolio', fields: { name: string, label: string, type: string, required?: boolean }[], title: string }) {
    const [items, setItems] = useState([{}]);

    const addItem = () => setItems([...items, {}]);
    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{title}</h3>
                <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="mr-2 h-4 w-4"/>Add</Button>
            </div>
            {items.map((_, index) => (
                <Card key={index} className="p-4 relative bg-white/5">
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => removeItem(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fields.map(field => (
                        <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                            <Label htmlFor={`${name}[${index}][${field.name}]`}>{field.label}</Label>
                             {field.type === 'textarea' ? (
                                <Textarea id={`${name}[${index}][${field.name}]`} name={`${name}[${index}][${field.name}]`} required={field.required} className="bg-white/10 border-white/20"/>
                            ) : field.type === 'radio' ? (
                                 <RadioGroup name={`${name}[${index}][${field.name}]`} defaultValue="personal" className="flex gap-4 pt-2">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="personal" id={`radio-p-${index}`} /><Label htmlFor={`radio-p-${index}`}>Personal</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="organization" id={`radio-o-${index}`} /><Label htmlFor={`radio-o-${index}`}>Organization</Label></div>
                                </RadioGroup>
                            ) : (
                                <Input id={`${name}[${index}][${field.name}]`} name={`${name}[${index}][${field.name}]`} type={field.type} required={field.required} className="bg-white/10 border-white/20"/>
                            )}
                        </div>
                    ))}
                    </div>
                </Card>
            ))}
        </div>
    )
}

export function ProfileForm() {
    const [state, formAction] = useActionState(completeOnboarding, null);
    const [skills, setSkills] = useState<string[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        if (state?.error) {
            toast({
                variant: 'destructive',
                title: 'Submission Error',
                description: state.error,
            });
            console.log("Field Errors:", state.fieldErrors);
        }
    }, [state, toast]);

    return (
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardHeader className="text-center">
                <CardTitle className="text-3xl">Build Your VAIKHARI Profile</CardTitle>
                <CardDescription className="text-gray-300">
                    This information will be used to create your public profile and generate your resume.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="space-y-8">
                     {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Basic Information</h3>
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" name="name" required className="bg-white/10 border-white/20"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio / About Me</Label>
                            <Textarea id="bio" name="bio" rows={4} maxLength={500} className="bg-white/10 border-white/20" />
                        </div>
                    </div>
                    
                    <Separator className="bg-white/20"/>
                    
                    {/* Skills and Links */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Skills & Links</h3>
                             <div className="space-y-2">
                                <Label htmlFor="skills">Skills</Label>
                                <input type="hidden" name="skills" value={skills.join(',')} />
                                <TagInput value={skills} onChange={setSkills} placeholder="Type a skill and press Enter" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="links.github">GitHub</Label>
                                <div className="relative"><Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input id="links.github" name="links.github" placeholder="https://github.com/..." className="bg-white/10 border-white/20 pl-9"/></div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="links.linkedin">LinkedIn</Label>
                                <div className="relative"><Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input id="links.linkedin" name="links.linkedin" placeholder="https://linkedin.com/in/..." className="bg-white/10 border-white/20 pl-9"/></div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="links.website">Personal Website</Label>
                                <div className="relative"><Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input id="links.website" name="links.website" placeholder="https://..." className="bg-white/10 border-white/20 pl-9"/></div>
                            </div>
                         </div>
                         <div className="space-y-4">
                             <h3 className="text-lg font-semibold">Resume</h3>
                             <div className="space-y-2">
                                <Label htmlFor="resume">Upload Resume (Optional)</Label>
                                <Input id="resume" name="resume" type="file" accept=".pdf" className="bg-white/10 border-white/20 file:text-white" />
                             </div>
                         </div>
                    </div>
                    
                    <Separator className="bg-white/20"/>
                    
                     <DynamicFieldArray name="education" title="Education" fields={[
                        { name: 'institution', label: 'Institution', type: 'text', required: true },
                        { name: 'degree', label: 'Degree', type: 'text', required: true },
                        { name: 'fieldOfStudy', label: 'Field of Study', type: 'text', required: true },
                        { name: 'startYear', label: 'Start Year', type: 'text', required: true },
                        { name: 'endYear', label: 'End Year (or expected)', type: 'text' },
                        { name: 'description', label: 'Description (Optional)', type: 'textarea' },
                    ]}/>
                    
                     <Separator className="bg-white/20"/>
                     
                     <DynamicFieldArray name="experience" title="Experience" fields={[
                        { name: 'company', label: 'Company / Organization', type: 'text', required: true },
                        { name: 'title', label: 'Title', type: 'text', required: true },
                        { name: 'startYear', label: 'Start Year', type: 'text', required: true },
                        { name: 'endYear', label: 'End Year (or current)', type: 'text' },
                        { name: 'description', label: 'Description (Optional)', type: 'textarea' },
                    ]}/>
                    
                    <Separator className="bg-white/20"/>
                    
                     <DynamicFieldArray name="portfolio" title="Portfolio / Organization" fields={[
                        { name: 'name', label: 'Organization/Portfolio Name', type: 'text', required: true },
                        { name: 'type', label: 'Type', type: 'radio' },
                        { name: 'designation', label: 'Your Designation', type: 'text', required: true },
                        { name: 'website', label: 'Website (Optional)', type: 'url' },
                    ]}/>
                    
                    <div className="pt-4">
                        <SubmitButton />
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
