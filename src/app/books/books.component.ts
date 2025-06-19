import { Component, OnInit } from '@angular/core';
import { BookService } from 'src/app/service/book.service';
import { Book } from 'src/core/models/Book';

@Component({
  selector: 'app-books',
  templateUrl: './books.component.html',
  styleUrls: ['./books.component.css']
})

export class BooksComponent implements OnInit {
  books: Book[] = [];
  filteredBooks: Book[] = [];
  currentPage: number = 1;
  booksPerPage: number = 15;
  searchTerm: string = '';
  selectedCategory: string = '';
  categories: string[] = []; 

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.bookService.getAllBooks().subscribe(data => {
      this.books = data;
      this.filteredBooks = data;

      const categorySet = new Set<string>();
      data.forEach(book => {
        book.categories?.forEach(cat => {
          categorySet.add(cat.name);
        });
      });
      this.categories = Array.from(categorySet).sort();
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onCategoryChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    const term = this.searchTerm.toLowerCase().trim();
    const cat = this.selectedCategory;

    this.filteredBooks = this.books.filter(book => {

      const matchesText = term === '' || 
        book.title.toLowerCase().includes(term) || 
        book.author.toLowerCase().includes(term);


      const matchesCategory = cat === '' || 
        book.categories?.some(c => c.name === cat);

      return matchesText && matchesCategory;
    });

    this.currentPage = 1; 
  }

  get paginatedBooks(): Book[] {
    const start = (this.currentPage - 1) * this.booksPerPage;
    return this.filteredBooks.slice(start, start + this.booksPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredBooks.length / this.booksPerPage);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
}
