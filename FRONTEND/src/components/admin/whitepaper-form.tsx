

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Stepper, StepperItem, StepperLabel, StepperSeparator } from '@/components/ui/stepper';
import { Loader2, Save, ArrowLeft, ArrowRight, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import type { StandaloneArticleCategory } from '@/types';
import { createStandaloneArticleCategory } from '@/actions/standalone-article.actions';
import { GenreSelector } from '@/app/admin/genre/genre-provider-system';

const whitepaperSteps = [
  { step: 1, label: 'Title Page', fields: [
      { name: 'title', label: 'Title (specific, compelling)', type: 'text', required: true },
      { name: 'subtitle', label: 'Subtitle (optional)', type: 'text' },
      { name: 'author', label: 'Author(s) or organization', type: 'text', required: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
  ]},
  { step: 2, label: 'Abstract', fields: [
      { name: 'abstract', label: 'Abstract / Executive Summary (150–300 words)', type: 'textarea', required: true },
  ]},
  { step: 3, label: 'Introduction', fields: [
      { name: 'introduction', label: 'Introduction', type: 'textarea', required: true, placeholder: 'Context, relevance, target audience...' },
  ]},
  { step: 4, label: 'Problem', fields: [
      { name: 'problem', label: 'Problem Statement', type: 'textarea', required: true, placeholder: 'Define the core problem, use data, explain why it matters...' },
  ]},
  { step: 5, label: 'Objective', fields: [
      { name: 'objective', label: 'Objective / Scope', type: 'textarea', required: true, placeholder: 'Purpose of the paper, what it aims to address...' },
  ]},
  { step: 6, label: 'Methodology', fields: [
      { name: 'methodology', label: 'Methodology or Approach (if research-based)', type: 'textarea' },
  ]},
  { step: 7, label: 'Solution', fields: [
      { name: 'solution', label: 'Proposed Solution or Insight', type: 'textarea', required: true, placeholder: 'The main contribution, detailed explanation, diagrams...' },
  ]},
  { step: 8, label: 'Impact', fields: [
      { name: 'benefits', label: 'Benefits & Impact', type: 'textarea', required: true, placeholder: 'How the solution addresses the problem, applications, benefits...' },
  ]},
  { step: 9, label: 'Comparison', fields: [
      { name: 'comparison', label: 'Comparison / Competitive Analysis (optional)', type: 'textarea' },
  ]},
  { step: 10, label: 'Conclusion', fields: [
      { name: 'conclusion', label: 'Conclusion', type: 'textarea', required: true, placeholder: 'Recap, final insights, call to action...' },
  ]},
  { step: 11, label: 'References', fields: [
      { name: 'references', label: 'References / Citations', type: 'textarea' },
  ]},
  { step: 12, label: 'Appendix', fields: [
      { name: 'appendix', label: 'Appendix / Glossary (if needed)', type: 'textarea' },
  ]},
];

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Create White Paper
        </Button>
    )
}

function CreateCategoryDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createStandaloneArticleCategory, null);

  useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="icon" className="flex-shrink-0" title="Add new category">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create New Category</DialogTitle></DialogHeader>
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="category-name">Category Name</Label>
            <Input id="category-name" name="name" required />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


export function WhitepaperForm({ categories, formAction, state }: { categories: StandaloneArticleCategory[], formAction: any, state: any }) {
    const [currentStep, setCurrentStep] = useState(1);
    const formRef = useRef<HTMLFormElement>(null);

    const goToNextStep = () => {
        if (currentStep < whitepaperSteps.length) {
            setCurrentStep(currentStep + 1);
        }
    };
    const goToPrevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const currentStepData = whitepaperSteps[currentStep - 1];

    return (
        <div className="container mx-auto max-w-5xl py-12">
            <div className="mb-8">
                <Button variant="link" className="p-0 h-auto text-muted-foreground" asChild>
                    <Link href="/admin/articles"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Articles</Link>
                </Button>
            </div>
            <h1 className="text-3xl font-bold mb-2 text-center">Create a New White Paper</h1>
            <p className="text-muted-foreground mb-8 text-center">Follow this guided journey to structure your white paper effectively.</p>

            <div className="mb-12 overflow-x-auto scrollable">
                 <div className="min-w-[800px] p-4">
                    <Stepper>
                        {whitepaperSteps.map(({ step, label }) => (
                            <React.Fragment key={step}>
                                <div onClick={() => setCurrentStep(step)} className="cursor-pointer">
                                    <StepperItem isCompleted={currentStep > step} isActive={currentStep === step}>
                                        {step}
                                    </StepperItem>
                                    <StepperLabel isActive={currentStep === step}>{label}</StepperLabel>
                                </div>
                                {step < whitepaperSteps.length && <StepperSeparator />}
                            </React.Fragment>
                        ))}
                    </Stepper>
                </div>
            </div>

            <form ref={formRef} action={formAction}>
                 <input type="hidden" name="type" value="whitepaper" />
                 <div className="max-w-3xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Step {currentStep}: {currentStepData.label}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {currentStep === 1 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="categoryId">Legacy Category</Label>
                                        <div className="flex items-center gap-2">
                                            <Select name="categoryId" required defaultValue="uncategorized">
                                                <SelectTrigger id="categoryId">
                                                    <SelectValue placeholder="Select a category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map(category => (
                                                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <CreateCategoryDialog />
                                        </div>
                                        {state?.fieldErrors?.categoryId && <p className="text-sm text-destructive mt-1">{state.fieldErrors.categoryId[0]}</p>}
                                    </div>
                                     <div className="space-y-2 md:col-span-2">
                                        <Label>Categorization</Label>
                                        <div className="p-4 border rounded-md bg-muted/50">
                                            <GenreSelector />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStepData.fields.map(field => (
                                <div key={field.name}>
                                    <Label htmlFor={field.name}>{field.label}</Label>
                                    {field.type === 'textarea' ? (
                                        <Textarea id={field.name} name={field.name} required={field.required} rows={8} placeholder={field.placeholder}/>
                                    ) : (
                                        <Input id={field.name} name={field.name} type={field.type} required={field.required} />
                                    )}
                                    {state?.fieldErrors?.[field.name] && <p className="text-sm text-destructive mt-1">{state.fieldErrors[field.name][0]}</p>}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <div className="flex justify-between mt-8">
                        <Button type="button" variant="outline" onClick={goToPrevStep} disabled={currentStep === 1}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                        </Button>
                        {currentStep < whitepaperSteps.length ? (
                            <Button type="button" onClick={goToNextStep}>
                            Next <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <SubmitButton />
                        )}
                    </div>
                </div>
            </form>
        </div>
    )
}
