function makeBookmarksArray() {
  return [
    {
      id: 1,
      title: 'Example 1',
      url: 'www.example.com',
      description: 'Lorem Ipsum',
      rating: 1
    },
    {
      id: 2,
      title: 'Example 2',
      url: 'www.example.com',
      description: 'Lorem Ipsum',
      rating: 2
    },
    {
      id: 3,
      title: 'Example 3',
      url: 'www.example.com',
      description: 'Lorem Ipsum',
      rating: 3
    }
  ];
}

function makeMaliciousBookmark() {
  const maliciousBookmark = {
    id: 911,
    title: 'Naughty naughty very naughty <script>alert("xss");</script>',
    url: 'https://www.hackers.com',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    rating: 1,
  }
  const expectedBookmark = {
    ...maliciousBookmark,
    title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
  }
  return {
    maliciousBookmark,
    expectedBookmark,
  }
}

module.exports = {
  makeBookmarksArray,
  makeMaliciousBookmark,
}