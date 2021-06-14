export interface Note {
  id: string
  body: string
  date: Date
}

export interface NoteStorage {
  notes: Note[]
}
