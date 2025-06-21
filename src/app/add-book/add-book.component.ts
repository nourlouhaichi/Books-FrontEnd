import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BookService } from 'src/app/service/book.service';
import { Book } from 'src/core/models/Book';
import { CategoryService } from '../service/category.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-book',
  templateUrl: './add-book.component.html',
  styleUrls: ['./add-book.component.css']
})
export class AddBookComponent implements OnInit, OnDestroy {
  bookForm!: FormGroup;
  coverFile: File | null = null;
  categories: any[] = [];
  selectedCategories: number[] = [];
  
  currentStep: number = 1;
  totalSteps: number = 2;
  isUploading: boolean = false;

  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly VALID_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

  constructor(
    private fb: FormBuilder, 
    private bookService: BookService, 
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadCategories();
  }

  ngOnDestroy(): void {
    if (this.coverFile) {
      URL.revokeObjectURL(this.getImagePreview());
    }
  }

  private initializeForm(): void {
    const currentYear = new Date().getFullYear();
    
    this.bookForm = this.fb.group({
      title: ['', [
        Validators.required, 
        Validators.minLength(2),
        Validators.maxLength(200)
      ]],
      author: ['', [
        Validators.required, 
        Validators.minLength(2),
        Validators.maxLength(100)
      ]],
      series: ['', [Validators.maxLength(100)]],
      pages: [null, [
        Validators.required, 
        Validators.min(1), 
        Validators.max(10000)
      ]],
      publicationInfo: ['', [
        Validators.required,
        this.dateValidator.bind(this)
      ]],
      summary: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(2000)
      ]]
    });
  }

  private dateValidator(control: any) {
    if (!control.value) return null;
    
    const selectedDate = new Date(control.value);
    const currentDate = new Date();
    const minDate = new Date('1450-01-01');
    
    if (selectedDate > currentDate) {
      return { futureDate: true };
    }
    if (selectedDate < minDate) {
      return { tooOldDate: true };
    }
    return null;
  }

  private loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des catégories:', error);
      }
    });
  }

  isStep1Valid(): boolean {
    const step1Fields = ['title', 'author', 'pages', 'publicationInfo'];
    return step1Fields.every(field => {
      const control = this.bookForm.get(field);
      return control && control.valid;
    });
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      if (this.currentStep === 1 && this.isStep1Valid()) {
        this.currentStep++;
      } else {
        this.markStep1AsTouched();
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  private markStep1AsTouched(): void {
    const step1Fields = ['title', 'author', 'pages', 'publicationInfo'];
    step1Fields.forEach(field => {
      this.bookForm.get(field)?.markAsTouched();
    });
  }

  onFileChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) {
      this.coverFile = null;
      return;
    }

    if (!this.isValidImageFile(file)) {
      this.resetFileInput(target);
      return;
    }

    this.coverFile = file;
  }

  private isValidImageFile(file: File): boolean {
    if (!this.VALID_IMAGE_TYPES.includes(file.type)) {
      alert('Format de fichier non supporté. Utilisez JPEG, PNG ou GIF.');
      return false;
    }

    if (file.size > this.MAX_FILE_SIZE) {
      alert('Le fichier est trop volumineux. Taille maximale: 5MB.');
      return false;
    }

    return true;
  }

  private resetFileInput(input: HTMLInputElement): void {
    this.coverFile = null;
    input.value = '';
  }

  onCategoryChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  const catId = +target.value;
  
  if (target.checked) {
    if (!this.selectedCategories.includes(catId)) {
      this.selectedCategories.push(catId);
    }
  } else {
    this.selectedCategories = this.selectedCategories.filter(id => id !== catId);
  }
}

// Nouvelle méthode pour obtenir les noms des catégories sélectionnées
private getSelectedCategoryNames(): string[] {
  return this.selectedCategories.map(catId => {
    const category = this.categories.find(cat => cat.idCategory === catId);
    return category ? category.name : '';
  }).filter(name => name !== '');
}

onSubmit(): void {
  if (!this.bookForm.valid) {
    this.bookForm.markAllAsTouched();
    return;
  }

  this.isUploading = true;

  const book: Book = {
    ...this.bookForm.value,
    cover: '',
    status: true
  };

  // Utiliser les noms des catégories au lieu des IDs
  const categoryNames = this.getSelectedCategoryNames();

  if (this.coverFile) {
    this.submitWithImage(book, categoryNames);
  } else {
    this.submitWithoutImage(book, categoryNames);
  }
}

  private submitWithImage(book: Book, categories: string[]): void {
    this.bookService.addBookWithImage(book, categories, this.coverFile!).subscribe({
      next: (response) => {
        this.handleSuccessfulSubmission(response);
      },
      error: (error) => {
        console.error('Erreur avec image:', error);
        this.submitWithoutImage(book, categories);
      }
    });
  }

  private submitWithoutImage(book: Book, categories: string[]): void {
    this.bookService.addBook(book, categories).subscribe({
      next: (response) => {
        this.handleSuccessfulSubmission(response);
      },
      error: (error) => {
        console.error('Erreur lors de l\'ajout:', error);
        this.isUploading = false;
        alert('Une erreur est survenue lors de l\'ajout du livre.');
      }
    });
  }

  private handleSuccessfulSubmission(response: any): void {
    console.log('Livre ajouté avec succès:', response);
    this.resetForm();
    this.router.navigate(['/library']);
  }

  private resetForm(): void {
    this.bookForm.reset();
    this.selectedCategories = [];
    this.coverFile = null;
    this.currentStep = 1;
    this.isUploading = false;
  }

  getImagePreview(): string {
    return this.coverFile ? URL.createObjectURL(this.coverFile) : '';
  }

  removeImage(fileInput: HTMLInputElement): void {
    if (this.coverFile) {
      URL.revokeObjectURL(this.getImagePreview());
    }
    this.resetFileInput(fileInput);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFieldError(fieldName: string): string {
    const field = this.bookForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    const errors = field.errors;
    
    switch (fieldName) {
      case 'title':
        if (errors['required']) return 'Le titre est obligatoire';
        if (errors['minlength']) return 'Le titre doit contenir au moins 2 caractères';
        if (errors['maxlength']) return 'Le titre ne peut pas dépasser 200 caractères';
        break;
        
      case 'author':
        if (errors['required']) return 'L\'auteur est obligatoire';
        if (errors['minlength']) return 'Le nom de l\'auteur doit contenir au moins 2 caractères';
        if (errors['maxlength']) return 'Le nom de l\'auteur ne peut pas dépasser 100 caractères';
        break;
        
      case 'series':
        if (errors['maxlength']) return 'Le nom de la série ne peut pas dépasser 100 caractères';
        break;
        
      case 'pages':
        if (errors['required']) return 'Le nombre de pages est obligatoire';
        if (errors['min']) return 'Le nombre de pages doit être supérieur à 0';
        if (errors['max']) return 'Le nombre de pages ne peut pas dépasser 10 000';
        break;
        
      case 'publicationInfo':
        if (errors['required']) return 'La date de publication est obligatoire';
        if (errors['futureDate']) return 'La date de publication ne peut pas être dans le futur';
        if (errors['tooOldDate']) return 'La date de publication ne peut pas être antérieure à 1450';
        break;
        
      case 'summary':
        if (errors['required']) return 'Le résumé est obligatoire';
        if (errors['minlength']) return 'Le résumé doit contenir au moins 10 caractères';
        if (errors['maxlength']) return 'Le résumé ne peut pas dépasser 2000 caractères';
        break;
    }
    
    return '';
  }
}