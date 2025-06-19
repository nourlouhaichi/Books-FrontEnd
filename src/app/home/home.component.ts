import { Component, OnInit } from '@angular/core';
import { Book } from 'src/core/models/Book';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  recentBooks: Book[] = [];
  favoriteBooks: Book[] = [];
  readingStats = {
    totalBooks: 0,
    booksInProgress: 0,
    pagesRead: 0,
    favoriteBooks: 0
  };

  ngOnInit() {
    this.loadMockData();
  }

  loadMockData() {
    // Mock data pour la démonstration
    this.recentBooks = [
      {
        idBook: 1,
        title: "Le Petit Prince",
        author: "Antoine de Saint-Exupéry",
        cover: "https://via.placeholder.com/200x300/87CEEB/ffffff?text=Le+Petit+Prince",
        summary: "Un conte poétique et philosophique...",
        status: true,
        liked: true,
        progress: 100,
        pages: 96,
        start: new Date('2024-01-15'),
        end: new Date('2024-01-20')
      },
      {
        idBook: 2,
        title: "1984",
        author: "George Orwell",
        cover: "https://via.placeholder.com/200x300/4682B4/ffffff?text=1984",
        summary: "Un roman dystopique...",
        status: false,
        liked: false,
        progress: 65,
        pages: 328,
        start: new Date('2024-02-01'),
        end: new Date()
      },
      {
        idBook: 3,
        title: "L'Étranger",
        author: "Albert Camus",
        cover: "https://via.placeholder.com/200x300/5F9EA0/ffffff?text=L%27Etranger",
        summary: "Un roman existentialiste...",
        status: true,
        liked: true,
        progress: 100,
        pages: 159,
        start: new Date('2024-01-01'),
        end: new Date('2024-01-10')
      }
    ];

    this.favoriteBooks = this.recentBooks.filter(book => book.liked);
    
    this.readingStats = {
      totalBooks: this.recentBooks.length,
      booksInProgress: this.recentBooks.filter(book => !book.status).length,
      pagesRead: this.recentBooks.reduce((total, book) => total + Math.round(book.pages * (book.progress / 100)), 0),
      favoriteBooks: this.favoriteBooks.length
    };
  }

  getProgressColor(progress: number): string {
    if (progress >= 80) return '#4CAF50';
    if (progress >= 50) return '#FF9800';
    return '#87CEEB';
  }
}
