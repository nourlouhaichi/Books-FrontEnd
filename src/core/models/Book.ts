export class Book {
    idBook!: number
    title!: string
    summary!: string
    cover!: string
    author!: string
    status!: boolean
    liked!: boolean
    progress!: number
    pages!: number
    start!: Date
    end!: Date
    categories?: { idCategory: number; name: string }[];
}