
'use client';

import React, { useActionState, useEffect, useRef, useState, type ReactNode, useCallback } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { getMediaFiles } from '@/services/media.service';
import { useToast } from '@/hooks/use-toast';
import { createOrganizationAction, updateProfileImage, createCircleAction } from '@/actions/profile.actions';
import { Loader2, Check, Edit, Plus, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import { MediaUploader } from '../media-uploader';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import type { Organization, UserProfile, Circle } from '@/types';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Stepper, StepperItem, StepperLabel, StepperSeparator } from '@/components/ui/stepper';
import { CreatableCombobox } from '../ui/creatable-combobox';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';


// A new component for the cover image adjustment UI
function CoverPhotoAdjuster({
    imageUrl,
    onSave,
    onCancel,
}: {
    imageUrl: string;
    onSave: (position: string) => void;
    onCancel: () => void;
}) {
    const [position, setPosition] = useState(50); // Vertical position in %
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ y: 0, startPosition: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
        dragStartRef.current = { y: e.clientY, startPosition: position };
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging || !containerRef.current) return;
        const deltaY = e.clientY - dragStartRef.current.y;
        
        // Adjust sensitivity: a full drag of the container height moves the image by 50 percentage points
        const sensitivityFactor = 50 / containerRef.current.offsetHeight;
        const positionChange = deltaY * sensitivityFactor;
        
        let newPosition = dragStartRef.current.startPosition + positionChange;
        newPosition = Math.max(0, Math.min(100, newPosition)); // Clamp between 0% and 100%
        
        setPosition(newPosition);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };
    
    const handleSaveClick = () => {
        onSave(`50% ${position.toFixed(2)}%`);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 pt-0 space-y-2">
                <h4 className="font-semibold text-sm">Adjust Cover Photo</h4>
                <p className="text-xs text-muted-foreground">Click and drag the image vertically to reposition it.</p>
            </div>
            <div 
                ref={containerRef}
                className="relative aspect-[16/9] w-full overflow-hidden bg-muted rounded-md cursor-grab active:cursor-grabbing mx-6"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <Image 
                    src={imageUrl} 
                    alt="Cover preview" 
                    fill 
                    className="object-cover pointer-events-none" 
                    style={{ objectPosition: `50% ${position}%`}} 
                    priority
                />
            </div>
            <div className="mt-auto p-6 border-t flex justify-between items-center">
                <Button type="button" variant="ghost" onClick={onCancel}>Back to Library</Button>
                <Button type="button" onClick={handleSaveClick}>Save Position</Button>
            </div>
        </div>
    );
}


