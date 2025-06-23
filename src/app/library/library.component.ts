import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router'; 
import { BookService } from 'src/app/service/book.service';
import { Book } from 'src/core/models/Book';

@Component({
  selector: 'app-library',
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.css']
})
export class LibraryComponent implements OnInit {
  books: Book[] = [];
  filteredBooks: Book[] = [];
  currentPage: number = 1;
  booksPerPage: number = 8;
  searchTerm: string = '';
  selectedCategory: string = '';
  selectedStatus: string = '';
  categories: string[] = [];
  statusOptions = [
    { value: '', label: 'All books' },
    { value: 'completed', label: 'Completed' },
    { value: 'inprogress', label: 'In Progress' },
    { value: 'favorites', label: 'Favorites' }
  ];
  
  readingStats = {
    totalBooks: 0,
    booksInProgress: 0,
    pagesRead: 0,
    favoriteBooks: 0
  };

  constructor(
    private bookService: BookService,
    private route: ActivatedRoute 
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['filter']) {
        this.selectedStatus = params['filter'];
      }
    });

    this.bookService.getAllBooks().subscribe(data => {
      this.books = data.filter(book => book.status === true);
      this.books.sort((a, b) => {
        return a.progress - b.progress;
      });
      this.filteredBooks = this.books;
      const categorySet = new Set<string>();
      this.books.forEach(book => {
        book.categories?.forEach(cat => {
          categorySet.add(cat.name);
        });
      });
      this.categories = Array.from(categorySet).sort();
      this.calculateReadingStats();
      this.applyFilters();
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onCategoryChange(): void {
    this.applyFilters();
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    const term = this.searchTerm.toLowerCase().trim();
    const cat = this.selectedCategory;
    const status = this.selectedStatus;

    this.filteredBooks = this.books.filter(book => {
      const matchesText = term === '' ||
        book.title.toLowerCase().includes(term) ||
        book.author.toLowerCase().includes(term);

      const matchesCategory = cat === '' ||
        book.categories?.some(c => c.name === cat);

      const matchesStatus = status === '' ||
        (status === 'completed' && book.progress === 100) ||
        (status === 'inprogress' && book.progress < 100) ||
        (status === 'favorites' && book.liked);

      return matchesText && matchesCategory && matchesStatus;
    });

    this.filteredBooks.sort((a, b) => {
      if ((a.progress === 100 && b.progress === 100) || (a.progress < 100 && b.progress < 100)) {
        if (a.progress < 100 && b.progress < 100) {
          return a.progress - b.progress;
        }
        return a.title.localeCompare(b.title);
      }
      if (a.progress < 100 && b.progress === 100) return -1;
      if (a.progress === 100 && b.progress < 100) return 1;
      
      return 0;
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

  get pageNumbers(): number[] {
    return Array.from({length: this.totalPages}, (_, i) => i + 1);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  calculateReadingStats(): void {
    this.readingStats = {
      totalBooks: this.books.length,
      booksInProgress: this.books.filter(book => book.progress < 100).length,
      pagesRead: this.books.reduce((total, book) => total + Math.round(book.pages * (book.progress / 100)), 0),
      favoriteBooks: this.books.filter(book => book.liked).length
    };
  }

  getProgressColor(progress: number): string {
    if (progress >= 80) return '#4CAF50';
    if (progress >= 50) return '#FF9800';
    return '#87CEEB';
  }

  toggleFavorite(book: Book): void {
    this.bookService.addToFavorites(book.idBook).subscribe({
      next: (updatedBook) => {
        const bookIndex = this.books.findIndex(b => b.idBook === book.idBook);
        if (bookIndex !== -1) {
          this.books[bookIndex] = updatedBook;
        }
        const filteredIndex = this.filteredBooks.findIndex(b => b.idBook === book.idBook);
        if (filteredIndex !== -1) {
          this.filteredBooks[filteredIndex] = updatedBook;
        }
        this.calculateReadingStats();
        this.applyFilters();
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour des favoris:', error);
      }
    });
  }
  clearFilters(): void {
  this.searchTerm = '';
  this.selectedCategory = '';
  this.selectedStatus = '';
  this.applyFilters();
}
}