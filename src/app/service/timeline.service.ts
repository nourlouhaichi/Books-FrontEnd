import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Timeline } from 'src/core/models/Timeline';

@Injectable({
  providedIn: 'root'
})
export class TimelineService {

  urlTimeline = 'http://localhost:8090/review-service/timeline';
  
    constructor(private http: HttpClient) {}
  
    addTimeline(timeline: Timeline): Observable<Timeline> {
      return this.http.post<Timeline>(`${this.urlTimeline}/addTimeline`, timeline);
    }
  
    updateTimeline(timeline: Timeline): Observable<Timeline> {
      return this.http.put<Timeline>(`${this.urlTimeline}/updateTimeline/${timeline.idTime}`, timeline);
    }
  
    getAllTimelines(): Observable<Timeline[]> {
      return this.http.get<Timeline[]>(`${this.urlTimeline}/retreiveAllTimelines`);
    }
  
    getTimeline(id: number): Observable<Timeline> {
      return this.http.get<Timeline>(`${this.urlTimeline}/retreiveTimeline/${id}`);
    }
  
    deleteTimeline(id: number): Observable<void> {
      return this.http.delete<void>(`${this.urlTimeline}/deleteTimeline/${id}`);
    }
  
    getTimelinesByBookId(bookId: number): Observable<Timeline[]> {
      return this.http.get<Timeline[]>(`${this.urlTimeline}/retrieveByBook/${bookId}`);
    }
}
