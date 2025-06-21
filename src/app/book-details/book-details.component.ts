import { Component, OnInit } from '@angular/core';
import { BookService } from 'src/app/service/book.service';
import { ActivatedRoute } from '@angular/router';
import { Book } from 'src/core/models/Book';

@Component({
  selector: 'app-book-details',
  templateUrl: './book-details.component.html',
  styleUrls: ['./book-details.component.css']
})
export class BookDetailsComponent implements OnInit {
  book!: Book;
  showFullSummary = false;

  constructor(
    private bookService: BookService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.bookService.getBook(+id).subscribe(data => {
        this.book = data;
      });
    }
  }

  toggleLibraryStatus(): void {
  this.bookService.addToLibrary(this.book.idBook).subscribe(updatedBook => {
    this.book = updatedBook; 
    });
  }
}
