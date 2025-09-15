'use client';

import React, { useEffect, useRef, useState, type ReactNode, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { saveOrganizationProfile } from '@/services/organization.service';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Stepper, StepperItem, StepperLabel, StepperSeparator } from '@/components/ui/stepper';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, Save, ArrowLeft, ArrowRight, Plus, Trash2, Building, User, FileText, Award, Lightbulb, UserCheck, Star, Languages, Github, Linkedin, Globe } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const orgFormSteps = [
    { step: 1, label: 'Basic Info', fields: ['name', 'displayName', 'type', 'industry', 'tagline', 'logoUrl', 'coverUrl', 'username'] },
    { step: 2, label: "Registration", fields: ['registration.number', 'registration.date', 'registration.pan', 'registration.gstin', 'registration.certificateUrl', 'registration.msmeId'] },
    { step: 3, label: "Contact", fields: ['contact.officialEmail', 'contact.phone.primary', 'contact.phone.alternate', 'contact.websiteUrl', 'contact.address.street', 'contact.address.city', 'contact.address.state', 'contact.address.pincode', 'contact.address.country', 'contact.googleMapsLink'] },
    { step: 4, label: "About", fields: ['about.longDescription', 'about.missionStatement', 'about.visionStatement', 'about.keyActivities', 'about.foundingYear'] },
    { step: 5, label: 'Founders', fields: [] },
    { step: 6, label: "Social", fields: ['socialLinks.facebook', 'socialLinks.instagram', 'socialLinks.linkedin', 'socialLinks.youtube', 'socialLinks.twitter'] },
    { step: 7, label: "Verification", fields: ['compliance.authorizedSignatory.name', 'compliance.authorizedSignatory.designation', 'compliance.authorizedSignatory.pan', 'compliance.authorityLetterUrl'] },
    { step: 8, label: "Media", fields: ['media.gallery', 'media.introVideoUrl', 'media.brochureUrl'] },
    { step: 9, label: "Operational", fields: ['operational.hours', 'operational.languages', 'operational.serviceAreas', 'operational.membershipDetails'] },
    { step: 10, label: "Taxonomy", fields: ['taxonomy.primaryCategory', 'taxonomy.secondaryCategories', 'taxonomy.tags'] },
    { step: 11, label: "Visibility", fields: ['showAbout', 'showWorks', 'showFounders', 'showGallery', 'showContact'] },
];

// Server action function
async function saveOrganizationAction(prevState: any, formData: FormData) {
    try {
        const data = Object.fromEntries(formData.entries());
        await saveOrganizationProfile(data as any);
        return { success: true, message: 'Organization profile saved!' };
    } catch(e: any) {
        return { error: e.message };
    }
}

