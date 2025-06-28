export class Book {
    idBook!: number
    title!: string
    summary!: string
    cover!: string
    author!: string
    series!: string
    status!: boolean
    liked!: boolean
    progress!: number
    pages!: number
    rating!: number
    start!: Date
    end!: Date
    publicationInfo!: Date
    categories?: { idCategory: number; name: string; description: string }[];
}