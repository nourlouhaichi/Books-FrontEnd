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
  reviews: Review[] = [];
  annotations: Review[] = [];
  loading = false;
  error: string | null = null;
  bookId: number | null = null;

  showAddAnnotationForm = false;
  showAddTimelineForm = false;

  editingTimeline: Timeline | null = null;
  newTimelinePage: number = 1;

  formR!: FormGroup;
  formT!: FormGroup;

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
      currentpage: new FormControl(this.book ? Math.max(1, this.book.progress || 1) : 1, [
        Validators.required,
        Validators.min(1),
        Validators.max(this.book?.pages || 9999)
      ]),
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
        console.error('Error loading timelines:', error);
        this.error = 'Unable to load progress data';
        this.loading = false;
      }
    });

    this.reviewService.getReviewsByBookId(this.book.idBook).subscribe({
      next: (reviews) => {
        this.reviews = reviews;
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
    const newProgress = Math.min(latestTimeline.currentpage, this.book.pages);
    this.book.progress = newProgress;
  }

  confirmCurrentPage(): void {
    if (!this.book) return;

    if (this.newTimelinePage > 0 && this.newTimelinePage <= this.book.pages) {
      this.addTimeline(this.newTimelinePage);
    } else {
      this.error = 'Please enter a valid page number between 1 and ' + this.book.pages;
    }
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
    } as Timeline; // Don't include idTime as it's auto-generated

    this.timelineService.addTimeline(newTimeline).subscribe({
      next: timeline => {
        this.timelines.push(timeline);
        this.timelines.sort((a, b) => a.currentpage - b.currentpage);
        this.updateBookProgress();
        this.newTimelinePage = Math.min(page + 1, this.book?.pages || page);
        this.error = null;
      },
      error: error => {
        console.error('Error adding timeline:', error);
        this.error = 'Unable to add progress';
      }
    });
  }

  toggleAddTimelineForm(): void {
    this.showAddTimelineForm = !this.showAddTimelineForm;
    if (this.showAddTimelineForm && this.book) {
      // Update form values when showing the form
      this.formT.patchValue({
        currentpage: Math.max(1, this.book.progress || 1),
        date: new Date(),
        bookId: this.book.idBook
      });
    }
  }

  submitTimeline(): void {
    if (!this.book) {
      this.error = 'No book selected.';
      return;
    }

    if (this.formT.invalid) {
      this.error = 'Please enter a valid page number.';
      return;
    }

    // Use this.formT.value as requested, but ensure we have the right data
    const timelineData = {
      ...this.formT.value,
      date: new Date(), // Ensure we have current date
      bookId: this.book.idBook // Ensure we have correct bookId
    };

    // Don't include idTime as it's auto-generated
    const { idTime, ...timeline } = timelineData;

    this.timelineService.addTimeline(timeline as Timeline).subscribe({
      next: (createdTimeline) => {
        this.timelines.push(createdTimeline);
        this.timelines.sort((a, b) => a.currentpage - b.currentpage);
        this.updateBookProgress();
        this.showAddTimelineForm = false;
        this.error = null;
        
        // Reset form with new default values
        this.formT.reset({
          currentpage: Math.max(1, this.book?.progress || 1),
          date: new Date(),
          bookId: this.book?.idBook
        });
      },
      error: (err) => {
        console.error('Error saving timeline:', err);
        this.error = 'Unable to save timeline.';
      }
    });
  }

  editMilestone(timelineId: number): void {
    const timeline = this.timelines.find(t => t.idTime === timelineId);
    if (timeline) {
      this.editingTimeline = { ...timeline };
      this.newTimelinePage = timeline.currentpage;
    }
  }

  saveEditedMilestone(): void {
    if (this.editingTimeline && this.book) {
      if (this.newTimelinePage < 1 || this.newTimelinePage > this.book.pages) {
        this.error = 'Please enter a valid page number between 1 and ' + this.book.pages;
        return;
      }

      this.editingTimeline.currentpage = this.newTimelinePage;
      this.editingTimeline.date = new Date();

      this.timelineService.updateTimeline(this.editingTimeline).subscribe({
        next: updatedTimeline => {
          const index = this.timelines.findIndex(t => t.idTime === updatedTimeline.idTime);
          if (index !== -1) {
            this.timelines[index] = updatedTimeline;
            this.timelines.sort((a, b) => a.currentpage - b.currentpage);
            this.updateBookProgress();
          }
          this.editingTimeline = null;
          this.error = null;
        },
        error: error => {
          console.error('Error updating timeline:', error);
          this.error = 'Unable to update progress';
        }
      });
    }
  }

  cancelEdit(): void {
    this.editingTimeline = null;
    this.error = null;
  }

  deleteMilestone(id: number): void {
    this.timelineService.deleteTimeline(id).subscribe({
      next: () => {
        this.timelines = this.timelines.filter(t => t.idTime !== id);
        this.updateBookProgress();
        console.log('Timeline deleted successfully');
      },
      error: (error) => {
        console.error('Error deleting timeline:', error);
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
        console.error('Error adding annotation:', err);
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
        this.reviews = this.reviews.filter(r => r.idReview !== annotationId);
      },
      error: error => {
        console.error('Error deleting annotation:', error);
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
    if (this.timelines.length < 2) return this.timelines.length;

    let streak = 1;
    const sortedTimelines = [...this.timelines].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    for (let i = 1; i < sortedTimelines.length; i++) {
      const currentDate = new Date(sortedTimelines[i - 1].date);
      const previousDate = new Date(sortedTimelines[i].date);
      const diffTime = Math.abs(currentDate.getTime() - previousDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  getPagesPerDay(): number {
    if (this.timelines.length === 0) return 0;

    const firstTimeline = this.timelines[0];
    const lastTimeline = this.timelines[this.timelines.length - 1];

    const startDate = new Date(firstTimeline.date);
    const endDate = new Date(lastTimeline.date);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) return lastTimeline.currentpage;

    return Math.round((lastTimeline.currentpage / daysDiff) * 10) / 10;
  }

  getReadingDays(): number {
    return this.timelines.length;
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

  getBookTitle(): string {
    return this.book?.title || 'Title not available';
  }

  getBookAuthor(): string {
    return this.book?.author || 'Unknown author';
  }

  getBookProgress(): number {
    return this.book?.progress || 0;
  }

  getBookPages(): number {
    return this.book?.pages || 0;
  }

  getBookStartDate(): Date | null {
    return this.book?.start || null;
  }

  getBookProgressPercentage(): number {
    if (!this.book || !this.book.pages) return 0;
    return (this.book.progress / this.book.pages) * 100;
  }

  capitalizeFirstLetter(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }
}