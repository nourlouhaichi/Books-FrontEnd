import { Component, OnInit } from '@angular/core';
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
export class AddBookComponent implements OnInit {
  bookForm!: FormGroup;
  coverFile!: File;
  categories: any[] = [];
  selectedCategories: number[] = [];
  
  currentStep: number = 1;
  totalSteps: number = 2;

  constructor(
    private fb: FormBuilder, 
    private bookService: BookService, 
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.bookForm = this.fb.group({
      title: ['', Validators.required],
      author: ['', Validators.required],
      series: [''],
      pages: [0, [Validators.required, Validators.min(1)]],
      publicationInfo: ['', Validators.required],
      
      summary: ['', Validators.required],
      cover: ['']
    });

    this.categoryService.getAllCategories().subscribe(data => {
      this.categories = data;
    });
  }

  isStep1Valid(): boolean {
    const step1Fields = ['title', 'author', 'pages', 'publicationInfo'];
    return step1Fields.every(field => {
      const control = this.bookForm.get(field);
      return control && control.valid;
    });
  }

  isStep2Valid(): boolean {
    const summaryControl = this.bookForm.get('summary');
    return summaryControl ? summaryControl.valid : false;
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps && this.isStep1Valid()) {
      this.currentStep++;
    } else if (!this.isStep1Valid()) {
      const step1Fields = ['title', 'author', 'pages', 'publicationInfo'];
      step1Fields.forEach(field => {
        this.bookForm.get(field)?.markAsTouched();
      });
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  onFileChange(event: any) {
    if (event.target.files.length > 0) {
      this.coverFile = event.target.files[0];
    }
  }

  onCategoryChange(event: any) {
    const catId = +event.target.value;
    if (event.target.checked) {
      this.selectedCategories.push(catId);
    } else {
      this.selectedCategories = this.selectedCategories.filter(id => id !== catId);
    }
  }

  onSubmit() {
    if (this.bookForm.valid) {
      const book: Book = {
        ...this.bookForm.value,
        cover: this.coverFile ? this.coverFile.name : '',
        status: true
      };

      const categoriesAsString = this.selectedCategories.map(catId => catId.toString());

      this.bookService.addBook(book, categoriesAsString).subscribe({
        next: (response) => {
          this.bookForm.reset();
          this.selectedCategories = [];
          this.coverFile = null as any;
          this.currentStep = 1; 
          this.router.navigate(['/library']);
        },
        error: (err) => {
          console.error(err);
        }
      });
    } else {
      this.bookForm.markAllAsTouched();
    }
  }
}