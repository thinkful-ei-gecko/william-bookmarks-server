const uuid = require('uuid/v4');

const bookmarks = [
  {id: uuid(), name: 'Google', url: 'https://www.google.com', rating: 5, description: 'Lorem ipsum'},
  {id: uuid(), name: 'Yahoo', url: 'https://www.yahoo.com', rating: 3, description: 'Lorem ipsum'},
  {id: uuid(), name: 'Bing', url: 'https://www.bing.com', rating: 1, description: 'Lorem ipsum'}
];

module.exports = bookmarks;