export function ProfileImageUpdater({ 
    children, 
    imageType 
}: { 
    children: React.ReactNode; 
    imageType: 'avatar' | 'cover';
}) {
    const [open, setOpen] = useState(false);
    const [mediaFiles, setMediaFiles] = useState<string[]>([]);
    const [view, setView] = useState<'library' | 'adjust'>('library');
    const [imageToAdjust, setImageToAdjust] = useState<string | null>(null);

    const [state, formAction] = useActionState(updateProfileImage, null);
    const { toast } = useToast();
    const router = useRouter();

    const fetchMedia = useCallback(() => {
        getMediaFiles().then(setMediaFiles);
    }, []);

    useEffect(() => {
        if (open) {
            fetchMedia();
        } else {
            // Reset view when sheet is closed
            setTimeout(() => {
                setView('library');
                setImageToAdjust(null);
            }, 300);
        }
    }, [open, fetchMedia]);

    useEffect(() => {
        if (state?.success) {
            toast({ title: state.message });
            setOpen(false);
            router.refresh();
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: 'Update failed', description: state.error });
        }
    }, [state, toast, router]);

    const handleSelectImage = (imageUrl: string) => {
        if (imageType === 'avatar') {
            const formData = new FormData();
            formData.append('imageType', 'avatar');
            formData.append('imageUrl', imageUrl);
            formAction(formData);
        } else { // cover
            setImageToAdjust(imageUrl);
            setView('adjust');
        }
    };

    const handleSavePosition = (position: string) => {
        if (!imageToAdjust) return;
        const formData = new FormData();
        formData.append('imageType', 'cover');
        formData.append('imageUrl', imageToAdjust);
        formData.append('imagePosition', position);
        formAction(formData);
    }
    
    const captureMode = imageType === 'avatar' ? 'user' : 'environment';

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent className="flex flex-col p-0">
                <SheetHeader className="p-6 pb-2">
                    <SheetTitle>Select new {imageType} image</SheetTitle>
                </SheetHeader>
                
                {view === 'library' && (
                    <>
                        <div className="p-6 pt-2 border-y">
                            <MediaUploader showCard={false} onUploadSuccess={fetchMedia} capture={captureMode} />
                        </div>
                        <ScrollArea className="flex-1">
                            {mediaFiles.length > 0 ? (
                                <div className="grid grid-cols-2 gap-4 p-6">
                                    {mediaFiles.map(fileUrl => (
                                        <button 
                                            key={fileUrl} 
                                            className="relative aspect-square overflow-hidden rounded-md border group focus:outline-none focus:ring-2 focus:ring-primary"
                                            onClick={() => handleSelectImage(fileUrl)}
                                        >
                                            <Image
                                                src={fileUrl}
                                                alt=""
                                                fill
                                                sizes="(max-width: 768px) 50vw, 25vw"
                                                className="object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                                    <p>Your media library is empty.</p>
                                </div>
                            )}
                        </ScrollArea>
                    </>
                )}

                {view === 'adjust' && imageToAdjust && (
                    <CoverPhotoAdjuster 
                        imageUrl={imageToAdjust} 
                        onSave={handleSavePosition} 
                        onCancel={() => setView('library')} 
                    />
                )}
            </SheetContent>
        </Sheet>
    );
}

function SubmitButton({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}

export function CreateCircleDialog({ children, onCircleCreated, forceType }: { 
    children: React.ReactNode; 
    onCircleCreated?: () => void;
    forceType?: 'organization' | 'personal';
}) {
    const [open, setOpen] = useState(false);
    const [state, formAction] = useActionState(createCircleAction, null);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state?.success) {
            toast({ title: state.message });
            formRef.current?.reset();
            setOpen(false);
            onCircleCreated?.();
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast, onCircleCreated]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a New Circle</DialogTitle>
                    <DialogDescription>Build a community around a topic or interest.</DialogDescription>
                </DialogHeader>
                <form ref={formRef} action={formAction} className="space-y-4">
                     <div>
                        <Label htmlFor="name">Circle Name</Label>
                        <Input id="name" name="name" required />
                        {state?.fieldErrors?.name && <p className="text-sm text-destructive mt-1">{state.fieldErrors.name[0]}</p>}
                    </div>
                     <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" required />
                        {state?.fieldErrors?.description && <p className="text-sm text-destructive mt-1">{state.fieldErrors.description[0]}</p>}
                    </div>
                     <div>
                        <Label>Circle Type</Label>
                        <input type="hidden" name="type" value={forceType || 'personal'} />
                         <RadioGroup defaultValue={forceType || 'personal'} name="type" className="flex gap-4">
                            <Label htmlFor="type-personal" className="flex items-center gap-2 border rounded-md p-3 flex-1 cursor-pointer has-[:checked]:border-primary">
                                <RadioGroupItem value="personal" id="type-personal" disabled={!!forceType} />
                                <div><p className="font-semibold">Personal</p><p className="text-xs text-muted-foreground">A group for friends or colleagues.</p></div>
                            </Label>
                             <Label htmlFor="type-org" className="flex items-center gap-2 border rounded-md p-3 flex-1 cursor-pointer has-[:checked]:border-primary">
                                <RadioGroupItem value="organization" id="type-org" disabled={!!forceType} />
                                <div><p className="font-semibold">Organization</p><p className="text-xs text-muted-foreground">Represents an institution or company.</p></div>
                            </Label>
                        </RadioGroup>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                        <Button type="submit">Create Circle</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

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
];

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
                <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="mr-2 h-4 w-4"/>Add</Button>
            </div>
            {items.map((_, index) => (
                <Card key={index} className="p-4 relative bg-background/50">
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => removeItem(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fields.map(field => (
                            <div key={field.name} className={field.name === 'profileLink' ? 'md:col-span-2' : ''}>
                                <Label htmlFor={`${name}[${index}][${field.name}]`}>{field.label}</Label>
                                <Input id={`${name}[${index}][${field.name}]`} name={`${name}[${index}][${field.name}]`} type={field.type} required={field.required} />
                            </div>
                        ))}
                    </div>
                </Card>
            ))}
        </div>
    )
}

