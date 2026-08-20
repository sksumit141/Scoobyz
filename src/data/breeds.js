export const BREED_SIZE_MAP = {
  Small: [
    'Pomeranian',
    'Shih Tzu',
    'Lhasa Apso',
    'Chihuahua',
    'Yorkshire Terrier',
    'Maltese',
    'Toy Poodle',
    'Pug',
    'Dachshund',
    'French Bulldog',
    'Cocker Spaniel',
    'Beagle'
  ],
  Medium: [
    'Cocker Spaniel',
    'Beagle',
    'Corgi',
    'Indian Spitz',
    'French Bulldog',
    'Border Collie',
    'English Bulldog',
    'Miniature Schnauzer',
    'Standard Poodle',
    'Indian Pariah (smaller/medium)'
  ],
  Large: [
    'Golden Retriever',
    'Labrador Retriever',
    'German Shepherd',
    'Rottweiler',
    'Doberman',
    'Great Dane',
    'Saint Bernard',
    'Siberian Husky',
    'Alaskan Malamute',
    'Boxer',
    'Mastiff',
    'Cane Corso',
    'Bernese Mountain Dog',
    'Akita',
    'Newfoundland'
  ]
};

export const ALL_BREEDS = Object.entries(BREED_SIZE_MAP).flatMap(([size, breeds]) => 
  breeds.map(name => ({ name, size }))
);
