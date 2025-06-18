import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Review } from 'src/core/models/Review';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {

  urlReview = 'http://localhost:8090/review-service/review';

  constructor(private http: HttpClient) {}

  addReview(review: Review): Observable<Review> {
    return this.http.post<Review>(`${this.urlReview}/addReview`, review);
  }

  updateReview(review: Review): Observable<Review> {
    return this.http.put<Review>(`${this.urlReview}/updateReview/${review.idReview}`, review);
  }

  getAllReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.urlReview}/retreiveAllReviews`);
  }

  getReview(id: number): Observable<Review> {
    return this.http.get<Review>(`${this.urlReview}/retreiveReview/${id}`);
  }

  deleteReview(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlReview}/deleteReview/${id}`);
  }

  getReviewsByBookId(bookId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.urlReview}/retrieveByBook/${bookId}`);
  }
}