export function CreateOrganizationDialog({ children, onOrganizationCreated }: { children: React.ReactNode; onOrganizationCreated?: () => void; }) {
    const [open, setOpen] = useState(false);
    const [state, formAction] = useActionState(createOrganizationAction, null);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [currentStep, setCurrentStep] = useState(1);
    
    const goToNextStep = () => {
        if (currentStep < orgFormSteps.length) {
            setCurrentStep(currentStep + 1);
        }
    };
    const goToPrevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    useEffect(() => {
        if (state?.success) {
            toast({ title: "Success!", description: state.message });
            setOpen(false);
            formRef.current?.reset();
            setCurrentStep(1);
            onOrganizationCreated?.();
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
            const firstErrorField = Object.keys(state.fieldErrors || {})[0];
            const errorStep = orgFormSteps.find(s => s.fields.includes(firstErrorField))?.step || 1;
            setCurrentStep(errorStep);
        }
    }, [state, toast, onOrganizationCreated]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Create New Organization</DialogTitle>
                    <DialogDescription>
                        Establish a formal entity like a foundation, trust, or company on the platform.
                    </DialogDescription>
                </DialogHeader>
                <div className="my-4 overflow-x-auto scrollable pb-4">
                    <div className="min-w-[800px] px-4">
                        <Stepper>
                            {orgFormSteps.map(({ step, label }) => (
                                <React.Fragment key={step}>
                                    <div onClick={() => setCurrentStep(step)} className="cursor-pointer">
                                        <StepperItem isCompleted={currentStep > step} isActive={currentStep === step}>{step}</StepperItem>
                                        <StepperLabel isActive={currentStep === step}>{label}</StepperLabel>
                                    </div>
                                    {step < orgFormSteps.length && <StepperSeparator />}
                                </React.Fragment>
                            ))}
                        </Stepper>
                    </div>
                </div>
                <form ref={formRef} action={formAction}>
                    <ScrollArea className="h-96 pr-6">
                        <div className="space-y-6">
                            {/* Step 1: Basic Information */}
                            <div className={cn(currentStep !== 1 && "hidden")}>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><Label htmlFor="name">Organization Name*</Label><Input id="name" name="name" required /></div>
                                        <div><Label htmlFor="displayName">Display Name / Brand Name</Label><Input id="displayName" name="displayName" /></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><Label htmlFor="type">Organization Type*</Label><Input id="type" name="type" placeholder="e.g., NGO, Trust" required /></div>
                                        <div><Label htmlFor="industry">Industry / Sector</Label><Input id="industry" placeholder="e.g., Education" /></div>
                                    </div>
                                    <div><Label htmlFor="tagline">Short Tagline / Motto</Label><Input id="tagline" name="tagline" /></div>
                                    <p className="text-xs text-muted-foreground">Note: You can upload images from the Media Library page.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><Label htmlFor="logoUrl">Logo URL</Label><Input id="logoUrl" name="logoUrl" placeholder="https://..." /></div>
                                        <div><Label htmlFor="coverUrl">Cover Image URL</Label><Input id="coverUrl" name="coverUrl" placeholder="https://..." /></div>
                                    </div>
                                    <div><Label htmlFor="username">Profile Handle (@username)</Label><Input id="username" name="username" placeholder="e.g., @vaikhari_foundation" /></div>
                                </div>
                            </div>
                            
                            {/* Step 2: Registration */}
                            <div className={cn(currentStep !== 2 && "hidden")}>
                                <div className="space-y-4">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><Label htmlFor="registration.number">Registration Number</Label><Input id="registration.number" name="registration.number" /></div>
                                        <div><Label htmlFor="registration.date">Registration Date</Label><Input id="registration.date" name="registration.date" type="date" /></div>
                                    </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><Label htmlFor="registration.pan">PAN</Label><Input id="registration.pan" name="registration.pan" /></div>
                                        <div><Label htmlFor="registration.gstin">GSTIN</Label><Input id="registration.gstin" name="registration.gstin" /></div>
                                    </div>
                                    <div><Label htmlFor="registration.certificateUrl">Registration Certificate Upload (PDF/JPEG)</Label><Input id="registration.certificateUrl" name="registration.certificateUrl" type="file" accept=".pdf,.jpeg,.jpg,.png" /></div>
                                    <div><Label htmlFor="registration.msmeId">MSME / Startup India ID</Label><Input id="registration.msmeId" name="registration.msmeId" /></div>
                                </div>
                            </div>
                            
                            {/* Step 3: Contact */}
                            <div className={cn(currentStep !== 3 && "hidden")}>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><Label htmlFor="contact.officialEmail">Official Email</Label><Input id="contact.officialEmail" name="contact.officialEmail" type="email" /></div>
                                        <div><Label htmlFor="contact.websiteUrl">Website URL</Label><Input id="contact.websiteUrl" name="contact.websiteUrl" type="url" /></div>
                                    </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><Label htmlFor="contact.phone.primary">Primary Phone</Label><Input id="contact.phone.primary" name="contact.phone.primary" type="tel" /></div>
                                        <div><Label htmlFor="contact.phone.alternate">Alternate Phone</Label><Input id="contact.phone.alternate" name="contact.phone.alternate" type="tel" /></div>
                                    </div>
                                    <div><Label htmlFor="contact.address.street">Address</Label><Input id="contact.address.street" name="contact.address.street" placeholder="Street Address" /></div>
                                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                         <Input name="contact.address.city" placeholder="City" />
                                         <Input name="contact.address.state" placeholder="State" />
                                         <Input name="contact.address.pincode" placeholder="Pincode" />
                                     </div>
                                      <div><Label htmlFor="contact.googleMapsLink">Google Maps Link</Label><Input id="contact.googleMapsLink" name="contact.googleMapsLink" type="url" /></div>
                                </div>
                            </div>

                            {/* Step 4: About */}
                            <div className={cn(currentStep !== 4 && "hidden")}>
                                <div className="space-y-4">
                                    <div><Label htmlFor="about.longDescription">Long Description</Label><Textarea id="about.longDescription" name="about.longDescription" rows={5} /></div>
                                    <div><Label htmlFor="about.missionStatement">Mission Statement</Label><Textarea id="about.missionStatement" name="about.missionStatement" rows={3}/></div>
                                    <div><Label htmlFor="about.visionStatement">Vision Statement</Label><Textarea id="about.visionStatement" name="about.visionStatement" rows={3} /></div>
                                    <div><Label htmlFor="about.keyActivities">Key Activities (comma-separated)</Label><Input id="about.keyActivities" name="about.keyActivities" /></div>
                                    <div><Label htmlFor="about.foundingYear">Founding Year</Label><Input id="about.foundingYear" name="about.foundingYear" type="number" /></div>
                                </div>
                            </div>
                            
                            {/* Step 5: Founders */}
                             <div className={cn(currentStep !== 5 && "hidden")}>
                                <DynamicFieldArray name="founders" title="Founders / Key People" fields={[
                                    { name: 'name', label: 'Name', type: 'text', required: true },
                                    { name: 'role', label: 'Role', type: 'text', required: true },
                                    { name: 'profileLink', label: 'Profile Link (Optional)', type: 'url' },
                                ]} />
                             </div>
                             
                             {/* Step 6: Social Links */}
                             <div className={cn(currentStep !== 6 && "hidden")}>
                                 <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Social Media Links</h3>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><Label htmlFor="socialLinks.facebook">Facebook</Label><Input id="socialLinks.facebook" name="socialLinks.facebook" /></div>
                                        <div><Label htmlFor="socialLinks.instagram">Instagram</Label><Input id="socialLinks.instagram" name="socialLinks.instagram" /></div>
                                        <div><Label htmlFor="socialLinks.linkedin">LinkedIn</Label><Input id="socialLinks.linkedin" name="socialLinks.linkedin" /></div>
                                        <div><Label htmlFor="socialLinks.youtube">YouTube</Label><Input id="socialLinks.youtube" name="socialLinks.youtube" /></div>
                                        <div><Label htmlFor="socialLinks.twitter">X (Twitter)</Label><Input id="socialLinks.twitter" name="socialLinks.twitter" /></div>
                                    </div>
                                </div>
                             </div>

                             {/* Step 7: Verification */}
                              <div className={cn(currentStep !== 7 && "hidden")}>
                                 <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Verification & Compliance</h3>
                                     <p className="text-sm text-muted-foreground">This information is confidential and used for verification purposes only.</p>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <div><Label htmlFor="compliance.authorizedSignatory.name">Authorized Signatory Name</Label><Input id="compliance.authorizedSignatory.name" name="compliance.authorizedSignatory.name" /></div>
                                         <div><Label htmlFor="compliance.authorizedSignatory.designation">Designation</Label><Input id="compliance.authorizedSignatory.designation" name="compliance.authorizedSignatory.designation" /></div>
                                     </div>
                                     <div><Label htmlFor="compliance.authorizedSignatory.pan">Authorized Signatory PAN</Label><Input id="compliance.authorizedSignatory.pan" name="compliance.authorizedSignatory.pan" /></div>
                                     <div><Label htmlFor="compliance.authorityLetterUrl">Authority Letter URL</Label><Input id="compliance.authorityLetterUrl" name="compliance.authorityLetterUrl" type="url" /></div>
                                 </div>
                              </div>
                              
                               {/* Step 8: Media */}
                               <div className={cn(currentStep !== 8 && "hidden")}>
                                 <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Media</h3>
                                     <p className="text-sm text-muted-foreground">Enter URLs for media assets. Multiple URLs can be comma-separated for the gallery.</p>
                                     <div><Label htmlFor="media.gallery">Photo Gallery (comma-separated URLs)</Label><Textarea id="media.gallery" name="media.gallery" /></div>
                                     <div><Label htmlFor="media.introVideoUrl">Introductory Video URL</Label><Input id="media.introVideoUrl" name="media.introVideoUrl" type="url" /></div>
                                     <div><Label htmlFor="media.brochureUrl">Brochure/Catalogue URL</Label><Input id="media.brochureUrl" name="media.brochureUrl" type="url" /></div>
                                 </div>
                              </div>

                              {/* Step 9: Operational */}
                               <div className={cn(currentStep !== 9 && "hidden")}>
                                 <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Operational Details</h3>
                                    <div><Label htmlFor="operational.hours">Operating Hours</Label><Input id="operational.hours" name="operational.hours" placeholder="e.g., 10 AM - 6 PM, Mon-Fri" /></div>
                                    <div><Label htmlFor="operational.languages">Languages (comma-separated)</Label><Input id="operational.languages" name="operational.languages" /></div>
                                    <div><Label htmlFor="operational.serviceAreas">Service Areas (comma-separated)</Label><Input id="operational.serviceAreas" name="operational.serviceAreas" placeholder="e.g., Bengaluru, Karnataka, India" /></div>
                                    <div><Label htmlFor="operational.membershipDetails">Membership Details</Label><Textarea id="operational.membershipDetails" name="operational.membershipDetails" /></div>
                                 </div>
                              </div>

                              {/* Step 10: Taxonomy */}
                               <div className={cn(currentStep !== 10 && "hidden")}>
                                 <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Taxonomy</h3>
                                    <div><Label htmlFor="taxonomy.primaryCategory">Primary Category</Label><Input id="taxonomy.primaryCategory" name="taxonomy.primaryCategory" placeholder="e.g., Education" /></div>
                                    <div><Label htmlFor="taxonomy.secondaryCategories">Secondary Categories (comma-separated)</Label><Input id="taxonomy.secondaryCategories" name="taxonomy.secondaryCategories" /></div>
                                    <div><Label htmlFor="taxonomy.tags">Keywords/Tags (comma-separated)</Label><Input id="taxonomy.tags" name="taxonomy.tags" /></div>
                                 </div>
                              </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="pt-4 mt-auto border-t flex-shrink-0">
                        <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                        <div className="flex-1 flex justify-end gap-2">
                            {currentStep > 1 && <Button type="button" variant="outline" onClick={goToPrevStep}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>}
                            {currentStep < orgFormSteps.length ? (
                                <Button type="button" onClick={goToNextStep}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
                            ) : (
                                <SubmitButton>Create Organization</SubmitButton>
                            )}
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

  