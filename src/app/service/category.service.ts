import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from 'src/core/models/Category';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  urlCategory = 'http://localhost:8089/book-service/category';

  constructor(private http: HttpClient) {}

  addCategory(category: Category): Observable<Category> {
    return this.http.post<Category>(`${this.urlCategory}/addCategory`, category);
  }

  updateCategory(category: Category): Observable<Category> {
    return this.http.put<Category>(`${this.urlCategory}/updateCategory`, category);
  }

  getAllCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.urlCategory}/retreiveAllCategories`);
  }

  getCategory(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.urlCategory}/retreiveCategory/${id}`);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlCategory}/deleteCategory/${id}`);
  }
}
