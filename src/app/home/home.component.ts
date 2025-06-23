import { Component, OnInit } from '@angular/core';
import { BookService } from 'src/app/service/book.service';
import { Book } from 'src/core/models/Book';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  recentBooks: Book[] = [];
  favoriteBooks: Book[] = [];
  currentlyReadingBooks: Book[] = []; 
  allBooks: Book[] = [];
  
  readingStats = {
    totalBooks: 0,
    booksInProgress: 0,
    pagesRead: 0,
    favoriteBooks: 0
  };

  constructor(
    private bookService: BookService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBooks();
  }

  loadBooks(): void {
    this.bookService.getAllBooks().subscribe({
      next: (data) => {
        this.allBooks = data.filter(book => book.status === true);
        this.processBooks();
        this.calculateReadingStats();
      }
    });
  }

  processBooks(): void {
  const completedBooks = this.allBooks.filter(book => book.end && book.progress === 100);
  const sortedCompletedBooks = [...completedBooks].sort((a, b) => {
    return new Date(b.end).getTime() - new Date(a.end).getTime();
  });
  this.recentBooks = sortedCompletedBooks.slice(0, 4);

  const inProgressBooks = this.allBooks.filter(book => book.progress < 100);
  this.currentlyReadingBooks = [...inProgressBooks]
    .sort((a, b) => b.progress - a.progress) 
    .slice(0, 4); 

  this.favoriteBooks = this.allBooks
    .filter(book => book.liked)
    .sort((a, b) => {
      if (a.end && b.end) {
        return new Date(b.end).getTime() - new Date(a.end).getTime();
      }
      if (a.end && !b.end) {
        return -1;
      }
      if (!a.end && b.end) {
        return 1;
      }
      return a.title.localeCompare(b.title);
    })
    .slice(0, 6);
}

  calculateReadingStats(): void {
    this.readingStats = {
      totalBooks: this.allBooks.length,
      booksInProgress: this.allBooks.filter(book => book.progress < 100).length,
      pagesRead: this.allBooks.reduce((total, book) => {
        return total + Math.round(book.pages * (book.progress / 100));
      }, 0),
      favoriteBooks: this.allBooks.filter(book => book.liked).length
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
        this.updateBookInArrays(updatedBook);
        this.calculateReadingStats();
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour des favoris:', error);
      }
    });
  }

  private updateBookInArrays(updatedBook: Book): void {
    const allBooksIndex = this.allBooks.findIndex(b => b.idBook === updatedBook.idBook);
    if (allBooksIndex !== -1) {
      this.allBooks[allBooksIndex] = updatedBook;
    }

    const recentBooksIndex = this.recentBooks.findIndex(b => b.idBook === updatedBook.idBook);
    if (recentBooksIndex !== -1) {
      this.recentBooks[recentBooksIndex] = updatedBook;
    }

    const currentlyReadingIndex = this.currentlyReadingBooks.findIndex(b => b.idBook === updatedBook.idBook);
    if (currentlyReadingIndex !== -1) {
      this.currentlyReadingBooks[currentlyReadingIndex] = updatedBook;
    }

    const favoriteBooksIndex = this.favoriteBooks.findIndex(b => b.idBook === updatedBook.idBook);
    if (favoriteBooksIndex !== -1) {
      if (updatedBook.liked) {
        this.favoriteBooks[favoriteBooksIndex] = updatedBook;
      } else {
        this.favoriteBooks.splice(favoriteBooksIndex, 1);
      }
    } else if (updatedBook.liked) {
      this.favoriteBooks.unshift(updatedBook);
      this.favoriteBooks = this.favoriteBooks.slice(0, 6); 
    }
  }

  navigateToAddBook(): void {
    this.router.navigate(['/addbook']);
  }

  navigateToBooks(): void {
    this.router.navigate(['/books']);
  }

  navigateToLibrary(): void {
    this.router.navigate(['/library']);
  }
  
  navigateToStats(): void {
    this.router.navigate(['/statistics']);
  }

  navigateToFavoritesInLibrary(): void {
    this.router.navigate(['/library'], { 
      queryParams: { filter: 'favorites' } 
    });
  }

  navigateToCompletedInLibrary(): void {
    this.router.navigate(['/library'], { 
      queryParams: { filter: 'completed' } 
    });
  }

  navigateToInProgressInLibrary(): void {
    this.router.navigate(['/library'], { 
      queryParams: { filter: 'inprogress' } 
    });
  }
}