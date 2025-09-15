

'use client';

import { getCitationCategory, getCitationData, type CitationCategory } from "@/services/citation.service";
import type { Citation } from '@/types';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, PlusCircle, Edit, Trash2 } from "lucide-react";
import { CreateCitationDialog, EditCitationDialog } from "@/components/admin/citation-forms";
import React, { useEffect, useState, useActionState, useCallback } from "react";
import { deleteCitation } from "@/actions/citation.actions";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";


function DeleteCitationButton({ categoryId, refId, onDeleted }: { categoryId: string, refId: string, onDeleted: () => void }) {
    const { toast } = useToast();
    const [state, formAction] = useActionState(deleteCitation, null);

    useEffect(() => {
        if (state?.success) {
            toast({ title: state.message || 'Citation deleted.' });
            onDeleted();
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast, onDeleted]);
    
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Delete Citation">
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <form action={formAction}>
                    <input type="hidden" name="categoryId" value={categoryId} />
                    <input type="hidden" name="refId" value={refId} />
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This action will permanently delete this citation. This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button type="submit" variant="destructive">Delete</Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}


function CitationRow({ citation, categoryId, onUpdate }: { citation: Citation, categoryId: string, onUpdate: () => void }) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    
    return (
         <>
            <EditCitationDialog 
                open={isEditOpen}
                onOpenChange={(isOpen) => {
                    setIsEditOpen(isOpen);
                    if (!isOpen) onUpdate(); // Refresh data when dialog closes
                }}
                citation={citation}
                categoryId={categoryId}
            />
            <TableRow key={citation.id}>
                <TableCell className="font-medium">{citation.refId}</TableCell>
                <TableCell className="text-muted-foreground italic">"{citation.sanskrit.substring(0, 50)}..."</TableCell>
                <TableCell>
                    <div className="flex flex-wrap gap-1">
                        {citation.keywords.map(kw => <Badge key={kw} variant="secondary">{kw}</Badge>)}
                    </div>
                </TableCell>
                <TableCell>{citation.source} - {citation.location}</TableCell>
                <TableCell className="text-right">
                    <div className="flex items-center justify-end">
                        <Button variant="ghost" size="icon" onClick={() => setIsEditOpen(true)} title="Edit Citation">
                            <Edit className="h-4 w-4" />
                        </Button>
                        <DeleteCitationButton 
                            categoryId={categoryId} 
                            refId={citation.refId}
                            onDeleted={onUpdate}
                        />
                    </div>
                </TableCell>
            </TableRow>
         </>
    );
}

export default function CitationCategoryPage() {
    const params = useParams();
    const categoryId = params.categoryId as string;
    const [category, setCategory] = useState<CitationCategory | null>(null);
    const [allCategories, setAllCategories] = useState<CitationCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(() => {
        setIsLoading(true);
        Promise.all([
            getCitationCategory(categoryId),
            getCitationData()
        ]).then(([catData, allCatData]) => {
            if (!catData) {
                notFound();
            }
            setCategory(catData);
            setAllCategories(allCatData);
            setIsLoading(false);
        });
    }, [categoryId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading || !category) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-10 w-1/2" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-48 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <div>
                 <Button variant="link" className="p-0 h-auto text-muted-foreground -mt-1 mb-2" asChild>
                    <Link href="/admin/citations"><ArrowLeft className="mr-2 h-4 w-4" /> Back to All Collections</Link>
                </Button>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">{category.name}</h1>
                        <p className="text-muted-foreground">{category.citations.length} citations in this collection.</p>
                    </div>
                    <CreateCitationDialog categories={allCategories} selectedCategoryId={category.id} onCitationCreated={fetchData}>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Citation to this Collection
                        </Button>
                    </CreateCitationDialog>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Citations</CardTitle>
                    <CardDescription>
                        All citations within the "{category.name}" collection.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {category.citations.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px]">Ref ID</TableHead>
                                    <TableHead>Sanskrit</TableHead>
                                    <TableHead>Keywords</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {category.citations.map((citation: Citation) => (
                                    <CitationRow key={citation.id} citation={citation} categoryId={categoryId} onUpdate={fetchData} />
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                            <p>No citations in this category yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
