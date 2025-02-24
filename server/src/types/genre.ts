import { Language } from '@/db/schema/users';

export class Genre {
  private static genreMap = new Map<string, string>([
    ['Comedy', 'Vígjáték'],
    ['Drama', 'Dráma'],
    ['Biography', 'Életrajz'],
    ['Action', 'Akció'],
    ['Romantic', 'Romantikus'],
    ['Documentary', 'Dokumentumfilm'],
    ['Adventure', 'Kaland'],
    ['Animation', 'Animáció'],
    ['Thriller', 'Thriller'],
    ['Family', 'Családi'],
    ['Crime', 'Bűnügyi'],
    ['Short Film', 'Rövidfilm'],
    ['Musical', 'Musical'],
    ['Sci-fi', 'Sci-fi'],
    ['Mystery', 'Misztikus'],
    ['War', 'Háborús'],
    ['Western', 'Western'],
    ['Horror', 'Horror'],
    ['Historical', 'Történelmi'],
    ['Sport', 'Sport'],
    ['Music', 'Zene'],
    ['Educational', 'Ismeretterjesztő'],
    ['Reality Show', 'Valóságshow'],
    ['Fantasy', 'Fantasy'],
  ]);

  static convertToHungarian(englishGenre: string): string | undefined {
    return this.genreMap.get(englishGenre);
  }

  static getGenres(language: Language): string[] {
    if (language === Language.EN) {
      return Array.from(this.genreMap.keys());
    } else {
      return Array.from(this.genreMap.values());
    }
  }
}
