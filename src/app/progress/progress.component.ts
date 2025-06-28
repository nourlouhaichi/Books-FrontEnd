import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TimelineService } from '../service/timeline.service';
import { ReviewService } from '../service/review.service';
import { BookService } from '../service/book.service';
import { Timeline } from 'src/core/models/Timeline';
import { Review } from 'src/core/models/Review';
import { Book } from 'src/core/models/Book';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-progress',
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.css']
})
export class ProgressComponent implements OnInit {
  book: Book | null = null;
  timelines: Timeline[] = [];
  annotations: Review[] = [];
  loading = false;
  error: string | null = null;

  showAddAnnotationForm = false;
  showAddTimelineForm = false;
  newTimelinePage: number = 1;

  formR!: FormGroup;
  formT!: FormGroup;

  hoveredRating: number = 0;
  isUpdatingRating: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private timelineService: TimelineService,
    private reviewService: ReviewService,
    private bookService: BookService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.bookService.getBook(+id).subscribe(data => {
        this.book = data;
        this.newTimelinePage = this.book?.progress || 1;
        this.loadTimelinesAndReviews();
        this.initAnnotationForm();
        this.initTimelineForm();
      });
    }
  }

  initAnnotationForm(): void {
    this.formR = new FormGroup({
      page: new FormControl(this.book ? Math.max(1, this.book.progress || 1) : 1, [
        Validators.required,
        Validators.min(1),
        Validators.max(this.book?.pages || 9999)
      ]),
      type: new FormControl('note', Validators.required),
      content: new FormControl('', Validators.required)
    });
  }

  initTimelineForm(): void {
    this.formT = new FormGroup({
      currentpage: new FormControl(
        this.getMinAllowedPage(), 
        [
          Validators.required,
          Validators.min(1),
          Validators.max(this.book?.pages || 9999),
          (control) => this.pageValidator(control)
        ]
      ),
      date: new FormControl(new Date()),
      bookId: new FormControl(this.book?.idBook || 0)
    });
  }

  loadTimelinesAndReviews(): void {
    if (!this.book) return;

    this.loading = true;
    this.timelineService.getTimelinesByBookId(this.book.idBook).subscribe({
      next: (timelines) => {
        this.timelines = timelines.sort((a, b) => a.currentpage - b.currentpage);
        this.updateBookProgress();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Unable to load progress data';
        this.loading = false;
      }
    });

    this.reviewService.getReviewsByBookId(this.book.idBook).subscribe({
      next: (reviews) => {
        this.annotations = [...reviews];
      },
      error: (error) => {
        console.error('Error loading reviews:', error);
      }
    });
  }

  updateBookProgress(): void {
    if (!this.book || this.timelines.length === 0) return;

    const latestTimeline = this.timelines[this.timelines.length - 1];
    const currentPage = Math.min(latestTimeline.currentpage, this.book.pages);
    const progress = (currentPage / this.book.pages) * 100;

    this.bookService.updateBookProgress(this.book, progress).subscribe({
      next: (updatedBook) => {
        this.book = updatedBook;
      },
      error: (err) => {
        console.error('Error updating book progress:', err);
      }
    });
  }

  confirmCurrentPage(): void {
    if (!this.book) return;

    const lastPage = this.getLastTimelinePage();
    const minPage = this.getMinAllowedPage();

    if (this.newTimelinePage <= lastPage) {
      this.error = `La page doit être supérieure à ${lastPage} (dernière page enregistrée)`;
      return;
    }

    if (this.newTimelinePage > this.book.pages) {
      this.error = `La page ne peut pas dépasser ${this.book.pages} (nombre total de pages)`;
      return;
    }

    if (this.newTimelinePage < minPage) {
      this.error = `La page doit être au minimum ${minPage}`;
      return;
    }

    this.addTimeline(this.newTimelinePage);
  }

  addTimeline(page: number): void {
    if (!this.book || page <= 0 || page > this.book.pages) {
      this.error = 'Invalid page number.';
      return;
    }

    const newTimeline: Timeline = {
      currentpage: page,
      date: new Date(),
      bookId: this.book.idBook
    } as Timeline;

    this.timelineService.addTimeline(newTimeline).subscribe({
      next: timeline => {
        this.timelines.push(timeline);
        this.timelines.sort((a, b) => a.currentpage - b.currentpage);
        this.updateBookProgress();
        this.newTimelinePage = Math.min(page + 1, this.book?.pages || page);
        this.error = null;
      },
      error: error => {
        this.error = 'Unable to add progress';
      }
    });
  }

  toggleAddTimelineForm(): void {
    this.showAddTimelineForm = !this.showAddTimelineForm;
    if (this.showAddTimelineForm && this.book) {
      const minPage = this.getMinAllowedPage();
      
      this.formT.get('currentpage')?.setValidators([
        Validators.required,
        Validators.min(minPage),
        Validators.max(this.book.pages),
        (control) => this.pageValidator(control)
      ]);
      
      this.formT.patchValue({
        currentpage: minPage,
        date: new Date(),
        bookId: this.book.idBook
      });
      
      this.formT.get('currentpage')?.updateValueAndValidity();
    }
  }

  submitTimeline(): void {
    if (!this.book) {
      this.error = 'No book selected.';
      return;
    }

    if (this.formT.invalid) {
      const currentPageControl = this.formT.get('currentpage');
      if (currentPageControl?.errors) {
        if (currentPageControl.errors['notProgressive']) {
          this.error = `La page doit être supérieure à ${this.getLastTimelinePage()} (dernière page enregistrée)`;
        } else if (currentPageControl.errors['min']) {
          this.error = `La page doit être au minimum ${this.getMinAllowedPage()}`;
        } else if (currentPageControl.errors['max']) {
          this.error = `La page ne peut pas dépasser ${this.book.pages}`;
        } else {
          this.error = 'Veuillez entrer un numéro de page valide.';
        }
      }
      return;
    }

    const timelineData = {
      ...this.formT.value,
      date: new Date(),
      bookId: this.book.idBook
    };

    const { idTime, ...timeline } = timelineData;

    this.timelineService.addTimeline(timeline as Timeline).subscribe({
      next: (createdTimeline) => {
        this.timelines.push(createdTimeline);
        this.timelines.sort((a, b) => a.currentpage - b.currentpage);
        this.updateBookProgress();
        this.showAddTimelineForm = false;
        this.error = null;

        const isoDate = new Date(createdTimeline.date).toISOString().split('T')[0];

        if (this.timelines.length === 1 && this.book) {
          this.bookService.updateBookStart(this.book, isoDate).subscribe({
            next: (updatedBook) => {
              this.book = updatedBook;
            },
            error: (err) => {
              console.error('Error updating book start date:', err);
            }
          });
        }

        if (this.book && createdTimeline.currentpage === this.book.pages) {
          this.bookService.updateBookEnd(this.book, isoDate).subscribe({
            next: (updatedBook) => {
              this.book = updatedBook;
            },
            error: (err) => {
              console.error('Error updating book end date:', err);
            }
          });
        }

        const newMinPage = this.getMinAllowedPage();
        this.formT.reset({
          currentpage: newMinPage,
          date: new Date(),
          bookId: this.book?.idBook
        });
      },
      error: (err) => {
        this.error = 'Unable to save timeline.';
      }
    });
  }

  deleteMilestone(id: number): void {
    this.timelineService.deleteTimeline(id).subscribe({
      next: () => {
        this.timelines = this.timelines.filter(t => t.idTime !== id);
        this.updateBookProgress();
      },
      error: (error) => {
        this.error = 'Unable to delete timeline';
      }
    });
  }

  toggleAddAnnotationForm(): void {
    this.showAddAnnotationForm = !this.showAddAnnotationForm;
    if (this.showAddAnnotationForm && this.book) {
      this.formR.patchValue({
        page: Math.max(1, this.book.progress || 1),
        type: 'note',
        content: ''
      });
    }
  }

  addAnnotation(): void {
    if (!this.book) {
      this.error = 'No book selected.';
      return;
    }

    if (this.formR.invalid) {
      this.error = 'Please fill out the form correctly.';
      return;
    }

    const { page, type, content } = this.formR.value;

    const allowedTypes = ['note', 'highlight', 'bookmark'];
    if (!allowedTypes.includes(type)) {
      this.error = 'Invalid annotation type.';
      return;
    }

    const newReview: Review = {
      ...this.formR.value,
      comment: content.trim(),
      type: type,
      rating: this.getRatingFromAnnotationType(type),
      created: new Date(),
      bookId: this.book.idBook,
      page: page
    };

    this.reviewService.addReview(newReview).subscribe({
      next: review => {
        this.annotations.push(review);
        this.resetAnnotationForm();
        this.error = '';
      },
      error: err => {
        this.error = 'An error occurred while adding the annotation.';
      }
    });
  }

  resetAnnotationForm(): void {
    this.formR.reset({
      page: this.book ? Math.max(1, this.book.progress || 1) : 1,
      type: 'note',
      content: ''
    });
    this.showAddAnnotationForm = false;
  }

  deleteAnnotation(annotationId: number): void {
    this.reviewService.deleteReview(annotationId).subscribe({
      next: () => {
        this.annotations = this.annotations.filter(a => a.idReview !== annotationId);
      },
      error: error => {
        this.error = 'Unable to delete annotation';
      }
    });
  }

  getRatingFromAnnotationType(type: string): number {
    switch (type) {
      case 'highlight': return 5;
      case 'bookmark': return 3;
      default: return 2;
    }
  }

  getProgressColor(progress: number): string {
    if (progress < 25) return '#e53e3e';
    if (progress < 50) return '#dd6b20';
    if (progress < 75) return '#d69e2e';
    return '#38a169';
  }

  getReadingStreak(): number {
    if (this.timelines.length === 0) return 0;

    const uniqueDays = Array.from(
      new Set(this.timelines.map(t => new Date(t.date).toISOString().split('T')[0]))
    ).sort().reverse(); 

    let streak = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      const current = new Date(uniqueDays[i - 1]);
      const previous = new Date(uniqueDays[i]);
      const diff = (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24);
      if (diff <= 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  getPagesPerDay(): number {
    if (this.timelines.length === 0) return 0;

    const uniqueDays = Array.from(
      new Set(this.timelines.map(t => new Date(t.date).toISOString().split('T')[0]))
    );

    const lastPage = this.getLastTimelinePage();
    const daysCount = uniqueDays.length;

    return daysCount === 0 ? lastPage : Math.round((lastPage / daysCount) * 10) / 10;
  }

  getReadingDays(): number {
    const uniqueDays = new Set(
      this.timelines.map(t => new Date(t.date).toISOString().split('T')[0])
    );
    return uniqueDays.size;
  }

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(dateObj);
  }

  getAnnotationIcon(type: string): string {
    switch (type) {
      case 'highlight': return '✨';
      case 'bookmark': return '🔖';
      default: return '📝';
    }
  }

  getBookPages(): number {
    return this.book?.pages || 0;
  }

  capitalizeFirstLetter(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  getLastTimelinePage(): number {
    if (this.timelines.length === 0) return 0;
    const sortedTimelines = [...this.timelines].sort((a, b) => a.currentpage - b.currentpage);
    return sortedTimelines[sortedTimelines.length - 1].currentpage;
  }

  getMinAllowedPage(): number {
    const lastPage = this.getLastTimelinePage();
    return Math.max(1, lastPage + 1);
  }

  pageValidator(control: any) {
    const value = control.value;
    const lastPage = this.getLastTimelinePage();
    const maxPages = this.getBookPages();
    
    if (!value) return { required: true };
    if (value < 1) return { min: true };
    if (value > maxPages) return { max: true };
    if (value <= lastPage) return { notProgressive: true };
    
    return null;
  }

  getProgressDegrees(): number {
    if (!this.book || !this.book.progress) return 0;
    return (this.book.progress / 100) * 360;
  }

  getStarColor(starIndex: number): string {
    const currentRating = this.book?.rating || 0;
    const displayRating = this.hoveredRating || currentRating;
    
    if (starIndex <= displayRating) {
      switch (displayRating) {
        case 1: return '#e53e3e';
        case 2: return '#ff6b35';
        case 3: return '#ffd23f';
        case 4: return '#68d391';
        case 5: return '#38a169';
        default: return '#e2e8f0';
      }
    } else {
      return '#e2e8f0';
    }
  }

  onStarHover(rating: number): void {
    this.hoveredRating = rating;
  }

  onStarsLeave(): void {
    this.hoveredRating = 0;
  }

  onStarClick(rating: number): void {
    if (!this.book || this.isUpdatingRating) return;
    
    this.isUpdatingRating = true;
    
    this.bookService.updateBookRating(this.book, rating).subscribe({
      next: (updatedBook) => {
        this.book = updatedBook;
        this.isUpdatingRating = false;
      },
      error: (error) => {
        this.isUpdatingRating = false;
        this.error = 'Unable to update rating';
        console.error('Error updating rating:', error);
      }
    });
  }
}