function DynamicFieldArray({ name, fields, title }: { 
    name: 'founders', 
    fields: { name: string, label: string, type: string, required?: boolean }[], 
    title: string 
}) {
    const [items, setItems] = useState([{}]);

    const addItem = () => setItems([...items, {}]);
    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{title}</h3>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="mr-2 h-4 w-4"/>Add
                </Button>
            </div>
            {items.map((_, index) => (
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
                                    name={`${name}[${index}][${field.name}]`} 
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

function SubmitButton({ children, disabled }: { children?: React.ReactNode, disabled?: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending || disabled}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {children || 'Save Changes'}
        </Button>
    );
}

export default function OrganizationDesignerPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    
    const [state, formAction] = useActionState(saveOrganizationAction, null);

    useEffect(() => {
        if (state?.success) {
            toast({ title: "Success!", description: state.message });
            router.push('/admin/organizations');
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast, router]);

    const goToNextStep = () => setCurrentStep(prev => (prev < orgFormSteps.length ? prev + 1 : prev));
    const goToPrevStep = () => setCurrentStep(prev => (prev > 1 ? prev - 1 : prev));

    return (
         <div className="container mx-auto max-w-5xl py-8">
             <div className="mb-6">
                <Button variant="link" className="p-0 h-auto text-muted-foreground" asChild>
                    <Link href="/admin/organizations">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Organizations
                    </Link>
                </Button>
            </div>
            <h1 className="text-3xl font-bold mb-2 text-center">Organization Builder</h1>
            <p className="text-muted-foreground mb-8 text-center">Create a public-facing page for your institution.</p>

            <div className="mb-12 overflow-x-auto scrollable">
                <div className="min-w-[900px] px-4">
                    <Stepper>
                        {orgFormSteps.map(({ step, label }) => (
                            <React.Fragment key={step}>
                                <div onClick={() => setCurrentStep(step)} className="cursor-pointer text-center">
                                    <StepperItem isCompleted={currentStep > step} isActive={currentStep === step}>
                                        {step}
                                    </StepperItem>
                                    <StepperLabel isActive={currentStep === step}>{label}</StepperLabel>
                                </div>
                                {step < orgFormSteps.length && <StepperSeparator />}
                            </React.Fragment>
                        ))}
                    </Stepper>
                </div>
            </div>

            <form action={formAction}>
                 <ScrollArea className="h-96 pr-6">
                    <div className="space-y-6">
                         {/* Step 1: Basic Information */}
                         <div className={cn(currentStep !== 1 && "hidden")}>
                            <Card>
                                <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="handle">Handle*</Label>
                                            <Input id="handle" name="handle" required placeholder="unique-org-handle" />
                                        </div>
                                        <div>
                                            <Label htmlFor="name">Organization Name*</Label>
                                            <Input id="name" name="name" required />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="type">Organization Type*</Label>
                                            <Input id="type" name="type" placeholder="e.g., NGO, Trust" required />
                                        </div>
                                        <div>
                                            <Label htmlFor="industry">Industry / Sector</Label>
                                            <Input id="industry" name="industry" placeholder="e.g., Education" />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="tagline">Short Tagline / Motto</Label>
                                        <Input id="tagline" name="tagline" />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Note: You can upload images from the Media Library page.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="logoUrl">Logo URL</Label>
                                            <Input id="logoUrl" name="logoUrl" placeholder="https://..." />
                                        </div>
                                        <div>
                                            <Label htmlFor="coverUrl">Cover Image URL</Label>
                                            <Input id="coverUrl" name="coverUrl" placeholder="https://..." />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        {/* Step 2: Registration */}
                        <div className={cn(currentStep !== 2 && "hidden")}>
                             <Card>
                                <CardHeader><CardTitle>Registration Details</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="registrationNumber">Registration Number</Label>
                                            <Input id="registrationNumber" name="registrationNumber" />
                                        </div>
                                        <div>
                                            <Label htmlFor="registrationDate">Registration Date</Label>
                                            <Input id="registrationDate" name="registrationDate" type="date" />
                                        </div>
                                    </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="pan">PAN</Label>
                                            <Input id="pan" name="pan" />
                                        </div>
                                        <div>
                                            <Label htmlFor="gstin">GSTIN</Label>
                                            <Input id="gstin" name="gstin" />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="certificateUrl">Registration Certificate URL</Label>
                                        <Input id="certificateUrl" name="certificateUrl" type="url" />
                                    </div>
                                    <div>
                                        <Label htmlFor="msmeStartupId">MSME / Startup India ID</Label>
                                        <Input id="msmeStartupId" name="msmeStartupId" />
                                    </div>
                                </CardContent>
                             </Card>
                        </div>
                        {/* Step 3: Contact */}
                        <div className={cn(currentStep !== 3 && "hidden")}>
                             <Card>
                                <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="email">Official Email</Label>
                                            <Input id="email" name="email" type="email" />
                                        </div>
                                        <div>
                                            <Label htmlFor="website">Website URL</Label>
                                            <Input id="website" name="website" type="url" />
                                        </div>
                                    </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="phone">Primary Phone</Label>
                                            <Input id="phone" name="phone" type="tel" />
                                        </div>
                                        <div>
                                            <Label htmlFor="altPhone">Alternate Phone</Label>
                                            <Input id="altPhone" name="altPhone" type="tel" />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="address">Address</Label>
                                        <Input id="address" name="address" placeholder="Street Address" />
                                    </div>
                                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                         <Input name="city" placeholder="City" />
                                         <Input name="state" placeholder="State" />
                                         <Input name="pincode" placeholder="Pincode" />
                                     </div>
                                      <div>
                                        <Label htmlFor="mapsLink">Google Maps Link</Label>
                                        <Input id="mapsLink" name="mapsLink" type="url" />
                                      </div>
                                </CardContent>
                             </Card>
                        </div>
                        {/* Step 4: About */}
                         <div className={cn(currentStep !== 4 && "hidden")}>
                            <Card>
                                <CardHeader><CardTitle>About Section</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="longDescription">Long Description (HTML supported)</Label>
                                        <Textarea id="longDescription" name="longDescription" rows={5} />
                                    </div>
                                    <div>
                                        <Label htmlFor="missionHtml">Mission Statement (HTML supported)</Label>
                                        <Textarea id="missionHtml" name="missionHtml" rows={3}/>
                                    </div>
                                    <div>
                                        <Label htmlFor="visionHtml">Vision Statement (HTML supported)</Label>
                                        <Textarea id="visionHtml" name="visionHtml" rows={3} />
                                    </div>
                                    <div>
                                        <Label htmlFor="keyActivities">Key Activities (comma-separated)</Label>
                                        <Input id="keyActivities" name="keyActivities" />
                                    </div>
                                    <div>
                                        <Label htmlFor="foundingYear">Founding Year</Label>
                                        <Input id="foundingYear" name="foundingYear" type="number" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        {/* Step 5: Founders */}
                         <div className={cn(currentStep !== 5 && "hidden")}>
                            <DynamicFieldArray name="founders" title="Founders / Key People" fields={[
                                { name: 'name', label: 'Name', type: 'text', required: true },
                                { name: 'role', label: 'Role', type: 'text', required: true },
                                { name: 'profileLink', label: 'Profile Link (Optional)', type: 'url' },
                            ]} />
                         </div>
                        {/* Step 6: Social Media */}
                         <div className={cn(currentStep !== 6 && "hidden")}>
                            <Card>
                                <CardHeader><CardTitle>Social Media Links</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="facebook">Facebook</Label>
                                            <Input id="facebook" name="facebook" />
                                        </div>
                                        <div>
                                            <Label htmlFor="instagram">Instagram</Label>
                                            <Input id="instagram" name="instagram" />
                                        </div>
                                        <div>
                                            <Label htmlFor="linkedin">LinkedIn</Label>
                                            <Input id="linkedin" name="linkedin" />
                                        </div>
                                        <div>
                                            <Label htmlFor="youtube">YouTube</Label>
                                            <Input id="youtube" name="youtube" />
                                        </div>
                                        <div>
                                            <Label htmlFor="twitter">X (Twitter)</Label>
                                            <Input id="twitter" name="twitter" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                         </div>
                        {/* Step 7: Verification */}
                         <div className={cn(currentStep !== 7 && "hidden")}>
                             <Card>
                                <CardHeader>
                                    <CardTitle>Verification & Compliance</CardTitle>
                                    <CardDescription>This information is confidential and used for verification purposes only.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="compliance.authorizedSignatory.name">Authorized Signatory Name</Label>
                                            <Input id="compliance.authorizedSignatory.name" name="compliance.authorizedSignatory.name" />
                                        </div>
                                        <div>
                                            <Label htmlFor="compliance.authorizedSignatory.designation">Designation</Label>
                                            <Input id="compliance.authorizedSignatory.designation" name="compliance.authorizedSignatory.designation" />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="compliance.authorizedSignatory.pan">Authorized Signatory PAN</Label>
                                        <Input id="compliance.authorizedSignatory.pan" name="compliance.authorizedSignatory.pan" />
                                    </div>
                                    <div>
                                        <Label htmlFor="compliance.authorityLetterUrl">Authority Letter URL</Label>
                                        <Input id="compliance.authorityLetterUrl" name="compliance.authorityLetterUrl" type="url" />
                                    </div>
                                </CardContent>
                            </Card>
                         </div>
                        {/* Step 8: Media */}
                        <div className={cn(currentStep !== 8 && "hidden")}>
                           <Card>
                                <CardHeader><CardTitle>Media Assets</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-muted-foreground">Enter URLs for media assets. Multiple URLs can be comma-separated for the gallery.</p>
                                    <div>
                                        <Label htmlFor="galleryCsv">Photo Gallery (comma-separated URLs)</Label>
                                        <Textarea id="galleryCsv" name="galleryCsv" />
                                    </div>
                                    <div>
                                        <Label htmlFor="videoUrl">Introductory Video URL</Label>
                                        <Input id="videoUrl" name="videoUrl" type="url" />
                                    </div>
                                    <div>
                                        <Label htmlFor="brochureUrl">Brochure/Catalogue URL</Label>
                                        <Input id="brochureUrl" name="brochureUrl" type="url" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        {/* Step 9: Operational */}
                        <div className={cn(currentStep !== 9 && "hidden")}>
                             <Card>
                                <CardHeader><CardTitle>Operational Details</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="operatingHours">Operating Hours</Label>
                                        <Input id="operatingHours" name="operatingHours" placeholder="e.g., 10 AM - 6 PM, Mon-Fri" />
                                    </div>
                                    <div>
                                        <Label htmlFor="languagesCsv">Languages (comma-separated)</Label>
                                        <Input id="languagesCsv" name="languagesCsv" />
                                    </div>
                                    <div>
                                        <Label htmlFor="serviceAreasCsv">Service Areas (comma-separated)</Label>
                                        <Input id="serviceAreasCsv" name="serviceAreasCsv" placeholder="e.g., Bengaluru, Karnataka, India" />
                                    </div>
                                    <div>
                                        <Label htmlFor="membershipHtml">Membership Details (HTML supported)</Label>
                                        <Textarea id="membershipHtml" name="membershipHtml" />
                                    </div>
                                </CardContent>
                             </Card>
                        </div>
                        {/* Step 10: Taxonomy */}
                        <div className={cn(currentStep !== 10 && "hidden")}>
                             <Card>
                                <CardHeader><CardTitle>Taxonomy</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="taxonomy.primaryCategory">Primary Category</Label>
                                        <Input id="taxonomy.primaryCategory" name="taxonomy.primaryCategory" placeholder="e.g., Education" />
                                    </div>
                                    <div>
                                        <Label htmlFor="taxonomy.secondaryCategories">Secondary Categories (comma-separated)</Label>
                                        <Input id="taxonomy.secondaryCategories" name="taxonomy.secondaryCategories" />
                                    </div>
                                    <div>
                                        <Label htmlFor="taxonomy.tags">Keywords/Tags (comma-separated)</Label>
                                        <Input id="taxonomy.tags" name="taxonomy.tags" />
                                    </div>
                                </CardContent>
                             </Card>
                        </div>
                         {/* Step 11: Visibility */}
                         <div className={cn(currentStep !== 11 && "hidden")}>
                           <Card>
                                <CardHeader>
                                    <CardTitle>Section Visibility</CardTitle>
                                    <CardDescription>Control which sections appear on your public page.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="showAbout">About Section</Label>
                                        <Switch id="showAbout" name="showAbout" defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="showWorks">Works Section</Label>
                                        <Switch id="showWorks" name="showWorks" defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="showFounders">Founders Section</Label>
                                        <Switch id="showFounders" name="showFounders" defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="showGallery">Gallery Section</Label>
                                        <Switch id="showGallery" name="showGallery" defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="showContact">Contact Section</Label>
                                        <Switch id="showContact" name="showContact" defaultChecked />
                                    </div>
                                </CardContent>
                           </Card>
                        </div>
                    </div>
                </ScrollArea>
                <div className="flex justify-between mt-8">
                    <Button type="button" variant="outline" onClick={goToPrevStep} disabled={currentStep === 1}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                    </Button>
                    {currentStep < orgFormSteps.length ? (
                        <Button type="button" onClick={goToNextStep}>
                        Next <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <SubmitButton>Create / Update Organization</SubmitButton>
                    )}
                </div>
            </form>
        </div>
    );
}
