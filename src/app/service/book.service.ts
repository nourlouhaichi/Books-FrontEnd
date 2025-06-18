import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Book } from 'src/core/models/Book';

@Injectable({
  providedIn: 'root'
})
export class BookService {
  urlBook = 'http://localhost:8089/book-service/book';

  constructor(private http: HttpClient) {}

  addBook(book: Book, categories: string[]): Observable<Book> {
    let params = new HttpParams();
    categories.forEach(cat => params = params.append('categories', cat));
    return this.http.post<Book>(`${this.urlBook}/addBook`, book, { params });
  }

  updateBook(book: Book, categories: string[]): Observable<Book> {
    let params = new HttpParams();
    categories.forEach(cat => params = params.append('categories', cat));
    return this.http.put<Book>(`${this.urlBook}/updateBook`, book, { params });
  }

  getAllBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.urlBook}/retreiveAllBooks`);
  }

  getBook(id: number): Observable<Book> {
    return this.http.get<Book>(`${this.urlBook}/retreiveBook/${id}`);
  }

  deleteBook(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlBook}/deleteBook/${id}`);
  }

  getReviewsForBook(bookId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.urlBook}/reviews/${bookId}`);
  }
}
