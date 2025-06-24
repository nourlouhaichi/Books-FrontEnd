import { Component, OnInit } from '@angular/core';
import { BookService } from 'src/app/service/book.service';
import { Book } from 'src/core/models/Book';
import { Router } from '@angular/router';

interface MonthlyStats {
  month: string;
  booksCompleted: number;
  pagesRead: number;
}

interface CategoryStats {
  name: string;
  count: number;
  percentage: number;
}

interface ReadingGoal {
  target: number;
  current: number;
  percentage: number;
}

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css']
})
export class StatisticsComponent implements OnInit {
  allBooks: Book[] = [];
  
  generalStats = {
    totalBooks: 0,
    completedBooks: 0,
    booksInProgress: 0,
    favoriteBooks: 0,
    totalPages: 0,
    pagesRead: 0,
    averageProgress: 0,
    averageRating: 0
  };

  readingGoals: ReadingGoal = {
    target: 24, 
    current: 0,
    percentage: 0
  };

  monthlyStats: MonthlyStats[] = [];
  categoryStats: CategoryStats[] = [];
  
  recentActivity: Book[] = [];
  longestBooks: Book[] = [];
  quickestReads: Book[] = [];

  constructor(
    private bookService: BookService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBooksAndCalculateStats();
  }

  loadBooksAndCalculateStats(): void {
    this.bookService.getAllBooks().subscribe({
      next: (data) => {
        this.allBooks = data.filter(book => book.status === true);
        this.calculateGeneralStats();
        this.calculateMonthlyStats();
        this.calculateCategoryStats();
        this.calculateReadingGoals();
        this.getRecentActivity();
        this.getLongestBooks();
        this.getQuickestReads();
      }
    });
  }

  calculateGeneralStats(): void {
    const completedBooks = this.allBooks.filter(book => book.progress === 100);
    const inProgressBooks = this.allBooks.filter(book => book.progress > 0 && book.progress < 100);
    
    this.generalStats = {
      totalBooks: this.allBooks.length,
      completedBooks: completedBooks.length,
      booksInProgress: inProgressBooks.length,
      favoriteBooks: this.allBooks.filter(book => book.liked).length,
      totalPages: this.allBooks.reduce((total, book) => total + book.pages, 0),
      pagesRead: this.allBooks.reduce((total, book) => {
        return total + Math.round(book.pages * (book.progress / 100));
      }, 0),
      averageProgress: this.allBooks.length > 0 ? 
        Math.round(this.allBooks.reduce((total, book) => total + book.progress, 0) / this.allBooks.length) : 0,
      averageRating: 0 
    };
  }

  calculateMonthlyStats(): void {
    const completedBooks = this.allBooks.filter(book => book.end && book.progress === 100);
    const monthlyData: { [key: string]: { books: number; pages: number } } = {};

    completedBooks.forEach(book => {
      const date = new Date(book.end);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { books: 0, pages: 0 };
      }
      
      monthlyData[monthKey].books++;
      monthlyData[monthKey].pages += book.pages;
    });

    this.monthlyStats = Object.entries(monthlyData)
      .map(([key, data]) => ({
        month: new Date(key + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        booksCompleted: data.books,
        pagesRead: data.pages
      }))
      .sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime())
      .slice(0, 6);
  }

  calculateCategoryStats(): void {
    const categoryCount: { [key: string]: number } = {};
    
    this.allBooks.forEach(book => {
      if (book.categories && book.categories.length > 0) {
        book.categories.forEach(category => {
          categoryCount[category.name] = (categoryCount[category.name] || 0) + 1;
        });
      } else {
        categoryCount['Non catégorisé'] = (categoryCount['Non catégorisé'] || 0) + 1;
      }
    });

    const totalBooks = this.allBooks.length;
    this.categoryStats = Object.entries(categoryCount)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalBooks) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  calculateReadingGoals(): void {
    const currentYear = new Date().getFullYear();
    const completedThisYear = this.allBooks.filter(book => {
      return book.end && book.progress === 100 && new Date(book.end).getFullYear() === currentYear;
    }).length;

    this.readingGoals = {
      target: this.readingGoals.target,
      current: completedThisYear,
      percentage: Math.round((completedThisYear / this.readingGoals.target) * 100)
    };
  }

  getRecentActivity(): void {
    const booksWithActivity = this.allBooks.filter(book => book.start || book.end);
    this.recentActivity = booksWithActivity
      .sort((a, b) => {
        const dateA = new Date(a.end || a.start);
        const dateB = new Date(b.end || b.start);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);
  }

  getLongestBooks(): void {
    this.longestBooks = [...this.allBooks]
      .sort((a, b) => b.pages - a.pages)
      .slice(0, 5);
  }

  getQuickestReads(): void {
    const completedBooks = this.allBooks.filter(book => book.start && book.end && book.progress === 100);
    this.quickestReads = completedBooks
      .map(book => ({
        ...book,
        readingDays: this.calculateReadingDays(book.start, book.end)
      }))
      .sort((a, b) => a.readingDays - b.readingDays)
      .slice(0, 5);
  }

  calculateReadingDays(start: Date, end: Date): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getProgressColor(progress: number): string {
    if (progress >= 80) return '#4CAF50';
    if (progress >= 50) return '#FF9800';
    return '#87CEEB';
  }

  updateReadingGoal(newTarget: number): void {
    this.readingGoals.target = newTarget;
    this.calculateReadingGoals();
  }

  navigateToLibrary(): void {
    this.router.navigate(['/library']);
  }

  navigateToBooks(): void {
    this.router.navigate(['/books']);
  }

  navigateToHome(): void {
    this.router.navigate(['/home']);
  }

  navigateToCompletedInLibrary(): void {
    this.router.navigate(['/library'], { 
      queryParams: { filter: 'completed' } 
    });
  }

  navigateToFavoritesInLibrary(): void {
    this.router.navigate(['/library'], { 
      queryParams: { filter: 'favorites' } 
    });
  }

  navigateToInProgressInLibrary(): void {
    this.router.navigate(['/library'], { 
      queryParams: { filter: 'inprogress' } 
    });
  }
}