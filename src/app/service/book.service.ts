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

  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post(`${this.urlBook}/upload-image`, formData);
  }

  addBookWithImage(book: Book, categories: string[], imageFile?: File): Observable<Book> {
    const formData = new FormData();
    formData.append('book', JSON.stringify(book));
    categories.forEach(cat => formData.append('categories', cat));
    if (imageFile) {
      formData.append('coverImage', imageFile);
    }
    
    return this.http.post<Book>(`${this.urlBook}/addBookWithImage`, formData);
  }

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

  addToLibrary(bookId: number): Observable<Book> {
    return this.http.put<Book>(`${this.urlBook}/addToLibrary/${bookId}`, {});
  }

  addToFavorites(bookId: number): Observable<Book> {
    return this.http.put<Book>(`${this.urlBook}/addToFavorites/${bookId}`, {});
  }

  updateBookStart(book: Book, start: string): Observable<Book> {
  const params = new HttpParams().set('start', start); 
  return this.http.put<Book>(`${this.urlBook}/updateBookStart`, book, { params });
}

  updateBookEnd(book: Book, end: string): Observable<Book> {
    const params = new HttpParams().set('end', end);
    return this.http.put<Book>(`${this.urlBook}/updateBookEnd`, book, { params });
  }

  updateBookProgress(book: Book, progress: number): Observable<Book> {
    const params = new HttpParams().set('progress', progress.toString());
    return this.http.put<Book>(`${this.urlBook}/updateBookProgress`, book, { params });
  }

  updateBookRating(book: Book, rating: number): Observable<Book> {
    const params = new HttpParams().set('rating', rating.toString());
    return this.http.put<Book>(`${this.urlBook}/updateBookRating`, book, { params });
  }

}