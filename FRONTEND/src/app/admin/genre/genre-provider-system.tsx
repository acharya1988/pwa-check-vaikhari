
'use client';

import React, { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { GENRES, CATEGORIES, SUB_CATEGORIES } from '@/types/genre.types';
import type { Genre, Category, SubCategory } from '@/types/genre.types';
import { CreatableCombobox } from '@/components/ui/creatable-combobox';

interface GenreSelectorProps {
  onSelectionChange?: (selection: { genreId?: string; categoryId?: string; subCategoryId?: string, newSubCategory?: string }) => void;
  initialGenreId?: string;
  initialCategoryId?: string;
  initialSubCategoryId?: string;
}

export function GenreSelector({ 
  onSelectionChange,
  initialGenreId,
  initialCategoryId,
  initialSubCategoryId,
}: GenreSelectorProps) {
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>(initialGenreId);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(initialCategoryId);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | undefined>(initialSubCategoryId);
  const [newSubCategory, setNewSubCategory] = useState<string | undefined>();

  const availableCategories = useMemo(() => {
    if (!selectedGenre) return [];
    return CATEGORIES.filter(c => c.genreId === selectedGenre);
  }, [selectedGenre]);

  const availableSubCategories = useMemo(() => {
    if (!selectedCategory) return [];
    return SUB_CATEGORIES.filter(sc => sc.categoryId === selectedCategory);
  }, [selectedCategory]);

  const handleGenreChange = (genreId: string) => {
    setSelectedGenre(genreId);
    setSelectedCategory(undefined);
    setSelectedSubCategory(undefined);
    setNewSubCategory(undefined);
    onSelectionChange?.({ genreId });
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubCategory(undefined);
    setNewSubCategory(undefined);
    onSelectionChange?.({ genreId: selectedGenre, categoryId });
  };
  
  const handleSubCategoryChange = (subCategoryId: string) => {
    // Check if the value is one of the existing sub-categories
    const isExisting = availableSubCategories.some(sc => sc.id === subCategoryId);
    if(isExisting) {
        setSelectedSubCategory(subCategoryId);
        setNewSubCategory(undefined);
        onSelectionChange?.({ genreId: selectedGenre, categoryId: selectedCategory, subCategoryId });
    } else {
        // It's a new sub-category
        setSelectedSubCategory(undefined);
        setNewSubCategory(subCategoryId);
        onSelectionChange?.({ genreId: selectedGenre, categoryId: selectedCategory, newSubCategory: subCategoryId });
    }
  };

  return (
    <div className="space-y-4">
        {/* Hidden inputs to be included in parent form submissions */}
        <input type="hidden" name="genreId" value={selectedGenre || ''} />
        <input type="hidden" name="categoryId" value={selectedCategory || ''} />
        <input type="hidden" name="subCategoryId" value={selectedSubCategory || ''} />
        <input type="hidden" name="newSubCategory" value={newSubCategory || ''} />

      <div className="space-y-2">
        <Label htmlFor="genre-selector">Genre *</Label>
        <Select onValueChange={handleGenreChange} value={selectedGenre} required>
          <SelectTrigger id="genre-selector">
            <SelectValue placeholder="Select a genre..." />
          </SelectTrigger>
          <SelectContent>
            {GENRES.map((genre) => (
              <SelectItem key={genre.id} value={genre.id}>
                {genre.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedGenre && availableCategories.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="category-selector">Category *</Label>
          <Select onValueChange={handleCategoryChange} value={selectedCategory} required>
            <SelectTrigger id="category-selector">
              <SelectValue placeholder="Select a category..." />
            </SelectTrigger>
            <SelectContent>
              {availableCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedCategory && (
        <div className="space-y-2">
          <Label htmlFor="subcategory-selector">Sub-category</Label>
           <CreatableCombobox
            value={selectedSubCategory || newSubCategory || ''}
            onValueChange={handleSubCategoryChange}
            options={availableSubCategories.map(sc => ({ value: sc.id, label: sc.name }))}
            placeholder="Select or create a sub-category..."
            searchPlaceholder="Search sub-categories..."
            emptyPlaceholder="No sub-categories found."
            createPlaceholder={(value) => `Create new sub-category: "${value}"`}
          />
        </div>
      )}
    </div>
  );
}
